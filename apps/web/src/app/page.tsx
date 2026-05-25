import Link from 'next/link';
import { PersonalizedPriceDropFeed, PriceDropDiscoveryRail } from '@/app/page-sections/trending';
import { BasketBuilder, type BasketBuilderProduct } from '@/components/basket-builder';
import { PersonalizedRecommendations } from '@/components/personalized-recommendations';
import { MarketShell } from '@/components/market-shell';
import { PwaInstall, PwaInstallEducationCard } from '@/components/pwa-install';
import { homePastPurchaseShortcuts } from '@/lib/recurring-basket';
import { routeMetadata } from '@/lib/seo';
import { buildTrendingDiscoveryFeed } from '@/lib/trends';

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

export default function HomePage() {
  return (
    <>
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
      <PwaInstallEducationCard />
      <MarketShell />
      <PwaInstall />
    </>
  );
}
