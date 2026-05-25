'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ConfidenceBadge } from './confidence-badge';
import { LazyItemCard } from './LazyItemCard';
import { FavouriteProductToggle } from './favourite-product-toggle';
import { readStoredSafetyPreferences, SAFETY_PREFERENCES_CHANGED_EVENT, type ProductSafetyPreferences } from './cert-filter';
import { buildPriceHistorySparklinePath } from '@/lib/price-events';
import { volatilityBadgeMethodology } from '@/lib/price-intelligence';
import type { SearchExplanationBadge } from '@/lib/search-filters';
import { listFriendPriceSightingsForProduct } from '@/lib/social';
import type { AdaptiveProductCard } from '@/lib/verified-data';

type CompareMode = 'adaptive' | 'total' | 'unit';
type ProductCardWithSearchExplanations = AdaptiveProductCard & {
  searchExplanationBadges?: SearchExplanationBadge[];
};

const storageKey = 'groceryview:product-card-compare-mode';
const compareModeChangedEvent = 'groceryview:product-card-compare-mode-changed';
const accountCompareModeEndpoint = '/api/account/price-compare-mode';
const productCardImagePolicy = {
  loading: 'lazy',
  placeholder: 'empty',
  sizes: '(min-width: 1280px) 16vw, (min-width: 768px) 33vw, 80vw'
} as const;
const compareModes: Array<{ label: string; value: CompareMode; help: string }> = [
  { label: 'Adaptive', value: 'adaptive', help: 'Commodity cards lead with unit price; branded cards lead with total price.' },
  { label: 'Total', value: 'total', help: 'Sort and lead every card by the observed pack price.' },
  { label: 'Per kg / l / st / 100 g', value: 'unit', help: 'Sort and lead every card by comparable jämförpris when package size is known.' }
];
const emptySafetyPreferences: ProductSafetyPreferences = {
  requiredDietaryTags: [],
  avoidedAllergenTags: []
};

function isCompareMode(value: string | null): value is CompareMode {
  return value === 'adaptive' || value === 'total' || value === 'unit';
}

function signedInAccountContext() {
  const accessToken = window.sessionStorage.getItem('groceryview:accessToken');
  const userId = window.sessionStorage.getItem('groceryview:userId');
  return accessToken && userId ? { accessToken, userId } : null;
}

async function persistSignedInCompareMode(compareMode: CompareMode) {
  const account = signedInAccountContext();
  if (!account) return;

  await fetch(accountCompareModeEndpoint, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${account.accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ compareMode, userId: account.userId })
  }).catch(() => undefined);
}

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

function safetyWarnings(card: AdaptiveProductCard, preferences: ProductSafetyPreferences) {
  const allergenWarnings = preferences.avoidedAllergenTags
    .filter((tag) => card.safetyProfile.allergenTags.includes(tag))
    .map((tag) => `Contains ${tag} evidence`);
  const missingDietaryWarnings = preferences.requiredDietaryTags
    .filter((tag) => !card.safetyProfile.dietaryTags.includes(tag))
    .map((tag) => `Missing ${tag} evidence`);

  return [...allergenWarnings, ...missingDietaryWarnings];
}

function SafetyWarningBanner({ card, preferences }: Readonly<{ card: AdaptiveProductCard; preferences: ProductSafetyPreferences }>) {
  const warnings = safetyWarnings(card, preferences);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-950" role="alert">
      <p className="font-black uppercase tracking-[0.14em]">Safety preference warning</p>
      <ul className="mt-2 space-y-1">
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
      <p className="mt-2 text-rose-900">{card.safetyEvidenceLabel}</p>
    </div>
  );
}

