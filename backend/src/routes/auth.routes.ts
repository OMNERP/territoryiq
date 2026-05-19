// ──────────────────────────────────────────────────────
//  routes/auth.routes.ts
// ──────────────────────────────────────────────────────
import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { login, refresh, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validateRequest,
  login
);

router.post('/refresh',
  body('refreshToken').notEmpty(),
  validateRequest,
  refresh
);

router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
