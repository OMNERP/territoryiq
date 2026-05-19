import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Postgres unique violation
  if ((err as any).code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry — record already exists' });
  }

  // Postgres foreign key violation
  if ((err as any).code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });

  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
