'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { CoverageByType } from '@/components/dashboard/index';
import { FilterChips } from '@/components/ui/index';

const CoverageMap = dynamic(() => import('@/components/map/CoverageMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] bg-bg-3 rounded-b-[14px] flex items-center justify-center text-text-3">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading coverage map…</p>
      </div>
    </div>
  ),
});

const VIEW_FILTERS = [
  { value: 'heatmap',  label: '🔥 Heatmap' },
  { value: 'gaps',     label: '⚠️ Gap Zones' },
  { value: 'density',  label: '📍 Doctor Density' },
];

const COVERAGE_TABLE = [
  { territory:'Mumbai Central',   total:312, covered:248, pct:79.5, gap:64,  score:88 },
  { territory:'Pune West',        total:224, covered:198, pct:88.4, gap:26,  score:95 },
  { territory:'Delhi North',      total:245, covered:121, pct:49.4, gap:124, score:51 },
  { territory:'Bangalore South',  total:267, covered:176, pct:65.9, gap:91,  score:70 },
  { territory:'Chennai Central',  total:198, covered:98,  pct:49.5, gap:100, score:46 },
  { territory:'Hyderabad East',   total:280, covered:214, pct:76.4, gap:66,  score:81 },
  { territory:'Kolkata North',    total:230, covered:178, pct:77.4, gap:52,  score:80 },
  { territory:'Ahmedabad Central',total:195, covered:160, pct:82.1, gap:35,  score:86 },
];

export default function CoveragePage() {
  const [view, setView] = useState('heatmap');

  const totalDoctors  = COVERAGE_TABLE.reduce((s, r) => s + r.total,   0);
  const totalCovered  = COVERAGE_TABLE.reduce((s, r) => s + r.covered, 0);
  const totalGap      = COVERAGE_TABLE.reduce((s, r) => s + r.gap,     0);
  const avgCoverage   = (totalCovered / totalDoctors * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Coverage Intelligence"
        subtitle="Heatmaps, gap detection, and territory density analysis"
        actions={
          <button className="btn-secondary">⬇ Export Report</button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Doctors"     value={totalDoctors.toLocaleString()} icon="⚕️" color="blue"   compact />
        <KpiCard label="Covered (30d)"     value={totalCovered.toLocaleString()} icon="✅"  color="green"  compact />
        <KpiCard label="Coverage Gap"      value={totalGap.toLocaleString()}     icon="⚠️"  color="amber"  compact />
        <KpiCard label="Avg Coverage"      value={`${avgCoverage}%`}             icon="📊"  color="cyan"   compact />
      </div>

      {/* Map */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-display font-semibold text-sm">Coverage Intelligence Map</h3>
          <FilterChips options={VIEW_FILTERS} value={view} onChange={setView} />
        </div>
        <CoverageMap view={view} />
      </div>

      {/* Coverage by entity type + gap table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">Coverage by Entity Type</h3>
          </div>
          <div className="p-4">
            <CoverageByType />
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">Territory Gap Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Territory', 'Total', 'Covered', 'Gap', 'Coverage %', 'Score'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVERAGE_TABLE.sort((a, b) => a.pct - b.pct).map(row => {
                  const color = row.pct >= 80 ? '#34c97e' : row.pct >= 60 ? '#f5a623' : '#f05b5b';
                  const textColor = row.pct >= 80 ? 'text-success' : row.pct >= 60 ? 'text-warning' : 'text-danger';
                  return (
                    <tr key={row.territory} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm font-medium">{row.territory}</td>
                      <td className="px-4 py-3 text-sm">{row.total}</td>
                      <td className="px-4 py-3 text-sm text-success">{row.covered}</td>
                      <td className="px-4 py-3 text-sm text-danger font-medium">{row.gap}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-4 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: color }} />
                          </div>
                          <span className={`text-xs font-bold w-10 text-right ${textColor}`}>{row.pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${textColor}`}>{row.score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
