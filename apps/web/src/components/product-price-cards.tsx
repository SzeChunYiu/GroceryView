'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { LazyItemCard } from './LazyItemCard';
import { FavouriteProductToggle } from './favourite-product-toggle';
import { matchesVolatilityFilter, volatilityBadgeForProductCard, volatilityFilterOptions, type VolatilityBand, type VolatilityFilter } from '@/lib/price-intelligence';
import type { AdaptiveProductCard } from '@/lib/verified-data';

type CompareMode = 'adaptive' | 'total' | 'unit';

const storageKey = 'groceryview:product-card-compare-mode';
const compareModes: Array<{ label: string; value: CompareMode; help: string }> = [
  { label: 'Adaptive', value: 'adaptive', help: 'Commodity cards lead with unit price; branded cards lead with total price.' },
  { label: 'Total', value: 'total', help: 'Sort and lead every card by the observed pack price.' },
  { label: 'Per kg / l / st / 100 g', value: 'unit', help: 'Sort and lead every card by comparable jämförpris when package size is known.' }
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

function volatilityBadgeClass(band: VolatilityBand) {
  if (band === 'stable') return 'bg-emerald-100 text-emerald-950';
  if (band === 'volatile') return 'bg-rose-100 text-rose-950';
  return 'bg-amber-100 text-amber-950';
}

function sparklinePath(points: AdaptiveProductCard['sparklinePoints'], width = 160, height = 44) {
  if (points.length < 2) return null;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function PriceHistorySparkline({ card }: Readonly<{ card: AdaptiveProductCard }>) {
  const path = sparklinePath(card.sparklinePoints);
  const latest = card.sparklinePoints.at(-1);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">7-day price history</p>
        <p className="text-xs font-bold text-slate-700">{latest?.priceLabel ?? 'No line yet'}</p>
      </div>
      {path ? (
        <svg
          aria-label={`${card.name} 7-day price history sparkline`}
          className="mt-2 h-11 w-full overflow-visible motion-reduce:transition-none"
          data-chart-motion="static"
          preserveAspectRatio="none"
          role="img"
          viewBox="0 0 160 44"
        >
          <title>{`${card.name} 7-day price history`}</title>
          <path d="M 0 44 L 160 44" fill="none" stroke="#e2e8f0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke="#059669" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <p className="mt-2 rounded-xl bg-slate-50 p-2 text-xs font-semibold text-slate-600">Needs at least two observed price-history points.</p>
      )}
      <p className="mt-2 text-xs font-semibold text-slate-600">{card.sparklineLabel}</p>
    </div>
  );
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
  const [volatilityFilter, setVolatilityFilter] = useState<VolatilityFilter>('all');

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'adaptive' || stored === 'total' || stored === 'unit') {
      setCompareMode(stored);
    }
  }, []);

  const volatilityCounts = useMemo(() => volatilityFilterOptions.reduce<Record<VolatilityFilter, number>>((counts, option) => ({
    ...counts,
    [option.value]: option.value === 'all' ? cards.length : cards.filter((card) => matchesVolatilityFilter(card, option.value)).length
  }), { all: 0, stable: 0, watch: 0, volatile: 0 }), [cards]);

  const sortedCards = useMemo(() => cards
    .filter((card) => matchesVolatilityFilter(card, volatilityFilter))
    .sort((left, right) => {
      const delta = sortValue(left, compareMode) - sortValue(right, compareMode);
      return delta === 0 ? left.name.localeCompare(right.name, 'sv') : delta;
    }), [cards, compareMode, volatilityFilter]);

  function chooseMode(value: CompareMode) {
    setCompareMode(value);
    window.localStorage.setItem(storageKey, value);
  }

  return (
    <section className="rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm" data-compare-mode={compareMode} data-volatility-filter={volatilityFilter}>
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
                className={`rounded-full px-3 py-2 text-xs font-black motion-safe:transition ${compareMode === mode.value ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 hover:bg-emerald-50'}`}
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
      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Volatility filters</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {volatilityFilterOptions.map((option) => (
            <button
              aria-pressed={volatilityFilter === option.value}
              className={`rounded-full px-3 py-2 text-xs font-black motion-safe:transition ${volatilityFilter === option.value ? 'bg-amber-900 text-white' : 'bg-white text-amber-950 hover:bg-amber-100'}`}
              key={option.value}
              onClick={() => setVolatilityFilter(option.value)}
              title={option.help}
              type="button"
            >
              {option.label} · {volatilityCounts[option.value]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-amber-950">
          Stable/watch/volatile filters use the 7-day observed price-history badge data already loaded for these cards; no forecasted prices are added.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedCards.map((card, index) => (
          <div className="relative" key={card.slug}>
            <FavouriteProductToggle
              className="absolute right-3 top-3 z-10"
              product={{ slug: card.slug, name: card.name, imageUrl: card.imageUrl }}
            />
            <LazyItemCard
              className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 motion-safe:transition motion-safe:hover:-translate-y-0.5 hover:border-emerald-700"
              compareMode={compareMode}
              href={`/products/${card.slug}`}
              itemId={card.slug}
              itemName={card.name}
              listId="adaptive-product-cards"
              listIndex={index}
            >
            {(() => {
              const volatilityBadge = volatilityBadgeForProductCard(card);
              return (
                <>
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
              <div className="flex flex-col items-end gap-2">
                {card.isAvailable === false ? (
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-[0.7rem] font-black text-rose-900">Out of stock</span>
                ) : null}
                {card.priceDropBadge ? (
                  <span
                    aria-label={`${card.name} ${card.priceDropLabel ?? '30-day price drop from price_history'}`}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-[0.7rem] font-black text-emerald-950"
                    title={`30-day price drop from price_history${card.priceDropAnchorDate ? ` since ${card.priceDropAnchorDate}` : ''}`}
                  >
                    {card.priceDropBadge}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-[0.7rem] font-black ${volatilityBadgeClass(volatilityBadge.band)}`}
                  title={volatilityBadge.detail}
                >
                  {volatilityBadge.label}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[0.7rem] font-black text-slate-700">{resolvedMode(card, compareMode)}</span>
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-emerald-800">{primaryLabel(card, compareMode)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{secondaryLabel(card, compareMode)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.sourceLabel}</p>
            <PriceHistorySparkline card={card} />
            <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-950">{volatilityBadge.detail}</p>
            <p className="mt-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-950">{card.confidenceLabel}</p>
            {card.cheapestUnitBadge ? (
              <p className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">{card.cheapestUnitBadge}</p>
            ) : (
              <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">cheapest-per-unit badge waits for cross-chain unit evidence</p>
            )}
                </>
              );
            })()}
            </LazyItemCard>
          </div>
        ))}
      </div>
    </section>
  );
}
