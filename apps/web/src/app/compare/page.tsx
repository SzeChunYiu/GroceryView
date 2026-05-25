import Link from 'next/link';
import { BasketComparisonPrint } from '@/components/basket-comparison-print';
import { ChainSelector } from '@/components/chain-selector';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { FunnelStepBeacon } from '@/components/funnel-step-beacon';
import { PriceChartTerminal, type PriceChartTerminalModel, type PriceChartTerminalWindow } from '@/components/price-chart-terminal';
import { SavedViewActions } from '@/components/saved-view-actions';
import { StoreComparisonTable } from '@/components/StoreComparisonTable';
import { StorePriceMatrix } from '@/components/store-price-matrix';
import { COMPARE_CHAIN_ORDER, buildBasketStoreComparison, buildChainComparisonTable, parseCompareChainsParam } from '@/lib/chain-compare';
import { fetchComparePriceSnapshots, type ComparePriceSnapshotStoreRow } from '@/lib/compare-price-snapshots';
import { defaultLocale, formatLocalizedUnitPrice } from '@/lib/i18n';
import { browserExtensionOverlayContract, budgetLowestPriceRadar, chainPriceRows, chainSavingsLedger, commodityComparisons, compareOverlayChart, formatPct, formatSek, matchedChainProducts, normalizeComparableUnitPrice, privateLabelDupeFinder, snapshot } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { buildStoreDistanceCompare } from '@/lib/store-distance';

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

function medianPrice(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle] ?? null;
}

function chainDisplayName(chain: string) {
  if (chain === 'hemkop') return 'Hemköp';
  if (chain === 'willys') return 'Willys';
  return chain.toUpperCase();
}

function chainUnitPriceLabel(price: number, priceUnit: string, packageLabel: string) {
  if (priceUnit && priceUnit !== 'kr/st') return formatComparableUnitPrice(price, priceUnit);
  const normalized = normalizeComparableUnitPrice(price, packageLabel);
  return normalized ? formatComparableUnitPrice(normalized.unitPrice, normalized.unitLabel) : 'Unit price not computable';
}

