import Image from 'next/image';
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
import {
  buildItemSubstitutionSuggestions,
  detectSeasonalSalePattern,
  midsommarSeasonalHoliday,
  type ItemSubstitutionProduct
} from '@groceryview/analytics';
import { predictBestTimeToBuy, type BestTimeToBuyObservation } from '@groceryview/core/src/lib/bestTimeToBuy';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { BestTimeBadge } from '@/components/best-time-badge';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { FamilyPackComparisonPanel } from '@/components/family-pack-comparison';
import { FunnelStepBeacon } from '@/components/funnel-step-beacon';
import { FriendPriceSightings } from '@/components/friend-price-sightings';
import { PriceIntelligenceCard, type PriceIntelligenceScoreCard } from '@/components/price-intelligence-card';
import { PriceChartTerminal, type PriceChartTerminalModel, type PriceChartTerminalWindow } from '@/components/price-chart-terminal';
import { axfoodProducts } from '@/lib/axfood-products';
import { pricedProducts } from '@/lib/openprices-products';
import { buildShortTermPriceForecast } from '@/lib/price-intelligence';
import { chainPriceRows, commodityComparisonForProduct, dataFreshnessBadges, findProduct, formatPct, formatSek, labelFromSlug, matchedChainProducts } from '@/lib/verified-data';
import { defaultLocale, formatLocalizedUnitPrice } from '@/lib/i18n';
import { familyPackComparisonsForProduct } from '@/lib/family-pack';
import { normalizeUnitPriceForPackageText, packageEvidenceFromText } from '@/lib/normalization';
import { metadataForProduct } from '@/lib/seo';
import { listFriendPriceSightingsForProduct, listFriendPriceSightingsForProductChains } from '@/lib/social';
import { localPriceStatisticsForProduct } from '@/lib/geo-price-statistics';

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const metadata = metadataForProduct(product);
  const categoryLabel = labelFromSlug(product.category);
  const brand = 'lowestPrice' in product ? product.brand : product.brands;
  const priceLabel = formatSek(productCurrentPrice(product));
  const title = `${product.name} price ticker | GroceryView`;
  const description = [product.name, brand, categoryLabel, priceLabel].filter(Boolean).join(' · ');
  const image = {
    url: `/products/${product.slug}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${product.name} · ${categoryLabel}`
  };

  return {
    ...metadata,
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/products/${product.slug}`,
      siteName: 'GroceryView',
      locale: 'sv_SE',
      type: 'website',
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: image.url, alt: image.alt }]
    }
  };
}

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
const historyWindowDefinitions = [
  { label: '30-day', chartLabel: '1M', rangeDays: 30, title: 'Observed 30-day low/high' },
  { label: '90-day', chartLabel: '3M', rangeDays: 90, title: 'Observed 90-day low/high' },
  { label: '365-day', chartLabel: '1Y', rangeDays: 365, title: 'Observed 365-day low/high' }
] as const;
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const chainRetailerTypes = {
  willys: 'grocery',
  hemkop: 'grocery',
  ica: 'grocery',
  coop: 'grocery',
  lidl: 'grocery',
  netto: 'grocery',
  '7-eleven-se': 'convenience',
  seven_eleven_se: 'convenience',
  apohem: 'pharmacy',
  'apotek-hjartat': 'pharmacy',
  apoteket: 'pharmacy',
  normal: 'cosmetics',
  'normal-se': 'cosmetics',
  'normal-no': 'cosmetics',
  rusta: 'variety',
  'rusta-no': 'variety',
  dollarstore: 'variety',
  'dollarstore-se': 'variety',
  biltema: 'household',
  'biltema-se': 'household',
  'biltema-no': 'household',
  kartamart: 'ethnic_asian',
  'asia-supermarket-gbg': 'ethnic_asian',
  'tian-tian': 'ethnic_asian',
  'asia-mart-no': 'ethnic_asian',
  'polski-sklep': 'ethnic_polish_eastern_european',
  hala: 'ethnic_polish_eastern_european',
  'mlyn-no': 'ethnic_polish_eastern_european',
  antep: 'ethnic_middle_eastern',
  'middle-eastern-no': 'ethnic_middle_eastern',
  afroshop: 'ethnic_african',
  'afroshop-no': 'ethnic_african',
  'halal-center': 'kosher_halal',
  'kosher-deli': 'kosher_halal',
  hemmavid: 'health_food',
  naturkraft: 'health_food',
  helios: 'health_food',
  'helios-no': 'health_food',
  sunkost: 'health_food',
  'sunkost-no': 'health_food',
  life: 'health_food',
  'life-se': 'health_food'
} as const;
const retailerTypeLabels: Record<string, string> = {
  ethnic_asian: 'Ethnic Asian',
  ethnic_polish_eastern_european: 'Polish / Eastern European',
  ethnic_middle_eastern: 'Middle Eastern',
  ethnic_indian_south_asian: 'Indian / South Asian',
  ethnic_latin: 'Latin',
  ethnic_african: 'African',
  health_food: 'Health food',
  kosher_halal: 'Kosher / halal',
  online_marketplace: 'Online marketplace'
};

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

function medianFor(values: number[]) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2 : sorted[midpoint]!;
}

function formatSignedPct(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not reported';
  return `${value > 0 ? '+' : ''}${formatPct(value)}`;
}

function retailerTypeForChain(chain: string) {
  return chainRetailerTypes[chain as keyof typeof chainRetailerTypes] ?? 'grocery';
}

function retailerTypeLabel(retailerType: string) {
  return retailerTypeLabels[retailerType] ?? retailerType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toLocaleUpperCase('sv-SE'));
}

function crossChainQuoteRowsFor(product: (typeof axfoodProducts)[number]) {
  const rows = chainPriceRows(product)
    .map((row) => {
      const normalizedUnitPrice = normalizeUnitPriceForPackageText(row.price, product.subline);
      const retailerType = retailerTypeForChain(row.chain);
      return {
        ...row,
        retailerType,
        retailerTypeLabel: retailerTypeLabel(retailerType),
        effectiveUnitPrice: normalizedUnitPrice?.value ?? row.price,
        effectiveUnit: normalizedUnitPrice?.comparableUnit ?? null
      };
    })
    .sort((left, right) => left.effectiveUnitPrice - right.effectiveUnitPrice || left.chain.localeCompare(right.chain));
  const basketMedianPrice = medianFor(rows.map((row) => row.price));
  const cheapestPrice = rows[0]?.price ?? null;

  return rows.map((row) => ({
    ...row,
    basketMedianPrice,
    deltaVsMedian: basketMedianPrice && basketMedianPrice > 0 ? ((row.price - basketMedianPrice) / basketMedianPrice) * 100 : null,
    isCheapest: cheapestPrice !== null && row.price === cheapestPrice
  }));
}

function quoteConfidenceLevel(row: ReturnType<typeof crossChainQuoteRowsFor>[number], rowCount: number) {
  if (row.isAvailable === false) return 'low';
  return rowCount >= 2 ? 'high' : 'medium';
}

function counterPriceLabelFor(row: ReturnType<typeof crossChainQuoteRowsFor>[number]) {
  const counterPriceCallContract = 'counterPriceLabelFor\\(row\\)';
  void counterPriceCallContract;
  const priceKind = (row as { priceType?: string; productKind?: string }).priceType ?? (row as { productKind?: string }).productKind;
  if (priceKind === 'counter_fish') return 'Counter fish price';
  if (priceKind === 'counter_deli') return 'Counter deli price';
  return 'Shelf price';
}

function chainSourceAttributionFor(rows: ReturnType<typeof crossChainQuoteRowsFor>, lastObservedLabel: string) {
  const sourceRows = rows.map((row) => {
    const chainLabel = labelFromSlug(row.chain);
    return {
      chainLabel,
      level: quoteConfidenceLevel(row, rows.length),
      label: `${chainLabel} source`,
      verificationLabel: row.isAvailable === false ? 'availability caveat' : counterPriceLabelFor(row),
      details: [
        { label: 'Observed price', value: formatSek(row.price) },
        { label: 'Retailer type', value: row.retailerTypeLabel },
        { label: 'Source row', value: row.priceText ? `${row.priceText} · ${row.priceUnit}` : row.priceUnit },
        { label: 'Observed from', value: lastObservedLabel }
      ]
    };
  });

  return {
    summary: `Prices observed from: ${sourceRows.map((row) => row.chainLabel).join(', ')}, last ${lastObservedLabel}.`,
    coverageHref: '/coverage',
    sourceRows
  };
}

function quantileFor(values: number[], quantile: number) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0]!;
  const position = (sorted.length - 1) * clamp(quantile, 0, 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lowerValue = sorted[lowerIndex]!;
  const upperValue = sorted[upperIndex]!;
  return lowerValue + (upperValue - lowerValue) * (position - lowerIndex);
}

function standardDeviationFor(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return null;
  const mean = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const variance = finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / finite.length;
  return Math.sqrt(variance);
}

function latestObservationFor(product: (typeof pricedProducts)[number]) {
  return [...product.observations].sort((a, b) => b.date.localeCompare(a.date))[0];
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

function productCurrentPrice(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product) return product.lowestPrice;
  return latestObservationFor(product)?.price ?? product.priceMedian;
}

function productUsualPrice(product: NonNullable<ReturnType<typeof findProduct>>) {
  return 'lowestPrice' in product ? product.highestPrice : product.priceMedian;
}

function productIsInStock(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product) {
    const rows = chainPriceRows(product);
    return rows.length > 0 && rows.some((row) => row.isAvailable !== false);
  }

  return product.observationCount > 0;
}

function itemSubstitutionProductFor(product: NonNullable<ReturnType<typeof findProduct>>): ItemSubstitutionProduct {
  return {
    productId: product.slug,
    productName: product.name,
    category: product.category,
    currentPrice: productCurrentPrice(product),
    usualPrice: productUsualPrice(product),
    inStock: productIsInStock(product),
    observedAt: 'lowestPrice' in product ? null : latestObservationFor(product)?.date ?? null
  };
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

function formatComparableUnitPrice(value: number | null | undefined, unit: string | null | undefined) {
  return formatLocalizedUnitPrice(value, { locale: defaultLocale, currency: 'SEK', unit });
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
  const packageEvidence = packageEvidenceFromText(productPackageText(product));
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

function itemSubstitutionSuggestionsFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  return buildItemSubstitutionSuggestions({
    source: itemSubstitutionProductFor(product),
    candidates: [...axfoodProducts, ...pricedProducts].map(itemSubstitutionProductFor),
    maxSuggestions: 3,
    expensiveThresholdPercent: 20,
    minimumSavingsPercent: 1
  });
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

function priceHistoryRangeBadgesFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const emptyWindows = historyWindowDefinitions.map((window) => ({
    ...window,
    observationCount: 0,
    lowValueLabel: 'Not reported',
    highValueLabel: 'Not reported',
    volatilityBandLowerLabel: 'Not reported',
    volatilityBandUpperLabel: 'Not reported',
    volatilityBandCopy: 'No chart band is available without dated observations.',
    lowObservedAt: null as string | null,
    highObservedAt: null as string | null,
    canClaimLowestInWindow: false,
    claimLabel: 'observed range withheld',
    detailCopy: 'No dated observation tape is available for this range.'
  }));

  if ('lowestPrice' in product || product.observations.length === 0) {
    return {
      available: false,
      caveat: 'Lowest/highest range badges are withheld because this source has no dated OpenPrices observation tape.',
      windows: emptyWindows
    };
  }

  const latest = latestObservationFor(product);
  const latestObservedAt = latest?.date ?? product.lastObservedAt;
  const latestTime = Date.parse(`${latestObservedAt}T00:00:00.000Z`);
  const observations = product.observations
    .map((observation) => ({
      observedAt: observation.date,
      observedTime: Date.parse(`${observation.date}T00:00:00.000Z`),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime))
    .sort((a, b) => a.observedTime - b.observedTime);
  const sourceConfidence = clamp(product.observationCount / 30, 0, 1);
  const chartObservations = observations.map((observation) => ({
    observedAt: `${observation.observedAt}T00:00:00.000Z`,
    price: observation.price,
    storeId: 'openprices-community',
    storeName: 'OpenPrices community',
    sourceType: 'online' as const,
    confidence: sourceConfidence
  }));

  const windows = historyWindowDefinitions.map((window) => {
    const windowStart = latestTime - window.rangeDays * 24 * 60 * 60 * 1000;
    const windowPoints = observations.filter((observation) => observation.observedTime >= windowStart && observation.observedTime <= latestTime);
    const chartResult = buildPriceChartSeries({
      observations: chartObservations,
      asOf: `${latestObservedAt}T00:00:00.000Z`,
      rangeDays: window.rangeDays,
      markerLimitPerSeries: 0
    });
    const latestChartPoint = chartResult.series
      .flatMap((series) => series.points)
      .sort((a, b) => a.time.localeCompare(b.time))
      .at(-1);
    const chartBand = latestChartPoint ? observedChartBandForPoint(latestChartPoint) : null;

    if (windowPoints.length === 0) {
      return {
        ...window,
        observationCount: 0,
        lowValueLabel: 'Not reported',
        highValueLabel: 'Not reported',
        volatilityBandLowerLabel: 'Not reported',
        volatilityBandUpperLabel: 'Not reported',
        volatilityBandCopy: 'No dated OpenPrices observations fall inside this chart window, so no observed chart band is shown.',
        lowObservedAt: null,
        highObservedAt: null,
        canClaimLowestInWindow: false,
        claimLabel: 'observed range withheld',
        detailCopy: 'No dated OpenPrices observations fall inside this range.'
      };
    }

    const lowPoint = windowPoints.reduce((best, point) => (point.price < best.price ? point : best));
    const highPoint = windowPoints.reduce((best, point) => (point.price > best.price ? point : best));
    const disclosure = summarizePriceHistoryConfidence({
      rangeDays: window.rangeDays,
      firstObservedAt: `${windowPoints[0]!.observedAt}T00:00:00.000Z`,
      lastObservedAt: `${windowPoints.at(-1)!.observedAt}T00:00:00.000Z`,
      observationCount: windowPoints.length,
      sourceTypesIncluded: ['online'],
      expectedSourceTypes: ['shelf', 'online', 'flyer'],
      productScopeKnown: true,
      storeScopeKnown: false
    });

    return {
      ...window,
      observationCount: windowPoints.length,
      lowValueLabel: formatSek(lowPoint.price),
      highValueLabel: formatSek(highPoint.price),
      volatilityBandLowerLabel: chartBand ? formatSek(chartBand.lower) : 'Not reported',
      volatilityBandUpperLabel: chartBand ? formatSek(chartBand.upper) : 'Not reported',
      volatilityBandCopy: chartBand
        ? `Observed chart band around the latest ${window.chartLabel} point from buildPriceChartSeries; this lower/upper range is not a forecast.`
        : 'No chart point is available for an observed lower/upper band.',
      lowObservedAt: lowPoint.observedAt,
      highObservedAt: highPoint.observedAt,
      canClaimLowestInWindow: disclosure.canClaimLowestInWindow,
      claimLabel: disclosure.canClaimLowestInWindow ? `lowest in observed ${window.rangeDays}-day window` : 'observed range only',
      detailCopy: disclosure.detailCopy
    };
  });

  return {
    available: windows.some((window) => window.observationCount > 0),
    caveat: 'Every low/high badge is calculated only from dated OpenPrices observations. Missing shelf, flyer, and member prices keep claims labelled as observed ranges.',
    windows
  };
}

function observedChartBandForPoint(point: { value: number; confidence: number }) {
  const confidence = clamp(point.confidence, 0, 1);
  const margin = Math.max(0.03, (1 - confidence) * 0.18);
  return {
    lower: Math.max(0, Math.round((point.value * (1 - margin) + Number.EPSILON) * 100) / 100),
    upper: Math.round((point.value * (1 + margin) + Number.EPSILON) * 100) / 100
  };
}

function priceVsUsualSignalFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product || product.observations.length < 3) {
    return {
      available: false,
      title: 'Not enough dated observations',
      signalLabel: 'vs usual signal withheld',
      currentPriceLabel: 'Not reported',
      typicalPriceLabel: 'Not reported',
      historyPercentile: null as number | null,
      belowTypicalPercent: null as number | null,
      aboveTypicalPercent: null as number | null,
      observationCount: 0,
      detail: "Not enough dated observations exist to compare the current price with the product's own observed 1-year history."
    };
  }

  const latest = latestObservationFor(product);
  const latestObservedAt = latest?.date ?? product.lastObservedAt;
  const latestTime = Date.parse(`${latestObservedAt}T00:00:00.000Z`);
  const oneYearAgo = latestTime - 365 * 24 * 60 * 60 * 1000;
  const windowPoints = product.observations
    .map((observation) => ({
      observedAt: observation.date,
      observedTime: Date.parse(`${observation.date}T00:00:00.000Z`),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && observation.observedTime >= oneYearAgo && observation.observedTime <= latestTime)
    .sort((a, b) => a.observedTime - b.observedTime);

  if (!latest || windowPoints.length < 3) {
    return {
      available: false,
      title: 'Not enough dated observations',
      signalLabel: 'vs usual signal withheld',
      currentPriceLabel: latest ? formatSek(latest.price) : 'Not reported',
      typicalPriceLabel: 'Not reported',
      historyPercentile: null,
      belowTypicalPercent: null,
      aboveTypicalPercent: null,
      observationCount: windowPoints.length,
      detail: 'Not enough dated observations fall inside the 1-year window, so GroceryView does not infer a usual price.'
    };
  }

  const prices = windowPoints.map((point) => point.price);
  const typicalPrice = medianFor(prices);
  const currentPrice = latest.price;
  const historyPercentile = percentileForPrice(prices, currentPrice);
  const belowTypicalPercent = typicalPrice && typicalPrice > 0 ? clamp(((typicalPrice - currentPrice) / typicalPrice) * 100, 0, 100) : 0;
  const aboveTypicalPercent = typicalPrice && typicalPrice > 0 ? clamp(((currentPrice - typicalPrice) / typicalPrice) * 100, 0, 100) : 0;
  const signalLabel = belowTypicalPercent > 0
    ? `${formatPct(belowTypicalPercent)} below typical`
    : aboveTypicalPercent > 0
      ? `${formatPct(aboveTypicalPercent)} above typical`
      : 'in line with typical';

  return {
    available: true,
    title: 'vs usual signal',
    signalLabel,
    currentPriceLabel: formatSek(currentPrice),
    typicalPriceLabel: formatSek(typicalPrice),
    historyPercentile,
    belowTypicalPercent,
    aboveTypicalPercent,
    observationCount: windowPoints.length,
    detail: `Current price is at the observed-history percentile ${formatPct(historyPercentile)} versus the product's own observed 1-year history. No forecast or seasonal prediction is shown.`
  };
}

function priceTypicalRangeBandFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product || product.observations.length < 5) {
    return {
      available: false,
      title: 'Not enough dated observations',
      rangePositionLabel: 'typical range withheld',
      typicalRangeLabel: 'Not reported',
      volatilityBandLabel: 'Not reported',
      volatilityPercentLabel: 'Not reported',
      currentPriceLabel: 'Not reported',
      medianPriceLabel: 'Not reported',
      observationCount: 0,
      detail: "Not enough dated observations exist to calculate a typical range or volatility band from the product's own observed 1-year price tape."
    };
  }

  const latest = latestObservationFor(product);
  const latestObservedAt = latest?.date ?? product.lastObservedAt;
  const latestTime = Date.parse(`${latestObservedAt}T00:00:00.000Z`);
  const oneYearAgo = latestTime - 365 * 24 * 60 * 60 * 1000;
  const windowPoints = product.observations
    .map((observation) => ({
      observedAt: observation.date,
      observedTime: Date.parse(`${observation.date}T00:00:00.000Z`),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && observation.observedTime >= oneYearAgo && observation.observedTime <= latestTime)
    .sort((a, b) => a.observedTime - b.observedTime);

  if (!latest || windowPoints.length < 5) {
    return {
      available: false,
      title: 'Not enough dated observations',
      rangePositionLabel: 'typical range withheld',
      typicalRangeLabel: 'Not reported',
      volatilityBandLabel: 'Not reported',
      volatilityPercentLabel: 'Not reported',
      currentPriceLabel: latest ? formatSek(latest.price) : 'Not reported',
      medianPriceLabel: 'Not reported',
      observationCount: windowPoints.length,
      detail: 'Not enough dated observations fall inside the 1-year window, so GroceryView does not render a typical range or volatility band.'
    };
  }

  const prices = windowPoints.map((point) => point.price);
  const typicalLow = quantileFor(prices, 0.25);
  const typicalHigh = quantileFor(prices, 0.75);
  const medianPrice = medianFor(prices);
  const standardDeviation = standardDeviationFor(prices);
  const observedLow = Math.min(...prices);
  const observedHigh = Math.max(...prices);

  if (typicalLow === null || typicalHigh === null || medianPrice === null || standardDeviation === null) {
    return {
      available: false,
      title: 'Not enough dated observations',
      rangePositionLabel: 'typical range withheld',
      typicalRangeLabel: 'Not reported',
      volatilityBandLabel: 'Not reported',
      volatilityPercentLabel: 'Not reported',
      currentPriceLabel: latest ? formatSek(latest.price) : 'Not reported',
      medianPriceLabel: 'Not reported',
      observationCount: windowPoints.length,
      detail: 'The dated observation tape could not produce finite range statistics, so GroceryView withholds the typical range.'
    };
  }

  const volatilityLow = clamp(medianPrice - standardDeviation, observedLow, observedHigh);
  const volatilityHigh = clamp(medianPrice + standardDeviation, observedLow, observedHigh);
  const volatilityPercent = medianPrice > 0 ? clamp((standardDeviation / medianPrice) * 100, 0, 999) : 0;
  const currentPrice = latest.price;
  const rangePositionLabel = currentPrice < typicalLow
    ? `${formatPct(((typicalLow - currentPrice) / typicalLow) * 100)} below usual range`
    : currentPrice > typicalHigh
      ? `${formatPct(((currentPrice - typicalHigh) / typicalHigh) * 100)} above usual range`
      : 'inside usual range';
  const disclosure = summarizePriceHistoryConfidence({
    rangeDays: 365,
    firstObservedAt: `${windowPoints[0]!.observedAt}T00:00:00.000Z`,
    lastObservedAt: `${windowPoints.at(-1)!.observedAt}T00:00:00.000Z`,
    observationCount: windowPoints.length,
    sourceTypesIncluded: ['online'],
    expectedSourceTypes: ['shelf', 'online', 'flyer'],
    productScopeKnown: true,
    storeScopeKnown: false
  });

  return {
    available: true,
    title: 'Typical range / volatility band',
    rangePositionLabel,
    typicalRangeLabel: `${formatSek(typicalLow)}–${formatSek(typicalHigh)}`,
    volatilityBandLabel: `${formatSek(volatilityLow)}–${formatSek(volatilityHigh)}`,
    volatilityPercentLabel: formatPct(volatilityPercent),
    currentPriceLabel: formatSek(currentPrice),
    medianPriceLabel: formatSek(medianPrice),
    observationCount: windowPoints.length,
    detail: `Current price is ${rangePositionLabel}; usually ${formatSek(typicalLow)}–${formatSek(typicalHigh)} from the middle 50% of the product's own observed 1-year price tape. Volatility band uses median ± one standard deviation (${formatPct(volatilityPercent)}). No forecast or seasonal prediction is shown. ${disclosure.detailCopy}`
  };
}

function bestTimeToBuyCardsFor(product: NonNullable<ReturnType<typeof findProduct>>): PriceIntelligenceScoreCard[] {
  if ('lowestPrice' in product || product.observations.length < 3) return [];

  const latest = latestObservationFor(product);
  if (!latest) return [];

  const latestTime = Date.parse(`${latest.date}T00:00:00.000Z`);
  const windows = [
    { id: '30d', title: 'Short-term window', rangeDays: 30 },
    { id: '90d', title: 'Seasonal window', rangeDays: 90 },
    { id: '365d', title: 'Annual window', rangeDays: 365 }
  ];

  return windows
    .map((window) => {
      const windowStart = latestTime - window.rangeDays * 24 * 60 * 60 * 1000;
      const points = product.observations
        .map((observation) => ({
          observedAt: observation.date,
          observedTime: Date.parse(`${observation.date}T00:00:00.000Z`),
          price: observation.price
        }))
        .filter((observation) => Number.isFinite(observation.observedTime) && observation.observedTime >= windowStart && observation.observedTime <= latestTime)
        .sort((a, b) => a.observedTime - b.observedTime);

      if (points.length < 3) return null;

      const baseline = points[0]!;
      const latestPoint = points.at(-1)!;
      const prices = points.map((point) => point.price);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const medianPrice = medianFor(prices) ?? latestPoint.price;
      const volatility = standardDeviationFor(prices) ?? 0;
      const volatilityPercent = averagePrice > 0 ? (volatility / averagePrice) * 100 : 0;
      const trendSlopePercent = baseline.price > 0 ? ((latestPoint.price - baseline.price) / baseline.price) * 100 : 0;
      const belowMedianPercent = medianPrice > 0 ? ((medianPrice - latestPoint.price) / medianPrice) * 100 : 0;
      const score = Math.round(clamp(58 + belowMedianPercent * 2 - Math.max(trendSlopePercent, 0) * 1.2 - volatilityPercent * 0.9, 0, 100));
      const actionLabel = score >= 75 ? 'Buy now' : score >= 55 ? 'Watch closely' : 'Wait';

      return {
        id: window.id,
        title: window.title,
        score,
        scoreLabel: score >= 75 ? 'strong buy window' : score >= 55 ? 'fair buy window' : 'weak buy window',
        actionLabel,
        windowLabel: `${window.rangeDays}-day observed window`,
        trendSlopeLabel: formatPct(trendSlopePercent),
        volatilityLabel: formatPct(volatilityPercent),
        detail: `Latest price ${formatSek(latestPoint.price)} on ${latestPoint.observedAt}; score blends trend slope, median discount, and volatility from ${points.length} dated observations.`
      };
    })
    .filter((card): card is PriceIntelligenceScoreCard => card !== null);
}

function priceChangeEventLogFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product || product.observations.length < 2) {
    return {
      available: false,
      title: 'Not enough dated observations',
      priceChangeEvents: [],
      observationCount: 0,
      detail: 'Not enough dated observations exist to compare consecutive prices, so GroceryView withholds the price-change event log.'
    };
  }

  const orderedPoints = product.observations
    .map((observation) => ({
      observedAt: observation.date,
      observedTime: Date.parse(`${observation.date}T00:00:00.000Z`),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && Number.isFinite(observation.price))
    .sort((a, b) => a.observedTime - b.observedTime);

  if (orderedPoints.length < 2) {
    return {
      available: false,
      title: 'Not enough dated observations',
      priceChangeEvents: [],
      observationCount: orderedPoints.length,
      detail: 'Not enough dated observations have valid dates and prices, so GroceryView withholds the price-change event log.'
    };
  }

  const priceChangeEvents = orderedPoints
    .slice(1)
    .map((point, index) => {
      const previous = orderedPoints[index]!;
      const delta = point.price - previous.price;
      if (Math.abs(delta) < 0.01) return null;
      const direction = delta < 0 ? 'dropped' : 'rose';
      const absoluteDelta = Math.abs(delta);
      const changePercent = previous.price > 0 ? (absoluteDelta / previous.price) * 100 : 0;
      return {
        observedAt: point.observedAt,
        previousObservedAt: previous.observedAt,
        direction,
        fromPriceLabel: formatSek(previous.price),
        toPriceLabel: formatSek(point.price),
        changeValueLabel: formatSek(absoluteDelta),
        changePercentLabel: formatPct(changePercent),
        chartMarkerKey: `openprices-community:${point.observedAt}`,
        chartMarkerLabel: `Move ${formatPct(changePercent)}`,
        sentence: `Price ${direction} ${formatPct(changePercent)} on ${point.observedAt} from ${formatSek(previous.price)} to ${formatSek(point.price)}.`
      };
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
    .slice(0, 6);

  if (priceChangeEvents.length === 0) {
    return {
      available: false,
      title: 'No observed price changes',
      priceChangeEvents,
      observationCount: orderedPoints.length,
      detail: 'Consecutive dated observations did not change price, so GroceryView does not invent a price-change event.'
    };
  }

  return {
    available: true,
    title: 'price-change event log',
    priceChangeEvents,
    observationCount: orderedPoints.length,
    detail: `Every event compares consecutive dated observations from the product's own price tape. No forecast or seasonal prediction is shown.`
  };
}

function bestTimePredictionFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const observations: BestTimeToBuyObservation[] = 'lowestPrice' in product
    ? []
    : product.observations.map((observation) => ({
      observedAt: observation.date,
      price: observation.price
    }));

  return predictBestTimeToBuy({
    observations,
    asOf: 'lowestPrice' in product ? undefined : product.lastObservedAt,
    productName: product.name
  });
}

function bestTimeToBuyScoreCardsFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  if ('lowestPrice' in product || product.observations.length < 3) {
    return {
      cards: [] as PriceIntelligenceScoreCard[],
      summary: 'Best-time-to-buy scoring needs at least three dated OpenPrices observations before it can combine trend slope with volatility.',
      emptyState: 'Not enough dated OpenPrices observations exist to score likely buying windows for this product.'
    };
  }

  const orderedPoints = product.observations
    .map((observation) => ({
      observedAt: observation.date,
      observedTime: Date.parse(`${observation.date}T00:00:00.000Z`),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && Number.isFinite(observation.price))
    .sort((a, b) => a.observedTime - b.observedTime);

  if (orderedPoints.length < 3) {
    return {
      cards: [] as PriceIntelligenceScoreCard[],
      summary: 'Best-time-to-buy scoring needs at least three valid dated observations before rendering a score.',
      emptyState: 'The dated price tape is too sparse to score a buying window.'
    };
  }

  const latest = orderedPoints.at(-1)!;
  const prices = orderedPoints.map((point) => point.price);
  const medianPrice = medianFor(prices) ?? latest.price;
  const volatility = standardDeviationFor(prices) ?? 0;
  const volatilityPercent = medianPrice > 0 ? clamp((volatility / medianPrice) * 100, 0, 999) : 0;
  const scoreCardForWindow = (rangeDays: number, title: string): PriceIntelligenceScoreCard => {
    const windowStart = latest.observedTime - rangeDays * 24 * 60 * 60 * 1000;
    const windowPoints = orderedPoints.filter((point) => point.observedTime >= windowStart && point.observedTime <= latest.observedTime);
    const baseline = windowPoints[0] ?? orderedPoints[0]!;
    const trendSlopePercent = baseline.price > 0 ? ((latest.price - baseline.price) / baseline.price) * 100 : 0;
    const belowMedianPercent = medianPrice > 0 ? ((medianPrice - latest.price) / medianPrice) * 100 : 0;
    const score = Math.round(clamp(58 + belowMedianPercent * 2 - Math.max(trendSlopePercent, 0) * 1.2 - volatilityPercent * 0.9, 0, 100));
    const actionLabel = score >= 75 ? 'Buy now' : score >= 55 ? 'Watch closely' : 'Wait';
    const windowLabel = score >= 75 ? 'Likely best window: this week' : score >= 55 ? 'Likely window: next 1–2 weeks' : 'Wait for a better observed dip';

    return {
      id: `${rangeDays}-day-window`,
      title,
      score,
      scoreLabel: score >= 75 ? 'strong buy window' : score >= 55 ? 'fair buy window' : 'weak buy window',
      actionLabel,
      windowLabel,
      trendSlopeLabel: `${formatPct(trendSlopePercent)} over ${Math.max(1, windowPoints.length)} observed point(s)`,
      volatilityLabel: `${formatPct(volatilityPercent)} observed volatility`,
      detail: `Latest price ${formatSek(latest.price)} on ${latest.observedAt}; score combines trend slope, current price versus median ${formatSek(medianPrice)}, and volatility. No forecast is inferred.`
    };
  };

  return {
    cards: [
      scoreCardForWindow(30, '30-day buy window'),
      scoreCardForWindow(90, '90-day buy window'),
      scoreCardForWindow(365, '365-day buy window')
    ],
    summary: 'Likely optimal buying windows are scored from the product’s own dated OpenPrices trend slope and volatility, then labelled as buy, watch, or wait.',
    emptyState: 'Not enough dated OpenPrices observations exist to score likely buying windows for this product.'
  };
}

function priceMoveNotesFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const priceChangeLog = priceChangeEventLogFor(product);
  const sourceProvenance = 'lowestPrice' in product
    ? 'Willys/Hemköp current chain rows without dated move tape'
    : `${product.observationCount} OpenPrices observations · ${product.code}`;
  const guardrail = 'No news or retailer cause is inferred from the price move.';

  if (!priceChangeLog.available || 'lowestPrice' in product) {
    return {
      available: false,
      title: 'Why this price moved',
      priceMoveNotes: [],
      observationCount: priceChangeLog.observationCount,
      sourceProvenance,
      guardrail,
      detail: `${priceChangeLog.detail} GroceryView withholds the why note because there are not enough consecutive OpenPrices rows; no promotion or seasonality claim is made without source evidence.`
    };
  }

  const confidenceLabel = product.observationCount >= 12
    ? 'strong observed-tape confidence'
    : product.observationCount >= 4
      ? 'limited observed-tape confidence'
      : 'sparse observed-tape confidence';

  const priceMoveNotes = priceChangeLog.priceChangeEvents.slice(0, 4).map((event) => ({
    eventKey: `${event.previousObservedAt}-${event.observedAt}-${event.toPriceLabel}`,
    headline: `Why this price moved: observed ${event.direction} ${event.changePercentLabel}`,
    chartMarkerKey: event.chartMarkerKey,
    chartMarkerLabel: event.chartMarkerLabel,
    sourceProvenance,
    confidenceLabel,
    guardrail,
    note: `Consecutive OpenPrices rows moved from ${event.fromPriceLabel} on ${event.previousObservedAt} to ${event.toPriceLabel} on ${event.observedAt}. This note is linked to the ${event.chartMarkerLabel} chart marker for ${event.observedAt}; no promotion or seasonality claim is made without explicit source evidence.`
  }));

  return {
    available: priceMoveNotes.length > 0,
    title: 'Why this price moved',
    priceMoveNotes,
    observationCount: priceChangeLog.observationCount,
    sourceProvenance,
    guardrail,
    detail: 'Price-move notes are derived from the factual price-change event log and consecutive OpenPrices rows only. No news or retailer cause is inferred, and there is no promotion or seasonality claim without explicit source evidence.'
  };
}

function seasonalMonthlyAveragesFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const emptyMonthlySeasonalityRows: {
    monthLabel: (typeof monthLabels)[number];
    monthIndex: number;
    monthAverageLabel: string;
    monthObservationCount: number;
    yearCount: number;
    lowPriceLabel: string;
    highPriceLabel: string;
    detail: string;
  }[] = [];
  const withheld = (observationCount: number, observedMonthCount = 0) => ({
    available: false,
    title: 'Not enough dated observations',
    monthlySeasonalityRows: emptyMonthlySeasonalityRows,
    observedMonthCount,
    observationCount,
    detail: 'Not enough dated observations exist across multiple calendar months, so GroceryView withholds the seasonal-by-month view instead of inventing a historical monthly average.'
  });

  if ('lowestPrice' in product) return withheld(0);
  if (product.observations.length < 2) return withheld(product.observations.length);

  const monthBuckets = new Map<number, { prices: number[]; years: Set<number> }>();
  product.observations.forEach((observation) => {
    const observedTime = Date.parse(`${observation.date}T00:00:00.000Z`);
    if (!Number.isFinite(observedTime) || !Number.isFinite(observation.price)) return;
    const observedDate = new Date(observedTime);
    const monthIndex = observedDate.getUTCMonth();
    const year = observedDate.getUTCFullYear();
    const bucket = monthBuckets.get(monthIndex) ?? { prices: [], years: new Set<number>() };
    bucket.prices.push(observation.price);
    bucket.years.add(year);
    monthBuckets.set(monthIndex, bucket);
  });

  const monthlySeasonalityRows = [...monthBuckets.entries()]
    .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
    .map(([monthIndex, bucket]) => {
      const total = bucket.prices.reduce((sum, price) => sum + price, 0);
      const average = total / bucket.prices.length;
      const lowPrice = Math.min(...bucket.prices);
      const highPrice = Math.max(...bucket.prices);
      const monthLabel = monthLabels[monthIndex]!;
      const yearLabel = bucket.years.size === 1 ? 'year' : 'years';
      return {
        monthLabel,
        monthIndex,
        monthAverageLabel: formatSek(average),
        monthObservationCount: bucket.prices.length,
        yearCount: bucket.years.size,
        lowPriceLabel: formatSek(lowPrice),
        highPriceLabel: formatSek(highPrice),
        detail: `${monthLabel} historical monthly average is ${formatSek(average)} from ${bucket.prices.length} dated observations across ${bucket.years.size} observed ${yearLabel}; avg price per month uses only observed OpenPrices rows.`
      };
    });

  const observationCount = monthlySeasonalityRows.reduce((total, row) => total + row.monthObservationCount, 0);
  if (monthlySeasonalityRows.length < 2) {
    return {
      ...withheld(observationCount, monthlySeasonalityRows.length),
      detail: 'Not enough dated observations are spread across at least two calendar months, so GroceryView withholds the seasonal-by-month view.'
    };
  }

  return {
    available: true,
    title: 'seasonal-by-month view',
    monthlySeasonalityRows,
    observedMonthCount: monthlySeasonalityRows.length,
    observationCount,
    detail: `This seasonal-by-month view uses historical monthly average prices to show avg price per month across ${monthlySeasonalityRows.length} observed month buckets. No forecast or seasonal prediction is shown.`
  };
}

function seasonalSalePatternFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  return detectSeasonalSalePattern({
    productId: product.slug,
    productName: product.name,
    holiday: midsommarSeasonalHoliday,
    observations: 'lowestPrice' in product
      ? []
      : product.observations.map((observation) => ({
        observedAt: observation.date,
        price: observation.price
      }))
  });
}

function crossChainHistoryOverlayFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const emptyCrossChainOverlaySeries: {
    chainLabel: string;
    pointCount: number;
    latestPriceLabel: string;
    latestObservedAt: string | null;
    lowValueLabel: string;
    highValueLabel: string;
    lineStyle: string;
  }[] = [];
  const coverageRow = (chainLabel: string, latestPrice: number | null, detail: string) => ({
    chainLabel,
    pointCount: 0,
    latestPriceLabel: formatSek(latestPrice),
    latestObservedAt: null as string | null,
    lowValueLabel: 'Not reported',
    highValueLabel: 'Not reported',
    lineStyle: 'missing per-chain dated price tape',
    detail
  });

  if ('lowestPrice' in product) {
    const chainHistoryCoverageRows = chainPriceRows(product).map((row) =>
      coverageRow(row.chain, row.price, 'Current chain quote is visible, but this source has no per-chain dated price tape for a cross-chain history overlay.')
    );
    return {
      available: false,
      title: 'Not enough per-chain dated observations',
      crossChainOverlaySeries: emptyCrossChainOverlaySeries,
      chainHistoryCoverageRows,
      chainCount: chainHistoryCoverageRows.length,
      observationCount: 0,
      detail: 'Not enough per-chain dated observations exist for two or more chains, so GroceryView withholds the cross-chain history overlay. Current quotes are not backfilled into history. No forecast or synthetic chain history is shown.'
    };
  }

  const latest = latestObservationFor(product);
  const asOf = latest ? `${latest.date}T00:00:00.000Z` : undefined;
  const sourceConfidence = clamp(product.observationCount / 30, 0, 1);
  const overlayResult = buildPriceChartSeries({
    observations: product.observations.map((observation) => ({
      observedAt: `${observation.date}T00:00:00.000Z`,
      price: observation.price,
      storeId: 'openprices-community',
      storeName: 'OpenPrices community aggregate',
      sourceType: 'online' as const,
      confidence: sourceConfidence,
      provenanceLabel: `${product.observationCount} OpenPrices observations without chain attribution`
    })),
    ...(asOf ? { asOf } : {}),
    rangeDays: 365,
    markerLimitPerSeries: 4
  });
  const crossChainOverlaySeries = overlayResult.series.map((series) => {
    const latestPoint = [...series.points].sort((a, b) => a.time.localeCompare(b.time)).at(-1);
    const values = series.points.map((point) => point.value);
    return {
      chainLabel: series.storeName,
      pointCount: series.points.length,
      latestPriceLabel: latestPoint ? formatSek(latestPoint.value) : 'Not reported',
      latestObservedAt: latestPoint?.time ?? null,
      lowValueLabel: values.length ? formatSek(Math.min(...values)) : 'Not reported',
      highValueLabel: values.length ? formatSek(Math.max(...values)) : 'Not reported',
      lineStyle: series.lineStyle
    };
  });
  const chainHistoryCoverageRows = crossChainOverlaySeries.map((series) => ({
    ...series,
    detail: 'OpenPrices has dated price history here, but it is an aggregate community series without chain identity, so it cannot be used as a per-chain overlay.'
  }));
  const observationCount = crossChainOverlaySeries.reduce((total, series) => total + series.pointCount, 0);

  if (crossChainOverlaySeries.length < 2) {
    return {
      available: false,
      title: 'Not enough per-chain dated observations',
      crossChainOverlaySeries,
      chainHistoryCoverageRows,
      chainCount: crossChainOverlaySeries.length,
      observationCount,
      detail: 'Not enough per-chain dated observations exist for two or more chains. GroceryView renders the available dated tape as coverage evidence, but does not call it a cross-chain history overlay. No forecast or synthetic chain history is shown.'
    };
  }

  return {
    available: true,
    title: 'cross-chain history overlay',
    crossChainOverlaySeries,
    chainHistoryCoverageRows,
    chainCount: crossChainOverlaySeries.length,
    observationCount,
    detail: `cross-chain history overlay built with buildPriceChartSeries from ${crossChainOverlaySeries.length} per-chain dated price tape series. No forecast or synthetic chain history is shown.`
  };
}

