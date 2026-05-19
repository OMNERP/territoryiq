// ── territory.routes.ts ───────────────────────────────────────────────────────
import { Router } from 'express';
import { authenticate, authorize, territoryScope } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { AppError } from '../utils/AppError';
import { cache } from '../config/redis';

export const territoryRouter = Router();
territoryRouter.use(authenticate);

territoryRouter.get('/', territoryScope, async (req, res, next) => {
  try {
    const cacheKey = 'territories:list';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);
    const { rows } = await query(`SELECT * FROM vw_territory_coverage ORDER BY name`);
    const result = { territories: rows };
    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) { next(err); }
});

territoryRouter.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT t.*,
              mr.full_name AS mr_name, mr.id AS mr_id,
              (SELECT COUNT(*) FROM doctors WHERE territory_id=t.id AND is_active=true) AS total_doctors,
              (SELECT COUNT(*) FROM customers WHERE territory_id=t.id AND is_active=true) AS total_customers
       FROM territories t
       LEFT JOIN medical_representatives mr ON mr.territory_id=t.id
       WHERE t.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Territory not found', 404);
    res.json({ territory: rows[0] });
  } catch (err) { next(err); }
});

territoryRouter.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { name, city, region, state, country } = req.body;
    const { rows } = await query(
      `INSERT INTO territories (name, city, region, state, country) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, city, region, state||null, country||'India']
    );
    await cache.del('territories:list');
    res.status(201).json({ territory: rows[0] });
  } catch (err) { next(err); }
});

export default territoryRouter;
