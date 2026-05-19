import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(date: string | Date | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, pattern);
  } catch {
    return '—';
  }
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function fmtNumber(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
}

export function pct(value: number, total: number, decimals = 1): string {
  if (!total) return '0%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

export function coverageColor(pct: number): string {
  if (pct >= 80) return 'text-success';
  if (pct >= 60) return 'text-warning';
  return 'text-danger';
}

export function coverageBg(pct: number): string {
  if (pct >= 80) return 'bg-success';
  if (pct >= 60) return 'bg-warning';
  return 'bg-danger';
}

export function statusTag(status: string): string {
  const map: Record<string, string> = {
    active:   'tag-green',
    idle:     'tag-amber',
    offline:  'tag-gray',
    inactive: 'tag-gray',
    on_leave: 'tag-amber',
    valid:    'tag-green',
    invalid:  'tag-red',
    suspicious: 'tag-amber',
    unverified: 'tag-gray',
    high:     'tag-red',
    medium:   'tag-amber',
    low:      'tag-green',
    positive: 'tag-green',
    negative: 'tag-red',
    neutral:  'tag-gray',
    follow_up_required: 'tag-amber',
    critical: 'tag-red',
    warning:  'tag-amber',
    info:     'tag-blue',
    pharmacy:            'tag-blue',
    clinic:              'tag-purple',
    hospital:            'tag-cyan',
    healthcare_retailer: 'tag-amber',
  };
  return map[status] || 'tag-gray';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}

export const AVATAR_GRADIENTS = [
  'from-accent to-accent-2',
  'from-success to-info',
  'from-warning to-danger',
  'from-pink to-accent-2',
  'from-info to-accent',
];

export function avatarGradient(id: string): string {
  const i = id.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[i];
}
