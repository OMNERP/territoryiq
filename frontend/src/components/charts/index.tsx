'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadialBarChart, RadialBar, Legend,
} from 'recharts';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#161b2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 12,
  },
  itemStyle: { color: '#8b93a8' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

const TICK_STYLE = { fill: '#5a6380', fontSize: 11 };
const GRID_STYLE = { stroke: 'rgba(255,255,255,0.04)' };

// ── Coverage Trend (Bar) ──────────────────────────────────────────────────────
const COVERAGE_DATA = [
  { month: 'Aug', doctors: 65, customers: 72 },
  { month: 'Sep', doctors: 68, customers: 74 },
  { month: 'Oct', doctors: 71, customers: 78 },
  { month: 'Nov', doctors: 74, customers: 80 },
  { month: 'Dec', doctors: 76, customers: 83 },
  { month: 'Jan', doctors: 78, customers: 85 },
];

export function CoverageTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={COVERAGE_DATA} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" {...GRID_STYLE} />
        <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" domain={[55, 95]} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v: number, name: string) => [`${v}%`, name === 'doctors' ? 'Doctor Coverage' : 'Customer Coverage']}
        />
        <Bar dataKey="doctors"   fill="#4f8ef7" radius={[4,4,0,0]} barSize={18} />
        <Bar dataKey="customers" fill="#34c97e" radius={[4,4,0,0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── MR Performance Donut ──────────────────────────────────────────────────────
const MR_DONUT_DATA = [
  { name: 'On Target',    value: 28, color: '#34c97e' },
  { name: 'Below Target', value: 14, color: '#f5a623' },
  { name: 'Critical',     value: 5,  color: '#f05b5b' },
  { name: 'Inactive',     value: 5,  color: '#3d4460' },
];

export function MrPerformanceDonut() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={MR_DONUT_DATA}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value"
          >
            {MR_DONUT_DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: number, name: string) => [`${v} MRs`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2">
        {MR_DONUT_DATA.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: item.color }} />
            <span className="flex-1 text-text-2">{item.name}</span>
            <span className="font-semibold">{item.value} MRs</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Visit Trend Line ──────────────────────────────────────────────────────────
const VISIT_TREND = [
  { month: 'Aug', visits: 5800, target: 7000 },
  { month: 'Sep', visits: 6200, target: 7000 },
  { month: 'Oct', visits: 6800, target: 7000 },
  { month: 'Nov', visits: 7100, target: 7500 },
  { month: 'Dec', visits: 7400, target: 7500 },
  { month: 'Jan', visits: 7900, target: 8000 },
];

export function VisitTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={VISIT_TREND}>
        <defs>
          <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f8ef7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" {...GRID_STYLE} />
        <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Area
          type="monotone" dataKey="visits"
          stroke="#4f8ef7" strokeWidth={2}
          fill="url(#visitGrad)" dot={{ fill: '#4f8ef7', r: 3 }}
        />
        <Line
          type="monotone" dataKey="target"
          stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}
          strokeDasharray="6 3" dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Product Performance (Horizontal Bar) ──────────────────────────────────────
const PRODUCT_DATA = [
  { product: 'Cardivex',   hits: 1840, color: '#4f8ef7' },
  { product: 'NeuroCal',   hits: 1420, color: '#7c6ff7' },
  { product: 'GlucoMax',   hits: 1680, color: '#34c97e' },
  { product: 'BoneGuard',  hits: 980,  color: '#f5a623' },
  { product: 'ImmunoPlus', hits: 1320, color: '#e85d9e' },
];

export function ProductPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={PRODUCT_DATA} layout="vertical" barSize={12}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" {...GRID_STYLE} />
        <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis dataKey="product" type="category" tick={{ fill: '#e8eaf0', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={85} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v} promotions`]} />
        <Bar dataKey="hits" radius={[0, 4, 4, 0]}>
          {PRODUCT_DATA.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── MR Productivity Scatter-like Bar ──────────────────────────────────────────
const MR_PRODUCTIVITY = [
  { name: 'Rajesh K.',  visits: 180, target: 200, pct: 90 },
  { name: 'Priya S.',   visits: 220, target: 200, pct: 110 },
  { name: 'Arjun M.',   visits: 80,  target: 200, pct: 40 },
  { name: 'Sunita G.',  visits: 175, target: 200, pct: 88 },
  { name: 'Vikram N.',  visits: 42,  target: 200, pct: 21 },
  { name: 'Kavita R.',  visits: 160, target: 200, pct: 80 },
];

export function MrProductivityChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={MR_PRODUCTIVITY}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" {...GRID_STYLE} />
        <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" domain={[0, 120]} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v: number) => [`${v}%`, 'Target Achievement']}
        />
        <Bar dataKey="pct" radius={[4,4,0,0]} barSize={28}>
          {MR_PRODUCTIVITY.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pct >= 100 ? '#34c97e' : entry.pct >= 70 ? '#4f8ef7' : entry.pct >= 40 ? '#f5a623' : '#f05b5b'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Territory Comparison Radar-style Bars ────────────────────────────────────
const TERRITORY_COMPARE = [
  { territory: 'Mumbai',     coverage: 79, score: 88 },
  { territory: 'Pune',       coverage: 88, score: 95 },
  { territory: 'Delhi',      coverage: 49, score: 51 },
  { territory: 'Bangalore',  coverage: 66, score: 70 },
  { territory: 'Chennai',    coverage: 49, score: 46 },
  { territory: 'Hyderabad',  coverage: 76, score: 81 },
];

export function TerritoryComparisonChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={TERRITORY_COMPARE} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" {...GRID_STYLE} />
        <XAxis dataKey="territory" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" domain={[0, 110]} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v: number, name: string) => [`${v}%`, name === 'coverage' ? 'Coverage' : 'Score']}
        />
        <Bar dataKey="coverage" fill="#4f8ef7" radius={[4,4,0,0]} barSize={14} />
        <Bar dataKey="score"    fill="#26d4d4" radius={[4,4,0,0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Sparkline mini-bars ───────────────────────────────────────────────────────
export function Sparkline({ data, color = '#4f8ef7' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background: color,
            opacity: 0.4 + (v / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}
