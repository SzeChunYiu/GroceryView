'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { AdaptiveProductCard } from '@/lib/verified-data';

type CompareMode = 'adaptive' | 'total' | 'unit';

const storageKey = 'groceryview:product-card-compare-mode';
const compareModes: Array<{ label: string; value: CompareMode; help: string }> = [
  { label: 'Adaptive', value: 'adaptive', help: 'Commodity cards lead with unit price; branded cards lead with total price.' },
  { label: 'Total', value: 'total', help: 'Sort and lead every card by the observed pack price.' },
  { label: 'Per kg / l / st', value: 'unit', help: 'Sort and lead every card by comparable unit price when package size is known.' }
];

function resolvedMode(card: AdaptiveProductCard, compareMode: CompareMode): 'total' | 'unit' {
  if (compareMode === 'adaptive') return card.defaultCompareMode;
  return compareMode;
}

function sortValue(card: AdaptiveProductCard, compareMode: CompareMode) {
  const mode = resolvedMode(card, compareMode);
  if (mode === 'unit') return card.unitSortPrice ?? Number.POSITIVE_INFINITY;
  return card.totalSortPrice;
}

function primaryLabel(card: AdaptiveProductCard, compareMode: CompareMode) {
  const mode = resolvedMode(card, compareMode);
  return mode === 'unit' && card.unitSortPrice !== null ? card.unitPriceLabel : card.totalPriceLabel;
}

function secondaryLabel(card: AdaptiveProductCard, compareMode: CompareMode) {
  const mode = resolvedMode(card, compareMode);
  const alternatePrice = mode === 'unit' && card.unitSortPrice !== null
    ? card.totalPriceLabel
    : card.unitPriceLabel;
  return `${alternatePrice} · ${card.packageLabel}`;
}

export function ProductPriceCards({
  cards,
  eyebrow = 'Adaptive product cards',
  title = 'Total and comparable unit prices together',
  intro = 'Every card shows the actual observed pack price plus a comparable unit price when package size evidence exists.'
}: Readonly<{
  cards: AdaptiveProductCard[];
  eyebrow?: string;
  title?: string;
  intro?: string;
}>) {
  const [compareMode, setCompareMode] = useState<CompareMode>('adaptive');

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'adaptive' || stored === 'total' || stored === 'unit') {
      setCompareMode(stored);
    }
  }, []);

  const sortedCards = useMemo(() => [...cards].sort((left, right) => {
    const delta = sortValue(left, compareMode) - sortValue(right, compareMode);
    return delta === 0 ? left.name.localeCompare(right.name, 'sv') : delta;
  }), [cards, compareMode]);

  function chooseMode(value: CompareMode) {
    setCompareMode(value);
    window.localStorage.setItem(storageKey, value);
  }

  return (
    <section className="rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm" data-compare-mode={compareMode}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{intro}</p>
          <p className="mt-2 text-xs font-bold text-amber-800">No synthetic unit prices: unit rows are derived only from observed price plus reported package size.</p>
          <p className="mt-1 text-xs font-bold text-amber-800">No synthetic product images: cards render only source image URLs from Axfood, OpenPrices, or OpenFoodFacts rows.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Compare by:</p>
          <div className="flex flex-wrap gap-2">
            {compareModes.map((mode) => (
              <button
                aria-pressed={compareMode === mode.value}
                className={`rounded-full px-3 py-2 text-xs font-black transition ${compareMode === mode.value ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 hover:bg-emerald-50'}`}
                key={mode.value}
                onClick={() => chooseMode(mode.value)}
                title={mode.help}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedCards.map((card) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-700"
            href={`/products/${card.slug}`}
            key={card.slug}
          >
            {card.imageUrl && card.imageAlt ? (
              <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl border border-white bg-white p-3 shadow-sm">
                <Image
                  alt={card.imageAlt}
                  className="max-h-full max-w-full object-contain"
                  height={144}
                  sizes="(min-width: 1280px) 16vw, (min-width: 768px) 33vw, 80vw"
                  src={card.imageUrl}
                  width={144}
                />
              </div>
            ) : (
              <p className="mb-4 rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-xs font-bold text-slate-500">No synthetic product images: verified image URL missing.</p>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{card.productKind}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{card.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{card.brand}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[0.7rem] font-black text-slate-700">{resolvedMode(card, compareMode)}</span>
            </div>
            <p className="mt-4 text-3xl font-black text-emerald-800">{primaryLabel(card, compareMode)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{secondaryLabel(card, compareMode)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.sourceLabel}</p>
            <p className="mt-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-950">{card.confidenceLabel}</p>
            {card.cheapestUnitBadge ? (
              <p className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">{card.cheapestUnitBadge}</p>
            ) : (
              <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">cheapest-per-unit badge waits for cross-chain unit evidence</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
