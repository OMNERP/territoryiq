'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Territory, MedicalRepresentative } from '@/types';
import { useDashboardStore } from '@/store/index';

interface Props {
  territories: Territory[];
  activeLayer: 'coverage' | 'heatmap' | 'density';
}

const MR_COLORS: Record<string, string> = {
  active:  '#34c97e',
  idle:    '#f5a623',
  offline: '#5a6380',
};

const COVERAGE_COLORS = [
  { min: 80, color: '#34c97e' },   // green  ≥ 80%
  { min: 60, color: '#f5a623' },   // amber  60–79%
  { min: 0,  color: '#f05b5b' },   // red    < 60%
];

function coverageColor(pct: number) {
  return COVERAGE_COLORS.find((c) => pct >= c.min)?.color || '#f05b5b';
}

// Hardcoded demo territory centers (would come from DB boundary in production)
const TERRITORY_CENTRES: Record<string, [number, number]> = {
  'Mumbai Central':    [19.0760,  72.8777],
  'Pune West':         [18.5204,  73.8567],
  'Delhi North':       [28.7041,  77.1025],
  'Bangalore South':   [12.9716,  77.5946],
  'Chennai Central':   [13.0827,  80.2707],
  'Hyderabad East':    [17.3850,  78.4867],
  'Kolkata North':     [22.5726,  88.3639],
  'Ahmedabad Central': [23.0225,  72.5714],
};

// Demo MR locations
const DEMO_MRS = [
  { id: '1', name: 'Rajesh Kumar',  lat: 19.0760, lng: 72.8777, status: 'active'  },
  { id: '2', name: 'Priya Sharma',  lat: 18.5204, lng: 73.8567, status: 'active'  },
  { id: '3', name: 'Arjun Mehta',   lat: 28.7041, lng: 77.1025, status: 'idle'    },
  { id: '4', name: 'Sunita Gupta',  lat: 12.9716, lng: 77.5946, status: 'active'  },
  { id: '5', name: 'Vikram Nair',   lat: 13.0827, lng: 80.2707, status: 'offline' },
];

const DEMO_DOCTORS = [
  { name: 'Dr. Kapoor',  lat: 19.0544, lng: 72.8322 },
  { name: 'Dr. Shah',    lat: 19.0330, lng: 72.8397 },
  { name: 'Dr. Reddy',   lat: 12.9352, lng: 77.6245 },
  { name: 'Dr. Vyas',    lat: 28.6315, lng: 77.2167 },
  { name: 'Dr. Menon',   lat: 13.0418, lng: 80.2341 },
  { name: 'Dr. Rao',     lat: 17.4126, lng: 78.4071 },
];

export default function TerritoryMap({ territories, activeLayer }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapObj    = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    // Init map centred on India
    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Attribution (small)
    L.control.attribution({ position: 'bottomleft', prefix: '© OSM' }).addTo(map);

    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; };
  }, []);

  // Re-draw layers when activeLayer or territories change
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;

    // Clear old layers
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    const add = (layer: L.Layer) => {
      layer.addTo(map);
      layersRef.current.push(layer);
    };

    // ── Territory circles ───────────────────────────────────────────────────
    const terrsToRender = territories.length
      ? territories
      : Object.entries(TERRITORY_CENTRES).map(([name, [lat, lng]]) => ({
          name, coveragePct: Math.random() * 60 + 30,
        }));

    terrsToRender.forEach((t: any) => {
      const centre = TERRITORY_CENTRES[t.name];
      if (!centre) return;
      const [lat, lng] = centre;
      const pct  = t.coveragePct || t.coverage_pct || 65;
      const col  = coverageColor(pct);

      const circle = L.circle([lat, lng], {
        radius:      activeLayer === 'heatmap' ? 60_000 : 45_000,
        fillColor:   col,
        fillOpacity: activeLayer === 'heatmap' ? 0.35 : 0.18,
        color:       col,
        weight:      1.5,
        opacity:     0.7,
      });
      circle.bindPopup(`
        <div style="min-width:180px">
          <p style="font-weight:600;margin-bottom:4px">${t.name}</p>
          <p style="color:#8b93a8;font-size:12px">Coverage: <strong style="color:${col}">${pct.toFixed ? pct.toFixed(1) : pct}%</strong></p>
          <p style="color:#8b93a8;font-size:12px">MR: ${t.mrName || t.mr_name || '—'}</p>
        </div>
      `);
      add(circle);
    });

    // ── MR live markers ────────────────────────────────────────────────────
    DEMO_MRS.forEach((mr) => {
      const col = MR_COLORS[mr.status];
      const icon = L.divIcon({
        html: `
          <div style="width:14px;height:14px;border-radius:50%;background:${col};
                      border:2px solid rgba(255,255,255,0.6);
                      box-shadow:0 0 0 4px ${col}33;
                      ${mr.status==='active'?'animation:none':''}">
          </div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const m = L.marker([mr.lat, mr.lng], { icon });
      m.bindTooltip(`<strong>${mr.name}</strong><br><small>${mr.status}</small>`, {
        permanent: false, direction: 'top', className: 'leaflet-tooltip-dark',
      });
      add(m);
    });

    // ── Doctor pins ──────────────────────────────────────────────────────
    if (activeLayer !== 'heatmap') {
      DEMO_DOCTORS.forEach((d) => {
        const icon = L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:#4f8ef7;
                             border:2px solid rgba(255,255,255,0.5);opacity:0.85"></div>`,
          className: '',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        const m = L.marker([d.lat, d.lng], { icon });
        m.bindTooltip(d.name, { permanent: false, direction: 'top' });
        add(m);
      });
    }
  }, [territories, activeLayer]);

  return (
    <div style={{ height: 380, position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '0 0 14px 14px' }} />

      {/* Legend overlay */}
      <div style={{
        position: 'absolute', bottom: 14, right: 14, zIndex: 999,
        background: 'rgba(10,14,26,0.88)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '10px 14px', fontSize: 11,
      }}>
        <p style={{ color: '#5a6380', fontWeight: 600, letterSpacing: '0.8px', marginBottom: 6, textTransform: 'uppercase' }}>Legend</p>
        {[
          { color: '#34c97e', label: 'Active MR' },
          { color: '#f5a623', label: 'Idle MR' },
          { color: '#5a6380', label: 'Offline MR' },
          { color: '#4f8ef7', label: 'Doctor Pin' },
          { color: '#34c97e', label: '≥80% Coverage', opacity: 0.5 },
          { color: '#f5a623', label: '60–80%',        opacity: 0.5 },
          { color: '#f05b5b', label: '<60%',           opacity: 0.5 },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: item.color, opacity: item.opacity ?? 1,
            }} />
            <span style={{ color: '#8b93a8' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
