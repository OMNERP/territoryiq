'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDashboardStore } from '@/store/index';
import { PageHeader } from '@/components/layout/PageHeader';
import { TerritoryTable } from '@/components/territory/TerritoryTable';
import { KpiCard } from '@/components/dashboard/KpiCard';

// Leaflet must be client-only
const TerritoryMap = dynamic(() => import('@/components/map/TerritoryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] bg-bg-3 rounded-b-[14px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-3">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-sm">Loading territory map...</span>
      </div>
    </div>
  ),
});

export default function TerritoryPage() {
  const { territories, fetchTerritories } = useDashboardStore();
  const [activeLayer, setActiveLayer] = useState<'coverage' | 'heatmap' | 'density'>('coverage');

  useEffect(() => { fetchTerritories(); }, []);

  const atRisk   = territories.filter((t) => (t.coveragePct || 0) < 60).length;
  const avgCov   = territories.length
    ? (territories.reduce((s, t) => s + (t.coveragePct || 0), 0) / territories.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Territory Intelligence Map"
        subtitle="Coverage heatmaps, MR tracking, and territory boundaries"
        actions={
          <button className="btn-secondary">
            ⬇ Export Report
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Territories" value={territories.length || 24} icon="🗺" color="blue" compact />
        <KpiCard label="Avg Coverage"      value={`${avgCov}%`}             icon="%" color="green"  compact />
        <KpiCard label="At Risk"           value={atRisk || 3}              icon="⚠️" color="amber"  compact />
        <KpiCard label="Heatmap Score"     value="82"                       icon="🔥" color="cyan"   compact />
      </div>

      {/* Map */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-display font-semibold text-sm">Live Territory Intelligence Map</h3>
          <div className="flex gap-2">
            {(['coverage', 'heatmap', 'density'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={activeLayer === layer ? 'tag tag-green' : 'tag tag-gray'}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <TerritoryMap territories={territories} activeLayer={activeLayer} />
      </div>

      {/* Territory table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-display font-semibold text-sm">Territory Performance</h3>
        </div>
        <TerritoryTable territories={territories} />
      </div>
    </div>
  );
}
