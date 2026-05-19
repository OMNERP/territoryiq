// report.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/daily-activity', async (req, res, next) => {
  try {
    const { mrId, from, to } = req.query as any;
    const start = from || new Date(Date.now()-7*86400000).toISOString().split('T')[0];
    const end   = to   || new Date().toISOString().split('T')[0];
    const params: unknown[] = [start, end];
    let mrFilter = '';
    if (mrId) { mrFilter = `AND dar.mr_id=$3`; params.push(mrId); }
    const { rows } = await query(
      `SELECT dar.*, mr.full_name, t.name AS territory
       FROM daily_activity_reports dar
       JOIN medical_representatives mr ON mr.id=dar.mr_id
       LEFT JOIN territories t ON t.id=mr.territory_id
       WHERE dar.report_date BETWEEN $1 AND $2 ${mrFilter}
       ORDER BY dar.report_date DESC`,
      params
    );
    res.json({ reports: rows });
  } catch (err) { next(err); }
});

router.get('/visit-compliance', async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const start = from || new Date(Date.now()-30*86400000).toISOString().split('T')[0];
    const end   = to   || new Date().toISOString().split('T')[0];
    const { rows } = await query(
      `SELECT mr.full_name, mr.employee_id, t.name AS territory,
              COUNT(v.id)::int AS total_visits,
              COUNT(v.id) FILTER (WHERE v.geo_validation_status='valid')::int AS valid,
              ROUND(COUNT(v.id) FILTER (WHERE v.geo_validation_status='valid')::NUMERIC
                    / NULLIF(COUNT(v.id),0)*100,1) AS compliance_pct
       FROM medical_representatives mr
       LEFT JOIN territories t ON t.id=mr.territory_id
       LEFT JOIN visits v ON v.mr_id=mr.id AND DATE(v.checkin_time) BETWEEN $1 AND $2
       WHERE mr.status='active'
       GROUP BY mr.id, t.name ORDER BY compliance_pct DESC`,
      [start, end]
    );
    res.json({ compliance: rows });
  } catch (err) { next(err); }
});

export default router;
