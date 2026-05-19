'use client';
import { cn, statusTag } from '@/lib/utils';
import React from 'react';

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={cn('border-2 border-accent/30 border-t-accent rounded-full animate-spin', s)} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

// ── Badge / Tag ───────────────────────────────────────────────────────────────
export function Badge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('tag', statusTag(value), className)}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-3">
      <span className="text-5xl opacity-30">{icon}</span>
      <p className="font-medium text-text-2 text-sm">{title}</p>
      {desc && <p className="text-xs">{desc}</p>}
    </div>
  );
}

// ── Data Table ────────────────────────────────────────────────────────────────
interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, keyField = 'id', onRowClick, loading,
}: TableProps<T>) {
  if (loading) return <PageSpinner />;
  if (!data.length) return <EmptyState title="No records found" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-white/[0.04] last:border-0 transition-colors',
                onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[13px]">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const bg = color || (value >= 80 ? 'bg-success' : value >= 60 ? 'bg-warning' : 'bg-danger');
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-bg-4 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', bg)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{value.toFixed ? value.toFixed(1) : value}%</span>
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('flex items-center gap-2 input', className)}>
      <span className="text-text-3">🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm placeholder-text-3"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-text-3 hover:text-text">✕</button>
      )}
    </div>
  );
}

// ── Filter Chips ──────────────────────────────────────────────────────────────
interface FilterChipsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-all',
            value === opt.value
              ? 'bg-accent text-white border-accent'
              : 'text-text-2 border-white/10 hover:border-accent hover:text-accent'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Stat Row (for cards) ──────────────────────────────────────────────────────
export function StatRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12.5px] text-text-3">{label}</span>
      <span className={cn('text-[12.5px] font-semibold', valueColor || 'text-text')}>{value}</span>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
      <h3 className="font-display font-semibold text-sm">{title}</h3>
      {action}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
import { initials, avatarGradient } from '@/lib/utils';

export function Avatar({ name, id, size = 'md' }: { name: string; id?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-11 h-11 text-sm' }[size];
  const grad = avatarGradient(id || name);
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-gradient-to-br', s, grad)}>
      {initials(name)}
    </div>
  );
}
