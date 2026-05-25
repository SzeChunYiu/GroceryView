import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import type { TrendingProductPriceChange } from '@groceryview/db';
import { buildBrandLeaderboardTrends, buildCitySearchTrends, buildCityTrendingItems, type CityTrendingItemFeed } from '@/lib/trends';
import { BrandLeaderboardModule, TrendingSearchModule } from '@/app/page-sections/trending';
import type { PersonalizedReorderItem } from '@/lib/personalization';

type PersonalizedTrendingProductPriceChange = TrendingProductPriceChange & {
  personalizationReason?: string;
};

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

function PersonalizedReorderRail({ items }: Readonly<{ items: PersonalizedReorderItem[] }>) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm" aria-label="Personalized reorder rail">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">For your usual basket</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Frequently watched, favorited, and bought again</h2>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-emerald-950">
          Ranked from account personalization signals, then rendered with the same verified product prices and source labels used by public browsing cards.
        </p>
      </div>
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" data-personalized-reorder-rail>
        {items.map((item) => (
          <Link
            className="min-w-[16rem] max-w-[16rem] snap-start rounded-2xl border border-emerald-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-700"
            data-reorder-score={item.reorderScore}
            href={`/products/${item.slug}`}
            key={item.slug}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{item.reorderReason}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{item.name}</h3>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{item.brand}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-950">{item.totalPriceLabel}</p>
              <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">{item.unitPriceLabel}</p>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-600">{item.packageLabel} · {item.sourceLabel}</p>
            <p className="mt-3 rounded-xl bg-slate-950 p-3 text-xs font-black leading-5 text-white">{item.signalSummary}</p>
            <p className="mt-2 text-xs font-semibold text-emerald-900">{item.lastActionLabel}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}


function CityTrendingItemsRail({ feed }: Readonly<{ feed: CityTrendingItemFeed }>) {
  if (feed.cards.length === 0) return null;

  return (
    <section className="mt-6 rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5 shadow-sm" aria-label={`${feed.city} trending grocery items`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-800">Trending in {feed.city}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Local products shoppers are acting on</h2>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-orange-950">Ranked from recent local views, list adds, and observed price movement signals.</p>
      </div>
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" data-city-trending-items={feed.city}>
        {feed.cards.map((item) => (
          <Link className="min-w-[16rem] max-w-[16rem] snap-start rounded-2xl border border-orange-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange-700" href={item.resultHref} key={item.productSlug}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">#{item.rank} · {item.categoryLabel}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{item.productName}</h3>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{item.brand}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
              <p className="rounded-xl bg-orange-50 p-2 text-orange-950">{item.recentViews}<span className="block font-semibold">views</span></p>
              <p className="rounded-xl bg-emerald-50 p-2 text-emerald-950">{item.listAdds}<span className="block font-semibold">adds</span></p>
              <p className="rounded-xl bg-slate-50 p-2 text-slate-950">{item.priceMovementLabel}<span className="block font-semibold">price</span></p>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-600">{item.evidenceLabel}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TrendingCarousel({ items, reorderItems = [] }: Readonly<{
  items: PersonalizedTrendingProductPriceChange[];
  reorderItems?: PersonalizedReorderItem[];
}>) {
  const searchFeed = buildCitySearchTrends({ city: 'stockholm', limit: 6 });
  const brandFeed = buildBrandLeaderboardTrends({ city: 'stockholm', limit: 5 });
  const cityItemFeed = buildCityTrendingItems({ city: 'stockholm', limit: 6 });

  if (items.length === 0) {
    return (
      <>
        <PersonalizedReorderRail items={reorderItems} />
        <CityTrendingItemsRail feed={cityItemFeed} />
        <BrandLeaderboardModule feed={brandFeed} />
        <TrendingSearchModule feed={searchFeed} />
      </>
    );
  }

  return (
    <>
      <PersonalizedReorderRail items={reorderItems} />
      <CityTrendingItemsRail feed={cityItemFeed} />
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
                {item.personalizationReason ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-800">
                    Ranked for you: {item.personalizationReason}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {formatPercent(item.changePercent)} from {formatMoney(item.previousPrice, item.currency)} · latest {item.latestObservedAt.slice(0, 10)}
                </p>
                <div className="mt-3 rounded-xl border border-cyan-100 bg-white p-3 text-xs font-bold leading-5 text-slate-600">
                  <p className="text-cyan-900">Item detail: Stockholm · observed chain</p>
                  <p>
                    Week-over-week movement is explained from {formatMoney(item.previousPrice, item.currency)} to {formatMoney(item.latestPrice, item.currency)} so shoppers can act on the product-level opportunity today.
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <BrandLeaderboardModule feed={brandFeed} />
      <TrendingSearchModule feed={searchFeed} />
    </>
  );
}
