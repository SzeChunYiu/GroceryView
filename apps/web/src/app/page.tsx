import Link from 'next/link';
import { ArrowDownRight, Bell, Flame, Grid3X3, LineChart, Shuffle } from 'lucide-react';
import { PersonalizedPriceDropFeed, PriceDropDiscoveryRail } from '@/app/page-sections/trending';
import { BasketBuilder, type BasketBuilderProduct } from '@/components/basket-builder';
import { PersonalizedRecommendations } from '@/components/personalized-recommendations';
import { MarketShell } from '@/components/market-shell';
import { ProductImage } from '@/components/product-image';
import { PwaInstallEducationCard } from '@/components/pwa-install';
import { homePastPurchaseShortcuts } from '@/lib/recurring-basket';
import { routeMetadata } from '@/lib/seo';
import { buildTrendingDiscoveryFeed } from '@/lib/trends';
import {
  categoryDealLeaders,
  freshFoodChainIndex,
  keyMetrics,
  marketHeatmapTiles,
  originCountryLabels,
  priceDropMoversBoard,
  supportedOriginCountries,
  watchlistHeartProducts
} from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/');
}

const pastPurchaseProducts: BasketBuilderProduct[] = homePastPurchaseShortcuts.map((shortcut) => ({
  id: shortcut.productId,
  name: shortcut.productName,
  categoryLabel: shortcut.categoryLabel,
  lastPurchasedAt: shortcut.lastPurchasedAt,
  purchaseCount: shortcut.purchaseCount,
  shortcutLabel: shortcut.shortcutLabel,
  suggestedQuantity: shortcut.suggestedQuantity
}));
const neighborhoodTrendFeed = buildTrendingDiscoveryFeed({ city: 'stockholm', categoryLimit: 3, productLimit: 4 });
const indexLeader = freshFoodChainIndex.report.chains[0] ?? null;
const indexRunnerUp = freshFoodChainIndex.report.chains[1] ?? null;
const terminalMovers = priceDropMoversBoard.slice(0, 3);
const terminalDeals = categoryDealLeaders.slice(0, 3);
const terminalHeatTiles = marketHeatmapTiles.slice(0, 6);
const terminalWatchlist = watchlistHeartProducts.slice(0, 3);
const terminalMarkets = supportedOriginCountries.slice(0, 5).map((country) => ({
  country,
  href: `/products?origin=${country}`,
  label: originCountryLabels[country]
}));

function signedPct(value: number) {
  const formatted = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value);
  return value > 0 ? `+${formatted}%` : `${formatted}%`;
}

