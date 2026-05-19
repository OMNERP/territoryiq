-- ============================================================
--  TerritoryIQ — PostgreSQL Schema
--  Requires: PostgreSQL 14+ with PostGIS extension
-- ============================================================

-- Enable PostGIS for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for fast text search

-- ─── ENUMS ──────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'admin', 'sales_manager', 'regional_manager', 'medical_representative', 'marketing_manager'
);

CREATE TYPE mr_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
CREATE TYPE visit_type AS ENUM ('doctor', 'customer');
CREATE TYPE customer_type AS ENUM ('pharmacy', 'clinic', 'hospital', 'healthcare_retailer');
CREATE TYPE doctor_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE visit_outcome AS ENUM ('positive', 'neutral', 'negative', 'follow_up_required');
CREATE TYPE geo_validation_status AS ENUM ('valid', 'invalid', 'suspicious', 'unverified');
CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE alert_type AS ENUM (
  'missed_visit', 'low_coverage', 'geo_anomaly', 'inactive_mr',
  'pending_followup', 'target_failure', 'sample_low'
);

-- ─── USERS ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'medical_representative',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

-- ─── TERRITORIES ────────────────────────────────────────────────────────────

CREATE TABLE territories (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(150) NOT NULL,
  city                  VARCHAR(100) NOT NULL,
  region                VARCHAR(100) NOT NULL,
  state                 VARCHAR(100),
  country               VARCHAR(100) NOT NULL DEFAULT 'India',
  boundary              GEOGRAPHY(MULTIPOLYGON, 4326), -- PostGIS geo boundary
  is_active             BOOLEAN NOT NULL DEFAULT true,
  heatmap_score         NUMERIC(5,2) DEFAULT 0,
  route_efficiency_score NUMERIC(5,2) DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_territories_region ON territories (region);
CREATE INDEX idx_territories_boundary ON territories USING GIST (boundary);

-- ─── MEDICAL REPRESENTATIVES ────────────────────────────────────────────────

CREATE TABLE medical_representatives (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  employee_id         VARCHAR(50) NOT NULL UNIQUE,
  full_name           VARCHAR(200) NOT NULL,
  territory_id        UUID REFERENCES territories (id) ON DELETE SET NULL,
  manager_id          UUID REFERENCES medical_representatives (id) ON DELETE SET NULL,
  phone               VARCHAR(20),
  status              mr_status NOT NULL DEFAULT 'active',
  gps_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_visit_target  INT NOT NULL DEFAULT 10,
  monthly_sales_target NUMERIC(12,2) DEFAULT 0,
  assigned_cities     TEXT[],
  last_active_at      TIMESTAMPTZ,
  last_known_lat      NUMERIC(10,7),
  last_known_lng      NUMERIC(10,7),
  last_gps_update     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mr_user_id       ON medical_representatives (user_id);
CREATE INDEX idx_mr_territory_id  ON medical_representatives (territory_id);
CREATE INDEX idx_mr_manager_id    ON medical_representatives (manager_id);
CREATE INDEX idx_mr_employee_id   ON medical_representatives (employee_id);
CREATE INDEX idx_mr_status        ON medical_representatives (status);

-- MR ↔ Products (many-to-many)
CREATE TABLE mr_products (
  mr_id       UUID NOT NULL REFERENCES medical_representatives (id) ON DELETE CASCADE,
  product_id  UUID NOT NULL,
  PRIMARY KEY (mr_id, product_id)
);

-- ─── DOCTORS ────────────────────────────────────────────────────────────────

CREATE TABLE doctors (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(200) NOT NULL,
  specialty           VARCHAR(150),
  qualification       VARCHAR(150),
  clinic_hospital     VARCHAR(200),
  address             TEXT,
  city                VARCHAR(100),
  state               VARCHAR(100),
  latitude            NUMERIC(10,7),
  longitude           NUMERIC(10,7),
  geo_point           GEOGRAPHY(POINT, 4326),
  phone               VARCHAR(20),
  email               VARCHAR(255),
  visit_frequency_days INT DEFAULT 30,
  priority            doctor_priority NOT NULL DEFAULT 'medium',
  potential_score     NUMERIC(4,2) DEFAULT 5.0, -- 0-10
  preferred_products  TEXT[],
  last_visit_date     DATE,
  assigned_mr_id      UUID REFERENCES medical_representatives (id) ON DELETE SET NULL,
  territory_id        UUID REFERENCES territories (id) ON DELETE SET NULL,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_mr_id       ON doctors (assigned_mr_id);
CREATE INDEX idx_doctors_territory   ON doctors (territory_id);
CREATE INDEX idx_doctors_priority    ON doctors (priority);
CREATE INDEX idx_doctors_specialty   ON doctors (specialty);
CREATE INDEX idx_doctors_geo         ON doctors USING GIST (geo_point);
CREATE INDEX idx_doctors_name_trgm   ON doctors USING GIN (name gin_trgm_ops);

-- ─── CUSTOMERS ──────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    VARCHAR(200) NOT NULL,
  customer_type           customer_type NOT NULL,
  address                 TEXT,
  city                    VARCHAR(100),
  state                   VARCHAR(100),
  latitude                NUMERIC(10,7),
  longitude               NUMERIC(10,7),
  geo_point               GEOGRAPHY(POINT, 4326),
  contact_person          VARCHAR(200),
  phone                   VARCHAR(20),
  email                   VARCHAR(255),
  visit_frequency_days    INT DEFAULT 14,
  assigned_mr_id          UUID REFERENCES medical_representatives (id) ON DELETE SET NULL,
  territory_id            UUID REFERENCES territories (id) ON DELETE SET NULL,
  product_interests       TEXT[],
  monthly_business_potential NUMERIC(12,2) DEFAULT 0,
  last_visit_date         DATE,
  notes                   TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_mr_id     ON customers (assigned_mr_id);
CREATE INDEX idx_customers_territory ON customers (territory_id);
CREATE INDEX idx_customers_type      ON customers (customer_type);
CREATE INDEX idx_customers_geo       ON customers USING GIST (geo_point);
CREATE INDEX idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);

-- ─── PRODUCTS ───────────────────────────────────────────────────────────────

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  category      VARCHAR(100),
  description   TEXT,
  sku           VARCHAR(100) UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── VISITS ─────────────────────────────────────────────────────────────────

CREATE TABLE visits (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mr_id                 UUID NOT NULL REFERENCES medical_representatives (id) ON DELETE CASCADE,
  visit_type            visit_type NOT NULL,
  doctor_id             UUID REFERENCES doctors (id) ON DELETE SET NULL,
  customer_id           UUID REFERENCES customers (id) ON DELETE SET NULL,
  checkin_time          TIMESTAMPTZ NOT NULL,
  checkout_time         TIMESTAMPTZ,
  duration_minutes      INT,                          -- auto calculated
  checkin_lat           NUMERIC(10,7),
  checkin_lng           NUMERIC(10,7),
  checkin_geo           GEOGRAPHY(POINT, 4326),
  checkout_lat          NUMERIC(10,7),
  checkout_lng          NUMERIC(10,7),
  geo_validation_status geo_validation_status NOT NULL DEFAULT 'unverified',
  geo_distance_meters   NUMERIC(10,2),               -- distance from target location
  discussion_notes      TEXT,
  products_discussed    TEXT[],
  samples_given         JSONB,                        -- [{product_id, quantity}]
  followup_date         DATE,
  competitor_activity   TEXT,
  visit_outcome         visit_outcome DEFAULT 'neutral',
  photo_urls            TEXT[],
  voice_note_url        TEXT,
  is_offline_sync       BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_visit_entity CHECK (
    (visit_type = 'doctor' AND doctor_id IS NOT NULL) OR
    (visit_type = 'customer' AND customer_id IS NOT NULL)
  )
);

CREATE INDEX idx_visits_mr_id         ON visits (mr_id);
CREATE INDEX idx_visits_doctor_id     ON visits (doctor_id);
CREATE INDEX idx_visits_customer_id   ON visits (customer_id);
CREATE INDEX idx_visits_checkin_time  ON visits (checkin_time DESC);
CREATE INDEX idx_visits_geo           ON visits USING GIST (checkin_geo);
CREATE INDEX idx_visits_date          ON visits (DATE(checkin_time));

-- ─── DAILY ACTIVITY REPORTS ─────────────────────────────────────────────────

CREATE TABLE daily_activity_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mr_id                 UUID NOT NULL REFERENCES medical_representatives (id) ON DELETE CASCADE,
  report_date           DATE NOT NULL,
  doctor_calls          INT NOT NULL DEFAULT 0,
  customer_visits       INT NOT NULL DEFAULT 0,
  samples_distributed   INT NOT NULL DEFAULT 0,
  competitor_activities TEXT,
  market_feedback       TEXT,
  route_distance_km     NUMERIC(8,2),
  gps_logs              JSONB,                        -- [{lat, lng, timestamp}]
  photo_urls            TEXT[],
  voice_note_url        TEXT,
  submitted_at          TIMESTAMPTZ,
  is_submitted          BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mr_id, report_date)
);

