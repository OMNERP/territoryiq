import { create } from 'zustand';
import { DashboardStats, Alert, Territory, MedicalRepresentative } from '@/types';
import { analyticsApi, alertApi, mrApi, territoryApi } from '@/services/api';

// ── UI Store ─────────────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// ── Dashboard Store ───────────────────────────────────────────────────────────
interface DashboardState {
  stats: DashboardStats | null;
  alerts: Alert[];
  liveMrs: MedicalRepresentative[];
  territories: Territory[];
  isLoading: boolean;
  lastFetched: number | null;

  fetchDashboard: () => Promise<void>;
  fetchLiveMrs:   () => Promise<void>;
  fetchTerritories: () => Promise<void>;
  markAlertRead:  (id: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats:       null,
  alerts:      [],
  liveMrs:     [],
  territories: [],
  isLoading:   false,
  lastFetched: null,

  fetchDashboard: async () => {
    // Throttle: don't re-fetch if fetched < 60s ago
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < 60_000) return;

    set({ isLoading: true });
    try {
      const [statsRes, alertsRes] = await Promise.all([
        analyticsApi.dashboard(),
        alertApi.list({ isRead: false, limit: 20 }),
      ]);
      set({
        stats:      statsRes.data,
        alerts:     alertsRes.data.alerts,
        isLoading:  false,
        lastFetched: Date.now(),
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchLiveMrs: async () => {
    try {
      const { data } = await mrApi.live();
      set({ liveMrs: data.mrs });
    } catch {}
  },

  fetchTerritories: async () => {
    try {
      const { data } = await territoryApi.list();
      set({ territories: data.territories });
    } catch {}
  },

  markAlertRead: async (id) => {
    await alertApi.read(id);
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    }));
  },
}));

// ── Map Store ─────────────────────────────────────────────────────────────────
interface MapState {
  center: [number, number];
  zoom: number;
  activeLayer: 'coverage' | 'heatmap' | 'density' | 'routes';
  setCenter: (c: [number, number]) => void;
  setZoom: (z: number) => void;
  setActiveLayer: (l: MapState['activeLayer']) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [20.5937, 78.9629],   // India centre
  zoom: 5,
  activeLayer: 'coverage',
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
}));
