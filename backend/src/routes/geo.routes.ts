import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { query as dbQuery } from '../config/database';
import { geoService } from '../services/geo/geo.service';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

// Geocode an address
router.get('/geocode', async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address) throw new AppError('Address required', 400);
    const result = await geoService.geocode(address as string);
    if (!result) throw new AppError('Address not found', 404);
    res.json({ location: result });
  } catch (err) { next(err); }
});

// Reverse geocode
router.get('/reverse', async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) throw new AppError('lat and lng required', 400);
    const address = await geoService.reverseGeocode(Number(lat), Number(lng));
    res.json({ address });
  } catch (err) { next(err); }
});

// Optimized route for an MR's daily plan
router.post('/optimize-route', async (req, res, next) => {
  try {
    const { start, stops } = req.body;
    if (!start || !stops?.length) throw new AppError('start and stops required', 400);

    const optimized = geoService.optimizeRoute(start, stops);
    const route = await geoService.getRoute([start, ...optimized]);
    res.json({ optimizedWaypoints: optimized, route });
  } catch (err) { next(err); }
});

// Nearby doctors/customers
router.get('/nearby/doctors', async (req, res, next) => {
  try {
    const { lat, lng, radius = '5' } = req.query;
    if (!lat || !lng) throw new AppError('lat and lng required', 400);
    const doctors = await geoService.findNearbyDoctors(
      { query: dbQuery } as any,
      Number(lat), Number(lng), Number(radius)
    );
    res.json({ doctors });
  } catch (err) { next(err); }
});

// Territory boundary
router.get('/territory/:id/boundary', async (req, res, next) => {
  try {
    const { rows } = await dbQuery(
      `SELECT id, name, ST_AsGeoJSON(boundary) AS geojson FROM territories WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Territory not found', 404);
    res.json({ territory: { ...rows[0], geojson: JSON.parse(rows[0].geojson || 'null') } });
  } catch (err) { next(err); }
});

// MR route replay (GPS track)
router.get('/mr/:mrId/route-replay', async (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const { rows } = await dbQuery(
      `SELECT latitude, longitude, accuracy, speed, recorded_at
       FROM gps_logs
       WHERE mr_id = $1 AND DATE(recorded_at) = $2
       ORDER BY recorded_at`,
      [req.params.mrId, date]
    );
    res.json({ track: rows, date });
  } catch (err) { next(err); }
});

export default router;
