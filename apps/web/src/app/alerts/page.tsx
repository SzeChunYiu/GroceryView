import { AlertManagementPanel, type AlertProductSummary } from '@/components/AlertListItem';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatSek, matchedChainProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/alerts');
}

const alertProductSummaries: AlertProductSummary[] = matchedChainProducts.slice(0, 120).map((product) => ({
  productId: product.slug,
  productName: product.name,
  currentPrice: product.lowestPrice,
  currentPriceText: formatSek(product.lowestPrice),
  lowestChain: product.lowestChain,
  productHref: `/products/${product.slug}`
}));

export default function AlertsPage() {
  return (
    <PageShell>
      <Eyebrow>Price alerts</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Manage active price alerts</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Load the alerts tied to your email, compare each target with the current verified lowest chain price when GroceryView has a matching product row, and delete alerts you no longer need.
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
          <p className="text-sm font-black text-slate-600">Guardrail</p>
          <p className="mt-2 text-xl font-black text-slate-950">No synthetic prices</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">missing current prices stay labelled unavailable</p>
        </Card>
      </div>

      <AlertManagementPanel products={alertProductSummaries} />
    </PageShell>
  );
}