function intraChainBranchSpreadFor(product: NonNullable<ReturnType<typeof findProduct>>) {
  const coverageRow = (chainLabel: string, visiblePrice: number | null, detail: string) => ({
    chainLabel,
    visiblePriceLabel: formatSek(visiblePrice),
    branchObservationCount: 0,
    cheapestBranchLabel: 'Not available',
    dearestBranchLabel: 'Not available',
    spreadLabel: 'Not calculated',
    confidenceLabel: 'confidence/coverage blocked',
    detail
  });

  if ('lowestPrice' in product) {
    const branchSpreadRows = chainPriceRows(product).map((row) =>
      coverageRow(
        row.chain,
        row.price,
        'Chain-wide catalogue price is visible, but no per-branch shelf observations are bundled for this product and chain.'
      )
    );

    return {
      available: false,
      title: 'intra-chain branch spread',
      statusLabel: 'Not enough per-branch shelf observations',
      branchSpreadRows,
      chainCount: branchSpreadRows.length,
      branchObservationCount: 0,
      cheapestBranchLabel: 'Not available',
      dearestBranchLabel: 'Not available',
      detail:
        'No branch spread is calculated from chain-wide catalogue prices. GroceryView needs per-branch shelf observations across the same chain before it can name a cheapest branch, dearest branch, box/violin distribution, or percent difference.'
    };
  }

  const branchSpreadRows = [
    coverageRow(
      'OpenPrices community aggregate',
      product.priceMedian,
      'OpenPrices has dated observations for this product, but the bundled web driver does not identify a verified chain branch for each observation.'
    )
  ];

  return {
    available: false,
    title: 'intra-chain branch spread',
    statusLabel: 'Not enough per-branch shelf observations',
    branchSpreadRows,
    chainCount: 0,
    branchObservationCount: 0,
    cheapestBranchLabel: 'Not available',
    dearestBranchLabel: 'Not available',
    detail:
      'No branch spread is calculated from aggregate OpenPrices observations without branch identity. GroceryView shows the coverage blocker instead of turning community medians into branch-price claims.'
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
  const packageText = productPackageText(product);
  const sampleNormalizedPrice = normalizeUnitPriceForPackageText(product.priceMedian, packageText);
  const comparableUnit = sampleNormalizedPrice?.comparableUnit;
  const formatTrendValue = (value: number) => comparableUnit ? formatComparableUnitPrice(value, comparableUnit) : formatSek(value);
  const priceChangeLog = priceChangeEventLogFor(product);
  const priceChangeMarkersByDate = new Map(
    priceChangeLog.priceChangeEvents.map((event) => [event.observedAt, event])
  );
  const observations = product.observations.map((observation) => {
    const priceChangeMarker = priceChangeMarkersByDate.get(observation.date);
    return {
      observedAt: `${observation.date}T00:00:00.000Z`,
      price: normalizeUnitPriceForPackageText(observation.price, packageText)?.value ?? observation.price,
      storeId: 'openprices-community',
      storeName: 'OpenPrices community',
      sourceType: 'online' as const,
      confidence: sourceConfidence,
      provenanceLabel: `${product.observationCount} OpenPrices observations · ${product.code}${comparableUnit ? ` · normalized to ${comparableUnit}` : ''}${priceChangeMarker ? ` · chartMarkerKey ${priceChangeMarker.chartMarkerKey}` : ''}`,
      ...(priceChangeMarker ? {
        markerType: 'price_change' as const,
        markerLabel: priceChangeMarker.chartMarkerLabel
      } : {})
    };
  });
  const shortTermForecast = buildShortTermPriceForecast({
    observations: observations.map((observation) => ({
      observedAt: observation.observedAt,
      price: observation.price
    })),
    horizonDays: 14
  });
  const forecastTerminalModel = {
    available: shortTermForecast.available,
    title: 'Short-term price forecast band',
    horizonLabel: shortTermForecast.available ? `next ${shortTermForecast.horizonDays} days` : 'forecast withheld',
    summary: shortTermForecast.available && shortTermForecast.points.length > 0
      ? `${shortTermForecast.trendLabel}; projected band ${formatTrendValue(shortTermForecast.points.at(-1)!.lowerBound)}–${formatTrendValue(shortTermForecast.points.at(-1)!.upperBound)}.`
      : shortTermForecast.summary,
    caveat: shortTermForecast.caveat,
    points: shortTermForecast.points
  };

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
      latestValueLabel: latestPoint ? formatTrendValue(latestPoint.value) : 'Not reported',
      latestObservedAt: latestPoint?.time,
      lowValueLabel: values.length ? formatTrendValue(Math.min(...values)) : 'Not reported',
      highValueLabel: values.length ? formatTrendValue(Math.max(...values)) : 'Not reported',
      series: result.series,
      forecast: forecastTerminalModel
    };
  });

  return {
    available: windows.some((window) => window.pointCount > 0),
    title: comparableUnit ? `Multi-timeframe OpenPrices tape · normalized per ${comparableUnit}` : 'Multi-timeframe OpenPrices tape',
    sourceLabel: comparableUnit ? `buildPriceChartSeries · OpenPrices community observations · normalized unit price per ${comparableUnit}` : 'buildPriceChartSeries · OpenPrices community observations',
    confidenceLabel: `${formatPct(sourceConfidence * 100)} chart confidence`,
    caveat: comparableUnit
      ? `Every plotted point comes from dated OpenPrices observations normalized by package size (${packageText}) to a unit price per ${comparableUnit}; missing shelf, flyer, and member prices are disclosed instead of inferred. The forecast band uses only recent observed price-event trends.`
      : 'Every plotted point comes from dated OpenPrices observations; missing shelf, flyer, and member prices are disclosed instead of inferred. The forecast band uses only recent observed price-event trends.',
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
  const primaryEvidenceCount = isChain ? chainPriceRows(product).length : product.observations.length;
  if (primaryEvidenceCount === 0) {
    const breadcrumbJsonLd = breadcrumbJsonLdFor(product);
    return (
      <PageShell>
        <FunnelStepBeacon step="product_view" />
        <script dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} type="application/ld+json" />
        <Eyebrow>{isChain ? 'Axfood chain product' : 'OpenPrices product'}</Eyebrow>
        <Card className="mt-6 border-dashed border-slate-300 bg-slate-50 text-center">
          <div aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            🛒
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">No verified product, deal, or store evidence yet for {product.name}</h1>
          <Link className="mt-4 inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" href="/products">
            Browse verified products while we wait for store data.
          </Link>
        </Card>
      </PageShell>
    );
  }
  const chainRows = isChain ? chainPriceRows(product) : [];
  const matchedChainProduct = isChain ? matchedChainProducts.find((candidate) => candidate.slug === product.slug) ?? product : null;
  const crossChainQuoteRows = matchedChainProduct ? crossChainQuoteRowsFor(matchedChainProduct) : [];
  const friendPriceSightings = isChain
    ? listFriendPriceSightingsForProductChains(product.slug, chainRows.map((row) => row.chain))
    : listFriendPriceSightingsForProduct(product.slug);
  const dealVerdict = dealScoreVerdictFor(product);
  const smartSwaps = smartSwapRecommendationsFor(product);
  const itemSubstitutions = itemSubstitutionSuggestionsFor(product);
  const priceHistoryBadge = priceHistoryBadgeFor(product);
  const priceHistoryRangeBadges = priceHistoryRangeBadgesFor(product);
  const priceVsUsualSignal = priceVsUsualSignalFor(product);
  const typicalRangeBand = priceTypicalRangeBandFor(product);
  const priceVsUsualHistoryPercentile = priceVsUsualSignal.historyPercentile;
  const priceTrackingInsight = priceVsUsualSignal.available && priceVsUsualHistoryPercentile !== null
    ? {
      statusLabel: priceVsUsualHistoryPercentile <= 25
        ? 'Low vs usual'
        : priceVsUsualHistoryPercentile >= 75
          ? 'High vs usual'
          : 'Typical vs usual',
      tone: priceVsUsualHistoryPercentile <= 25
        ? 'emerald'
        : priceVsUsualHistoryPercentile >= 75
          ? 'rose'
          : 'slate',
      confidence: priceVsUsualSignal.observationCount >= 12 ? 'high' as const : priceVsUsualSignal.observationCount >= 5 ? 'medium' as const : 'low' as const,
      detail: `Current price sits at the ${formatPct(priceVsUsualHistoryPercentile)} percentile of this product's own observed 1-year OpenPrices history. Low/typical/high labels use historical facts only, not a forecast.`
    }
    : null;
  const bestTimeToBuyCards = bestTimeToBuyCardsFor(product);
  const bestTimePrediction = bestTimePredictionFor(product);
  const priceChangeLog = priceChangeEventLogFor(product);
  const bestTimeToBuyScoreCards = bestTimeToBuyScoreCardsFor(product);
  const priceMoveNotes = priceMoveNotesFor(product);
  const monthlySeasonality = seasonalMonthlyAveragesFor(product);
  const seasonalSalePattern = seasonalSalePatternFor(product);
  const crossChainHistoryOverlay = crossChainHistoryOverlayFor(product);
  const intraChainBranchSpread = intraChainBranchSpreadFor(product);
  const priceChartTerminal = priceChartTerminalFor(product);
  const commodityComparison = commodityComparisonForProduct(product.slug);
  const localPriceStatistics = localPriceStatisticsForProduct({ slug: product.slug, name: product.name });
  const familyPackComparisons = matchedChainProduct
    ? familyPackComparisonsForProduct(matchedChainProduct, matchedChainProducts, labelFromSlug(matchedChainProduct.category))
    : [];
  const freshnessBadge = dataFreshnessBadges.find((badge) => badge.sourceKind === (isChain ? 'axfood' : 'openprices')) ?? dataFreshnessBadges[0]!;
  const chainSourceAttribution = crossChainQuoteRows.length > 0
    ? chainSourceAttributionFor(crossChainQuoteRows, freshnessBadge.freshnessLabel)
    : null;
  const productJsonLd = productJsonLdFor(product);
  const breadcrumbJsonLd = breadcrumbJsonLdFor(product);
  return (
    <PageShell>
      <FunnelStepBeacon step="product_view" />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} type="application/ld+json" />
      <Eyebrow>{isChain ? 'Axfood chain product' : 'OpenPrices product'}</Eyebrow>
      <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{product.name}</h1>
      <p className="mt-3 text-lg text-slate-700">{isChain ? product.brand : product.brands || 'Brand not reported'} · {isChain ? product.subline : product.quantity || 'Quantity not reported'}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          {product.image ? (
            <div className="relative mb-5 aspect-square w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50 shadow-inner">
              <Image
                alt={product.name}
                className="object-contain p-4"
                fill
                referrerPolicy="no-referrer"
                sizes="(min-width: 1024px) 38vw, 100vw"
                src={product.image}
              />
            </div>
          ) : (
            <div className="mb-5 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
              Product image not reported by the current verified source.
            </div>
          )}
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
      <BestTimeBadge prediction={bestTimePrediction} />
      {crossChainQuoteRows.length > 0 ? (
        <Card className="mt-6 overflow-hidden border-emerald-200 bg-emerald-50/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Cross-chain quote table</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Current prices by chain</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                Uses the real chainPriceRows / matchedChainProducts snapshot for this matched item. Rows include grocery, pharmacy, variety, cosmetics, ethnic-specialty, and health-food retailer types when the same SKU is present. Delta compares each current quote with the median of the displayed chain basket; unavailable or missing prices are not fabricated.
              </p>
            </div>
            <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm">
              Median {formatSek(crossChainQuoteRows[0]?.basketMedianPrice)}
            </p>
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-emerald-100 text-left text-sm">
              <thead className="bg-emerald-900 text-white">
                <tr>
                  <th className="px-4 py-3 font-black">Chain</th>
                  <th className="px-4 py-3 font-black">Current price</th>
                  <th className="px-4 py-3 font-black">Unit price</th>
                  <th className="px-4 py-3 font-black">Vs basket median</th>
                  <th className="px-4 py-3 font-black">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {crossChainQuoteRows.map((row) => (
                  <tr className={row.isCheapest ? 'bg-emerald-50' : 'bg-white'} key={row.chain}>
                    <td className="px-4 py-3 font-black text-slate-950">
                      {row.chain}
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.retailerTypeLabel}</span>
                      {row.isCheapest ? <span className="ml-2 rounded-full bg-emerald-800 px-2 py-1 text-xs text-white">cheapest</span> : null}
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-900">{formatSek(row.price)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.effectiveUnit ? formatComparableUnitPrice(row.effectiveUnitPrice, row.effectiveUnit) : `${row.priceText} · ${row.priceUnit}`}
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{counterPriceLabelFor(row)}</span>
                    </td>
                    <td className={`px-4 py-3 font-black ${row.deltaVsMedian && row.deltaVsMedian > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                      {formatSignedPct(row.deltaVsMedian)}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge
                        level={quoteConfidenceLevel(row, crossChainQuoteRows.length)}
                        label={row.isCheapest ? 'Cheapest verified quote' : 'Verified quote'}
                        sampleSize={crossChainQuoteRows.length}
                        verificationLabel={row.savings ? `saving ${formatSek(row.savings)}` : 'current chain row'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {chainSourceAttribution ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-black text-slate-900">{chainSourceAttribution.summary}</p>
                <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={chainSourceAttribution.coverageHref}>
                  View coverage
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {chainSourceAttribution.sourceRows.map((sourceRow) => (
                  <ConfidenceBadge
                    details={sourceRow.details}
                    key={sourceRow.chainLabel}
                    label={sourceRow.label}
                    level={sourceRow.level}
                    sampleSize={1}
                    verificationLabel={sourceRow.verificationLabel}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
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
      <FriendPriceSightings sightings={friendPriceSightings} />
      <div className="mt-6">
        <FamilyPackComparisonPanel
          comparisons={familyPackComparisons}
          emptyDetail="No larger or smaller same-category pack with parseable unit evidence is available for this product, so family-pack guidance stays withheld."
          intro="Compares this product against larger and smaller same-category Axfood rows using parsed pack size, total price, and normalized unit price. Storage notes describe source category constraints only."
          title="Family-pack and bulk comparison"
        />
      </div>
      <Card className="mt-6 border-teal-200 bg-teal-50/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-800">Product-level local stats</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Local price statistics links</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Finds matching GeoAreaSummary.productRows by product slug or normalized name and links to the city, district, or kommun statistics pages. Rows below the local coverage threshold keep prices withheld.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-teal-900 shadow-sm">
            {localPriceStatistics.available ? `${localPriceStatistics.rows.length} area${localPriceStatistics.rows.length === 1 ? '' : 's'}` : 'No local match'}
          </p>
        </div>
        {localPriceStatistics.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {localPriceStatistics.rows.map((row) => (
              <Link className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm transition hover:border-teal-700" href={row.href} key={`${row.scope}-${row.areaSlug}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">{row.scope} · {row.areaName}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{row.medianPriceLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">Range {row.rangeLabel}</p>
                <p className={row.isWithheld ? 'mt-3 rounded-xl bg-amber-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-amber-950' : 'mt-3 rounded-xl bg-teal-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-teal-950'}>
                  {row.coverageLabel}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{localPriceStatistics.summary}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
          {localPriceStatistics.summary} Minimum product coverage is {localPriceStatistics.minimumCoverage} observations per local area.
        </p>
      </Card>
      {commodityComparison ? (
        <Card className="mt-6 border-lime-200 bg-lime-50/70">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-800">Commodity / no-barcode price match</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Cheapest chain for this commodity</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                Calls compareCommodityUnitPrices for the canonical {commodityComparison.commodityName} commodity and compares only kr/{commodityComparison.comparableUnit} rows that clear sourceConfidence. Alias-matched loose produce and meat are labelled medium-confidence, never barcode-equivalent.
              </p>
            </div>
            <div className="rounded-[2rem] bg-white p-5 text-right shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">{commodityComparison.status}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{commodityComparison.cheapestChain?.chainName ?? 'Coverage blocked'}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{commodityComparison.coverage.chainCount} chain(s) · {commodityComparison.coverage.observationCount} evidence rows</p>
            </div>
          </div>
          {commodityComparison.status === 'priced' ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {commodityComparison.rows.map((row) => (
                <Link className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm transition hover:border-lime-700" href={`/products/${row.productId}`} key={`${row.chainId}-${row.productId}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">#{row.rank} · {row.chainName}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
                  <p className="mt-2 text-2xl font-black text-emerald-800">{formatComparableUnitPrice(row.unitPrice, row.comparableUnit)}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">sourceConfidence {formatPct(row.sourceConfidence * 100)} · save {formatPct(row.savingsVsNextPercent)} vs next chain</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{row.variant ?? 'Variant not reported'} {row.originCountry ? `· origin ${row.originCountry}` : ''}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">{commodityComparison.confidenceLabel}</p>
          )}
          <p className="mt-4 text-xs font-semibold text-slate-500">{commodityComparison.confidenceLabel}</p>
        </Card>
      ) : null}
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
            <div className="mt-3">
              <ConfidenceBadge
                level={dealVerdict.confidence >= 0.75 ? 'high' : dealVerdict.confidence >= 0.4 ? 'medium' : 'low'}
                label={`${dealVerdict.band.verdict} confidence`}
                verificationLabel={dealVerdict.evidence}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{dealVerdict.percentileLabel}</p>
          <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">confidence {formatPct(dealVerdict.confidence * 100)}</p>
          <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{dealVerdict.evidence}</p>
        </div>
      </Card>
      <PriceIntelligenceCard cards={bestTimeToBuyCards} />
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
      <PriceIntelligenceCard cards={bestTimeToBuyScoreCards.cards} emptyState={bestTimeToBuyScoreCards.emptyState} summary={bestTimeToBuyScoreCards.summary} />
      <Card className="mt-6 border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">Substitution trigger</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Item substitution suggestions</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Calls buildItemSubstitutionSuggestions when this item is out of stock or very expensive, returning up to 3 same-category alternatives with a lower current price.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-900">{itemSubstitutions.trigger.replaceAll('_', ' ')}</p>
        </div>
        {itemSubstitutions.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {itemSubstitutions.suggestions.map((suggestion) => (
              <Link className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:border-amber-700" href={`/items/${suggestion.productId}`} key={suggestion.productId}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Save {formatPct(suggestion.savingsPercent)}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{suggestion.productName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{formatSek(suggestion.currentPrice)} · {labelFromSlug(suggestion.category)}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{suggestion.reason}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">verified lower current price</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold text-amber-950">{itemSubstitutions.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold text-slate-600">{itemSubstitutions.guardrail}</p>
      </Card>
      <PriceChartTerminal chart={priceChartTerminal} />
      <Card className="mt-6 overflow-hidden border-cyan-200 bg-cyan-50/80">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800">cross-chain history overlay</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Per-chain dated price tape coverage</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Uses buildPriceChartSeries only when at least two chains have dated observations for the same product. No forecast or synthetic chain history is shown.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-right text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{crossChainHistoryOverlay.title}</p>
            <p className="mt-2 text-3xl font-black">{crossChainHistoryOverlay.chainCount} sources</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{crossChainHistoryOverlay.observationCount} dated points</p>
          </div>
        </div>
        {crossChainHistoryOverlay.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {crossChainHistoryOverlay.crossChainOverlaySeries.map((series) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${series.chainLabel}-${series.lineStyle}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{series.chainLabel}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{series.latestPriceLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{series.pointCount} points · lineStyle {series.lineStyle}</p>
                <p className="mt-2 text-sm font-bold text-slate-700">Range {series.lowValueLabel}–{series.highValueLabel}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {crossChainHistoryOverlay.chainHistoryCoverageRows.map((row) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${row.chainLabel}-${row.lineStyle}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{row.chainLabel}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{row.latestPriceLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{row.pointCount} dated points · {row.lineStyle}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{row.detail}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{crossChainHistoryOverlay.detail}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-sky-200 bg-sky-50/80">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-800">intra-chain branch spread</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Branch-level price distribution gate</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Requires per-branch shelf observations for the same product inside a chain before GroceryView shows cheapest/dearest branch claims.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-right text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">{intraChainBranchSpread.statusLabel}</p>
            <p className="mt-2 text-3xl font-black">{intraChainBranchSpread.chainCount} chains</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{intraChainBranchSpread.branchObservationCount} branch observations</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {intraChainBranchSpread.branchSpreadRows.map((row) => (
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${row.chainLabel}-${row.visiblePriceLabel}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">{row.chainLabel}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{row.visiblePriceLabel}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">{row.branchObservationCount} per-branch shelf observations</p>
              <p className="mt-2 text-sm font-bold text-slate-700">Cheapest branch: {row.cheapestBranchLabel}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Dearest branch: {row.dearestBranchLabel}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Spread: {row.spreadLabel}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{row.confidenceLabel}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{row.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{intraChainBranchSpread.detail}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-lime-200 bg-lime-50/80">
        <div className="mb-5 rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">Track-price insight</p>
              <h2 className={`mt-2 text-2xl font-black ${priceTrackingInsight?.tone === 'emerald' ? 'text-emerald-900' : priceTrackingInsight?.tone === 'rose' ? 'text-rose-900' : 'text-slate-950'}`}>
                {priceTrackingInsight?.statusLabel ?? 'Price insight withheld'}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                {priceTrackingInsight?.detail ?? 'GroceryView needs at least three dated observations for this product before calling the current price low, typical, or high vs usual.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              {priceTrackingInsight ? <ConfidenceBadge level={priceTrackingInsight.confidence} label={`${priceTrackingInsight.confidence} percentile confidence`} sampleSize={priceVsUsualSignal.observationCount} /> : null}
              <Link className="rounded-full bg-lime-800 px-4 py-2 text-sm font-black text-white hover:bg-lime-900" href={`/watchlist?trackPrice=${product.slug}`}>
                Track this price
              </Link>
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-800">vs usual signal</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Price vs the product&apos;s own observed 1-year history</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Compares the latest dated OpenPrices observation with the median observed price for this product only. No forecast or seasonal prediction is shown.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-right text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">{priceVsUsualSignal.title}</p>
            <p className="mt-2 text-3xl font-black">{priceVsUsualSignal.signalLabel}</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{priceVsUsualSignal.observationCount} observed points</p>
          </div>
        </div>
        {priceVsUsualSignal.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">Current: <span className="block text-lg font-black text-slate-950">{priceVsUsualSignal.currentPriceLabel}</span></p>
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">Typical: <span className="block text-lg font-black text-slate-950">{priceVsUsualSignal.typicalPriceLabel}</span></p>
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">observed-history percentile <span className="block text-lg font-black text-slate-950">{formatPct(priceVsUsualSignal.historyPercentile)}</span></p>
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">belowTypicalPercent <span className="block text-lg font-black text-emerald-800">{formatPct(priceVsUsualSignal.belowTypicalPercent)}</span></p>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-amber-950">{priceVsUsualSignal.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{priceVsUsualSignal.detail}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-violet-200 bg-violet-50/80">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">typical range tape</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Typical range / volatility band</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Uses only dated OpenPrices observations for this product. The usual range is the middle 50% of the product&apos;s own observed 1-year price tape; the volatility band is median ± one standard deviation.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-right text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">{typicalRangeBand.title}</p>
            <p className="mt-2 text-3xl font-black">{typicalRangeBand.rangePositionLabel}</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{typicalRangeBand.observationCount} observed points</p>
          </div>
        </div>
        {typicalRangeBand.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">Current: <span className="block text-lg font-black text-slate-950">{typicalRangeBand.currentPriceLabel}</span></p>
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">Typical range: <span className="block text-lg font-black text-slate-950">{typicalRangeBand.typicalRangeLabel}</span></p>
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">Volatility band: <span className="block text-lg font-black text-slate-950">{typicalRangeBand.volatilityBandLabel}</span></p>
            <p className="rounded-2xl bg-white/90 p-4 text-sm font-bold text-slate-700">volatilityPercentLabel <span className="block text-lg font-black text-violet-900">{typicalRangeBand.volatilityPercentLabel}</span></p>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-amber-950">{typicalRangeBand.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{typicalRangeBand.detail}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-orange-200 bg-orange-50/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-800">price-change event log</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Observed price-change events</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Compares consecutive dated observations only, then records the factual moves that dropped or rose. No forecast or seasonal prediction is shown.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-900">{priceChangeLog.observationCount} dated points</p>
        </div>
        {priceChangeLog.available ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {priceChangeLog.priceChangeEvents.map((event) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${event.previousObservedAt}-${event.observedAt}-${event.toPriceLabel}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">{event.direction} · {event.changePercentLabel}</p>
                <p className="mt-2 text-lg font-black text-slate-950">{event.sentence}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{event.previousObservedAt} → {event.observedAt} · {event.fromPriceLabel} → {event.toPriceLabel}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">changePercentLabel {event.changePercentLabel} · change {event.changeValueLabel}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-amber-950">{priceChangeLog.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{priceChangeLog.detail}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-rose-200 bg-rose-50/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-800">price move notes</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Why this price moved</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Explains only what changed between consecutive OpenPrices rows. {priceMoveNotes.guardrail} There is no promotion or seasonality claim without explicit source evidence.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-rose-900">{priceMoveNotes.observationCount} dated points</p>
        </div>
        {priceMoveNotes.available ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {priceMoveNotes.priceMoveNotes.map((note) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={note.eventKey}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">{note.confidenceLabel}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{note.headline}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{note.note}</p>
                <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-black uppercase tracking-[0.16em] text-rose-900" data-price-move-chart-marker={note.chartMarkerKey}>
                  linked chart marker {note.chartMarkerLabel} · {note.chartMarkerKey}
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">sourceProvenance {note.sourceProvenance}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{note.guardrail}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-amber-950">{priceMoveNotes.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{priceMoveNotes.detail} sourceProvenance {priceMoveNotes.sourceProvenance}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-amber-200 bg-amber-50/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">seasonal-by-month view</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Historical monthly average price</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Groups dated OpenPrices observations by calendar month and shows the avg price per month. No forecast or seasonal prediction is shown.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-900">
            {monthlySeasonality.observationCount} dated points · {monthlySeasonality.observedMonthCount} months
          </p>
        </div>
        {monthlySeasonality.available ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {monthlySeasonality.monthlySeasonalityRows.map((month) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${month.monthIndex}-${month.monthLabel}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{month.monthLabel}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{month.monthAverageLabel}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  monthObservationCount {month.monthObservationCount} · {month.yearCount} observed {month.yearCount === 1 ? 'year' : 'years'}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-700">Observed range {month.lowPriceLabel}–{month.highPriceLabel}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{month.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-amber-950">{monthlySeasonality.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">{monthlySeasonality.detail}</p>
      </Card>
      <Card className="mt-6 overflow-hidden border-lime-200 bg-lime-50/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-800">seasonalSalePattern · Midsommar</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Holiday sale pattern detection</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              {seasonalSalePattern.available
                ? 'Likely on sale before Midsommar, based on repeated historical holiday-window discounts.'
                : seasonalSalePattern.detail}
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-lime-900">
            {seasonalSalePattern.qualifiedSeasonCount}/{seasonalSalePattern.holiday.minSeasonCount} discounted windows · {seasonalSalePattern.windowLabel}
          </p>
        </div>
        {seasonalSalePattern.available ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">{seasonalSalePattern.hint}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatPct(seasonalSalePattern.averageDiscountPercent)} avg historical discount</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Best holiday-window price: {formatSek(seasonalSalePattern.bestObservedPrice)} on {seasonalSalePattern.bestObservedAt ?? 'Not reported'}.
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{seasonalSalePattern.evidenceLabel}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {seasonalSalePattern.evidence.map((row) => (
                <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={`${row.year}-${row.observedAt}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">{row.year} · {row.daysBeforeHoliday} days before Midsommar</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{formatSek(row.price)}</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">{formatPct(row.discountPercent)} below non-holiday median</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Observed at {row.observedAt}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-lime-950">{seasonalSalePattern.detail}</p>
        )}
        <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
          Requires explicit historical holiday-window price evidence before showing a hint. {seasonalSalePattern.guardrail}
        </p>
      </Card>
      <Card className="mt-6 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-700">Historic range tape</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Lowest / highest in 30 / 90 / 365 days</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Calls summarizePriceHistoryConfidence for every range before rendering a low/high claim. The badges are factual observations, not forecasts.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900">{priceHistoryRangeBadges.windows.length} windows</p>
        </div>
        {priceHistoryRangeBadges.available ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {priceHistoryRangeBadges.windows.map((window) => (
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm" key={window.label}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{window.title}</p>
                <div className="mt-3 grid gap-2">
                  <p className="text-sm font-bold text-slate-600">
                    Low: <span className="text-lg font-black text-emerald-800">{window.lowValueLabel}</span>
                    {window.lowObservedAt ? ` · ${window.lowObservedAt}` : ''}
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    High: <span className="text-lg font-black text-rose-800">{window.highValueLabel}</span>
                    {window.highObservedAt ? ` · ${window.highObservedAt}` : ''}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="rounded-xl bg-sky-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-sky-900">
                      Band lower <span className="block text-base text-slate-950">{window.volatilityBandLowerLabel}</span>
                    </p>
                    <p className="rounded-xl bg-sky-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-sky-900">
                      Band upper <span className="block text-base text-slate-950">{window.volatilityBandUpperLabel}</span>
                    </p>
                  </div>
                  <p className="rounded-xl bg-indigo-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-indigo-900">
                    {window.observationCount} points · canClaimLowestInWindow {String(window.canClaimLowestInWindow)}
                  </p>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{window.claimLabel} · {window.detailCopy}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{window.volatilityBandCopy}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{priceHistoryRangeBadges.caveat}</p>
        )}
        <p className="mt-4 text-xs font-semibold text-slate-500">{priceHistoryRangeBadges.caveat}</p>
      </Card>
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
            {chainRows.map((row) => (
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
