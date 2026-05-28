'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { formatSek } from '@/lib/mvp/format';
import type { VerifiedEvidence } from '@/lib/mvp/types';
import { PreviewDrawer } from './preview-drawer';

export type StorePreviewCardProps = Readonly<{
  storeName: string;
  storeSlug: string;
  chainLabel: string;
  productCount?: number;
  lowestPrice?: number;
  evidence: VerifiedEvidence;
}>;

export function StorePreviewCard({
  storeName,
  storeSlug,
  chainLabel,
  productCount,
  lowestPrice,
  evidence
}: StorePreviewCardProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fullPageHref = `/stores/${encodeURIComponent(storeSlug)}`;

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{chainLabel}</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">{storeName}</h3>
        {lowestPrice !== undefined ? <p className="mt-2 text-xl font-black text-emerald-800">{formatSek(lowestPrice)}</p> : null}
        {productCount !== undefined ? (
          <p className="mt-1 text-sm font-semibold text-slate-600">{productCount.toLocaleString('sv-SE')} products in snapshot</p>
        ) : null}
        <div className="mt-2">
          <EvidenceStrip evidence={evidence} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            ref={triggerRef}
            aria-expanded={open}
            className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white"
            data-quick-view="store"
            onClick={() => setOpen(true)}
            type="button"
          >
            Quick view
          </button>
          <Link className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-900" href={fullPageHref}>
            Open store
          </Link>
        </div>
      </article>
      <PreviewDrawer onClose={() => setOpen(false)} open={open} title={storeName} triggerRef={triggerRef}>
        <EvidenceStrip evidence={evidence} />
        <Link className="mt-4 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={fullPageHref}>
          Open full store page
        </Link>
      </PreviewDrawer>
    </>
  );
}
