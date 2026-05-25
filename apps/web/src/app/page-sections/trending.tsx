import Link from 'next/link';
import { ArrowDownRight, BadgeCheck, BarChart3, Clock3, ListPlus, MapPin, Search, TrendingUp } from 'lucide-react';
import { buildPriceDropDiscoveryRail, buildTrendingItemDetailCards } from '@/lib/price-events';
import { buildCityPriceDropTrends, type BrandLeaderboardTrendFeed, type CityPriceDropTrend, type CitySearchTrendFeed } from '@/lib/trends';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { rankPersonalizedPriceDrops } from '@/lib/personalization';
import type { CategoryTrendingShelf } from '@/lib/grocery-index-widget';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatSignedPercent(value: number) {
  return `+${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(value)}%`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('sv-SE').format(value);
}

function confidenceClass(card: CityPriceDropTrend) {
  if (card.confidenceLabel === 'high') return 'bg-emerald-100 text-emerald-900';
  if (card.confidenceLabel === 'medium') return 'bg-cyan-100 text-cyan-950';
  return 'bg-amber-100 text-amber-950';
}

const priceEventProducts = pricedProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brands,
  category: categoryLabels[product.category] ?? product.category,
  observations: product.observations
}));

const discoveryRailItems = buildPriceDropDiscoveryRail(priceEventProducts, 6);
const trendingItemDetailCards = buildTrendingItemDetailCards(priceEventProducts, 4, 'Stockholm');
const personalizedPriceDropItems = rankPersonalizedPriceDrops(
  discoveryRailItems.map((item) => ({
    ...item,
    chainName: item.locality,
    chainSlug: item.locality.toLocaleLowerCase('sv-SE'),
    productSlug: item.productSlug,
    productName: item.productName
  })),
  {
    favoriteBrands: ['Garant', 'Änglamark', 'Zoégas'],
    nearbyChains: ['ica', 'coop', 'willys'],
    clickedProductSlugs: ['coffee', 'milk', 'banana']
  }
).slice(0, 4);

function PriceDropDiscoveryEmptyState() {
  return (
    <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Recommended deals unavailable" data-price-drop-discovery-empty-state>
      <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Recommended deals</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">No verified recommended deals yet</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Only dated price observations can populate this rail. GroceryView keeps the space empty until the feed has enough real week-over-week deal evidence to rank.
        </p>
      </div>
    </section>
  );
}

