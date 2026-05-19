import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { query } from '../config/database';

const alertRouter = Router();
alertRouter.use(authenticate);

alertRouter.get('/', async (req, res, next) => {
  try {
    const { severity, type, isRead, mrId, page = '1', limit = '20' } = req.query as any;
    const conds: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    if (severity) { conds.push(`severity=$${p++}`); params.push(severity); }
    if (type)     { conds.push(`alert_type=$${p++}`); params.push(type); }
    if (isRead !== undefined) { conds.push(`is_read=$${p++}`); params.push(isRead === 'true'); }
    if (mrId)     { conds.push(`mr_id=$${p++}`); params.push(mrId); }

    // MRs only see their own alerts
    if (req.user!.role === 'medical_representative' && req.user!.mrId) {
      conds.push(`mr_id=$${p++}`);
      params.push(req.user!.mrId);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * pageSize;

    const countRes = await query(`SELECT COUNT(*) FROM alerts ${where}`, params);
    params.push(pageSize, offset);

    const { rows } = await query(
      `SELECT a.*, mr.full_name AS mr_name
       FROM alerts a
       LEFT JOIN medical_representatives mr ON mr.id = a.mr_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );

    res.json({
      alerts: rows,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: parseInt((countRes.rows[0] as any).count),
      },
    });
  } catch (err) { next(err); }
});

alertRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await query('UPDATE alerts SET is_read=true WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

alertRouter.patch(
  '/:id/resolve',
  authorize('admin', 'sales_manager', 'regional_manager'),
  async (req, res, next) => {
    try {
      await query(
        'UPDATE alerts SET is_resolved=true, resolved_at=NOW() WHERE id=$1',
        [req.params.id]
      );
      res.json({ ok: true });
    } catch (err) { next(err); }
  }
);

export default alertRouter;
