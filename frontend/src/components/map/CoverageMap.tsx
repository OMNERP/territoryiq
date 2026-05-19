'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Props { view: string; }

// Simulated heatmap points (lat, lng, intensity)
const HEAT_POINTS = [
  [19.076, 72.877, 0.9], [19.054, 72.832, 0.7], [19.033, 72.840, 0.8],
  [19.113, 72.869, 0.6], [18.520, 73.856, 0.95],[18.508, 73.839, 0.8],
  [28.704, 77.102, 0.4], [28.631, 77.216, 0.3], [28.567, 77.210, 0.5],
  [12.971, 77.594, 0.7], [12.935, 77.624, 0.65],[12.960, 77.647, 0.7],
  [13.082, 80.270, 0.4], [13.041, 80.234, 0.5],
  [17.385, 78.486, 0.75],[17.412, 78.407, 0.7],
  [22.572, 88.363, 0.7],
  [23.022, 72.571, 0.82],
];

// Gap zones (low coverage areas)
const GAP_ZONES = [
  { lat: 28.704, lng: 77.102, radius: 35000, label: 'Delhi North — 49% coverage' },
  { lat: 13.082, lng: 80.270, radius: 28000, label: 'Chennai Central — 49% coverage' },
  { lat: 18.508, lng: 73.839, radius: 20000, label: 'Pune East — 58% coverage' },
];

export default function CoverageMap({ view }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapObj  = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    const map = L.map(mapRef.current, {
      center: [20.59, 78.96],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;

    // Clear old layers
    layerRef.current.forEach(l => map.removeLayer(l));
    layerRef.current = [];

    const add = (l: L.Layer) => { l.addTo(map); layerRef.current.push(l); };

    if (view === 'heatmap') {
      // Simulate heatmap with colored circles
      HEAT_POINTS.forEach(([lat, lng, intensity]) => {
        const alpha = 0.2 + intensity * 0.4;
        const color = intensity > 0.75 ? '#34c97e' : intensity > 0.5 ? '#f5a623' : '#f05b5b';
        add(L.circle([lat, lng], {
          radius: 20000 + intensity * 15000,
          fillColor: color,
          fillOpacity: alpha,
          color: color,
          weight: 0,
        }));
      });
    } else if (view === 'gaps') {
      // Show gap (low coverage) zones in red
      GAP_ZONES.forEach(zone => {
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          fillColor: '#f05b5b',
          fillOpacity: 0.25,
          color: '#f05b5b',
          weight: 2,
          dashArray: '6 4',
        });
        circle.bindPopup(`<div style="min-width:160px"><p style="color:#f05b5b;font-weight:600">⚠️ Coverage Gap</p><p style="font-size:12px;color:#8b93a8;margin-top:4px">${zone.label}</p></div>`);
        add(circle);

        // Warning icon marker
        add(L.marker([zone.lat, zone.lng], {
          icon: L.divIcon({
            html: `<div style="background:#f05b5b;color:#fff;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3)">⚠️ GAP ZONE</div>`,
            className: '',
            iconAnchor: [40, 10],
          }),
        }));
      });
    } else if (view === 'density') {
      // Doctor density dots
      HEAT_POINTS.forEach(([lat, lng, intensity]) => {
        const count = Math.round(intensity * 50);
        for (let i = 0; i < Math.min(count, 8); i++) {
          const jLat = lat + (Math.random() - 0.5) * 0.15;
          const jLng = lng + (Math.random() - 0.5) * 0.15;
          add(L.circleMarker([jLat, jLng], {
            radius: 4,
            fillColor: '#4f8ef7',
            fillOpacity: 0.7,
            color: 'rgba(79,142,247,0.3)',
            weight: 1,
          }));
        }
      });
    }
  }, [view]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height: 360, borderRadius: '0 0 14px 14px' }} />
      <div style={{
        position: 'absolute', bottom: 12, right: 12, zIndex: 999,
        background: 'rgba(10,14,26,0.88)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '8px 12px', fontSize: 11,
      }}>
        <p style={{ color: '#5a6380', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {view === 'heatmap' ? 'Visit Intensity' : view === 'gaps' ? 'Gap Zones' : 'Doctor Density'}
        </p>
        {view === 'heatmap' && [
          ['#34c97e', '≥75% Coverage'],
          ['#f5a623', '50–75% Coverage'],
          ['#f05b5b', '<50% Coverage'],
        ].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
            <span style={{ color: '#8b93a8' }}>{l}</span>
          </div>
        ))}
        {view === 'gaps' && <span style={{ color: '#f05b5b' }}>Red zones = below 60%</span>}
        {view === 'density' && <span style={{ color: '#4f8ef7' }}>Each dot = registered doctor</span>}
      </div>
    </div>
  );
}
