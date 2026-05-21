'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { darApi } from '@/services/api';
import { cn, fmt } from '@/lib/utils';
import toast from 'react-hot-toast';

const DEMO_REPORTS = [
  { id:'1', mrName:'Rajesh Kumar',  territory:'Mumbai Central',   reportDate:'2026-05-18', doctorCalls:8,  customerVisits:3, samplesDistributed:6,  routeDistanceKm:34.2, isSubmitted:true,  marketFeedback:'Positive reception for Cardivex. Competitor Acme active.' },
  { id:'2', mrName:'Priya Sharma',  territory:'Pune West',         reportDate:'2026-05-18', doctorCalls:11, customerVisits:4, samplesDistributed:8,  routeDistanceKm:28.5, isSubmitted:true,  marketFeedback:'Doctors requesting more GlucoMax samples.' },
  { id:'3', mrName:'Arjun Mehta',   territory:'Delhi North',       reportDate:'2026-05-18', doctorCalls:4,  customerVisits:1, samplesDistributed:2,  routeDistanceKm:18.0, isSubmitted:false, marketFeedback:'' },
  { id:'4', mrName:'Sunita Gupta',  territory:'Bangalore South',   reportDate:'2026-05-18', doctorCalls:9,  customerVisits:3, samplesDistributed:7,  routeDistanceKm:31.0, isSubmitted:true,  marketFeedback:'NeuroCal well received. Follow up with Dr. Reddy.' },
  { id:'5', mrName:'Vikram Nair',   territory:'Chennai Central',   reportDate:'2026-05-18', doctorCalls:2,  customerVisits:1, samplesDistributed:1,  routeDistanceKm:9.5,  isSubmitted:false, marketFeedback:'' },
  { id:'6', mrName:'Kavita Rao',    territory:'Hyderabad East',    reportDate:'2026-05-17', doctorCalls:7,  customerVisits:2, samplesDistributed:5,  routeDistanceKm:26.8, isSubmitted:true,  marketFeedback:'Strong demand for BoneGuard in Banjara Hills.' },
];

export default function DarPage() {
  const [reports, setReports] = useState(DEMO_REPORTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    darApi.list({ limit: 30 })
      .then(({ data }) => { if (data.reports?.length) setReports(data.reports); })
      .catch(() => {});
  }, []);

  const submitted   = reports.filter(r => r.isSubmitted).length;
  const pending     = reports.filter(r => !r.isSubmitted).length;
  const totalCalls  = reports.reduce((s, r) => s + (r.doctorCalls || 0), 0);
  const totalSamples= reports.reduce((s, r) => s + (r.samplesDistributed || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Daily Activity Reports"
        subtitle="MR field activity logs and market feedback"
        actions={<button className="btn-primary">+ Submit DAR</button>}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Submitted Today', value:submitted,    color:'text-success' },
          { label:'Pending',         value:pending,      color:'text-warning' },
          { label:'Total Dr Calls',  value:totalCalls,   color:'text-accent' },
          { label:'Samples Given',   value:totalSamples, color:'text-info' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className={cn('font-display text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-text-3 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reports table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-display font-semibold text-sm">Today's Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['MR', 'Territory', 'Date', 'Dr Calls', 'Cust Visits', 'Samples', 'Distance', 'Status', 'Feedback'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => (
                <tr key={r.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm font-medium">{r.mrName || r.mr_name}</td>
                  <td className="px-4 py-3 text-sm text-text-2">{r.territory}</td>
                  <td className="px-4 py-3 text-sm text-text-3">{fmt(r.reportDate || r.report_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{r.doctorCalls || r.doctor_calls}</td>
                  <td className="px-4 py-3 text-sm">{r.customerVisits || r.customer_visits}</td>
                  <td className="px-4 py-3 text-sm">{r.samplesDistributed || r.samples_distributed}</td>
                  <td className="px-4 py-3 text-sm text-text-2">{Number(r.routeDistanceKm || r.route_distance_km || 0).toFixed(1)} km</td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', (r.isSubmitted || r.is_submitted) ? 'tag-green' : 'tag-amber')}>
                      {(r.isSubmitted || r.is_submitted) ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-3 max-w-[200px] truncate">
                    {r.marketFeedback || r.market_feedback || '—'}
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
