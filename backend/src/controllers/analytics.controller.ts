import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { cache } from '../config/redis';

// ── GET /analytics/dashboard ──────────────────────────────────────────────────
export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = `analytics:dashboard:${req.user!.role}`;
    const cached   = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [
      coverageStats,
      mrStats,
      visitStats,
      alertStats,
    ] = await Promise.all([
      // Coverage summary
      query(`
        SELECT
          COUNT(DISTINCT d.id) AS total_doctors,
          COUNT(DISTINCT v.doctor_id) FILTER (
            WHERE v.checkin_time >= NOW() - INTERVAL '30 days'
          ) AS covered_doctors,
          COUNT(DISTINCT c.id) AS total_customers,
          COUNT(DISTINCT v2.customer_id) FILTER (
            WHERE v2.checkin_time >= NOW() - INTERVAL '30 days'
          ) AS covered_customers
        FROM doctors d
        CROSS JOIN customers c
        LEFT JOIN visits v  ON v.doctor_id   = d.id
        LEFT JOIN visits v2 ON v2.customer_id = c.id
        WHERE d.is_active = true AND c.is_active = true
      `),
      // MR stats
      query(`
        SELECT
          COUNT(*)                                        AS total_mrs,
          COUNT(*) FILTER (WHERE status = 'active')       AS active_mrs,
          COUNT(*) FILTER (
            WHERE last_gps_update > NOW() - INTERVAL '30 minutes'
          )                                               AS online_now
        FROM medical_representatives
      `),
      // Today visit stats
      query(`
        SELECT
          COUNT(*)                                         AS visits_today,
          COUNT(*) FILTER (WHERE geo_validation_status='valid') AS valid_visits,
          COUNT(*) FILTER (WHERE geo_validation_status='invalid') AS invalid_visits,
          ROUND(AVG(duration_minutes), 1)                  AS avg_duration_min
        FROM visits
        WHERE DATE(checkin_time) = CURRENT_DATE
      `),
      // Unresolved alerts
      query(`
        SELECT severity, COUNT(*) AS count
        FROM alerts WHERE is_resolved = false
        GROUP BY severity
      `),
    ]);

    const cov = coverageStats.rows[0];
    const mr  = mrStats.rows[0];
    const vis = visitStats.rows[0];

    const doctorCovPct = cov.total_doctors > 0
      ? Math.round((cov.covered_doctors / cov.total_doctors) * 100 * 10) / 10
      : 0;
    const customerCovPct = cov.total_customers > 0
      ? Math.round((cov.covered_customers / cov.total_customers) * 100 * 10) / 10
      : 0;

    const alerts: Record<string, number> = {};
    alertStats.rows.forEach((r: any) => { alerts[r.severity] = parseInt(r.count); });

    const result = {
      coverage: {
        doctorCoverage: doctorCovPct,
        customerCoverage: customerCovPct,
        totalDoctors: parseInt(cov.total_doctors),
        coveredDoctors: parseInt(cov.covered_doctors),
        totalCustomers: parseInt(cov.total_customers),
        coveredCustomers: parseInt(cov.covered_customers),
      },
      mrs: {
        total: parseInt(mr.total_mrs),
        active: parseInt(mr.active_mrs),
        onlineNow: parseInt(mr.online_now),
      },
      visits: {
        today: parseInt(vis.visits_today),
        validToday: parseInt(vis.valid_visits),
        invalidToday: parseInt(vis.invalid_visits),
        avgDuration: parseFloat(vis.avg_duration_min) || 0,
      },
      alerts,
    };

    await cache.set(cacheKey, result, 120); // 2 min cache
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/coverage/trend ─────────────────────────────────────────────
export async function coverageTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const { months = '6', territoryId } = req.query;
    const m = Math.min(12, Math.max(1, parseInt(months as string)));

    const params: unknown[] = [m];
    const tFilter = territoryId ? `AND territory_id = $2` : '';
    if (territoryId) params.push(territoryId);

    const { rows } = await query(
      `SELECT
         DATE_TRUNC('month', snapshot_date) AS month,
         ROUND(AVG(coverage_percentage), 1) AS coverage_pct,
         ROUND(AVG(heatmap_score), 1)       AS heatmap_score,
         ROUND(AVG(route_efficiency), 1)    AS route_efficiency
       FROM territory_coverage_snapshots
       WHERE snapshot_date >= NOW() - ($1 || ' months')::INTERVAL ${tFilter}
       GROUP BY DATE_TRUNC('month', snapshot_date)
       ORDER BY month`,
      params
    );

    res.json({ trend: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/mr-productivity ───────────────────────────────────────────
export async function mrProductivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, territoryId } = req.query;
    const startDate = from || new Date(Date.now() - 30*86400*1000).toISOString().split('T')[0];
    const endDate   = to   || new Date().toISOString().split('T')[0];

    const params: unknown[] = [startDate, endDate];
    const tFilter = territoryId ? `AND mr.territory_id = $3` : '';
    if (territoryId) params.push(territoryId);

    const { rows } = await query(
      `SELECT
         mr.id, mr.full_name, mr.employee_id,
         t.name AS territory,
         mr.daily_visit_target,
         COUNT(v.id)                     AS total_visits,
         COUNT(DISTINCT DATE(v.checkin_time)) AS active_days,
         ROUND(COUNT(v.id)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(v.checkin_time)), 0), 1) AS avg_visits_per_day,
         COUNT(v.id) FILTER (WHERE v.geo_validation_status = 'valid')    AS valid_visits,
         COUNT(v.id) FILTER (WHERE v.geo_validation_status = 'invalid')  AS invalid_visits,
         ROUND(AVG(v.duration_minutes), 1) AS avg_duration_min,
         COUNT(DISTINCT v.doctor_id)     AS unique_doctors_visited,
         COUNT(DISTINCT v.customer_id)   AS unique_customers_visited
       FROM medical_representatives mr
       JOIN territories t ON t.id = mr.territory_id
       LEFT JOIN visits v ON v.mr_id = mr.id
         AND DATE(v.checkin_time) BETWEEN $1 AND $2
       WHERE mr.status = 'active' ${tFilter}
       GROUP BY mr.id, t.name
       ORDER BY total_visits DESC`,
      params
    );

    res.json({ productivity: rows, dateRange: { from: startDate, to: endDate } });
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/territory-comparison ──────────────────────────────────────
export async function territoryComparison(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = 'analytics:territory:comparison';
    const cached   = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(`SELECT * FROM vw_territory_coverage ORDER BY coverage_pct DESC`);

    await cache.set(cacheKey, { territories: rows }, 300);
    res.json({ territories: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/visit-heatmap ──────────────────────────────────────────────
export async function visitHeatmap(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, territoryId } = req.query;
    const startDate = from || new Date(Date.now() - 30*86400*1000).toISOString().split('T')[0];

    const params: unknown[] = [startDate];
    const tFilter = territoryId
      ? `AND mr.territory_id = $2`
      : '';
    if (territoryId) params.push(territoryId);

    const { rows } = await query(
      `SELECT
         ROUND(checkin_lat::NUMERIC, 3) AS lat,
         ROUND(checkin_lng::NUMERIC, 3) AS lng,
         COUNT(*) AS intensity
       FROM visits v
       JOIN medical_representatives mr ON mr.id = v.mr_id
       WHERE DATE(v.checkin_time) >= $1
         AND v.checkin_lat IS NOT NULL ${tFilter}
       GROUP BY ROUND(checkin_lat::NUMERIC, 3), ROUND(checkin_lng::NUMERIC, 3)
       ORDER BY intensity DESC
       LIMIT 500`,
      params
    );

    res.json({ heatmap: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/product-performance ───────────────────────────────────────
export async function productPerformance(req: Request, res: Response, next: NextFunction) {
  try {
    const { from } = req.query;
    const startDate = from || new Date(Date.now() - 30*86400*1000).toISOString().split('T')[0];

    const { rows } = await query(
      `SELECT
         product_name,
         COUNT(*)           AS visit_count,
         COUNT(DISTINCT mr_id) AS mr_count
       FROM (
         SELECT
           v.mr_id,
           UNNEST(v.products_discussed) AS product_name
         FROM visits v
         WHERE DATE(v.checkin_time) >= $1
           AND v.products_discussed IS NOT NULL
       ) sub
       GROUP BY product_name
       ORDER BY visit_count DESC
       LIMIT 20`,
      [startDate]
    );

    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
}
