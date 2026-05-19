'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { alertApi } from '@/services/api';
import { Alert } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const SEVERITY_ICON: Record<string, string> = { critical: '🔴', warning: '🟡', info: '🔵' };
const TYPE_ICON: Record<string, string> = {
  geo_anomaly: '📡', inactive_mr: '👤', low_coverage: '📉',
  missed_visit: '📅', target_failure: '🎯', pending_followup: '🔁', sample_low: '💊',
};

const DEMO_ALERTS: Alert[] = [
  { id:'1', alertType:'geo_anomaly',    severity:'critical', title:'GPS Anomaly — Arjun Mehta',       message:'Check-in was 4.2km from registered clinic. Delhi North territory.',           mrId:'3', isRead:false, isResolved:false, createdAt:'2026-05-18T11:34:00' },
  { id:'2', alertType:'inactive_mr',   severity:'critical', title:'MR Inactive — Vikram Nair',        message:'No GPS activity for 3+ hours during business hours. Chennai Central.',        mrId:'5', isRead:false, isResolved:false, createdAt:'2026-05-18T09:12:00' },
  { id:'3', alertType:'low_coverage',  severity:'critical', title:'Low Coverage — Delhi North',        message:'Territory coverage dropped to 49%. Below 60% threshold.',                    isRead:false, isResolved:false, createdAt:'2026-05-18T08:00:00' },
  { id:'4', alertType:'missed_visit',  severity:'warning',  title:'24 Follow-ups Due Today',           message:'Scheduled doctor follow-ups across 6 MRs are pending across regions.',       isRead:false, isResolved:false, createdAt:'2026-05-18T07:00:00' },
  { id:'5', alertType:'target_failure',severity:'warning',  title:'Monthly Target Risk — Arjun Mehta', message:'Current pace will miss monthly visit target by 38%. Delhi North.',           mrId:'3', isRead:true,  isResolved:false, createdAt:'2026-05-17T18:00:00' },
  { id:'6', alertType:'pending_followup',severity:'warning',title:'7 High-Priority Doctors Overdue',  message:'High-priority doctors not visited in 30+ days across Mumbai and Delhi.',      isRead:false, isResolved:false, createdAt:'2026-05-17T09:00:00' },
  { id:'7', alertType:'sample_low',    severity:'info',     title:'Sample Inventory Low — Cardivex',  message:'Remaining stock: 34 units. Reorder threshold reached for cardiology segment.', isRead:false, isResolved:false, createdAt:'2026-05-16T14:00:00' },
];

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>(DEMO_ALERTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    alertApi.list({ limit: 50 })
      .then(({ data }) => { if (data.alerts?.length) setAlerts(data.alerts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRead(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
    await alertApi.read(id).catch(() => {});
  }

  async function handleResolve(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isResolved: true } : a));
    toast.success('Alert resolved');
    await alertApi.resolve(id).catch(() => {});
  }

  const critical = alerts.filter(a => a.severity === 'critical' && !a.isResolved);
  const warnings = alerts.filter(a => a.severity === 'warning'  && !a.isResolved);
  const infos    = alerts.filter(a => a.severity === 'info'     && !a.isResolved);
  const resolved = alerts.filter(a => a.isResolved);

  const Section = ({ title, color, items, bgColor, borderColor }: {
    title: string; color: string; items: Alert[]; bgColor: string; borderColor: string;
  }) => {
    if (!items.length) return null;
    return (
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className={cn('font-display font-semibold text-sm flex items-center gap-2', color)}>
            {SEVERITY_ICON[items[0]?.severity]} {title} ({items.length})
          </h3>
          <span className={cn('tag', color === 'text-danger' ? 'tag-red' : color === 'text-warning' ? 'tag-amber' : 'tag-blue')}>
            {items.length} active
          </span>
        </div>
        <div className="p-4 space-y-3">
          {items.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-[10px] p-4 border flex gap-3',
                bgColor, borderColor,
                !alert.isRead ? 'opacity-100' : 'opacity-60'
              )}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[alert.alertType] || '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <span className="text-[11px] text-text-3 whitespace-nowrap">{timeAgo(alert.createdAt)}</span>
                </div>
                <p className="text-xs text-text-2 mt-1 leading-relaxed">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  {!alert.isRead && (
                    <button onClick={() => handleRead(alert.id)} className="text-xs text-accent hover:underline">
                      Mark read
                    </button>
                  )}
                  <button onClick={() => handleResolve(alert.id)} className="text-xs text-success hover:underline">
                    ✓ Resolve
                  </button>
                  {alert.mrId && (
                    <button className="text-xs text-text-3 hover:text-text">View MR →</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Alerts & Notifications"
        subtitle="Field anomalies, coverage issues, and compliance violations"
        actions={
          <button className="btn-secondary" onClick={() => setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))}>
            ✓ Mark all read
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-2 border-danger text-center">
          <p className="font-display text-2xl font-bold text-danger">{critical.length}</p>
          <p className="text-xs text-text-3 mt-1">Critical</p>
        </div>
        <div className="card p-4 border-l-2 border-warning text-center">
          <p className="font-display text-2xl font-bold text-warning">{warnings.length}</p>
          <p className="text-xs text-text-3 mt-1">Warnings</p>
        </div>
        <div className="card p-4 border-l-2 border-success text-center">
          <p className="font-display text-2xl font-bold text-success">{resolved.length}</p>
          <p className="text-xs text-text-3 mt-1">Resolved</p>
        </div>
      </div>

      <Section
        title="Critical Alerts"
        color="text-danger"
        items={critical}
        bgColor="bg-danger/[0.06]"
        borderColor="border-danger/20"
      />
      <Section
        title="Warnings"
        color="text-warning"
        items={warnings}
        bgColor="bg-warning/[0.05]"
        borderColor="border-warning/20"
      />
      <Section
        title="Info"
        color="text-info"
        items={infos}
        bgColor="bg-info/[0.05]"
        borderColor="border-info/20"
      />

      {!critical.length && !warnings.length && !infos.length && (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-display font-semibold text-sm">All clear!</p>
          <p className="text-xs text-text-3 mt-1">No active alerts at this time.</p>
        </div>
      )}
    </div>
  );
}
