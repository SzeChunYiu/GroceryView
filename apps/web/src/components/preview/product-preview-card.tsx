'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ProductSummary } from '@/lib/mvp/types';
import { formatDealLabel, formatSek } from '@/lib/mvp/format';
import { productSlugHref } from '@/lib/mvp/routes';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { EvidenceDrawer } from './evidence-drawer';
import { PreviewDrawer } from './preview-drawer';

/** Frontstage product fields exposed to preview UI (matches interaction_matrix product_card.frontstage). */
export type ProductPreviewCardProps = Readonly<{
  product: ProductSummary;
}>;

export function ProductPreviewCard({ product }: ProductPreviewCardProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fullPageHref = productSlugHref(product.slug);

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-200">
        <div className="flex gap-3">
          {product.imageUrl ? (
            <Image alt="" className="h-16 w-16 rounded-xl object-cover" height={64} src={product.imageUrl} width={64} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">No image</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {product.dealLabel ? <DealBadge label={product.dealLabel} /> : null}
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{product.categoryName}</span>
            </div>
            <h3 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{product.name}</h3>
            {product.brand ? <p className="text-sm font-semibold text-slate-600">{product.brand}</p> : null}
            {product.currentBestPrice !== undefined ? (
              <p className="mt-2 text-xl font-black text-emerald-800">{formatSek(product.currentBestPrice)}</p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-amber-800">Price unavailable in verified snapshot</p>
            )}
            <div className="mt-2">
              <EvidenceStrip evidence={product} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                ref={triggerRef}
                aria-expanded={open}
                className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white"
                data-quick-view="product"
                onClick={() => setOpen(true)}
                type="button"
              >
                Quick view
              </button>
              <Link className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-900" href={fullPageHref}>
                Open product
              </Link>
            </div>
          </div>
        </div>
      </article>

      <PreviewDrawer
        onClose={() => setOpen(false)}
        open={open}
        title={product.name}
        triggerRef={triggerRef}
      >
        <div className="space-y-4">
          {product.dealLabel ? (
            <p className="text-sm font-black text-emerald-900">{formatDealLabel(product.dealLabel)}</p>
          ) : null}
          {product.currentBestPrice !== undefined ? (
            <p className="text-2xl font-black text-emerald-800">{formatSek(product.currentBestPrice)}</p>
          ) : null}
          {product.currentBestChain ? (
            <p className="text-sm font-semibold text-slate-700">Best observed at {product.currentBestChain}</p>
          ) : null}
          <EvidenceStrip evidence={product} />
          <EvidenceDrawer evidence={product} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={fullPageHref}>
            Open full product page
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
