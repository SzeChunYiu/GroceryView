import { BasketCalculator, type BasketCalculatorProduct } from '@/components/basket-calculator';
import { BasketBuyTiming } from '@/components/basket-buy-timing';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { FunnelStepBeacon } from '@/components/funnel-step-beacon';
import { dbSiteSnapshotGeneratedAt } from '@/lib/generated/db-site-products';
import { assessBasketBuyTiming } from '@/lib/price-intelligence';
import { routeMetadata } from '@/lib/seo';
import { chainPriceRows, formatPct, formatSek, labelFromSlug, matchedChainProducts, topChainSpreads } from '@/lib/verified-data';

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
    savings: row.savings
  }))
}));

const basketBuyTimingRecommendations = topChainSpreads.slice(0, 12).map((product) => {
  const pricedRows = chainPriceRows(product).sort((left, right) => left.price - right.price || left.chain.localeCompare(right.chain, 'sv'));
  const cheapest = pricedRows[0]!;
  const highest = pricedRows[pricedRows.length - 1] ?? cheapest;
  const averagePrice = pricedRows.reduce((sum, row) => sum + row.price, 0) / pricedRows.length;
  const substituteProduct = topChainSpreads.find((candidate) =>
    candidate.slug !== product.slug
    && candidate.category === product.category
    && candidate.lowestPrice > 0
    && candidate.lowestPrice < product.lowestPrice
  );

  return assessBasketBuyTiming({
    id: product.slug,
    productName: product.name,
    categoryLabel: labelFromSlug(product.category),
    currentPrice: cheapest.price,
    currentPriceLabel: cheapest.priceText,
    currentStoreName: chainName(cheapest.chain),
    typicalPrice: averagePrice,
    previousPrice: highest.price,
    sourceConfidence: Math.min(1, product.inChains.length / 3),
    substitute: substituteProduct ? {
      productName: substituteProduct.name,
      price: substituteProduct.lowestPrice,
      priceLabel: formatSek(substituteProduct.lowestPrice),
      storeName: chainName(substituteProduct.lowestChain)
    } : null
  });
});

const sourceLabel = dbSiteSnapshotGeneratedAt
  ? `postgres.latest_prices/observations site snapshot generated ${dbSiteSnapshotGeneratedAt}`
  : 'postgres.latest_prices/observations DB-shaped generated module; local builds fall back to the bundled verified Axfood snapshot';

const weeklyBasketBudgetSek = 600;

export default function BasketPage() {
  const pricedRows = basketProducts.reduce((sum, product) => sum + product.prices.length, 0);
  const averageSpread = matchedChainProducts.length
    ? matchedChainProducts.reduce((sum, product) => sum + product.spreadPct, 0) / matchedChainProducts.length
    : 0;

  return (
    <PageShell>
      <FunnelStepBeacon step="basket_view" />
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

      <BasketBuyTiming recommendations={basketBuyTimingRecommendations} />

      <BasketCalculator products={basketProducts} sourceLabel={sourceLabel} weeklyBudgetSek={weeklyBasketBudgetSek} />

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
