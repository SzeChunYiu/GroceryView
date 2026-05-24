import { BasketCalculator, type BasketCalculatorProduct } from '@/components/basket-calculator';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { dbSiteSnapshotGeneratedAt } from '@/lib/generated/db-site-products';
import { routeMetadata } from '@/lib/seo';
import { chainPriceRows, formatPct, labelFromSlug, matchedChainProducts, topChainSpreads } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/basket');
}

const chainNames: Record<string, string> = {
  willys: 'Willys',
  hemkop: 'Hemköp'
};

function chainName(chainId: string) {
  return chainNames[chainId] ?? chainId.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const basketProducts: BasketCalculatorProduct[] = topChainSpreads.slice(0, 12).map((product) => ({
  id: product.slug,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  packageLabel: product.subline,
  categoryLabel: labelFromSlug(product.category),
  image: product.image,
  prices: chainPriceRows(product).map((row) => ({
    chainId: row.chain,
    chainName: chainName(row.chain),
    price: row.price ?? 0,
    priceText: row.priceText,
    priceUnit: row.priceUnit,
    savings: row.savings,
    isAvailable: row.isAvailable
  }))
}));

const sourceLabel = dbSiteSnapshotGeneratedAt
  ? `postgres.latest_prices/observations site snapshot generated ${dbSiteSnapshotGeneratedAt}`
  : 'postgres.latest_prices/observations DB-shaped generated module; local builds fall back to the bundled verified Axfood snapshot';

export default function BasketPage() {
  const pricedRows = basketProducts.reduce((sum, product) => sum + product.prices.length, 0);
  const averageSpread = matchedChainProducts.length
    ? matchedChainProducts.reduce((sum, product) => sum + product.spreadPct, 0) / matchedChainProducts.length
    : 0;

  return (
    <PageShell>
      <Eyebrow>Basket calculator</Eyebrow>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Cross-chain cheapest basket calculator</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Add products from the verified price catalogue and compare the best full-chain basket against a split basket that picks the cheapest observed chain per product.
          </p>
        </div>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Current DB price rows</p>
          <p className="mt-2 text-4xl font-black text-emerald-950">{pricedRows.toLocaleString('sv-SE')}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
            Built from {basketProducts.length} product candidates and postgres.latest_prices-shaped chain observations.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Matched products</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{matchedChainProducts.length.toLocaleString('sv-SE')}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Only products with at least two chain prices are eligible for this v1 basket.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Average spread</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatPct(averageSpread)}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">The calculator reuses visible chain spreads rather than estimating from names.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">State model</p>
          <p className="mt-2 text-2xl font-black text-slate-950">Ephemeral v1</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">No login, persistence, retailer checkout, or shopping-list write is triggered.</p>
        </Card>
      </div>

      <BasketCalculator products={basketProducts} sourceLabel={sourceLabel} />

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
