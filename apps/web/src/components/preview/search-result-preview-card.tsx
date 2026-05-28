'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ConfidenceLabel, FreshnessLabel, ProductSummary } from '@/lib/mvp/types';
import { formatSek } from '@/lib/mvp/format';
import { productSlugHref } from '@/lib/mvp/routes';
import { EvidenceDrawer } from './evidence-drawer';
import { PreviewDrawer } from './preview-drawer';

export type SearchResultPreviewCardProps = Readonly<{
  card: {
    slug: string;
    name: string;
    brand: string;
    imageUrl?: string | null;
    categoryLabel: string;
    cheapestPrice: number | null;
    cheapestPriceLabel: string;
    unitPriceLabel: string;
    chainLabel: string;
    sortConfidence: number;
    sortNewestObservedAt: string;
  };
  sourceLabel?: string;
}>;

function confidenceLabelFromScore(score: number): ConfidenceLabel {
  if (score >= 0.75) return 'high';
  if (score >= 0.45) return 'medium';
  if (score > 0) return 'low';
  return 'unknown';
}

function searchCardToProductSummary(card: SearchResultPreviewCardProps['card'], sourceLabel: string): ProductSummary {
  return {
    id: card.slug,
    slug: card.slug,
    name: card.name,
    brand: card.brand,
    categorySlug: card.categoryLabel,
    categoryName: card.categoryLabel,
    imageUrl: card.imageUrl ?? undefined,
    currentBestPrice: card.cheapestPrice ?? undefined,
    currentBestPriceCurrency: 'SEK',
    sourceLabel,
    lastObservedAt: card.sortNewestObservedAt,
    freshnessLabel: 'unknown' satisfies FreshnessLabel,
    confidence: card.sortConfidence,
    confidenceLabel: confidenceLabelFromScore(card.sortConfidence),
    observationCount: 1
  };
}

/** Search result row with quick-view drawer — keeps search page SSR-friendly via client boundary. */
export function SearchResultPreviewCard({ card, sourceLabel = 'OpenPrices + chain rows' }: SearchResultPreviewCardProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fullPageHref = productSlugHref(card.slug);
  const previewProduct = searchCardToProductSummary(card, sourceLabel);

  return (
    <>
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{card.categoryLabel}</p>
        <h3 className="mt-2 text-lg font-black text-slate-950">{card.name}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">{card.brand}</p>
        <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
          <p className="text-xl font-black text-emerald-950">{card.cheapestPriceLabel}</p>
          <p className="mt-1 text-sm font-bold text-emerald-800">{card.unitPriceLabel}</p>
        </div>
        <p className="mt-3 text-xs font-bold text-slate-500">{card.chainLabel}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            ref={triggerRef}
            aria-expanded={open}
            className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white"
            data-quick-view="search-result"
            onClick={() => setOpen(true)}
            type="button"
          >
            Quick view
          </button>
          <Link className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-900" href={fullPageHref}>
            Open product
          </Link>
        </div>
      </article>

      <PreviewDrawer
        onClose={() => setOpen(false)}
        open={open}
        title={card.name}
        triggerRef={triggerRef}
      >
        <div className="space-y-4">
          <p className="text-2xl font-black text-emerald-950">
            {card.cheapestPrice != null ? formatSek(card.cheapestPrice) : card.cheapestPriceLabel}
          </p>
          <p className="text-sm font-bold text-emerald-800">{card.unitPriceLabel}</p>
          <p className="text-sm font-semibold text-slate-700">{card.chainLabel}</p>
          <EvidenceDrawer evidence={previewProduct} />
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
