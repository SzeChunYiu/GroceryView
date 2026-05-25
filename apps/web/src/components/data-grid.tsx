import type { ComponentPropsWithoutRef } from 'react';

export const dataGridRowStripingClass = '[&_tbody_tr:nth-child(even)]:bg-slate-50 [&_[role=row]:nth-child(even)]:bg-slate-50';

type DataGridProps = ComponentPropsWithoutRef<'div'> & {
  striped?: boolean;
  density?: 'comfortable' | 'compact';
  scrollX?: boolean;
};

export function DataGrid({ className = '', density = 'comfortable', scrollX = false, striped = true, ...props }: Readonly<DataGridProps>) {
  const striping = striped ? dataGridRowStripingClass : '';
  const densityClass = density === 'compact'
    ? '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_td]:text-sm [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-[0.12em]'
    : '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3';
  return (
    <div
      {...props}
      className={[
        'rounded-3xl border border-slate-200 bg-white shadow-sm',
        scrollX ? 'overflow-x-auto' : 'overflow-hidden',
        '[&_table]:w-full [&_td]:border-t [&_td]:border-slate-100 [&_th]:text-left [&_th]:font-black [&_th]:text-slate-700',
        densityClass,
        striping,
        className
      ].filter(Boolean).join(' ')}
    />
  );
}
