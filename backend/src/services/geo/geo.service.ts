import axios from 'axios';
import { cache } from '../../config/redis';
import { logger } from '../../utils/logger';

const NOMINATIM_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const OSRM_URL      = process.env.OSRM_BASE_URL      || 'https://router.project-osrm.org';

export interface LatLng { lat: number; lng: number; }
export interface RouteResult {
  distance: number;   // metres
  duration: number;   // seconds
  geometry: string;   // encoded polyline
  waypoints: LatLng[];
}

export const geoService = {
  // ── Haversine distance (metres) ────────────────────────────────────────────
  haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  // ── Geocode address → lat/lng (Nominatim) ─────────────────────────────────
  async geocode(address: string): Promise<LatLng | null> {
    const cacheKey = `geo:geocode:${address}`;
    const cached = await cache.get<LatLng>(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(`${NOMINATIM_URL}/search`, {
        params: { q: address, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'TerritoryIQ/1.0' },
        timeout: 5000,
      });
      if (!res.data[0]) return null;
      const result = { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
      await cache.set(cacheKey, result, 86400); // cache 24h
      return result;
    } catch (err) {
      logger.error('Geocode error:', err);
      return null;
    }
  },

  // ── Reverse geocode lat/lng → address ────────────────────────────────────
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const cacheKey = `geo:reverse:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = await cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(`${NOMINATIM_URL}/reverse`, {
        params: { lat, lon: lng, format: 'json' },
        headers: { 'User-Agent': 'TerritoryIQ/1.0' },
        timeout: 5000,
      });
      const address = res.data.display_name || null;
      if (address) await cache.set(cacheKey, address, 86400);
      return address;
    } catch (err) {
      logger.error('Reverse geocode error:', err);
      return null;
    }
  },

  // ── OSRM route planning ───────────────────────────────────────────────────
  async getRoute(waypoints: LatLng[]): Promise<RouteResult | null> {
    if (waypoints.length < 2) return null;

    const coords = waypoints.map(p => `${p.lng},${p.lat}`).join(';');
    const cacheKey = `geo:route:${coords}`;
    const cached = await cache.get<RouteResult>(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(
        `${OSRM_URL}/route/v1/driving/${coords}?overview=simplified&geometries=polyline`,
        { timeout: 8000 }
      );
      if (res.data.code !== 'Ok') return null;

      const route = res.data.routes[0];
      const result: RouteResult = {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        waypoints: res.data.waypoints.map((w: any) => ({
          lat: w.location[1],
          lng: w.location[0],
        })),
      };
      await cache.set(cacheKey, result, 3600); // cache 1h
      return result;
    } catch (err) {
      logger.error('OSRM route error:', err);
      return null;
    }
  },

  // ── Optimize route order (nearest-neighbour heuristic) ────────────────────
  optimizeRoute(start: LatLng, stops: LatLng[]): LatLng[] {
    if (stops.length <= 1) return stops;
    const remaining = [...stops];
    const result: LatLng[] = [];
    let current = start;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = this.haversineDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }

      result.push(remaining[nearestIdx]);
      current = remaining[nearestIdx];
      remaining.splice(nearestIdx, 1);
    }

    return result;
  },

  // ── Find nearby entities within radius (uses DB geo query) ───────────────
  async findNearbyDoctors(db: any, lat: number, lng: number, radiusKm = 5): Promise<any[]> {
    const { rows } = await db.query(
      `SELECT id, name, specialty, latitude, longitude,
              ST_Distance(geo_point, ST_MakePoint($2,$1)::GEOGRAPHY) AS distance_m
       FROM doctors
       WHERE ST_DWithin(
         geo_point,
         ST_MakePoint($2,$1)::GEOGRAPHY,
         $3
       ) AND is_active = true
       ORDER BY distance_m
       LIMIT 20`,
      [lat, lng, radiusKm * 1000]
    );
    return rows;
  },

  // ── Compute route efficiency score (0-100) ────────────────────────────────
  computeRouteEfficiency(actualDistanceKm: number, optimizedDistanceKm: number): number {
    if (actualDistanceKm <= 0) return 0;
    if (optimizedDistanceKm <= 0) return 100;
    const efficiency = (optimizedDistanceKm / actualDistanceKm) * 100;
    return Math.min(100, Math.round(efficiency));
  },
};
