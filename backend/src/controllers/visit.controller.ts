import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../utils/AppError';
import { geoService } from '../services/geo/geo.service';
import { alertService } from '../services/alerts/alert.service';

const GEO_VALIDITY_RADIUS_M = 300; // 300 metres for valid check-in
const SUSPICIOUS_RADIUS_M   = 1000;

// ── POST /visits/checkin ──────────────────────────────────────────────────────
export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const { visitType, doctorId, customerId, latitude, longitude, notes } = req.body;
    const mrId = req.user!.mrId;
    if (!mrId) throw new AppError('Only MRs can check in', 403);

    // Determine target location for geo validation
    let targetLat: number | null = null;
    let targetLng: number | null = null;

    if (visitType === 'doctor' && doctorId) {
      const { rows } = await query(
        'SELECT latitude, longitude FROM doctors WHERE id = $1',
        [doctorId]
      );
      if (rows[0]) { targetLat = rows[0].latitude; targetLng = rows[0].longitude; }
    } else if (visitType === 'customer' && customerId) {
      const { rows } = await query(
        'SELECT latitude, longitude FROM customers WHERE id = $1',
        [customerId]
      );
      if (rows[0]) { targetLat = rows[0].latitude; targetLng = rows[0].longitude; }
    }

    // Geo validation
    let geoStatus: string = 'unverified';
    let distanceMeters: number | null = null;

    if (targetLat && targetLng && latitude && longitude) {
      distanceMeters = geoService.haversineDistance(
        latitude, longitude, targetLat, targetLng
      );
      if (distanceMeters <= GEO_VALIDITY_RADIUS_M) {
        geoStatus = 'valid';
      } else if (distanceMeters <= SUSPICIOUS_RADIUS_M) {
        geoStatus = 'suspicious';
      } else {
        geoStatus = 'invalid';
        // Fire alert for geo anomaly
        await alertService.createAlert({
          alertType:   'geo_anomaly',
          severity:    'critical',
          title:       'GPS Anomaly Detected',
          message:     `Check-in is ${Math.round(distanceMeters)}m from target location`,
          mrId,
          metadata:    { distance: distanceMeters, visitType, doctorId, customerId },
        });
      }
    }

    const { rows } = await query(
      `INSERT INTO visits
         (mr_id, visit_type, doctor_id, customer_id,
          checkin_time, checkin_lat, checkin_lng,
          geo_validation_status, geo_distance_meters, discussion_notes)
       VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        mrId, visitType, doctorId || null, customerId || null,
        latitude || null, longitude || null,
        geoStatus, distanceMeters, notes || null,
      ]
    );

    const visit = rows[0];

    // Update MR last known location
    if (latitude && longitude) {
      await query(
        `UPDATE medical_representatives
         SET last_known_lat=$1, last_known_lng=$2, last_gps_update=NOW()
         WHERE id=$3`,
        [latitude, longitude, mrId]
      );
    }

    // Emit real-time event
    const io = req.app.get('io');
    io?.emit('visit:checkin', {
      mrId, visitId: visit.id, visitType,
      lat: latitude, lng: longitude, geoStatus,
    });

    // Invalidate coverage caches
    await cache.delPattern('coverage:*');

    res.status(201).json({ visit, geoValidation: { status: geoStatus, distanceMeters } });
  } catch (err) {
    next(err);
  }
}

// ── PUT /visits/:id/checkout ──────────────────────────────────────────────────
export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const {
      latitude, longitude, discussionNotes, productsDiscussed,
      samplesGiven, followupDate, competitorActivity,
      visitOutcome, photoUrls, voiceNoteUrl,
    } = req.body;

    const { rows } = await query(
      `UPDATE visits SET
         checkout_time = NOW(),
         checkout_lat = $1,
         checkout_lng = $2,
         discussion_notes = COALESCE($3, discussion_notes),
         products_discussed = COALESCE($4, products_discussed),
         samples_given = COALESCE($5::jsonb, samples_given),
         followup_date = $6,
         competitor_activity = $7,
         visit_outcome = $8,
         photo_urls = COALESCE($9, photo_urls),
         voice_note_url = $10
       WHERE id = $11 AND mr_id = $12 AND checkout_time IS NULL
       RETURNING *`,
      [
        latitude || null, longitude || null,
        discussionNotes, productsDiscussed || null,
        samplesGiven ? JSON.stringify(samplesGiven) : null,
        followupDate || null, competitorActivity || null,
        visitOutcome || 'neutral', photoUrls || null, voiceNoteUrl || null,
        id, req.user!.mrId,
      ]
    );

    if (!rows[0]) throw new AppError('Visit not found or already checked out', 404);

    const visit = rows[0];
    const io = req.app.get('io');
    io?.emit('visit:checkout', { visitId: visit.id, duration: visit.duration_minutes });

    // Update doctor/customer last_visit_date
    if (visit.visit_type === 'doctor' && visit.doctor_id) {
      await query(
        'UPDATE doctors SET last_visit_date = CURRENT_DATE WHERE id = $1',
        [visit.doctor_id]
      );
    } else if (visit.visit_type === 'customer' && visit.customer_id) {
      await query(
        'UPDATE customers SET last_visit_date = CURRENT_DATE WHERE id = $1',
        [visit.customer_id]
      );
    }

    res.json({ visit });
  } catch (err) {
    next(err);
  }
}

// ── GET /visits ───────────────────────────────────────────────────────────────
export async function listVisits(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      mrId, doctorId, customerId, visitType,
      from, to, page = '1', limit = '20',
      geoStatus, _mrId, // injected by territoryScope
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, parseInt(limit));
    const offset   = (pageNum - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    const addFilter = (cond: string, val: unknown) => {
      conditions.push(cond.replace('?', `$${p++}`));
      params.push(val);
    };

    const effectiveMrId = _mrId || mrId;
    if (effectiveMrId) addFilter('v.mr_id = ?', effectiveMrId);
    if (doctorId)      addFilter('v.doctor_id = ?', doctorId);
    if (customerId)    addFilter('v.customer_id = ?', customerId);
    if (visitType)     addFilter('v.visit_type = ?', visitType);
    if (geoStatus)     addFilter('v.geo_validation_status = ?', geoStatus);
    if (from)          addFilter('v.checkin_time >= ?', from);
    if (to)            addFilter('v.checkin_time <= ?', to);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM visits v ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(pageSize, offset);
    const { rows } = await query(
      `SELECT v.*,
              mr.full_name AS mr_name, mr.employee_id,
              d.name AS doctor_name, d.specialty,
              c.name AS customer_name, c.customer_type
       FROM visits v
       JOIN medical_representatives mr ON mr.id = v.mr_id
       LEFT JOIN doctors d ON d.id = v.doctor_id
       LEFT JOIN customers c ON c.id = v.customer_id
       ${where}
       ORDER BY v.checkin_time DESC
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );

    res.json({
      visits: rows,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /visits/:id ───────────────────────────────────────────────────────────
export async function getVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await query(
      `SELECT v.*,
              mr.full_name AS mr_name, mr.employee_id,
              d.name AS doctor_name, d.specialty, d.clinic_hospital,
              c.name AS customer_name, c.customer_type, c.contact_person
       FROM visits v
       JOIN medical_representatives mr ON mr.id = v.mr_id
       LEFT JOIN doctors d ON d.id = v.doctor_id
       LEFT JOIN customers c ON c.id = v.customer_id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new AppError('Visit not found', 404);
    res.json({ visit: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── GET /visits/mr/:mrId/today ────────────────────────────────────────────────
export async function todayVisits(req: Request, res: Response, next: NextFunction) {
  try {
    const mrId = req.params.mrId || req.user!.mrId;
    const cacheKey = `visits:today:${mrId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(
      `SELECT v.*,
              d.name AS doctor_name, d.specialty, d.latitude AS d_lat, d.longitude AS d_lng,
              c.name AS customer_name, c.customer_type
       FROM visits v
       LEFT JOIN doctors d ON d.id = v.doctor_id
       LEFT JOIN customers c ON c.id = v.customer_id
       WHERE v.mr_id = $1 AND DATE(v.checkin_time) = CURRENT_DATE
       ORDER BY v.checkin_time DESC`,
      [mrId]
    );

    const result = { visits: rows, count: rows.length };
    await cache.set(cacheKey, result, 60); // 1 min cache
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── POST /visits/gps ──────────────────────────────────────────────────────────
export async function logGps(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude, accuracy, speed, heading } = req.body;
    const mrId = req.user!.mrId;
    if (!mrId) throw new AppError('MR ID required', 400);

    await query(
      `INSERT INTO gps_logs (mr_id, latitude, longitude, accuracy, speed, heading, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [mrId, latitude, longitude, accuracy || null, speed || null, heading || null]
    );

    await query(
      `UPDATE medical_representatives
       SET last_known_lat=$1, last_known_lng=$2, last_gps_update=NOW()
       WHERE id=$3`,
      [latitude, longitude, mrId]
    );

    // Broadcast to managers
    const io = req.app.get('io');
    io?.to('managers').emit('mr:location', { mrId, lat: latitude, lng: longitude });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
