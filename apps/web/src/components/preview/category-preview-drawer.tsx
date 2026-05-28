'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { CategoryIndexRow } from '@/lib/mvp/types';
import { formatConfidenceLabel, formatPercent } from '@/lib/mvp/format';
import { categoryMarketHref } from '@/lib/mvp/routes';
import { PreviewDrawer } from './preview-drawer';

type CategoryPreviewDrawerProps = {
  row: Pick<
    CategoryIndexRow,
    'categorySlug' | 'categoryName' | 'weeklyChangePct' | 'threeMonthChangePct' | 'oneYearChangePct' | 'confidenceLabel'
  >;
  triggerLabel?: string;
};

/** Stub preview for market category rows — trend summary before opening the full category page. */
export function CategoryPreviewDrawer({ row, triggerLabel = 'Preview trend' }: Readonly<CategoryPreviewDrawerProps>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fullPageHref = categoryMarketHref(row.categorySlug);

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-800"
        onClick={() => setOpen(true)}
        type="button"
      >
        {triggerLabel}
      </button>
      <PreviewDrawer
        onClose={() => setOpen(false)}
        open={open}
        title={row.categoryName}
        triggerRef={triggerRef}
      >
        <dl className="grid gap-3 text-sm font-semibold text-slate-700">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Weekly</dt>
              <dd className="mt-1 font-black text-slate-950">{formatPercent(row.weeklyChangePct)}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">3m</dt>
              <dd className="mt-1 font-black text-slate-950">{formatPercent(row.threeMonthChangePct)}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">1y</dt>
              <dd className="mt-1 font-black text-slate-950">{formatPercent(row.oneYearChangePct)}</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Confidence</dt>
            <dd className="mt-1 text-slate-950">{formatConfidenceLabel(row.confidenceLabel)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={fullPageHref}>
            Open category page
          </Link>
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-800"
            onClick={() => setOpen(false)}
            type="button"
          >
            Close
          </button>
        </div>
      </PreviewDrawer>
    </>
  );
}
