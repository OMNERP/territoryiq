'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SearchInput, FilterChips, Badge, Avatar } from '@/components/ui/index';
import { ProgressBar } from '@/components/ui/index';
import { MrProductivityChart } from '@/components/charts/index';
import { mrApi } from '@/services/api';
import { cn, fmt, timeAgo } from '@/lib/utils';

const DEMO_MRS = [
  { id:'1', employeeId:'EMP-0042', fullName:'Rajesh Kumar',  territoryName:'Mumbai Central',   status:'active',  liveStatus:'active',  visitsToday:8,  dailyVisitTarget:10, visitsMonth:180, targetPct:80,  phone:'9821001001' },
  { id:'2', employeeId:'EMP-0031', fullName:'Priya Sharma',  territoryName:'Pune West',         status:'active',  liveStatus:'active',  visitsToday:11, dailyVisitTarget:10, visitsMonth:220, targetPct:110, phone:'9821002002' },
  { id:'3', employeeId:'EMP-0058', fullName:'Arjun Mehta',   territoryName:'Delhi North',       status:'active',  liveStatus:'idle',    visitsToday:4,  dailyVisitTarget:10, visitsMonth:80,  targetPct:40,  phone:'9821003003' },
  { id:'4', employeeId:'EMP-0027', fullName:'Sunita Gupta',  territoryName:'Bangalore South',   status:'active',  liveStatus:'active',  visitsToday:9,  dailyVisitTarget:10, visitsMonth:175, targetPct:88,  phone:'9821004004' },
  { id:'5', employeeId:'EMP-0019', fullName:'Vikram Nair',   territoryName:'Chennai Central',   status:'active',  liveStatus:'offline', visitsToday:2,  dailyVisitTarget:10, visitsMonth:42,  targetPct:21,  phone:'9821005005' },
  { id:'6', employeeId:'EMP-0033', fullName:'Kavita Rao',    territoryName:'Hyderabad East',    status:'active',  liveStatus:'active',  visitsToday:7,  dailyVisitTarget:10, visitsMonth:160, targetPct:80,  phone:'9821006006' },
];

const STATUS_FILTERS = [
  { value: 'all',     label: 'All Reps' },
  { value: 'active',  label: '🟢 Active' },
  { value: 'idle',    label: '🟡 Idle' },
  { value: 'offline', label: '⚫ Offline' },
];

const LIVE_DOT: Record<string, string> = {
  active:  'bg-success shadow-[0_0_6px_#34c97e]',
  idle:    'bg-warning',
  offline: 'bg-text-3',
};

export default function MrsPage() {
  const [mrs, setMrs]         = useState(DEMO_MRS);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    mrApi.live()
      .then(({ data }) => { if (data.mrs?.length) setMrs(data.mrs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = mrs.filter((m: any) => {
    const matchSearch = m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.territoryName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.liveStatus === filter;
    return matchSearch && matchFilter;
  });

  const onTarget  = mrs.filter((m: any) => (m.targetPct || 0) >= 100).length;
  const belowTarget = mrs.filter((m: any) => (m.targetPct || 0) < 100 && (m.targetPct || 0) >= 50).length;
  const critical  = mrs.filter((m: any) => (m.targetPct || 0) < 50).length;
  const online    = mrs.filter((m: any) => m.liveStatus === 'active').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Medical Representatives"
        subtitle="Live field force visibility and performance"
        actions={<button className="btn-primary">+ Add MR</button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Online Now"   value={online}      icon="🟢" color="green"  compact />
        <KpiCard label="On Target"    value={onTarget}    icon="🎯" color="blue"   compact />
        <KpiCard label="Below Target" value={belowTarget} icon="⚠️" color="amber"  compact />
        <KpiCard label="Critical"     value={critical}    icon="🔴" color="red"    compact />
      </div>

      {/* Productivity chart */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-display font-semibold text-sm">Monthly Target Achievement</h3>
        </div>
        <div className="p-4">
          <MrProductivityChart />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or territory..." className="w-56" />
          <FilterChips options={STATUS_FILTERS} value={filter} onChange={setFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Rep', 'Territory', 'Status', "Today's Visits", 'Monthly Target', 'GPS', 'Action'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((mr: any) => {
                const pct = mr.targetPct || Math.round((mr.visitsToday / mr.dailyVisitTarget) * 100);
                const pctColor = pct >= 100 ? 'text-success' : pct >= 70 ? 'text-accent' : pct >= 40 ? 'text-warning' : 'text-danger';
                const barColor = pct >= 100 ? 'bg-success' : pct >= 70 ? 'bg-accent' : pct >= 40 ? 'bg-warning' : 'bg-danger';
                const statusLabel = { active: 'On Target', idle: 'Below Target', offline: 'Critical' }[mr.liveStatus as string] || mr.liveStatus;
                const statusClass = { active: 'tag-green', idle: 'tag-amber', offline: 'tag-red' }[mr.liveStatus as string] || 'tag-gray';

                return (
                  <tr key={mr.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', LIVE_DOT[mr.liveStatus || 'offline'])} />
                        <Avatar name={mr.fullName} id={mr.id} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{mr.fullName}</p>
                          <p className="text-[11px] text-text-3">{mr.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-2">{mr.territoryName}</td>
                    <td className="px-4 py-3"><span className={cn('tag', statusClass)}>{statusLabel}</span></td>
                    <td className="px-4 py-3 text-sm">
                      <strong>{mr.visitsToday}</strong>
                      <span className="text-text-3"> / {mr.dailyVisitTarget}</span>
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-bg-4 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', barColor)} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className={cn('text-xs font-semibold w-9 text-right', pctColor)}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('tag', mr.liveStatus === 'active' ? 'tag-green' : mr.liveStatus === 'idle' ? 'tag-amber' : 'tag-gray')}>
                        {mr.liveStatus === 'active' ? 'Active' : mr.liveStatus === 'idle' ? 'Idle' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-accent text-xs hover:underline">View →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
