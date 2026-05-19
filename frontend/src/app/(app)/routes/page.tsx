'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-bg-3 rounded-b-[14px] flex items-center justify-center text-text-3">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading route map...</p>
      </div>
    </div>
  ),
});

const ROUTE_STOPS = [
  { id:'1', name:'Start: Office — Andheri',    type:'start',    lat:19.1197, lng:72.8468, time:'09:00', duration:0 },
  { id:'2', name:'Dr. Manoj Kapoor (Cardiologist)', type:'doctor',   lat:19.0544, lng:72.8322, time:'09:30', duration:25 },
  { id:'3', name:'MedPlus Pharmacy Bandra',    type:'pharmacy', lat:19.0596, lng:72.8295, time:'10:15', duration:20 },
  { id:'4', name:'Dr. Rekha Shah (Diabetologist)',  type:'doctor',   lat:19.0330, lng:72.8397, time:'11:00', duration:25 },
  { id:'5', name:'Apollo Pharmacy Andheri',    type:'pharmacy', lat:19.1197, lng:72.8468, time:'12:15', duration:20 },
  { id:'6', name:'Dr. Farhan Shaikh (Neurologist)', type:'doctor',   lat:19.1136, lng:72.8697, time:'14:00', duration:30 },
];

const STOP_ICON: Record<string, string> = {
  start: '🏢', doctor: '⚕️', pharmacy: '💊', hospital: '🏥', end: '🏁',
};

export default function RoutesPage() {
  const [selectedMr, setMr] = useState('Rajesh Kumar');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Route Intelligence Planner"
        subtitle="OSRM-powered route optimization and daily plan management"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary">↻ Optimize</button>
            <button className="btn-primary">📤 Send to MR</button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Stops"       value={6}      icon="📍" color="blue"   compact />
        <KpiCard label="Est. Distance"     value="48 km"  icon="🛣"  color="green"  compact />
        <KpiCard label="Est. Duration"     value="6.5 hr" icon="⏱"  color="amber"  compact />
        <KpiCard label="Route Efficiency"  value="82%"    icon="⚡"  color="cyan"   compact />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stop list */}
        <div className="card">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Today's Route Plan</h3>
            <select
              value={selectedMr}
              onChange={e => setMr(e.target.value)}
              className="text-xs bg-bg-4 border border-white/10 rounded px-2 py-1 text-text-2"
            >
              <option>Rajesh Kumar</option>
              <option>Priya Sharma</option>
              <option>Sunita Gupta</option>
            </select>
          </div>
          <div className="p-4">
            {ROUTE_STOPS.map((stop, i) => (
              <div key={stop.id}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-bg-4 border border-white/10 flex items-center justify-center text-sm flex-shrink-0">
                      {STOP_ICON[stop.type]}
                    </div>
                    {i < ROUTE_STOPS.length - 1 && <div className="w-px flex-1 bg-white/[0.06] my-1" style={{ minHeight: 20 }} />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{stop.name}</p>
                      <span className="text-xs text-text-3 whitespace-nowrap">{stop.time}</span>
                    </div>
                    {stop.duration > 0 && (
                      <p className="text-xs text-text-3 mt-0.5">~{stop.duration} min visit</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Efficiency bar */}
          <div className="p-4 border-t border-white/[0.06] bg-bg-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-3">Route Efficiency Score</span>
              <span className="text-xs font-bold text-success">82%</span>
            </div>
            <div className="h-1.5 bg-bg-4 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '82%' }} />
            </div>
            <p className="text-[11px] text-text-3 mt-2">Optimized: saves 12km vs unplanned route</p>
          </div>
        </div>

        {/* Route map */}
        <div className="card lg:col-span-2">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">Route Map — {selectedMr}</h3>
          </div>
          <RouteMap stops={ROUTE_STOPS} />
        </div>
      </div>
    </div>
  );
}
