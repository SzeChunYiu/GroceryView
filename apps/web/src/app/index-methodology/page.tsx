import { calculateChainPriceIndex } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { buildChainPriceObservations, buildMatchedBasketChainPriceObservations } from '@/lib/chain-index-data';
import { axfoodProducts } from '@/lib/axfood-products';
import { coopProducts, coopSource } from '@/lib/ingested/coop';
import { hemkopSourceSummary, willysSourceSummary } from '@/lib/ingested/axfood-weekly-summary';
import { matpriskollenOffers, matpriskollenSource } from '@/lib/ingested/matpriskollen';
import { buildUnitNormalizationAuditRows, type UnitNormalizationAuditInput } from '@/lib/normalization';
import { routeMetadata } from '@/lib/seo';

type ConfidenceLevel = 'high' | 'medium' | 'low';

export function generateMetadata() {
  return routeMetadata({
    path: '/index-methodology',
    title: 'Grocery index methodology | GroceryView',
    description:
      'Review GroceryView chain index constituents, category weights, base date, rebalance policy, source coverage, and confidence rules.'
  });
}

const broadObservations = buildChainPriceObservations();
const matchedBasketObservations = buildMatchedBasketChainPriceObservations();
const indexObservations = [...broadObservations, ...matchedBasketObservations];
const methodologyIndex = calculateChainPriceIndex(indexObservations);

const activeSources = [
  {
    name: 'Coop product search',
    retrievedAt: coopSource.retrievedAt,
    rows: coopSource.rowCount,
    role: 'base unit-price universe'
  },
  {
    name: 'Willys product search',
    retrievedAt: willysSourceSummary.retrievedAt,
    rows: willysSourceSummary.rowCount,
    role: 'base unit-price universe'
  },
  {
    name: 'Hemkop product search',
    retrievedAt: hemkopSourceSummary.retrievedAt,
    rows: hemkopSourceSummary.rowCount,
    role: 'base unit-price universe'
  },
  {
    name: 'Matpriskollen public offers',
    retrievedAt: matpriskollenSource.retrievedAt,
    rows: matpriskollenSource.rowCount,
    role: 'current offer unit-price universe'
  },
  {
    name: 'Axfood matched product scrape',
    retrievedAt: '2026-05-21T23:59:59.000Z',
    rows: matchedBasketObservations.length,
    role: 'matched-basket refinement rows'
  }
];

const unitPriceFragmentPattern = /(-?\d+(?:[,.]\d+)?)\s*(?:kr|sek)?\s*\/\s*([^\s,;]+)/i;

function unitPriceFromText(text: string): Pick<UnitNormalizationAuditInput, 'unitPrice' | 'unitPriceUnit'> {
  const match = text.match(unitPriceFragmentPattern);
  if (!match) return { unitPrice: null, unitPriceUnit: null };
  const value = Number(match[1]!.replace(',', '.'));
  return {
    unitPrice: Number.isFinite(value) ? value : null,
    unitPriceUnit: match[2] ?? null
  };
}

const unitNormalizationAuditRows = buildUnitNormalizationAuditRows([
  ...coopProducts.map((product) => ({
    sourceName: 'Coop product search',
    productId: product.code,
    productName: product.name,
    unitPrice: product.unitPrice,
    unitPriceUnit: product.unitPriceUnit
  })),
  ...matpriskollenOffers.map((offer) => ({
    sourceName: 'Matpriskollen public offers',
    productId: offer.code,
    productName: offer.name,
    ...unitPriceFromText(offer.comparePriceText)
  })),
  ...axfoodProducts.flatMap((product) => Object.entries(product.chains).map(([chain, price]) => ({
    sourceName: 'Axfood matched product scrape',
    productId: `${chain}:${product.code}`,
    productName: `${product.name} (${chain})`,
    unitPrice: price.price,
    unitPriceUnit: price.priceUnit
  })))
]);

const latestSourceDate = activeSources
  .map((source) => new Date(source.retrievedAt))
  .sort((a, b) => b.getTime() - a.getTime())[0];

const categoryRows = methodologyIndex.categories
  .map((category) => {
    const rows = indexObservations.filter((observation) => observation.category === category);
    const chainCount = new Set(rows.map((row) => row.chainId)).size;
    const weight = rows.length / methodologyIndex.generatedFrom;
    const confidence: ConfidenceLevel = rows.length >= 30 && chainCount >= 3 ? 'high' : rows.length >= 10 && chainCount >= 2 ? 'medium' : 'low';
    return {
      category,
      chains: chainCount,
      confidence,
      marketReference: methodologyIndex.marketReferenceByCategory[category] ?? 0,
      observations: rows.length,
      weight
    };
  })
  .sort((a, b) => b.weight - a.weight || a.category.localeCompare(b.category));

