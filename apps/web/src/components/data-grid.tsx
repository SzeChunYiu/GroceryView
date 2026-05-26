import type { ComponentPropsWithoutRef } from 'react';
import { productImageCdnUrl } from '@/lib/imageCdn';

export const dataGridRowStripingClass = '[&_tbody_tr:nth-child(even)]:bg-slate-50 [&_[role=row]:nth-child(even)]:bg-slate-50';
export const dataGridActionClass = 'rounded-full border border-slate-300 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-700';
export const dataGridVirtualStatusClass = 'rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm';

type DataGridProps = ComponentPropsWithoutRef<'div'> & {
  striped?: boolean;
  dense?: boolean;
};

type DataGridProductCellProps = {
  brand?: string | null;
  imageUrl?: string | null;
  name: string;
  sourceUrl?: string | null;
  unitLabel?: string | null;
};

type DataGridIssueBadgeProps = {
  children: string;
  tone?: 'danger' | 'review' | 'warning';
};

export function DataGrid({ className = '', striped = true, dense = false, ...props }: Readonly<DataGridProps>) {
  const striping = striped ? dataGridRowStripingClass : '';
  return (
    <div
      {...props}
      className={[
        'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        '[&_table]:w-full [&_td]:border-t [&_td]:border-slate-100 [&_th]:text-left',
        dense ? '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2' : '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3',
        striping,
        className
      ].filter(Boolean).join(' ')}
    />
  );
}

export function DataGridProductCell({ brand, imageUrl, name, sourceUrl, unitLabel }: Readonly<DataGridProductCellProps>) {
  return (
    <div className="flex min-w-64 gap-3">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain" loading="lazy" src={productImageCdnUrl(imageUrl, { width: 56 })} />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs font-black text-slate-400">No image</div>
      )}
      <div>
        <p className="font-black text-slate-950">{name}</p>
        <p className="text-xs text-slate-500">{brand || 'Unknown brand'} · {unitLabel || 'unit missing'}</p>
        {sourceUrl ? (
          <a className="mt-1 inline-flex text-xs font-black text-sky-800 underline decoration-sky-300 underline-offset-4" href={sourceUrl}>
            Source URL
          </a>
        ) : (
          <p className="mt-1 text-xs font-semibold text-slate-400">Source URL missing</p>
        )}
      </div>
    </div>
  );
}

export function DataGridIssueBadge({ children, tone = 'warning' }: Readonly<DataGridIssueBadgeProps>) {
  const toneClass = tone === 'danger'
    ? 'border-red-200 bg-red-50 text-red-800'
    : tone === 'review'
      ? 'border-violet-200 bg-violet-50 text-violet-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${toneClass}`}>
      {children}
    </span>
  );
}
