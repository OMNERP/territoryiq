import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';

const HASH = (p: string) => bcrypt.hashSync(p, 10);

async function seed() {
  const client = await db.connect();
  console.log('🌱 Seeding TerritoryIQ database...');

  try {
    await client.query('BEGIN');

    // ── Users ──────────────────────────────────────────────────────────────
    console.log('  → Users...');
    await client.query(`
      INSERT INTO users (id, email, password_hash, role) VALUES
        ('00000000-0000-0000-0000-000000000001', 'admin@territoryiq.com',        '${HASH('Admin@123')}',    'admin'),
        ('00000000-0000-0000-0000-000000000002', 'manager.north@territoryiq.com','${HASH('Manager@123')}', 'sales_manager'),
        ('00000000-0000-0000-0000-000000000003', 'manager.south@territoryiq.com','${HASH('Manager@123')}', 'regional_manager'),
        ('00000000-0000-0000-0000-000000000004', 'mr.rajesh@territoryiq.com',    '${HASH('MR@12345')}',    'medical_representative'),
        ('00000000-0000-0000-0000-000000000005', 'mr.priya@territoryiq.com',     '${HASH('MR@12345')}',    'medical_representative'),
        ('00000000-0000-0000-0000-000000000006', 'mr.arjun@territoryiq.com',     '${HASH('MR@12345')}',    'medical_representative'),
        ('00000000-0000-0000-0000-000000000007', 'mr.sunita@territoryiq.com',    '${HASH('MR@12345')}',    'medical_representative'),
        ('00000000-0000-0000-0000-000000000008', 'mr.vikram@territoryiq.com',    '${HASH('MR@12345')}',    'medical_representative')
      ON CONFLICT (email) DO NOTHING
    `);

    // ── Territories ────────────────────────────────────────────────────────
    console.log('  → Territories...');
    await client.query(`
      INSERT INTO territories (id, name, city, region, state, country) VALUES
        ('10000000-0000-0000-0000-000000000001', 'Mumbai Central',    'Mumbai',    'West',  'Maharashtra', 'India'),
        ('10000000-0000-0000-0000-000000000002', 'Pune West',         'Pune',      'West',  'Maharashtra', 'India'),
        ('10000000-0000-0000-0000-000000000003', 'Delhi North',       'Delhi',     'North', 'Delhi',       'India'),
        ('10000000-0000-0000-0000-000000000004', 'Bangalore South',   'Bangalore', 'South', 'Karnataka',   'India'),
        ('10000000-0000-0000-0000-000000000005', 'Chennai Central',   'Chennai',   'South', 'Tamil Nadu',  'India'),
        ('10000000-0000-0000-0000-000000000006', 'Hyderabad East',    'Hyderabad', 'South', 'Telangana',   'India'),
        ('10000000-0000-0000-0000-000000000007', 'Kolkata North',     'Kolkata',   'East',  'West Bengal', 'India'),
        ('10000000-0000-0000-0000-000000000008', 'Ahmedabad Central', 'Ahmedabad', 'West',  'Gujarat',     'India')
      ON CONFLICT DO NOTHING
    `);

    // ── Medical Representatives ────────────────────────────────────────────
    console.log('  → Medical Representatives...');
    await client.query(`
      INSERT INTO medical_representatives
        (id, user_id, employee_id, full_name, territory_id, phone, daily_visit_target, monthly_sales_target, status, last_known_lat, last_known_lng)
      VALUES
        ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','EMP-0042','Rajesh Kumar',   '10000000-0000-0000-0000-000000000001','9821001001',10,500000,'active', 19.0760, 72.8777),
        ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005','EMP-0031','Priya Sharma',   '10000000-0000-0000-0000-000000000002','9821002002',10,480000,'active', 18.5204, 73.8567),
        ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000006','EMP-0058','Arjun Mehta',    '10000000-0000-0000-0000-000000000003','9821003003',10,460000,'active', 28.7041, 77.1025),
        ('20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000007','EMP-0027','Sunita Gupta',   '10000000-0000-0000-0000-000000000004','9821004004',10,490000,'active', 12.9716, 77.5946),
        ('20000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000008','EMP-0019','Vikram Nair',    '10000000-0000-0000-0000-000000000005','9821005005',10,420000,'active', 13.0827, 80.2707)
      ON CONFLICT DO NOTHING
    `);

    // ── Products ───────────────────────────────────────────────────────────
    console.log('  → Products...');
    await client.query(`
      INSERT INTO products (id, name, category, sku) VALUES
        ('30000000-0000-0000-0000-000000000001', 'Cardivex 10mg',   'Cardiology',   'CARD-001'),
        ('30000000-0000-0000-0000-000000000002', 'NeuroCal 500mg',  'Neurology',    'NEUR-001'),
        ('30000000-0000-0000-0000-000000000003', 'GlucoMax 850mg',  'Diabetology',  'GLUC-001'),
        ('30000000-0000-0000-0000-000000000004', 'BoneGuard Plus',  'Orthopedics',  'BONE-001'),
        ('30000000-0000-0000-0000-000000000005', 'ImmunoPlus',      'Immunology',   'IMMU-001'),
        ('30000000-0000-0000-0000-000000000006', 'HepaShield 300',  'Gastro',       'HEPA-001'),
        ('30000000-0000-0000-0000-000000000007', 'RespiClear',      'Pulmonology',  'RESP-001')
      ON CONFLICT DO NOTHING
    `);

    // ── Doctors ───────────────────────────────────────────────────────────
    console.log('  → Doctors...');
    await client.query(`
      INSERT INTO doctors
        (name, specialty, qualification, clinic_hospital, address, city, state, latitude, longitude,
         phone, priority, potential_score, visit_frequency_days, assigned_mr_id, territory_id)
      VALUES
        ('Dr. Manoj Kapoor',    'Cardiologist',  'MBBS, MD',    'Lilavati Hospital',     'Bandra West, Mumbai',       'Mumbai',    'Maharashtra',19.0544, 72.8322,'9900101010','high',  9.2, 14,'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
        ('Dr. Rekha Shah',      'Diabetologist', 'MBBS, DNB',   'Hinduja Clinic',        'Mahim, Mumbai',             'Mumbai',    'Maharashtra',19.0330, 72.8397,'9900102020','high',  8.5, 14,'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
        ('Dr. Farhan Shaikh',   'Neurologist',   'MD, DM',      'Kokilaben Hospital',    'Andheri West, Mumbai',      'Mumbai',    'Maharashtra',19.1136, 72.8697,'9900103030','medium',7.1, 21,'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
        ('Dr. Sunita Reddy',    'Neurologist',   'MD, DM',      'Fortis Hospital',       'Koramangala, Bangalore',    'Bangalore', 'Karnataka',  12.9352, 77.6245,'9900104040','medium',7.8, 21,'20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004'),
        ('Dr. Prashant Vyas',   'Diabetologist', 'MBBS, DNB',   'Apollo Clinic',         'Connaught Place, Delhi',    'Delhi',     'Delhi',      28.6315, 77.2167,'9900105050','high',  8.9, 14,'20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003'),
        ('Dr. Kavya Rao',       'Orthopedic',    'MS, MCh',     'Rainbow Hospital',      'Jubilee Hills, Hyderabad',  'Hyderabad', 'Telangana',  17.4126, 78.4071,'9900106060','low',   6.4, 30,'20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004'),
        ('Dr. Ravi Menon',      'General Physician','MBBS',     'Primary Care Clinic',   'T. Nagar, Chennai',         'Chennai',   'Tamil Nadu', 13.0418, 80.2341,'9900107070','medium',5.1, 21,'20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005'),
        ('Dr. Anita Patel',     'Cardiologist',  'MBBS, MD',    'Sterling Hospital',     'Navrangpura, Ahmedabad',    'Ahmedabad', 'Gujarat',    23.0395, 72.5611,'9900108080','high',  8.7, 14,'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
        ('Dr. Suresh Nambiar',  'Pulmonologist', 'MBBS, MD',    'Medicover Hospital',    'Banjara Hills, Hyderabad',  'Hyderabad', 'Telangana',  17.4156, 78.4530,'9900109090','medium',7.3, 21,'20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004'),
        ('Dr. Meena Krishnan',  'Gastroenterologist','MD',      'Manipal Hospital',      'HAL, Bangalore',            'Bangalore', 'Karnataka',  12.9602, 77.6473,'9900110010','medium',6.8, 21,'20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004'),
        ('Dr. Anil Desai',      'Orthopedic',    'MS',          'Sahyadri Hospital',     'Deccan, Pune',              'Pune',      'Maharashtra',18.5088, 73.8394,'9900111011','low',   5.5, 30,'20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002'),
        ('Dr. Pooja Iyer',      'Diabetologist', 'MBBS, MD',    'Meenakshi Mission',     'Madurai, Chennai',          'Chennai',   'Tamil Nadu', 13.0827, 80.2707,'9900112012','high',  8.2, 14,'20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005')
      ON CONFLICT DO NOTHING
    `);

    // ── Customers ──────────────────────────────────────────────────────────
    console.log('  → Customers...');
    await client.query(`
      INSERT INTO customers
        (name, customer_type, address, city, state, latitude, longitude,
         contact_person, phone, visit_frequency_days, monthly_business_potential,
         assigned_mr_id, territory_id)
      VALUES
        ('MedPlus Pharmacy Bandra',      'pharmacy',           'Bandra West, Mumbai',     'Mumbai',    'Maharashtra',19.0596,72.8295,'Ramesh Gupta', '9800201001',7, 85000, '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
        ('Apollo Pharmacy Andheri',      'pharmacy',           'Andheri East, Mumbai',    'Mumbai',    'Maharashtra',19.1197,72.8468,'Sita Rao',     '9800202002',7, 92000, '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
        ('Koramangala Clinic',           'clinic',             'Koramangala, Bangalore',  'Bangalore', 'Karnataka',  12.9352,77.6245,'Dr. Priya',    '9800203003',14,65000, '20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004'),
        ('Fortis Hospital Pharmacy',     'hospital',           'Bannerghatta, Bangalore', 'Bangalore', 'Karnataka',  12.8902,77.5969,'Raj Sharma',   '9800204004',14,180000,'20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004'),
        ('Netmeds Delhi Connaught',      'pharmacy',           'Connaught Place, Delhi',  'Delhi',     'Delhi',      28.6315,77.2167,'Vikrant Singh', '9800205005',7, 74000, '20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003'),
        ('AIIMS Trauma Pharmacy',        'hospital',           'Ansari Nagar, Delhi',     'Delhi',     'Delhi',      28.5672,77.2100,'Meena Lal',    '9800206006',14,250000,'20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003'),
        ('LifeCare Pharmacy Pune',       'pharmacy',           'Kothrud, Pune',           'Pune',      'Maharashtra',18.5088,73.8394,'Abhay Joshi',  '9800207007',7, 68000, '20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002'),
        ('Global Health Clinic Chennai', 'clinic',             'T. Nagar, Chennai',       'Chennai',   'Tamil Nadu', 13.0418,80.2341,'Saranya M',    '9800208008',14,55000, '20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005'),
        ('Sun Pharma Retailer Hyd',      'healthcare_retailer','Banjara Hills, Hyderabad','Hyderabad', 'Telangana',  17.4156,78.4530,'Kiran Reddy',  '9800209009',10,45000, '20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000006'),
        ('Wellness Forever Mumbai',      'pharmacy',           'Juhu, Mumbai',            'Mumbai',    'Maharashtra',19.1001,72.8266,'Farida Khan',  '9800210010',7, 78000, '20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001')
      ON CONFLICT DO NOTHING
    `);

    // ── Visits (last 30 days) ──────────────────────────────────────────────
    console.log('  → Visits...');
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const visitDate = new Date(Date.now() - daysAgo * 86400_000).toISOString().split('T')[0];
      await client.query(`
        INSERT INTO visits
          (mr_id, visit_type, doctor_id, checkin_time, checkout_time,
           checkin_lat, checkin_lng, geo_validation_status, visit_outcome,
           products_discussed, discussion_notes)
        SELECT
          '20000000-0000-0000-0000-000000000001',
          'doctor',
          id,
          ($1::date + (8 + ROW_NUMBER() OVER()) * INTERVAL '45 minutes')::timestamptz,
          ($1::date + (8 + ROW_NUMBER() OVER()) * INTERVAL '45 minutes' + INTERVAL '25 minutes')::timestamptz,
          19.0760 + (RANDOM()-0.5)*0.05,
          72.8777 + (RANDOM()-0.5)*0.05,
          CASE WHEN RANDOM() > 0.1 THEN 'valid' ELSE 'suspicious' END,
          CASE WHEN RANDOM() > 0.3 THEN 'positive' ELSE 'neutral' END,
          ARRAY['Cardivex 10mg','GlucoMax 850mg'],
          'Discussed new clinical data for Cardivex. Doctor showed interest.'
        FROM doctors
        WHERE territory_id='10000000-0000-0000-0000-000000000001'
          AND RANDOM() > 0.4
        LIMIT 6
        ON CONFLICT DO NOTHING
      `, [visitDate]);
    }

    // ── Daily Activity Reports ─────────────────────────────────────────────
    console.log('  → Daily Activity Reports...');
    for (let d = 0; d < 14; d++) {
      const reportDate = new Date(Date.now() - d * 86400_000).toISOString().split('T')[0];
      await client.query(`
        INSERT INTO daily_activity_reports
          (mr_id, report_date, doctor_calls, customer_visits, samples_distributed,
           route_distance_km, market_feedback, is_submitted, submitted_at)
        VALUES
          ('20000000-0000-0000-0000-000000000001',$1,
           floor(6+random()*5)::int, floor(2+random()*4)::int, floor(3+random()*8)::int,
           round((20+random()*40)::numeric,1),
           'Positive market sentiment. Competitor Acme launched new variant.',
           true, ($1::date + INTERVAL '18 hours')::timestamptz),
          ('20000000-0000-0000-0000-000000000002',$1,
           floor(7+random()*5)::int, floor(3+random()*4)::int, floor(4+random()*8)::int,
           round((18+random()*35)::numeric,1),
           'Doctors receptive to GlucoMax. Requesting more samples.',
           true, ($1::date + INTERVAL '18 hours')::timestamptz)
        ON CONFLICT (mr_id, report_date) DO NOTHING
      `, [reportDate]);
    }

    // ── Alerts ────────────────────────────────────────────────────────────
    console.log('  → Alerts...');
    await client.query(`
      INSERT INTO alerts (alert_type, severity, title, message, mr_id, territory_id, is_read)
      VALUES
        ('geo_anomaly',   'critical', 'GPS Anomaly — Arjun Mehta',
         'Check-in was 4.2km from registered clinic location.',
         '20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003', false),
        ('inactive_mr',   'critical', 'MR Inactive — Vikram Nair',
         'No GPS activity for 3+ hours during business hours.',
         '20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005', false),
        ('low_coverage',  'critical', 'Low Coverage — Delhi North',
         'Territory coverage dropped to 49%. Below 60% threshold.',
         '20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003', false),
        ('missed_visit',  'warning',  '7 High-Priority Doctors Overdue',
         'High-priority doctors not visited in 30+ days across Mumbai and Delhi.',
         NULL, NULL, false),
        ('target_failure','warning',  'Monthly Target Risk — Arjun Mehta',
         'Current pace will miss monthly visit target by 38%.',
         '20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003', true),
        ('pending_followup','warning','24 Follow-ups Due Today',
         'Scheduled doctor follow-ups across 6 MRs are pending.',
         NULL, NULL, false),
        ('sample_low',    'info',     'Sample Inventory Low — Cardivex',
         'Remaining stock: 34 units. Reorder threshold reached.',
         NULL, NULL, false)
      ON CONFLICT DO NOTHING
    `);

    // ── Territory Coverage Snapshots (last 6 months) ───────────────────────
    console.log('  → Coverage Snapshots...');
    for (let m = 0; m < 6; m++) {
      const snapDate = new Date(Date.now() - m * 30 * 86400_000).toISOString().split('T')[0];
      await client.query(`
        INSERT INTO territory_coverage_snapshots
          (territory_id, snapshot_date, total_doctors, covered_doctors,
           uncovered_doctors, coverage_percentage, heatmap_score, route_efficiency)
        VALUES
          ('10000000-0000-0000-0000-000000000001',$1, 312, floor(220+random()*60)::int, 70, round((70+random()*15)::numeric,1), round((75+random()*15)::numeric,1), round((68+random()*15)::numeric,1)),
          ('10000000-0000-0000-0000-000000000002',$1, 224, floor(170+random()*40)::int, 40, round((75+random()*15)::numeric,1), round((78+random()*12)::numeric,1), round((70+random()*15)::numeric,1)),
          ('10000000-0000-0000-0000-000000000003',$1, 245, floor(100+random()*60)::int, 120,round((42+random()*18)::numeric,1), round((50+random()*15)::numeric,1), round((55+random()*15)::numeric,1)),
          ('10000000-0000-0000-0000-000000000004',$1, 267, floor(160+random()*50)::int, 80, round((60+random()*15)::numeric,1), round((65+random()*12)::numeric,1), round((62+random()*15)::numeric,1)),
          ('10000000-0000-0000-0000-000000000005',$1, 198, floor(90+random()*40)::int,  100,round((46+random()*14)::numeric,1), round((48+random()*12)::numeric,1), round((50+random()*12)::numeric,1)),
          ('10000000-0000-0000-0000-000000000006',$1, 280, floor(190+random()*50)::int, 60, round((68+random()*15)::numeric,1), round((72+random()*12)::numeric,1), round((65+random()*15)::numeric,1))
        ON CONFLICT (territory_id, snapshot_date) DO NOTHING
      `, [snapDate]);
    }

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
    console.log('\nDefault login credentials:');
    console.log('  Admin:   admin@territoryiq.com      / Admin@123');
    console.log('  Manager: manager.north@territoryiq.com / Manager@123');
    console.log('  MR:      mr.rajesh@territoryiq.com  / MR@12345');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await db.end();
  }
}

seed();
