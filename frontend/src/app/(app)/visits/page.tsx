'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput, FilterChips, Badge, Avatar, EmptyState } from '@/components/ui/index';
import { visitApi } from '@/services/api';
import { Visit } from '@/types';
import { cn, fmt, timeAgo } from '@/lib/utils';

const GEO_FILTERS = [
  { value: 'all',        label: 'All' },
  { value: 'valid',      label: '✅ Valid' },
  { value: 'suspicious', label: '⚠️ Suspicious' },
  { value: 'invalid',    label: '❌ Invalid' },
];

const GEO_CLASS: Record<string, string> = {
  valid: 'tag-green', suspicious: 'tag-amber', invalid: 'tag-red', unverified: 'tag-gray',
};
const OUTCOME_CLASS: Record<string, string> = {
  positive: 'tag-green', neutral: 'tag-gray', negative: 'tag-red', follow_up_required: 'tag-amber',
};

const DEMO_VISITS: Visit[] = [
  { id:'1', mrId:'1', mrName:'Rajesh Kumar', employeeId:'EMP-0042', visitType:'doctor', doctorId:'1', doctorName:'Dr. Manoj Kapoor', specialty:'Cardiologist', checkinTime:'2026-05-18T09:15:00', checkoutTime:'2026-05-18T09:42:00', durationMinutes:27, checkinLat:19.0544, checkinLng:72.8322, geoValidationStatus:'valid', geoDistanceMeters:42, productsDiscussed:['Cardivex 10mg'], visitOutcome:'positive', createdAt:'2026-05-18T09:15:00' },
  { id:'2', mrId:'2', mrName:'Priya Sharma',  employeeId:'EMP-0031', visitType:'customer', customerId:'1', customerName:'MedPlus Pharmacy Bandra', customerType:'pharmacy', checkinTime:'2026-05-18T10:00:00', checkoutTime:'2026-05-18T10:22:00', durationMinutes:22, geoValidationStatus:'valid', geoDistanceMeters:88, productsDiscussed:['GlucoMax 850mg'], visitOutcome:'positive', createdAt:'2026-05-18T10:00:00' },
  { id:'3', mrId:'3', mrName:'Arjun Mehta',   employeeId:'EMP-0058', visitType:'doctor', doctorId:'3', doctorName:'Dr. Prashant Vyas', specialty:'Diabetologist', checkinTime:'2026-05-18T11:30:00', geoValidationStatus:'invalid', geoDistanceMeters:4200, visitOutcome:'neutral', createdAt:'2026-05-18T11:30:00' },
  { id:'4', mrId:'4', mrName:'Sunita Gupta',  employeeId:'EMP-0027', visitType:'doctor', doctorId:'2', doctorName:'Dr. Sunita Reddy', specialty:'Neurologist', checkinTime:'2026-05-18T09:50:00', checkoutTime:'2026-05-18T10:20:00', durationMinutes:30, geoValidationStatus:'valid', geoDistanceMeters:120, productsDiscussed:['NeuroCal 500mg'], visitOutcome:'positive', createdAt:'2026-05-18T09:50:00' },
  { id:'5', mrId:'1', mrName:'Rajesh Kumar',  employeeId:'EMP-0042', visitType:'customer', customerId:'2', customerName:'Apollo Pharmacy Andheri', customerType:'pharmacy', checkinTime:'2026-05-18T11:00:00', checkoutTime:'2026-05-18T11:18:00', durationMinutes:18, geoValidationStatus:'valid', geoDistanceMeters:65, visitOutcome:'positive', createdAt:'2026-05-18T11:00:00' },
  { id:'6', mrId:'5', mrName:'Vikram Nair',   employeeId:'EMP-0019', visitType:'doctor', doctorId:'5', doctorName:'Dr. Ravi Menon', specialty:'General Physician', checkinTime:'2026-05-18T08:45:00', checkoutTime:'2026-05-18T09:05:00', durationMinutes:20, geoValidationStatus:'suspicious', geoDistanceMeters:650, visitOutcome:'neutral', createdAt:'2026-05-18T08:45:00' },
];

