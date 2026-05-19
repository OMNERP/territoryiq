'use client';
import { useEffect } from 'react';
import { useDashboardStore } from '@/store/index';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LiveMrList } from '@/components/dashboard/LiveMrList';
import { CoverageTrendChart } from '@/components/charts/CoverageTrendChart';
import { MrPerformanceDonut } from '@/components/charts/MrPerformanceDonut';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { CoverageByType } from '@/components/dashboard/CoverageByType';
import { AlertStrip } from '@/components/dashboard/AlertStrip';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardPage() {
  const { stats, alerts, fetchDashboard, fetchLiveMrs } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
    fetchLiveMrs();
    const iv = setInterval(() => { fetchDashboard(); fetchLiveMrs(); }, 60_000);
    return () => clearInterval(iv);
  }, []);

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.isRead);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Territory Intelligence"
        subtitle="Real-time field force overview"
        actions={
          <button className="btn-primary">
            <span>+</span> New Visit
          </button>
        }
      />

      {/* Alert strip */}
      {criticalAlerts.length > 0 && (
        <AlertStrip alerts={criticalAlerts} />
      )}

      {/* Row 1: Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Doctor Coverage"
          value={`${stats?.coverage.doctorCoverage ?? 0}%`}
          icon="⚕️"
          color="blue"
          change={{ value: 3.2, direction: 'up', label: 'vs last month' }}
        />
        <KpiCard
          label="Active MRs Today"
          value={stats ? `${stats.mrs.onlineNow} / ${stats.mrs.active}` : '—'}
          icon="👥"
          color="green"
          change={{ value: 90.4, direction: 'up', label: 'attendance' }}
          suffix="%"
        />
        <KpiCard
          label="Visits Today"
          value={stats?.visits.today ?? 0}
          icon="📍"
          color="amber"
          change={{ value: 18, direction: 'up', label: 'vs yesterday' }}
        />
        <KpiCard
          label="Missed Follow-ups"
          value={24}
          icon="⚠️"
          color="red"
          change={{ value: 0, direction: 'down', label: 'needs attention' }}
        />
      </div>

      {/* Row 2: Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Samples Distributed" value="1,847" icon="💊" color="cyan"  compact />
        <KpiCard label="Territory Score"      value="82.1"  icon="🏆" color="purple" compact />
        <KpiCard label="Route Efficiency"     value="73%"   icon="🧭" color="green"  compact />
        <KpiCard label="Geo Compliance"       value="96.2%" icon="📡" color="blue"   compact />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Territory Coverage Trend</h3>
            <div className="flex gap-2">
              <span className="tag tag-blue">Monthly</span>
            </div>
          </div>
          <div className="p-4">
            <CoverageTrendChart />
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-display font-semibold text-sm">MR Performance</h3>
          </div>
          <div className="p-4">
            <MrPerformanceDonut />
          </div>
        </div>
      </div>

      {/* Row 4: Live data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Active Field Reps</h3>
            <span className="tag tag-green">Live</span>
          </div>
          <LiveMrList />
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">Live Activity Feed</h3>
              <span className="tag tag-green">Live</span>
            </div>
            <div className="p-4">
              <ActivityFeed />
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="font-display font-semibold text-sm">Coverage by Type</h3>
            </div>
            <div className="p-4">
              <CoverageByType stats={stats?.coverage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
