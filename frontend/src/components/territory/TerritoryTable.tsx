'use client';
import { Territory } from '@/types';
import { Badge, ProgressBar, DataTable } from '@/components/ui/index';
import { fmtNumber, coverageColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

const DEMO: Territory[] = [
  { id:'1', name:'Mumbai Central',   city:'Mumbai',    region:'West',  country:'India', mrName:'Rajesh Kumar',  totalDoctors:312, coveredDoctors30d:248, totalCustomers:48, coveragePct:79, heatmapScore:88, routeEfficiencyScore:82, isActive:true },
  { id:'2', name:'Pune West',        city:'Pune',      region:'West',  country:'India', mrName:'Priya Sharma',  totalDoctors:224, coveredDoctors30d:198, totalCustomers:38, coveragePct:88, heatmapScore:95, routeEfficiencyScore:90, isActive:true },
  { id:'3', name:'Delhi North',      city:'Delhi',     region:'North', country:'India', mrName:'Arjun Mehta',   totalDoctors:245, coveredDoctors30d:121, totalCustomers:52, coveragePct:49, heatmapScore:51, routeEfficiencyScore:55, isActive:true },
  { id:'4', name:'Bangalore South',  city:'Bangalore', region:'South', country:'India', mrName:'Sunita Gupta',  totalDoctors:267, coveredDoctors30d:176, totalCustomers:44, coveragePct:66, heatmapScore:70, routeEfficiencyScore:68, isActive:true },
  { id:'5', name:'Chennai Central',  city:'Chennai',   region:'South', country:'India', mrName:'Vikram Nair',   totalDoctors:198, coveredDoctors30d:98,  totalCustomers:36, coveragePct:49, heatmapScore:46, routeEfficiencyScore:50, isActive:true },
  { id:'6', name:'Hyderabad East',   city:'Hyderabad', region:'South', country:'India', mrName:'Kavita Rao',    totalDoctors:280, coveredDoctors30d:214, totalCustomers:50, coveragePct:76, heatmapScore:81, routeEfficiencyScore:75, isActive:true },
];

interface Props { territories: Territory[] }

export function TerritoryTable({ territories }: Props) {
  const data = territories.length ? territories : DEMO;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Territory','MR','Doctors','Coverage','Score','Status'].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((t) => {
            const statusLabel = t.coveragePct >= 80 ? 'Excellent' : t.coveragePct >= 65 ? 'Healthy' : t.coveragePct >= 50 ? 'Fair' : 'Critical';
            const statusClass = t.coveragePct >= 80 ? 'tag-green' : t.coveragePct >= 65 ? 'tag-blue' : t.coveragePct >= 50 ? 'tag-amber' : 'tag-red';
            return (
              <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-text-3">{t.city} · {t.region}</p>
                </td>
                <td className="px-4 py-3 text-sm text-text-2">{(t as any).mrName || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="font-medium">{fmtNumber(t.coveredDoctors30d)}</span>
                  <span className="text-text-3"> / {fmtNumber(t.totalDoctors)}</span>
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <ProgressBar value={t.coveragePct} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn('font-bold text-sm', coverageColor(t.heatmapScore))}>
                    {t.heatmapScore?.toFixed(1) || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('tag', statusClass)}>{statusLabel}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
