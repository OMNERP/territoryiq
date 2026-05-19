import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AppError } from '../utils/AppError';

export interface JwtPayload {
  userId: string;
  role: string;
  mrId?: string;
  territoryId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ── Authenticate JWT ─────────────────────────────────────────────────────────
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('Server misconfiguration', 500);

    const payload = jwt.verify(token, secret) as JwtPayload;

    // Verify user still active
    const { rows } = await query(
      'SELECT id, is_active FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!rows[0] || !rows[0].is_active) {
      throw new AppError('Account not found or deactivated', 401);
    }

    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(err);
    }
  }
}

// ── Authorize Roles ──────────────────────────────────────────────────────────
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

// ── Territory-scoped access (MRs see only their territory) ───────────────────
export function territoryScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  // Admins and managers see everything
  const globalRoles = ['admin', 'sales_manager', 'regional_manager', 'marketing_manager'];
  if (globalRoles.includes(req.user.role)) return next();

  // MRs: inject their territory/mr filter
  if (req.user.mrId) {
    req.query._mrId = req.user.mrId;
    if (req.user.territoryId) {
      req.query._territoryId = req.user.territoryId;
    }
  }
  next();
}
