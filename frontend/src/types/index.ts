// ── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'sales_manager'
  | 'regional_manager'
  | 'medical_representative'
  | 'marketing_manager';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  mrId?: string;
  fullName?: string;
  employeeId?: string;
  territoryId?: string;
  territoryName?: string;
}

// ── MR ───────────────────────────────────────────────────────────────────────
export type MRStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type LiveStatus = 'active' | 'idle' | 'offline';

export interface MedicalRepresentative {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  territoryId?: string;
  territoryName?: string;
  managerId?: string;
  managerName?: string;
  phone?: string;
  email?: string;
  status: MRStatus;
  gpsTrackingEnabled: boolean;
  dailyVisitTarget: number;
  monthlySalesTarget: number;
  assignedCities?: string[];
  lastActiveAt?: string;
  lastKnownLat?: number;
  lastKnownLng?: number;
  lastGpsUpdate?: string;
  // computed
  visitsToday?: number;
  visitsMonth?: number;
  targetPct?: number;
  liveStatus?: LiveStatus;
}

// ── Territory ────────────────────────────────────────────────────────────────
export interface Territory {
  id: string;
  name: string;
  city: string;
  region: string;
  state?: string;
  country: string;
  mrId?: string;
  mrName?: string;
  totalDoctors: number;
  coveredDoctors30d: number;
  totalCustomers: number;
  coveragePct: number;
  heatmapScore: number;
  routeEfficiencyScore: number;
  isActive: boolean;
}

// ── Doctor ───────────────────────────────────────────────────────────────────
export type DoctorPriority = 'high' | 'medium' | 'low';

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  qualification?: string;
  clinicHospital?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  visitFrequencyDays: number;
  priority: DoctorPriority;
  potentialScore: number;
  preferredProducts?: string[];
  lastVisitDate?: string;
  assignedMrId?: string;
  mrName?: string;
  territoryId?: string;
  territoryName?: string;
  notes?: string;
  isActive: boolean;
  recentVisits?: Visit[];
}

// ── Customer ─────────────────────────────────────────────────────────────────
export type CustomerType = 'pharmacy' | 'clinic' | 'hospital' | 'healthcare_retailer';

export interface Customer {
  id: string;
  name: string;
  customerType: CustomerType;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  phone?: string;
  email?: string;
  visitFrequencyDays: number;
  assignedMrId?: string;
  mrName?: string;
  territoryId?: string;
  productInterests?: string[];
  monthlyBusinessPotential: number;
  lastVisitDate?: string;
  notes?: string;
  isActive: boolean;
}

// ── Visit ─────────────────────────────────────────────────────────────────────
export type VisitType = 'doctor' | 'customer';
export type GeoValidationStatus = 'valid' | 'invalid' | 'suspicious' | 'unverified';
export type VisitOutcome = 'positive' | 'neutral' | 'negative' | 'follow_up_required';

export interface Visit {
  id: string;
  mrId: string;
  mrName?: string;
  employeeId?: string;
  visitType: VisitType;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  customerId?: string;
  customerName?: string;
  customerType?: CustomerType;
  checkinTime: string;
  checkoutTime?: string;
  durationMinutes?: number;
  checkinLat?: number;
  checkinLng?: number;
  geoValidationStatus: GeoValidationStatus;
  geoDistanceMeters?: number;
  discussionNotes?: string;
  productsDiscussed?: string[];
  samplesGiven?: Array<{ productId: string; quantity: number }>;
  followupDate?: string;
  competitorActivity?: string;
  visitOutcome: VisitOutcome;
  photoUrls?: string[];
  voiceNoteUrl?: string;
  createdAt: string;
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType =
  | 'missed_visit' | 'low_coverage' | 'geo_anomaly' | 'inactive_mr'
  | 'pending_followup' | 'target_failure' | 'sample_low';

export interface Alert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  mrId?: string;
  mrName?: string;
  territoryId?: string;
  doctorId?: string;
  customerId?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  sku?: string;
  isActive: boolean;
}

// ── DAR ───────────────────────────────────────────────────────────────────────
export interface DailyActivityReport {
  id: string;
  mrId: string;
  mrName?: string;
  reportDate: string;
  doctorCalls: number;
  customerVisits: number;
  samplesDistributed: number;
  competitorActivities?: string;
  marketFeedback?: string;
  routeDistanceKm?: number;
  isSubmitted: boolean;
  submittedAt?: string;
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
export interface DashboardStats {
  coverage: {
    doctorCoverage: number;
    customerCoverage: number;
    totalDoctors: number;
    coveredDoctors: number;
    totalCustomers: number;
    coveredCustomers: number;
  };
  mrs: {
    total: number;
    active: number;
    onlineNow: number;
  };
  visits: {
    today: number;
    validToday: number;
    invalidToday: number;
    avgDuration: number;
  };
  alerts: Record<string, number>;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ── Map ───────────────────────────────────────────────────────────────────────
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  type: 'mr' | 'doctor' | 'customer';
  label: string;
  status?: string;
  color?: string;
}
