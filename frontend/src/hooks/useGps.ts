'use client';
import { useEffect, useRef, useCallback } from 'react';
import { visitApi } from '@/services/api';
import { emitGpsUpdate } from './useSocket';
import { useAuthStore } from '@/store/auth.store';

const GPS_INTERVAL_MS = 60_000; // ping every 60s

export function useGpsTracking(enabled = true) {
  const { user } = useAuthStore();
  const watchId  = useRef<number | null>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const lastPos  = useRef<GeolocationCoordinates | null>(null);

  const sendPosition = useCallback(async (pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = pos.coords;
    lastPos.current = pos.coords;

    // Send via WebSocket (low latency)
    emitGpsUpdate(latitude, longitude, accuracy);

    // Persist to DB via REST (resilient)
    try {
      await visitApi.logGps({ latitude, longitude, accuracy });
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled || user?.role !== 'medical_representative') return;
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    // Watch position continuously
    watchId.current = navigator.geolocation.watchPosition(
      sendPosition,
      (err) => console.warn('GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );

    // Fallback interval ping
    interval.current = setInterval(() => {
      if (lastPos.current) {
        emitGpsUpdate(lastPos.current.latitude, lastPos.current.longitude);
      }
    }, GPS_INTERVAL_MS);

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (interval.current) clearInterval(interval.current);
    };
  }, [enabled, user?.role, sendPosition]);

  const getCurrentPosition = (): Promise<GeolocationCoordinates> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        reject,
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    });

  return { getCurrentPosition, lastPosition: lastPos.current };
}