export function PriceDropDiscoveryRail() {
  if (discoveryRailItems.length === 0) return <PriceDropDiscoveryEmptyState />;

  return (
    <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Week-over-week price-drop discovery" data-price-drop-discovery-rail>
      <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Open before shopping</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Steepest verified week-over-week price drops</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Built from dated OpenPrices observations only. Each card compares the latest price with a verified observation from 5-9 days earlier.
          </p>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2" data-price-drop-discovery-track>
          {trendingItemDetailCards.map((item) => (
            <Link
              className="min-w-[17rem] rounded-2xl border border-cyan-200 bg-cyan-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-700"
              data-trending-item-detail-card={item.rank}
              href={`/products/${item.productSlug}`}
              key={`detail-${item.productSlug}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">#{item.rank} · {item.city}</p>
              <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{item.productName}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">Chain</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{item.chain}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">WoW move</p>
                  <p className="mt-1 text-sm font-black text-emerald-800">{formatPercent(Math.abs(item.weekOverWeekChangePercent))} down</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{item.explanation}</p>
            </Link>
          ))}
          {discoveryRailItems.map((item) => (
            <Link
              className="min-w-[17rem] rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-700"
              data-price-drop-discovery-card={item.rank}
              href={`/products/${item.productSlug}`}
              key={item.productSlug}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">#{item.rank} · {item.category}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{item.productName}</h3>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{item.brand}</p>
                </div>
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-800" aria-label="Week-over-week price dropped">
                  <ArrowDownRight aria-hidden="true" size={20} strokeWidth={3} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">Now</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{formatSek(item.latestPrice)}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">7-day drop</p>
                  <p className="mt-1 text-lg font-black text-emerald-800">{formatPercent(item.dropPercent * 100)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-black text-emerald-800">Save {formatSek(item.dropAmount)} vs {formatSek(item.previousWeekPrice)}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.evidenceLabel}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PersonalizedPriceDropFeed() {
  if (personalizedPriceDropItems.length === 0) return null;

  return (
    <section className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Personalized price-drop feed" data-personalized-price-drop-feed>
      <div className="rounded-[1.75rem] border border-violet-200 bg-violet-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">For your next basket</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Personalized price drops from favorites, lists, and nearby stores</h2>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            Ranked with saved favorites, household list signals, preferred stores, and verified week-over-week price movement.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {personalizedPriceDropItems.map((item) => (
            <Link className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${item.productSlug}`} key={item.productSlug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">#{item.rank} · {item.personalizationReason}</p>
              <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">{item.productName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{item.brand} · {item.locality}</p>
              <p className="mt-3 text-sm font-black text-emerald-800">Save {formatSek(item.dropAmount)} ({formatPercent(item.dropPercent * 100)})</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendingSearchModule({ feed }: Readonly<{ feed: CitySearchTrendFeed }>) {
  if (feed.cards.length === 0) return null;

  return (
    <section
      className="relative mt-5 overflow-hidden rounded-[2rem] border border-slate-900 bg-slate-950 p-5 text-white shadow-[0_22px_70px_rgba(15,23,42,0.28)]"
      aria-label={`${feed.city} rising product searches`}
      data-trending-search-module
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-lime-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
          <p className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
            <TrendingUp aria-hidden="true" size={14} strokeWidth={3} /> Rising searches
          </p>
          <h2 className="mt-4 max-w-sm text-3xl font-black leading-[0.95] tracking-tight md:text-4xl">
            Rising product queries for {feed.city}
          </h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-200">
            Query momentum is grouped by city and category, then linked straight into filtered product results so shoppers can jump from local interest to price evidence.
          </p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs font-bold leading-5 text-slate-300">
            {feed.privacyNote} Source: {feed.source}.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2" data-trending-search-grid>
          {feed.cards.slice(0, 6).map((trend) => (
            <Link
              className="group rounded-[1.35rem] border border-white/10 bg-white/[0.07] p-4 transition hover:-translate-y-0.5 hover:border-lime-300 hover:bg-white/[0.12]"
              data-trending-search-card={trend.rank}
              href={trend.resultHref}
              key={`${trend.city}-${trend.category}-${trend.query}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-lime-200">
                    <MapPin aria-hidden="true" size={13} /> #{trend.rank} · {trend.city}
                  </p>
                  <h3 className="mt-2 flex items-center gap-2 text-xl font-black tracking-tight text-white">
                    <Search aria-hidden="true" className="text-cyan-200" size={19} />
                    {trend.query}
                  </h3>
                </div>
                <span className="rounded-full bg-lime-300 px-2.5 py-1 text-xs font-black text-slate-950">
                  {formatSignedPercent(trend.growthPercent)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-slate-900/75 p-3">
                  <p className="text-xs font-bold text-slate-400">Category</p>
                  <p className="mt-1 font-black text-white">{trend.categoryLabel}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/75 p-3">
                  <p className="text-xs font-bold text-slate-400">Momentum lift</p>
                  <p className="mt-1 font-black text-lime-200">{formatCount(trend.activeComparisons)} pts</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">
                {formatCount(trend.currentSearches)} current score vs {formatCount(trend.previousSearches)} baseline · {trend.evidenceLabel}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandLeaderboardModule({ feed }: Readonly<{ feed: BrandLeaderboardTrendFeed }>) {
  if (feed.cards.length === 0) return null;

  return (
    <section
      className="mt-5 rounded-[1.75rem] border border-violet-200 bg-white p-5 shadow-sm"
      aria-label={`${feed.city} trending brand leaderboard`}
      data-brand-leaderboard-module
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Brand momentum</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Trending grocery brands in {feed.city}</h2>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Ranked by week-over-week search interest, latest price drops, and saved-list addition momentum from the verified product observation feed.
        </p>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-5" data-brand-leaderboard-grid>
        {feed.cards.map((brand) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-violet-700"
            data-brand-leaderboard-rank={brand.rank}
            href={`/products/${brand.featuredProductSlug}`}
            key={brand.brand}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">#{brand.rank} · {brand.categoryLabel}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{brand.brand}</h3>
              </div>
              <span className="rounded-full bg-violet-100 p-2 text-violet-800" aria-label="Brand momentum score">
                <BarChart3 aria-hidden="true" size={20} strokeWidth={3} />
              </span>
            </div>
            <p className="mt-3 line-clamp-1 text-sm font-black text-slate-700">{brand.featuredProductName}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-slate-500">Search lift</p>
                <p className="mt-1 text-lg font-black text-violet-800">{formatSignedPercent(brand.searchLiftPercent)}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-slate-500">Drops</p>
                <p className="mt-1 text-lg font-black text-emerald-800">{brand.priceDropCount}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-700">
              <ListPlus aria-hidden="true" size={16} />
              {formatCount(brand.listAdditions)} list adds · score {brand.score.toFixed(1)}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{brand.evidenceLabel}</p>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs font-bold leading-5 text-slate-500">Source: {feed.source}.</p>
    </section>
  );
}

export function TrendingPriceDropCards({ city = 'stockholm' }: Readonly<{ city?: string }>) {
  const feed = buildCityPriceDropTrends({ city, limit: 4 });
  if (feed.cards.length === 0) return null;

  return (
    <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm" aria-label={`${feed.city} trending price drops`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Trending price drops</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Top drops in {feed.city}</h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">
          Ranked from latest dated observations against each product's prior different price; cards show delta, confidence, and urgency.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {feed.cards.map((card) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-700"
            data-trending-price-drop-card={card.rank}
            href={`/products/${card.productSlug}`}
            key={card.productSlug}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">#{card.rank} · {card.categoryLabel}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{card.productName}</h3>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{card.brand}</p>
              </div>
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-800" aria-label="Price dropped">
                <ArrowDownRight aria-hidden="true" size={20} strokeWidth={3} />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-slate-500">Now</p>
                <p className="mt-1 text-lg font-black text-slate-950">{formatSek(card.latestPrice)}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-slate-500">Drop</p>
                <p className="mt-1 text-lg font-black text-emerald-800">{formatSek(card.deltaAmount)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-black text-emerald-800">{formatPercent(card.deltaPercent)} from {formatSek(card.previousPrice)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${confidenceClass(card)}`}>
                <BadgeCheck aria-hidden="true" size={14} />
                {card.confidenceLabel} · {card.confidenceScore.toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">
                <Clock3 aria-hidden="true" size={14} />
                {card.urgencyLabel}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              {card.confidenceDetail}; source {card.sourceLabel}.
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ShelfColumn({ title, items }: Readonly<{ title: string; items: CategoryTrendingShelf['fastRising'] }>) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{title}</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <Link className="block rounded-xl bg-slate-50 p-3 hover:bg-emerald-50" href={`/products/${item.slug}`} key={item.slug}>
            <p className="font-black text-slate-950">{item.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{item.brand} · {formatSek(item.price)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{item.metric}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CategoryTrendingShelves({ shelves }: Readonly<{ shelves: CategoryTrendingShelf[] }>) {
  if (shelves.length === 0) return null;

  return (
    <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5" aria-label="Trending category shelves">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Dynamic category shelves</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Fast-rising, newly discounted, and stable staples</h2>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-700">
          Shelves are derived from verified OpenPrices observation counts, latest price drops, and products repeatedly priced near their low.
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {shelves.map((shelf) => (
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white/70 p-4" key={shelf.slug}>
            <Link className="text-xl font-black text-slate-950 hover:text-emerald-800" href={`/categories/${shelf.slug}`}>
              {shelf.label}
            </Link>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <ShelfColumn title="Fast-rising searches" items={shelf.fastRising} />
              <ShelfColumn title="Newly discounted items" items={shelf.newlyDiscounted} />
              <ShelfColumn title="Stable low-price staples" items={shelf.stableLowPriceStaples} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
