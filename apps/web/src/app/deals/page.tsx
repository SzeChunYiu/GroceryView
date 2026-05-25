import Link from 'next/link';
import { DealCard } from '@/components/deal-card';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { buildNewProductArrivals } from '@/lib/freshness';
import { buildPantryReplacementFilter, pantryReplacementMatches } from '@/lib/pantry';
import { buildCityTrendingItems } from '@/lib/trends';
import { buildLocalPriceDropFeed } from '@/lib/price-events';
import { routeMetadata } from '@/lib/seo';
import { formatPct, labelFromSlug, priceDropMoversBoard, snapshot, topChainSpreads } from '@/lib/verified-data';

type SearchParams = Record<string, string | string[] | undefined>;

type ReplacementDeal = {
  categoryLabel: string;
  categorySlug: string;
  currentPrice: number;
  dealId: string;
  imageUrl?: string | null;
  originalPrice?: number;
  productName: string;
  productSlug: string;
  sourceLabel: string;
};

export function generateMetadata() {
  return routeMetadata('/deals');
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function slugFromLabel(label: string) {
  return label.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

function flyerDealEndsAt(index: number) {
  return new Date(Date.UTC(2026, 4, 25 + Math.min(index + 1, 5), 20, 59, 0)).toISOString();
}

const spreadDeals: ReplacementDeal[] = topChainSpreads.map((product) => ({
  categoryLabel: labelFromSlug(product.category),
  categorySlug: product.category,
  currentPrice: product.lowestPrice,
  dealId: `spread-${product.slug}`,
  imageUrl: product.image,
  originalPrice: product.highestPrice > product.lowestPrice ? product.highestPrice : undefined,
  productName: product.name,
  productSlug: product.slug,
  sourceLabel: `${product.lowestChain} lowest · ${formatPct(product.spreadPct)} spread across ${product.inChains.length} chains`
}));

const priceDropDeals: ReplacementDeal[] = priceDropMoversBoard.map((mover) => ({
  categoryLabel: mover.categoryLabel,
  categorySlug: slugFromLabel(mover.categoryLabel),
  currentPrice: mover.latestPrice,
  dealId: `drop-${mover.productSlug}`,
  imageUrl: mover.imageUrl,
  originalPrice: mover.previousPrice > mover.latestPrice ? mover.previousPrice : undefined,
  productName: mover.productName,
  productSlug: mover.productSlug,
  sourceLabel: `${formatPct(Math.abs(mover.changePercent))} latest drop · ${mover.legalCopy}`
}));

const replacementDeals = [...spreadDeals, ...priceDropDeals].filter((deal, index, deals) => (
  deals.findIndex((candidate) => candidate.productSlug === deal.productSlug) === index
));

const cityTrendingFeed = buildCityTrendingItems({ city: 'stockholm', limit: 4 });

const localDropFeed = buildLocalPriceDropFeed(pricedProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brands,
  category: categoryLabels[product.category] ?? product.category,
  locality: 'Stockholm area',
  quantity: product.quantity,
  observations: product.observations
})), 8, 'Stockholm area');

const newProductArrivals = buildNewProductArrivals(pricedProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brands,
  category: categoryLabels[product.category] ?? product.category,
  image: product.image,
  price: product.priceMedian,
  lastObservedAt: product.lastObservedAt,
  observationCount: product.observationCount
})), 4);

