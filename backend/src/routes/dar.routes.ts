import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, territoryScope } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { query } from '../config/database';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authenticate, territoryScope);

// GET /dar — list daily reports
router.get('/', async (req, res, next) => {
  try {
    const { mrId, from, to, _mrId } = req.query as any;
    const start = from || new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];
    const end   = to   || new Date().toISOString().split('T')[0];
    const effectiveMrId = _mrId || mrId;

    const params: unknown[] = [start, end];
    let mrFilter = '';
    if (effectiveMrId) { mrFilter = `AND dar.mr_id = $3`; params.push(effectiveMrId); }

    const { rows } = await query(
      `SELECT dar.*, mr.full_name AS mr_name, mr.employee_id, t.name AS territory
       FROM daily_activity_reports dar
       JOIN medical_representatives mr ON mr.id = dar.mr_id
       LEFT JOIN territories t ON t.id = mr.territory_id
       WHERE dar.report_date BETWEEN $1 AND $2 ${mrFilter}
       ORDER BY dar.report_date DESC, mr.full_name`,
      params
    );
    res.json({ reports: rows });
  } catch (err) { next(err); }
});

// GET /dar/today — today's DAR for current MR
router.get('/today', async (req, res, next) => {
  try {
    const mrId = req.user!.mrId;
    if (!mrId) throw new AppError('MR only', 403);

    const { rows } = await query(
      `SELECT * FROM daily_activity_reports WHERE mr_id=$1 AND report_date=CURRENT_DATE`,
      [mrId]
    );

    if (!rows[0]) {
      // Create blank DAR for today
      const { rows: newRows } = await query(
        `INSERT INTO daily_activity_reports (mr_id, report_date)
         VALUES ($1, CURRENT_DATE)
         ON CONFLICT (mr_id, report_date) DO NOTHING
         RETURNING *`,
        [mrId]
      );
      return res.json({ report: newRows[0] || null });
    }
    res.json({ report: rows[0] });
  } catch (err) { next(err); }
});

// POST /dar — create/update DAR
router.post('/',
  body('reportDate').isDate(),
  validateRequest,
  async (req, res, next) => {
    try {
      const mrId = req.user!.mrId;
      if (!mrId) throw new AppError('MR only', 403);

      const {
        reportDate, doctorCalls, customerVisits, samplesDistributed,
        competitorActivities, marketFeedback, routeDistanceKm, gpsLogs,
      } = req.body;

      const { rows } = await query(
        `INSERT INTO daily_activity_reports
           (mr_id, report_date, doctor_calls, customer_visits, samples_distributed,
            competitor_activities, market_feedback, route_distance_km, gps_logs)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
         ON CONFLICT (mr_id, report_date) DO UPDATE SET
           doctor_calls          = EXCLUDED.doctor_calls,
           customer_visits       = EXCLUDED.customer_visits,
           samples_distributed   = EXCLUDED.samples_distributed,
           competitor_activities = EXCLUDED.competitor_activities,
           market_feedback       = EXCLUDED.market_feedback,
           route_distance_km     = EXCLUDED.route_distance_km,
           gps_logs              = EXCLUDED.gps_logs,
           updated_at            = NOW()
         RETURNING *`,
        [
          mrId, reportDate,
          doctorCalls || 0, customerVisits || 0, samplesDistributed || 0,
          competitorActivities || null, marketFeedback || null,
          routeDistanceKm || null,
          gpsLogs ? JSON.stringify(gpsLogs) : null,
        ]
      );
      res.json({ report: rows[0] });
    } catch (err) { next(err); }
  }
);

// PATCH /dar/:id/submit — submit DAR
router.patch('/:id/submit', async (req, res, next) => {
  try {
    const mrId = req.user!.mrId;
    const { rows } = await query(
      `UPDATE daily_activity_reports
       SET is_submitted=true, submitted_at=NOW()
       WHERE id=$1 AND mr_id=$2 AND is_submitted=false
       RETURNING *`,
      [req.params.id, mrId]
    );
    if (!rows[0]) throw new AppError('Report not found or already submitted', 404);
    res.json({ report: rows[0] });
  } catch (err) { next(err); }
});

export default router;
