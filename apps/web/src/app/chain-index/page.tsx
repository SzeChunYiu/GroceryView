import Link from 'next/link';
import { calculateBrandTierIndices, calculateChainPriceIndex } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { buildBrandTierPriceObservations, buildChainIndexTrendSeries, buildChainPriceObservations, buildMatchedBasketChainPriceObservations } from '@/lib/chain-index-data';
import { buildGroceryIndexTickerWidget } from '@/lib/grocery-index-widget';
import { categorySummaries, formatPct, formatSek, freshFoodChainIndex, marketHeatmapTiles, matchedChainProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/chain-index');
}

const brandTierObservations = buildBrandTierPriceObservations();
const brandTierSummary = calculateBrandTierIndices(brandTierObservations);
const matchedBasketObservations = buildMatchedBasketChainPriceObservations();
const matchedBasketRefinedIndex = calculateChainPriceIndex([
  ...buildChainPriceObservations(),
  ...matchedBasketObservations
]);
const chainIndexTrendSeries = buildChainIndexTrendSeries();

const widgetSourceConfidence = matchedBasketRefinedIndex.chains.reduce(
  (summary, chain) => ({
    ...summary,
    [chain.confidence]: summary[chain.confidence] + 1
  }),
  { high: 0, medium: 0, low: 0 } as Record<'high' | 'medium' | 'low', number>
);

const groceryIndexTickerWidget = buildGroceryIndexTickerWidget(widgetSourceConfidence);

function tierTone(value: number) {
  if (value < 95) return 'text-emerald-800 bg-emerald-50';
  if (value > 105) return 'text-rose-800 bg-rose-50';
  return 'text-slate-800 bg-slate-50';
}

function confidenceLevelForCategoryCount(categoryCount: number): 'high' | 'medium' | 'low' {
  if (categoryCount >= 5) return 'high';
  if (categoryCount >= 2) return 'medium';
  return 'low';
}

const brandTierConfidenceLevel = brandTierSummary.indices.every((tier) => confidenceLevelForCategoryCount(tier.categoryCount) === 'high')
  ? 'high'
  : brandTierSummary.indices.some((tier) => tier.categoryCount > 0)
    ? 'medium'
    : 'low';

function heatTileTone(value: number) {
  if (value >= 80) return 'border-rose-200 bg-rose-50 text-rose-950';
  if (value >= 55) return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-emerald-200 bg-emerald-50 text-emerald-950';
}

