import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { COMPARE_CHAIN_ORDER, buildChainComparisonTable } from '@/lib/chain-compare';
import { defaultLocale, formatLocalizedUnitPrice } from '@/lib/i18n';
import { browserExtensionOverlayContract, budgetLowestPriceRadar, chainPriceRows, chainSavingsLedger, commodityComparisons, compareOverlayChart, formatPct, formatSek, matchedChainProducts, privateLabelDupeFinder } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/compare');
}

function formatComparableUnitPrice(value: number | null | undefined, unitLabel: string | null | undefined) {
  return formatLocalizedUnitPrice(value, {
    locale: defaultLocale,
    currency: 'SEK',
    unit: unitLabel?.replace(/^kr\//, '') ?? null
  });
}

type SearchParams = {
  products?: string | string[];
};

export default async function ComparePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const productsParam = resolvedSearchParams.products;
  const comparison = buildChainComparisonTable(productsParam);

  return (
    <PageShell>
      <Eyebrow>Willys vs Hemköp</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Comparable chain prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Rows appear only when the same Axfood product code is present in both chain catalogues. Savings are not shown across unmatched products.</p>
      <Card className="mt-6 overflow-hidden border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-sky-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">?products=id1,id2</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Chain comparison table</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Enter product slugs or retailer product ids in the query string to compare side-by-side prices across ICA, Willys, and Coop.
              The table uses packages/db snapshot rows when production exports are present and marks missing chain rows explicitly.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white shadow-sm" href="/compare?products=makaroner-pasta-101302991-st,havregryn-extra-fylliga-101758934-st">
            Try sample products
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">Side-by-side product prices across ICA, Willys, and Coop</caption>
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 font-black">Product</th>
                {COMPARE_CHAIN_ORDER.map((chain) => (
                  <th className="px-4 py-3 font-black" key={chain.id}>{chain.label}</th>
                ))}
                <th className="px-4 py-3 font-black">Best chain</th>
              </tr>
            </thead>
            <tbody>
              {comparison.products.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 font-semibold text-slate-600" colSpan={COMPARE_CHAIN_ORDER.length + 2}>
                    Add ?products=product-slug-1,product-slug-2 to render DB-backed comparison rows. Missing product ids: {comparison.missingProductIds.join(', ') || 'none yet'}.
                  </td>
                </tr>
              ) : null}
              {comparison.products.map((product) => (
                <tr className="border-t border-slate-100 align-top" key={product.productSlug}>
                  <th className="px-4 py-4 font-black text-slate-950">
                    <Link className="underline decoration-emerald-300 underline-offset-4" href={`/products/${product.productSlug}`}>{product.productName}</Link>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'} · {product.packageLabel}</span>
                  </th>
                  {product.cells.map((cell) => (
                    <td className="px-4 py-4" key={`${product.productSlug}-${cell.chainId}`}>
                      <p className={cell.status === 'priced' ? 'font-black text-emerald-900' : 'font-black text-slate-400'}>{cell.priceText}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{cell.unitLabel}</p>
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <p className="rounded-2xl bg-emerald-50 px-3 py-2 font-black text-emerald-950">{product.bestChainName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{product.bestPriceText}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {comparison.missingProductIds.length > 0 ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950">
            Missing product ids: {comparison.missingProductIds.join(', ')}. The compare route does not infer products from names.
          </p>
        ) : null}
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Source: {comparison.sourceLabel}{comparison.generatedAt ? ` · generated ${comparison.generatedAt}` : ''}.
        </p>
      </Card>
      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Catalogue savings ledger</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Listed savings are aggregated only from matched Willys/Hemkop catalogue rows that expose a numeric saving.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/data-sources">
            Check source caveats
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {chainSavingsLedger.map((chain) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700"
              href={`/products/${chain.topProductSlug}`}
              key={chain.chain}
            >
              <p className="text-sm font-black capitalize text-slate-950">{chain.chain}</p>
              <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(chain.totalSavings)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {chain.products.toLocaleString('sv-SE')} rows with listed savings · avg {formatSek(chain.averageSaving)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Top listed saving: {formatSek(chain.topSaving)} on {chain.topProductName}
              </p>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-6 overflow-hidden border-indigo-200 bg-indigo-50/80">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">TradingView-style compare</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Compare-overlay chart</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Calls buildPriceChartSeries over two real OpenPrices product tapes, then overlays the dated SEK observations so shoppers can compare product tickers without filling missing days.
              {` ${compareOverlayChart.guardrail}`}
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-right text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">{compareOverlayChart.title}</p>
            <p className="mt-2 text-3xl font-black">{compareOverlayChart.overlaySeries.length} overlaySeries</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{compareOverlayChart.coverageLabel}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {compareOverlayChart.overlaySeries.map((series) => {
            const values = series.sparklinePoints.map((point) => point.value);
            const low = values.length ? Math.min(...values) : 0;
            const high = values.length ? Math.max(...values) : 0;
            return (
              <Link className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-700" href={`/products/${series.productSlug}`} key={series.id}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">{series.sourceType} · lineStyle {series.lineStyle}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{series.productName}</h3>
                <div className="mt-4 flex h-20 items-end gap-1 rounded-2xl bg-indigo-50 p-3" aria-label={`${series.productName} compare overlay sparkline`}>
                  {series.sparklinePoints.map((point) => {
                    const height = high > low ? 18 + ((point.value - low) / (high - low)) * 56 : 42;
                    return (
                      <span
                        className="flex-1 rounded-t-full bg-indigo-700"
                        key={`${series.id}-${point.time}-${point.value}`}
                        style={{ height: `${height}px` }}
                        title={`${point.time.slice(0, 10)} · ${formatSek(point.value)}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <p className="rounded-xl bg-indigo-50 p-3 font-black text-indigo-950">Latest {formatSek(series.latestPrice)}</p>
                  <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">Move {formatPct(series.movementPercent)}</p>
                  <p className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-950">Low {formatSek(series.lowPrice)}</p>
                  <p className="rounded-xl bg-rose-50 p-3 font-black text-rose-950">High {formatSek(series.highPrice)}</p>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {series.pointCount} dated points · {series.markerCount} source markers · {series.provenanceLabel}
                </p>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl bg-white/85 p-4 text-xs font-semibold leading-5 text-slate-600">{compareOverlayChart.confidenceLabel} No forecast or interpolated price is rendered.</p>
      </Card>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Budget-conscious / cross-chain</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Lowest price anywhere radar</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Highlights the cheapestChain for each exact matched product code and shows the priceGap to the priciest matched chain.
              No branch-level discounts are inferred; every row links to the verifiedProductSlug evidence.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm">{budgetLowestPriceRadar.length} matched products</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {budgetLowestPriceRadar.map((item) => (
            <Link className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={`/products/${item.verifiedProductSlug}`} key={item.verifiedProductSlug}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{item.cheapestChain}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{item.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.reportedBrand}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-950">Cheapest {formatSek(item.cheapestPrice)}</p>
                <p className="rounded-xl bg-rose-50 p-3 font-black text-rose-950">Gap {formatSek(item.priceGap)}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{item.evidenceLabel} · {formatPct(item.spreadPct)}</p>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-800">feat(dupe) / private label</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{privateLabelDupeFinder.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              No brand-name row is paired with a private label unless recommendSmartSwaps clears same-category, package-size, lower unit-price, and private-label preference checks. The board shows dupes, not ingredient identity claims.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-fuchsia-900 shadow-sm">{privateLabelDupeFinder.topDupes.length} verified dupes</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {privateLabelDupeFinder.topDupes.map((dupe) => (
            <Link className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-700" href={`/products/${dupe.dupeSlug}`} key={`${dupe.sourceSlug}-${dupe.dupeSlug}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-800">{dupe.privateLabelTier.replaceAll('_', ' ')}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{dupe.privateLabelBrand} dupe for {dupe.nationalBrand}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{dupe.sourceName} → {dupe.dupeName}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-fuchsia-50 p-3 font-black text-fuchsia-950">Save {formatPct(dupe.savingsPercent)}</p>
                <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">{formatComparableUnitPrice(dupe.dupeUnitPrice, dupe.unitLabel)}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">name evidence {dupe.nameEvidence.join(', ')} · confidence {dupe.confidence} · {dupe.reason}</p>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-6 border-lime-200 bg-lime-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-800">feat(commodity)</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Cross-chain commodity comparison</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Calls compareCommodityUnitPrices over canonical commodity/alias match rows, then ranks each chain by comparable kr/{commodityComparisons[0]?.comparableUnit ?? 'kg'} evidence. Pack prices and barcode-only matches do not enter this board.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-lime-900 shadow-sm">{commodityComparisons.length} priced commodities</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {commodityComparisons.slice(0, 6).map((comparison) => (
            <Link className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-700" href={`/products/${comparison.cheapestChain?.productId}`} key={comparison.commodityId}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-800">{comparison.commodityName} · kr/{comparison.comparableUnit}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{comparison.cheapestChain?.chainName ?? 'Coverage blocked'}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{comparison.cheapestChain?.productName ?? 'No chain clears coverage'}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-lime-50 p-3 font-black text-lime-950">Cheapest {formatComparableUnitPrice(comparison.cheapestChain?.unitPrice, comparison.comparableUnit)}</p>
                <p className="rounded-xl bg-white p-3 font-black text-slate-950">{formatPct(comparison.cheapestChain?.savingsVsNextPercent)} vs next</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{comparison.confidenceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Steal-list / acquisition</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Retailer browser overlay</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              GroceryView can now run as an inline retailer overlay: mapped product tiles declare
              <code className="mx-1 rounded bg-white px-1 font-black" data-groceryview-product-id="coffee">data-groceryview-product-id</code>
              and the public script calls the cheapest-now API before showing a cheaper chain. No anonymous shopper profile or retailer account data is stored.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <a className="rounded-full bg-white px-4 py-2 font-black text-sky-950" href={browserExtensionOverlayContract.manifestPath}>
                Extension manifest
              </a>
              <a className="rounded-full bg-sky-900 px-4 py-2 font-black text-white" href={browserExtensionOverlayContract.assetPath}>
                Open overlay script
              </a>
              <code className="rounded-full bg-white px-4 py-2 font-black text-sky-950">{browserExtensionOverlayContract.apiEndpoint}</code>
            </div>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Supported retailer host patterns</p>
            <div className="mt-3 grid gap-2">
              {browserExtensionOverlayContract.supportedRetailers.map((retailer) => (
                <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700" key={retailer.hostPattern}>
                  <span className="font-black text-slate-950">{retailer.chain}</span> · {retailer.hostPattern} · {retailer.status}
                </p>
              ))}
            </div>
            <p className="mt-3 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-950">
              Confidence: {browserExtensionOverlayContract.confidenceRule}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Detection: {browserExtensionOverlayContract.detectionSignals.join(' · ')}
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-6 space-y-4">
        {matchedChainProducts.slice(0, 40).map((product) => (
          <Card key={product.slug}>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
              <div>
                <Link className="text-xl font-black text-slate-950 hover:text-emerald-800" href={`/products/${product.slug}`}>{product.name}</Link>
                <p className="text-sm text-slate-600">{product.brand} · {product.subline}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {chainPriceRows(product).map((row) => <p className="rounded-2xl bg-slate-50 p-3 font-black capitalize" key={row.chain}>{row.chain}: {formatSek(row.price)}</p>)}
              </div>
              <p className="rounded-full bg-emerald-100 px-4 py-2 text-center font-black text-emerald-950">{formatPct(product.spreadPct)}</p>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
