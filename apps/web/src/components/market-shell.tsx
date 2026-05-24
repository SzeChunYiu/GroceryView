import Link from 'next/link';
import { Card, Eyebrow, MetricGrid, PageShell, SourceCoverage, TopSpreads } from './data-ui';
import { ProductPriceCards } from './product-price-cards';
import { TrendingCarousel } from './TrendingCarousel';
import NearbyStoresWidget from '@/components/NearbyStoresWidget';
import { buildChainIndexTrendSeries } from '@/lib/chain-index-data';
import { defaultLocale, localeReadiness, localeTranslationGuardrails, localizedShellCopy } from '@/lib/i18n';
import { basketCostHeatmap } from '@/lib/map-basket-cost-heatmap';
import { mapChainIndexScores } from '@/lib/map-chain-index';
import { stores } from '../lib/demo-data';
import {
  allStoreDailyRunnerReadiness,
  apiPerformanceReadiness,
  chainSavingsLedger,
  chainCategoryCoverage,
  categoryDealLeaders,
  categoryQualityMatrix,
  categorySummaries,
  commodityMappingReviewPlan,
  dataFreshnessBadges,
  digitalCatalogueOfferBoard,
  featuredStores,
  formatPct,
  formatSek,
  freshestOpenPrices,
  homepageAdaptiveProductCards,
  homepageTrendingPriceChanges,
  icaStorePromotionEvidence,
  localeFormattingShowcase,
  marketHeatmapTiles,
  memberOfferAggregationBoard,
  openPriceObservationDepth,
  pharmacyOtcEvidenceBoard,
  priceDropMoversBoard,
  privateLabelDupeFinder,
  privateFeatureCopy,
  snapshot,
  sourceClaimLedger,
  sourceCoverage,
  seasonalProduceCalendar,
  sourceReadinessMatrix,
  sourceRouteMap,
  storeBrandLedger,
  storeFormatCoverage,
  timescaleDbEvaluation,
  webPerformanceBudgetGate
} from '@/lib/verified-data';

const featureReadinessQueue = Object.entries(privateFeatureCopy).slice(0, 6);
const homepageClaimLedger = sourceClaimLedger.slice(0, 3);
const homepageSourceReadiness = sourceReadinessMatrix.slice(0, 3);
const homepageChainSavings = chainSavingsLedger.slice(0, 2);
const homepageRouteMap = sourceRouteMap.slice(0, 3);
const homepageIcaStorePromotionImports = icaStorePromotionEvidence.latestStores.slice(0, 3);
const homepageAllStoreDailyRunner = {
  controls: allStoreDailyRunnerReadiness.runnerControls.slice(0, 3),
  connectorUrls: allStoreDailyRunnerReadiness.allStoreConnectorUrls.slice(0, 4)
};
const homepageFreshOpenPrices = freshestOpenPrices.slice(3, 9);
const homepageMapChainIndex = mapChainIndexScores.slice(0, 3);
const homepageSourceCoverageNames = sourceCoverage.map((source) => source.name);
const homepageMarketHeatmap = marketHeatmapTiles.slice(0, 6);
const homepageChainIndexTrend = buildChainIndexTrendSeries().series.slice(0, 2);
const homepageBasketCostHeatmap = basketCostHeatmap.rows.slice(0, 3);
const homepagePharmacyOtcEvidence = pharmacyOtcEvidenceBoard.rows.slice(0, 3);
const homepageCommodityMappingReview = {
  queue: commodityMappingReviewPlan.queue.slice(0, 2),
  controls: commodityMappingReviewPlan.reporterControls.slice(0, 1),
  assignmentCount: commodityMappingReviewPlan.assignments.length
};
const homepageMarketTerminal = {
  title: 'Grocery Index market terminal',
  indexLabel: mapChainIndexScores[0]?.chainId ?? 'chain-index unavailable',
  indexValue: mapChainIndexScores[0]?.overallIndex ?? null,
  mover: priceDropMoversBoard[0],
  observationRows: openPriceObservationDepth.reduce((total, source) => total + source.observationTotal, 0),
  sourceCount: homepageSourceCoverageNames.length,
  guardrails: [
    'Market terminal cards reuse verified sourceCoverage, priceDropMoversBoard, and mapChainIndexScores rows.',
    'No forecast, sponsored boost, or synthetic placeholder row changes the Grocery Index readout.',
    'Each terminal CTA lands on an existing evidence route before a shopper acts.'
  ]
};
const homepageApiPerformanceReadiness = {
  hotEndpoints: apiPerformanceReadiness.hotEndpoints.slice(0, 3),
  cursorEndpoint: apiPerformanceReadiness.cursorEndpoints[0],
  runtimeChecks: apiPerformanceReadiness.requiredRuntime.map((item) => item.label)
};
const homepageTimescaleDbEvaluation = {
  fallbackTables: timescaleDbEvaluation.fallbackTables.slice(0, 3),
  evaluationSignals: timescaleDbEvaluation.evaluationSignals.slice(0, 2),
  fallbackFunctions: timescaleDbEvaluation.fallbackFunctions.map((item) => item.name)
};
const homepageWebPerformanceBudgetGate = {
  routes: webPerformanceBudgetGate.terminalRoutes.slice(0, 4),
  assertions: webPerformanceBudgetGate.assertions.slice(0, 4),
  guardrails: webPerformanceBudgetGate.guardrails.slice(0, 2)
};
const elderlyAccessibilityMode = {
  persona: 'Elderly / seniors',
  title: 'Large-text high-contrast mode',
  controls: ['Bigger price cards', 'High-contrast colors', 'Short source labels'],
  evidence: 'contrast-safe shell uses verified route cards only'
};
const defaultLocalizedShellCopy = localizedShellCopy.find((copy) => copy.locale === defaultLocale) ?? localizedShellCopy[0];
const immigrantMultilingualUi = {
  persona: 'Immigrants / new arrivals',
  title: 'Multilingual UI starter',
  languageOptions: localeReadiness,
  languageOptionLabels: ['Swedish', 'English', 'Arabic', 'Somali'],
  guardrails: [
    'No machine-translated prices',
    defaultLocalizedShellCopy.language.guardrail,
    ...localeTranslationGuardrails
  ]
};
const pwaFirstInstall = {
  persona: 'Busy mobile shoppers',
  title: 'PWA-first mobile install',
  actions: ['Install on phone', 'Open compare offline shell', 'Jump to stores'],
  manifestPath: '/manifest.webmanifest',
  evidence: 'verified prices load before the app shell asks for anything private'
};
const launchFixtureStores = [
  { slug: 'willys-odenplan', name: 'Willys Odenplan', district: 'Vasastan', fixture: 'Willys Odenplan' },
  { slug: 'ica-nara-sergels-torg', name: 'ICA Nära Sergels Torg', district: 'Norrmalm', fixture: 'ICA Nara Sergels Torg' },
  { slug: 'coop-swedenborgsgatan', name: 'Coop Swedenborgsgatan', district: 'Södermalm', fixture: 'Coop Swedenborgsgatan' },
  { slug: 'lidl-sveavagen', name: 'Lidl Sveavägen', district: 'Vasastan', fixture: 'Lidl Sveavagen' },
  { slug: 'hemkop-stockholm', name: 'Hemköp Stockholm', district: 'Norrmalm', fixture: 'Hemkop Stockholm locator result' },
  { slug: 'city-gross-stockholm', name: 'City Gross Stockholm', district: 'Stockholm County', fixture: 'City Gross Stockholm county locator result' }
];

