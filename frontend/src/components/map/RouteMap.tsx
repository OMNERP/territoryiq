'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Stop { id: string; name: string; type: string; lat: number; lng: number; time: string; }

const STOP_COLORS: Record<string, string> = {
  start:    '#34c97e',
  doctor:   '#4f8ef7',
  pharmacy: '#7c6ff7',
  hospital: '#26d4d4',
  end:      '#f05b5b',
};

export default function RouteMap({ stops }: { stops: Stop[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const map = L.map(mapRef.current, {
      center: [19.076, 72.877],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Plot stop markers
    stops.forEach((stop, i) => {
      const color = STOP_COLORS[stop.type] || '#8b93a8';

      const icon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;border-radius:50%;
          background:${color};
          border:2px solid rgba(255,255,255,0.7);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:700;font-size:12px;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">${i + 1}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon });
      marker.bindPopup(`
        <div style="min-width:160px">
          <p style="font-weight:600;margin-bottom:4px;font-size:13px">${stop.name}</p>
          <p style="color:#8b93a8;font-size:11px">📍 Stop ${i + 1} · ${stop.time}</p>
        </div>
      `);
      marker.addTo(map);
    });

    // Draw route polyline
    if (stops.length >= 2) {
      const latlngs: [number, number][] = stops.map(s => [s.lat, s.lng]);
      L.polyline(latlngs, {
        color: '#4f8ef7',
        weight: 3,
        opacity: 0.7,
        dashArray: undefined,
      }).addTo(map);

      // Fit to bounds
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  return (
    <div ref={mapRef} style={{ height: 400, borderRadius: '0 0 14px 14px' }} />
  );
}
