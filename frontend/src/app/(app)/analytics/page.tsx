'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { VisitTrendChart, ProductPerformanceChart, MrProductivityChart, TerritoryComparisonChart } from '@/components/charts/index';
import { FilterChips } from '@/components/ui/index';

const DATE_RANGES = [
  { value: '7',  label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive field performance and coverage intelligence"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary">⬇ Export PDF</button>
            <button className="btn-secondary">📊 Export Excel</button>
          </div>
        }
      />

      {/* Date range filter */}
      <FilterChips options={DATE_RANGES} value={range} onChange={setRange} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Reports Generated" value="1,284"  icon="📋" color="blue"   compact />
        <KpiCard label="Avg Visit Duration"value="24m"    icon="⏱"  color="green"  compact />
        <KpiCard label="Compliance Rate"   value="91.4%"  icon="✅"  color="amber"  compact />
        <KpiCard label="Samples Given"     value="18.4K"  icon="💊" color="purple" compact />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">Visit Trend — Last 6 Months</h3>
          </div>
          <div className="p-4"><VisitTrendChart /></div>
        </div>
        <div className="card">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">Product Promotion Hits</h3>
          </div>
          <div className="p-4"><ProductPerformanceChart /></div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">MR Target Achievement</h3>
          </div>
          <div className="p-4"><MrProductivityChart /></div>
        </div>
        <div className="card">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">Territory Comparison</h3>
          </div>
          <div className="p-4"><TerritoryComparisonChart /></div>
        </div>
      </div>

      {/* Compliance table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-display font-semibold text-sm">Visit Geo-Compliance Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['MR', 'Territory', 'Total Visits', 'Valid', 'Invalid', 'Compliance %'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name:'Rajesh Kumar',  territory:'Mumbai Central',   total:180, valid:175, invalid:5,  pct:97.2 },
                { name:'Priya Sharma',  territory:'Pune West',         total:220, valid:218, invalid:2,  pct:99.1 },
                { name:'Arjun Mehta',   territory:'Delhi North',       total:80,  valid:61,  invalid:19, pct:76.3 },
                { name:'Sunita Gupta',  territory:'Bangalore South',   total:175, valid:170, invalid:5,  pct:97.1 },
                { name:'Vikram Nair',   territory:'Chennai Central',   total:42,  valid:30,  invalid:12, pct:71.4 },
                { name:'Kavita Rao',    territory:'Hyderabad East',    total:160, valid:158, invalid:2,  pct:98.8 },
              ].map((row) => (
                <tr key={row.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-text-2">{row.territory}</td>
                  <td className="px-4 py-3 text-sm">{row.total}</td>
                  <td className="px-4 py-3 text-sm text-success font-medium">{row.valid}</td>
                  <td className="px-4 py-3 text-sm text-danger">{row.invalid}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-bg-4 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-success">{row.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
