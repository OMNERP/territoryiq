import cron from 'node-cron';
import { alertService } from './alerts/alert.service';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export function startCronJobs() {
  // Every day at 6 PM: check missed visits
  cron.schedule('0 18 * * 1-6', async () => {
    logger.info('[CRON] Checking missed visits...');
    try { await alertService.checkMissedVisits(); } catch (e) { logger.error(e); }
  });

  // Every day at 9 AM: check coverage
  cron.schedule('0 9 * * 1-6', async () => {
    logger.info('[CRON] Checking territory coverage...');
    try { await alertService.checkLowCoverage(); } catch (e) { logger.error(e); }
  });

  // Every 2 hours: check inactive MRs (during business hours)
  cron.schedule('0 10,12,14,16 * * 1-6', async () => {
    logger.info('[CRON] Checking inactive MRs...');
    try { await alertService.checkInactiveMrs(); } catch (e) { logger.error(e); }
  });

  // Every night at midnight: snapshot territory coverage
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Snapshotting territory coverage...');
    try {
      await query(`
        INSERT INTO territory_coverage_snapshots
          (territory_id, snapshot_date, total_doctors, covered_doctors,
           uncovered_doctors, coverage_percentage)
        SELECT
          t.id,
          CURRENT_DATE,
          COUNT(DISTINCT d.id),
          COUNT(DISTINCT v.doctor_id) FILTER (
            WHERE v.checkin_time >= NOW() - INTERVAL '30 days'
          ),
          COUNT(DISTINCT d.id) - COUNT(DISTINCT v.doctor_id) FILTER (
            WHERE v.checkin_time >= NOW() - INTERVAL '30 days'
          ),
          ROUND(
            COUNT(DISTINCT v.doctor_id) FILTER (WHERE v.checkin_time >= NOW() - INTERVAL '30 days')
            ::NUMERIC / NULLIF(COUNT(DISTINCT d.id), 0) * 100, 1
          )
        FROM territories t
        LEFT JOIN medical_representatives mr ON mr.territory_id = t.id
        LEFT JOIN doctors d ON d.territory_id = t.id AND d.is_active = true
        LEFT JOIN visits v ON v.mr_id = mr.id
        WHERE t.is_active = true
        GROUP BY t.id
        ON CONFLICT (territory_id, snapshot_date) DO UPDATE SET
          total_doctors = EXCLUDED.total_doctors,
          covered_doctors = EXCLUDED.covered_doctors,
          uncovered_doctors = EXCLUDED.uncovered_doctors,
          coverage_percentage = EXCLUDED.coverage_percentage
      `);
      logger.info('[CRON] Territory snapshot done');
    } catch (e) {
      logger.error('[CRON] Snapshot failed:', e);
    }
  });

  // Every Sunday: clean old GPS logs > 90 days
  cron.schedule('0 2 * * 0', async () => {
    logger.info('[CRON] Pruning old GPS logs...');
    try {
      const { rowCount } = await query(
        `DELETE FROM gps_logs WHERE recorded_at < NOW() - INTERVAL '90 days'`
      );
      logger.info(`[CRON] Pruned ${rowCount} GPS logs`);
    } catch (e) {
      logger.error(e);
    }
  });

  logger.info('Cron jobs scheduled');
}
