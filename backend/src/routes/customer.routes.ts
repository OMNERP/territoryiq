// ── customer.routes.ts ────────────────────────────────────────────────────────
import { Router } from 'express';
import { authenticate, territoryScope } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { geoService } from '../services/geo/geo.service';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate, territoryScope);

router.get('/', async (req, res, next) => {
  try {
    const { search, type, mrId, territoryId, _mrId, _territoryId, page='1', limit='20' } = req.query as any;
    const conds = ['c.is_active = true'];
    const params: unknown[] = [];
    let p = 1;

    if (search)                      { conds.push(`c.name ILIKE $${p++}`); params.push(`%${search}%`); }
    if (type)                        { conds.push(`c.customer_type = $${p++}`); params.push(type); }
    if (_mrId || mrId)               { conds.push(`c.assigned_mr_id = $${p++}`); params.push(_mrId || mrId); }
    if (_territoryId || territoryId) { conds.push(`c.territory_id = $${p++}`); params.push(_territoryId || territoryId); }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const offset = (pageNum-1)*pageSize;
    const where = `WHERE ${conds.join(' AND ')}`;

    const countRes = await query(`SELECT COUNT(*) FROM customers c ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    params.push(pageSize, offset);

    const { rows } = await query(
      `SELECT c.*, mr.full_name AS mr_name, t.name AS territory_name
       FROM customers c
       LEFT JOIN medical_representatives mr ON mr.id = c.assigned_mr_id
       LEFT JOIN territories t ON t.id = c.territory_id
       ${where}
       ORDER BY c.name
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );
    res.json({ customers: rows, pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total/pageSize) } });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, customerType, address, contactPerson, phone, email,
            visitFrequencyDays, assignedMrId, territoryId, monthlyBusinessPotential, notes } = req.body;
    let { latitude, longitude } = req.body;
    if (!latitude && address) {
      const loc = await geoService.geocode(address);
      if (loc) { latitude = loc.lat; longitude = loc.lng; }
    }
    const { rows } = await query(
      `INSERT INTO customers
         (name, customer_type, address, latitude, longitude, contact_person, phone, email,
          visit_frequency_days, assigned_mr_id, territory_id, monthly_business_potential, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, customerType, address||null, latitude||null, longitude||null,
       contactPerson||null, phone||null, email||null,
       visitFrequencyDays||14, assignedMrId||null, territoryId||null,
       monthlyBusinessPotential||0, notes||null]
    );
    res.status(201).json({ customer: rows[0] });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM customers WHERE id=$1`, [req.params.id]);
    if (!rows[0]) throw new AppError('Customer not found', 404);
    res.json({ customer: rows[0] });
  } catch (err) { next(err); }
});

export default router;