export default function ChainIndexPage() {
  const willysWins = matchedChainProducts.filter((product) => product.lowestChain === 'willys').length;
  const hemkopWins = matchedChainProducts.filter((product) => product.lowestChain === 'hemkop').length;
  const averageSpread = matchedChainProducts.reduce((sum, product) => sum + product.spreadPct, 0) / matchedChainProducts.length;
  return (
    <PageShell>
      <Eyebrow>Chain index</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Willys/Hemköp matched-product index</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">The index is computed only from products with the same Axfood code in both chain catalogues. It does not mix unmatched SKUs or branch-location data.</p>
      <Link className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm" href="/methodology-changelog">
        View data and methodology changelog
      </Link>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm font-black text-slate-600">Matched products</p><p className="mt-2 text-4xl font-black text-emerald-800">{matchedChainProducts.length}</p></Card>
        <Card><p className="text-sm font-black text-slate-600">Average spread</p><p className="mt-2 text-4xl font-black text-emerald-800">{formatPct(averageSpread)}</p></Card>
        <Card><p className="text-sm font-black text-slate-600">Lowest-price wins</p><p className="mt-2 text-xl font-black text-slate-950">Willys {willysWins} · Hemköp {hemkopWins}</p></Card>
      </div>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>{chainIndexTrendSeries.sourceLabel}</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-indigo-950">Chain Price Index trend chart</h2>
            <p className="mt-3 text-sm leading-6 text-indigo-950">
              This chart replays dated campaign tape through calculateChainPriceIndex so Willys and Hemköp can be compared over time on the same 100-centred scale. No forecast is rendered and missing full-shelf history stays labelled as campaign coverage.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="rounded-2xl bg-white/80 p-4 text-sm font-black text-indigo-950">{chainIndexTrendSeries.chartWindowLabel}</p>
              <p className="rounded-2xl bg-white/80 p-4 text-sm font-black text-indigo-950">{chainIndexTrendSeries.coverageLabel}</p>
            </div>
          </div>
          <div className="grid gap-3">
            {chainIndexTrendSeries.series.map((series) => (
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm" data-chain-index-trend={series.chainId} key={series.chainId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-700">{series.chainId}</p>
                    <p className="mt-1 text-xs font-bold text-indigo-900">{series.coverageLabel} · latest {series.latestDate}</p>
                  </div>
                  <p className="text-3xl font-black text-indigo-950">{series.latestIndex.toFixed(1)}</p>
                </div>
                <p className="mt-2 text-sm font-black text-indigo-950">Movement from first campaign date: {series.movementFromFirst >= 0 ? '+' : ''}{series.movementFromFirst.toFixed(1)} index points</p>
                <div className="mt-4 space-y-2">
                  {series.points.map((point) => (
                    <div className="grid gap-2 text-xs font-bold text-indigo-950 sm:grid-cols-[7rem_1fr_7rem]" key={`${series.chainId}-${point.date}`}>
                      <span>{point.date}</span>
                      <span className="h-3 overflow-hidden rounded-full bg-indigo-100">
                        <span className="block h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(8, Math.min(100, point.value))}%` }} />
                      </span>
                      <span>{point.value.toFixed(1)} · {point.confidence}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ul className="mt-5 grid gap-3 text-sm font-bold leading-6 text-indigo-950 lg:grid-cols-3">
          {chainIndexTrendSeries.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white/80 p-3" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-slate-200 bg-white">
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Market heatmap</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Terminal heat across deals, spreads, liquidity, and movers</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              These heat tiles are derived from categoryDealLeaders, chainCategoryCoverage, openPriceObservationDepth, and priceDropMoversBoard. No forecast is rendered: the score is a normalized view of visible observed data and matched cross-chain rows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {marketHeatmapTiles.slice(0, 6).map((tile) => (
              <Link className={`rounded-2xl border p-4 hover:border-slate-500 ${heatTileTone(tile.heatScore)}`} href={tile.route} key={tile.id}>
                <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{tile.sourceSignal}</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="font-black">{tile.label}</p>
                  <p className="text-2xl font-black">{tile.heatScore.toFixed(0)}</p>
                </div>
                <p className="mt-2 text-sm font-black">{tile.metricLabel}</p>
                <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{tile.confidenceLabel}</p>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Matched basket refinement</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950">Refined matched-basket index</h2>
            <p className="mt-3 text-sm leading-6 text-blue-950">
              The chain index now calls calculateChainPriceIndex with the broad normalized feed plus buildMatchedBasketChainPriceObservations from cross-chain Axfood product matches. This keeps the 100-centred scale while raising confidence where Willys and Hemköp share exact matched basket rows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Matched rows</p>
              <p className="mt-2 text-4xl font-black text-blue-950">{matchedBasketObservations.length}</p>
              <p className="mt-2 text-sm font-semibold text-blue-900">Exact cross-chain observations added to the index input.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Generated from</p>
              <p className="mt-2 text-4xl font-black text-blue-950">{matchedBasketRefinedIndex.generatedFrom}</p>
              <p className="mt-2 text-sm font-semibold text-blue-900">Total observations after matched-basket refinement.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {matchedBasketRefinedIndex.chains.slice(0, 6).map((chain) => (
            <div className="rounded-2xl bg-white/80 p-4" key={chain.chainId}>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">{chain.chainId}</p>
              <p className="mt-2 text-3xl font-black text-blue-950">{chain.overallIndex.toFixed(1)}</p>
              <p className="mt-1 text-sm font-semibold text-blue-900">{chain.confidence} confidence · {chain.categoriesCovered} categories</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>Fresh food index</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-lime-950">Fresh-food staple basket index</h2>
            <p className="mt-3 text-sm leading-6 text-lime-950">
              This panel turns the commodity taxonomy STAPLE_BASKET into a per-chain fresh-food score using calculateChainPriceIndex. Rows are included only when is_staple is true and confidence-cleared unit prices are available as kr/kg, kr/l, or kr/st.
            </p>
            <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-lime-950">
              No forecast: this is a factual snapshot from observed commodity/alias unit prices, not a prediction or branch-stock claim.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Staple coverage</p>
              <p className="mt-2 text-3xl font-black text-lime-950">{freshFoodChainIndex.coverageLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Observations</p>
              <p className="mt-2 text-4xl font-black text-lime-950">{freshFoodChainIndex.observationCount}</p>
              <p className="mt-2 text-sm font-semibold text-lime-900">Minimum confidence {freshFoodChainIndex.minimumSourceConfidence}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Units</p>
              <p className="mt-2 text-2xl font-black text-lime-950">{freshFoodChainIndex.unitLabels.join(' · ')}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {freshFoodChainIndex.report.chains.slice(0, 6).map((chain) => (
            <div className="rounded-2xl bg-white/80 p-4" key={chain.chainId}>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-lime-700">{chain.chainId}</p>
              <p className="mt-2 text-4xl font-black text-lime-950">{chain.overallIndex.toFixed(1)}</p>
              <p className="mt-1 text-sm font-semibold text-lime-900">{chain.confidence} confidence · {chain.categoriesCovered} staple categories · {chain.observations} rows</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-black text-lime-950">Representative is_staple basket</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {freshFoodChainIndex.stapleBasket.slice(0, 18).map((commodity) => (
                <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-950" key={commodity.slug}>
                  {commodity.label} · kr/{commodity.comparableUnit}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-black text-lime-950">Confidence guardrails</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-lime-950">
              {freshFoodChainIndex.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-white">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>{groceryIndexTickerWidget.title}</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Publish the 100-centred price pulse</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Blogs, local newsrooms, and grocery roundups can embed the Grocery Index ticker as a compact iframe. It reuses the same calculateChainPriceIndex output, matched-basket observations, and confidence counts shown on this route.
            </p>
            <Link className="mt-4 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700" href={groceryIndexTickerWidget.route}>
              Open widget route
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">iframe embed code</p>
            <code className="mt-3 block whitespace-pre-wrap break-all rounded-xl bg-black/40 p-3 text-xs font-semibold leading-5 text-emerald-100">{groceryIndexTickerWidget.embedCode}</code>
            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-200 sm:grid-cols-3">
              <span>High {groceryIndexTickerWidget.sourceConfidence.high}</span>
              <span>Medium {groceryIndexTickerWidget.sourceConfidence.medium}</span>
              <span>Low {groceryIndexTickerWidget.sourceConfidence.low}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Brand-tier index</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">Budget vs premium basket pressure</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-950">
              This section calls calculateBrandTierIndices with buildBrandTierPriceObservations, so budget private-label, mid-market national, and premium tiers are compared by chain/category from real matched Axfood products instead of hardcoded ranking copy.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ConfidenceBadge
                label="real matched brand-tier basket"
                level={brandTierConfidenceLevel}
                sampleSize={brandTierObservations.length}
              />
              <ConfidenceBadge
                label={`${brandTierSummary.indices.length} tier indices`}
                level="medium"
                sampleSize={brandTierSummary.highestSavingsCategories.length}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Private-label savings</p>
              <p className="mt-2 text-4xl font-black text-emerald-950">{formatPct(brandTierSummary.privateLabelSavingsPercent)}</p>
              <p className="mt-2 text-sm font-semibold text-emerald-900">Average savings versus national-brand rows with matching categories.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Premium gap</p>
              <p className="mt-2 text-4xl font-black text-emerald-950">{formatPct(brandTierSummary.premiumGapPercent)}</p>
              <p className="mt-2 text-sm font-semibold text-emerald-900">Premium index gap versus the private-label basket average.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {brandTierSummary.highestSavingsCategories.map((category) => (
            <p className="rounded-2xl bg-white/80 p-4 text-sm font-black text-emerald-950" key={category}>{category}</p>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-2xl font-black">Brand-tier fixed basket</h2>
          <div className="mt-4 space-y-3">
            {brandTierSummary.indices.map((tier) => (
              <div className={`rounded-2xl p-4 ${tierTone(tier.value)}`} key={tier.brandTier}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black">{tier.label}</p>
                    <p className="mt-1 text-sm font-semibold">{tier.categoryCount} categories · movement {formatPct(tier.movementPercent)}</p>
                    <div className="mt-3">
                      <ConfidenceBadge
                        label="matched categories"
                        level={confidenceLevelForCategoryCount(tier.categoryCount)}
                        sampleSize={tier.categoryCount}
                      />
                    </div>
                  </div>
                  <p className="text-3xl font-black">{tier.value.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card><h2 className="text-2xl font-black">Category spread coverage</h2><div className="mt-4 space-y-3">{categorySummaries.slice(0, 12).map((category) => <Link className="grid grid-cols-[1fr_auto] rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/categories/${category.slug}`} key={category.slug}><span><strong>{category.label}</strong><br /><span className="text-sm text-slate-600">{category.chainRows} Axfood rows</span></span><span className="font-black text-emerald-800">{formatPct(category.strongestSpread)}</span></Link>)}</div></Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card><h2 className="text-2xl font-black">Largest matched spreads</h2><div className="mt-4 space-y-3">{matchedChainProducts.slice(0, 12).map((product) => <Link className="grid grid-cols-[1fr_auto] rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><span><strong>{product.name}</strong><br /><span className="text-sm text-slate-600">Lowest {product.lowestChain}: {formatSek(product.lowestPrice)}</span></span><span className="font-black text-emerald-800">{formatPct(product.spreadPct)}</span></Link>)}</div></Card>
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
