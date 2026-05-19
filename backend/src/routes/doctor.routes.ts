import { Router } from 'express';
import { authenticate, authorize, territoryScope } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { geoService } from '../services/geo/geo.service';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate, territoryScope);

router.get('/', async (req, res, next) => {
  try {
    const { search, specialty, priority, mrId, territoryId, _mrId, _territoryId, page='1', limit='20' } = req.query as any;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const conds: string[] = ['d.is_active = true'];
    const params: unknown[] = [];
    let p = 1;

    if (search)                      { conds.push(`d.name ILIKE $${p++}`); params.push(`%${search}%`); }
    if (specialty)                   { conds.push(`d.specialty = $${p++}`); params.push(specialty); }
    if (priority)                    { conds.push(`d.priority = $${p++}`); params.push(priority); }
    if (_mrId || mrId)               { conds.push(`d.assigned_mr_id = $${p++}`); params.push(_mrId || mrId); }
    if (_territoryId || territoryId) { conds.push(`d.territory_id = $${p++}`); params.push(_territoryId || territoryId); }

    const where = `WHERE ${conds.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) FROM doctors d ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(pageSize, offset);
    const { rows } = await query(
      `SELECT d.*, mr.full_name AS mr_name, t.name AS territory_name
       FROM doctors d
       LEFT JOIN medical_representatives mr ON mr.id = d.assigned_mr_id
       LEFT JOIN territories t ON t.id = d.territory_id
       ${where}
       ORDER BY d.priority DESC, d.potential_score DESC
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );

    res.json({ doctors: rows, pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total/pageSize) } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.*, mr.full_name AS mr_name,
              (SELECT json_agg(v ORDER BY v.checkin_time DESC) FROM (
                 SELECT id, checkin_time, checkout_time, duration_minutes, visit_outcome,
                        discussion_notes, products_discussed, samples_given
                 FROM visits WHERE doctor_id=d.id ORDER BY checkin_time DESC LIMIT 10
              ) v) AS recent_visits
       FROM doctors d
       LEFT JOIN medical_representatives mr ON mr.id = d.assigned_mr_id
       WHERE d.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Doctor not found', 404);
    res.json({ doctor: rows[0] });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, specialty, qualification, clinicHospital, address, phone, email,
            visitFrequencyDays, priority, potentialScore, assignedMrId, territoryId, notes } = req.body;

    // Auto geocode if address provided but no coords
    let { latitude, longitude } = req.body;
    if (!latitude && address) {
      const loc = await geoService.geocode(address);
      if (loc) { latitude = loc.lat; longitude = loc.lng; }
    }

    const { rows } = await query(
      `INSERT INTO doctors
         (name, specialty, qualification, clinic_hospital, address, latitude, longitude,
          phone, email, visit_frequency_days, priority, potential_score, assigned_mr_id, territory_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [name, specialty||null, qualification||null, clinicHospital||null, address||null,
       latitude||null, longitude||null, phone||null, email||null,
       visitFrequencyDays||30, priority||'medium', potentialScore||5,
       assignedMrId||null, territoryId||null, notes||null]
    );
    res.status(201).json({ doctor: rows[0] });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name','specialty','qualification','clinic_hospital','address',
                     'phone','email','visit_frequency_days','priority','potential_score',
                     'assigned_mr_id','territory_id','notes','preferred_products','is_active'];
    const sets: string[] = [];
    const vals: unknown[] = [];
    let p = 1;
    for (const [k, v] of Object.entries(req.body)) {
      const col = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { sets.push(`${col}=$${p++}`); vals.push(v); }
    }
    if (!sets.length) throw new AppError('No valid fields', 400);
    vals.push(req.params.id);
    const { rows } = await query(`UPDATE doctors SET ${sets.join(',')} WHERE id=$${p} RETURNING *`, vals);
    res.json({ doctor: rows[0] });
  } catch (err) { next(err); }
});

export default router;
