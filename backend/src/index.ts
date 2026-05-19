import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server as SocketServer } from 'socket.io';

import { db } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { setupSocketHandlers } from './services/socket.service';
import { startCronJobs } from './services/cron.service';

// Routes
import authRoutes          from './routes/auth.routes';
import mrRoutes            from './routes/mr.routes';
import territoryRoutes     from './routes/territory.routes';
import doctorRoutes        from './routes/doctor.routes';
import customerRoutes      from './routes/customer.routes';
import visitRoutes         from './routes/visit.routes';
import reportRoutes        from './routes/report.routes';
import alertRoutes         from './routes/alert.routes';
import geoRoutes           from './routes/geo.routes';
import analyticsRoutes     from './routes/analytics.routes';
import productRoutes       from './routes/product.routes';
import darRoutes           from './routes/dar.routes';

const app = express();
const server = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Make io available to routes
app.set('io', io);

// ─── API Routes ──────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,       authRoutes);
app.use(`${API}/mrs`,        mrRoutes);
app.use(`${API}/territories`, territoryRoutes);
app.use(`${API}/doctors`,    doctorRoutes);
app.use(`${API}/customers`,  customerRoutes);
app.use(`${API}/visits`,     visitRoutes);
app.use(`${API}/reports`,    reportRoutes);
app.use(`${API}/alerts`,     alertRoutes);
app.use(`${API}/geo`,        geoRoutes);
app.use(`${API}/analytics`,  analyticsRoutes);
app.use(`${API}/products`,   productRoutes);
app.use(`${API}/dar`,        darRoutes);

// Health check
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'TerritoryIQ API',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Boot ────────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    // Test DB connection
    const client = await db.connect();
    logger.info('✅ PostgreSQL connected');
    client.release();

    // Test Redis
    await redis.ping();
    logger.info('✅ Redis connected');

    // Setup WebSocket handlers
    setupSocketHandlers(io);
    logger.info('✅ WebSocket handlers registered');

    // Start background jobs
    startCronJobs();
    logger.info('✅ Cron jobs started');

    const PORT = Number(process.env.PORT) || 4000;
    server.listen(PORT, () => {
      logger.info(`🚀 TerritoryIQ API running on port ${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();

export { io };
