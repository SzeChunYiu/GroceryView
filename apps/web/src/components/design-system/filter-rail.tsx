'use client';

import { cn } from '@/lib/utils';

export type FilterRailOption = {
  id: string;
  label: string;
  count?: number;
};

export function FilterRail({
  label = 'Filters',
  options,
  value,
  onChange,
  className
}: Readonly<{
  label?: string;
  options: FilterRailOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}>) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="group" aria-label={label}>
      <p className="text-[length:var(--gv-text-micro)] font-bold uppercase tracking-[0.16em] text-[color:var(--gv-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[length:var(--gv-text-small)] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gv-primary)]',
                active
                  ? 'border-[color:var(--gv-primary)] bg-[var(--gv-primary)] text-white'
                  : 'border-[color:var(--gv-border)] bg-[var(--gv-surface)] text-[color:var(--gv-ink-soft)] hover:bg-[var(--gv-primary-soft)]'
              )}
              onClick={() => onChange(option.id)}
              type="button"
            >
              {option.label}
              {option.count !== undefined ? <span className="ml-1 opacity-80">({option.count})</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
