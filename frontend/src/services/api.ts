import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;

          if (this.refreshing) {
            return new Promise((resolve) => {
              this.refreshQueue.push((token) => {
                original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
                resolve(this.client(original));
              });
            });
          }

          this.refreshing = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
            localStorage.setItem('accessToken', data.accessToken);

            this.refreshQueue.forEach((cb) => cb(data.accessToken));
            this.refreshQueue = [];
            this.refreshing = false;

            original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
            return this.client(original);
          } catch {
            this.refreshing = false;
            this.refreshQueue = [];
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined') window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get instance() { return this.client; }
}

export const api = new ApiClient().instance;

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  logout:  (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me:      () => api.get('/auth/me'),
};

// ── Analytics API ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard:           () => api.get('/analytics/dashboard'),
  coverageTrend:       (months = 6, territoryId?: string) =>
    api.get('/analytics/coverage/trend', { params: { months, territoryId } }),
  mrProductivity:      (from?: string, to?: string, territoryId?: string) =>
    api.get('/analytics/mr-productivity', { params: { from, to, territoryId } }),
  territoryComparison: () => api.get('/analytics/territory-comparison'),
  visitHeatmap:        (from?: string, territoryId?: string) =>
    api.get('/analytics/visit-heatmap', { params: { from, territoryId } }),
  productPerformance:  (from?: string) =>
    api.get('/analytics/product-performance', { params: { from } }),
};

// ── MR API ────────────────────────────────────────────────────────────────────
export const mrApi = {
  list:    (params?: Record<string, any>) => api.get('/mrs', { params }),
  live:    ()                             => api.get('/mrs/live'),
  get:     (id: string)                  => api.get(`/mrs/${id}`),
  create:  (data: Record<string, any>)   => api.post('/mrs', data),
  update:  (id: string, data: Record<string, any>) => api.patch(`/mrs/${id}`, data),
};

// ── Territory API ─────────────────────────────────────────────────────────────
export const territoryApi = {
  list:     (params?: Record<string, any>) => api.get('/territories', { params }),
  get:      (id: string)                   => api.get(`/territories/${id}`),
  create:   (data: Record<string, any>)    => api.post('/territories', data),
};

// ── Doctor API ────────────────────────────────────────────────────────────────
export const doctorApi = {
  list:   (params?: Record<string, any>) => api.get('/doctors', { params }),
  get:    (id: string)                   => api.get(`/doctors/${id}`),
  create: (data: Record<string, any>)    => api.post('/doctors', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/doctors/${id}`, data),
};

// ── Customer API ───────────────────────────────────────────────────────────────
export const customerApi = {
  list:   (params?: Record<string, any>) => api.get('/customers', { params }),
  get:    (id: string)                   => api.get(`/customers/${id}`),
  create: (data: Record<string, any>)    => api.post('/customers', data),
};

// ── Visit API ─────────────────────────────────────────────────────────────────
export const visitApi = {
  list:     (params?: Record<string, any>) => api.get('/visits', { params }),
  get:      (id: string)                   => api.get(`/visits/${id}`),
  checkin:  (data: Record<string, any>)    => api.post('/visits/checkin', data),
  checkout: (id: string, data: Record<string, any>) => api.put(`/visits/${id}/checkout`, data),
  today:    (mrId: string)                 => api.get(`/visits/today/${mrId}`),
  logGps:   (data: { latitude: number; longitude: number; accuracy?: number }) =>
    api.post('/visits/gps', data),
};

// ── Alert API ─────────────────────────────────────────────────────────────────
export const alertApi = {
  list:    (params?: Record<string, any>) => api.get('/alerts', { params }),
  read:    (id: string)                   => api.patch(`/alerts/${id}/read`),
  resolve: (id: string)                   => api.patch(`/alerts/${id}/resolve`),
};

// ── Geo API ───────────────────────────────────────────────────────────────────
export const geoApi = {
  geocode:        (address: string)           => api.get('/geo/geocode', { params: { address } }),
  reverse:        (lat: number, lng: number)  => api.get('/geo/reverse', { params: { lat, lng } }),
  optimizeRoute:  (data: Record<string, any>) => api.post('/geo/optimize-route', data),
  nearbyDoctors:  (lat: number, lng: number, radius?: number) =>
    api.get('/geo/nearby/doctors', { params: { lat, lng, radius } }),
  routeReplay:    (mrId: string, date?: string) =>
    api.get(`/geo/mr/${mrId}/route-replay`, { params: { date } }),
};

// ── Report API ────────────────────────────────────────────────────────────────
export const reportApi = {
  dailyActivity:    (params?: Record<string, any>) => api.get('/reports/daily-activity', { params }),
  visitCompliance:  (params?: Record<string, any>) => api.get('/reports/visit-compliance', { params }),
};

// ── Product API ───────────────────────────────────────────────────────────────
export const productApi = {
  list:   () => api.get('/products'),
  create: (data: Record<string, any>) => api.post('/products', data),
};

// ── DAR API ───────────────────────────────────────────────────────────────────
export const darApi = {
  list:   (params?: Record<string, any>) => api.get('/dar', { params }),
  today:  ()                             => api.get('/dar/today'),
  save:   (data: Record<string, any>)    => api.post('/dar', data),
  submit: (id: string)                   => api.patch(`/dar/${id}/submit`),
};
