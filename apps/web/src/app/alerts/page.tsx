import { AlertManagementPanel, type AlertProductSummary } from '@/components/AlertListItem';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { FunnelStepBeacon } from '@/components/funnel-step-beacon';
import { SavedSearchSubscriptionsPanel } from '@/components/saved-search-subscriptions';
import { buildAlertExplanationTimeline, type SavedSearchDealCandidate } from '@/lib/alert-scheduler';
import { FREE_PRICE_ALERT_LIMIT } from '@/app/api/alerts/store';
import { formatSek, matchedChainProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/alerts');
}

const alertProductSummaries: AlertProductSummary[] = matchedChainProducts.slice(0, 120).map((product) => {
  const lastObservedAt = (product as { lastObservedAt?: string | number | Date }).lastObservedAt;

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
      predictionSource: `Prediction inputs withheld unless a forecast alert exists; current explanation uses ${product.inChains.join(' + ')} observed source rows.`
    })
  };
});

const savedSearchDealCandidates: SavedSearchDealCandidate[] = matchedChainProducts.slice(0, 80).map((product) => ({
  id: product.slug,
  name: product.name,
  href: `/products/${product.slug}`,
  category: product.category,
  chain: product.lowestChain,
  labels: product.labels,
  currentPriceText: formatSek(product.lowestPrice),
  dealSummary: `${product.lowestChain} currently has the lowest verified chain price for this product.`
}));

export default function AlertsPage() {
  return (
    <PageShell>
      <FunnelStepBeacon step="watchlist_alert" />
      <Eyebrow>Price alerts</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Manage active price alerts</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Load the alerts tied to your email, compare each target with the current verified lowest chain price when GroceryView has a matching product row, and delete alerts you no longer need.
        No synthetic prices are used for alert context.
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

      <AlertManagementPanel products={alertProductSummaries} />
      <SavedSearchSubscriptionsPanel candidates={savedSearchDealCandidates} />
    </PageShell>
  );
}
