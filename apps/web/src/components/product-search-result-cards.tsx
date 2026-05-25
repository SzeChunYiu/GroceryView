'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { compareModeStorageKey, normalizeCompareMode, type CompareMode } from '@/lib/compare-mode';

export type ProductSearchResultCard = {
  slug: string;
  name: string;
  brand: string;
  imageUrl?: string;
  categoryLabel: string;
  cheapestPriceLabel: string;
  unitPriceLabel: string;
  totalSortPrice: number;
  unitSortPrice: number | null;
  isAvailable: boolean;
  chainLabel: string;
  sourceTables: string[];
  allergenRiskBadges: Array<{ label: string; matchedTerms: string[] }>;
};

function resolvedMode(compareMode: CompareMode): 'total' | 'unit' {
  return compareMode === 'unit' ? 'unit' : 'total';
}

function sortValue(card: ProductSearchResultCard, compareMode: CompareMode) {
  return resolvedMode(compareMode) === 'unit'
    ? card.unitSortPrice ?? Number.POSITIVE_INFINITY
    : card.totalSortPrice;
}

function primaryPrice(card: ProductSearchResultCard, compareMode: CompareMode) {
  return resolvedMode(compareMode) === 'unit' && card.unitSortPrice !== null
    ? card.unitPriceLabel
    : card.cheapestPriceLabel;
}

function secondaryPrice(card: ProductSearchResultCard, compareMode: CompareMode) {
  return resolvedMode(compareMode) === 'unit' && card.unitSortPrice !== null
    ? card.cheapestPriceLabel
    : card.unitPriceLabel;
}

export function ProductSearchResultCards({ cards }: Readonly<{ cards: ProductSearchResultCard[] }>) {
  const [compareMode, setCompareMode] = useState<CompareMode>('total');

  useEffect(() => {
    const stored = normalizeCompareMode(window.localStorage.getItem(compareModeStorageKey));
    if (stored) setCompareMode(stored);
  }, []);

  const sortedCards = useMemo(() => [...cards].sort((left, right) => {
    const delta = sortValue(left, compareMode) - sortValue(right, compareMode);
    return delta === 0 ? left.name.localeCompare(right.name, 'sv-SE') : delta;
  }), [cards, compareMode]);

  function chooseMode(value: 'total' | 'unit') {
    setCompareMode(value);
    window.localStorage.setItem(compareModeStorageKey, value);
  }

  return (
    <div data-search-compare-mode={resolvedMode(compareMode)}>
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Search compare by</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">The same local preference controls listing sort and the dominant price line.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            aria-pressed={resolvedMode(compareMode) === 'total'}
            className={`rounded-full px-3 py-2 text-xs font-black ${resolvedMode(compareMode) === 'total' ? 'bg-violet-900 text-white' : 'bg-violet-50 text-violet-950'}`}
            onClick={() => chooseMode('total')}
            type="button"
          >
            Total
          </button>
          <button
            aria-pressed={resolvedMode(compareMode) === 'unit'}
            className={`rounded-full px-3 py-2 text-xs font-black ${resolvedMode(compareMode) === 'unit' ? 'bg-violet-900 text-white' : 'bg-violet-50 text-violet-950'}`}
            onClick={() => chooseMode('unit')}
            type="button"
          >
            Per kg / l / st
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedCards.map((product) => (
          <Link className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
            <div className="flex gap-3">
              {product.imageUrl ? (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
                  <Image alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="80px" src={product.imageUrl} width={80} />
                </div>
              ) : null}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
                  {product.allergenRiskBadges.map((badge) => (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-amber-900" key={badge.label} title={"Matched: " + badge.matchedTerms.join(", ")}>{badge.label}</span>
                  ))}
                  {product.isAvailable === false ? (
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">Out of stock</span>
                  ) : null}
                </div>
                <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
              <p className="text-lg text-violet-950">{primaryPrice(product, compareMode)}</p>
              <p>{secondaryPrice(product, compareMode)} · {resolvedMode(compareMode)} sort</p>
              <p>{product.chainLabel}</p>
              <p className="text-violet-800">sourceTables: {product.sourceTables.join(' · ')}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
