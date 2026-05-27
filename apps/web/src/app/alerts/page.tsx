import { AlertManagementPanel, type AlertProductSummary } from '@/components/AlertListItem';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { DealHunterDiscoveryAlerts, type DealHunterDiscoveryAlert, type DealHunterDiscoveryOption } from '@/components/dealhunter-discovery-alerts';
import { FunnelStepBeacon } from '@/components/funnel-step-beacon';
import { PushNotificationPreferenceControls } from '@/components/notification-inbox-actions';
import { SavedSearchSubscriptionsPanel } from '@/components/saved-search-subscriptions';
import { buildAlertExplanationTimeline, buildBestTimeAlertExplanationTimeline, type SavedSearchDealCandidate } from '@/lib/alert-scheduler';
import { FREE_PRICE_ALERT_LIMIT } from '@/app/api/alerts/store';
import { buildNewArrivalFeed, getPriceFreshness } from '@/lib/freshness';
import { categoryLabels, pricedProducts, type PricedProduct } from '@/lib/openprices-products';
import { formatPct, formatSek, matchedChainProducts, priceDropMoversBoard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { watchlistAlertBoard } from '@/lib/watchlist-data';

export function generateMetadata() {
  return routeMetadata('/alerts');
}

const alertProductSummaries: AlertProductSummary[] = matchedChainProducts.slice(0, 120).map((product) => {
  const lastObservedAt = (product as { lastObservedAt?: string | number | Date }).lastObservedAt;
  const bestTimeTimeline = buildBestTimeAlertExplanationTimeline({
    productName: product.name,
    categoryLabel: product.category,
    flyerWindowLabel: 'Known flyer windows are evaluated by /api/alerts/best-time when a client supplies upcomingFlyerWindows.',
    observedPriceCount: product.inChains.length,
    observedRangeLabel: `${product.inChains.length} chain price source${product.inChains.length === 1 ? '' : 's'} currently matched`,
    seasonalityLabel: `${product.category} seasonality is kept visible as a timing factor before GroceryView recommends buying now or waiting.`,
    volatilityScore: null
  });

  return {
    productId: product.slug,
    productName: product.name,
    currentPrice: product.lowestPrice,
    currentPriceText: formatSek(product.lowestPrice),
    lastObservedAt: lastObservedAt ? new Date(lastObservedAt).toISOString() : undefined,
    lowestChain: product.lowestChain,
    productHref: `/products/${product.slug}`,
    explanationTimeline: buildAlertExplanationTimeline({
      productName: product.name,
      currentPriceText: formatSek(product.lowestPrice),
      lowestChain: product.lowestChain,
      targetPriceText: formatSek(product.lowestPrice),
      lastObservedAt: lastObservedAt ? new Date(lastObservedAt).toISOString() : undefined,
      predictionSource: bestTimeTimeline.map((step) => `${step.label}: ${step.detail}`).join(' ')
    })
  };
});

const bestTimeExplanationPreview = buildBestTimeAlertExplanationTimeline({
  productName: 'Best-time alert',
  categoryLabel: 'selected category',
  flyerWindowLabel: 'Known flyer windows are checked before recommending wait-for-flyer alerts.',
  observedPriceCount: alertProductSummaries.length,
  observedRangeLabel: 'verified alert catalogue rows',
  seasonalityLabel: 'Category seasonality is shown as a decision input instead of hiding timing assumptions.',
  volatilityScore: null
});

const savedSearchDealCandidates: SavedSearchDealCandidate[] = matchedChainProducts.slice(0, 80).map((product) => ({
  id: product.slug,
  name: product.name,
  brand: product.brand,
  href: `/products/${product.slug}`,
  category: product.category,
  chain: product.lowestChain,
  labels: product.labels,
  currentPriceText: formatSek(product.lowestPrice),
  priceDropText: product.spreadPct > 0 ? `${Math.round(product.spreadPct)}% cross-chain price gap can trigger a saved-search price-drop review.` : null,
  dealSummary: `${product.lowestChain} currently has the lowest verified chain price for this product.`
}));

const normalWatchlistAlertProductIds = new Set(watchlistAlertBoard.watchlistAlerts.map((alert) => alert.productId));
const pricedProductBySlug = new Map(pricedProducts.map((product) => [product.slug, product]));
const rawNewArrivalFeed = buildNewArrivalFeed(pricedProducts, { categoryLabels, limit: 16, windowDays: 30 });
const rawMaterialPriceDrops = priceDropMoversBoard.filter((mover) => Math.abs(mover.changePercent) >= 5);

function latestObservedPrice(product: PricedProduct): number | null {
  const latest = [...product.observations]
    .filter((observation) => Number.isFinite(observation.price))
    .sort((left, right) => right.date.localeCompare(left.date))[0];
  return latest?.price ?? (Number.isFinite(product.priceMedian) ? product.priceMedian : null);
}

const dealHunterNewProductAlerts: DealHunterDiscoveryAlert[] = rawNewArrivalFeed
  .filter((item) => !normalWatchlistAlertProductIds.has(item.slug))
  .flatMap((item) => {
    const product = pricedProductBySlug.get(item.slug);
    if (!product) return [];
    const currentPrice = latestObservedPrice(product);
    if (currentPrice === null) return [];
    return [{
      id: `new-${item.slug}`,
      type: 'new_product',
      productSlug: item.slug,
      productName: item.name,
      brand: item.brand,
      categoryKey: product.category,
      categoryLabel: item.category,
      chainKey: 'openprices',
      chainLabel: 'OpenPrices observations',
      href: item.href,
      currentPriceLabel: formatSek(currentPrice),
      sourceLabel: item.sourceLabel,
      freshnessLabel: item.freshness.label,
      freshnessDetail: item.freshness.refreshHint,
      observedAt: item.lastObservedAt,
      confidenceLabel: `${item.observationCount.toLocaleString('sv-SE')} dated observations`,
      dedupeLabel: 'Not already covered by a normal watchlist alert'
    } satisfies DealHunterDiscoveryAlert];
  });

const dealHunterPriceDropAlerts: DealHunterDiscoveryAlert[] = rawMaterialPriceDrops
  .filter((mover) => !normalWatchlistAlertProductIds.has(mover.productSlug))
  .map((mover) => {
    const product = pricedProductBySlug.get(mover.productSlug);
    const freshness = getPriceFreshness(mover.latestObservedAt);
    return {
      id: `drop-${mover.productSlug}`,
      type: 'price_drop',
      productSlug: mover.productSlug,
      productName: mover.productName,
      brand: product?.brands || 'Brand not reported',
      categoryKey: product?.category ?? mover.categoryLabel,
      categoryLabel: mover.categoryLabel,
      chainKey: 'openprices',
      chainLabel: 'OpenPrices observations',
      href: `/products/${mover.productSlug}`,
      currentPriceLabel: formatSek(mover.latestPrice),
      previousPriceLabel: formatSek(mover.previousPrice),
      dropPercentLabel: `${formatPct(Math.abs(mover.changePercent))} drop`,
      sourceLabel: `${mover.observedCount.toLocaleString('sv-SE')} dated price points; ${mover.legalCopy}`,
      freshnessLabel: freshness.label,
      freshnessDetail: freshness.refreshHint,
      observedAt: mover.latestObservedAt,
      confidenceLabel: mover.isNewLow ? 'Observed low in current history' : `${mover.rawObservationCount.toLocaleString('sv-SE')} raw observations`,
      dedupeLabel: 'Not already covered by a normal watchlist alert'
    } satisfies DealHunterDiscoveryAlert;
  });

const dealHunterDiscoveryAlerts = [...dealHunterNewProductAlerts, ...dealHunterPriceDropAlerts].slice(0, 18);
const dedupedDiscoveryAlertCount = rawNewArrivalFeed.filter((item) => normalWatchlistAlertProductIds.has(item.slug)).length
  + rawMaterialPriceDrops.filter((mover) => normalWatchlistAlertProductIds.has(mover.productSlug)).length;
const dealHunterCategoryOptions: DealHunterDiscoveryOption[] = [...new Map(dealHunterDiscoveryAlerts.map((alert) => [alert.categoryKey, {
  value: alert.categoryKey,
  label: alert.categoryLabel
}])).values()].sort((left, right) => left.label.localeCompare(right.label, 'sv'));
const dealHunterChainOptions: DealHunterDiscoveryOption[] = [...new Map(dealHunterDiscoveryAlerts.map((alert) => [alert.chainKey, {
  value: alert.chainKey,
  label: alert.chainLabel
}])).values()].sort((left, right) => left.label.localeCompare(right.label, 'sv'));

export default function AlertsPage() {
  return (
    <PageShell>
      <FunnelStepBeacon step="watchlist_alert" />
      <Eyebrow>Price alerts</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Manage active price alerts</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Load the alerts tied to your email, compare each target with the current verified lowest chain price when GroceryView has a matching product row, and delete alerts you no longer need.
        Saved search subscriptions also surface matching new deals in this alerts area. No synthetic prices are used for alert context.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Current-price catalogue</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{alertProductSummaries.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">verified product rows available for alert context</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">API source</p>
          <p className="mt-2 text-xl font-black text-slate-950">/api/alerts</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">lists and deletes only rows for the supplied email</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Free alert limit</p>
          <p className="mt-2 text-xl font-black text-slate-950">{FREE_PRICE_ALERT_LIMIT} active alerts</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">premium unlocks unlimited alerts, priority checks, and earlier deal notifications</p>
        </Card>
      </div>

      <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-label="Best-time alert explanation inputs">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Best-time-to-buy explanations</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Why a timing alert fires</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Best-time alerts expose the seasonal context, observed volatility, and known flyer-window signal that influenced the buy-now, wait, or keep-watching decision.
        </p>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {bestTimeExplanationPreview.map((step) => (
            <li className="rounded-2xl bg-emerald-50 p-4" key={step.kind}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{step.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-5" aria-label="Granular alert preference setup">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-800">Notification controls</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Decide which alerts become push notifications</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Shoppers can independently opt into price drops, best-time-to-buy alerts, expiring pantry reminders, and weekly basket digests before granting push delivery.
        </p>
        <PushNotificationPreferenceControls />
      </section>

      <DealHunterDiscoveryAlerts
        alerts={dealHunterDiscoveryAlerts}
        categoryOptions={dealHunterCategoryOptions}
        chainOptions={dealHunterChainOptions}
        dedupedWatchlistCount={dedupedDiscoveryAlertCount}
      />

      <AlertManagementPanel products={alertProductSummaries} />
      <SavedSearchSubscriptionsPanel candidates={savedSearchDealCandidates} />
    </PageShell>
  );
}
