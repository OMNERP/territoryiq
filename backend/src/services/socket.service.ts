import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export function setupSocketHandlers(io: Server) {
  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId      = payload.userId;
      socket.data.role        = payload.role;
      socket.data.mrId        = payload.mrId;
      socket.data.territoryId = payload.territoryId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { role, mrId, territoryId } = socket.data;
    logger.info(`WS connect: ${socket.id} (${role})`);

    // Room assignments
    socket.join(`user:${socket.data.userId}`);

    if (['admin', 'sales_manager', 'regional_manager'].includes(role)) {
      socket.join('managers');
    }
    if (mrId)        socket.join(`mr:${mrId}`);
    if (territoryId) socket.join(`territory:${territoryId}`);

    // ── MR: GPS ping ─────────────────────────────────────────────────────
    socket.on('gps:update', async (data: { lat: number; lng: number; accuracy?: number }) => {
      if (!mrId) return;
      try {
        await query(
          `UPDATE medical_representatives
           SET last_known_lat=$1, last_known_lng=$2, last_gps_update=NOW()
           WHERE id=$3`,
          [data.lat, data.lng, mrId]
        );

        // Broadcast to managers
        io.to('managers').emit('mr:location:update', {
          mrId, lat: data.lat, lng: data.lng, ts: new Date().toISOString(),
        });
      } catch (err) {
        logger.error('WS gps:update error', err);
      }
    });

    // ── Subscribe to territory events ─────────────────────────────────────
    socket.on('subscribe:territory', (id: string) => {
      socket.join(`territory:${id}`);
    });

    // ── Acknowledge alert read ────────────────────────────────────────────
    socket.on('alert:read', async (alertId: string) => {
      try {
        await query(
          'UPDATE alerts SET is_read=true WHERE id=$1',
          [alertId]
        );
        socket.emit('alert:ack', { alertId });
      } catch {}
    });

    socket.on('disconnect', () => {
      logger.info(`WS disconnect: ${socket.id}`);
    });
  });
}

// Broadcast helpers (used by controllers)
export const broadcast = {
  visitCheckin: (io: Server, data: object) => io.emit('visit:checkin', data),
  mrLocation:   (io: Server, data: object) => io.to('managers').emit('mr:location', data),
  alert:        (io: Server, mrId: string | null, data: object) => {
    io.to('managers').emit('alert:new', data);
    if (mrId) io.to(`mr:${mrId}`).emit('alert:new', data);
  },
};
