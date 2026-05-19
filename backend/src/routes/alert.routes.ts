// alert.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { query } from '../config/database';

const alertRouter = Router();
alertRouter.use(authenticate);

alertRouter.get('/', async (req, res, next) => {
  try {
    const { severity, type, isRead, mrId, page='1', limit='20' } = req.query as any;
    const conds: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    if (severity) { conds.push(`severity=$${p++}`); params.push(severity); }
    if (type)     { conds.push(`alert_type=$${p++}`); params.push(type); }
    if (isRead !== undefined) { conds.push(`is_read=$${p++}`); params.push(isRead==='true'); }
    if (mrId)     { conds.push(`mr_id=$${p++}`); params.push(mrId); }

    // MRs only see their own alerts
    if (req.user!.role === 'medical_representative' && req.user!.mrId) {
      conds.push(`mr_id=$${p++}`); params.push(req.user!.mrId);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const offset = (pageNum-1)*pageSize;
    const countRes = await query(`SELECT COUNT(*) FROM alerts ${where}`, params);
    params.push(pageSize, offset);
    const { rows } = await query(
      `SELECT a.*, mr.full_name AS mr_name
       FROM alerts a
       LEFT JOIN medical_representatives mr ON mr.id=a.mr_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );
    res.json({ alerts: rows, pagination: { page: pageNum, limit: pageSize, total: parseInt(countRes.rows[0].count) } });
  } catch (err) { next(err); }
});

alertRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await query('UPDATE alerts SET is_read=true WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

alertRouter.patch('/:id/resolve', authorize('admin','sales_manager','regional_manager'), async (req, res, next) => {
  try {
    await query('UPDATE alerts SET is_resolved=true, resolved_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export { alertRouter as default };

// ── report.routes.ts ──────────────────────────────────────────────────────────
import { Router as Router2 } from 'express';
const reportRouter = Router2();

import { authenticate as auth } from '../middleware/auth.middleware';
import { query as dbQuery } from '../config/database';

reportRouter.use(auth);

// Daily MR activity report
reportRouter.get('/daily-activity', async (req, res, next) => {
  try {
    const { mrId, from, to } = req.query as any;
    const start = from || new Date(Date.now()-7*86400000).toISOString().split('T')[0];
    const end   = to   || new Date().toISOString().split('T')[0];
    const params: unknown[] = [start, end];
    let p = 3;
    let mrFilter = '';
    if (mrId) { mrFilter = `AND dar.mr_id=$${p++}`; params.push(mrId); }

    const { rows } = await dbQuery(
      `SELECT dar.*, mr.full_name AS mr_name, mr.employee_id, t.name AS territory
       FROM daily_activity_reports dar
       JOIN medical_representatives mr ON mr.id=dar.mr_id
       LEFT JOIN territories t ON t.id=mr.territory_id
       WHERE dar.report_date BETWEEN $1 AND $2 ${mrFilter}
       ORDER BY dar.report_date DESC, mr.full_name`,
      params
    );
    res.json({ reports: rows });
  } catch (err) { next(err); }
});

// Visit compliance report
reportRouter.get('/visit-compliance', async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const start = from || new Date(Date.now()-30*86400000).toISOString().split('T')[0];
    const end   = to   || new Date().toISOString().split('T')[0];
    const { rows } = await dbQuery(
      `SELECT
         mr.full_name, mr.employee_id, t.name AS territory,
         COUNT(v.id)::int AS total_visits,
         COUNT(v.id) FILTER (WHERE v.geo_validation_status='valid')::int AS valid,
         COUNT(v.id) FILTER (WHERE v.geo_validation_status='invalid')::int AS invalid,
         ROUND(COUNT(v.id) FILTER (WHERE v.geo_validation_status='valid')::NUMERIC
               / NULLIF(COUNT(v.id),0)*100,1) AS compliance_pct
       FROM medical_representatives mr
       LEFT JOIN territories t ON t.id=mr.territory_id
       LEFT JOIN visits v ON v.mr_id=mr.id AND DATE(v.checkin_time) BETWEEN $1 AND $2
       WHERE mr.status='active'
       GROUP BY mr.id, t.name
       ORDER BY compliance_pct DESC`,
      [start, end]
    );
    res.json({ compliance: rows, dateRange: {from:start, to:end} });
  } catch (err) { next(err); }
});

export { reportRouter as default };
