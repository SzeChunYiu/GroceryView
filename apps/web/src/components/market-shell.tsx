import Link from 'next/link';
import { Card, Eyebrow, MetricGrid, PageShell, SourceCoverage, TopSpreads } from './data-ui';
import { ProductPriceCards } from './product-price-cards';
import { mapChainIndexScores } from '@/lib/map-chain-index';
import {
  chainSavingsLedger,
  chainCategoryCoverage,
  categoryDealLeaders,
  categoryQualityMatrix,
  categorySummaries,
  dataFreshnessBadges,
  featuredStores,
  formatPct,
  formatSek,
  freshestOpenPrices,
  homepageAdaptiveProductCards,
  openPriceObservationDepth,
  priceDropMoversBoard,
  privateFeatureCopy,
  snapshot,
  sourceClaimLedger,
  sourceCoverage,
  sourceReadinessMatrix,
  sourceRouteMap,
  storeBrandLedger,
  storeFormatCoverage
} from '@/lib/verified-data';

const featureReadinessQueue = Object.entries(privateFeatureCopy).slice(0, 6);
const homepageClaimLedger = sourceClaimLedger.slice(0, 3);
const homepageSourceReadiness = sourceReadinessMatrix.slice(0, 3);
const homepageChainSavings = chainSavingsLedger.slice(0, 2);
const homepageRouteMap = sourceRouteMap.slice(0, 3);
const homepageFreshOpenPrices = freshestOpenPrices.slice(3, 9);
const homepageMapChainIndex = mapChainIndexScores.slice(0, 3);
const homepageSourceCoverageNames = sourceCoverage.map((source) => source.name);
const elderlyAccessibilityMode = {
  persona: 'Elderly / seniors',
  title: 'Large-text high-contrast mode',
  controls: ['Bigger price cards', 'High-contrast colors', 'Short source labels'],
  evidence: 'contrast-safe shell uses verified route cards only'
};
const immigrantMultilingualUi = {
  persona: 'Immigrants / new arrivals',
  title: 'Multilingual UI starter',
  languageOptions: ['Swedish', 'English', 'Arabic', 'Somali'],
  guardrails: ['Verified prices stay numeric', 'No machine-translated prices', 'Source labels remain visible']
};

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
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-600" href={`/products/${product.slug}`} key={product.slug}>
                <p className="font-black text-slate-950">{product.name}</p>
                <p className="text-sm text-slate-600">{product.brands || 'Brand not reported'} · observed {product.lastObservedAt}</p>
                <p className="mt-1 font-black text-emerald-800">Median {formatSek(product.priceMedian)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <div className="mt-6"><MetricGrid /></div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{immigrantMultilingualUi.persona}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{immigrantMultilingualUi.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              A language access entry point lets new shoppers choose translated navigation help while keeping verified SEK prices, product names, and source evidence unchanged.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {immigrantMultilingualUi.languageOptions.map((language) => (
              <div className="rounded-2xl bg-white px-4 py-3 text-center font-black text-slate-950" key={language}>
                {language}
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
          <Eyebrow>Store directory</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Sweden stores from OSM</h2>
          <div className="mt-5 space-y-3">
            {featuredStores.slice(0, 7).map((store) => (
              <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}>
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
