// ── mr.routes.ts ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { authenticate, authorize, territoryScope } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate);

router.get('/', territoryScope, async (req, res, next) => {
  try {
    const { status, territoryId, _territoryId } = req.query as any;
    const conds: string[] = ['1=1'];
    const params: unknown[] = [];
    let p = 1;
    if (status)                    { conds.push(`mr.status = $${p++}`); params.push(status); }
    if (_territoryId || territoryId) { conds.push(`mr.territory_id = $${p++}`); params.push(_territoryId || territoryId); }

    const { rows } = await query(
      `SELECT mr.*, u.email, t.name AS territory_name,
              mgr.full_name AS manager_name
       FROM medical_representatives mr
       JOIN users u ON u.id = mr.user_id
       LEFT JOIN territories t ON t.id = mr.territory_id
       LEFT JOIN medical_representatives mgr ON mgr.id = mr.manager_id
       WHERE ${conds.join(' AND ')}
       ORDER BY mr.full_name`,
      params
    );
    res.json({ mrs: rows });
  } catch (err) { next(err); }
});

router.get('/live', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM vw_mr_activity_today ORDER BY live_status, full_name`);
    res.json({ mrs: rows });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT mr.*, u.email, t.name AS territory_name,
              (SELECT COUNT(*) FROM visits WHERE mr_id=mr.id AND DATE(checkin_time)=CURRENT_DATE) AS visits_today,
              (SELECT COUNT(*) FROM visits WHERE mr_id=mr.id AND DATE(checkin_time)>=DATE_TRUNC('month',NOW())) AS visits_month
       FROM medical_representatives mr
       JOIN users u ON u.id = mr.user_id
       LEFT JOIN territories t ON t.id = mr.territory_id
       WHERE mr.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('MR not found', 404);
    res.json({ mr: rows[0] });
  } catch (err) { next(err); }
});

router.post('/', authorize('admin', 'sales_manager'), async (req, res, next) => {
  try {
    const { userId, employeeId, fullName, territoryId, managerId, phone, dailyVisitTarget, monthlyTarget } = req.body;
    const { rows } = await query(
      `INSERT INTO medical_representatives
         (user_id, employee_id, full_name, territory_id, manager_id, phone, daily_visit_target, monthly_sales_target)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [userId, employeeId, fullName, territoryId||null, managerId||null, phone||null, dailyVisitTarget||10, monthlyTarget||0]
    );
    res.status(201).json({ mr: rows[0] });
  } catch (err) { next(err); }
});

router.patch('/:id', authorize('admin', 'sales_manager', 'regional_manager'), async (req, res, next) => {
  try {
    const allowed = ['full_name','territory_id','manager_id','phone','status','daily_visit_target','gps_tracking_enabled'];
    const sets: string[] = [];
    const vals: unknown[] = [];
    let p = 1;
    for (const [k, v] of Object.entries(req.body)) {
      const col = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { sets.push(`${col}=$${p++}`); vals.push(v); }
    }
    if (!sets.length) throw new AppError('No valid fields to update', 400);
    vals.push(req.params.id);
    const { rows } = await query(`UPDATE medical_representatives SET ${sets.join(',')} WHERE id=$${p} RETURNING *`, vals);
    res.json({ mr: rows[0] });
  } catch (err) { next(err); }
});

export default router;
