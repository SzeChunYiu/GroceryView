'use client';

import { cn } from '@/lib/utils';

export type SortOption = {
  id: string;
  label: string;
};

export function SortControl({
  label = 'Sort by',
  options,
  value,
  onChange,
  className
}: Readonly<{
  label?: string;
  options: SortOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}>) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[length:var(--gv-text-micro)] font-bold uppercase tracking-[0.16em] text-[color:var(--gv-muted)]">{label}</span>
      <select
        className="rounded-[length:var(--gv-radius-control)] border border-[color:var(--gv-border)] bg-[var(--gv-surface)] px-3 py-2 text-[length:var(--gv-text-small)] font-semibold text-[color:var(--gv-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gv-primary)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
