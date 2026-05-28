import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdSlot({
  children,
  label = 'Advertisement',
  minHeight = 120,
  className
}: Readonly<{
  children?: ReactNode;
  label?: string;
  minHeight?: number;
  className?: string;
}>) {
  return (
    <aside
      aria-label={label}
      className={cn(
        'rounded-[length:var(--gv-radius-card)] border border-dashed border-[color:var(--gv-border)] bg-[var(--gv-surface-muted)] p-4',
        className
      )}
      style={{ minHeight }}
    >
      <p className="text-[length:var(--gv-text-micro)] font-bold uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">{label}</p>
      <div className="mt-3 flex min-h-[calc(100%-1.5rem)] items-center justify-center text-[length:var(--gv-text-small)] text-[color:var(--gv-muted)]">
        {children ?? 'Reserved ad placement'}
      </div>
    </aside>
  );
}