function MarketTerminalHero() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">GroceryView</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Grocery market terminal</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
            Grocery Index, price movers, true deal leaders, category heat, watchlist signals, and country markets from verified rows only.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {keyMetrics.map((metric) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={metric.label}>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{metric.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-900">
                <LineChart size={18} strokeWidth={3} aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">Grocery Index</p>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-950">{indexLeader ? indexLeader.overallIndex.toFixed(1) : 'n/a'}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{indexLeader ? `${indexLeader.chainId} leads · ${indexLeader.observations} observations` : freshFoodChainIndex.coverageLabel}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-emerald-950">{indexRunnerUp ? `${indexRunnerUp.chainId} runner-up at ${indexRunnerUp.overallIndex.toFixed(1)}` : freshFoodChainIndex.sourceLabel}</p>
            </div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
              <div className="flex items-center gap-2 text-cyan-900">
                <ArrowDownRight size={18} strokeWidth={3} aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">Movers</p>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-950">{terminalMovers.length}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Latest verified price drops</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-cyan-950">{terminalMovers[0] ? `${terminalMovers[0].productName} moved ${signedPct(terminalMovers[0].changePercent)}` : 'No dated mover rows available.'}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-rose-900">
                <Bell size={18} strokeWidth={3} aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">Watchlist</p>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-950">{terminalWatchlist.length}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Account-bound candidates</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-rose-950">{terminalWatchlist[0]?.sourceLabel ?? 'Signed-in watchlist rows only.'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Best true deals</p>
                <h2 className="mt-1 text-xl font-black">Deal leaders with source confidence</h2>
              </div>
              <Flame size={22} strokeWidth={3} aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-2">
              {terminalDeals.map((deal) => (
                <Link className="rounded-lg bg-white/10 p-3 transition hover:bg-white/15" href={`/products/${deal.productSlug}`} key={deal.productSlug}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{deal.productName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{deal.categoryLabel} · {deal.evidenceLabel}</p>
                    </div>
                    <span className="text-sm font-black text-amber-200">{deal.dealScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {terminalWatchlist.slice(0, 2).map((product) => (
              <Link className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-rose-400" href={`/products/${product.sourceProductSlug}`} key={product.sourceProductSlug}>
                {product.imageUrl ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50 p-2">
                    <ProductImage alt={`${product.productName} product image`} className="max-h-full max-w-full object-contain" height={64} sizes="64px" src={product.imageUrl} width={64} />
                  </div>
                ) : <div className="h-16 w-16 rounded-lg bg-slate-100" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{product.productName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{product.currentPriceLabel} · target {product.targetPriceLabel}</p>
                  <p className="mt-1 text-xs font-black text-rose-800">Deal Score {product.dealScore}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <details className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
          <summary className="cursor-pointer text-sm font-black text-slate-900">Source heat, market switcher, and freshness evidence</summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Grid3X3 size={18} strokeWidth={3} aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">Category heatmap</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {terminalHeatTiles.map((tile) => (
                  <Link className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-amber-400" href={tile.route} key={tile.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">{tile.label}</p>
                      <span className="text-sm font-black text-amber-700">{Math.round(tile.heatScore)}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{tile.metricLabel}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{tile.confidenceLabel}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Shuffle size={18} strokeWidth={3} aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.16em]">Market switcher</p>
              </div>
              <div className="grid gap-2">
                {terminalMarkets.map((market) => (
                  <Link className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800 transition hover:border-emerald-500" href={market.href} key={market.country}>
                    <span>{market.label}</span>
                    <span className="text-xs text-slate-500">{market.country}</span>
                  </Link>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-white p-3 text-xs font-semibold leading-5 text-slate-600">{freshFoodChainIndex.coverageLabel}. {freshFoodChainIndex.guardrails[0]}</p>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <MarketTerminalHero />
      <PriceDropDiscoveryRail />
      <PersonalizedPriceDropFeed />
      <PersonalizedRecommendations />
      <section className="mx-auto my-6 w-full max-w-6xl rounded-3xl border border-cyan-100 bg-cyan-50/80 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">Neighborhood trends · Södermalm / {neighborhoodTrendFeed.city}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Trending nearby, not just country-wide</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Local discovery blends chosen-neighborhood interest with regional product momentum so shoppers can see what nearby households are comparing without overgeneralizing national trends.
            </p>
          </div>
          <Link className="rounded-full bg-cyan-900 px-4 py-2 text-sm font-black text-white" href="/api/feed/trends?neighborhood=Södermalm&region=stockholm">
            Feed JSON
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {neighborhoodTrendFeed.products.map((item) => (
            <Link className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-cyan-300" href={item.resultHref} key={item.productSlug}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">#{item.rank} · {item.categoryLabel}</p>
              <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">{item.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.brand}</p>
              <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-xs font-bold leading-5 text-cyan-950">{item.evidenceLabel}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto my-6 w-full max-w-6xl rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Returning shopper shortcuts</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add your recurring staples in one tap</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Built from matched purchase-history rows only; GroceryView creates a draft basket and never places an order.
        </p>
        <div className="mt-4 rounded-2xl bg-white p-4">
          <BasketBuilder products={pastPurchaseProducts} pastPurchaseShortcuts={pastPurchaseProducts} />
        </div>
      </section>
      <section className="mx-auto my-6 w-full max-w-6xl rounded-3xl border border-emerald-100 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Student staples</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Find the cheapest basics this week</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">Compare milk, pasta, rice, eggs, coffee, oats, and produce across selected stores with budget impact and partial-coverage confidence.</p>
        <Link className="mt-4 inline-flex rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" href="/student-staples">Open staples board</Link>
      </section>
      <PwaInstallEducationCard />
      <MarketShell />
    </>
  );
}
