import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import type { TrendingProductPriceChange } from '@groceryview/db';
import { buildBrandLeaderboardTrends, buildCitySearchTrends } from '@/lib/trends';
import { BrandLeaderboardModule, SponsoredPlacementSafeguardNotice, TrendingSearchModule } from '@/app/page-sections/trending';
import { selectSponsoredDiscoveryPlacements, type SponsoredDiscoveryPlacement } from '@/lib/analytics';

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

const sponsoredDiscoveryPlacements: SponsoredDiscoveryPlacement[] = [
  {
    categoryLabel: 'Pantry staples',
    disclosure: 'Paid retailer placement. It is selected only when it matches the current trend context and never changes organic ranking order.',
    href: '/products?q=pantry%20staples',
    keywords: ['kaffe', 'coffee', 'mjölk', 'milk', 'pasta', 'bröd', 'bread'],
    label: 'Sponsored',
    placementId: 'trend-feed-pantry-partner',
    provider: 'Retail partner',
    relevanceCategories: ['grocery', 'pantry', 'dairy', 'coffee'],
    surface: 'trending_products_feed',
    title: 'Compare partner prices on everyday staples'
  }
];

export function TrendingCarousel({ items }: Readonly<{ items: TrendingProductPriceChange[] }>) {
  const searchFeed = buildCitySearchTrends({ city: 'stockholm', limit: 6 });
  const brandFeed = buildBrandLeaderboardTrends({ city: 'stockholm', limit: 5 });
  const sponsoredPlacements = selectSponsoredDiscoveryPlacements(sponsoredDiscoveryPlacements, {
    organicCategoryLabels: items.map((item) => item.categoryLabel ?? 'Grocery'),
    organicProductNames: items.map((item) => item.productName)
  });

  if (items.length === 0) {
    return (
      <>
        <BrandLeaderboardModule feed={brandFeed} />
        <TrendingSearchModule feed={searchFeed} />
      </>
    );
  }

  return (
    <>
      <section className="mt-6 rounded-[1.75rem] border border-cyan-200 bg-white/90 p-5 shadow-sm" aria-label="Trending products">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-800">Trending products</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Most price changes in the last 7 days</h2>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Ranked from dated price observations with the packages/db time-series summarizer; equal prices and missing history do not create changes.
          </p>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" data-trending-carousel>
          {items.map((item) => {
            const isDrop = item.changeAmount < 0;
            const TrendIcon = isDrop ? ArrowDownRight : ArrowUpRight;
            return (
              <Link
                className="min-w-[17rem] max-w-[17rem] snap-start rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-700"
                data-trending-product-rank={item.rank}
                href={`/products/${item.productSlug}`}
                key={item.productSlug}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">#{item.rank} · {item.categoryLabel ?? 'Grocery'}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{item.productName}</h3>
                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{item.brand ?? 'Brand not reported'}</p>
                  </div>
                  <span className={`rounded-full p-2 ${isDrop ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`} aria-label={isDrop ? 'Price drop' : 'Price increase'}>
                    <TrendIcon aria-hidden="true" size={20} strokeWidth={3} />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-slate-500">Latest</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{formatMoney(item.latestPrice, item.currency)}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-slate-500">Move</p>
                    <p className={`mt-1 text-lg font-black ${isDrop ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {formatMoney(item.changeAmount, item.currency)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <History aria-hidden="true" size={16} />
                  {item.changeCount} changes · {item.observationCount} observations
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {formatPercent(item.changePercent)} from {formatMoney(item.previousPrice, item.currency)} · latest {item.latestObservedAt.slice(0, 10)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
      {sponsoredPlacements.length ? (
        <section
          className="mt-3 rounded-[1.75rem] border border-amber-300 bg-amber-50/80 p-5 shadow-sm"
          aria-label="Sponsored discovery placement separated from organic trending products"
          data-sponsored-discovery-feed
          data-sponsored-max-items={sponsoredPlacements.length}
        >
          <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch">
            <SponsoredPlacementSafeguardNotice />
            <div className="grid gap-3 sm:grid-cols-2">
              {sponsoredPlacements.map((placement) => (
                <Link
                  className="rounded-2xl border border-amber-300 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-700"
                  data-organic-ranking-separated={String(placement.separatedFromOrganicRankings)}
                  data-sponsored-placement="true"
                  data-sponsored-placement-id={placement.placementId}
                  data-sponsored-relevance-score={placement.relevanceScore}
                  href={placement.href}
                  key={placement.placementId}
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">{placement.label} · {placement.categoryLabel}</p>
                  <h3 className="mt-2 text-lg font-black leading-6 text-slate-950">{placement.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{placement.disclosure}</p>
                  <p className="mt-3 text-xs font-bold text-amber-900">
                    Provider: {placement.provider} · relevance score {placement.relevanceScore}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <BrandLeaderboardModule feed={brandFeed} />
      <TrendingSearchModule feed={searchFeed} />
    </>
  );
}
