import type { ComponentPropsWithoutRef } from 'react';

export const dataGridRowStripingClass = '[&_tbody_tr:nth-child(even)]:bg-slate-50 [&_[role=row]:nth-child(even)]:bg-slate-50';

type DataGridProps = ComponentPropsWithoutRef<'div'> & {
  compact?: boolean;
  striped?: boolean;
};

export function DataGrid({ className = '', compact = false, striped = true, ...props }: Readonly<DataGridProps>) {
  const striping = striped ? dataGridRowStripingClass : '';
  const density = compact
    ? '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2'
    : '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3';
  return (
    <div
      {...props}
      className={[
        'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        '[&_table]:w-full [&_td]:border-t [&_td]:border-slate-100 [&_th]:text-left',
        density,
        striping,
        className
      ].filter(Boolean).join(' ')}
    />
  );
}