type SearchParams = {
  chains?: string | string[];
  overlayMode?: string | string[];
  products?: string | string[];
  routeMode?: string | string[];
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function overlayModeHref(productsParam: string | string[] | undefined, chainsParam: string | string[] | undefined, overlayMode: 'price' | 'index') {
  const params = new URLSearchParams();
  const products = firstSearchValue(productsParam);
  const chains = firstSearchValue(chainsParam);
  if (products) params.set('products', products);
  if (chains) params.set('chains', chains);
  if (overlayMode === 'index') params.set('overlayMode', 'index');
  return `/compare${params.toString() ? `?${params.toString()}` : ''}`;
}

function overlayWindow(
  label: PriceChartTerminalWindow['label'],
  days: number | null,
  overlayMode: 'price' | 'index'
): PriceChartTerminalWindow {
  const allTimes = compareOverlayChart.overlaySeries.flatMap((series) => series.points.map((point) => Date.parse(point.time)));
  const windowEndTime = Math.max(...allTimes);
  const windowStartTime = days === null ? Math.min(...allTimes) : windowEndTime - days * 24 * 60 * 60 * 1000;
  const series = compareOverlayChart.overlaySeries.map((item) => {
    const visiblePoints = item.points.filter((point) => Date.parse(point.time) >= windowStartTime && Date.parse(point.time) <= windowEndTime);
    const baseValue = visiblePoints[0]?.value ?? item.points[0]?.value ?? 1;
    return {
      id: item.id,
      storeName: item.productName,
      sourceType: item.sourceType,
      lineStyle: item.lineStyle,
      points: visiblePoints.map((point) => ({
        time: point.time,
        value: overlayMode === 'index' && baseValue > 0 ? Math.round((point.value / baseValue) * 10000) / 100 : point.value,
        confidence: point.confidence,
        provenanceLabel: point.provenanceLabel
      })),
      markers: []
    };
  });
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const latestValue = values.at(-1) ?? 0;
  const lowValue = values.length ? Math.min(...values) : 0;
  const highValue = values.length ? Math.max(...values) : 0;
  const windowStart = new Date(windowStartTime).toISOString();
  const windowEnd = new Date(windowEndTime).toISOString();
  const rangeStart = compareOverlayChart.windowStart ?? windowStart;
  const rangeEnd = compareOverlayChart.windowEnd ?? windowEnd;

  return {
    label,
    rangeLabel: days === null ? `${rangeStart.slice(0, 10)} → ${rangeEnd.slice(0, 10)}` : `Last ${days} days`,
    windowStart,
    windowEnd,
    pointCount: series.reduce((sum, item) => sum + item.points.length, 0),
    markerCount: 0,
    latestValueLabel: overlayMode === 'index' ? `${latestValue.toLocaleString('sv-SE')} index` : formatSek(latestValue),
    latestObservedAt: rangeEnd,
    lowValueLabel: overlayMode === 'index' ? `${lowValue.toLocaleString('sv-SE')} index` : formatSek(lowValue),
    highValueLabel: overlayMode === 'index' ? `${highValue.toLocaleString('sv-SE')} index` : formatSek(highValue),
    series
  };
}

function overlayTerminalModel(overlayMode: 'price' | 'index'): PriceChartTerminalModel {
  return {
    available: compareOverlayChart.overlaySeries.length > 0,
    title: overlayMode === 'index' ? 'Normalized product overlay (first point = 100)' : 'Product price overlay',
    sourceLabel: compareOverlayChart.coverageLabel,
    confidenceLabel: compareOverlayChart.confidenceLabel,
    caveat: `${compareOverlayChart.guardrail} ${overlayMode === 'index' ? 'Index mode normalizes each visible series to 100 at its first point.' : 'Price mode shows observed SEK values.'}`,
    defaultWindow: '1Y',
    windows: [
      overlayWindow('1M', 30, overlayMode),
      overlayWindow('3M', 90, overlayMode),
      overlayWindow('1Y', 365, overlayMode),
      overlayWindow('ALL', null, overlayMode)
    ]
  };
}

function compareHref(productsParam: string | string[] | undefined, selectedChainIds: string[]) {
  const params = new URLSearchParams();
  const products = Array.isArray(productsParam) ? productsParam[0] : productsParam;
  if (products) params.set('products', products);
  if (selectedChainIds.length < COMPARE_CHAIN_ORDER.length) params.set('chains', selectedChainIds.join(','));
  const query = params.toString();
  return `/compare${query ? `?${query}` : ''}`;
}

function endpointSnapshotMatrix(snapshotRows: ComparePriceSnapshotStoreRow[], requestedItemIds: string[]) {
  const storeIds = [...new Set(snapshotRows.map((row) => row.storeName))].sort((left, right) => left.localeCompare(right, 'sv-SE'));
  const rowsByItemStore = new Map(snapshotRows.map((row) => [`${row.itemId}:${row.storeName}`, row]));

  return {
    chains: storeIds.map((storeId) => ({ id: storeId, label: storeId })),
    products: requestedItemIds.map((itemId) => {
      const firstRow = snapshotRows.find((row) => row.itemId === itemId);
      return {
        brand: null,
        packageLabel: 'Endpoint price snapshot',
        productName: firstRow?.itemName ?? itemId,
        productSlug: itemId,
        cells: storeIds.map((storeId) => {
          const row = rowsByItemStore.get(`${itemId}:${storeId}`);
          return {
            chainId: storeId,
            freshnessObservedAt: row?.observedAt || null,
            priceText: row?.priceLabel ?? 'Missing from store snapshot',
            productName: row?.itemName ?? itemId,
            productSlug: itemId,
            status: row?.price === null || !row ? 'missing' : 'priced',
            unitLabel: row?.unitLabel ?? 'No item snapshot row',
            verificationLabel: row?.confidence ? `Endpoint confidence: ${row.confidence}` : 'Endpoint snapshot row'
          };
        })
      };
    })
  };
}

export default async function ComparePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const productsParam = resolvedSearchParams.products;
  const compareSnapshots = await fetchComparePriceSnapshots(productsParam, { endpoint: '/api/compare' });
  const hasEndpointRequestedItems = compareSnapshots.itemIds.length > 0;
  const endpointMatrix = endpointSnapshotMatrix(compareSnapshots.storeRows, compareSnapshots.itemIds);
  const overlayMode = firstSearchValue(resolvedSearchParams.overlayMode) === 'index' ? 'index' as const : 'price' as const;
  const overlayChartModel = overlayTerminalModel(overlayMode);
  const comparison = buildChainComparisonTable(hasEndpointRequestedItems ? undefined : productsParam);
  const selectedChainIds = parseCompareChainsParam(resolvedSearchParams.chains);
  const basketStoreComparison = buildBasketStoreComparison(productsParam, resolvedSearchParams.chains);
  const cheapestBasketStore = basketStoreComparison.stores.find((store) => store.highlightLabels.includes('Cheapest'));
  const closestBasketStore = basketStoreComparison.stores.find((store) => store.highlightLabels.includes('Closest'));
  const bestStockedBasketStore = basketStoreComparison.stores.find((store) => store.highlightLabels.includes('Best stocked'));
  const storeDistance = buildStoreDistanceCompare(productsParam, resolvedSearchParams.routeMode);
  const packagedRows = comparison.products.filter((product) => product.matchType === 'packaged_barcode');
  const commodityRows = comparison.products.filter((product) => product.matchType === 'commodity_alias');
  const requestedMatchedProductSlugs = new Set(comparison.products.map((product) => product.productSlug));
  const requestedMatchedProducts = requestedMatchedProductSlugs.size > 0
    ? matchedChainProducts.filter((product) => requestedMatchedProductSlugs.has(product.slug))
    : [];
  const cheapestChainSourceProducts = requestedMatchedProducts.length > 0 ? requestedMatchedProducts : matchedChainProducts;
  const cheapestChainScopeLabel = requestedMatchedProducts.length > 0 ? 'requested matches' : 'high-spread matches';
  const cheapestChainRows = [...cheapestChainSourceProducts]
    .sort((left, right) => right.spreadPct - left.spreadPct)
    .slice(0, 12)
    .map((product) => {
      const chainRows = chainPriceRows(product).sort((left, right) => left.price - right.price);
      const best = chainRows[0];
      const prices = chainRows.map((row) => row.price);
      const median = medianPrice(prices);

      return {
        product,
        best,
        chainRows: chainRows.map((row) => ({
          ...row,
          chainName: chainDisplayName(row.chain),
          deltaVsBest: best ? row.price - best.price : null,
          deltaVsMedian: median === null ? null : row.price - median,
          unitPriceLabel: chainUnitPriceLabel(row.price, row.priceUnit, product.subline)
        })),
        median
      };
    });
  const sampleProductsHref = '/compare?products=makaroner-pasta-101302991-st,havregryn-extra-fylliga-101758934-st';
  const chainSelectorOptions = COMPARE_CHAIN_ORDER.map((chain) => ({
    href: compareHref(
      productsParam,
      selectedChainIds.includes(chain.id)
        ? selectedChainIds.length === 1
          ? selectedChainIds
          : selectedChainIds.filter((chainId) => chainId !== chain.id)
        : [...selectedChainIds, chain.id]
    ),
    id: chain.id,
    label: chain.label,
    description: selectedChainIds.includes(chain.id)
      ? 'Shown in the side-by-side basket comparison.'
      : 'Add this chain to the side-by-side basket comparison.',
    selected: selectedChainIds.includes(chain.id)
  }));
  const rowSections = [
    {
      id: 'commodity-alias',
      title: 'Commodity/alias unit-price matches',
      description: 'Loose produce, meat-style commodities, and other canonical commodity rows rank chains by comparable kr/kg, kr/l, or kr/st evidence. Confidence and coverage stay visible when inputs are partial.',
      rows: commodityRows
    },
    {
      id: 'packaged-barcode',
      title: 'Packaged/barcode matches',
      description: 'Branded or exact packaged rows stay separate and rank by the reported pack price for that product code.',
      rows: packagedRows
    }
  ];
  const currentCompareParams = new URLSearchParams();
  if (firstSearchValue(productsParam)) currentCompareParams.set('products', firstSearchValue(productsParam));
  if (firstSearchValue(resolvedSearchParams.chains)) currentCompareParams.set('chains', firstSearchValue(resolvedSearchParams.chains));
  if (overlayMode === 'index') currentCompareParams.set('overlayMode', 'index');
  if (firstSearchValue(resolvedSearchParams.routeMode)) currentCompareParams.set('routeMode', firstSearchValue(resolvedSearchParams.routeMode));
  const currentCompareHref = `/compare${currentCompareParams.toString() ? `?${currentCompareParams.toString()}` : ''}`;

  return (
    <PageShell>
      <FunnelStepBeacon step="compare_view" />
      <Eyebrow>Willys vs Hemköp</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Comparable chain prices</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Rows appear only when the same Axfood product code is present in both chain catalogues. Savings are not shown across unmatched products.</p>
      <SavedViewActions
        href={currentCompareHref}
        label="Comparable chain price view"
        resultLabel={`${comparison.products.length || endpointMatrix.products.length} comparison rows · overlay ${overlayMode} · missing rows labelled`}
        state={{ chains: firstSearchValue(resolvedSearchParams.chains) || 'all', overlayMode, products: firstSearchValue(productsParam), routeMode: firstSearchValue(resolvedSearchParams.routeMode), view: 'chain-compare' }}
        surface="compare"
      />
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
          <div className="grid gap-3">
            <ChainSelector
              className="rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-sm"
              description="All supported chains stay selected so the existing ?products= query string continues to drive the comparison table."
              label="Compare chains"
              options={chainSelectorOptions}
            />
            <Link className="justify-self-start rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white shadow-sm" href={sampleProductsHref}>
              Try sample products
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {hasEndpointRequestedItems ? (
            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">GET /api/compare?itemIds=...</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">Endpoint-backed store snapshots</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Requested item ids are fetched from the compare endpoint and rendered as storeId to item snapshot rows. Missing item ids stay visible instead of falling back to name inference.
              </p>
              {compareSnapshots.endpointUnavailable ? (
                <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950">The compare endpoint is unavailable, so requested item ids are held in the missing state.</p>
              ) : null}
              {endpointMatrix.products.length > 0 && endpointMatrix.chains.length > 0 ? (
                <div className="mt-4">
                  <StorePriceMatrix chains={endpointMatrix.chains} products={endpointMatrix.products} sourceGeneratedAt={comparison.generatedAt} sourceLabel="/api/compare item snapshot rows" />
                </div>
              ) : null}
            </div>
          ) : null}
          {!hasEndpointRequestedItems && comparison.products.length === 0 ? (
            <p className="rounded-3xl border border-emerald-100 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              Add ?products=product-slug-1,product-slug-2 to render DB-backed comparison rows. Missing product ids: {comparison.missingProductIds.join(', ') || 'none yet'}.
            </p>
          ) : null}
          {!hasEndpointRequestedItems ? <StorePriceMatrix chains={COMPARE_CHAIN_ORDER} products={comparison.products} sourceGeneratedAt={comparison.generatedAt} sourceLabel={comparison.sourceLabel} /> : null}
          {!hasEndpointRequestedItems ? rowSections.map((section) => (
            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm" key={section.id}>
              <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
                <h3 className="text-sm font-black text-emerald-950">{section.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-emerald-900">{section.description}</p>
              </div>
              {section.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{section.title} side-by-side prices across ICA, Willys, and Coop</caption>
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
                      {section.rows.map((product) => (
                        <tr className="border-t border-slate-100 align-top" key={`${section.id}-${product.productSlug}`}>
                          <th className="px-4 py-4 font-black text-slate-950">
                            <Link className="underline decoration-emerald-300 underline-offset-4" href={`/products/${product.productSlug}`}>{product.productName}</Link>
                            <span className="mt-1 block text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'} · {product.packageLabel}</span>
                            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{product.matchLabel}</span>
                            <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{product.confidenceLabel}</span>
                          </th>
                          {product.cells.map((cell) => (
                            <td className="px-4 py-4" key={`${product.productSlug}-${cell.chainId}`}>
                              <p className={cell.status === 'priced' ? 'font-black text-emerald-900' : 'font-black text-slate-400'}>{cell.priceText}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{cell.unitLabel}</p>
                              {cell.productSlug ? (
                                <Link className="mt-2 block text-xs font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={`/products/${cell.productSlug}`}>
                                  {cell.productName ?? cell.productSlug}
                                </Link>
                              ) : null}
                              {cell.sourceConfidence !== null ? (
                                <p className="mt-1 text-xs font-semibold text-slate-500">sourceConfidence {formatPct(cell.sourceConfidence * 100)}</p>
                              ) : null}
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
              ) : (
                <p className="px-4 py-5 text-sm font-semibold text-slate-500">No requested rows used this match type.</p>
              )}
            </div>
          )) : null}
        </div>
        {(hasEndpointRequestedItems ? compareSnapshots.missingItemIds : comparison.missingProductIds).length > 0 ? (
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950">
            Missing product ids: {(hasEndpointRequestedItems ? compareSnapshots.missingItemIds : comparison.missingProductIds).join(', ')}. The compare route does not infer products from names.
          </p>
        ) : null}
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Source: {comparison.sourceLabel}{comparison.generatedAt ? ` · generated ${comparison.generatedAt}` : ''}.
        </p>
      </Card>
      <Card className="mt-6 overflow-hidden border-teal-200 bg-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-800">Cheapest chain answer</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Who is cheapest for this matched product right now?</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Exact matched Willys/Hemköp catalogue rows show each chain price, comparable unit price when package text permits it, and deltas against the current best and row median. Missing or unmatched chains are not inferred.
            </p>
          </div>
          <p className="rounded-full bg-teal-50 px-4 py-2 text-sm font-black text-teal-900">{cheapestChainRows.length} {cheapestChainScopeLabel}</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">Cheapest chain comparison for matched products</caption>
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 font-black">Product</th>
                <th className="px-4 py-3 font-black">Current best</th>
                <th className="px-4 py-3 font-black">Chain prices</th>
                <th className="px-4 py-3 font-black">Median</th>
                <th className="px-4 py-3 font-black">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {cheapestChainRows.map(({ best, chainRows, median, product }) => (
                <tr className="border-t border-slate-100 align-top" key={product.slug}>
                  <th className="px-4 py-4">
                    <Link className="font-black text-slate-950 underline decoration-teal-300 underline-offset-4" href={`/products/${product.slug}`}>
                      {product.name}
                    </Link>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'} · {product.subline}</span>
                  </th>
                  <td className="px-4 py-4">
                    <p className="rounded-2xl bg-teal-50 px-3 py-2 font-black text-teal-950">{best ? chainDisplayName(best.chain) : 'No priced chain'}</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{best ? formatSek(best.price) : 'No current best'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{best ? chainUnitPriceLabel(best.price, best.priceUnit, product.subline) : 'Coverage pending'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid min-w-[20rem] gap-2 md:grid-cols-2">
                      {chainRows.map((row) => (
                        <div className={row.deltaVsBest === 0 ? 'rounded-2xl border border-teal-200 bg-teal-50 p-3' : 'rounded-2xl border border-slate-200 bg-slate-50 p-3'} key={`${product.slug}-${row.chain}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black text-slate-950">{row.chainName}</p>
                            {row.deltaVsBest === 0 ? <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-teal-900">Cheapest</span> : null}
                          </div>
                          <p className="mt-2 text-lg font-black text-slate-950">{formatSek(row.price)}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-600">{row.unitPriceLabel}</p>
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            {row.deltaVsBest === 0 ? 'Current best' : `${formatSek(row.deltaVsBest)} vs best`}
                            {row.deltaVsMedian !== null ? ` · ${row.deltaVsMedian >= 0 ? '+' : ''}${formatSek(row.deltaVsMedian)} vs median` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{formatSek(median)}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Current matched-chain median</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{chainRows.length} chain rows</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Spread {formatPct(product.spreadPct)} · {snapshot.axfoodSource}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6">
        <StoreComparisonTable
          basketItemCount={basketStoreComparison.itemCount}
          basketSourceLabel={basketStoreComparison.sourceLabel}
          basketStores={basketStoreComparison.stores}
          items={[]}
        />
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Side-by-side chain totals include missing item counts and substitutions. {basketStoreComparison.summary}</p>
        <p className="mt-2 text-sm font-bold leading-6 text-emerald-900">
          Store cards are sorted by the total cost of the current shopping list; the lowest priced complete or partial basket is highlighted as Cheapest.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Cheapest basket</p>
            <p className="mt-2 text-xl font-black text-emerald-950">{cheapestBasketStore?.storeName ?? 'Add basket items'}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">{cheapestBasketStore?.totalText ?? 'No comparable total yet'}</p>
            <p className="mt-1 text-xs font-bold text-emerald-900">{cheapestBasketStore?.substitutionCount ?? 0} substitution hint(s)</p>
          </Card>
          <Card className="border-cyan-200 bg-cyan-50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Closest option</p>
            <p className="mt-2 text-xl font-black text-cyan-950">{closestBasketStore?.storeName ?? 'Add basket items'}</p>
            <p className="mt-1 text-sm font-semibold text-cyan-900">{closestBasketStore?.distanceText ?? 'Distance pending'}</p>
          </Card>
          <Card className="border-indigo-200 bg-indigo-50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">Best stocked</p>
            <p className="mt-2 text-xl font-black text-indigo-950">{bestStockedBasketStore?.storeName ?? 'Add basket items'}</p>
            <p className="mt-1 text-sm font-semibold text-indigo-900">{bestStockedBasketStore?.coverageLabel ?? 'Coverage pending'}</p>
          </Card>
        </div>
      </div>
      <BasketComparisonPrint chains={COMPARE_CHAIN_ORDER} products={comparison.products} sourceLabel={comparison.sourceLabel} />

      <Card className="mt-6 border-cyan-200 bg-cyan-50/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-800">Route-time compare</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Fastest store for selected products</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Sorts nearby stores by estimated {storeDistance.mode} time plus basket pickup time, so the practical best choice can beat the cheapest shelf price.
              {` ${storeDistance.summary}`}
            </p>
          </div>
          <div className="flex gap-2" aria-label="Choose route compare mode">
            {(['walk', 'drive'] as const).map((mode) => (
              <Link
                className={mode === storeDistance.mode ? 'rounded-full bg-cyan-900 px-4 py-2 text-sm font-black text-white shadow-sm' : 'rounded-full bg-white px-4 py-2 text-sm font-black text-cyan-900 shadow-sm'}
                href={`/compare?routeMode=${mode}${productsParam ? `&products=${Array.isArray(productsParam) ? productsParam[0] : productsParam}` : ''}`}
                key={mode}
              >
                {mode === 'walk' ? 'Walk time' : 'Drive time'}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {storeDistance.rows.map((store, index) => (
            <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm" key={store.id}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">#{index + 1} · {store.chainName}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{store.storeName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{store.areaLabel} · {(store.distanceMeters / 1000).toFixed(1)} km away</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-cyan-50 p-3 font-black text-cyan-950">Total {store.totalMinutes} min</p>
                <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">Pickup {store.pickupMinutes} min</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{store.coverageLabel}</p>
            </div>
          ))}
        </div>
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
          <div className="md:col-span-2">
            <div className="mb-3 flex flex-wrap gap-2">
              <Link className={`rounded-full px-4 py-2 text-xs font-black ${overlayMode === 'price' ? 'bg-indigo-900 text-white' : 'bg-white text-indigo-900 ring-1 ring-indigo-200'}`} href={overlayModeHref(productsParam, resolvedSearchParams.chains, 'price')}>
                Price mode
              </Link>
              <Link className={`rounded-full px-4 py-2 text-xs font-black ${overlayMode === 'index' ? 'bg-indigo-900 text-white' : 'bg-white text-indigo-900 ring-1 ring-indigo-200'}`} href={overlayModeHref(productsParam, resolvedSearchParams.chains, 'index')}>
                Normalized index mode
              </Link>
            </div>
            <PriceChartTerminal chart={overlayChartModel} />
          </div>
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
