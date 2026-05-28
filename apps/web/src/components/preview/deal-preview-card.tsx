'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { RelatedLinksPanel } from '@/components/mvp/related-links-panel';
import { formatDealLabel, formatSek } from '@/lib/mvp/format';
import type { DealEvaluation } from '@/lib/mvp/types';
import {
  categoryBrowseHref,
  categoryMarketHref,
  methodologyDealScoreHref,
  productRoute,
  searchRoute,
  storeSlugHref
} from '@/lib/mvp/routes';
import { trackGroceryViewEvent } from '@/lib/analytics';
import { EvidenceDrawer } from './evidence-drawer';
import { PreviewDrawer } from './preview-drawer';

export type DealPreviewCardProps = Readonly<{
  deal: DealEvaluation;
}>;

export function DealPreviewCard({ deal }: DealPreviewCardProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const product = deal.product;
  const fullPageHref = `/products/${product.slug}`;

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {product.dealLabel ? <DealBadge label={product.dealLabel} /> : null}
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{product.categoryName}</span>
        </div>
        <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
        <p className="mt-2 text-xl font-black text-emerald-800">{formatSek(deal.currentPrice)}</p>
        <div className="mt-2">
          <EvidenceStrip evidence={product} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            ref={triggerRef}
            aria-expanded={open}
            className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white"
            data-quick-view="deal"
            onClick={() => {
              setOpen(true);
              trackGroceryViewEvent({
                eventName: 'deal_opened',
                sourcePanel: 'deals_feed',
                entityType: 'product',
                entityId: product.slug
              });
              trackGroceryViewEvent({
                eventName: 'preview_opened',
                sourcePanel: 'deal_why_ranked',
                entityType: 'product',
                entityId: product.slug
              });
            }}
            type="button"
          >
            Why this deal?
          </button>
          <Link
            className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-900"
            href={fullPageHref}
            onClick={() => {
              trackGroceryViewEvent({
                eventName: 'deal_card_clicked',
                sourcePanel: 'deals_feed',
                entityType: 'product',
                entityId: product.slug
              });
            }}
          >
            Open product
          </Link>
        </div>
      </article>
      <PreviewDrawer onClose={() => setOpen(false)} open={open} title={product.name} triggerRef={triggerRef}>
        {product.dealLabel ? <p className="text-sm font-black text-emerald-900">{formatDealLabel(product.dealLabel)}</p> : null}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
          {deal.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <div className="mt-3">
          <EvidenceDrawer evidence={product} />
        </div>
        <div className="mt-4">
          <RelatedLinksPanel
            links={[
              { label: 'Product detail', href: productRoute(product.id), detail: product.name },
              {
                label: `Search ${product.name}`,
                href: searchRoute({ q: product.name, category: product.categorySlug, chain: deal.chain?.toLowerCase() })
              },
              { label: `${product.categoryName} market`, href: categoryMarketHref(product.categorySlug) },
              { label: `Browse ${product.categoryName}`, href: categoryBrowseHref(product.categorySlug) },
              ...(deal.chain
                ? [{ label: `${deal.chain} store`, href: storeSlugHref(deal.chain.toLowerCase()), detail: 'Chain landing when store ID unavailable' }]
                : []),
              { label: 'How deal score works', href: methodologyDealScoreHref() }
            ]}
          />
        </div>
        <Link className="mt-4 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={fullPageHref}>
          Open full product page
        </Link>
      </PreviewDrawer>
    </>
  );
}
