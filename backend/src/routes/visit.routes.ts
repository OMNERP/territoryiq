import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize, territoryScope } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  checkIn, checkOut, listVisits, getVisit, todayVisits, logGps
} from '../controllers/visit.controller';

const router = Router();
router.use(authenticate, territoryScope);

router.post('/checkin',
  body('visitType').isIn(['doctor', 'customer']),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  validateRequest,
  checkIn
);

router.put('/:id/checkout',
  param('id').isUUID(),
  validateRequest,
  checkOut
);

router.get('/', listVisits);
router.get('/today/:mrId', todayVisits);
router.get('/:id', param('id').isUUID(), validateRequest, getVisit);
router.post('/gps', body('latitude').isFloat(), body('longitude').isFloat(), validateRequest, logGps);

export default router;
