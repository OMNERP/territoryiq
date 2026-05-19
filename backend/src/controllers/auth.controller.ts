import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

const ACCESS_TOKEN_TTL  = process.env.JWT_EXPIRES_IN  || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_TTL_SECONDS = 7 * 24 * 3600;

function signAccess(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_TTL as any,
  });
}
function signRefresh(payload: object) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_TTL as any,
  });
}

// ── POST /auth/login ──────────────────────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
              mr.id AS mr_id, mr.territory_id
       FROM users u
       LEFT JOIN medical_representatives mr ON mr.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const jwtPayload = {
      userId:      user.id,
      role:        user.role,
      mrId:        user.mr_id ?? undefined,
      territoryId: user.territory_id ?? undefined,
    };

    const accessToken  = signAccess(jwtPayload);
    const refreshToken = signRefresh({ userId: user.id });

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, tokenHash]
    );

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Cache user info for fast auth checks
    await cache.set(`user:${user.id}`, jwtPayload, 3600);

    logger.info(`User ${user.email} logged in`);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id:    user.id,
        email: user.email,
        role:  user.role,
        mrId:  user.mr_id,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/refresh ────────────────────────────────────────────────────────
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const { rows } = await query(
      `SELECT id FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2
         AND is_revoked = false AND expires_at > NOW()`,
      [tokenHash, payload.userId]
    );
    if (!rows[0]) throw new AppError('Refresh token revoked or expired', 401);

    const { rows: userRows } = await query(
      `SELECT u.id, u.role, mr.id AS mr_id, mr.territory_id
       FROM users u
       LEFT JOIN medical_representatives mr ON mr.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true`,
      [payload.userId]
    );
    if (!userRows[0]) throw new AppError('User not found', 401);

    const user = userRows[0];
    const newAccessToken = signAccess({
      userId:      user.id,
      role:        user.role,
      mrId:        user.mr_id,
      territoryId: user.territory_id,
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/logout ─────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1',
        [tokenHash]
      );
    }
    if (req.user) await cache.del(`user:${req.user.userId}`);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ── GET /auth/me ──────────────────────────────────────────────────────────────
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.last_login_at,
              mr.id AS mr_id, mr.full_name, mr.employee_id,
              mr.territory_id, t.name AS territory_name
       FROM users u
       LEFT JOIN medical_representatives mr ON mr.user_id = u.id
       LEFT JOIN territories t ON t.id = mr.territory_id
       WHERE u.id = $1`,
      [req.user!.userId]
    );
    if (!rows[0]) throw new AppError('User not found', 404);
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}
