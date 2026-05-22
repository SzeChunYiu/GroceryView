import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  buildPriceChartSeries,
  calculateDealScore,
  recommendSmartSwaps,
  scoreBand,
  summarizePriceHistory,
  summarizePriceHistoryConfidence,
  type BrandTier
} from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { PriceChartTerminal, type PriceChartTerminalModel, type PriceChartTerminalWindow } from '@/components/price-chart-terminal';
import { axfoodProducts } from '@/lib/axfood-products';
import { pricedProducts } from '@/lib/openprices-products';
import { chainPriceRows, dataFreshnessBadges, findProduct, formatPct, formatSek, labelFromSlug } from '@/lib/verified-data';

const REQUIRED_CHAIN_COVERAGE = 6;
const siteUrl = 'https://grocery-web-mu.vercel.app';
const smartSwapPrivateLabelPreference = {
  acceptedTiers: ['standard_private_label', 'budget_private_label', 'organic_private_label', 'discount_chain_label'] as BrandTier[],
  blockedCategories: ['baby_formula']
};
const timeframeWindows = [
  { label: '1W', rangeDays: 7, rangeLabel: 'last 7 days' },
  { label: '1M', rangeDays: 30, rangeLabel: 'last 30 days' },
  { label: '3M', rangeDays: 90, rangeLabel: 'last 90 days' },
  { label: '1Y', rangeDays: 365, rangeLabel: 'last 365 days' },
  { label: 'ALL', rangeDays: undefined, rangeLabel: 'all observed points' }
] as const;

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

function packageEvidenceFrom(text: string) {
  const match = text.toLowerCase().replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|st)\b/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { packageSize: amount * 1000, packageUnit: 'g' };
  if (unit === 'l') return { packageSize: amount * 1000, packageUnit: 'ml' };
  if (unit === 'st') return { packageSize: amount, packageUnit: 'piece' };
  return { packageSize: amount, packageUnit: unit };
}

function productPackageText(product: NonNullable<ReturnType<typeof findProduct>>) {
  return 'lowestPrice' in product ? product.subline : product.quantity;
}

function productBrand(product: NonNullable<ReturnType<typeof findProduct>>) {
  return 'lowestPrice' in product ? product.brand : product.brands || 'Brand not reported';
}

function productUnitPrice(product: NonNullable<ReturnType<typeof findProduct>>) {
  return 'lowestPrice' in product ? product.lowestPrice : product.priceMedian;
}

function productOfferBounds(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product) {
    const prices = chainPriceRows(product)
      .map((row) => row.price)
      .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));
    return {
      lowPrice: prices.length ? Math.min(...prices) : product.lowestPrice,
      highPrice: prices.length ? Math.max(...prices) : product.highestPrice,
      offerCount: Math.max(prices.length, product.inChains.length)
    };
  }

  return { lowPrice: product.priceMin, highPrice: product.priceMax, offerCount: product.observationCount };
}

function productJsonLdFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const bounds = productOfferBounds(product);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image ? [product.image] : undefined,
    brand: { '@type': 'Brand', name: productBrand(product) },
    category: labelFromSlug(product.category),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'SEK',
      lowPrice: bounds.lowPrice,
      highPrice: bounds.highPrice,
      offerCount: bounds.offerCount,
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/products/${product.slug}`
    }
  };
}

function breadcrumbJsonLdFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Products', item: `${siteUrl}/products` },
      { '@type': 'ListItem', position: 2, name: labelFromSlug(product.category), item: `${siteUrl}/categories/${product.category}` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${siteUrl}/products/${product.slug}` }
    ]
  };
}

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function brandTierFor(brand: string, labels: string[] = []): BrandTier {
  const lower = brand.toLowerCase();
  const isRetailerPrivateLabel = lower.includes('garant') || lower.includes('ica') || lower.includes('coop') || lower.includes('änglamark');
  if (lower.includes('garant eko') || (isRetailerPrivateLabel && (labels.includes('ecological') || labels.includes('eu_ecological')))) return 'organic_private_label';
  if (lower.includes('eldorado') || lower.includes('x-tra') || lower.includes('basic')) return 'budget_private_label';
  if (isRetailerPrivateLabel) return 'standard_private_label';
  if (lower.includes('willys') || lower.includes('lidl') || lower.includes('city gross')) return 'discount_chain_label';
  return 'national';
}

function productMatchInputFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const packageEvidence = packageEvidenceFrom(productPackageText(product));
  const unitPrice = productUnitPrice(product);
  if (!packageEvidence || unitPrice <= 0) return null;
  const brand = productBrand(product);
  return {
    id: product.slug,
    brand,
    category: product.category,
    brandTier: brandTierFor(brand, 'labels' in product ? product.labels : []),
    unitPrice,
    ...packageEvidence
  };
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

function smartSwapRecommendationsFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const source = productMatchInputFor(product);
  const productById = new Map([...axfoodProducts, ...pricedProducts].map((candidate) => [candidate.slug, candidate]));
  if (!source) {
    return {
      rows: [],
      caveat: 'Smart swaps are withheld because this product lacks verified package-size evidence.'
    };
  }

  const candidates = [...axfoodProducts, ...pricedProducts]
    .filter((candidate) => candidate.slug !== product.slug && candidate.category === product.category)
    .map(productMatchInputFor)
    .filter((candidate): candidate is NonNullable<ReturnType<typeof productMatchInputFor>> => candidate !== null && candidate.unitPrice < source.unitPrice);

  const rows = recommendSmartSwaps({
    source,
    candidates,
    acceptPrivateLabel: 'yes',
    minimumSavingsPercent: 5,
    privateLabelPreference: smartSwapPrivateLabelPreference
  })
    .map((swap) => {
      const swapProduct = productById.get(swap.productId);
      if (!swapProduct) return null;
      return {
        ...swap,
        productName: swapProduct.name,
        productSlug: swapProduct.slug,
        brand: productBrand(swapProduct),
        unitPrice: productUnitPrice(swapProduct)
      };
    })
    .filter((swap): swap is NonNullable<typeof swap> => swap !== null)
    .slice(0, 4);

  return {
    rows,
    caveat: rows.length > 0
      ? 'Recommendations require same category, comparable package size, verified lower unit price, and the visible private-label preference.'
      : 'No same-size, lower-price substitute cleared recommendSmartSwaps for this product.'
  };
}

function priceHistoryBadgeFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product || product.observations.length === 0) {
    return {
      available: false,
      summary: null,
      disclosure: null,
      legalCopy: 'observed low only',
      headline: '52-week-low badge withheld',
      detail: 'This source has no dated price tape, so the product page does not claim a 52-week low.'
    };
  }

  const points = product.observations.map((observation) => ({
    observedAt: `${observation.date}T00:00:00.000Z`,
    price: observation.price,
    storeId: 'openprices-community'
  }));
  const summary = summarizePriceHistory(points);
  const orderedDates = [...product.observations].map((observation) => observation.date).sort((a, b) => a.localeCompare(b));
  const disclosure = summarizePriceHistoryConfidence({
    rangeDays: 365,
    firstObservedAt: `${orderedDates[0]}T00:00:00.000Z`,
    lastObservedAt: summary.latestObservedAt,
    observationCount: summary.observedCount,
    sourceTypesIncluded: ['online'],
    expectedSourceTypes: ['shelf', 'online', 'flyer'],
    productScopeKnown: true,
    storeScopeKnown: false
  });
  const legalCopy = disclosure.canClaimLowestInWindow ? 'lowest in observed 365-day window' : 'observed low only';

  return {
    available: true,
    summary,
    disclosure,
    legalCopy,
    headline: summary.isNewLow && disclosure.canClaimLowestInWindow ? 'New 52-week low observed' : 'Observed price-history badge',
    detail: disclosure.detailCopy
  };
}

