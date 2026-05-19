// ── KpiCard ───────────────────────────────────────────────────────────────────
'use client';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label:   string;
  value:   string | number;
  icon:    string;
  color:   'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'purple';
  change?: { value: number; direction: 'up' | 'down'; label: string };
  suffix?: string;
  compact?: boolean;
}

const colorMap = {
  blue:   { bg: 'bg-accent/10',    text: 'text-accent',   bar: 'bg-accent'   },
  green:  { bg: 'bg-success/10',   text: 'text-success',  bar: 'bg-success'  },
  amber:  { bg: 'bg-warning/10',   text: 'text-warning',  bar: 'bg-warning'  },
  red:    { bg: 'bg-danger/10',    text: 'text-danger',   bar: 'bg-danger'   },
  cyan:   { bg: 'bg-info/10',      text: 'text-info',     bar: 'bg-info'     },
  purple: { bg: 'bg-accent-2/10',  text: 'text-accent-2', bar: 'bg-accent-2' },
};

export function KpiCard({ label, value, icon, color, change, compact }: KpiCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('card card-hover cursor-pointer', compact ? 'p-4' : 'p-5')}>
      {/* Top accent line */}
      <div className={cn('h-0.5 absolute top-0 left-0 right-0 rounded-t-[14px]', c.bar)} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-[11.5px] font-medium text-text-3 uppercase tracking-wide">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm', c.bg)}>
          {icon}
        </div>
      </div>

      <div className={cn('font-display font-bold leading-none mb-2', compact ? 'text-xl' : 'text-[26px]')}>
        {value}
      </div>

      {change && (
        <div className={cn('flex items-center gap-1 text-xs', change.direction === 'up' ? 'text-success' : 'text-danger')}>
          <span>{change.direction === 'up' ? '↑' : '↓'}</span>
          {change.value > 0 && <span>{change.value}</span>}
          <span className="text-text-3">{change.label}</span>
        </div>
      )}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-text-3 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── AlertStrip ────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { Alert } from '@/types';

export function AlertStrip({ alerts }: { alerts: Alert[] }) {
  const first = alerts[0];
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] border
                    bg-warning/[0.06] border-warning/20 text-sm">
      <span className="text-warning text-base">⚠️</span>
      <span className="text-text-2">
        <strong className="text-warning">{alerts.length} critical alert{alerts.length > 1 ? 's' : ''}</strong>
        {first && ` — ${first.title}`}
      </span>
      <Link href="/alerts" className="ml-auto text-accent text-xs whitespace-nowrap hover:underline">
        View all →
      </Link>
    </div>
  );
}

// ── LiveMrList ────────────────────────────────────────────────────────────────
import { useDashboardStore } from '@/store/index';

const STATUS_DOT: Record<string, string> = {
  active:  'bg-success shadow-[0_0_6px_theme(colors.success)]',
  idle:    'bg-warning',
  offline: 'bg-text-3',
};

const DEMO_LIVE = [
  { id:'1', fullName:'Rajesh Kumar',  territoryName:'Mumbai Central', visitsToday:8,  dailyVisitTarget:10, liveStatus:'active'  },
  { id:'2', fullName:'Priya Sharma',  territoryName:'Pune West',      visitsToday:11, dailyVisitTarget:10, liveStatus:'active'  },
  { id:'3', fullName:'Arjun Mehta',   territoryName:'Delhi North',    visitsToday:4,  dailyVisitTarget:10, liveStatus:'idle'    },
  { id:'4', fullName:'Sunita Gupta',  territoryName:'Bangalore South',visitsToday:9,  dailyVisitTarget:10, liveStatus:'active'  },
  { id:'5', fullName:'Vikram Nair',   territoryName:'Chennai Central',visitsToday:2,  dailyVisitTarget:10, liveStatus:'offline' },
];

export function LiveMrList() {
  const { liveMrs } = useDashboardStore();
  const mrs = liveMrs.length ? liveMrs : DEMO_LIVE;

  return (
    <div>
      {mrs.map((mr: any) => {
        const pct = Math.min(110, Math.round((mr.visitsToday / mr.dailyVisitTarget) * 100));
        const barColor = pct >= 100 ? 'bg-success' : pct >= 70 ? 'bg-accent' : pct >= 40 ? 'bg-warning' : 'bg-danger';
        const textColor = pct >= 100 ? 'text-success' : pct >= 70 ? 'text-accent' : pct >= 40 ? 'text-warning' : 'text-danger';
        const initials = mr.fullName.split(' ').map((n: string) => n[0]).join('').slice(0,2);

        return (
          <div key={mr.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] last:border-0 hover:bg-bg-4 transition-colors cursor-pointer">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[mr.liveStatus || 'offline'])} />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-medium truncate">{mr.fullName}</p>
              <p className="text-xs text-text-3 truncate">{mr.territoryName} · {mr.visitsToday} visits</p>
              <div className="progress-bar mt-1.5">
                <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={cn('text-sm font-bold', textColor)}>{pct}%</p>
              <p className="text-[10px] text-text-3">target</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────
const FEED = [
  { color: '#34c97e', text: '<strong>Rajesh Kumar</strong> checked in at <strong>Dr. Mehta Clinic</strong>', time: '2 min ago · Andheri East, Mumbai' },
  { color: '#4f8ef7', text: '<strong>Priya Sharma</strong> submitted daily report — 11 visits', time: '8 min ago · Pune West' },
  { color: '#f5a623', text: '<strong>Alert:</strong> Arjun Mehta GPS anomaly detected near Delhi', time: '15 min ago · Geo validation failed' },
  { color: '#26d4d4', text: '<strong>Sunita Gupta</strong> added new doctor — Dr. Kavya R., Cardiologist', time: '22 min ago · Koramangala, Bangalore' },
];

export function ActivityFeed() {
  return (
    <div className="space-y-0">
      {FEED.map((item, i) => (
        <div key={i} className={cn('flex gap-3 py-2.5', i < FEED.length - 1 ? 'border-b border-white/[0.06]' : '')}>
          <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: item.color }} />
          <div>
            <p className="text-[13px] leading-[1.5]" dangerouslySetInnerHTML={{ __html: item.text }} />
            <p className="text-[11px] text-text-3 mt-0.5">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CoverageByType ────────────────────────────────────────────────────────────
const COVERAGE_TYPES = [
  { label: 'Doctors',    pct: 78, color: '#4f8ef7' },
  { label: 'Pharmacies', pct: 85, color: '#34c97e' },
  { label: 'Clinics',    pct: 62, color: '#f5a623' },
  { label: 'Hospitals',  pct: 55, color: '#f05b5b' },
  { label: 'Retailers',  pct: 91, color: '#26d4d4' },
];

export function CoverageByType({ stats }: { stats?: any }) {
  return (
    <div className="space-y-3">
      {COVERAGE_TYPES.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[12.5px] text-text-2 w-24 flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-1.5 bg-bg-4 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${item.pct}%`, background: item.color }}
            />
          </div>
          <span className="text-[12.5px] font-semibold w-9 text-right flex-shrink-0" style={{ color: item.color }}>
            {item.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}