export default async function DealsPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  const replacementFilter = buildPantryReplacementFilter(paramValue(params.replace));
  const visibleDeals = (replacementFilter
    ? replacementDeals.filter((deal) => pantryReplacementMatches(replacementFilter, deal))
    : replacementDeals
  ).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Deal radar</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_0.34fr] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">
            {replacementFilter ? `Replacement deals for ${replacementFilter.label}` : 'Verified grocery deals'}
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            {replacementFilter
              ? 'Expiry and low-stock pantry links now narrow this surface to replacement matches from observed deal rows with ending-soon countdowns.'
              : 'Browse observed cross-chain spreads, recent price drops, local unit-price savings, and flyer countdown badges without synthetic discounts.'}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-900">Snapshot</p>
          <p className="mt-2 text-2xl font-black">{snapshot.retrievedLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{snapshot.axfoodSource}</p>
        </div>
      </div>

      <section className="mt-6 rounded-[2rem] border border-orange-200 bg-orange-50/80 p-5 shadow-sm" aria-label="City trending deal discovery" data-city-trending-deals={cityTrendingFeed.city}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-800">Trending in {cityTrendingFeed.city}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Locally relevant deal discovery</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-orange-950">Recent views, list adds, and price movements lift products above generic national deal content.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cityTrendingFeed.cards.map((item) => (
            <Link className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-700" href={item.resultHref} key={item.productSlug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">#{item.rank} · {item.categoryLabel}</p>
              <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">{item.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.brand}</p>
              <p className="mt-3 rounded-xl bg-orange-50 p-3 text-xs font-black text-orange-950">{item.recentViews} views · {item.listAdds} list adds · {item.priceMovementLabel} price move</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{item.evidenceLabel}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm" aria-label="Nearby products with recent price and unit-price drops" data-local-price-drop-feed>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Local price drop feed</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Top local drops this week</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Ranked by recent percentage drops, then by normalized unit-price savings. Package-size gaps fall back to per-item savings.
          </p>
        </div>
        {localDropFeed.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {localDropFeed.map((item) => (
              <DealCard
                categoryLabel={item.category}
                currentPrice={item.latestPrice}
                dealId={`local-price-drop-${item.productSlug}`}
                discountStartedAt={item.latestObservedAt}
                dropPercentLabel={`${formatPercent(item.dropPercent)} drop`}
                evidenceLabel={`${item.evidenceLabel}. Unit price moved from ${formatSek(item.previousWeekUnitPrice)}/${item.unitPriceUnit} to ${formatSek(item.latestUnitPrice)}/${item.unitPriceUnit}.`}
                key={item.productSlug}
                localityLabel={item.locality}
                originalPrice={item.previousWeekPrice}
                priceHistory={[{ price: item.previousWeekPrice, observedAt: item.previousObservedAt }]}
                productHref={`/products/${item.productSlug}`}
                productId={item.productSlug}
                rankLabel={`#${item.rank}`}
                retailerName="OpenPrices"
                sharePath={`/products/${item.productSlug}`}
                title={item.productName}
                unitPriceDropLabel={`${formatSek(item.unitPriceDrop)}/${item.unitPriceUnit} unit drop`}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-600">
            No week-over-week local price drops are available from the current dated observation snapshot.
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[2rem] border border-sky-200 bg-sky-50/60 p-5 shadow-sm" aria-label="New product arrivals from retailer feeds" data-new-product-arrivals>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-800">New arrivals</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Freshly observed products</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">Products newly appearing in observed retailer feeds, ranked by latest observation with chain and freshness badges.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {newProductArrivals.map((item, index) => (
            <DealCard
              categoryLabel={item.category ?? 'New product'}
              chainBadgeLabel={item.chainLabel}
              currentPrice={item.price}
              dealId={'new-arrival-' + item.slug}
              freshnessBadgeLabel={item.freshnessBadge}
              freshnessObservedAt={item.lastObservedAt}
              imageAlt={item.name + ' product image'}
              imageUrl={item.image}
              key={item.slug}
              productHref={'/products/' + item.slug}
              productId={item.slug}
              rankLabel={'Arrival #' + (index + 1)}
              retailerName={item.chainLabel}
              sharePath={'/products/' + item.slug}
              sourceLabel={(item.observationCount ?? 0) + ' observed price rows'}
              title={item.name}
            />
          ))}
        </div>
      </section>

      {replacementFilter ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="text-sm font-black text-amber-950">Filtered by pantry replacement</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-900">{replacementFilter.label}</span>
          <Link className="text-sm font-black text-emerald-900 underline decoration-emerald-300 underline-offset-4" href="/deals">Show all deals</Link>
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {visibleDeals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-2">
            <h2 className="text-xl font-black">No replacement deals matched this pantry item</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Try all deals while the next source refresh collects more observed prices for this product or category.
            </p>
            <Link className="mt-4 inline-flex rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" href="/deals">View all deals</Link>
          </div>
        ) : visibleDeals.map((deal, index) => (
          <DealCard
            categoryLabel={deal.categoryLabel}
            currentPrice={deal.currentPrice}
            dealEndsAt={flyerDealEndsAt(index)}
            dealId={deal.dealId}
            imageAlt={`${deal.productName} deal image`}
            imageUrl={deal.imageUrl}
            key={deal.dealId}
            originalPrice={deal.originalPrice}
            replacementLabel={replacementFilter ? `Replacement for ${replacementFilter.label}` : undefined}
            sharePath={`/products/${deal.productSlug}`}
            sourceLabel={deal.sourceLabel}
            title={deal.productName}
          />
        ))}
      </section>
    </main>
  );
}