export default function VisitsPage() {
  const [visits, setVisits]   = useState<Visit[]>(DEMO_VISITS);
  const [search, setSearch]   = useState('');
  const [geoFilter, setGeo]   = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    visitApi.list({ limit: 50 })
      .then(({ data }) => { if (data.visits?.length) setVisits(data.visits); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = visits.filter((v) => {
    const s = search.toLowerCase();
    const matchSearch = v.mrName?.toLowerCase().includes(s) || v.doctorName?.toLowerCase().includes(s) || v.customerName?.toLowerCase().includes(s);
    const matchGeo = geoFilter === 'all' || v.geoValidationStatus === geoFilter;
    return matchSearch && matchGeo;
  });

  const valid     = visits.filter(v => v.geoValidationStatus === 'valid').length;
  const invalid   = visits.filter(v => v.geoValidationStatus === 'invalid').length;
  const suspicious= visits.filter(v => v.geoValidationStatus === 'suspicious').length;
  const avgDur    = visits.filter(v => v.durationMinutes).reduce((s,v) => s + (v.durationMinutes||0), 0) / (visits.filter(v=>v.durationMinutes).length || 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Visit Tracking"
        subtitle="GPS-validated field visits with geo compliance monitoring"
        actions={<button className="btn-primary">📍 Check In</button>}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border-l-2 border-success">
          <p className="text-xs text-text-3 mb-1">Valid Visits Today</p>
          <p className="font-display text-2xl font-bold text-success">{valid}</p>
        </div>
        <div className="card p-4 border-l-2 border-danger">
          <p className="text-xs text-text-3 mb-1">Geo Invalid</p>
          <p className="font-display text-2xl font-bold text-danger">{invalid}</p>
        </div>
        <div className="card p-4 border-l-2 border-warning">
          <p className="text-xs text-text-3 mb-1">Suspicious</p>
          <p className="font-display text-2xl font-bold text-warning">{suspicious}</p>
        </div>
        <div className="card p-4 border-l-2 border-accent">
          <p className="text-xs text-text-3 mb-1">Avg Duration</p>
          <p className="font-display text-2xl font-bold">{avgDur.toFixed(0)}<span className="text-base font-normal text-text-3">m</span></p>
        </div>
      </div>

      {/* Filters + table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by MR, doctor, customer..." className="w-64" />
          <FilterChips options={GEO_FILTERS} value={geoFilter} onChange={setGeo} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['MR', 'Visit Target', 'Type', 'Check-in', 'Duration', 'Geo Status', 'Distance', 'Outcome', 'Products'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={v.mrName || 'MR'} id={v.mrId} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{v.mrName}</p>
                        <p className="text-[11px] text-text-3">{v.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{v.doctorName || v.customerName}</p>
                    <p className="text-xs text-text-3">{v.specialty || (v.customerType || '').replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', v.visitType === 'doctor' ? 'tag-blue' : 'tag-purple')}>
                      {v.visitType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-2">
                    <p>{fmt(v.checkinTime, 'HH:mm')}</p>
                    <p className="text-xs text-text-3">{timeAgo(v.checkinTime)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {v.durationMinutes ? (
                      <span className={v.durationMinutes >= 15 ? 'text-success' : 'text-warning'}>
                        {v.durationMinutes}m
                      </span>
                    ) : <span className="text-text-3 animate-pulse">Live…</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', GEO_CLASS[v.geoValidationStatus])}>{v.geoValidationStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-2">
                    {v.geoDistanceMeters != null ? `${v.geoDistanceMeters}m` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', OUTCOME_CLASS[v.visitOutcome])}>{v.visitOutcome.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-3">
                    {v.productsDiscussed?.join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState title="No visits found" />}
        </div>
      </div>
    </div>
  );
}