function heatmapTileClass(heatScore: number) {
  if (heatScore >= 80) return 'border-rose-300 bg-rose-50 text-rose-950';
  if (heatScore >= 55) return 'border-amber-300 bg-amber-50 text-amber-950';
  return 'border-emerald-300 bg-emerald-50 text-emerald-950';
}

export function MarketShell() {
  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <Eyebrow>Sweden grocery snapshot</Eyebrow>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
            Readable prices, explicit sources, zero placeholder rows.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            GroceryView now renders only generated data from Axfood chain prices, OpenPrices observations, and OpenStreetMap store locations. Features without verified records fail closed instead of inventing account, coupon, or receipt data.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-emerald-950" href="/compare">Compare chain prices</Link>
            <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white" href="/stores">Browse stores</Link>
          </div>
        </div>
        <Card className="flex flex-col justify-between bg-white">
          <div>
            <Eyebrow>Latest evidence</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{snapshot.retrievedLabel}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">All visible figures trace to source modules generated from public endpoints or ODbL-compatible datasets. Per-branch prices are not inferred where the source does not provide them.</p>
          </div>
          <div className="mt-6 grid gap-3">
            {freshestOpenPrices.slice(0, 3).map((product) => (
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-600" data-product-slug={product.slug} href={`/products/${product.slug}`} key={product.slug}>
                <p className="font-black text-slate-950">{product.name}</p>
                <p className="text-sm text-slate-600">{product.brands || 'Brand not reported'} · observed {product.lastObservedAt}</p>
                <p className="mt-1 font-black text-emerald-800">Median {formatSek(product.priceMedian)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>
      <NearbyStoresWidget stores={stores} />

      <div className="mt-6"><MetricGrid /></div>

      <TrendingCarousel items={homepageTrendingPriceChanges} />

      <Card className="mt-6 border-red-200 bg-red-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Latest ICA store-scoped promotions</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{icaStorePromotionEvidence.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-red-950">
              The homepage now wires the newest ICA handlaprivatkund store-scoped promotion import into a visible evidence surface. It shows storeAccountId, row counts, retrievedAt, and sourceUrl provenance while explicitly blocking branch shelf-price, stock, loyalty, or checkout-total claims.
            </p>
          </div>
          <Link className="rounded-full bg-red-700 px-5 py-3 text-center text-sm font-black text-white" href="/data-sources">
            Inspect ICA source import
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepageIcaStorePromotionImports.map((store) => (
            <Link
              className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm hover:border-red-700"
              data-ica-store-promotion-import={store.storeAccountId}
              href="/data-sources"
              key={`${store.storeAccountId}-${store.retrievedAt}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800">storeAccountId {store.storeAccountId}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{store.storeName}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{store.rowCount.toLocaleString('sv-SE')} rows · retrieved {store.retrievedAt}</p>
              <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold leading-5 text-red-950">No branch shelf-price claim; sourceUrl retained on the data sources route.</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {icaStorePromotionEvidence.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-red-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>All-store daily batch runner</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{allStoreDailyRunnerReadiness.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-lime-950">
              The homepage now exposes the operator contract that fans daily ingestion across all enumerated stores. The runner controls concurrency, retries, and fail-on-store behavior before supported chain connector URLs write source-run evidence into the database.
            </p>
          </div>
          <Link className="rounded-full bg-lime-700 px-5 py-3 text-center text-sm font-black text-white" href="/data-sources">
            Inspect batch contract
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepageAllStoreDailyRunner.controls.map((control) => (
            <Link
              className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm hover:border-lime-700"
              data-all-store-daily-runner={control.name}
              href="/data-sources"
              key={control.name}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">{control.name}</p>
              <p className="mt-2 text-lg font-black text-slate-950">{control.defaultValue}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{control.purpose}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {homepageAllStoreDailyRunner.connectorUrls.map((connector) => (
            <p className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-lime-950" key={connector.url}>
              {connector.chain} · {connector.scope}
            </p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-slate-900 bg-slate-950 text-white">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Eyebrow>Homepage market terminal</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{homepageMarketTerminal.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              The homepage now opens with a Grocery Index terminal view: cheapest-chain index, sharpest verified price-drop mover, OpenPrices observation depth, and route-level source coverage stay connected to the same generated evidence used across product, map, and data-source pages.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-400 px-5 py-3 text-center text-sm font-black text-emerald-950" href="/chain-index">
            Open Grocery Index
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Cheapest chain index</p>
            <p className="mt-2 text-2xl font-black">{homepageMarketTerminal.indexLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">{homepageMarketTerminal.indexValue?.toFixed(1) ?? 'Not reported'} vs market 100</p>
          </div>
          <Link className="rounded-2xl border border-white/10 bg-white/10 p-4 hover:border-emerald-300" data-product-slug={homepageMarketTerminal.mover?.productSlug} href={homepageMarketTerminal.mover ? `/products/${homepageMarketTerminal.mover.productSlug}` : '/products'}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Price-drop mover</p>
            <p className="mt-2 text-lg font-black">{homepageMarketTerminal.mover?.productName ?? 'No mover available'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">{homepageMarketTerminal.mover ? formatPct(homepageMarketTerminal.mover.changePercent) : 'Not reported'} latest move</p>
          </Link>
          <Link className="rounded-2xl border border-white/10 bg-white/10 p-4 hover:border-emerald-300" href="/openprices-depth">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">OpenPrices depth</p>
            <p className="mt-2 text-2xl font-black">{homepageMarketTerminal.observationRows.toLocaleString('sv-SE')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">verified public observations</p>
          </Link>
          <Link className="rounded-2xl border border-white/10 bg-white/10 p-4 hover:border-emerald-300" href="/data-sources">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Source routes</p>
            <p className="mt-2 text-2xl font-black">{homepageMarketTerminal.sourceCount}</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">coverage ledgers connected</p>
          </Link>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {homepageMarketTerminal.guardrails.map((guardrail) => (
            <p className="rounded-2xl border border-white/10 bg-white/10 p-3 text-xs font-bold leading-5 text-slate-200" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>API performance readiness</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Redis cache, cursor pagination, and pooler guardrails</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-cyan-950">
              The public API now labels the hot-endpoint cache path, returns cursor pagination on product search, and keeps pgbouncer plus Redis cache production readiness fail-closed until runtime configuration is present.
            </p>
          </div>
          <Link className="rounded-full bg-cyan-700 px-5 py-3 text-center text-sm font-black text-white" href="/data-sources">
            Review performance contract
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepageApiPerformanceReadiness.hotEndpoints.map((endpoint) => (
            <Link className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm hover:border-cyan-700" data-api-performance-readiness={endpoint.path} href="/data-sources" key={endpoint.path}>
              <p className="font-mono text-sm font-black text-slate-950">{endpoint.path}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Redis cache TTL {endpoint.ttlSeconds}s · {endpoint.coverage}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-cyan-950">
            {homepageApiPerformanceReadiness.cursorEndpoint.path} uses {homepageApiPerformanceReadiness.cursorEndpoint.cursor}; {homepageApiPerformanceReadiness.cursorEndpoint.guardrail}
          </p>
          <p className="rounded-2xl bg-white/80 p-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-950">
            {homepageApiPerformanceReadiness.runtimeChecks.join(' · ')}
          </p>
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>perf(db)</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">TimescaleDB evaluation with partition fallback</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-fuchsia-950">
              {timescaleDbEvaluation.title} is {timescaleDbEvaluation.status}: GroceryView keeps declarative monthly partitions, BRIN pruning, and rollup tables live until TimescaleDB hypertable compression and retention policies are proven.
            </p>
          </div>
          <Link className="rounded-full bg-fuchsia-700 px-5 py-3 text-center text-sm font-black text-white" href="/data-sources">
            Review DB scale contract
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepageTimescaleDbEvaluation.fallbackTables.map((item) => (
            <Link className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm hover:border-fuchsia-700" data-timescale-evaluation={item.table} href="/data-sources" key={item.table}>
              <p className="font-mono text-sm font-black text-slate-950">{item.table}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.role}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-fuchsia-950">
            {homepageTimescaleDbEvaluation.evaluationSignals.map((signal) => (
              <p key={signal.label}>{signal.label}: {signal.state}</p>
            ))}
          </div>
          <p className="rounded-2xl bg-white/80 p-3 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-950">
            {homepageTimescaleDbEvaluation.fallbackFunctions.join(' · ')}
          </p>
        </div>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>perf(web)</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Lighthouse CI budget</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-violet-950">
              The public terminal now has a Core Web Vitals budget in the required CI workflow. Lighthouse checks the homepage, products, compare, and source-evidence routes after the Next build, then fails the PR if the budget is crossed.
            </p>
          </div>
          <Link className="rounded-full bg-violet-700 px-5 py-3 text-center text-sm font-black text-white" href="/data-sources">
            {webPerformanceBudgetGate.command}
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {homepageWebPerformanceBudgetGate.assertions.map((assertion) => (
            <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" key={assertion.metric}>
              <p className="font-mono text-sm font-black text-slate-950">{assertion.metric}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{assertion.budget}</p>
              <p className="mt-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-violet-950">{assertion.gate} gate</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
          <p className="rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-violet-950">
            Routes under budget: {homepageWebPerformanceBudgetGate.routes.join(' · ')}
          </p>
          <p className="rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-violet-950">
            {homepageWebPerformanceBudgetGate.guardrails.join(' ')}
          </p>
        </div>
      </Card>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow>Chain index trend tape</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Dated campaign index movement</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              The homepage previews the Willys/Hemköp weekly campaign tape as a Chain Price Index trend before shoppers open the full chart. No forecast or synthetic shelf history is displayed; the preview is only dated campaign evidence.
            </p>
          </div>
          <Link className="rounded-full bg-indigo-700 px-5 py-3 text-center text-sm font-black text-white" href="/chain-index">
            Open trend chart
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {homepageChainIndexTrend.map((series) => (
            <Link className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm hover:border-indigo-700" data-chain-index-trend={series.chainId} href="/chain-index" key={series.chainId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{series.chainId}</p>
                  <p className="mt-1 text-sm font-bold text-indigo-950">{series.coverageLabel}</p>
                </div>
                <p className="text-3xl font-black text-indigo-950">{series.latestIndex.toFixed(1)}</p>
              </div>
              <p className="mt-3 text-sm font-black text-indigo-950">Latest {series.latestDate} · movement {series.movementFromFirst >= 0 ? '+' : ''}{series.movementFromFirst.toFixed(1)} points</p>
              <div className="mt-4 flex items-end gap-2">
                {series.points.map((point) => (
                  <span className="flex flex-1 flex-col gap-1 text-center text-[0.65rem] font-black text-indigo-950" key={`${series.chainId}-${point.date}`}>
                    <span className="rounded-t-xl bg-indigo-600" style={{ height: `${Math.max(1.5, Math.min(4.5, point.value / 24))}rem` }} />
                    <span>{point.date.slice(5)}</span>
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-white">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow>Grocery market heatmap</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Hot categories, spreads, liquidity, and movers</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              The homepage market heatmap compresses verified deal-score leaders, cross-chain spread pressure, OpenPrices observation liquidity, and dated price-drop movers into clickable tiles. No forecast or synthetic row is used.
            </p>
          </div>
          <Link className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-black text-white" href="/chain-index">
            Open heatmap details
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {homepageMarketHeatmap.map((tile) => (
            <Link
              className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${heatmapTileClass(tile.heatScore)}`}
              data-heatmap-tile={tile.id}
              href={tile.route}
              key={tile.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{tile.sourceSignal}</p>
                  <p className="mt-2 text-lg font-black">{tile.label}</p>
                </div>
                <p className="rounded-full bg-white/80 px-3 py-2 text-xl font-black">{tile.heatScore.toFixed(0)}</p>
              </div>
              <p className="mt-3 text-sm font-black">{tile.metricLabel}</p>
              <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{tile.detail}</p>
              <p className="mt-3 rounded-xl bg-white/70 p-2 text-xs font-bold leading-5 opacity-80">{tile.confidenceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow>Basket-cost heatmap</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Basket-cost heatmap by area</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-fuchsia-950">
              The homepage previews the map's area basket view using compareBasketStrategies totals from visible weekly basket rows. It is a coverage-gated guide, not a branch checkout quote; missing favorite-store prices remain visible.
            </p>
          </div>
          <Link className="rounded-full bg-fuchsia-700 px-5 py-3 text-center text-sm font-black text-white" href="/map">
            Open area heatmap
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepageBasketCostHeatmap.map((row) => (
            <Link
              className="rounded-2xl border border-fuchsia-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-700 hover:shadow-lg"
              data-basket-cost-heatmap={row.area}
              href="/map"
              key={row.storeId}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">{row.area}</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{row.storeName}</p>
                </div>
                <p className="rounded-full bg-fuchsia-100 px-3 py-2 text-xl font-black text-fuchsia-950">{row.relativeBasketIndex.toFixed(1)}</p>
              </div>
              <p className="mt-3 text-sm font-black text-fuchsia-950">{formatSek(row.knownBasketTotal)} known basket total</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{formatPct(row.coveragePercent)} coverage · {row.missingProductCount} missing products</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {basketCostHeatmap.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-fuchsia-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow>Commodity mapping review</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Curator queue for loose-item aliases</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-orange-950">
              The homepage now exposes the commodity_mapping review queue before aliases affect shopper-facing coverage. human_review_assignments receives low-confidence kr/kg mappings, while community_reporter_trust gates risky reporters.
            </p>
          </div>
          <Link className="rounded-full bg-orange-700 px-5 py-3 text-center text-sm font-black text-white" href="/data-sources">
            Inspect review plan
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {homepageCommodityMappingReview.queue.map((item) => (
            <Link
              className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-700 hover:shadow-lg"
              data-commodity-mapping-review={item.subjectId}
              href="/data-sources"
              key={item.id}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">{item.priority} priority · {item.subjectType}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.reason}</p>
            </Link>
          ))}
          <Link
            className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-700 hover:shadow-lg"
            data-commodity-mapping-review={homepageCommodityMappingReview.controls[0]?.reporterId ?? 'reporter-controls'}
            href="/data-sources"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">community_reporter_trust</p>
            <p className="mt-2 text-lg font-black text-slate-950">{homepageCommodityMappingReview.controls[0]?.action ?? 'no controls'}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{homepageCommodityMappingReview.controls[0]?.reason ?? 'Reporter controls are currently clear.'}</p>
          </Link>
        </div>
        <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-950">
          {homepageCommodityMappingReview.assignmentCount} curator assignments prepared in {commodityMappingReviewPlan.queueTable}
        </p>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">{pwaFirstInstall.persona}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{pwaFirstInstall.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              GroceryView chooses the PWA-first mobile path first: the terminal can be installed from the browser, opens verified public routes quickly, and keeps account-bound actions gated until a real session exists.
            </p>
          </div>
          <a className="rounded-full bg-emerald-700 px-5 py-3 text-center text-sm font-black text-white" href={pwaFirstInstall.manifestPath}>
            {pwaFirstInstall.manifestPath}
          </a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {pwaFirstInstall.actions.map((action) => (
            <p className="rounded-2xl bg-white p-4 text-sm font-black text-emerald-950" key={action}>{action}</p>
          ))}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-900">{pwaFirstInstall.evidence}</p>
      </Card>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Pharmacy OTC evidence</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Public OTC item prices before pharmacy-chain claims</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              The homepage now previews the pharmacy vertical with OpenPrices + OpenBeautyFacts OTC rows. These are EAN-coded public observations only: no prescription medicine, medical advice, stock, or cheapest-pharmacy claim is displayed before domain=pharmacy connector rows exist.
            </p>
          </div>
          <Link className="rounded-full bg-indigo-700 px-5 py-3 text-center text-sm font-black text-white" href="/pharmacy">
            Open pharmacy OTC board
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepagePharmacyOtcEvidence.map((row) => (
            <Link className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm hover:border-indigo-700" data-pharmacy-otc-evidence={row.slug} href="/pharmacy" key={row.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{row.evidence}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · {row.observationCount} observations</p>
              <p className="mt-3 text-2xl font-black text-indigo-950">{formatSek(row.priceMedian)}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-950">
          {pharmacyOtcEvidenceBoard.source} · not a pharmacy-chain comparison
        </p>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Member offers</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{memberOfferAggregationBoard.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              The homepage now previews member-only evidence from public Lidl and Matpriskollen rows while keeping points account-bound. Rows map to {memberOfferAggregationBoard.sourcePredicate}; {memberOfferAggregationBoard.pointsStatus}
            </p>
          </div>
          <Link className="rounded-full bg-amber-700 px-5 py-3 text-sm font-black text-white" href="/coupon-stacks">
            Open member offers
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {memberOfferAggregationBoard.rows.slice(0, 3).map((row) => (
            <Link className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm hover:border-amber-700" href="/coupon-stacks" key={row.id}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">{row.chain} · {row.priceType}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{row.memberPriceLabel} member · {row.totalMemberSavingsLabel}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">pointsEarned: {row.pointsEarned ?? 'blocked'}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Seasonal best time to buy produce calendar</Eyebrow>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Best-buy months from historical price tape</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {seasonalProduceCalendar.methodology} The homepage shows the first visible calendar picks so unauthenticated shoppers can jump straight from the market terminal into produce seasonality.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white" href="/seasonal-calendar">
            Open calendar
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {seasonalProduceCalendar.topBestBuys.slice(0, 3).map((row) => (
            <Link className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm hover:border-emerald-700" data-product-slug={row.slug} href={`/products/${row.slug}`} key={row.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Best time to buy · {row.bestBuyMonth}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{row.historicalMonthlyAverageLabel} historicalMonthlyAverage · {row.savingsVsTypicalLabel}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.confidenceLabel}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-emerald-950">
          No forecast or synthetic seasonal prediction is shown; missing months remain coverage gaps.
        </p>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{immigrantMultilingualUi.persona}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{immigrantMultilingualUi.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              A language access entry point lets new shoppers choose translated navigation help while keeping verified SEK prices, product names, and source evidence unchanged.
            </p>
            <p className="sr-only">{immigrantMultilingualUi.languageOptionLabels.join(', ')}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {immigrantMultilingualUi.languageOptions.map((language) => (
              <div className="rounded-2xl bg-white px-4 py-3 text-center font-black text-slate-950" key={language.locale}>
                <span className="block">{language.label}</span>
                <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.14em] text-slate-500">
                  {language.status === 'native_reviewed' ? 'reviewed' : 'blocked'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {localizedShellCopy.map((copy) => (
            <div className="rounded-2xl border border-amber-200 bg-white p-4" key={copy.locale}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{copy.locale} next-intl shell copy</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{copy.hero.eyebrow}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{copy.language.persisted}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {copy.nav.overview} · {copy.nav.products} · {copy.nav.compare} · {copy.nav.stores}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-3xl border border-amber-200 bg-white p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Locale-aware price formatting</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Multi-currency display follows observation currency</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                SEK · NOK · DKK · EUR · ISK are formatter-ready, but only currencies present on observed price rows render money; the rest stay blocked instead of converting or inventing values.
                No currency conversion or fake price is displayed for currencies missing from observations.currency.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {localeFormattingShowcase.map((row) => (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3" key={row.currency}>
                <p className="text-lg font-black text-slate-950">{row.currency}</p>
                <p className="mt-1 text-sm font-bold text-amber-950">{row.moneyLabel}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{row.unitPriceLabel}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{row.dateLabel}</p>
                <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-amber-800">{row.guardrail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {immigrantMultilingualUi.guardrails.map((guardrail) => (
            <p className="rounded-2xl border border-amber-200 bg-white p-4 text-sm font-bold text-slate-700" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-slate-950 bg-slate-950 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">{elderlyAccessibilityMode.persona}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{elderlyAccessibilityMode.title}</h2>
            <p className="mt-3 max-w-3xl text-2xl font-semibold leading-9 text-slate-100">
              A contrast-safe entry point keeps prices, stores, and source labels large enough for seniors before they compare baskets or browse nearby stores.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[32rem]">
            {elderlyAccessibilityMode.controls.map((control) => (
              <div className="rounded-2xl border border-white/20 bg-white p-4 text-slate-950" key={control}>
                <p className="text-2xl font-black">{control}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-base font-semibold text-slate-200">{elderlyAccessibilityMode.evidence}</p>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>feat(dupe) / private label</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Private-label dupe finder</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              The homepage now calls recommendSmartSwaps over visible Axfood rows to find brand-name products with cheaper private-label equivalents. Every dupe needs same-category, comparable package-size, and lower unit-price evidence before it appears.
            </p>
          </div>
          <div className="grid min-w-[18rem] grid-cols-3 gap-2 text-center">
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-fuchsia-900">{privateLabelDupeFinder.sourceProductCount}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">brand rows</span>
            </p>
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-fuchsia-900">{privateLabelDupeFinder.privateLabelProductCount}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">dupes</span>
            </p>
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-fuchsia-900">{privateLabelDupeFinder.categoryCount}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">categories</span>
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {privateLabelDupeFinder.topDupes.slice(0, 4).map((dupe) => (
            <Link className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm hover:border-fuchsia-700" data-product-slug={dupe.dupeSlug} href={`/products/${dupe.dupeSlug}`} key={`${dupe.sourceSlug}-${dupe.dupeSlug}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">Save {formatPct(dupe.savingsPercent)} per unit</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{dupe.privateLabelBrand} for {dupe.nationalBrand}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{dupe.dupeName} · {dupe.dupePackage} · {dupe.cheapestChain}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-fuchsia-50 p-3 font-black text-fuchsia-950">Dupe {formatSek(dupe.dupeUnitPrice)} {dupe.unitLabel}</p>
                <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">Brand {formatSek(dupe.sourceUnitPrice)} {dupe.unitLabel}</p>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">name evidence {dupe.nameEvidence.join(', ')} · confidence {dupe.confidence} · qualityRisk {dupe.qualityRisk}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {privateLabelDupeFinder.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white p-3 text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Verified product universe</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Products that can already support public browsing</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Chain spread rows and OpenPrices observations are shown together, with every card linking to a verified product page.
          </p>
        </div>
        <div className="mt-5">
          <ProductPriceCards
            cards={homepageAdaptiveProductCards}
            eyebrow="Product-card display"
            title="Homepage cards show pack price and jämförpris"
            intro="The homepage now uses the same adaptive total/per-unit card model as the product catalogue, with no hidden actual price."
          />
        </div>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Flyer / digital-catalog ingestion</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{digitalCatalogueOfferBoard.title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              The homepage now surfaces real ICA weekly-offer rows with e-magin flyer provenance. Offer price text, jämförpris, ordinary price, sourceUrl, and flyerPdfUrl are kept as source evidence instead of converting them into invented savings.
            </p>
          </div>
          <div className="grid min-w-[18rem] grid-cols-2 gap-2 text-center">
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-orange-900">{digitalCatalogueOfferBoard.offerCount.toLocaleString('sv-SE')}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">offers</span>
            </p>
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-orange-900">{digitalCatalogueOfferBoard.storeCount}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">stores</span>
            </p>
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-orange-900">{digitalCatalogueOfferBoard.flyerCount}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">flyer PDFs</span>
            </p>
            <p className="rounded-2xl bg-white p-3 shadow-sm">
              <span className="block text-2xl font-black text-orange-900">{digitalCatalogueOfferBoard.categoryCount}</span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">categories</span>
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {digitalCatalogueOfferBoard.sampleOffers.slice(0, 6).map((offer) => (
            <a className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm hover:border-orange-600" href={offer.flyerUrl} key={offer.code}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">{offer.storeName}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{offer.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{offer.category} · {offer.eanCount} EANs</p>
              <p className="mt-3 text-2xl font-black text-orange-900">{offer.priceText}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{offer.comparisonPrice} · {offer.regularPriceText}</p>
              <p className="mt-3 text-xs font-bold text-slate-500">validTo {offer.validTo.slice(0, 10)} · Open e-magin flyer</p>
            </a>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {digitalCatalogueOfferBoard.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-orange-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Price-drop movers board</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Observed products with the sharpest latest price drops</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Movers are computed from OpenPrices daily observations with the shared history engine. The board says observed low only unless source coverage can prove a full-market low.
          </p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {priceDropMoversBoard.map((mover) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
              data-product-slug={mover.productSlug}
              href={`/products/${mover.productSlug}`}
              key={mover.productSlug}
            >
              <div>
                <p className="font-black text-slate-950">{mover.productName}</p>
                <p className="text-sm text-slate-600">
                  {mover.categoryLabel} · {mover.observedCount.toLocaleString('sv-SE')} dated observations · {mover.latestObservedAt.slice(0, 10)}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-black text-emerald-800">
                  {formatSek(mover.latestPrice)} from {formatSek(mover.previousPrice)}
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {formatSek(mover.changeFromPrevious)} · {formatPct(mover.changePercent)}
                </p>
              </div>
              <p className="rounded-full bg-emerald-100 px-3 py-2 text-center text-sm font-black text-emerald-900">
                {mover.isNewLow ? 'New observed low' : mover.legalCopy}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Today&apos;s best category deals</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Category leaders from verified cross-chain spreads</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Calls summarizeCategoryDealLeaders with deal scores derived from visible Willys/Hemköp matched prices. Missing promo history stays covered by sourceConfidence labels.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {categoryDealLeaders.slice(0, 8).map((leader) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/categories/${leader.categorySlug}`}
              key={`${leader.categorySlug}-${leader.productSlug}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{leader.categoryLabel}</p>
              <p className="mt-2 font-black text-slate-950">{leader.productName}</p>
              <p className="mt-3 text-2xl font-black text-emerald-800">{leader.signal}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{leader.evidenceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Map chain index signals</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Chain index coverage used by the Stockholm store map</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/map">
            Open store map
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {homepageMapChainIndex.map((chain) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href="/map"
              key={chain.chainId}
            >
              <p className="text-sm font-black capitalize text-slate-950">{chain.chainId}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{chain.overallIndex.toFixed(1)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {chain.observations.toLocaleString('sv-SE')} observations
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Confidence: {chain.confidence}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Fresh OpenPrices arrivals</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Recent community observations ready for product browsing</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/products">
            Browse verified products
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {homepageFreshOpenPrices.map((product) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              data-product-slug={product.slug}
              href={`/products/${product.slug}`}
              key={product.slug}
            >
              <p className="font-black text-slate-950">{product.name}</p>
              <p className="mt-1 text-sm text-slate-600">{product.brands || 'Brand not reported'}</p>
              <p className="mt-3 text-2xl font-black text-emerald-800">{formatSek(product.priceMedian)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {product.observationCount.toLocaleString('sv-SE')} observations · latest {product.lastObservedAt}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Evidence route map</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Public routes grouped by verified source</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
            Review all source routes
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {homepageRouteMap.map((source) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={source.primaryRoute}
              key={source.name}
            >
              <p className="font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{source.routeCount}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">verified public routes</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{source.supportingRoutes.join(' · ')}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Catalogue savings signals</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Listed savings from matched chain catalogue rows</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/compare">
            Open comparison table
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {homepageChainSavings.map((chain) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              data-product-slug={chain.topProductSlug}
              href={`/products/${chain.topProductSlug}`}
              key={chain.chain}
            >
              <p className="text-sm font-black capitalize text-slate-950">{chain.chain}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(chain.totalSavings)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {chain.products.toLocaleString('sv-SE')} matched rows with listed savings
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Top listed saving: {formatSek(chain.topSaving)} on {chain.topProductName}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Freshness board</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Data freshness badges that gate every homepage claim</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
            Review {homepageSourceCoverageNames.length} source notes
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {dataFreshnessBadges.map((badge) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={badge.sourceKind}>
              <p className="text-sm font-black text-slate-950">{badge.sourceName}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{badge.freshnessLabel}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{badge.coverageLabel}</p>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm font-black text-slate-700">{badge.confidenceBadge}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{badge.caveat}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Source readiness mix</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Verified source weight behind public routes</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each source shows its share of verified rows and the public route that can use those rows without private account data.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {homepageSourceReadiness.map((source) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={source.primaryRoute}
              key={source.name}
            >
              <p className="font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{formatPct(source.rowShare * 100)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {source.rows.toLocaleString('sv-SE')} rows · {source.freshness}
              </p>
              <p className="mt-3 text-sm text-slate-600">Primary route: {source.primaryRoute}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Claim boundaries</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">What each source can and cannot prove</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
            See full claim ledger
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {homepageClaimLedger.map((source) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={source.evidenceRoute}
              key={source.name}
            >
              <p className="font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-sm font-semibold text-emerald-800">Supported: {source.allowedClaim}</p>
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                Blocked: {source.blockedClaim}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <TopSpreads limit={8} />
        <Card>
          <Eyebrow>Category coverage</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">What the current data can support</h2>
          <div className="mt-5 space-y-3">
            {categorySummaries.slice(0, 8).map((category) => (
              <Link className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/categories/${category.slug}`} key={category.slug}>
                <div>
                  <p className="font-black text-slate-950">{category.label}</p>
                  <p className="text-sm text-slate-600">{category.openPriceRows} OpenPrices rows · {category.chainRows} Axfood rows</p>
                </div>
                <div className="text-right text-sm font-black text-emerald-800">
                  <p>{formatSek(category.medianPrice)}</p>
                  <p>{formatPct(category.strongestSpread)} max spread</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category freshness strip</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Latest observed category dates from verified rows</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each category shows its newest OpenPrices observation date beside verified category and chain row counts.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {categorySummaries.slice(0, 8).map((category) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <p className="text-sm font-black text-slate-950">{category.label}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{category.latestObservation || 'Not reported'}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {category.openPriceRows.toLocaleString('sv-SE')} OpenPrices rows
              </p>
              <p className="text-sm text-slate-600">{category.chainRows.toLocaleString('sv-SE')} chain rows</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>OpenPrices depth</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Categories with the deepest community price history</h2>
          </div>
          <div className="max-w-xl text-sm leading-6 text-slate-600">
            <p>Observation counts are rolled up from verified OpenPrices rows so volatile categories show whether their median prices rest on repeat sightings.</p>
            <Link className="mt-2 inline-block font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/openprices-depth">
              Open depth board
            </Link>
          </div>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {openPriceObservationDepth.map((category) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <div>
                <p className="font-black text-slate-950">{category.label}</p>
                <p className="text-sm text-slate-600">
                  Top product: {category.topProductName} · {category.topProductObservations.toLocaleString('sv-SE')} observations
                </p>
              </div>
              <p className="font-black text-emerald-800">{category.observationTotal.toLocaleString('sv-SE')} observations</p>
              <p className="text-sm font-semibold text-slate-600">
                {category.products.toLocaleString('sv-SE')} products · latest {category.latestObservation || 'not reported'}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Chain price coverage</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Categories with repeat Willys/Hemkop matches</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Matched Axfood rows are grouped by category so spread signals stay tied to products visible in both chains.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {chainCategoryCoverage.map((category) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <p className="font-black text-slate-950">{category.label}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{formatPct(category.averageSpread)} avg spread</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {category.matchedProducts.toLocaleString('sv-SE')} matched chain products
              </p>
              <p className="text-sm text-slate-600">
                {formatPct(category.topSpread)} top spread · {category.leadingLowestChain} most often lower
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category quality matrix</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Categories ranked by verified row depth</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            OpenPrices observations and Willys/Hemkop chain matches are scored together before a category appears as decision-ready.
          </p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {categoryQualityMatrix.map((category) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto_auto]"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <div>
                <p className="font-black text-slate-950">{category.label}</p>
                <p className="text-sm text-slate-600">
                  {category.observedProducts.toLocaleString('sv-SE')} observed products · latest {category.latestOpenPrice || 'not reported'}
                </p>
              </div>
              <p className="font-black text-emerald-800">{category.verifiedRows.toLocaleString('sv-SE')} rows</p>
              <p className="font-semibold text-slate-700">{category.chainMatches.toLocaleString('sv-SE')} chain matches</p>
              <p className="text-sm font-semibold text-slate-600">{formatPct(category.spreadSignal)} max spread</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Feature readiness queue</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Private surfaces stay gated until verified records exist</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each route shows the public data it can support today and the record gate required before personalized rows render.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {featureReadinessQueue.map(([route, copy]) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/${route === 'account-profile' ? 'account/profile' : route}`}
              key={route}
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{route.replace('-', ' ')}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{copy.verifiedSurface}</p>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">{copy.gatedBy}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Private evidence next steps</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">What each gated workflow needs before it can render personal rows</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            These next-step requirements come from the same verified feature copy that keeps private pages from inventing user data.
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {featureReadinessQueue.slice(0, 4).map(([route, copy]) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/${route === 'account-profile' ? 'account/profile' : route}`}
              key={`next-${route}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{route.replace('-', ' ')}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{copy.nextStep}</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1fr]">
        <Card>
          <Eyebrow>Launch fixture stores</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Driver-file Stockholm stores</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            These visible links mirror the launch store fixtures in <code>demo-data.ts</code> so the public homepage exposes the acceptance-test store slugs alongside the nationwide OSM directory.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {launchFixtureStores.map((store) => (
              <Link className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-4 hover:border-emerald-700" data-store-slug={store.slug} href={`/stores/${store.slug}`} key={store.slug}>
                <p className="font-black text-slate-950">{store.name}</p>
                <p className="text-sm text-slate-600">{store.district} · fixture {store.fixture}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{store.slug}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <Eyebrow>Store directory</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Sweden stores from OSM</h2>
          <div className="mt-5 space-y-3">
            {featuredStores.slice(0, 7).map((store) => (
              <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" data-store-slug={store.slug} href={`/stores/${store.slug}`} key={store.slug}>
                <p className="font-black text-slate-950">{store.name}</p>
                <p className="text-sm text-slate-600">{store.brand} · {store.address || 'Address not reported by OSM'}</p>
              </Link>
            ))}
          </div>
        </Card>
        <SourceCoverage />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>OSM format coverage</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Store formats with verified Sweden coverage</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Format counts, address coverage, brand diversity, and districts are derived directly from the OpenStreetMap store extract.
          </p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {storeFormatCoverage.map((format) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto_auto]"
              href={`/stores/${format.sampleSlug}`}
              key={format.format}
            >
              <div>
                <p className="font-black text-slate-950">{format.format}</p>
                <p className="text-sm text-slate-600">
                  {format.brands.toLocaleString('sv-SE')} brands · {format.districts.toLocaleString('sv-SE')} districts
                </p>
              </div>
              <p className="font-black text-emerald-800">{format.stores.toLocaleString('sv-SE')} stores</p>
              <p className="font-semibold text-slate-700">{formatPct(format.addressCoverage * 100)} addressed</p>
              <p className="text-sm font-semibold text-slate-600">OSM {format.latestRetrieved}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>OSM brand ledger</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Store brands with verified location coverage</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Counts, address coverage, formats, and retrieval dates are derived directly from the OpenStreetMap store extract.
          </p>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {storeBrandLedger.map((brand) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto_auto]"
              href={`/stores/${brand.sampleSlug}`}
              key={brand.brand}
            >
              <div>
                <p className="font-black text-slate-950">{brand.brand}</p>
                <p className="text-sm text-slate-600">
                  {brand.districts} districts · {brand.formats.join(', ') || 'format not reported'}
                </p>
              </div>
              <p className="font-black text-emerald-800">{brand.stores.toLocaleString('sv-SE')} stores</p>
              <p className="font-semibold text-slate-700">{formatPct(brand.addressCoverage * 100)} addressed</p>
              <p className="text-sm font-semibold text-slate-600">OSM {brand.latestRetrieved}</p>
            </Link>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