CREATE INDEX idx_dar_mr_id ON daily_activity_reports (mr_id);
CREATE INDEX idx_dar_date  ON daily_activity_reports (report_date DESC);

-- ─── GPS TRACKING LOGS ──────────────────────────────────────────────────────

CREATE TABLE gps_logs (
  id          BIGSERIAL PRIMARY KEY,
  mr_id       UUID NOT NULL REFERENCES medical_representatives (id) ON DELETE CASCADE,
  latitude    NUMERIC(10,7) NOT NULL,
  longitude   NUMERIC(10,7) NOT NULL,
  geo_point   GEOGRAPHY(POINT, 4326),
  accuracy    NUMERIC(8,2),
  speed       NUMERIC(6,2),
  heading     NUMERIC(5,2),
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gps_mr_id       ON gps_logs (mr_id);
CREATE INDEX idx_gps_recorded_at ON gps_logs (recorded_at DESC);
CREATE INDEX idx_gps_geo         ON gps_logs USING GIST (geo_point);

-- Partition hint: in production, partition gps_logs by month

-- ─── TERRITORY COVERAGE SNAPSHOTS ───────────────────────────────────────────

CREATE TABLE territory_coverage_snapshots (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  territory_id        UUID NOT NULL REFERENCES territories (id) ON DELETE CASCADE,
  snapshot_date       DATE NOT NULL,
  total_doctors       INT NOT NULL DEFAULT 0,
  covered_doctors     INT NOT NULL DEFAULT 0,
  uncovered_doctors   INT NOT NULL DEFAULT 0,
  total_customers     INT NOT NULL DEFAULT 0,
  covered_customers   INT NOT NULL DEFAULT 0,
  coverage_percentage NUMERIC(5,2) DEFAULT 0,
  heatmap_score       NUMERIC(5,2) DEFAULT 0,
  route_efficiency    NUMERIC(5,2) DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (territory_id, snapshot_date)
);

CREATE INDEX idx_tcs_territory ON territory_coverage_snapshots (territory_id);
CREATE INDEX idx_tcs_date      ON territory_coverage_snapshots (snapshot_date DESC);

-- ─── ALERTS ─────────────────────────────────────────────────────────────────

CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type    alert_type NOT NULL,
  severity      alert_severity NOT NULL DEFAULT 'warning',
  title         VARCHAR(300) NOT NULL,
  message       TEXT NOT NULL,
  mr_id         UUID REFERENCES medical_representatives (id) ON DELETE SET NULL,
  territory_id  UUID REFERENCES territories (id) ON DELETE SET NULL,
  doctor_id     UUID REFERENCES doctors (id) ON DELETE SET NULL,
  customer_id   UUID REFERENCES customers (id) ON DELETE SET NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  is_resolved   BOOLEAN NOT NULL DEFAULT false,
  resolved_at   TIMESTAMPTZ,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_mr_id    ON alerts (mr_id);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_alerts_unread   ON alerts (is_read) WHERE is_read = false;
CREATE INDEX idx_alerts_created  ON alerts (created_at DESC);

-- ─── REFRESH TOKENS ─────────────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  is_revoked  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user_id   ON refresh_tokens (user_id);
CREATE INDEX idx_rt_token_hash ON refresh_tokens (token_hash);

-- ─── AUDIT LOGS ─────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users (id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   UUID,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id   ON audit_logs (user_id);
CREATE INDEX idx_audit_created   ON audit_logs (created_at DESC);

-- ─── FUNCTIONS & TRIGGERS ───────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at               BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_territories_updated_at         BEFORE UPDATE ON territories         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_mr_updated_at                  BEFORE UPDATE ON medical_representatives FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_doctors_updated_at             BEFORE UPDATE ON doctors             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_customers_updated_at           BEFORE UPDATE ON customers           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_visits_updated_at              BEFORE UPDATE ON visits              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_dar_updated_at                 BEFORE UPDATE ON daily_activity_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-calculate visit duration on checkout
CREATE OR REPLACE FUNCTION calculate_visit_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkout_time IS NOT NULL AND NEW.checkin_time IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.checkout_time - NEW.checkin_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_visit_duration
  BEFORE INSERT OR UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION calculate_visit_duration();

-- Auto-populate geo_point from lat/lng on doctors
CREATE OR REPLACE FUNCTION set_doctor_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doctor_geo_point
  BEFORE INSERT OR UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_doctor_geo_point();

-- Same for customers
CREATE OR REPLACE FUNCTION set_customer_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_geo_point
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_customer_geo_point();

-- Same for visits checkin
CREATE OR REPLACE FUNCTION set_visit_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkin_lat IS NOT NULL AND NEW.checkin_lng IS NOT NULL THEN
    NEW.checkin_geo = ST_SetSRID(ST_MakePoint(NEW.checkin_lng, NEW.checkin_lat), 4326)::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_visit_geo_point
  BEFORE INSERT OR UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION set_visit_geo_point();

-- Same for gps_logs
CREATE OR REPLACE FUNCTION set_gps_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gps_geo_point
  BEFORE INSERT ON gps_logs
  FOR EACH ROW EXECUTE FUNCTION set_gps_geo_point();

-- ─── VIEWS ──────────────────────────────────────────────────────────────────

-- MR Activity Summary (today)
CREATE OR REPLACE VIEW vw_mr_activity_today AS
SELECT
  mr.id,
  mr.full_name,
  mr.employee_id,
  t.name AS territory_name,
  t.city,
  mr.last_known_lat,
  mr.last_known_lng,
  mr.last_gps_update,
  mr.status,
  mr.daily_visit_target,
  COUNT(v.id) AS visits_today,
  ROUND(COUNT(v.id)::NUMERIC / NULLIF(mr.daily_visit_target, 0) * 100, 1) AS target_pct,
  CASE
    WHEN mr.last_gps_update > NOW() - INTERVAL '30 minutes' THEN 'active'
    WHEN mr.last_gps_update > NOW() - INTERVAL '2 hours'    THEN 'idle'
    ELSE 'offline'
  END AS live_status
FROM medical_representatives mr
LEFT JOIN territories t ON mr.territory_id = t.id
LEFT JOIN visits v ON v.mr_id = mr.id AND DATE(v.checkin_time) = CURRENT_DATE
WHERE mr.status = 'active'
GROUP BY mr.id, t.name, t.city;

-- Territory coverage summary
CREATE OR REPLACE VIEW vw_territory_coverage AS
SELECT
  t.id,
  t.name,
  t.city,
  t.region,
  mr.full_name AS mr_name,
  mr.id AS mr_id,
  COUNT(DISTINCT d.id) AS total_doctors,
  COUNT(DISTINCT v.doctor_id) FILTER (
    WHERE v.checkin_time >= NOW() - INTERVAL '30 days'
  ) AS covered_doctors_30d,
  COUNT(DISTINCT c.id) AS total_customers,
  ROUND(
    COUNT(DISTINCT v.doctor_id) FILTER (WHERE v.checkin_time >= NOW() - INTERVAL '30 days')::NUMERIC
    / NULLIF(COUNT(DISTINCT d.id), 0) * 100, 1
  ) AS coverage_pct,
  t.heatmap_score,
  t.route_efficiency_score
FROM territories t
LEFT JOIN medical_representatives mr ON mr.territory_id = t.id
LEFT JOIN doctors d ON d.territory_id = t.id AND d.is_active = true
LEFT JOIN customers c ON c.territory_id = t.id AND c.is_active = true
LEFT JOIN visits v ON v.mr_id = mr.id
WHERE t.is_active = true
GROUP BY t.id, mr.full_name, mr.id;
