import { notFound } from 'next/navigation';
import { calculateDealScore, scoreBand } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { pricedProducts } from '@/lib/openprices-products';
import { chainPriceRows, findProduct, formatPct, formatSek, labelFromSlug } from '@/lib/verified-data';

const REQUIRED_CHAIN_COVERAGE = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function percentileForPrice(values: number[], currentPrice: number) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length <= 1) return 50;
  const firstAtOrAbove = sorted.findIndex((value) => value >= currentPrice);
  const rank = firstAtOrAbove === -1 ? sorted.length - 1 : firstAtOrAbove;
  return clamp((rank / (sorted.length - 1)) * 100, 0, 100);
}

function latestObservationFor(product: (typeof pricedProducts)[number]) {
  return [...product.observations].sort((a, b) => b.date.localeCompare(a.date))[0];
}

function dealScoreVerdictFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product) {
    const rows = chainPriceRows(product);
    const crossChainSpreadPercentile = clamp(100 - product.spreadPct * 2, 0, 100);
    const sourceConfidence = clamp(rows.length / REQUIRED_CHAIN_COVERAGE, 0, 1);
    const score = calculateDealScore({
      currentCityPercentile: crossChainSpreadPercentile,
      knownPromoHistoryPercentile: crossChainSpreadPercentile,
      equivalentUnitPricePercentile: rows.length > 1 ? 0 : 50,
      discountDepthPercent: product.spreadPct,
      sourceConfidence
    });

    return {
      score,
      band: scoreBand(score),
      confidence: sourceConfidence,
      evidence: `${rows.length} exact chain price rows`,
      percentileLabel: `cross-chain spread percentile ${formatPct(crossChainSpreadPercentile)}`,
      caveat: 'Full promotion history is missing, so calculateDealScore uses percentiles derived only from the observed cross-chain spread.'
    };
  }

  const latest = latestObservationFor(product);
  const currentPrice = latest?.price ?? product.priceMedian;
  const historicalPrices = product.observations.map((observation) => observation.price);
  const historyPercentile = percentileForPrice(historicalPrices, currentPrice);
  const discountDepthPercent = product.priceMax > 0 ? clamp(((product.priceMax - currentPrice) / product.priceMax) * 100, 0, 100) : 0;
  const sourceConfidence = clamp(product.observationCount / 30, 0, 1);
  const score = calculateDealScore({
    currentCityPercentile: historyPercentile,
    knownPromoHistoryPercentile: historyPercentile,
    equivalentUnitPricePercentile: historyPercentile,
    discountDepthPercent,
    sourceConfidence
  });

  return {
    score,
    band: scoreBand(score),
    confidence: sourceConfidence,
    evidence: `${product.observationCount} OpenPrices observations`,
    percentileLabel: `observed-history percentile ${formatPct(historyPercentile)}`,
    caveat: 'Uses OpenPrices price observations only; no retailer promotion or unobserved discount is inferred.'
  };
}

export function generateStaticParams() {
  return [...axfoodProducts.slice(0, 40), ...pricedProducts.slice(0, 40)].map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const isChain = 'lowestPrice' in product;
  const dealVerdict = dealScoreVerdictFor(product);
  return (
    <PageShell>
      <Eyebrow>{isChain ? 'Axfood chain product' : 'OpenPrices product'}</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{product.name}</h1>
      <p className="mt-3 text-lg text-slate-700">{isChain ? product.brand : product.brands || 'Brand not reported'} · {isChain ? product.subline : product.quantity || 'Quantity not reported'}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-2xl font-black">Primary price evidence</h2>
          {isChain ? (
            <div className="mt-4 grid gap-3">
              <p className="text-5xl font-black text-emerald-800">{formatSek(product.lowestPrice)}</p>
              <p className="font-semibold text-slate-700">Lowest chain: {product.lowestChain}. Highest observed chain price: {formatSek(product.highestPrice)}.</p>
              <p className="rounded-2xl bg-amber-50 p-4 font-black text-amber-950">Comparable spread: {formatPct(product.spreadPct)}. This is chain-wide catalogue evidence, not per-branch shelf evidence.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-5xl font-black text-emerald-800">{formatSek(product.priceMedian)}</p>
              <p className="font-semibold text-slate-700">Observed {product.observationCount} time(s); latest observation {product.lastObservedAt}.</p>
              <p className="rounded-2xl bg-amber-50 p-4 font-black text-amber-950">Range: {formatSek(product.priceMin)} to {formatSek(product.priceMax)}. Community OpenPrices data is displayed with explicit count and date.</p>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-2xl font-black">Source fields</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Code</dt><dd>{product.code}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Category</dt><dd>{labelFromSlug(product.category)}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black">Source</dt><dd>{isChain ? 'Willys/Hemköp public search snapshot' : 'OpenPrices / Open Food Facts SEK observation'}</dd></div>
          </dl>
        </Card>
      </div>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Buy/Wait signal</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Deal Score verdict</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Calls calculateDealScore and scoreBand with visible price evidence. {dealVerdict.caveat}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-5 text-right shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Deal Score</p>
            <p className="mt-2 text-5xl font-black text-emerald-950">{dealVerdict.score}</p>
            <p className="mt-1 text-lg font-black text-slate-950">{dealVerdict.band.label} · {dealVerdict.band.verdict}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{dealVerdict.percentileLabel}</p>
          <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">confidence {formatPct(dealVerdict.confidence * 100)}</p>
          <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{dealVerdict.evidence}</p>
        </div>
      </Card>
      {isChain ? (
        <Card className="mt-6">
          <h2 className="text-2xl font-black">Chain price rows</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {chainPriceRows(product).map((row) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={row.chain}>
                <p className="text-lg font-black capitalize">{row.chain}</p>
                <p className="mt-1 text-3xl font-black text-emerald-800">{formatSek(row.price)}</p>
                <p className="text-sm text-slate-600">{row.priceUnit || 'Unit not reported'}{row.savings ? ` · listed saving ${formatSek(row.savings)}` : ''}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </PageShell>
  );
}