function sparklinePath(points: AdaptiveProductCard['sparklinePoints'], width = 160, height = 44) {
  return buildPriceHistorySparklinePath(points, width, height);
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

function VolatilityMethodologyBadge({ card }: Readonly<{ card: AdaptiveProductCard }>) {
  const methodology = volatilityBadgeMethodology(card.sparklinePoints);

  return (
    <details className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-950">
      <summary
        aria-label={`${card.name} volatility score methodology`}
        className="cursor-pointer font-black"
      >
        Volatility score {methodology.score}/100 · {methodology.observationCount} historical observations
      </summary>
      <div className="mt-2 space-y-1 font-semibold leading-5">
        <p>{methodology.rangeLabel}</p>
        <p>{methodology.summary}</p>
        <p>{methodology.forecastBoundary}</p>
      </div>
    </details>
  );
}

function FriendPriceSightingsPanel({ card }: Readonly<{ card: AdaptiveProductCard }>) {
  const sightings = listFriendPriceSightingsForProduct(card.slug).slice(0, 2);
  if (sightings.length === 0) return null;

  return (
    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-emerald-900">Opt-in friend sightings</p>
          <p className="mt-1 text-xs font-semibold text-emerald-950">Shown next to verified store price {card.totalPriceLabel}.</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-black text-emerald-900">{sightings.length} recent</span>
      </div>
      <ul className="mt-2 space-y-2">
        {sightings.map((sighting) => (
          <li className="rounded-xl bg-white p-2 text-xs text-slate-700" key={sighting.id}>
            <p className="font-black text-slate-950">{sighting.priceLabel} · {sighting.storeName}</p>
            <p className="mt-1 font-semibold">
              {sighting.reporter} · {new Date(sighting.observedAt).toLocaleDateString('sv-SE')} · {sighting.confidence} confidence
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchExplanationBadges({ badges }: Readonly<{ badges?: SearchExplanationBadge[] }>) {
  if (!badges || badges.length === 0) return null;

  return (
    <div aria-label="Search result match explanations" className="mt-3 flex flex-wrap gap-2" data-search-explanation-badges>
      {badges.slice(0, 4).map((badge) => (
        <span
          className="rounded-full bg-indigo-100 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-indigo-950"
          key={`${badge.kind}-${badge.label}`}
          title={`Matched: ${badge.matchedTerms.join(', ')}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

export function ProductPriceCards({
  cards,
  eyebrow = 'Adaptive product cards',
  title = 'Total and comparable unit prices together',
  intro = 'Every card shows the actual observed pack price plus a comparable unit price when package size evidence exists.',
  recommendationItems = []
}: Readonly<{
  cards: AdaptiveProductCard[];
  eyebrow?: string;
  title?: string;
  intro?: string;
  recommendationItems?: ReadonlyArray<{
    slug: string;
    name: string;
    brand?: string | null;
    totalPriceLabel?: string;
    reason: string;
    score: number;
  }>;
}>) {
  const [compareMode, setCompareMode] = useState<CompareMode>('adaptive');
  const [safetyPreferences, setSafetyPreferences] = useState<ProductSafetyPreferences>(emptySafetyPreferences);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (isCompareMode(stored)) {
      setCompareMode(stored);
    }
    setSafetyPreferences(readStoredSafetyPreferences());

    const account = signedInAccountContext();
    if (account) {
      fetch(`${accountCompareModeEndpoint}?userId=${encodeURIComponent(account.userId)}`, {
        headers: { authorization: `Bearer ${account.accessToken}` }
      })
        .then((response) => response.ok ? response.json() as Promise<{ compareMode?: string }> : null)
        .then((payload) => {
          if (isCompareMode(payload?.compareMode ?? null)) {
            window.localStorage.setItem(storageKey, payload.compareMode);
            setCompareMode(payload.compareMode);
          }
        })
        .catch(() => undefined);
    }

    function refreshSafetyPreferences() {
      setSafetyPreferences(readStoredSafetyPreferences());
    }

    function refreshCompareMode() {
      const nextMode = window.localStorage.getItem(storageKey);
      if (isCompareMode(nextMode)) setCompareMode(nextMode);
    }

    window.addEventListener(SAFETY_PREFERENCES_CHANGED_EVENT, refreshSafetyPreferences);
    window.addEventListener('storage', refreshSafetyPreferences);
    window.addEventListener('storage', refreshCompareMode);
    window.addEventListener(compareModeChangedEvent, refreshCompareMode);
    return () => {
      window.removeEventListener(SAFETY_PREFERENCES_CHANGED_EVENT, refreshSafetyPreferences);
      window.removeEventListener('storage', refreshSafetyPreferences);
      window.removeEventListener('storage', refreshCompareMode);
      window.removeEventListener(compareModeChangedEvent, refreshCompareMode);
    };
  }, []);

  const sortedCards = useMemo(() => [...cards].sort((left, right) => {
    const delta = sortValue(left, compareMode) - sortValue(right, compareMode);
    return delta === 0 ? left.name.localeCompare(right.name, 'sv') : delta;
  }), [cards, compareMode]);

  function chooseMode(value: CompareMode) {
    setCompareMode(value);
    window.localStorage.setItem(storageKey, value);
    window.dispatchEvent(new CustomEvent(compareModeChangedEvent, { detail: { compareMode: value } }));
    void persistSignedInCompareMode(value);
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
      {recommendationItems.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-900">Recommended for you</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {recommendationItems.map((item) => (
              <a className="rounded-2xl bg-white p-3 text-sm shadow-sm hover:ring-2 hover:ring-emerald-300" href={`/products/${item.slug}`} key={item.slug}>
                <p className="font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{item.brand ?? 'Brand not reported'} · {item.totalPriceLabel ?? 'price pending'}</p>
                <p className="mt-2 rounded-xl bg-emerald-50 p-2 text-xs font-bold text-emerald-950">{item.reason}</p>
                <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-emerald-800">score {item.score}</p>
              </a>
            ))}
          </div>
        </div>
      ) : null}
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
            {card.imageUrl && card.imageAlt ? (
              <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-2xl border border-white bg-white p-3 shadow-sm">
                <Image
                  alt={card.imageAlt}
                  className="max-h-full max-w-full object-contain"
                  height={144}
                  loading={productCardImagePolicy.loading}
                  placeholder={productCardImagePolicy.placeholder}
                  sizes={productCardImagePolicy.sizes}
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
                <span className="rounded-full bg-white px-3 py-1 text-[0.7rem] font-black text-slate-700">{resolvedMode(card, compareMode)}</span>
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-emerald-800">{primaryLabel(card, compareMode)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{secondaryLabel(card, compareMode)}</p>
            <SearchExplanationBadges badges={(card as ProductCardWithSearchExplanations).searchExplanationBadges} />
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.sourceLabel}</p>
            <FriendPriceSightingsPanel card={card} />
            <SafetyWarningBanner card={card} preferences={safetyPreferences} />
            <PriceHistorySparkline card={card} />
            <div className="mt-2">
              <ConfidenceBadge
                details={card.confidenceDrilldown.rows}
                label="Price confidence"
                level={card.confidenceLevel}
                sampleSize={card.confidenceDrilldown.sourceCount}
              />
            </div>
            <p className="mt-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-950">{card.confidenceLabel}</p>
            <VolatilityMethodologyBadge card={card} />
            {card.cheapestUnitBadge ? (
              <p className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">{card.cheapestUnitBadge}</p>
            ) : (
              <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">cheapest-per-unit badge waits for cross-chain unit evidence</p>
            )}
            </LazyItemCard>
          </div>
        ))}
      </div>
    </section>
  );
}
