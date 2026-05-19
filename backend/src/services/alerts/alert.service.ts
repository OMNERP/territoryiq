import { query } from '../../config/database';
import { logger } from '../../utils/logger';

interface CreateAlertInput {
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  mrId?: string;
  territoryId?: string;
  doctorId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export const alertService = {
  async createAlert(input: CreateAlertInput) {
    try {
      const { rows } = await query(
        `INSERT INTO alerts
           (alert_type, severity, title, message, mr_id, territory_id, doctor_id, customer_id, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
         RETURNING *`,
        [
          input.alertType, input.severity, input.title, input.message,
          input.mrId || null, input.territoryId || null,
          input.doctorId || null, input.customerId || null,
          input.metadata ? JSON.stringify(input.metadata) : null,
        ]
      );
      return rows[0];
    } catch (err) {
      logger.error('Alert creation failed:', err);
      return null;
    }
  },

  async checkMissedVisits() {
    // Find doctors not visited in their frequency window
    const { rows } = await query(`
      SELECT d.id, d.name, d.assigned_mr_id, d.visit_frequency_days,
             d.last_visit_date, mr.territory_id
      FROM doctors d
      JOIN medical_representatives mr ON mr.id = d.assigned_mr_id
      WHERE d.is_active = true
        AND d.assigned_mr_id IS NOT NULL
        AND (
          d.last_visit_date IS NULL OR
          d.last_visit_date < CURRENT_DATE - (d.visit_frequency_days || ' days')::INTERVAL
        )
        AND d.priority IN ('high', 'medium')
    `);

    for (const doctor of rows) {
      await this.createAlert({
        alertType:   'missed_visit',
        severity:    doctor.priority === 'high' ? 'critical' : 'warning',
        title:       `Missed Visit: Dr. ${doctor.name}`,
        message:     `Doctor not visited in ${doctor.visit_frequency_days} days`,
        mrId:        doctor.assigned_mr_id,
        territoryId: doctor.territory_id,
        doctorId:    doctor.id,
        metadata:    { lastVisit: doctor.last_visit_date },
      });
    }
    logger.info(`Checked missed visits: ${rows.length} alerts`);
  },

  async checkLowCoverage() {
    const { rows } = await query(`
      SELECT * FROM vw_territory_coverage
      WHERE coverage_pct < 60
    `);

    for (const t of rows) {
      await this.createAlert({
        alertType:   'low_coverage',
        severity:    t.coverage_pct < 40 ? 'critical' : 'warning',
        title:       `Low Coverage: ${t.name}`,
        message:     `Territory coverage at ${t.coverage_pct}% — below 60% threshold`,
        mrId:        t.mr_id,
        territoryId: t.id,
        metadata:    { coveragePct: t.coverage_pct },
      });
    }
  },

  async checkInactiveMrs() {
    const { rows } = await query(`
      SELECT id, full_name, territory_id
      FROM medical_representatives
      WHERE status = 'active'
        AND (last_gps_update IS NULL OR last_gps_update < NOW() - INTERVAL '3 hours')
        AND DATE(last_gps_update) = CURRENT_DATE
    `);

    for (const mr of rows) {
      await this.createAlert({
        alertType:   'inactive_mr',
        severity:    'warning',
        title:       `MR Inactive: ${mr.full_name}`,
        message:     'No GPS activity for over 3 hours during business hours',
        mrId:        mr.id,
        territoryId: mr.territory_id,
      });
    }
  },
};