function priceChartTerminalFor(product: NonNullable<ReturnType<typeof findProduct>>): PriceChartTerminalModel {
  const emptyWindows: PriceChartTerminalWindow[] = timeframeWindows.map((window) => ({
    label: window.label,
    rangeLabel: window.rangeLabel,
    pointCount: 0,
    markerCount: 0,
    latestValueLabel: 'Not reported',
    lowValueLabel: 'Not reported',
    highValueLabel: 'Not reported',
    series: []
  }));

  if ('lowestPrice' in product || product.observations.length === 0) {
    return {
      available: false,
      title: 'Multi-timeframe chart withheld',
      sourceLabel: 'No dated OpenPrices tape bundled for this source',
      confidenceLabel: 'chart confidence unavailable',
      caveat: 'This product source has no dated observation tape, so GroceryView does not render a synthetic chart.',
      defaultWindow: 'ALL',
      windows: emptyWindows
    };
  }

  const latestObservedAt = latestObservationFor(product)?.date ?? product.lastObservedAt;
  const asOf = `${latestObservedAt}T00:00:00.000Z`;
  const sourceConfidence = clamp(product.observationCount / 30, 0, 1);
  const observations = product.observations.map((observation) => ({
    observedAt: `${observation.date}T00:00:00.000Z`,
    price: observation.price,
    storeId: 'openprices-community',
    storeName: 'OpenPrices community',
    sourceType: 'online' as const,
    confidence: sourceConfidence,
    provenanceLabel: `${product.observationCount} OpenPrices observations · ${product.code}`
  }));

  const windows = timeframeWindows.map((window): PriceChartTerminalWindow => {
    const result = buildPriceChartSeries({
      observations,
      asOf,
      rangeDays: window.rangeDays,
      markerLimitPerSeries: 8
    });
    const points = result.series.flatMap((series) => series.points);
    const values = points.map((point) => point.value);
    const latestPoint = [...points].sort((a, b) => a.time.localeCompare(b.time)).at(-1);

    return {
      label: window.label,
      rangeLabel: window.rangeLabel,
      windowStart: result.windowStart,
      windowEnd: result.windowEnd,
      pointCount: points.length,
      markerCount: result.series.reduce((total, series) => total + series.markers.length, 0),
      latestValueLabel: latestPoint ? formatSek(latestPoint.value) : 'Not reported',
      latestObservedAt: latestPoint?.time,
      lowValueLabel: values.length ? formatSek(Math.min(...values)) : 'Not reported',
      highValueLabel: values.length ? formatSek(Math.max(...values)) : 'Not reported',
      series: result.series
    };
  });

  return {
    available: windows.some((window) => window.pointCount > 0),
    title: 'Multi-timeframe OpenPrices tape',
    sourceLabel: 'buildPriceChartSeries · OpenPrices community observations',
    confidenceLabel: `${formatPct(sourceConfidence * 100)} chart confidence`,
    caveat: 'Every plotted point comes from dated OpenPrices observations; missing shelf, flyer, and member prices are disclosed instead of inferred.',
    defaultWindow: windows.find((window) => window.label === '1Y' && window.pointCount > 0)?.label ?? 'ALL',
    windows
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
  const smartSwaps = smartSwapRecommendationsFor(product);
  const priceHistoryBadge = priceHistoryBadgeFor(product);
  const priceChartTerminal = priceChartTerminalFor(product);
  const freshnessBadge = dataFreshnessBadges.find((badge) => badge.sourceKind === (isChain ? 'axfood' : 'openprices')) ?? dataFreshnessBadges[0]!;
  const productJsonLd = productJsonLdFor(product);
  const breadcrumbJsonLd = breadcrumbJsonLdFor(product);
  return (
    <PageShell>
      <script dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} type="application/ld+json" />
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
      <Card className="mt-6 border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Data freshness badge</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{freshnessBadge.sourceName}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{freshnessBadge.caveat}</p>
          </div>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={freshnessBadge.evidenceRoute}>
            Check source route
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">Freshness: {freshnessBadge.freshnessLabel}</p>
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">Coverage: {freshnessBadge.coverageLabel}</p>
          <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">Confidence: {freshnessBadge.confidenceBadge}</p>
        </div>
      </Card>
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
      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Substitute engine</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Smart swaps</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Calls recommendSmartSwaps with visible package sizes and prices. The private-label preference accepts retailer/private-label tiers but blocks high-risk baby formula substitutions.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">{smartSwaps.rows.length} verified swaps</p>
        </div>
        {smartSwaps.rows.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {smartSwaps.rows.map((swap) => (
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-700" href={`/products/${swap.productSlug}`} key={swap.productId}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Save {formatPct(swap.savingsPercent)}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{swap.productName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{swap.brand} · {formatSek(swap.unitPrice)}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{swap.reason}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">confidence {swap.confidence} · qualityRisk {swap.qualityRisk}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">{smartSwaps.caveat}</p>
        )}
        <p className="mt-4 text-xs font-semibold text-slate-500">{smartSwaps.caveat}</p>
      </Card>
      <PriceChartTerminal chart={priceChartTerminal} />
      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Price tape</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">52-week-low badge</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Calls summarizePriceHistory and summarizePriceHistoryConfidence before showing a low-price claim; missing shelf or flyer evidence falls back to observed low only.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900">{priceHistoryBadge.legalCopy}</p>
        </div>
        {priceHistoryBadge.available && priceHistoryBadge.summary && priceHistoryBadge.disclosure ? (
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Badge</p>
              <p className="mt-2 text-lg font-black text-slate-950">{priceHistoryBadge.headline}</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Latest</p>
              <p className="mt-2 text-lg font-black text-slate-950">{formatSek(priceHistoryBadge.summary.latestPrice)}</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Observed low</p>
              <p className="mt-2 text-lg font-black text-slate-950">{formatSek(priceHistoryBadge.summary.lowestPrice)}</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Claim gate</p>
              <p className="mt-2 text-lg font-black text-slate-950">canClaimLowestInWindow {String(priceHistoryBadge.disclosure.canClaimLowestInWindow)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{priceHistoryBadge.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold text-slate-500">{priceHistoryBadge.detail}</p>
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