const categoryConfidenceCounts = categoryRows.reduce(
  (summary, category) => ({
    ...summary,
    [category.confidence]: summary[category.confidence] + 1
  }),
  { high: 0, medium: 0, low: 0 } as Record<ConfidenceLevel, number>
);

const chainConfidenceCounts = methodologyIndex.chains.reduce(
  (summary, chain) => ({
    ...summary,
    [chain.confidence]: summary[chain.confidence] + 1
  }),
  { high: 0, medium: 0, low: 0 } as Record<ConfidenceLevel, number>
);

const totalSourceRows = activeSources.reduce((sum, source) => sum + source.rows, 0);
const totalUnresolvedUnitConversions = unitNormalizationAuditRows.reduce((sum, row) => sum + row.unresolvedConversionCount, 0);

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(typeof value === 'string' ? new Date(value) : value);
}

function formatNumber(value: number) {
  return value.toLocaleString('sv-SE');
}

function formatWeight(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function confidenceLabel(level: ConfidenceLevel) {
  if (level === 'high') return 'high confidence';
  if (level === 'medium') return 'medium confidence';
  return 'low confidence';
}

export default function IndexMethodologyPage() {
  return (
    <PageShell>
      <Eyebrow>Public methodology</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">GroceryView Chain Price Index methodology</h1>
      <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-700">
        This S&amp;P-style methodology describes the public GroceryView chain index: eligible constituents, category weights, base date, rebalance rules, and confidence gates. The numbers below are computed from the same real source rows used by the chain-index route.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Index base date</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatDate(latestSourceDate)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">UTC source snapshot date</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Base value</p>
          <p className="mt-2 text-3xl font-black text-slate-950">100.00</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">market median basket</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Eligible rows</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(methodologyIndex.generatedFrom)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">normalized positive unit prices</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Category constituents</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(methodologyIndex.categories.length)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">weighted by source coverage</p>
        </Card>
      </div>

      <Card className="mt-6 border-slate-200 bg-white">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Universe and constituents</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Chains enter only with comparable unit-price evidence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The methodology starts with public retailer and offer rows, canonicalizes unit prices to kr/kg, kr/l, or kr/st, maps them into a shared grocery taxonomy, and keeps only positive comparable prices. A chain is an index constituent when at least one eligible row remains after those filters.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ConfidenceBadge level="high" label={`${chainConfidenceCounts.high} high`} />
              <ConfidenceBadge level="medium" label={`${chainConfidenceCounts.medium} medium`} />
              <ConfidenceBadge level="low" label={`${chainConfidenceCounts.low} low`} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {methodologyIndex.chains.map((chain) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={chain.chainId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">constituent</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{chain.chainId}</p>
                  </div>
                  <ConfidenceBadge level={chain.confidence} label={chain.confidence} sampleSize={chain.observations} />
                </div>
                <p className="mt-3 text-3xl font-black text-emerald-800">{chain.overallIndex.toFixed(1)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{chain.categoriesCovered} categories covered</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-purple-200 bg-purple-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Unit normalization audit</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-purple-950">Unresolved conversions are counted before price-per-unit claims ship</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-purple-950">
              Each methodology source is audited with the ingest normalizer so unsupported unit labels stay visible with confidence levels and affected product counts.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-purple-900 shadow-sm">
            {formatNumber(totalUnresolvedUnitConversions)} unresolved conversions
          </p>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-purple-200 bg-white">
          <div className="grid grid-cols-[1fr_8rem_7rem_7rem_1.3fr] gap-3 border-b border-purple-100 bg-purple-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-purple-950">
            <span>Source</span>
            <span>Confidence</span>
            <span>Unresolved</span>
            <span>Affected</span>
            <span>Examples</span>
          </div>
          {unitNormalizationAuditRows.map((row) => (
            <div className="grid grid-cols-[1fr_8rem_7rem_7rem_1.3fr] gap-3 border-b border-purple-100 px-4 py-3 text-sm last:border-b-0" key={row.sourceName}>
              <p className="font-black text-purple-950">{row.sourceName}</p>
              <ConfidenceBadge level={row.confidence} label={row.confidence} sampleSize={row.totalProductCount} />
              <p className="font-black text-purple-950">{formatNumber(row.unresolvedConversionCount)}</p>
              <p className="font-black text-purple-950">{formatNumber(row.affectedProductCount)}</p>
              <p className="text-xs font-semibold leading-5 text-purple-800">
                {row.examples.length > 0 ? row.examples.join(' · ') : 'No unresolved unit conversions in the audited rows.'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Weights</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Category weights follow eligible market row depth</h2>
            <p className="mt-3 text-sm leading-6 text-blue-950">
              Each category receives a market reference median, then the overall chain score is the weighted geometric mean of category ratios. The weight is the category share of eligible source rows, matching the core calculator market-category-size weighting.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ConfidenceBadge level="high" label={`${categoryConfidenceCounts.high} high categories`} />
              <ConfidenceBadge level="medium" label={`${categoryConfidenceCounts.medium} medium categories`} />
              <ConfidenceBadge level="low" label={`${categoryConfidenceCounts.low} low categories`} />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white">
            <div className="grid grid-cols-[1fr_5rem_5rem_7rem] gap-3 border-b border-blue-100 bg-blue-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-blue-950">
              <span>Category</span>
              <span>Weight</span>
              <span>Rows</span>
              <span>Confidence</span>
            </div>
            {categoryRows.slice(0, 12).map((category) => (
              <div className="grid grid-cols-[1fr_5rem_5rem_7rem] gap-3 border-b border-blue-100 px-4 py-3 text-sm last:border-b-0" key={category.category}>
                <div>
                  <p className="font-black text-blue-950">{category.category}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-700">{category.chains} chains · market reference {category.marketReference.toFixed(2)}</p>
                </div>
                <p className="font-black text-blue-950">{formatWeight(category.weight)}</p>
                <p className="font-black text-blue-950">{formatNumber(category.observations)}</p>
                <ConfidenceBadge level={category.confidence} label={category.confidence} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50">
          <Eyebrow>Calculation</Eyebrow>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">Index formula and base</h2>
          <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-emerald-950">
            <p className="rounded-2xl bg-white/80 p-4">Base date: {formatDate(latestSourceDate)}. Base value: 100.00 equals the current market-median basket across eligible categories.</p>
            <p className="rounded-2xl bg-white/80 p-4">Category index: chain median unit price divided by market median unit price, multiplied by 100.</p>
            <p className="rounded-2xl bg-white/80 p-4">Shrinkage: cells with sparse observations are pulled toward 100 by a four-observation prior before the overall score is calculated.</p>
            <p className="rounded-2xl bg-white/80 p-4">Overall index: weighted geometric mean of adjusted category ratios. Lower than 100 means cheaper than the market median basket.</p>
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <Eyebrow>Rebalancing</Eyebrow>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-amber-950">Reconstitution follows generated source refreshes</h2>
          <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-amber-950">
            <p className="rounded-2xl bg-white/80 p-4">Rebalance trigger: when source modules are regenerated and the web build consumes the new files.</p>
            <p className="rounded-2xl bg-white/80 p-4">Constituent review: chains and categories are re-evaluated from current eligible rows; no chain, SKU, or category is manually forced into the index.</p>
            <p className="rounded-2xl bg-white/80 p-4">Weight update: category weights recompute from eligible row counts at each refresh, so stale or missing categories naturally lose weight.</p>
            <p className="rounded-2xl bg-white/80 p-4">Corporate action equivalent: matched Axfood rows can refine Willys/Hemkop basket coverage only when exact product-code matches exist in both chains.</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-slate-200 bg-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Coverage and confidence</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Confidence is attached to every public methodology claim</h2>
          </div>
          <p className="text-sm font-black text-slate-600">{formatNumber(totalSourceRows)} source rows listed below</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {activeSources.map((source) => {
            const level: ConfidenceLevel = source.rows >= 500 ? 'high' : source.rows >= 100 ? 'medium' : 'low';
            return (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
                <p className="text-sm font-black text-slate-950">{source.name}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(source.rows)}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{source.role}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">retrieved {formatDate(source.retrievedAt)}</p>
                <div className="mt-3">
                  <ConfidenceBadge level={level} label={confidenceLabel(level)} sampleSize={source.rows} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-slate-700 md:grid-cols-3">
          <p className="rounded-2xl bg-slate-50 p-4">Overall chain confidence is high at 30+ rows and 4+ categories, medium at 10+ rows and 2+ categories, otherwise low.</p>
          <p className="rounded-2xl bg-slate-50 p-4">Category-cell confidence is high at 12+ observations, medium at 4+ observations, and low below 4; low cells are marked estimated by the calculator.</p>
          <p className="rounded-2xl bg-slate-50 p-4">The page does not forecast, interpolate missing rows, or infer local branch stock from the national index universe.</p>
        </div>
      </Card>
    </PageShell>
  );
}
