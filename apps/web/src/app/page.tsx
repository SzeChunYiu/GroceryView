import { PersonalizedPriceDropFeed, PriceDropDiscoveryRail } from '@/app/page-sections/trending';
import { BasketBuilder, type BasketBuilderProduct } from '@/components/basket-builder';
import { PersonalizedRecommendations } from '@/components/personalized-recommendations';
import { MarketShell } from '@/components/market-shell';
import { PwaInstallEducationCard } from '@/components/pwa-install';
import { homePastPurchaseShortcuts } from '@/lib/recurring-basket';
import { routeMetadata } from '@/lib/seo';

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

export default function HomePage() {
  return (
    <>
      <PriceDropDiscoveryRail />
      <PersonalizedPriceDropFeed />
      <PersonalizedRecommendations />
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
    </>
  );
}
