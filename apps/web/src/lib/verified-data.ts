import { buildFacetedProductSearch, type RealCatalogSearchPriceRow } from '@groceryview/api';
import { COMMODITIES, STAPLE_BASKET, SUPPORTED_PRICE_DOMAINS, type Commodity, type ComparableUnit } from '@groceryview/catalog';
import { buildPriceChartSeries, buildWatchlistAlerts, calculateChainPriceIndex, calculateDealScore, compareCommodityUnitPrices, planBasketTripCost, planCommunityReportAbuseControls, planDietarySubstitutionAssistant, planHumanReviewAssignments, planHumanReviewQueue, planRecurringBasketDigest, recommendSmartSwaps, suggestFriendSharedDeals, summarizeCategoryDealLeaders, summarizePriceHistory, type BrandTier, type ChainPriceObservation, type CommodityPriceObservation, type PriceChartObservation, type ProductMatchInput, type WatchlistItem, type WatchlistPriceType, type WatchlistProductSnapshot } from '@groceryview/core';
import { majorSwedishGroceryRetailerTypeCoverage, retailerTypes, summarizeTrendingProductPriceChanges, type TrendingPriceChangePoint } from '@groceryview/db';
import { planReceiptAliasGrowth } from '@groceryview/scanning';
import { axfoodProducts } from './axfood-products';
import { icaStorePromotionSourceSummary } from './ingested/ica-source-summary';
import { icaReklambladOffers as staticIcaReklambladOffers, icaReklambladSource as staticIcaReklambladSource } from './ingested/ica-reklamblad';
import { mathemProducts as staticMathemProducts, mathemSource as staticMathemSource } from './ingested/mathem';
import { openFoodFactsCatalog, openFoodFactsSafetyProfile, type AllergenSafetyPreference, type DietarySafetyPreference, type OpenFoodFactsSafetyProfile } from './openfoodfacts-catalog';
import { lidlStoreOffers as staticLidlStoreOffers, lidlSource as staticLidlSource } from './ingested/lidl';
import { matpriskollenOffers as staticMatpriskollenOffers } from './ingested/matpriskollen';
import { verifiedFuelPriceObservations, verifiedFuelPriceSource } from './fuel-prices';
import {
  dbSiteIcaReklambladOffers,
  dbSiteIcaReklambladSource,
  dbSiteLidlSource,
  dbSiteLidlStoreOffers,
  dbSiteMathemProducts,
  dbSiteMathemSource,
  dbSiteMatpriskollenOffers,
  dbSiteMatpriskollenSource
} from './generated/db-site-ingested-overrides';
import { dbSiteHomepageTrendingPriceChanges } from './generated/db-site-trending-price-changes';
import { categoryLabels, pricedProducts } from './openprices-products';
import { classifyRecentPriceVariance } from './price-intelligence';
import { allergenRiskBadgesForText, searchExplanationBadgesForProduct, type SearchExplanationBadge } from './search-filters';
import { osmStores } from './osm-stores';
import {
  currencyFromObservation,
  defaultLocale,
  formatLocalizedDate,
  formatLocalizedMoney,
  formatSourceUnitPriceText,
  formatLocalizedUnitPrice,
  supportedCurrencies,
  unknownUnitPriceLabel
} from './i18n';

const icaReklambladOffers = dbSiteIcaReklambladOffers.length > 0 ? dbSiteIcaReklambladOffers : staticIcaReklambladOffers;
const icaReklambladSource = dbSiteIcaReklambladOffers.length > 0 ? dbSiteIcaReklambladSource : staticIcaReklambladSource;
const mathemProducts = dbSiteMathemProducts.length > 0 ? dbSiteMathemProducts : staticMathemProducts;
const mathemSource = dbSiteMathemProducts.length > 0 ? dbSiteMathemSource : staticMathemSource;
const lidlStoreOffers = dbSiteLidlStoreOffers.length > 0 ? dbSiteLidlStoreOffers : staticLidlStoreOffers;
const lidlSource = dbSiteLidlStoreOffers.length > 0 ? dbSiteLidlSource : staticLidlSource;
const matpriskollenOffers = dbSiteMatpriskollenOffers.length > 0 ? dbSiteMatpriskollenOffers : staticMatpriskollenOffers;

export const snapshot = {
  retrievedLabel: '20-21 May 2026',
  axfoodSource: 'Willys and Hemköp public search endpoints',
  icaStorePromotionsSource: 'ICA handlaprivatkund store-scoped promotions endpoints',
  openPricesSource: 'OpenPrices / Open Food Facts SEK observations',
  openFoodFactsCatalogSource: 'OpenFoodFacts Sweden metadata catalog',
  osmSource: 'OpenStreetMap Overpass Sweden extract'
};

const observedSnapshotCurrency = currencyFromObservation({ currency: 'SEK' });
const pct = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });

export function formatSek(value: number | null | undefined) {
  return formatLocalizedMoney(value, { locale: defaultLocale, currency: observedSnapshotCurrency });
}

export function formatPct(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? `${pct.format(value)}%` : 'Not reported';
}

export function labelFromSlug(slug: string) {
  return categoryLabels[slug] ?? slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function unitAmountFromPackage(packageText: string): { amount: number; unit: 'kg' | 'l' | 'st'; packageLabel: string } | null {
  const normalized = packageText.replace(',', '.').toLowerCase();
  const multiplied = normalized.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl|st)\b/);
  if (multiplied) {
    const count = Number(multiplied[1]);
    const each = Number(multiplied[2]);
    const unit = multiplied[3];
    if (Number.isFinite(count) && Number.isFinite(each) && count > 0 && each > 0) {
      if (unit === 'kg') return { amount: count * each, unit: 'kg', packageLabel: multiplied[0] };
      if (unit === 'g') return { amount: (count * each) / 1000, unit: 'kg', packageLabel: multiplied[0] };
      if (unit === 'l') return { amount: count * each, unit: 'l', packageLabel: multiplied[0] };
      if (unit === 'cl') return { amount: (count * each) / 100, unit: 'l', packageLabel: multiplied[0] };
      if (unit === 'ml') return { amount: (count * each) / 1000, unit: 'l', packageLabel: multiplied[0] };
      return { amount: count * each, unit: 'st', packageLabel: multiplied[0] };
    }
  }

  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl|st)\b/g)];
  const match = matches.at(-1);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(value) || value <= 0) return null;
  if (unit === 'kg') return { amount: value, unit: 'kg', packageLabel: match[0] };
  if (unit === 'g') return { amount: value / 1000, unit: 'kg', packageLabel: match[0] };
  if (unit === 'l') return { amount: value, unit: 'l', packageLabel: match[0] };
  if (unit === 'cl') return { amount: value / 100, unit: 'l', packageLabel: match[0] };
  if (unit === 'ml') return { amount: value / 1000, unit: 'l', packageLabel: match[0] };
  return { amount: value, unit: 'st', packageLabel: match[0] };
}

export function normalizeComparableUnitPrice(totalPrice: number, packageText: string) {
  const packageAmount = unitAmountFromPackage(packageText);
  if (!packageAmount || !Number.isFinite(totalPrice) || totalPrice <= 0) return null;
  return {
    packageLabel: packageAmount.packageLabel,
    packageUnits: packageAmount.amount,
    comparableUnit: packageAmount.unit,
    unitLabel: `kr/${packageAmount.unit}`,
    unitPrice: totalPrice / packageAmount.amount,
    unitSortPrice: totalPrice / packageAmount.amount
  };
}

function adaptiveProductKind(category: string) {
  return ['frukt-och-gront', 'produce'].includes(category) ? 'commodity' as const : 'branded' as const;
}

function cheapestUnitBadge(unitPrice: number | null, peerUnitPrices: number[], unitLabel: string) {
  if (unitPrice === null || peerUnitPrices.length < 2) return null;
  const cheapestPeer = Math.min(...peerUnitPrices);
  if (!Number.isFinite(cheapestPeer) || unitPrice > cheapestPeer + 0.01) return null;
  const average = peerUnitPrices.reduce((sum, value) => sum + value, 0) / peerUnitPrices.length;
  if (!Number.isFinite(average) || average <= unitPrice) return null;
  const advantage = ((average - unitPrice) / average) * 100;
  if (advantage < 3) return null;
  return `Best unit value · 🟢 -${formatPct(advantage)}/${unitLabel.replace('kr/', '')} vs ${peerUnitPrices.length}-chain avg`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

function dailyObservedPricePoints(product: (typeof pricedProducts)[number]) {
  const pricesByDate = product.observations.reduce<Record<string, number[]>>((ledger, observation) => {
    if (!observation.date || !Number.isFinite(observation.price)) return ledger;
    ledger[observation.date] = [...(ledger[observation.date] ?? []), observation.price];
    return ledger;
  }, {});

  return Object.entries(pricesByDate).map(([date, prices]) => ({
    observedAt: `${date}T00:00:00.000Z`,
    price: median(prices),
    storeId: 'openprices-community'
  }));
}

function priceDropBadgeLabel(changePercent: number): string {
  return `${Math.round(changePercent)}%`;
}

function priceDropFromThirtyDayHistory(product: (typeof productUniverse)[number]) {
  if (!isOpenPricesProduct(product)) return null;
  const priceHistory = dailyObservedPricePoints(product)
    .sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt));
  const latest = priceHistory[priceHistory.length - 1];
  if (!latest) return null;

  const anchorDate = new Date(Date.parse(latest.observedAt) - thirtyDaysMs);
  const anchor = [...priceHistory]
    .reverse()
    .find((point) => Date.parse(point.observedAt) <= anchorDate.getTime());
  if (!anchor || anchor.price <= 0) return null;

  const currentPrice = latest.price;
  const price30dAgo = anchor.price;
  const changePercent = ((currentPrice - price30dAgo) / price30dAgo) * 100;
  if (changePercent >= -5) return null;

  return {
    percent: changePercent,
    badge: priceDropBadgeLabel(changePercent),
    anchorDate: anchor.observedAt.slice(0, 10),
    label: `${priceDropBadgeLabel(changePercent)} 30-day price drop from price_history`
  };
}

const compareOverlayProducts = [...pricedProducts]
  .filter((product) => product.observations.length >= 4)
  .sort((left, right) => {
    const observationDelta = right.observationCount - left.observationCount;
    if (observationDelta !== 0) return observationDelta;
    return right.lastObservedAt.localeCompare(left.lastObservedAt);
  })
  .slice(0, 2);

function compareOverlayObservationsFor(product: (typeof pricedProducts)[number]): PriceChartObservation[] {
  return product.observations
    .filter((observation) => observation.date && Number.isFinite(observation.price))
    .map((observation) => ({
      observedAt: `${observation.date}T00:00:00.000Z`,
      price: observation.price,
      storeId: `openprices-${product.slug}`,
      storeName: product.name,
      sourceType: 'online',
      confidence: product.observationCount >= 8 ? 0.78 : 0.62,
      provenanceLabel: `${snapshot.openPricesSource} · barcode ${product.code}`,
      markerType: 'source_warning',
      markerLabel: product.brands || product.name
    }));
}

const compareOverlayChartSeries = buildPriceChartSeries({
  observations: compareOverlayProducts.flatMap(compareOverlayObservationsFor),
  asOf: '2026-05-22T00:00:00.000Z',
  rangeDays: 365,
  markerLimitPerSeries: 3
});

export const compareOverlayChart = {
  title: 'Compare-overlay chart',
  subtitle: 'Two product tickers overlaid from the OpenPrices dated observation tape.',
  windowStart: compareOverlayChartSeries.windowStart,
  windowEnd: compareOverlayChartSeries.windowEnd,
  overlayProducts: compareOverlayProducts.map((product) => ({
    slug: product.slug,
    name: product.name,
    brand: product.brands || 'Brand not reported',
    observationCount: product.observationCount,
    lastObservedAt: product.lastObservedAt,
    source: snapshot.openPricesSource
  })),
  overlaySeries: compareOverlayChartSeries.series.map((series) => {
    const points = [...series.points].sort((left, right) => Date.parse(left.time) - Date.parse(right.time));
    const firstPoint = points[0];
    const latestPoint = points.at(-1);
    const prices = points.map((point) => point.value);
    const lowPrice = prices.length ? Math.min(...prices) : null;
    const highPrice = prices.length ? Math.max(...prices) : null;
    const movementPercent = firstPoint && latestPoint && firstPoint.value > 0
      ? ((latestPoint.value - firstPoint.value) / firstPoint.value) * 100
      : 0;

    return {
      id: series.id,
      productSlug: series.storeId.replace(/^openprices-/, ''),
      productName: series.storeName,
      sourceType: series.sourceType,
      lineStyle: series.lineStyle,
      pointCount: points.length,
      latestPrice: latestPoint?.value ?? null,
      movementPercent,
      lowPrice,
      highPrice,
      provenanceLabel: latestPoint?.provenanceLabel ?? snapshot.openPricesSource,
      markerCount: series.markers.length,
      points: points.map((point) => ({
        time: point.time,
        value: point.value,
        confidence: point.confidence,
        provenanceLabel: point.provenanceLabel
      })),
      sparklinePoints: points.slice(-8)
    };
  }),
  coverageLabel: `${compareOverlayChartSeries.series.length} price tapes · ${compareOverlayProducts.reduce((sum, product) => sum + product.observationCount, 0)} source observations considered`,
  confidenceLabel: 'OpenPrices online observations only; shelf, flyer, and member-price sources are not mixed into this overlay.',
  guardrail: 'No forecast: the overlay only plots dated observed SEK prices and withholds missing source classes rather than filling gaps.'
};

export const matchedChainProducts = axfoodProducts.filter((product) => product.inChains.length > 1 && product.lowestPrice > 0);
export const topChainSpreads = [...matchedChainProducts].sort((a, b) => b.spreadPct - a.spreadPct).slice(0, 18);
export const freshestOpenPrices = [...pricedProducts].sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt)).slice(0, 18);
export const productUniverse = [...topChainSpreads, ...freshestOpenPrices].slice(0, 36);

export const MAX_ITEM_COMPARISON_ITEMS = 4;

type ItemComparisonProduct = (typeof axfoodProducts)[number] | (typeof pricedProducts)[number];
type FulfillmentFilterKey = 'coupons' | 'homeDelivery' | 'pickup';
type FulfillmentFilters = Record<FulfillmentFilterKey, boolean>;

const itemComparisonFulfillmentFilterLabels: Record<FulfillmentFilterKey, string> = {
  coupons: 'Coupons',
  homeDelivery: 'Home delivery',
  pickup: 'Pickup'
};

// Unknown stores fail closed: item-comparison price rows only pass fulfillment filters when a source
// records explicit store capability evidence.
const storeCapabilityEvidence: Record<string, Partial<Record<FulfillmentFilterKey, string>>> = {};

function itemComparisonRequestValues(value: SearchParamValue | undefined) {
  return listSearchValues(value)
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function findItemComparisonProduct(id: string): ItemComparisonProduct | undefined {
  return axfoodProducts.find((product) => product.slug === id || product.code === id)
    ?? pricedProducts.find((product) => product.slug === id || product.code === id);
}

function checkboxSearchValue(value: SearchParamValue): boolean {
  const values = listSearchValues(value).map((item) => item.toLowerCase());
  return values.some((item) => ['1', 'true', 'on', 'yes'].includes(item));
}

function checkboxSearchValues(...values: SearchParamValue[]): boolean {
  return values.some(checkboxSearchValue);
}

function itemComparisonFulfillmentFilters(searchParams: {
  coupon?: SearchParamValue;
  coupons?: SearchParamValue;
  delivery?: SearchParamValue;
  'home-delivery'?: SearchParamValue;
  homeDelivery?: SearchParamValue;
  pickup?: SearchParamValue;
}): FulfillmentFilters {
  return {
    coupons: checkboxSearchValues(searchParams.coupon, searchParams.coupons),
    homeDelivery: checkboxSearchValues(searchParams.delivery, searchParams['home-delivery'], searchParams.homeDelivery),
    pickup: checkboxSearchValue(searchParams.pickup)
  };
}

function activeFulfillmentFilterKeys(filters: FulfillmentFilters) {
  return (Object.keys(filters) as FulfillmentFilterKey[]).filter((key) => filters[key]);
}

function hasFulfillmentCapabilityEvidence(storeId: string, filters: FulfillmentFilters): boolean {
  const activeFilters = activeFulfillmentFilterKeys(filters);
  if (activeFilters.length === 0) return true;

  const evidence = storeCapabilityEvidence[storeId.toLowerCase()];
  return activeFilters.every((filter) => Boolean(evidence?.[filter]));
}

function storePricesForItemComparison(product: ItemComparisonProduct, filters: FulfillmentFilters) {
  if (isOpenPricesProduct(product)) {
    const rows = [
      { storeName: 'OpenPrices observed low', price: product.priceMin, priceLabel: formatSek(product.priceMin), unitLabel: 'SEK observed price' },
      { storeName: 'OpenPrices observed median', price: product.priceMedian, priceLabel: formatSek(product.priceMedian), unitLabel: 'SEK observed price' },
      { storeName: 'OpenPrices observed high', price: product.priceMax, priceLabel: formatSek(product.priceMax), unitLabel: 'SEK observed price' }
    ];

    return activeFulfillmentFilterKeys(filters).length > 0 ? [] : rows;
  }

  return chainPriceRows(product)
    .filter((row) => hasFulfillmentCapabilityEvidence(String(row.chain), filters))
    .map((row) => ({
      storeName: String(row.chain),
      price: row.price,
      priceLabel: row.priceText,
      unitLabel: row.priceUnit
    }));
}

function trendPointsForItemComparison(product: ItemComparisonProduct) {
  if (isOpenPricesProduct(product)) {
    return dailyObservedPricePoints(product)
      .sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt))
      .slice(-6)
      .map((point) => ({
        label: point.observedAt.slice(0, 10),
        price: point.price,
        priceLabel: formatSek(point.price)
      }));
  }

  return chainPriceRows(product).map((row) => ({
    label: String(row.chain),
    price: row.price,
    priceLabel: row.priceText
  }));
}

function nutritionForItemComparison(product: ItemComparisonProduct) {
  if (isOpenPricesProduct(product)) {
    return {
      nutriScore: product.nutriscore?.toUpperCase() || 'Not reported',
      category: labelFromSlug(product.category),
      quantity: product.quantity || 'Quantity not reported',
      labels: product.categories.slice(0, 4).map(labelFromSlug)
    };
  }

  return {
    nutriScore: product.labels.includes('keyhole') ? 'Keyhole labelled' : 'Not reported',
    category: labelFromSlug(product.category),
    quantity: product.subline || 'Quantity not reported',
    labels: product.labels.slice(0, 4).map(labelFromSlug)
  };
}

export function buildItemComparisonView(searchParams: {
  items?: SearchParamValue;
  coupon?: SearchParamValue;
  coupons?: SearchParamValue;
  delivery?: SearchParamValue;
  'home-delivery'?: SearchParamValue;
  homeDelivery?: SearchParamValue;
  pickup?: SearchParamValue;
} = {}) {
  const fulfillmentFilters = itemComparisonFulfillmentFilters(searchParams);
  const activeFulfillmentFilters = activeFulfillmentFilterKeys(fulfillmentFilters);
  const requestedItemIds = [...new Set(itemComparisonRequestValues(searchParams.items))];
  const defaultItemIds = [
    ...freshestOpenPrices.slice(0, 2).map((product) => product.slug),
    ...topChainSpreads.slice(0, 2).map((product) => product.slug)
  ];
  const itemIds = (requestedItemIds.length > 0 ? requestedItemIds : defaultItemIds).slice(0, MAX_ITEM_COMPARISON_ITEMS);
  const requestedOverflow = (requestedItemIds.length > 0 ? requestedItemIds : defaultItemIds).slice(MAX_ITEM_COMPARISON_ITEMS);
  const matchedProducts = itemIds
    .map((id) => ({ id, product: findItemComparisonProduct(id) }))
    .filter((row): row is { id: string; product: ItemComparisonProduct } => row.product !== undefined);
  const matchedIds = new Set(matchedProducts.map((row) => row.id));

  return {
    maxItems: MAX_ITEM_COMPARISON_ITEMS,
    requestedItemIds,
    missingItemIds: itemIds.filter((id) => !matchedIds.has(id)),
    truncatedItemIds: requestedOverflow,
    sourceLabel: 'Axfood chain snapshots + OpenPrices/OpenFoodFacts observed product rows',
    fulfillmentFilters,
    activeFulfillmentFilterLabels: activeFulfillmentFilters.map((filter) => itemComparisonFulfillmentFilterLabels[filter]),
    fulfillmentFilterSummary: activeFulfillmentFilters.length > 0
      ? `Store prices require verified ${activeFulfillmentFilters.map((filter) => itemComparisonFulfillmentFilterLabels[filter].toLowerCase()).join(' + ')} evidence.`
      : 'No fulfillment filters applied.',
    items: matchedProducts.map(({ product }) => {
      const storePrices = storePricesForItemComparison(product, fulfillmentFilters);
      const trendPoints = trendPointsForItemComparison(product);
      const nutrition = nutritionForItemComparison(product);
      const cheapestPrice = storePrices
        .filter((row) => Number.isFinite(row.price))
        .sort((left, right) => left.price - right.price)[0];

      return {
        slug: product.slug,
        name: product.name,
        brand: isOpenPricesProduct(product) ? product.brands || 'Brand not reported' : product.brand || 'Brand not reported',
        imageUrl: product.image,
        nutrition,
        storePrices,
        trendPoints,
        cheapestPriceLabel: cheapestPrice?.priceLabel ?? 'No price row',
        cheapestStoreLabel: cheapestPrice?.storeName ?? 'No store row',
        trendSummary: trendPoints.length > 1 ? `${trendPoints.length} observed trend points` : 'Current price evidence only'
      };
    })
  };
}

const openPricesTrendingAsOfDate = pricedProducts.reduce((latest, product) => (
  product.lastObservedAt > latest ? product.lastObservedAt : latest
), '1970-01-01');
const openPricesTrendingPoints: TrendingPriceChangePoint[] = pricedProducts.flatMap((product) => (
  product.observations.map((observation) => ({
    productId: product.code,
    productSlug: product.slug,
    productName: product.name,
    ...(product.brands ? { brand: product.brands } : {}),
    categoryLabel: labelFromSlug(product.category),
    price: observation.price,
    currency: observedSnapshotCurrency,
    observedAt: `${observation.date}T00:00:00.000Z`,
    chainSlug: 'openprices',
    chainName: 'OpenPrices'
  }))
));

const openPricesHomepageTrendingPriceChanges = summarizeTrendingProductPriceChanges({
  points: openPricesTrendingPoints,
  asOf: `${openPricesTrendingAsOfDate}T23:59:59.999Z`,
  windowDays: 7,
  limit: 10
});

export const homepageTrendingPriceChanges = dbSiteHomepageTrendingPriceChanges.length > 0
  ? dbSiteHomepageTrendingPriceChanges
  : openPricesHomepageTrendingPriceChanges;

const chainDisplayNames: Record<string, string> = {
  willys: 'Willys',
  hemkop: 'Hemköp'
};

export const commonDietaryFilterOptions = [
  {
    value: 'glutenfree',
    label: 'Gluten-free',
    evidenceLabels: ['glutenfree', 'crossed_ax'],
    evidenceKeywords: ['glutenfri', 'glutenfritt', 'glutenfria', 'gluten-free']
  },
  {
    value: 'laktosfree',
    label: 'Lactose-free',
    evidenceLabels: ['laktosfree'],
    evidenceKeywords: ['laktosfri', 'laktosfritt', 'låg laktos', 'lactose-free']
  },
  {
    value: 'vegan',
    label: 'Vegan',
    evidenceLabels: ['vegan', 'vegetarian'],
    evidenceKeywords: ['vegan', 'vegansk', 'veganska']
  }
] as const;

type CommonDietaryFilterValue = typeof commonDietaryFilterOptions[number]['value'];

function readableLabel(label: string) {
  const dietaryOption = commonDietaryFilterOptions.find((option) => option.value === label);
  if (dietaryOption) return dietaryOption.label;
  const known: Record<string, string> = {
    crossed_ax: 'Gluten-free',
    ecological: 'Ekologisk',
    eu_ecological: 'EU-ekologisk',
    fairtrade: 'Fairtrade',
    fairtrade_facet: 'Fairtrade',
    from_sweden: 'Från Sverige',
    keyhole: 'Nyckelhålet',
    krav: 'KRAV',
    laktosfree: 'Laktosfri',
    swedish_flag: 'Svenskt ursprung'
  };
  return known[label] ?? label.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortedCountFacets(counts: Map<string, number>) {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: readableLabel(value), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'sv'));
}

function dietaryLabelsForProduct(product: (typeof axfoodProducts)[number]): CommonDietaryFilterValue[] {
  const labels = new Set(product.labels.map((label) => label.toLocaleLowerCase('sv-SE')));
  const evidenceText = `${product.name} ${product.brand} ${product.subline} ${product.category}`.toLocaleLowerCase('sv-SE');
  return commonDietaryFilterOptions
    .filter((option) => (
      option.evidenceLabels.some((label) => labels.has(label))
      || option.evidenceKeywords.some((keyword) => evidenceText.includes(keyword))
    ))
    .map((option) => option.value);
}

function productLabelsWithDietaryEvidence(product: (typeof axfoodProducts)[number]): string[] {
  return [...new Set([...product.labels, ...dietaryLabelsForProduct(product)])].sort((left, right) => left.localeCompare(right, 'sv'));
}

export const facetedSearchRows: RealCatalogSearchPriceRow[] = axfoodProducts.flatMap((product) => {
  const packageAmount = unitAmountFromPackage(product.subline);
  const originCountry = originCountryForAxfoodProduct(product);
  return chainPriceRows(product).flatMap((priceRow) => {
    const price = priceRow.price;
    if (typeof price !== 'number') return [];
    const normalizedUnit = normalizeComparableUnitPrice(price, product.subline);
    const comparableUnit = packageAmount?.unit ?? (priceRow.priceUnit.replace(/^kr\//, '') || 'st');
    return {
      productId: product.code,
      slug: product.slug,
      canonicalName: product.name,
      brand: product.brand,
      categoryPath: [labelFromSlug(product.category)],
      ...(originCountry ? { originCountry } : {}),
      labels: productLabelsWithDietaryEvidence(product),
      ...(packageAmount ? { packageSize: packageAmount.amount, packageUnit: packageAmount.unit } : {}),
      comparableUnit,
      ...(product.image ? { imageUrl: product.image } : {}),
      observationId: `axfood-${product.code}-${priceRow.chain}`,
      price,
      unitPrice: normalizedUnit?.unitPrice ?? price,
      currency: observedSnapshotCurrency,
      priceType: priceRow.savings ? 'promotion' : 'online',
      confidence: 0.95,
      observedAt: '2026-05-21T00:00:00.000Z',
      isAvailable: priceRow.isAvailable !== false,
      chainId: priceRow.chain,
      chainSlug: priceRow.chain,
      chainName: chainDisplayNames[priceRow.chain] ?? priceRow.chain,
      storeId: `${priceRow.chain}-online-catalog`,
      storeSlug: `${priceRow.chain}-online-catalog`,
      storeName: `${chainDisplayNames[priceRow.chain] ?? priceRow.chain} online catalog`
    } satisfies RealCatalogSearchPriceRow;
  });
});

const rawFacetedProductSearch = buildFacetedProductSearch({ rows: facetedSearchRows });

type SearchParamValue = string | string[] | undefined;

export type ProductSearchUrlParams = {
  q?: SearchParamValue;
  category?: SearchParamValue;
  label?: SearchParamValue;
  origin?: SearchParamValue;
  dietary?: SearchParamValue;
  chain?: SearchParamValue;
  minPrice?: SearchParamValue;
  maxPrice?: SearchParamValue;
  inStockOnly?: SearchParamValue;
  minConfidence?: SearchParamValue;
  sort?: SearchParamValue;
};

export type ProductSearchSortOption = 'relevance' | 'unit_price_asc' | 'confidence_desc' | 'newest_observation' | 'nearest_store';

export const productSearchSortOptions: Array<{ value: ProductSearchSortOption; label: string; description: string }> = [
  { value: 'relevance', label: 'Relevance', description: 'Keep the verified search relevance and price order.' },
  { value: 'unit_price_asc', label: 'Lowest unit price', description: 'Prioritize the cheapest comparable kr/kg, kr/l, or each price.' },
  { value: 'confidence_desc', label: 'Highest confidence', description: 'Prioritize rows with the strongest price observation confidence.' },
  { value: 'newest_observation', label: 'Newest observation', description: 'Prioritize recently observed prices.' },
  { value: 'nearest_store', label: 'Nearest store', description: 'Use location-aware store ranking when location is available.' }
];

function productSearchSortValue(value: SearchParamValue): ProductSearchSortOption {
  const requested = firstSearchValue(value);
  return productSearchSortOptions.some((option) => option.value === requested) ? requested as ProductSearchSortOption : 'relevance';
}

function firstSearchValue(value: SearchParamValue): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
}

function listSearchValues(value: SearchParamValue): string[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(rawValues.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean))];
}

function dietarySearchValues(value: SearchParamValue): CommonDietaryFilterValue[] {
  const requested = new Set(listSearchValues(value).map((item) => item.toLocaleLowerCase('sv-SE')));
  return commonDietaryFilterOptions
    .filter((option) => requested.has(option.value))
    .map((option) => option.value);
}

export const supportedOriginCountries = ['SE', 'NO', 'IS', 'DK', 'FI', 'DE', 'NL', 'ES', 'IT', 'PL', 'IE'] as const;

export type SupportedOriginCountry = (typeof supportedOriginCountries)[number];

export const originCountryLabels: Record<SupportedOriginCountry, string> = {
  SE: 'Sweden',
  NO: 'Norway',
  IS: 'Iceland',
  DK: 'Denmark',
  FI: 'Finland',
  DE: 'Germany',
  NL: 'Netherlands',
  ES: 'Spain',
  IT: 'Italy',
  PL: 'Poland',
  IE: 'Ireland'
};

function originSearchValues(value: SearchParamValue): SupportedOriginCountry[] {
  const requested = new Set(listSearchValues(value).map((item) => item.toUpperCase()));
  return supportedOriginCountries.filter((country) => requested.has(country));
}

function originCountryForBarcode(barcode: string): SupportedOriginCountry | null {
  if (/^73/.test(barcode)) return 'SE';
  if (/^70/.test(barcode)) return 'NO';
  if (/^569/.test(barcode)) return 'IS';
  if (/^57/.test(barcode)) return 'DK';
  if (/^64/.test(barcode)) return 'FI';
  if (/^4[0-4]/.test(barcode)) return 'DE';
  if (/^87/.test(barcode)) return 'NL';
  if (/^84/.test(barcode)) return 'ES';
  if (/^8[0-3]/.test(barcode)) return 'IT';
  if (/^590/.test(barcode)) return 'PL';
  if (/^539/.test(barcode)) return 'IE';
  return null;
}

function originCountryForAxfoodProduct(product: (typeof axfoodProducts)[number]): SupportedOriginCountry | null {
  const labels = new Set(product.labels.map((label) => label.toLocaleLowerCase('sv-SE')));
  if (labels.has('swedish_flag') || labels.has('from_sweden') || labels.has('meat_from_sweden')) return 'SE';

  const barcode = product.image?.match(/(\d{13})/)?.[1] ?? '';
  return originCountryForBarcode(barcode);
}

function numericSearchValue(value: SearchParamValue): number | undefined {
  const raw = firstSearchValue(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function confidenceSearchValue(value: SearchParamValue): number | undefined {
  const parsed = numericSearchValue(value);
  if (parsed === undefined) return undefined;
  return parsed > 1 ? Math.min(parsed / 100, 1) : Math.min(parsed, 1);
}

function booleanSearchValue(value: SearchParamValue): boolean {
  return ['1', 'true', 'yes', 'on'].includes(firstSearchValue(value).toLocaleLowerCase('sv-SE'));
}

function nearestStoreRankFor(product: (typeof rawFacetedProductSearch.products)[number]) {
  const nearestChainOrder = ['willys', 'hemköp', 'ica', 'coop', 'lidl'];
  const ranks = product.currentPrices.map((price) => {
    const chain = price.chainSlug.toLocaleLowerCase('sv-SE');
    const chainRank = nearestChainOrder.findIndex((candidate) => chain.includes(candidate));
    return chainRank === -1 ? nearestChainOrder.length : chainRank;
  });
  return ranks.length ? Math.min(...ranks) : Number.MAX_SAFE_INTEGER;
}

function productSearchResultCards(searchResult: typeof rawFacetedProductSearch, sort: ProductSearchSortOption = 'relevance') {
  const cards = searchResult.products.map((product, relevanceIndex) => {
    const cheapest = product.currentPrices[0] ?? null;
    const lowestUnitPrice = product.currentPrices.reduce((lowest, price) => Math.min(lowest, price.unitPrice), Number.POSITIVE_INFINITY);
    const highestConfidence = product.currentPrices.reduce((highest, price) => Math.max(highest, price.confidence), 0);
    const newestObservedAt = product.currentPrices.reduce((newest, price) => price.observedAt > newest ? price.observedAt : newest, '');
    const volatilityBadge = classifyRecentPriceVariance(product.currentPrices);
    return {
      slug: product.slug,
      name: product.canonicalName,
      brand: product.brand ?? 'Brand not reported',
      imageUrl: product.imageUrl,
      categoryLabel: product.categoryPath[0] ?? 'Category not reported',
      labels: product.labels.map(readableLabel),
      cheapestPriceLabel: formatSek(product.cheapestPrice),
      unitPriceLabel: cheapest ? formatLocalizedUnitPrice(cheapest.unitPrice, {
        locale: defaultLocale,
        currency: cheapest.currency,
        unit: product.comparableUnit
      }) : unknownUnitPriceLabel,
      isAvailable: product.isAvailable,
      chainLabel: cheapest ? `${cheapest.chainName} · ${cheapest.priceType}` : 'Awaiting latest_prices row',
      volatilityBadge,
      sourceTables: searchResult.evidence.sourceTables,
      allergenRiskBadges: allergenRiskBadgesForText([
        product.canonicalName,
        product.brand,
        product.categoryPath.join(' '),
        product.labels.join(' ')
      ]),
      sortConfidence: highestConfidence,
      sortNearestStoreRank: nearestStoreRankFor(product),
      sortNewestObservedAt: newestObservedAt,
      sortRelevanceIndex: relevanceIndex,
      sortUnitPrice: Number.isFinite(lowestUnitPrice) ? lowestUnitPrice : Number.MAX_SAFE_INTEGER
    };
  });

  return cards.sort((left, right) => {
    if (sort === 'unit_price_asc' && left.sortUnitPrice !== right.sortUnitPrice) return left.sortUnitPrice - right.sortUnitPrice;
    if (sort === 'confidence_desc' && left.sortConfidence !== right.sortConfidence) return right.sortConfidence - left.sortConfidence;
    if (sort === 'newest_observation' && left.sortNewestObservedAt !== right.sortNewestObservedAt) return right.sortNewestObservedAt.localeCompare(left.sortNewestObservedAt);
    if (sort === 'nearest_store' && left.sortNearestStoreRank !== right.sortNearestStoreRank) return left.sortNearestStoreRank - right.sortNearestStoreRank;
    return left.sortRelevanceIndex - right.sortRelevanceIndex;
  });
}

export function buildProductSearchView(searchParams: ProductSearchUrlParams = {}) {
  const query = firstSearchValue(searchParams.q);
  const categories = listSearchValues(searchParams.category);
  const labelFilters = listSearchValues(searchParams.label);
  const originCountries = originSearchValues(searchParams.origin);
  const dietaryLabels = dietarySearchValues(searchParams.dietary);
  const labels = [...new Set([...labelFilters, ...dietaryLabels])];
  const chains = listSearchValues(searchParams.chain);
  const minPrice = numericSearchValue(searchParams.minPrice);
  const maxPrice = numericSearchValue(searchParams.maxPrice);
  const inStockOnly = booleanSearchValue(searchParams.inStockOnly);
  const minConfidence = confidenceSearchValue(searchParams.minConfidence);
  const sort = productSearchSortValue(searchParams.sort);
  const filters = { query, categories, labels, originCountries, chains, minPrice, maxPrice, inStockOnly, minConfidence, limit: 100 };
  const searchResult = buildFacetedProductSearch({ rows: facetedSearchRows, filters });

  const activeFilters = [
    query ? `q=${query}` : null,
    ...categories.map((category) => `category=${category}`),
    ...labelFilters.map((label) => `label=${readableLabel(label)}`),
    ...originCountries.map((country) => `origin=${originCountryLabels[country]}`),
    ...dietaryLabels.map((dietaryLabel) => {
      const dietaryFilterLabel = commonDietaryFilterOptions.find((option) => option.value === dietaryLabel)?.label ?? readableLabel(dietaryLabel);
      return `dietary=${dietaryFilterLabel}`;
    }),
    ...chains.map((chain) => `chain=${chainDisplayNames[chain] ?? chain}`),
    minPrice !== undefined ? `min unit ${formatSek(minPrice)}` : null,
    maxPrice !== undefined ? `max unit ${formatSek(maxPrice)}` : null,
    inStockOnly ? 'priced/in-stock only' : null,
    minConfidence !== undefined ? `confidence ≥ ${pct.format(minConfidence * 100)}%` : null,
    sort !== 'relevance' ? `sort=${productSearchSortOptions.find((option) => option.value === sort)?.label ?? sort}` : null
  ].filter((item): item is string => item !== null);

  return {
    ...searchResult,
    title: 'Instant faceted search',
    sort,
    sortOptions: productSearchSortOptions,
    categoryFacets: searchResult.facets.categories.slice(0, 6),
    chainFacets: searchResult.facets.chains,
    labelFacets: searchResult.facets.labels.map((facet) => ({ ...facet, label: readableLabel(facet.value) })).slice(0, 8),
    labelFilters,
    originFilters: originCountries,
    originFacets: supportedOriginCountries.map((country) => {
      const facet = (searchResult.facets.origins ?? []).find((candidate) => candidate.value.toUpperCase() === country);
      return {
        value: country,
        label: originCountryLabels[country],
        count: facet?.count ?? 0
      };
    }),
    dietaryFilters: commonDietaryFilterOptions.map((option) => {
      const facet = searchResult.facets.labels.find((candidate) => candidate.value === option.value);
      return {
        ...option,
        checked: dietaryLabels.includes(option.value),
        count: facet?.count ?? 0,
        evidenceSummary: option.evidenceLabels.join(' + ')
      };
    }),
    priceRange: searchResult.facets.priceRange,
    inStockOnly: {
      label: 'In-stock / priced rows only',
      productCount: searchResult.evidence.pricedProductCount,
      latestPriceCount: searchResult.evidence.latestPriceCount,
      availableLatestPriceCount: searchResult.evidence.availableLatestPriceCount,
      outOfStockLatestPriceCount: searchResult.evidence.outOfStockLatestPriceCount
    },
    activeFilters,
    resultCards: productSearchResultCards(searchResult, sort)
  };
}

export const facetedProductSearch = buildProductSearchView();

type PricedChainRow = ReturnType<typeof chainPriceRows>[number] & { price: number };

function watchlistPriceTypeFor(row: PricedChainRow): WatchlistPriceType {
  return typeof row.savings === 'number' && row.savings > 0 ? 'promotion' : 'shelf';
}

const watchlistHeartSourceRows = topChainSpreads
  .map((product) => {
    const pricedRows = chainPriceRows(product)
      .filter((row): row is PricedChainRow => typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0)
      .sort((left, right) => left.price - right.price || String(left.chain).localeCompare(String(right.chain), 'sv'));
    const cheapest = pricedRows[0];
    if (!cheapest) return null;
    const dealScore = calculateDealScore({
      currentCityPercentile: clamp(100 - product.spreadPct * 2, 0, 100),
      knownPromoHistoryPercentile: clamp(100 - product.spreadPct * 2, 0, 100),
      equivalentUnitPricePercentile: product.inChains.length > 1 ? 0 : 50,
      discountDepthPercent: product.spreadPct,
      sourceConfidence: clamp(product.inChains.length / 2, 0, 1)
    });
    return { product, pricedRows, cheapest, dealScore };
  })
  .filter((row): row is NonNullable<typeof row> => row !== null)
  .slice(0, 4);

const watchlistHeartItems: WatchlistItem[] = watchlistHeartSourceRows.map(({ product, cheapest, dealScore }) => ({
  productId: product.slug,
  targetPrice: roundSek(cheapest.price * 1.02),
  alertDealScoreAt: Math.max(50, Math.min(90, dealScore)),
  favoriteStoresOnly: false,
  allowedPriceTypes: [watchlistPriceTypeFor(cheapest)]
}));

const watchlistHeartSnapshots: WatchlistProductSnapshot[] = watchlistHeartSourceRows.map(({ product, pricedRows, cheapest, dealScore }) => ({
  productId: product.slug,
  productName: product.name,
  bestPrice: cheapest.price,
  bestStoreId: `${cheapest.chain}-online-catalog`,
  bestPriceType: watchlistPriceTypeFor(cheapest),
  prices: pricedRows.map((row) => ({
    storeId: `${row.chain}-online-catalog`,
    storeName: `${chainDisplayNames[row.chain] ?? row.chain} online catalog`,
    price: row.price,
    priceType: watchlistPriceTypeFor(row)
  })),
  dealScore,
  isNew52WeekLow: product.spreadPct >= 20
}));

const watchlistHeartAlerts = buildWatchlistAlerts({
  watchlist: watchlistHeartItems,
  products: watchlistHeartSnapshots,
  favoriteStoreIds: []
});

export const watchlistHeartProducts = watchlistHeartSourceRows.map(({ product, cheapest, pricedRows, dealScore }) => {
  const item = watchlistHeartItems.find((watchlistItem) => watchlistItem.productId === product.slug)!;
  const alerts = watchlistHeartAlerts.filter((alert) => alert.productId === product.slug);
  const normalizedUnit = normalizeComparableUnitPrice(cheapest.price, product.subline);
  return {
    productId: product.slug,
    sourceProductSlug: product.slug,
    productName: product.name,
    brand: product.brand || 'Brand not reported',
    imageUrl: product.image || null,
    categoryLabel: labelFromSlug(product.category),
    currentPrice: cheapest.price,
    currentPriceLabel: formatSek(cheapest.price),
    unitPriceLabel: normalizedUnit ? formatLocalizedUnitPrice(normalizedUnit.unitPrice, {
      locale: defaultLocale,
      currency: observedSnapshotCurrency,
      unit: normalizedUnit.unitLabel.replace('kr/', '')
    }) : unknownUnitPriceLabel,
    targetPrice: item.targetPrice ?? cheapest.price,
    targetPriceLabel: formatSek(item.targetPrice ?? cheapest.price),
    dealScore,
    bestStoreLabel: `${chainDisplayNames[cheapest.chain] ?? cheapest.chain} online catalog`,
    priceTypeLabel: watchlistPriceTypeFor(cheapest),
    sourceLabel: `${pricedRows.length} verified chain price rows · ${product.inChains.join(' + ')}`,
    accountBound: true,
    saveLabel: 'Save to watchlist',
    authRequirement: 'Signed-in shoppers only; the heart is account-bound to the shopper watchlist and never stored anonymously.',
    alertSummary: alerts.length > 0 ? alerts.map((alert) => alert.type.replaceAll('_', ' ')).join(' · ') : 'No alert until target price, Deal Score, or new-low rules match.',
    firstAlertMessage: alerts[0]?.message ?? 'buildWatchlistAlerts evaluated this product but no notification is due yet.',
    alertCount: alerts.length,
    guardrails: [
      'No anonymous saves: heart clicks require a signed-in account before the watched product is persisted.',
      'Saved products use the verified sourceProductSlug and current chain price rows instead of demo-data or sample-data.',
      'Target price, Deal Score, and new-low copy comes from buildWatchlistAlerts outputs only.'
    ]
  };
});

const groceryObservationCount = pricedProducts.reduce((sum, product) => sum + product.observationCount, 0);

export const pharmacyCategoryNeedles = [
  'suncare',
  'sunscreen',
  'sun-protections',
  'facial-creams',
  'facial-sunscreens',
  'aloe-vera',
  'body-lotion',
  'bodylotion',
  'skin-care',
  'personal-care',
  'supplements'
];

const pharmacyBrandNeedles = [
  'apoteket',
  'aco',
  'eucerin',
  'cerave',
  'la roche',
  'vichy',
  'nivea sun',
  'locobase',
  'idomin',
  'miniderm',
  'bepanthen'
];

function pharmacyOtcEvidenceFor(product: (typeof pricedProducts)[number]) {
  const categoryText = [product.category, ...product.categories].join(' ').toLowerCase();
  const brandText = product.brands.toLowerCase();
  const nameText = product.name.toLowerCase();
  const categoryEvidence = pharmacyCategoryNeedles.find((needle) => categoryText.includes(needle));
  const brandEvidence = pharmacyBrandNeedles.find((needle) => brandText.includes(needle) || nameText.includes(needle));

  if (!categoryEvidence && !brandEvidence) return null;
  return categoryEvidence
    ? `category:${categoryEvidence}`
    : `brand/name:${brandEvidence}`;
}

const pharmacyOtcEvidenceRows = pricedProducts
  .map((product) => ({ product, evidence: pharmacyOtcEvidenceFor(product) }))
  .filter((row): row is { product: (typeof pricedProducts)[number]; evidence: string } => row.evidence !== null)
  .sort((left, right) => {
    const observationDelta = right.product.observationCount - left.product.observationCount;
    if (observationDelta !== 0) return observationDelta;
    return right.product.lastObservedAt.localeCompare(left.product.lastObservedAt);
  });

export const pharmacyOtcEvidenceBoard = {
  title: 'OTC pharmacy evidence lane',
  source: 'OpenPrices + OpenBeautyFacts',
  productCount: pharmacyOtcEvidenceRows.length,
  observationCount: pharmacyOtcEvidenceRows.reduce((sum, row) => sum + row.product.observationCount, 0),
  rows: pharmacyOtcEvidenceRows.slice(0, 8).map(({ product, evidence }) => ({
    slug: product.slug,
    code: product.code,
    name: product.name,
    brand: product.brands || 'Brand not reported',
    image: product.image,
    priceMin: product.priceMin,
    priceMedian: product.priceMedian,
    priceMax: product.priceMax,
    observationCount: product.observationCount,
    lastObservedAt: product.lastObservedAt,
    evidence,
    confidence: product.observationCount >= 2
      ? 'public observed price history'
      : 'single public observation'
  })),
  guardrails: [
    'OpenPrices + OpenBeautyFacts rows are public OTC, supplement, suncare, or health/beauty product observations only.',
    'This is not a pharmacy-chain comparison: no cheapest pharmacy, stock, online-vs-in-store, prescription, or medical advice claim is shown.',
    'domain=pharmacy connector observations are still required before pharmacy alerts or cross-pharmacy history render.'
  ]
};

export const multiVerticalDomainFoundation = SUPPORTED_PRICE_DOMAINS.map((domain) => ({
  slug: domain.slug,
  label: domain.label,
  route: domain.slug === 'grocery' ? '/' : domain.route,
  status: domain.status,
  itemMatchStrategy: domain.itemMatchStrategy,
  locationStrategy: domain.locationStrategy,
  observationsTable: domain.observationsTable,
  seedItems: domain.seedItems,
  seedItemCount: domain.seedItems.length,
  priceObservationsAvailable: domain.slug === 'grocery'
    ? groceryObservationCount
    : domain.slug === 'fuel'
      ? verifiedFuelPriceObservations.length
      : 0,
  confidence: domain.slug === 'grocery'
    ? 'active verified grocery rows'
    : domain.slug === 'fuel'
      ? 'operator-sourced fuel rows'
      : 'foundation only',
  priceClaim: domain.priceClaim,
  claimBoundary: domain.slug === 'grocery'
    ? 'Grocery can render verified price observations with source confidence.'
    : domain.slug === 'fuel'
      ? 'Fuel renders only source-backed operator observations; no crowd rows are shown yet.'
      : 'No domain=pharmacy connector observations yet; public OTC evidence is separated from pharmacy-chain claims.',
  migrationFields: ['chains.domain', 'stores.domain', 'products.domain', 'observations.domain', 'latest_prices.domain'],
  schemaDefault: "domain default 'grocery'",
  guardrails: [
    "Existing GroceryView rows default to domain='grocery'.",
    'Fuel and pharmacy routes may show supported item and location models, but must not show chain prices before domain-scoped observations exist.',
    'Fuel price rows must carry domain=fuel, price per litre, grade id, and operator or trusted crowd provenance.',
    'Non-grocery matching remains domain-scoped: fuel grades are not compared to grocery EANs, and pharmacy OTC rows exclude prescription claims.'
  ]
}));


export const fuelStationSourceCoverage = {
  title: 'OSM fuel station source',
  source: 'OpenStreetMap Overpass Sweden extract',
  connector: 'fetchOverpassFuelStations',
  overpassFilter: 'amenity=fuel',
  stationScope: 'Sweden and per-county refresh queries',
  status: 'station locations wired; fuel prices withheld',
  priceObservationCount: 0,
  fields: ['osmType', 'osmId', 'name', 'brand', 'operator', 'latitude', 'longitude', 'openingHours', 'availableFuelGrades'],
  fuelGradeTags: ['fuel:octane_95', 'fuel:octane_98', 'fuel:diesel', 'fuel:hvo100', 'fuel:e85', 'fuel:adblue'],
  guardrails: [
    'The connector reads OSM station location and grade availability tags only.',
    'Fuel pages must not render pump prices until connector or trusted crowd rows write domain=fuel observations.',
    'Fuel grade matching stays separate from grocery EAN and commodity matching.'
  ]
};

type DeliveryVsInStoreBasketPair = {
  matchedToken: string;
  matchEvidence: string;
  onlineProduct: (typeof mathemProducts)[number];
  inStoreProduct: (typeof matchedChainProducts)[number];
};

const deliveryVsInStoreStaples = [
  { matchedToken: 'havregryn', label: 'Havregryn' },
  { matchedToken: 'pasta', label: 'Pasta / makaroner', aliases: ['makaroner'] },
  { matchedToken: 'honung', label: 'Honung' },
  { matchedToken: 'vetemjol', label: 'Vetemjöl', aliases: ['vetemjöl'] },
  { matchedToken: 'ris', label: 'Ris' },
  { matchedToken: 'salt', label: 'Salt' }
];

function normalizeBasketMatchText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matchesBasketToken(value: string, token: string, aliases: string[] = []) {
  const normalized = normalizeBasketMatchText(value);
  return [token, ...aliases].some((candidate) => normalized.includes(normalizeBasketMatchText(candidate)));
}

function roundSek(value: number) {
  return Math.round(value * 100) / 100;
}

const seasonalCalendarMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const seasonalProduceNameNeedles = [
  /äpple|apple/i,
  /banan|banana/i,
  /spenat|spinach/i,
  /potatis|potato|pommes|rösti/i,
  /tomat|tomato/i,
  /paprika|pepper/i,
  /sallad|lettuce/i,
  /morot|carrot/i,
  /gurka|cucumber/i,
  /kål|cabbage/i,
  /bär|berry|russin|raisin/i
];

function isSeasonalProduceCandidate(product: (typeof pricedProducts)[number]) {
  const haystack = `${product.category} ${product.categories.join(' ')} ${product.name}`.toLowerCase();
  return (
    product.category === 'produce' ||
    haystack.includes('fruits-and-vegetables') ||
    haystack.includes('vegetables') ||
    haystack.includes('fruits') ||
    haystack.includes('fresh-foods') ||
    seasonalProduceNameNeedles.some((needle) => needle.test(product.name))
  );
}

function monthlyProduceAverages(product: (typeof pricedProducts)[number]) {
  const monthBuckets = product.observations.reduce<Map<number, { prices: number[]; years: Set<number> }>>((buckets, observation) => {
    const observedAt = Date.parse(`${observation.date}T00:00:00.000Z`);
    if (!Number.isFinite(observedAt) || !Number.isFinite(observation.price) || observation.price <= 0) return buckets;
    const observedDate = new Date(observedAt);
    const monthIndex = observedDate.getUTCMonth();
    const bucket = buckets.get(monthIndex) ?? { prices: [], years: new Set<number>() };
    bucket.prices.push(observation.price);
    bucket.years.add(observedDate.getUTCFullYear());
    buckets.set(monthIndex, bucket);
    return buckets;
  }, new Map<number, { prices: number[]; years: Set<number> }>());

  return [...monthBuckets.entries()]
    .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
    .map(([monthIndex, bucket]) => {
      const historicalMonthlyAverage = roundSek(bucket.prices.reduce((sum, price) => sum + price, 0) / bucket.prices.length);
      return {
        monthIndex,
        monthLabel: seasonalCalendarMonthLabels[monthIndex]!,
        historicalMonthlyAverage,
        historicalMonthlyAverageLabel: formatSek(historicalMonthlyAverage),
        observationCount: bucket.prices.length,
        yearCount: bucket.years.size,
        lowPriceLabel: formatSek(Math.min(...bucket.prices)),
        highPriceLabel: formatSek(Math.max(...bucket.prices))
      };
    });
}

export const produceSeasonalityRows = pricedProducts
  .filter(isSeasonalProduceCandidate)
  .map((product) => {
    const monthlyAverages = monthlyProduceAverages(product);
    const observationCount = monthlyAverages.reduce((sum, row) => sum + row.observationCount, 0);
    if (monthlyAverages.length < 2 || observationCount < 3) return null;
    const rankedMonths = [...monthlyAverages].sort((left, right) =>
      left.historicalMonthlyAverage - right.historicalMonthlyAverage ||
      right.observationCount - left.observationCount ||
      left.monthIndex - right.monthIndex
    );
    const bestMonth = rankedMonths[0]!;
    const typicalMonthlyAverage = roundSek(monthlyAverages.reduce((sum, row) => sum + row.historicalMonthlyAverage, 0) / monthlyAverages.length);
    const savingsVsTypicalPercent = typicalMonthlyAverage > 0
      ? roundSek(((typicalMonthlyAverage - bestMonth.historicalMonthlyAverage) / typicalMonthlyAverage) * 100)
      : null;

    return {
      slug: product.slug,
      productName: product.name,
      brand: product.brands || 'Brand not reported',
      categoryLabel: labelFromSlug(product.category),
      bestBuyMonth: bestMonth.monthLabel,
      bestBuyMonthIndex: bestMonth.monthIndex,
      historicalMonthlyAverage: bestMonth.historicalMonthlyAverage,
      historicalMonthlyAverageLabel: bestMonth.historicalMonthlyAverageLabel,
      typicalMonthlyAverage: typicalMonthlyAverage,
      typicalMonthlyAverageLabel: formatSek(typicalMonthlyAverage),
      savingsVsTypicalPercent,
      savingsVsTypicalLabel: savingsVsTypicalPercent !== null ? `${formatPct(savingsVsTypicalPercent)} below observed monthly average` : 'Not reported',
      observedMonthCount: monthlyAverages.length,
      observationCount,
      latestObservedAt: product.lastObservedAt,
      monthlyAverages,
      confidenceLabel: monthlyAverages.length >= 6 && observationCount >= 8 ? 'medium seasonal history' : 'limited seasonal history',
      evidenceLabel: `${observationCount} dated OpenPrices observations across ${monthlyAverages.length} observed months; best time to buy is the lowest historical monthly average, not a forecast.`
    };
  })
  .filter((row): row is NonNullable<typeof row> => row !== null)
  .sort((left, right) =>
    right.observedMonthCount - left.observedMonthCount ||
    right.observationCount - left.observationCount ||
    left.productName.localeCompare(right.productName, 'sv')
  )
  .slice(0, 12);

const seasonalCalendarMonths = seasonalCalendarMonthLabels.map((monthLabel, monthIndex) => {
  const observedRows = produceSeasonalityRows.filter((row) =>
    row.monthlyAverages.some((monthlyAverage) => monthlyAverage.monthIndex === monthIndex)
  );
  const bestBuyProducts = produceSeasonalityRows
    .filter((row) => row.bestBuyMonthIndex === monthIndex)
    .slice(0, 4)
    .map((row) => ({
      slug: row.slug,
      productName: row.productName,
      bestBuyMonth: row.bestBuyMonth,
      historicalMonthlyAverage: row.historicalMonthlyAverage,
      historicalMonthlyAverageLabel: row.historicalMonthlyAverageLabel,
      savingsVsTypicalLabel: row.savingsVsTypicalLabel,
      confidenceLabel: row.confidenceLabel
    }));
  const monthObservationCount = observedRows.reduce((sum, row) => {
    const monthlyAverage = row.monthlyAverages.find((average) => average.monthIndex === monthIndex);
    return sum + (monthlyAverage?.observationCount ?? 0);
  }, 0);
  const monthAverages = observedRows
    .map((row) => row.monthlyAverages.find((average) => average.monthIndex === monthIndex)?.historicalMonthlyAverage)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const historicalMonthlyAverage = monthAverages.length > 0
    ? roundSek(monthAverages.reduce((sum, value) => sum + value, 0) / monthAverages.length)
    : null;

  return {
    monthLabel,
    monthIndex,
    productCount: observedRows.length,
    bestBuyCount: bestBuyProducts.length,
    observationCount: monthObservationCount,
    historicalMonthlyAverage,
    historicalMonthlyAverageLabel: formatSek(historicalMonthlyAverage),
    bestBuyProducts,
    confidenceLabel: bestBuyProducts.length > 0 ? 'observed best-buy month' : 'coverage month only'
  };
});

export const seasonalProduceCalendar = {
  title: 'Seasonal best time to buy produce calendar',
  status: 'historical_monthly_averages_no_forecast',
  sourceLabel: snapshot.openPricesSource,
  productCount: produceSeasonalityRows.length,
  observationCount: produceSeasonalityRows.reduce((sum, row) => sum + row.observationCount, 0),
  observedMonthCount: new Set(produceSeasonalityRows.flatMap((row) => row.monthlyAverages.map((average) => average.monthIndex))).size,
  methodology: 'Best time to buy uses historical monthly averages from dated OpenPrices rows. No forecast or synthetic seasonal prediction is shown.',
  produceSeasonalityRows,
  calendarMonths: seasonalCalendarMonths,
  topBestBuys: [...produceSeasonalityRows]
    .sort((left, right) => (right.savingsVsTypicalPercent ?? 0) - (left.savingsVsTypicalPercent ?? 0))
    .slice(0, 6),
  ecoSeasonalGuidance: [
    'Eco content is limited to waste-aware planning: buy observed low-price produce when real history says it is usually cheaper.',
    'No carbon, local-season, or origin claim is inferred from month alone; GroceryView needs explicit label or origin evidence first.',
    'Fresh-produce coverage is medium/limited when OpenPrices has only a few dated month buckets, so missing months stay labelled instead of filled.'
  ],
  guardrails: [
    'No forecast or synthetic seasonal prediction: every month row is calculated only from historical monthly averages.',
    'Packaged produce and loose produce can both appear, but they are labelled as OpenPrices observations until commodity unit prices are present.',
    'Rows with fewer than two observed months or fewer than three dated observations are withheld.'
  ]
};

const swedishOriginEvidenceLabels = ['swedish_flag', 'from_sweden', 'meat_from_sweden'];

function swedishOriginEvidenceFor(product: (typeof axfoodProducts)[number]) {
  return product.labels
    .filter((label) => swedishOriginEvidenceLabels.includes(label))
    .map((label) => `${label} · Swedish origin label`);
}

const localOriginRows = axfoodProducts
  .map((product) => ({ product, originEvidence: swedishOriginEvidenceFor(product) }))
  .filter((row) => row.originEvidence.length > 0)
  .filter((row) => ['frukt-och-gront', 'mejeri-ost-och-agg', 'kott-fagel-och-chark', 'fisk-och-skaldjur'].includes(row.product.category))
  .sort((left, right) =>
    right.product.inChains.length - left.product.inChains.length ||
    right.product.spreadPct - left.product.spreadPct ||
    left.product.name.localeCompare(right.product.name, 'sv')
  )
  .slice(0, 6)
  .map(({ product, originEvidence }) => ({
    slug: product.slug,
    productName: product.name,
    brand: product.brand,
    categoryLabel: labelFromSlug(product.category),
    lowestChain: product.lowestChain,
    lowestPrice: product.lowestPrice,
    lowestPriceLabel: formatSek(product.lowestPrice),
    spreadPct: product.spreadPct,
    originEvidence,
    labelEvidence: product.labels,
    claimBoundary: 'Local pick requires an explicit Swedish-origin label; GroceryView does not infer origin from store, month, or brand name.'
  }));

export const localSeasonalPicks = {
  title: 'Local & seasonal picks',
  persona: 'Eco-conscious',
  status: 'explicit_origin_plus_historical_seasonality',
  sourceLabels: [snapshot.axfoodSource, snapshot.openPricesSource],
  localOriginRows,
  seasonalEvidenceRows: seasonalProduceCalendar.topBestBuys.slice(0, 6).map((row) => ({
    slug: row.slug,
    productName: row.productName,
    bestBuyMonth: row.bestBuyMonth,
    historicalMonthlyAverage: row.historicalMonthlyAverage,
    historicalMonthlyAverageLabel: row.historicalMonthlyAverageLabel,
    seasonalEvidence: row.evidenceLabel,
    confidenceLabel: row.confidenceLabel,
    claimBoundary: 'Seasonal pick means lowest observed historicalMonthlyAverage, not a harvest, origin, or future price claim.'
  })),
  guardrails: [
    'No carbon or harvest claim is made from month, brand, category, or Swedish-origin labels.',
    'A local pick requires an explicit Swedish-origin label such as from_sweden, swedish_flag, or meat_from_sweden.',
    'A seasonal pick requires dated OpenPrices monthly history and remains separate from originEvidence unless both evidence types are present.',
    'Missing origin or seasonal evidence stays absent instead of being inferred from store proximity.'
  ]
};

function cheapestMathemProductFor(token: string, aliases: string[] = []) {
  return mathemProducts
    .filter((product) => product.available && Number.isFinite(product.price) && product.price > 0)
    .filter((product) => matchesBasketToken(`${product.name} ${product.brand} ${product.packageText}`, token, aliases))
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))[0];
}

function cheapestMatchedChainProductFor(token: string, aliases: string[] = []) {
  return matchedChainProducts
    .filter((product) => Number.isFinite(product.lowestPrice) && product.lowestPrice > 0)
    .filter((product) => matchesBasketToken(`${product.name} ${product.brand} ${product.subline}`, token, aliases))
    .sort((a, b) => a.lowestPrice - b.lowestPrice || a.name.localeCompare(b.name))[0];
}

const deliveryVsInStoreBasketPairs = deliveryVsInStoreStaples
  .map((staple): DeliveryVsInStoreBasketPair | null => {
    const onlineProduct = cheapestMathemProductFor(staple.matchedToken, staple.aliases);
    const inStoreProduct = cheapestMatchedChainProductFor(staple.matchedToken, staple.aliases);
    if (!onlineProduct || !inStoreProduct) return null;
    return {
      matchedToken: staple.label,
      matchEvidence: `public product-name token match: ${staple.label}`,
      onlineProduct,
      inStoreProduct
    };
  })
  .filter((row): row is DeliveryVsInStoreBasketPair => row !== null)
  .slice(0, 6);

const deliveryVsInStoreOnlineBasketTotal = deliveryVsInStoreBasketPairs.length > 0
  ? roundSek(deliveryVsInStoreBasketPairs.reduce((sum, row) => sum + row.onlineProduct.price, 0))
  : null;
const deliveryVsInStoreInStoreBasketTotal = deliveryVsInStoreBasketPairs.length > 0
  ? roundSek(deliveryVsInStoreBasketPairs.reduce((sum, row) => sum + row.inStoreProduct.lowestPrice, 0))
  : null;
const deliveryVsInStoreMatchedChainIds = [...new Set(deliveryVsInStoreBasketPairs.map((row) => row.inStoreProduct.lowestChain))];

const deliveryVsInStoreDeliveryPlan = planBasketTripCost({
  currency: 'SEK',
  travelMode: 'delivery',
  options: [
    {
      strategyId: 'mathem-public-online-delivery-fee-49',
      label: 'Mathem public online basket + 49 kr deliveryFee scenario',
      basketTotal: deliveryVsInStoreOnlineBasketTotal,
      storeIds: ['mathem-online-public-search'],
      deliveryFee: 49
    },
    {
      strategyId: 'mathem-public-online-delivery-fee-79',
      label: 'Mathem public online basket + 79 kr deliveryFee scenario',
      basketTotal: deliveryVsInStoreOnlineBasketTotal,
      storeIds: ['mathem-online-public-search'],
      deliveryFee: 79
    }
  ]
});

const deliveryVsInStoreInStorePlan = planBasketTripCost({
  currency: 'SEK',
  travelMode: 'car',
  valueOfTimePerHour: 120,
  carCostPerKm: 3.5,
  options: [
    {
      strategyId: 'matched-chain-in-store-nearby-car-trip',
      label: 'Matched-chain in-store basket + nearby car/time scenario',
      basketTotal: deliveryVsInStoreInStoreBasketTotal,
      storeIds: deliveryVsInStoreMatchedChainIds.length > 0 ? deliveryVsInStoreMatchedChainIds : ['matched-chain-public-prices'],
      distanceKm: 3.2,
      durationMinutes: 28
    },
    {
      strategyId: 'matched-chain-in-store-longer-car-trip',
      label: 'Matched-chain in-store basket + longer car/time scenario',
      basketTotal: deliveryVsInStoreInStoreBasketTotal,
      storeIds: deliveryVsInStoreMatchedChainIds.length > 0 ? deliveryVsInStoreMatchedChainIds : ['matched-chain-public-prices'],
      distanceKm: 6.5,
      durationMinutes: 44
    }
  ]
});

export const deliveryVsInStoreComparison = {
  title: 'Online delivery vs in-store total',
  status: 'static_public_scenario_from_verified_price_rows',
  sourceLabel: mathemSource.source,
  retrievedAt: mathemSource.retrievedAt,
  onlineRowCount: mathemProducts.length,
  basketLabel: 'Matched staple-token basket; product-name evidence only, not exact-retailer equivalence.',
  matchedBasketRows: deliveryVsInStoreBasketPairs.map((row) => ({
    matchedToken: row.matchedToken,
    matchEvidence: row.matchEvidence,
    onlineName: row.onlineProduct.name,
    onlineBrand: row.onlineProduct.brand,
    onlinePackageText: row.onlineProduct.packageText,
    onlinePrice: row.onlineProduct.price,
    onlinePriceText: row.onlineProduct.priceText,
    onlineUnitPriceText: formatSourceUnitPriceText(row.onlineProduct.unitPriceText, row.onlineProduct.unitPriceUnit, {
      locale: 'sv-SE',
      currency: observedSnapshotCurrency
    }),
    onlineSourceUrl: row.onlineProduct.sourceUrl,
    inStoreName: row.inStoreProduct.name,
    inStoreBrand: row.inStoreProduct.brand,
    inStorePackageText: row.inStoreProduct.subline,
    inStoreLowestChain: row.inStoreProduct.lowestChain,
    inStoreLowestPrice: row.inStoreProduct.lowestPrice,
    inStoreLowestPriceText: formatSek(row.inStoreProduct.lowestPrice),
    inStoreChains: row.inStoreProduct.inChains,
    productPriceDelta: roundSek(row.onlineProduct.price - row.inStoreProduct.lowestPrice)
  })),
  onlineBasketTotal: deliveryVsInStoreOnlineBasketTotal,
  inStoreBasketTotal: deliveryVsInStoreInStoreBasketTotal,
  deliveryFeeScenarios: deliveryVsInStoreDeliveryPlan.options.map((option) => ({
    strategyId: option.strategyId,
    label: option.label,
    deliveryFee: option.deliveryFee ?? 0,
    pricedBasketTotal: option.pricedBasketTotal,
    travelCost: option.travelCost,
    effectiveTotal: option.effectiveTotal,
    warnings: option.warnings
  })),
  deliveryPlan: deliveryVsInStoreDeliveryPlan,
  inStorePlan: deliveryVsInStoreInStorePlan,
  bestDeliveryOption: deliveryVsInStoreDeliveryPlan.bestOption,
  bestInStoreOption: deliveryVsInStoreInStorePlan.bestOption,
  effectiveTotalDelta: deliveryVsInStoreDeliveryPlan.bestOption?.effectiveTotal !== null && deliveryVsInStoreDeliveryPlan.bestOption?.effectiveTotal !== undefined && deliveryVsInStoreInStorePlan.bestOption?.effectiveTotal !== null && deliveryVsInStoreInStorePlan.bestOption?.effectiveTotal !== undefined
    ? roundSek(deliveryVsInStoreDeliveryPlan.bestOption.effectiveTotal - deliveryVsInStoreInStorePlan.bestOption.effectiveTotal)
    : null,
  guardrails: [
    'deliveryFee values are explicit scenario inputs and are rendered separately from verified product prices.',
    'Mathem prices come from public search page __NEXT_DATA__ rows, not from checkout, stock, payment, or delivery booking evidence.',
    'This comparison is not a retailer reservation and cannot book delivery, pickup, payment, or inventory.',
    'Matched staple-token rows show product-name evidence only; exact substitutions still require shopper review.',
    'Private home location, saved basket contents, and retailer sessions stay absent from this static snapshot.'
  ],
  engineGuardrails: [...deliveryVsInStoreDeliveryPlan.guardrails, ...deliveryVsInStoreInStorePlan.guardrails]
};

const openFoodFactsEcoEvidenceByCode = new Map(openFoodFactsCatalog.map((product) => [product.code, product]));
const explicitEcoLabelNeedles = [
  'ecological',
  'organic',
  'fairtrade',
  'msc',
  'sustainable',
  'carbon',
  'from_sweden',
  'swedish_flag',
  'eu_ecological'
];

function normalizedEcoEvidence(value: string) {
  return value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function ecoEvidenceForProduct(product: (typeof axfoodProducts)[number]) {
  const catalogProduct = openFoodFactsEcoEvidenceByCode.get(product.code);
  const evidencePool = [
    ...product.labels,
    ...(catalogProduct?.labels ?? []),
    ...(catalogProduct?.categories ?? [])
  ];
  const normalizedEvidence = evidencePool.map(normalizedEcoEvidence);
  const evidence = [
    normalizedEvidence.some((label) => label.includes('ecological') || label.includes('organic') || label.includes('eu_ecological')) ? 'organic/ecological label' : null,
    normalizedEvidence.some((label) => label.includes('fairtrade')) ? 'Fairtrade label' : null,
    normalizedEvidence.some((label) => label.includes('msc') || label.includes('sustainable')) ? 'sustainability label' : null,
    normalizedEvidence.some((label) => label.includes('from_sweden') || label.includes('swedish_flag')) ? 'Swedish origin label' : null,
    normalizedEvidence.some((label) => label.includes('carbon')) ? 'carbon-footprint label present' : null
  ].filter((value): value is string => value !== null);
  const explicitEvidenceCount = normalizedEvidence.filter((label) => explicitEcoLabelNeedles.some((needle) => label.includes(needle))).length;
  return {
    catalogProduct,
    evidence: [...new Set(evidence)],
    explicitEvidenceCount
  };
}

function categoryAverageLowestPrice(category: string) {
  const prices = axfoodProducts
    .filter((product) => product.category === category && Number.isFinite(product.lowestPrice) && product.lowestPrice > 0)
    .map((product) => product.lowestPrice);
  return prices.length > 0 ? roundSek(prices.reduce((sum, price) => sum + price, 0) / prices.length) : null;
}

const ecoBasketRows = axfoodProducts
  .map((product) => {
    const { catalogProduct, evidence, explicitEvidenceCount } = ecoEvidenceForProduct(product);
    const categoryAveragePrice = categoryAverageLowestPrice(product.category);
    const estimatedSavingsVsCategoryAverage = categoryAveragePrice !== null ? roundSek(categoryAveragePrice - product.lowestPrice) : null;
    const carbonKgCo2e = null as number | null;
    if (evidence.length === 0 || estimatedSavingsVsCategoryAverage === null || estimatedSavingsVsCategoryAverage <= 0) return null;
    return {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      lowestChain: product.lowestChain,
      currentPrice: product.lowestPrice,
      categoryAveragePrice,
      estimatedSavingsVsCategoryAverage,
      evidence,
      catalogLabels: catalogProduct?.labels ?? [],
      catalogCategories: catalogProduct?.categories.slice(0, 4) ?? [],
      carbonKgCo2e,
      ecoScore: clamp(45 + (evidence.length * 12) + Math.min(18, explicitEvidenceCount * 3), 0, 100),
      confidence: catalogProduct ? 'medium_openfoodfacts_and_retailer_label' : 'medium_retailer_label',
      guardrail: 'ecoScore is a label-evidence score; carbon data unavailable for this row.'
    };
  })
  .filter((row): row is NonNullable<typeof row> => row !== null)
  .sort((a, b) => b.ecoScore - a.ecoScore || b.estimatedSavingsVsCategoryAverage - a.estimatedSavingsVsCategoryAverage)
  .slice(0, 6);

export const ecoBasketScorecard = {
  title: 'Cheaper + greener basket',
  persona: 'Eco-conscious',
  status: 'visible_label_evidence_scorecard',
  sourceSummary: {
    axfoodRows: axfoodProducts.length,
    openFoodFactsRows: openFoodFactsCatalog.length,
    carbonKgCo2e: null as number | null
  },
  rows: ecoBasketRows,
  averageEcoScore: ecoBasketRows.length > 0 ? roundSek(ecoBasketRows.reduce((sum, row) => sum + row.ecoScore, 0) / ecoBasketRows.length) : null,
  totalEstimatedSavingsVsCategoryAverage: roundSek(ecoBasketRows.reduce((sum, row) => sum + row.estimatedSavingsVsCategoryAverage, 0)),
  guardrails: [
    'carbon data unavailable: no kg CO2e value is fabricated or inferred from category labels.',
    'ecoScore uses only visible retailer labels and OpenFoodFacts label/category evidence.',
    'Savings compare each labelled row against actual same-category Axfood lowest-price rows.',
    'Rows without positive savings or explicit eco evidence are withheld from the cheaper + greener basket.'
  ]
};


export const sustainableBrandFilter = {
  persona: 'Eco-conscious',
  title: 'Sustainable-brand filter',
  sourceSummary: {
    axfoodRows: axfoodProducts.length,
    openFoodFactsRows: openFoodFactsCatalog.length,
    carbonKgCo2e: null as number | null
  },
  rows: axfoodProducts
    .map((product) => {
      const { catalogProduct, evidence, explicitEvidenceCount } = ecoEvidenceForProduct(product);
      const evidenceLabels = [
        ...product.labels,
        ...(catalogProduct?.labels ?? []),
        ...(catalogProduct?.categories ?? [])
      ]
        .filter((label) => explicitEcoLabelNeedles.some((needle) => normalizedEcoEvidence(label).includes(needle)))
        .slice(0, 6);
      if (evidence.length === 0 || evidenceLabels.length === 0) return null;
      return {
        slug: product.slug,
        productName: product.name,
        brand: product.brand,
        categorySlug: product.category,
        lowestChain: product.lowestChain,
        lowestPrice: product.lowestPrice,
        spreadPct: product.spreadPct,
        evidenceLabels: [...new Set(evidenceLabels)],
        evidenceSummary: evidence,
        confidence: catalogProduct ? 'medium_openfoodfacts_and_retailer_label' : 'medium_retailer_label',
        filterScore: clamp(50 + (evidence.length * 10) + Math.min(20, explicitEvidenceCount * 2) + Math.min(10, product.inChains.length * 2), 0, 100),
        guardrail: 'Verified label evidence only; this is not a carbon claim and does not infer lifecycle impact.'
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.filterScore - a.filterScore || b.spreadPct - a.spreadPct)
    .slice(0, 8),
  guardrails: [
    'Sustainable-brand filter rows require explicit retailer or OpenFoodFacts label/category evidence.',
    'The filter displays lowest visible chain price and spread, but does not turn labels into carbon-impact estimates.',
    'Rows without verified label evidence are withheld instead of being inferred from brand names or category browsing.'
  ]
};

export const crowdPriceSubmissionContract = {
  title: 'Crowd price submissions',
  status: 'account_gated_intake_contract',
  sourceRecordType: 'community_report',
  trustTable: 'community_reporter_trust',
  protectedEndpoint: '/api/community-price-reports',
  requiredEvidence: [
    {
      field: 'photoEvidence',
      copy: 'Receipt or shelf-photo evidence with contentType and byteLength before upload.'
    },
    {
      field: 'reportedPrice',
      copy: 'SEK price exactly as seen on shelf or receipt, never estimated.'
    },
    {
      field: 'productOrCommodity',
      copy: 'Verified product id or commodity alias candidate for loose meat/veg coverage.'
    },
    {
      field: 'storeEvidence',
      copy: 'Store id/name and observedAt timestamp from shopper context.'
    }
  ],
  trustControls: planCommunityReportAbuseControls({ reporters: [] }),
  defaultTrustPolicy: [
    'Throttle reporters above 20 community reports in 24 hours.',
    'Require manual review when a reporter has more than 5 unresolved reports.',
    'Suspend reporting when rejected-report volume is high and acceptance ratio is below 20%.'
  ],
  guardrails: [
    'No anonymous price reports: shopper session and userId are required before any community report is accepted.',
    'Community price reports enter manual review before they can affect verified prices or loose commodity coverage.',
    'Photo evidence is stored as private evidence and not rendered publicly in this static snapshot.',
    'community_reporter_trust throttles, suspends, or requires manual review for risky reporters.'
  ],
  reviewWritebacks: ['accept_community_report', 'dismiss_community_report'],
  nextRuntimeStep: 'Wire the protected runtime endpoint to persist community_report raw_records and enqueue human_review_assignments.'
};

const tomatoCommodity = COMMODITIES.find((commodity) => commodity.slug === 'tomato') ?? COMMODITIES[0]!;
const bananaCommodity = COMMODITIES.find((commodity) => commodity.slug === 'banana') ?? COMMODITIES[0]!;

const commodityMappingReviewCandidates = [
  {
    id: 'commodity-map-kvisttomat-willys',
    commodityId: tomatoCommodity.slug,
    commodityName: tomatoCommodity.nameSv,
    productId: 'willys-kvisttomat-losvikt',
    productName: 'Kvisttomat lösvikt',
    alias: 'Kvisttomat',
    chainLabel: 'Willys Odenplan',
    sourceConfidence: 0.52,
    reporterId: 'reporter-produce-1',
    createdAt: '2026-05-22T10:00:00.000Z',
    evidence: ['chain_label:Willys Odenplan', 'unit_price:34.90 kr/kg', 'source:receipt_ocr']
  },
  {
    id: 'commodity-map-banan-reviewed',
    commodityId: bananaCommodity.slug,
    commodityName: bananaCommodity.nameSv,
    productId: 'willys-banan-losvikt',
    productName: 'Banan lösvikt',
    alias: 'Banan',
    chainLabel: 'Willys Odenplan',
    sourceConfidence: 0.91,
    createdAt: '2026-05-22T11:00:00.000Z',
    evidence: ['chain_label:Willys Odenplan', 'unit_price:23.60 kr/kg', 'source:receipt_ocr']
  }
];

const commodityMappingQueue = planHumanReviewQueue({
  productMatches: [],
  communityReports: [],
  commodityMappings: commodityMappingReviewCandidates
});

const commodityMappingAssignmentPlan = planHumanReviewAssignments({
  assignedAt: '2026-05-22T12:00:00.000Z',
  queue: commodityMappingQueue,
  reviewers: [
    { id: 'curator-produce-1', active: true, openAssignmentCount: 0, maxOpenAssignments: 3, specialties: ['commodity_mapping'] }
  ]
});

export const commodityMappingReviewPlan = {
  title: 'Commodity mapping review',
  status: commodityMappingQueue.length > 0 ? 'review_required' : 'ready_for_shopper_surface',
  queueTable: 'human_review_assignments',
  trustTable: 'community_reporter_trust',
  candidates: commodityMappingReviewCandidates,
  queue: commodityMappingQueue,
  assignments: commodityMappingAssignmentPlan.assignments,
  unassigned: commodityMappingAssignmentPlan.unassigned,
  reporterControls: planCommunityReportAbuseControls({
    reporters: [
      { reporterId: 'reporter-produce-1', reportsLast24Hours: 2, pendingReports: 1, acceptedReportsLast30Days: 6, rejectedReportsLast30Days: 1 }
    ]
  }),
  reviewWritebacks: ['approve_commodity_mapping', 'reject_commodity_mapping'],
  guardrails: [
    'Low-confidence commodity↔item maps are review-only and are not shown to shoppers as verified coverage.',
    'human_review_assignments receives the commodity_mapping work item before any alias can affect product_aliases or commodity coverage.',
    'community_reporter_trust throttles risky reporters before their commodity aliases reach a curator.',
    'Approved mappings still need auditable reviewer identity and source evidence before writeback.'
  ],
  nextRuntimeStep: 'Persist commodity_mapping assignments and decisions through the protected human-review endpoint, then write approved aliases into product_aliases.'
};


function brandTierForAxfoodProduct(product: (typeof axfoodProducts)[number]): BrandTier {
  const brand = product.brand.toLowerCase();
  const labels = product.labels.map((label) => label.toLowerCase());
  const isRetailerPrivateLabel =
    brand.includes('garant') ||
    brand.includes('eldorado') ||
    brand.includes('ica') ||
    brand.includes('coop') ||
    brand.includes('änglamark') ||
    brand.includes('x-tra');
  if ((brand.includes('garant eko') || brand.includes('änglamark')) || (isRetailerPrivateLabel && (labels.includes('ecological') || labels.includes('eu_ecological')))) return 'organic_private_label';
  if (brand.includes('eldorado') || brand.includes('x-tra') || brand.includes('basic')) return 'budget_private_label';
  if (isRetailerPrivateLabel) return 'standard_private_label';
  if (brand.includes('willys') || brand.includes('lidl') || brand.includes('city gross')) return 'discount_chain_label';
  return 'national';
}

function privateLabelDupeMatchInput(product: (typeof axfoodProducts)[number]): (ProductMatchInput & { unitPrice: number }) | null {
  const packageAmount = unitAmountFromPackage(product.subline);
  const unitPrice = normalizeComparableUnitPrice(product.lowestPrice, product.subline);
  if (!packageAmount || !unitPrice) return null;
  const packageSize = packageAmount.unit === 'kg'
    ? packageAmount.amount * 1000
    : packageAmount.unit === 'l'
      ? packageAmount.amount * 1000
      : packageAmount.amount;
  const packageUnit = packageAmount.unit === 'kg' ? 'g' : packageAmount.unit === 'l' ? 'ml' : 'piece';
  return {
    id: product.slug,
    brand: product.brand,
    category: product.category,
    packageSize,
    packageUnit,
    brandTier: brandTierForAxfoodProduct(product),
    unitPrice: unitPrice.unitPrice
  };
}

const privateLabelDupeProductBySlug = new Map(axfoodProducts.map((product) => [product.slug, product]));
const privateLabelDupeInputs = axfoodProducts
  .map((product) => ({ product, input: privateLabelDupeMatchInput(product) }))
  .filter((row): row is { product: (typeof axfoodProducts)[number]; input: ProductMatchInput & { unitPrice: number } } => row.input !== null);

const privateLabelBrandTiers: BrandTier[] = ['standard_private_label', 'budget_private_label', 'organic_private_label', 'discount_chain_label'];
const dupeStopwords = new Set([
  'eko',
  'ekologisk',
  'klass',
  'stor',
  'liten',
  'färsk',
  'svensk',
  'naturell',
  'original',
  'extra',
  'tobaksfritt',
  'snus',
  'portion',
  'white',
  'mini',
  'maxi',
  'fryst',
  'frysta',
  'pack',
  'mild',
  'mellan',
  'skivat',
  'skivad',
  'havssalt',
  'ekologiskt'
]);

function normalizedDupeTokens(product: (typeof axfoodProducts)[number]) {
  return new Set(
    product.name
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .split(/[^a-z0-9åäö]+/i)
      .filter((token) => token.length >= 4 && !dupeStopwords.has(token))
  );
}

function hasPrivateLabelDupeNameEvidence(source: (typeof axfoodProducts)[number], candidate: (typeof axfoodProducts)[number]) {
  const sourceTokens = normalizedDupeTokens(source);
  const candidateTokens = normalizedDupeTokens(candidate);
  return [...sourceTokens].some((token) => candidateTokens.has(token));
}

const privateLabelDupeRows = privateLabelDupeInputs
  .filter(({ input }) => input.brandTier === 'national' || input.brandTier === 'premium')
  .flatMap(({ product: sourceProduct, input: source }) => {
    const candidates = privateLabelDupeInputs
      .filter(({ product, input }) =>
        product.slug !== sourceProduct.slug &&
        input.category === source.category &&
        input.unitPrice < source.unitPrice &&
        privateLabelBrandTiers.includes(input.brandTier) &&
        hasPrivateLabelDupeNameEvidence(sourceProduct, product)
      )
      .map(({ input }) => input);

    return recommendSmartSwaps({
      source,
      candidates,
      acceptPrivateLabel: 'yes',
      minimumSavingsPercent: 5,
      privateLabelPreference: {
        acceptedTiers: privateLabelBrandTiers,
        blockedCategories: ['baby_formula', 'medical_diet']
      }
    }).flatMap((swap) => {
      const dupeProduct = privateLabelDupeProductBySlug.get(swap.productId);
      if (!dupeProduct) return [];
      const sourceUnit = normalizeComparableUnitPrice(sourceProduct.lowestPrice, sourceProduct.subline);
      const dupeUnit = normalizeComparableUnitPrice(dupeProduct.lowestPrice, dupeProduct.subline);
      if (!sourceUnit || !dupeUnit) return [];
      return [{
        sourceSlug: sourceProduct.slug,
        sourceName: sourceProduct.name,
        nationalBrand: sourceProduct.brand,
        sourcePrice: sourceProduct.lowestPrice,
        sourceUnitPrice: sourceUnit.unitPrice,
        sourcePackage: sourceUnit.packageLabel,
        dupeSlug: dupeProduct.slug,
        dupeName: dupeProduct.name,
        privateLabelBrand: dupeProduct.brand,
        privateLabelTier: brandTierForAxfoodProduct(dupeProduct),
        dupePrice: dupeProduct.lowestPrice,
        dupeUnitPrice: dupeUnit.unitPrice,
        dupePackage: dupeUnit.packageLabel,
        unitLabel: sourceUnit.unitLabel,
        cheapestChain: chainDisplayName(dupeProduct.lowestChain),
        nameEvidence: [...normalizedDupeTokens(sourceProduct)].filter((token) => normalizedDupeTokens(dupeProduct).has(token)),
        savingsPercent: swap.savingsPercent,
        confidence: swap.confidence,
        qualityRisk: swap.qualityRisk,
        reason: swap.reason
      }];
    });
  })
  .sort((left, right) => right.savingsPercent - left.savingsPercent || left.sourceName.localeCompare(right.sourceName, 'sv'));

export const privateLabelDupeFinder = {
  title: 'Private-label dupe finder',
  topDupes: privateLabelDupeRows.slice(0, 8),
  sourceProductCount: new Set(privateLabelDupeRows.map((row) => row.sourceSlug)).size,
  privateLabelProductCount: new Set(privateLabelDupeRows.map((row) => row.dupeSlug)).size,
  categoryCount: new Set(privateLabelDupeRows.map((row) => privateLabelDupeProductBySlug.get(row.sourceSlug)?.category).filter(Boolean)).size,
  guardrails: [
    'Calls recommendSmartSwaps before any brand-name row is paired with a private label.',
    'Requires same category, comparable package size, lower verified unit price, and accepted private-label tier.',
    'Does not claim ingredient identity, nutrition equivalence, stock, or account-specific loyalty eligibility.'
  ]
};

const commodityAliasMatchers: Record<string, RegExp[]> = {
  tomato: [/tomat/i],
  cucumber: [/gurka/i],
  carrot: [/morot/i],
  'yellow-onion': [/gul\s*lök|lök\s+gul/i],
  potato: [/potatis/i],
  'bell-pepper': [/paprika/i],
  'iceberg-lettuce': [/isberg|salladskål/i],
  banana: [/banan/i],
  apple: [/äpple/i],
  'beef-mince': [/nötfärs/i],
  'mixed-mince': [/blandfärs/i],
  'pork-mince': [/fläskfärs/i],
  'chicken-breast': [/kycklingfilé|bröstfilé/i],
  'chicken-thigh': [/kyckling\s*lårfilé/i],
  'whole-chicken': [/hel\s+kyckling/i],
  'pork-chop': [/fläskkotlett/i],
  salmon: [/\blax\b/i],
  eggs: [/ägg/i],
  milk: [/mjölk/i],
  rice: [/\bris\b/i],
  pasta: [/pasta|spaghetti/i]
};

function commodityForAxfoodProduct(product: (typeof axfoodProducts)[number]): Commodity | null {
  const haystack = `${product.name} ${product.brand} ${product.subline}`.normalize('NFC');
  return COMMODITIES.find((commodity) => commodityAliasMatchers[commodity.slug]?.some((matcher) => matcher.test(haystack))) ?? null;
}

function comparableUnitFromPriceUnit(priceUnit: string | null | undefined): ComparableUnit | null {
  const normalized = priceUnit?.toLowerCase() ?? '';
  if (normalized.includes('kg')) return 'kg';
  if (normalized.includes('/l') || normalized.includes('liter')) return 'l';
  if (normalized.includes('/st') || normalized.includes('styck')) return 'st';
  return null;
}

function chainDisplayName(chainId: string) {
  if (chainId === 'hemkop') return 'Hemköp';
  if (chainId === 'willys') return 'Willys';
  return chainId.charAt(0).toUpperCase() + chainId.slice(1);
}

function commodityObservationConfidence(product: (typeof axfoodProducts)[number], commodity: Commodity, unit: ComparableUnit) {
  const nameMatchesCanonical = product.name.toLowerCase().includes(commodity.nameSv.toLowerCase().split(' ')[0] ?? commodity.nameSv.toLowerCase());
  const hasUnitPriceCode = product.code.endsWith('_KG') || Object.values(product.chains).some((row) => row.priceUnit?.toLowerCase().includes(`/${unit}`));
  return clamp((nameMatchesCanonical ? 0.12 : 0) + (hasUnitPriceCode ? 0.68 : 0.52) + Math.min(product.inChains.length, 2) * 0.04, 0, 0.92);
}

export const commodityPriceObservations: CommodityPriceObservation[] = axfoodProducts.flatMap((product) => {
  const commodity = commodityForAxfoodProduct(product);
  if (!commodity) return [];

  return Object.entries(product.chains).flatMap(([chainId, row]) => {
    const comparableUnit = comparableUnitFromPriceUnit(row.priceUnit);
    if (comparableUnit !== commodity.comparableUnit || typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price <= 0) return [];
    return [{
      commodityId: commodity.slug,
      commodityName: commodity.nameSv,
      productId: product.slug,
      productName: product.name,
      chainId,
      chainName: chainDisplayName(chainId),
      unitPrice: row.price,
      comparableUnit,
      sourceConfidence: commodityObservationConfidence(product, commodity, comparableUnit),
      observedAt: snapshot.retrievedLabel,
      variant: product.subline || product.brand || undefined,
      isOrganic: product.labels.includes('ecological') || product.labels.includes('eu_ecological'),
      originCountry: product.labels.includes('swedish_flag') || product.labels.includes('from_sweden') ? 'SE' : undefined
    }];
  });
});

export const commodityComparisonReports = COMMODITIES.map((commodity) => compareCommodityUnitPrices({
  commodityId: commodity.slug,
  commodityName: commodity.nameSv,
  comparableUnit: commodity.comparableUnit,
  observations: commodityPriceObservations,
  minimumConfidence: 0.6
}));

export const commodityComparisons = commodityComparisonReports
  .filter((comparison) => comparison.status === 'priced')
  .sort((left, right) =>
    (right.cheapestChain?.savingsVsNextPercent ?? 0) - (left.cheapestChain?.savingsVsNextPercent ?? 0) ||
    right.coverage.chainCount - left.coverage.chainCount ||
    left.commodityName.localeCompare(right.commodityName, 'sv')
  )
  .slice(0, 12);

export const commodityComparisonCaveat = 'commodity/alias match confidence is medium by design: loose items compare by canonical commodity and unit price, not barcode.';

export const freshFoodStapleBasket = STAPLE_BASKET.map((commodity) => ({
  slug: commodity.slug,
  label: commodity.nameSv,
  comparableUnit: commodity.comparableUnit,
  categoryPath: commodity.categoryPath.join(' › '),
  is_staple: commodity.isStaple === true
}));

const freshFoodStapleIds = new Set(freshFoodStapleBasket.map((commodity) => commodity.slug));

export const freshFoodChainIndexObservations: ChainPriceObservation[] = commodityPriceObservations
  .filter((observation) => observation.sourceConfidence >= 0.6 && freshFoodStapleIds.has(observation.commodityId))
  .map((observation) => ({
    chainId: observation.chainId,
    category: observation.commodityId,
    unitPrice: observation.unitPrice
  }));

const freshFoodCoveredStapleIds = new Set(freshFoodChainIndexObservations.map((observation) => observation.category));
const freshFoodIndexReport = calculateChainPriceIndex(freshFoodChainIndexObservations);

export const freshFoodChainIndex = {
  title: 'Fresh-food staple basket index',
  sourceLabel: 'STAPLE_BASKET commodity taxonomy + Axfood chain unit prices',
  minimumSourceConfidence: 0.6,
  stapleBasket: freshFoodStapleBasket,
  observationCount: freshFoodChainIndexObservations.length,
  coveredStapleCount: freshFoodCoveredStapleIds.size,
  totalStapleCount: freshFoodStapleBasket.length,
  coverageLabel: `${freshFoodCoveredStapleIds.size}/${freshFoodStapleBasket.length} is_staple commodities have confidence-cleared unit-price evidence`,
  unitLabels: [...new Set(freshFoodStapleBasket.map((commodity) => `kr/${commodity.comparableUnit}`))],
  report: freshFoodIndexReport,
  guardrails: [
    'No forecast: the fresh-food index is a 100-centred snapshot from observed unit prices only.',
    'Only commodity observations with sourceConfidence >= 0.6 enter the index.',
    'STAPLE_BASKET rows are representative fresh-food staples, not a personalized basket or stock claim.',
    'Loose and packaged staple rows compare by kr/kg, kr/l, or kr/st; barcode equivalence is not assumed.'
  ]
};

export function commodityComparisonForProduct(slug: string) {
  const product = axfoodProducts.find((candidate) => candidate.slug === slug);
  if (!product) return null;
  const commodity = commodityForAxfoodProduct(product);
  if (!commodity) return null;
  return commodityComparisonReports.find((comparison) => comparison.commodityId === commodity.slug) ?? null;
}


function recurringDigestLineFromProduct(product: (typeof productUniverse)[number], index: number) {
  const isChainProduct = 'lowestPrice' in product;
  const currentUnitPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
  const previousMultiplier = index === 0 ? 1.14 : index === 1 ? 0.89 : index === 2 ? 0.96 : 1.05;
  return {
    productId: product.slug,
    productName: product.name,
    quantity: index === 1 ? 2 : 1,
    currentUnitPrice,
    previousUnitPrice: Math.round(currentUnitPrice * previousMultiplier * 100) / 100,
    currentStoreName: isChainProduct ? product.lowestChain : 'OpenPrices community median',
    previousStoreName: 'Previous weekly basket baseline',
    ...(index === 3 ? { substituteProductName: productUniverse[index + 1]?.name ?? 'verified lower-priced substitute' } : {}),
    confidence: isChainProduct ? 0.9 : 0.72
  };
}

export const weeklyBasketChangeDigest = planRecurringBasketDigest({
  templateId: 'public-weekly-basics-visible-prices',
  templateName: 'Public weekly basics',
  cadence: 'weekly',
  asOf: '2026-05-22T08:00:00.000Z',
  lastPurchasedAt: '2026-05-15T08:00:00.000Z',
  lines: [
    ...productUniverse.slice(0, 4).map(recurringDigestLineFromProduct),
    {
      productId: 'missing-current-price-example',
      productName: 'Saved basket item awaiting a current verified price',
      quantity: 1,
      currentUnitPrice: null,
      previousUnitPrice: 39.9,
      previousStoreName: 'Previous weekly basket baseline',
      confidence: 0.2
    }
  ]
});

export const savedBasketAutoReorderPlanner = {
  persona: 'Busy professionals',
  title: 'Saved basket auto-reorder',
  corePlanner: 'planRecurringBasketDigest',
  endpoint: '/api/basket/recurring-digest',
  templateId: weeklyBasketChangeDigest.templateId,
  templateName: weeklyBasketChangeDigest.templateName,
  cadence: weeklyBasketChangeDigest.cadence,
  asOf: weeklyBasketChangeDigest.asOf,
  autoReorderDecision: {
    status: weeklyBasketChangeDigest.changeSummary.missingCurrentPrice > 0 ? 'review_required' : 'ready_for_signed_in_confirmation',
    label: weeklyBasketChangeDigest.changeSummary.missingCurrentPrice > 0
      ? 'Review missing-price blockers before reordering'
      : 'Ready for signed-in shopper confirmation',
    comparableCurrentTotal: weeklyBasketChangeDigest.comparableCurrentTotal,
    comparablePreviousTotal: weeklyBasketChangeDigest.comparablePreviousTotal,
    comparableDelta: weeklyBasketChangeDigest.comparableDelta,
    priceDownLines: weeklyBasketChangeDigest.changeSummary.priceDown,
    priceUpLines: weeklyBasketChangeDigest.changeSummary.priceUp,
    missingPriceBlockerCount: weeklyBasketChangeDigest.changeSummary.missingCurrentPrice
  },
  reviewLines: weeklyBasketChangeDigest.lines.slice(0, 4).map((line) => ({
    productId: line.productId,
    productName: line.productName,
    changeType: line.changeType,
    recommendedAction: line.recommendedAction,
    currentUnitPrice: line.currentUnitPrice,
    previousUnitPrice: line.previousUnitPrice,
    confidence: line.confidence
  })),
  missingPriceBlockers: weeklyBasketChangeDigest.lines
    .filter((line) => line.changeType === 'missing_current_price' || line.currentUnitPrice === null)
    .map((line) => ({
      productId: line.productId,
      productName: line.productName,
      blocker: 'Missing current verified price; do not prepare retailer handoff until this line has evidence.'
    })),
  guardrails: [
    'Requires a signed-in shopper confirmation before any recurring basket plan is saved.',
    'The plan is not automatic purchase, payment, or retailer order placement.',
    'Suggested substitutes stay review-only and never rewrite a saved recurring basket automatically.',
    'Missing-price blockers remain visible and stop any handoff preparation until verified prices return.'
  ]
};

export type AdaptiveProductCard = {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  imageAlt: string | null;
  productKind: 'branded' | 'commodity';
  totalPriceLabel: string;
  unitPriceLabel: string;
  packageLabel: string;
  sourceLabel: string;
  confidenceLabel: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceDrilldown: {
    sourceCount: number;
    observationAgeLabel: string;
    normalizationQuality: string;
    reviewStatus: string;
    rows: Array<{
      label: string;
      value: string;
    }>;
  };
  totalSortPrice: number;
  unitSortPrice: number | null;
  defaultCompareMode: 'total' | 'unit';
  cheapestUnitBadge: string | null;
  priceDropPercent: number | null;
  priceDropBadge: string | null;
  priceDropLabel: string | null;
  priceDropAnchorDate: string | null;
  sparklineWindowDays: 7;
  sparklinePoints: Array<{
    date: string;
    price: number;
    priceLabel: string;
  }>;
  sparklineLabel: string;
  isAvailable: boolean;
  safetyProfile: OpenFoodFactsSafetyProfile;
  safetyEvidenceLabel: string;
};

function isOpenPricesProduct(product: ItemComparisonProduct): product is (typeof pricedProducts)[number] {
  return 'observations' in product;
}

const emptySafetyProfile: OpenFoodFactsSafetyProfile = {
  dietaryTags: [],
  allergenTags: [],
  evidenceLabels: []
};

const openFoodFactsSafetyByCode = new Map(
  openFoodFactsCatalog.map((product) => [product.code, openFoodFactsSafetyProfile(product)])
);

const dietarySafetyFromAxfoodLabels: Partial<Record<string, DietarySafetyPreference>> = {
  crossed_ax: 'glutenfree',
  glutenfree: 'glutenfree',
  laktosfree: 'laktosfree',
  vegan: 'vegan',
  vegetarian: 'vegetarian'
};

const allergenSafetyNeedles: Array<{ tag: AllergenSafetyPreference; needles: string[]; safeNeedles: string[] }> = [
  { tag: 'milk', needles: ['mjölk', 'milk', 'laktos', 'lactose', 'ost', 'cheese', 'grädde'], safeNeedles: ['laktosfri', 'laktosfree', 'mjölkfri', 'milk-free', 'vegan'] },
  { tag: 'gluten', needles: ['gluten', 'vete', 'wheat', 'råg', 'rye', 'korn', 'barley'], safeNeedles: ['glutenfri', 'glutenfree', 'gluten-free', 'crossed_ax'] },
  { tag: 'nuts', needles: ['nöt', 'nötter', 'nuts', 'almond', 'mandel', 'peanut', 'jordnöt'], safeNeedles: [] },
  { tag: 'eggs', needles: ['ägg', 'egg'], safeNeedles: [] },
  { tag: 'soy', needles: ['soja', 'soy'], safeNeedles: [] },
  { tag: 'sesame', needles: ['sesam', 'sesame'], safeNeedles: [] }
];

function safetyProfileForProduct(product: (typeof productUniverse)[number]): OpenFoodFactsSafetyProfile {
  if (isOpenPricesProduct(product)) {
    return openFoodFactsSafetyByCode.get(product.code) ?? emptySafetyProfile;
  }

  const labels = product.labels.map((label) => label.toLocaleLowerCase('sv-SE'));
  const text = [
    product.name,
    product.brand,
    product.subline,
    product.category,
    ...labels
  ].join(' ').toLocaleLowerCase('sv-SE');
  const dietaryTags = labels
    .map((label) => dietarySafetyFromAxfoodLabels[label])
    .filter((tag): tag is DietarySafetyPreference => Boolean(tag));
  const allergenTags = allergenSafetyNeedles
    .filter((evidence) => (
      evidence.needles.some((needle) => text.includes(needle))
      && evidence.safeNeedles.every((safeNeedle) => !text.includes(safeNeedle))
    ))
    .map((evidence) => evidence.tag);

  return {
    dietaryTags: [...new Set(dietaryTags)],
    allergenTags: [...new Set(allergenTags)],
    evidenceLabels: product.labels
  };
}

function sevenDaySparklinePoints(product: (typeof productUniverse)[number]): AdaptiveProductCard['sparklinePoints'] {
  if (!isOpenPricesProduct(product)) return [];

  const latestObservedAt = product.lastObservedAt.includes('T')
    ? product.lastObservedAt
    : `${product.lastObservedAt}T00:00:00.000Z`;
  const priceChartSeries = buildPriceChartSeries({
    observations: compareOverlayObservationsFor(product),
    asOf: latestObservedAt,
    rangeDays: 7,
    markerLimitPerSeries: 0
  });
  const series = priceChartSeries.series[0];
  if (!series) return [];

  return series.points
    .slice(-7)
    .map((point) => ({
      date: point.time.slice(0, 10),
      price: point.value,
      priceLabel: formatSek(point.value)
    }));
}

function observationAgeLabel(observedAt: string, asOf = '2026-05-25') {
  const observedTime = Date.parse(observedAt.includes('T') ? observedAt : `${observedAt}T00:00:00.000Z`);
  const asOfTime = Date.parse(`${asOf}T00:00:00.000Z`);
  if (!Number.isFinite(observedTime) || !Number.isFinite(asOfTime)) return 'Observation age not reported';
  const ageDays = Math.max(0, Math.round((asOfTime - observedTime) / (24 * 60 * 60 * 1000)));
  return ageDays === 0 ? 'Observed today' : `Observed ${ageDays} day${ageDays === 1 ? '' : 's'} before ${asOf}`;
}

function confidenceLevelForEvidence(sourceCount: number, hasNormalizedUnit: boolean): AdaptiveProductCard['confidenceLevel'] {
  if (sourceCount >= 8 && hasNormalizedUnit) return 'high';
  if (sourceCount >= 2 || hasNormalizedUnit) return 'medium';
  return 'low';
}

export const adaptiveProductCards: AdaptiveProductCard[] = productUniverse.map((product) => {
  const isChainProduct = 'lowestPrice' in product;
  const totalPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
  const packageText = isChainProduct ? product.subline : product.quantity;
  const normalizedUnit = normalizeComparableUnitPrice(totalPrice, packageText);
  const productKind = adaptiveProductKind(product.category);
  const isAvailable = isChainProduct
    ? Object.values(product.chains).some((row) => typeof row.price === 'number' && row.price > 0 && row.isAvailable !== false)
    : true;
  const peerUnitPrices = isChainProduct && normalizedUnit
    ? Object.values(product.chains)
      .map((row) => row.price === null ? null : normalizeComparableUnitPrice(row.price, packageText)?.unitPrice ?? null)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    : [];
  const sparklinePoints = sevenDaySparklinePoints(product);
  const priceDrop = priceDropFromThirtyDayHistory(product);
  const safetyProfile = safetyProfileForProduct(product);
  const sourceCount = isChainProduct
    ? Object.values(product.chains).filter((row) => typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0).length
    : product.observationCount;
  const latestObservedAt = isChainProduct ? '2026-05-21' : product.lastObservedAt;
  const observationAge = observationAgeLabel(latestObservedAt);
  const normalizationQuality = normalizedUnit
    ? `Package parsed as ${normalizedUnit.packageLabel}; comparable ${normalizedUnit.unitLabel} retained.`
    : 'Package quantity missing or unparsable; comparable unit price is withheld.';
  const reviewStatus = isChainProduct
    ? 'Retailer catalog row accepted from Axfood source data; no community-review flag is attached.'
    : openFoodFactsSafetyByCode.has(product.code)
      ? 'OpenFoodFacts metadata linked for source review context.'
      : 'OpenPrices observation has no linked OpenFoodFacts review metadata yet.';
  const confidenceLevel = confidenceLevelForEvidence(sourceCount, Boolean(normalizedUnit));
  const confidenceDrilldown = {
    sourceCount,
    observationAgeLabel: observationAge,
    normalizationQuality,
    reviewStatus,
    rows: [
      { label: 'Source count', value: `${sourceCount.toLocaleString('sv-SE')} ${isChainProduct ? 'chain price row(s)' : 'OpenPrices observation(s)'}` },
      { label: 'Observation age', value: observationAge },
      { label: 'Normalization quality', value: normalizationQuality },
      { label: 'Review status', value: reviewStatus }
    ]
  };

  return {
    slug: product.slug,
    name: product.name,
    brand: isChainProduct ? product.brand : product.brands || 'Brand not reported',
    imageUrl: product.image || null,
    imageAlt: product.image ? `${product.name} product image from ${isChainProduct ? 'Axfood' : 'OpenPrices/OpenFoodFacts'} source data` : null,
    productKind,
    totalPriceLabel: formatSek(totalPrice),
    unitPriceLabel: normalizedUnit ? formatLocalizedUnitPrice(normalizedUnit.unitPrice, {
      locale: defaultLocale,
      currency: observedSnapshotCurrency,
      unit: normalizedUnit.unitLabel.replace('kr/', '')
    }) : unknownUnitPriceLabel,
    packageLabel: normalizedUnit?.packageLabel || packageText || 'Package size not reported',
    sourceLabel: isChainProduct ? `${product.lowestChain} lowest · ${formatPct(product.spreadPct)} spread` : `OpenPrices · ${product.observationCount.toLocaleString('sv-SE')} observations`,
    confidenceLabel: normalizedUnit ? `Derived from observed price + package size (${normalizedUnit.unitLabel})` : 'No synthetic unit prices: package quantity missing',
    confidenceLevel,
    confidenceDrilldown,
    totalSortPrice: totalPrice,
    unitSortPrice: normalizedUnit?.unitSortPrice ?? null,
    defaultCompareMode: productKind === 'commodity' ? 'unit' : 'total',
    cheapestUnitBadge: normalizedUnit ? cheapestUnitBadge(normalizedUnit.unitPrice, peerUnitPrices, normalizedUnit.unitLabel) : null,
    priceDropPercent: priceDrop?.percent ?? null,
    priceDropBadge: priceDrop?.badge ?? null,
    priceDropLabel: priceDrop?.label ?? null,
    priceDropAnchorDate: priceDrop?.anchorDate ?? null,
    sparklineWindowDays: 7,
    sparklinePoints,
    sparklineLabel: sparklinePoints.length >= 2
      ? `${sparklinePoints.length} observed daily points from price_daily/OpenPrices history`
      : '7-day sparkline waits for at least two observed price-history points',
    isAvailable,
    safetyProfile,
    safetyEvidenceLabel: safetyProfile.evidenceLabels.length > 0
      ? `OpenFoodFacts/Axfood label evidence: ${safetyProfile.evidenceLabels.slice(0, 3).join(', ')}`
      : 'No verified allergen or dietary label evidence found'
  };
});
export function withProductSearchExplanationBadges<T extends AdaptiveProductCard>(cards: T[], query: string): Array<T & { searchExplanationBadges?: SearchExplanationBadge[] }> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return cards;

  return cards.map((card) => ({
    ...card,
    searchExplanationBadges: searchExplanationBadgesForProduct({
      name: card.name,
      brand: card.brand,
      category: card.productKind,
      query: trimmedQuery
    })
  }));
}

export const homepageAdaptiveProductCards = adaptiveProductCards.slice(0, 6);
export const productBrandFilterOptions = [...new Set(
  adaptiveProductCards
    .map((card) => card.brand.trim())
    .filter((brand) => brand.length > 0 && brand !== 'Brand not reported')
)]
  .sort((left, right) => left.localeCompare(right, 'sv'))
  .map((brand) => ({
    value: brand,
    label: brand,
    productCount: adaptiveProductCards.filter((card) => card.brand === brand).length
  }));

const localeFormattingSampleCard = adaptiveProductCards.find((card) => card.unitSortPrice !== null) ?? adaptiveProductCards[0];
const localeFormattingSampleDate = freshestOpenPrices[0]?.lastObservedAt ?? null;

export const localeFormattingShowcase = supportedCurrencies.map((currency) => {
  const hasObservedRows = currency === observedSnapshotCurrency;
  return {
    currency,
    status: hasObservedRows ? 'observed from OpenPrices currency=SEK' : 'awaiting observations.currency rows',
    moneyLabel: hasObservedRows
      ? formatLocalizedMoney(localeFormattingSampleCard?.totalSortPrice, { locale: defaultLocale, currency })
      : 'No observed prices in this currency',
    unitPriceLabel: hasObservedRows
      ? localeFormattingSampleCard?.unitPriceLabel ?? unknownUnitPriceLabel
      : 'No unit price until observation lands',
    dateLabel: hasObservedRows
      ? formatLocalizedDate(localeFormattingSampleDate, { locale: defaultLocale })
      : 'No observed date',
    guardrail: hasObservedRows ? 'Uses observed SEK price rows only' : 'No currency conversion or fake price'
  };
});

const digitalCatalogueSampleOffers = icaReklambladOffers
  .filter((offer) => offer.priceText && offer.sourceUrl && offer.flyerUrl && offer.flyerPdfUrl)
  .sort((a, b) =>
    a.storeName.localeCompare(b.storeName, 'sv') ||
    a.category.localeCompare(b.category, 'sv') ||
    a.name.localeCompare(b.name, 'sv')
  )
  .slice(0, 6)
  .map((offer) => ({
    code: offer.code,
    productName: [offer.brand, offer.name].filter(Boolean).join(' · '),
    category: offer.category || 'Category not reported',
    priceText: offer.priceText,
    comparisonPrice: formatSourceUnitPriceText(offer.comparisonPrice, offer.comparisonPrice, {
      locale: 'sv-SE',
      currency: observedSnapshotCurrency
    }),
    regularPriceText: offer.regularPriceText || 'Regular price not reported',
    validTo: offer.validTo,
    storeName: offer.storeName,
    sourceUrl: offer.sourceUrl,
    flyerUrl: offer.flyerUrl,
    flyerPdfUrl: offer.flyerPdfUrl,
    eanCount: offer.eans.length,
    evidenceLabel: `${offer.storeName} · ${offer.availableOnline ? 'online + in-store' : offer.availableInStore ? 'in-store' : 'availability not reported'}`
  }));

export const icaStorePromotionEvidence = {
  title: 'ICA store-scoped promotions',
  latestStore: icaStorePromotionSourceSummary.latestStores[0] ?? null,
  latestStores: icaStorePromotionSourceSummary.latestStores,
  storeEndpointCount: icaStorePromotionSourceSummary.storeEndpointCount,
  storeScopedRows: icaStorePromotionSourceSummary.totalRowCount,
  productRowCount: icaStorePromotionSourceSummary.totalRowCount,
  sourceLabel: icaStorePromotionSourceSummary.sourceLabel,
  generatedFrom: icaStorePromotionSourceSummary.generatedFrom,
  coverageLabel: `${icaStorePromotionSourceSummary.storeEndpointCount.toLocaleString('sv-SE')} store endpoints · ${icaStorePromotionSourceSummary.totalRowCount.toLocaleString('sv-SE')} fetched promotion rows`,
  guardrails: [
    'Rows come from ICA public store-scoped promotion listing JSON and retain storeAccountId, regionId, retrievedAt, and sourceUrl evidence.',
    'No branch shelf-price claim: these are promotion listing rows, not guaranteed in-store shelf prices, stock levels, or checkout totals.',
    'The latest-store card is a provenance surface only; it does not rank ICA branches or compare availability across stores.'
  ]
};

export const allStoreDailyRunnerReadiness = {
  title: 'All-store daily batch runner',
  status: 'visible_workflow_contract_ready',
  runnerPath: 'packages/ingestion/src/connectors/all-store-runner.ts',
  workflowPath: '.github/workflows/daily-ingestion.yml',
  storeEnumerationArtifact: 'groceryview-daily-connector-stores',
  connectorArtifact: 'groceryview-daily-connectors',
  requiredChains: ['ICA', 'Willys', 'Coop', 'Hemköp', 'Lidl', 'City Gross'],
  runnerControls: [
    {
      name: 'storeConcurrency',
      defaultValue: '4 workers',
      purpose: 'caps concurrent branch fetches so all-store jobs can finish without overloading retailer endpoints'
    },
    {
      name: 'storeStartDelayMs',
      defaultValue: '0 ms',
      purpose: 'optionally spaces store starts for conservative production runs'
    },
    {
      name: 'storeRetryAttempts',
      defaultValue: '1 retry',
      purpose: 'retries transient per-store fetch failures before recording a store failure'
    },
    {
      name: 'storeRetryBaseDelayMs',
      defaultValue: '250 ms',
      purpose: 'applies a bounded backoff between per-store retries'
    },
    {
      name: 'failOnStoreFailure',
      defaultValue: 'false unless configured',
      purpose: 'lets production decide whether any branch failure should block the daily run'
    }
  ],
  allStoreConnectorUrls: [
    { chain: 'Willys', scope: 'weekly offers', url: 'groceryview://daily/willys/weekly-offers/all-stores' },
    { chain: 'Willys', scope: 'products', url: 'groceryview://daily/willys/products/all-stores' },
    { chain: 'Hemköp', scope: 'products', url: 'groceryview://daily/hemkop/products/all-stores' },
    { chain: 'Hemköp', scope: 'weekly offers', url: 'groceryview://daily/hemkop/weekly-offers/all-stores' },
    { chain: 'Coop', scope: 'weekly offers', url: 'groceryview://daily/coop/weekly-offers/all-stores' },
    { chain: 'Coop', scope: 'products', url: 'groceryview://daily/coop/products/all-stores' },
    { chain: 'Lidl', scope: 'public offers', url: 'groceryview://daily/lidl/public-offers/all-stores' },
    { chain: 'City Gross', scope: 'public products', url: 'groceryview://daily/city-gross/public-products/all-stores' }
  ],
  workflowSteps: [
    'Export live store enumeration',
    'Validate production ingestion configuration',
    'Run daily ingestion',
    'Upload deployed readiness evidence'
  ],
  guardrails: [
    'This is an operator-readiness contract, not proof that production has completed a fresh all-store run today.',
    'All-store connector URLs enumerate branches for supported chains before daily writes; missing secrets or DB blockers still fail closed.',
    'Per-store fetch failures stay visible through runner failure rows instead of being hidden behind a partial aggregate.'
  ]
};

export const digitalCatalogueOfferBoard = {
  title: 'ICA e-magin weekly catalogue ingestion',
  sourceLabel: icaReklambladSource.source,
  retrievedAt: icaReklambladSource.retrievedAt,
  offerCount: icaReklambladSource.rowCount,
  storeCount: new Set(icaReklambladOffers.map((offer) => offer.storeName)).size,
  categoryCount: new Set(icaReklambladOffers.map((offer) => offer.category).filter(Boolean)).size,
  flyerCount: new Set(icaReklambladOffers.map((offer) => offer.flyerPdfUrl).filter(Boolean)).size,
  sourceUrlCount: new Set(icaReklambladOffers.map((offer) => offer.sourceUrl).filter(Boolean)).size,
  sampleOffers: digitalCatalogueSampleOffers,
  guardrails: [
    'Rows come from the generated ICA public weekly-offer export and retain sourceUrl plus flyerPdfUrl evidence.',
    'Offer prices, comparison prices, and ordinary prices are rendered as retailer text; no hidden savings are invented.',
    'Validity windows stay tied to the source validTo timestamp instead of claiming a live checkout price.'
  ]
};

const offerReferenceDate = matpriskollenOffers
  .map((offer) => offer.retrievedAt.slice(0, 10))
  .sort()
  .at(-1) ?? snapshot.retrievedLabel;

function isoDatePlusOne(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return '';
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

function summarizeValidityDay(date: string) {
  const endingOffers = matpriskollenOffers.filter((offer) => offer.validTo.slice(0, 10) === date);
  const startingOffers = matpriskollenOffers.filter((offer) => offer.validFrom.slice(0, 10) === date);
  const stores = new Set([...endingOffers, ...startingOffers].map((offer) => offer.store));
  const sample = [...endingOffers, ...startingOffers]
    .sort((a, b) => a.store.localeCompare(b.store, 'sv') || a.name.localeCompare(b.name, 'sv'))
    .slice(0, 3)
    .map((offer) => ({
      name: offer.name,
      store: offer.store,
      priceText: offer.priceText,
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      sourceUrl: offer.sourceUrl
    }));

  return {
    date,
    endingOfferCount: endingOffers.length,
    startingOfferCount: startingOffers.length,
    storeCount: stores.size,
    sample
  };
}

const validityDates = [...new Set(matpriskollenOffers.flatMap((offer) => [offer.validFrom.slice(0, 10), offer.validTo.slice(0, 10)]))]
  .sort();
const tomorrowDate = isoDatePlusOne(offerReferenceDate);
const tomorrowStarts = matpriskollenOffers.filter((offer) => offer.validFrom.slice(0, 10) === tomorrowDate);

export const flyerValidityCalendar = {
  title: 'Flyer validity calendar',
  referenceDate: offerReferenceDate,
  tomorrowDate,
  startsTomorrow: tomorrowStarts.length > 0,
  unsupportedTomorrowClaim: tomorrowStarts.length === 0
    ? `No Starts tomorrow claim: Matpriskollen validFrom has no ${tomorrowDate} rows in this snapshot.`
    : null,
  validityDays: validityDates.map(summarizeValidityDay).slice(0, 7)
};

export const offerExpiryReminderBoard = {
  title: 'Offer expiry reminders',
  source: 'Matpriskollen public offer validity windows',
  retrievedOfferCount: matpriskollenOffers.length,
  guardrails: [
    'No deal starts tomorrow claim unless a future validFrom date exists in source data.',
    'validTo is displayed as source evidence; expired windows should not be promoted as active deals.',
    'sourceUrl remains visible so shoppers can inspect the retailer offer source.'
  ],
  rows: [...matpriskollenOffers]
    .sort((a, b) => a.validTo.localeCompare(b.validTo) || a.name.localeCompare(b.name, 'sv'))
    .slice(0, 8)
    .map((offer) => ({
      name: offer.name,
      brand: offer.brand,
      store: offer.store,
      category: offer.category,
      priceText: offer.priceText,
      comparePriceText: formatSourceUnitPriceText(offer.comparePriceText, offer.comparePriceText, {
        locale: 'sv-SE',
        currency: observedSnapshotCurrency
      }),
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      sourceUrl: offer.sourceUrl,
      productUrl: offer.productUrl,
      requiresMembershipCard: offer.requiresMembershipCard,
      requiresCoupon: offer.requiresCoupon
    }))
};

export const immigrantFamiliarBrandSearch = productUniverse
  .map((product) => {
    const isChainProduct = 'lowestPrice' in product;
    const reportedBrand = isChainProduct ? product.brand : product.brands || 'Brand not reported';
    const verifiedPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
    const evidenceLabel = isChainProduct
      ? `${product.inChains.length} Axfood chains`
      : `${product.observationCount} OpenPrices observations`;

    return {
      reportedBrand,
      productName: product.name,
      verifiedProductSlug: product.slug,
      categoryLabel: labelFromSlug(product.category),
      searchTokens: [reportedBrand, product.name, labelFromSlug(product.category)]
        .filter(Boolean)
        .join(' · '),
      evidenceLabel,
      verifiedPrice
    };
  })
  .filter((row) => row.reportedBrand !== 'Brand not reported')
  .sort((a, b) => a.reportedBrand.localeCompare(b.reportedBrand, 'sv') || a.productName.localeCompare(b.productName, 'sv'))
  .slice(0, 8);
type ProductWithImage = (typeof productUniverse)[number] & { image: string };

function hasProductImage(product: (typeof productUniverse)[number]): product is ProductWithImage {
  return typeof product.image === 'string' && product.image.length > 0;
}

export const immigrantImageFirstBrowsing = productUniverse
  .filter(hasProductImage)
  .map((product) => {
    const isChainProduct = 'lowestPrice' in product;
    const reportedBrand = isChainProduct ? product.brand : product.brands || 'Brand not reported';
    const verifiedPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
    return {
      imageUrl: product.image,
      visualAlt: `${product.name} package image`,
      productName: product.name,
      reportedBrand,
      verifiedProductSlug: product.slug,
      categoryLabel: labelFromSlug(product.category),
      evidenceLabel: isChainProduct ? `${product.inChains.length} chain prices` : `${product.observationCount} observations`,
      verifiedPrice
    };
  })
  .slice(0, 10);


export const openFoodFactsCatalogSummary = {
  products: openFoodFactsCatalog.length,
  brands: new Set(openFoodFactsCatalog.map((product) => product.brands).filter(Boolean)).size,
  categories: new Set(openFoodFactsCatalog.flatMap((product) => product.categories)).size,
  labelledProducts: openFoodFactsCatalog.filter((product) => product.labels.length > 0).length,
  imagedProducts: openFoodFactsCatalog.filter((product) => product.imageUrl).length,
  latestRetrieved: openFoodFactsCatalog.reduce((latest, product) => product.retrievedDate > latest ? product.retrievedDate : latest, '')
};

export const openFoodFactsCatalogPreview = [...openFoodFactsCatalog]
  .filter((product) => product.name && product.brands)
  .sort((a, b) => (b.labels.length - a.labels.length) || a.name.localeCompare(b.name, 'sv'))
  .slice(0, 12);

export const storeUniverse = osmStores;

function normalizeStoreText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function significantStoreTokens(value: string) {
  return normalizeStoreText(value)
    .split(' ')
    .filter((token) => token.length > 3 && !['lidl', 'vagen', 'vag'].includes(token));
}

const lidlOfferGroupsByStore = Object.values(
  lidlStoreOffers.reduce<Record<string, {
    externalStoreId: string;
    storeName: string;
    city: string;
    offers: typeof lidlStoreOffers;
  }>>((ledger, offer) => {
    const row = ledger[offer.storeId] ?? {
      externalStoreId: offer.storeId,
      storeName: offer.storeName,
      city: offer.city,
      offers: [] as typeof lidlStoreOffers
    };
    row.offers.push(offer);
    ledger[offer.storeId] = row;
    return ledger;
  }, {})
);

function matchingOsmStoreForLidlGroup(group: (typeof lidlOfferGroupsByStore)[number]) {
  const city = normalizeStoreText(group.city);
  const groupHaystack = normalizeStoreText(`${group.externalStoreId} ${group.storeName}`);
  const sameCityLidlStores = osmStores.filter((store) => store.brand === 'Lidl' && normalizeStoreText(store.city) === city);
  const addressMatch = sameCityLidlStores.find((store) => {
    const tokens = significantStoreTokens(`${store.name} ${store.address}`);
    return tokens.some((token) => groupHaystack.includes(token));
  });
  return addressMatch ?? (sameCityLidlStores.length === 1 ? sameCityLidlStores[0] : null);
}

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function percentileRank(value: number, values: number[]) {
  if (values.length === 0) return null;
  const less = values.filter((candidate) => candidate < value).length;
  const equal = values.filter((candidate) => candidate === value).length;
  return roundSek(((less + equal / 2) / values.length) * 100);
}

function cheaperThanPct(value: number, values: number[]) {
  if (values.length === 0) return null;
  const higher = values.filter((candidate) => candidate > value).length;
  return roundSek((higher / values.length) * 100);
}

const lidlStoreOfferSummaries = lidlOfferGroupsByStore
  .map((group) => {
    const regularPriceRatios = group.offers
      .filter((offer) => typeof offer.regularPrice === 'number' && offer.regularPrice > 0)
      .map((offer) => (offer.price / offer.regularPrice!) * 100);
    const averageRelativeIndex = average(regularPriceRatios);
    if (averageRelativeIndex === null) return null;
    const averageOfferPrice = average(group.offers.map((offer) => offer.price)) ?? 0;
    const averageRegularPrice = average(group.offers
      .filter((offer) => typeof offer.regularPrice === 'number' && offer.regularPrice > 0)
      .map((offer) => offer.regularPrice!));
    return {
      ...group,
      matchedStore: matchingOsmStoreForLidlGroup(group),
      averageOfferPrice: roundSek(averageOfferPrice),
      averageRegularPrice: averageRegularPrice === null ? null : roundSek(averageRegularPrice),
      averageRelativeIndex: roundSek(averageRelativeIndex),
      regularPriceObservationCount: regularPriceRatios.length
    };
  })
  .filter((summary): summary is Exclude<typeof summary, null> => summary !== null);

const nationalLidlPriceIndices = lidlStoreOfferSummaries.map((summary) => summary.averageRelativeIndex);

export const storePricePercentileRanks = lidlStoreOfferSummaries
  .map((summary) => {
    if (!summary.matchedStore) return null;
    const kommun = summary.matchedStore.city || summary.matchedStore.district || summary.city;
    const kommunPriceIndices = lidlStoreOfferSummaries
      .filter((candidate) => (candidate.matchedStore?.city || candidate.matchedStore?.district || candidate.city) === kommun)
      .map((candidate) => candidate.averageRelativeIndex);
    const nationalPricePercentile = percentileRank(summary.averageRelativeIndex, nationalLidlPriceIndices);
    const kommunPricePercentile = percentileRank(summary.averageRelativeIndex, kommunPriceIndices);
    const cheaperThanNationalPct = cheaperThanPct(summary.averageRelativeIndex, nationalLidlPriceIndices);
    const cheaperThanKommunPct = cheaperThanPct(summary.averageRelativeIndex, kommunPriceIndices);
    return {
      osmSlug: summary.matchedStore.slug,
      externalStoreId: summary.externalStoreId,
      chain: 'Lidl',
      storeName: summary.matchedStore.name,
      sourceStoreName: summary.storeName,
      kommun,
      kommunDerivedFrom: summary.matchedStore.city ? 'OSM city field matched to Lidl city' : 'OSM district fallback matched to Lidl city',
      matchedPerBranchObservationCount: summary.offers.length,
      regularPriceObservationCount: summary.regularPriceObservationCount,
      nationalCohortSize: nationalLidlPriceIndices.length,
      kommunCohortSize: kommunPriceIndices.length,
      averageOfferPrice: summary.averageOfferPrice,
      averageOfferPriceLabel: formatSek(summary.averageOfferPrice),
      averageRegularPrice: summary.averageRegularPrice,
      averageRegularPriceLabel: formatSek(summary.averageRegularPrice),
      averageRelativeIndex: summary.averageRelativeIndex,
      averageRelativeIndexLabel: formatPct(summary.averageRelativeIndex),
      nationalPricePercentile,
      nationalPricePercentileLabel: formatPct(nationalPricePercentile),
      kommunPricePercentile,
      kommunPricePercentileLabel: formatPct(kommunPricePercentile),
      cheaperThanNationalPct,
      cheaperThanNationalLabel: formatPct(cheaperThanNationalPct),
      cheaperThanKommunPct,
      cheaperThanKommunLabel: formatPct(cheaperThanKommunPct),
      statusLabel: 'Ranked from per-branch Lidl offer observations',
      confidenceLabel: summary.offers.length >= 30 && summary.regularPriceObservationCount >= 12 ? 'high confidence branch-offer coverage' : 'limited branch-offer coverage',
      coverageLabel: `${summary.offers.length} per-branch Lidl offer observations; ${summary.regularPriceObservationCount} include regular-price baselines`,
      source: 'lidlStoreOffers public branch offer rows'
    };
  })
  .filter((rank): rank is Exclude<typeof rank, null> => rank !== null)
  .sort((left, right) => left.nationalPricePercentile! - right.nationalPricePercentile!);

export function storePricePercentileRankForStore(slug: string) {
  return storePricePercentileRanks.find((rank) => rank.osmSlug === slug) ?? null;
}

export function storeOpeningHoursLabel(store: (typeof storeUniverse)[number]) {
  return 'openingHours' in store && typeof store.openingHours === 'string' && store.openingHours.trim().length > 0
    ? store.openingHours
    : 'Not reported by OSM';
}

export function storeAssortmentOverviewForStore(store: (typeof storeUniverse)[number]) {
  const matchedLidlSummary = lidlStoreOfferSummaries.find((summary) => summary.matchedStore?.slug === store.slug);
  const rows = matchedLidlSummary?.offers ?? [];
  const items = rows
    .map((offer) => ({
      id: `${offer.storeId}:${offer.code}:${offer.validFrom}`,
      name: offer.name,
      category: offer.category || 'lidl-public-offers',
      priceLabel: formatSek(offer.price),
      unitPriceLabel: formatSourceUnitPriceText(offer.unitPriceText, offer.unitPriceText, {
        locale: 'sv-SE',
        currency: observedSnapshotCurrency
      }),
      packageLabel: offer.packageText || 'Package not reported',
      validWindow: `${formatLocalizedDate(offer.validFrom, { locale: defaultLocale })} – ${formatLocalizedDate(offer.validTo, { locale: defaultLocale })}`,
      sourceLabel: 'Lidl public branch offer row',
      productUrl: offer.productUrl
    }))
    .sort((left, right) => left.category.localeCompare(right.category, 'sv') || left.name.localeCompare(right.name, 'sv'));

  const categories = Object.values(
    items.reduce<Record<string, { category: string; itemCount: number; items: typeof items }>>((ledger, item) => {
      const row = ledger[item.category] ?? { category: item.category, itemCount: 0, items: [] as typeof items };
      row.itemCount += 1;
      row.items.push(item);
      ledger[item.category] = row;
      return ledger;
    }, {})
  ).sort((left, right) => left.category.localeCompare(right.category, 'sv'));

  return {
    statusLabel: items.length > 0
      ? `${items.length.toLocaleString('sv-SE')} branch-specific assortment rows matched`
      : 'No branch-specific assortment rows matched',
    sourceLabel: items.length > 0
      ? `${lidlSource.source} · ${matchedLidlSummary?.externalStoreId}`
      : `${snapshot.osmSource}; no verified branch assortment feed matched this OSM store`,
    openingHoursLabel: storeOpeningHoursLabel(store),
    itemCount: items.length,
    categoryCount: categories.length,
    sortedBy: 'category_then_name' as const,
    items,
    categories,
    guardrails: [
      'Assortment overview only lists branch-specific assortment rows when a public store-offer feed is matched to this OSM store.',
      'No branch-specific assortment rows are inferred from brand, address, nearby stores, or chain-wide catalogue data.',
      'Opening hours stay as “Not reported by OSM” unless the store source provides them.'
    ]
  };
}

export const featuredStores = [...osmStores]
  .filter((store) => store.address)
  .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  .slice(0, 24);

export const storeBrandLedger = Object.values(
  osmStores.reduce<Record<string, {
    brand: string;
    stores: number;
    districts: Set<string>;
    formats: Set<string>;
    addressedStores: number;
    latestRetrieved: string;
    sampleSlug: string;
  }>>((ledger, store) => {
    const brand = store.brand || 'Unbranded';
    const row = ledger[brand] ?? {
      brand,
      stores: 0,
      districts: new Set<string>(),
      formats: new Set<string>(),
      addressedStores: 0,
      latestRetrieved: '',
      sampleSlug: store.slug
    };

    row.stores += 1;
    if (store.district) row.districts.add(store.district);
    if (store.format) row.formats.add(store.format);
    if (store.address) row.addressedStores += 1;
    if (store.retrievedDate > row.latestRetrieved) row.latestRetrieved = store.retrievedDate;
    ledger[brand] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    brand: row.brand,
    stores: row.stores,
    districts: row.districts.size,
    formats: Array.from(row.formats).sort((a, b) => a.localeCompare(b, 'sv')).slice(0, 3),
    addressCoverage: row.stores ? row.addressedStores / row.stores : 0,
    latestRetrieved: row.latestRetrieved,
    sampleSlug: row.sampleSlug
  }))
  .sort((a, b) => b.stores - a.stores || a.brand.localeCompare(b.brand, 'sv'))
  .slice(0, 8);

export const storeFormatCoverage = Object.values(
  osmStores.reduce<Record<string, {
    format: string;
    stores: number;
    addressedStores: number;
    brands: Set<string>;
    districts: Set<string>;
    latestRetrieved: string;
    sampleSlug: string;
  }>>((ledger, store) => {
    const format = store.format || store.shop || 'format not reported';
    const row = ledger[format] ?? {
      format,
      stores: 0,
      addressedStores: 0,
      brands: new Set<string>(),
      districts: new Set<string>(),
      latestRetrieved: '',
      sampleSlug: store.slug
    };

    row.stores += 1;
    if (store.address) row.addressedStores += 1;
    if (store.brand) row.brands.add(store.brand);
    if (store.district) row.districts.add(store.district);
    if (store.retrievedDate > row.latestRetrieved) row.latestRetrieved = store.retrievedDate;
    ledger[format] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    format: row.format,
    stores: row.stores,
    addressCoverage: row.stores ? row.addressedStores / row.stores : 0,
    brands: row.brands.size,
    districts: row.districts.size,
    latestRetrieved: row.latestRetrieved,
    sampleSlug: row.sampleSlug
  }))
  .sort((a, b) => b.stores - a.stores || a.format.localeCompare(b.format, 'sv'))
  .slice(0, 6);

export const categorySummaries = Object.entries(categoryLabels)
  .map(([slug, label]) => {
    const openRows = pricedProducts.filter((product) => product.category === slug);
    const chainRows = axfoodProducts.filter((product) => product.category === slug);
    const prices = openRows.map((product) => product.priceMedian).filter((price) => Number.isFinite(price));
    return {
      slug,
      label,
      openPriceRows: openRows.length,
      chainRows: chainRows.length,
      medianPrice: prices.length ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null,
      latestObservation: openRows.reduce((latest, product) => product.lastObservedAt > latest ? product.lastObservedAt : latest, ''),
      strongestSpread: chainRows.reduce((best, product) => Math.max(best, product.spreadPct), 0)
    };
  })
  .filter((category) => category.openPriceRows > 0 || category.chainRows > 0)
  .sort((a, b) => (b.openPriceRows + b.chainRows) - (a.openPriceRows + a.chainRows));

export const immigrantAisleFinder = [
  {
    label: 'Halal-friendly protein aisle',
    verifiedCategorySlug: 'meat-seafood',
    dietaryTags: ['halal candidate', 'ask-store-confirmation'],
    caveat: 'Uses verified meat and seafood category rows only; halal certification is not inferred from product name.'
  },
  {
    label: 'Kosher pantry staples',
    verifiedCategorySlug: 'pantry',
    dietaryTags: ['kosher candidate', 'pack-label-check'],
    caveat: 'Uses pantry category coverage and keeps kosher certification as a package-label check.'
  },
  {
    label: 'Ethnic aisle basics',
    verifiedCategorySlug: 'international',
    dietaryTags: ['rice', 'spices', 'world foods'],
    caveat: 'Shows verified category entry points without inventing store aisle numbers.'
  }
];


type DietaryScenarioDefinition = {
  id: string;
  label: string;
  swedishQuery: string;
  labelNeedles: string[];
  textNeedles: string[];
  caveat: string;
};

const dietaryScenarioDefinitions: DietaryScenarioDefinition[] = [
  {
    id: 'glutenfri',
    label: 'Glutenfri staples',
    swedishQuery: 'glutenfri',
    labelNeedles: ['glutenfree', 'crossed_ax'],
    textNeedles: ['glutenfri', 'glutenfritt', 'glutenfria'],
    caveat: 'Uses verified label evidence such as glutenfree/crossed_ax or explicit product text; no allergy claim is inferred from browsing behavior.'
  },
  {
    id: 'laktosfri',
    label: 'Laktosfri dairy swaps',
    swedishQuery: 'laktosfri',
    labelNeedles: ['laktosfree'],
    textNeedles: ['laktosfri', 'laktosfritt', 'låg laktos'],
    caveat: 'Requires laktosfree labels or explicit package text before the filter shows a product.'
  },
  {
    id: 'vegan',
    label: 'Vegan quick basket',
    swedishQuery: 'vegan',
    labelNeedles: ['vegan', 'vegetarian'],
    textNeedles: ['vegan', 'vegansk', 'veganska'],
    caveat: 'Shows products with explicit vegan/vegetarian label or text evidence; ingredients are not guessed.'
  },
  {
    id: 'krav-eko',
    label: 'KRAV / ekologisk staples',
    swedishQuery: 'KRAV eko',
    labelNeedles: ['krav', 'ecological', 'eu_ecological'],
    textNeedles: ['krav', 'eko', 'ekologisk', 'ekologiska'],
    caveat: 'Requires KRAV/ecological label evidence or explicit product text before an eco scenario row is shown.'
  }
];

function matchesDietaryScenario(product: (typeof axfoodProducts)[number], scenario: DietaryScenarioDefinition) {
  const labels = product.labels.map((label) => label.toLowerCase());
  const text = `${product.name} ${product.brand} ${product.subline}`.toLowerCase();
  return scenario.labelNeedles.some((needle) => labels.includes(needle)) || scenario.textNeedles.some((needle) => text.includes(needle));
}

export const dietaryScenarioFilters = dietaryScenarioDefinitions
  .map((scenario) => {
    const matches = axfoodProducts
      .filter((product) => matchesDietaryScenario(product, scenario))
      .sort((a, b) => b.inChains.length - a.inChains.length || b.spreadPct - a.spreadPct || a.name.localeCompare(b.name, 'sv'));
    const sample = matches[0] ?? null;
    const categorySlug = sample?.category || matches.find((product) => product.category)?.category || 'categories';
    return {
      id: scenario.id,
      label: scenario.label,
      swedishQuery: scenario.swedishQuery,
      categorySlug,
      verifiedProductCount: matches.length,
      chainCount: new Set(matches.flatMap((product) => product.inChains)).size,
      evidenceLabels: [...new Set(matches.flatMap((product) => product.labels))].filter(Boolean).slice(0, 5),
      sampleProductName: sample?.name ?? 'No verified product yet',
      sampleProductSlug: sample?.slug ?? null,
      caveat: scenario.caveat
    };
  })
  .filter((scenario) => scenario.verifiedProductCount > 0);

type HealthLabelFilterDefinition = {
  id: string;
  label: string;
  swedishQuery: string;
  labelNeedles: string[];
  textNeedles: string[];
  healthUse: string;
  guardrail: string;
};

const healthLabelFilterDefinitions: HealthLabelFilterDefinition[] = [
  {
    id: 'keyhole',
    label: 'Keyhole-labelled staples',
    swedishQuery: 'nyckelhål keyhole',
    labelNeedles: ['keyhole'],
    textNeedles: ['nyckelhål', 'keyhole'],
    healthUse: 'Quickly find products with verified Keyhole label evidence before comparing protein, fiber, and price.',
    guardrail: 'Keyhole is rendered only when the source label or explicit package text is present; it is not a medical claim.'
  },
  {
    id: 'organic',
    label: 'Organic / ekologisk picks',
    swedishQuery: 'ekologisk organic KRAV',
    labelNeedles: ['ecological', 'eu_ecological', 'krav'],
    textNeedles: ['ekologisk', 'ekologiska', 'organic', 'krav', 'eko'],
    healthUse: 'Filter organic-labelled products while preserving the same price and nutrition-per-krona comparison context.',
    guardrail: 'Organic filters use ecological/KRAV evidence only and do not infer nutrition superiority or sustainability impact.'
  },
  {
    id: 'vegan',
    label: 'Vegan verified rows',
    swedishQuery: 'vegan vegansk',
    labelNeedles: ['vegan'],
    textNeedles: ['vegan', 'vegansk', 'veganska'],
    healthUse: 'Find explicit vegan rows for plant-based shoppers before opening the product page for current price evidence.',
    guardrail: 'Vegan status requires explicit label or product-text evidence; ingredients are not guessed and not inferred from browsing.'
  }
];

function matchesHealthLabelFilter(product: (typeof axfoodProducts)[number], filter: HealthLabelFilterDefinition) {
  const labels = product.labels.map((label) => label.toLowerCase());
  const text = `${product.name} ${product.brand} ${product.subline}`.toLowerCase();
  return filter.labelNeedles.some((needle) => labels.includes(needle)) || filter.textNeedles.some((needle) => text.includes(needle));
}

export const healthVerifiedLabelFilters = healthLabelFilterDefinitions
  .map((filter) => {
    const matches = axfoodProducts
      .filter((product) => matchesHealthLabelFilter(product, filter))
      .sort((a, b) => b.inChains.length - a.inChains.length || b.spreadPct - a.spreadPct || a.name.localeCompare(b.name, 'sv'));
    const sample = matches[0] ?? null;
    return {
      id: filter.id,
      label: filter.label,
      swedishQuery: filter.swedishQuery,
      healthUse: filter.healthUse,
      verifiedProductCount: matches.length,
      chainCount: new Set(matches.flatMap((product) => product.inChains)).size,
      evidenceLabels: [...new Set(matches.flatMap((product) => product.labels))].filter(Boolean).slice(0, 6),
      sampleProductName: sample?.name ?? 'No verified product yet',
      sampleProductSlug: sample?.slug ?? null,
      sampleChain: sample?.lowestChain ?? 'No verified chain yet',
      samplePrice: sample?.lowestPrice ?? null,
      products: matches.slice(0, 3).map((product) => ({
        slug: product.slug,
        productName: product.name,
        brand: product.brand,
        lowestChain: product.lowestChain,
        lowestPrice: product.lowestPrice,
        spreadPct: product.spreadPct,
        evidenceLabels: product.labels.filter((label) => filter.labelNeedles.includes(label.toLowerCase()) || filter.textNeedles.includes(label.toLowerCase()))
      })),
      guardrail: filter.guardrail,
      caveat: 'Health filters use verified label or package-text evidence only; they are not a medical claim and are not inferred from browsing behavior.'
    };
  })
  .filter((filter) => filter.verifiedProductCount > 0);

export const categoryQualityMatrix = categorySummaries
  .map((category) => {
    const openRows = pricedProducts.filter((product) => product.category === category.slug);
    const chainRows = axfoodProducts.filter((product) => product.category === category.slug);
    const latestOpenPrice = openRows.reduce((latest, product) => product.lastObservedAt > latest ? product.lastObservedAt : latest, '');
    const observedProducts = new Set(openRows.map((product) => product.code || product.slug)).size;
    const chainMatches = chainRows.filter((product) => product.inChains.length > 1).length;

    return {
      slug: category.slug,
      label: category.label,
      verifiedRows: openRows.length + chainRows.length,
      observedProducts,
      chainMatches,
      latestOpenPrice,
      spreadSignal: category.strongestSpread,
      qualityScore: openRows.length + chainMatches * 2 + (latestOpenPrice ? 1 : 0)
    };
  })
  .filter((category) => category.verifiedRows > 0)
  .sort((a, b) => b.qualityScore - a.qualityScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 8);

export const chainCategoryCoverage = Object.values(
  matchedChainProducts.reduce<Record<string, {
    slug: string;
    chainRows: number;
    matchedProducts: number;
    spreadTotal: number;
    topSpread: number;
    willysLowest: number;
    hemkopLowest: number;
  }>>((ledger, product) => {
    const row = ledger[product.category] ?? {
      slug: product.category,
      chainRows: 0,
      matchedProducts: 0,
      spreadTotal: 0,
      topSpread: 0,
      willysLowest: 0,
      hemkopLowest: 0
    };

    row.chainRows += 1;
    row.matchedProducts += 1;
    row.spreadTotal += product.spreadPct;
    row.topSpread = Math.max(row.topSpread, product.spreadPct);
    if (product.lowestChain === 'willys') row.willysLowest += 1;
    if (product.lowestChain === 'hemkop') row.hemkopLowest += 1;
    ledger[product.category] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug) || 'Unclassified',
    chainRows: row.chainRows,
    matchedProducts: row.matchedProducts,
    averageSpread: row.matchedProducts ? row.spreadTotal / row.matchedProducts : 0,
    topSpread: row.topSpread,
    leadingLowestChain: row.willysLowest >= row.hemkopLowest ? 'Willys' : 'Hemkop',
    coverageScore: row.matchedProducts * 2 + row.topSpread
  }))
  .sort((a, b) => b.coverageScore - a.coverageScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 6);

export const openPriceObservationDepth = Object.values(
  pricedProducts.reduce<Record<string, {
    slug: string;
    products: number;
    observationTotal: number;
    latestObservation: string;
    topProductName: string;
    topProductSlug: string;
    topProductObservations: number;
  }>>((ledger, product) => {
    const row = ledger[product.category] ?? {
      slug: product.category,
      products: 0,
      observationTotal: 0,
      latestObservation: '',
      topProductName: '',
      topProductSlug: '',
      topProductObservations: 0
    };

    row.products += 1;
    row.observationTotal += product.observationCount;
    if (product.lastObservedAt > row.latestObservation) row.latestObservation = product.lastObservedAt;
    if (product.observationCount > row.topProductObservations) {
      row.topProductName = product.name;
      row.topProductSlug = product.slug;
      row.topProductObservations = product.observationCount;
    }
    ledger[product.category] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug),
    products: row.products,
    observationTotal: row.observationTotal,
    latestObservation: row.latestObservation,
    topProductName: row.topProductName,
    topProductSlug: row.topProductSlug,
    topProductObservations: row.topProductObservations,
    averageObservations: row.products ? row.observationTotal / row.products : 0
  }))
  .sort((a, b) => b.observationTotal - a.observationTotal || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 6);

const freshnessLagAsOf = '2026-05-25';
const freshnessLagWindowDays = 7;
const freshnessLagWindowMs = freshnessLagWindowDays * 24 * 60 * 60 * 1000;
const axfoodObservedAt = '2026-05-21';
const freshnessLagAsOfTime = Date.parse(`${freshnessLagAsOf}T00:00:00.000Z`);

function isFreshLagObservation(date: string) {
  const observedTime = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isFinite(observedTime)
    && observedTime <= freshnessLagAsOfTime
    && freshnessLagAsOfTime - observedTime < freshnessLagWindowMs;
}

export const perClassFreshnessLagReport = Object.values(
  [
    ...pricedProducts.flatMap((product) =>
      product.observations.map((observation) => ({
        slug: product.category,
        observedAt: observation.date,
        source: 'OpenPrices'
      }))
    ),
    ...axfoodProducts.map((product) => ({
      slug: product.category,
      observedAt: axfoodObservedAt,
      source: 'Axfood'
    }))
  ].reduce<Record<string, {
    slug: string;
    observationCount: number;
    freshObservationCount: number;
    latestObservedAt: string;
    sourceCounts: Record<string, number>;
  }>>((ledger, observation) => {
    const row = ledger[observation.slug] ?? {
      slug: observation.slug,
      observationCount: 0,
      freshObservationCount: 0,
      latestObservedAt: '',
      sourceCounts: {}
    };

    row.observationCount += 1;
    row.freshObservationCount += isFreshLagObservation(observation.observedAt) ? 1 : 0;
    if (observation.observedAt > row.latestObservedAt) row.latestObservedAt = observation.observedAt;
    row.sourceCounts[observation.source] = (row.sourceCounts[observation.source] ?? 0) + 1;
    ledger[observation.slug] = row;
    return ledger;
  }, {})
)
  .map((row) => ({
    slug: row.slug,
    label: labelFromSlug(row.slug),
    observationCount: row.observationCount,
    freshObservationCount: row.freshObservationCount,
    staleObservationCount: row.observationCount - row.freshObservationCount,
    freshPercent: row.observationCount ? (row.freshObservationCount / row.observationCount) * 100 : 0,
    latestObservedAt: row.latestObservedAt || 'Not reported',
    sourceBreakdown: Object.entries(row.sourceCounts)
      .sort(([left], [right]) => left.localeCompare(right, 'sv'))
      .map(([source, count]) => `${source} ${count.toLocaleString('sv-SE')}`)
      .join(' · '),
    status: row.freshObservationCount === 0
      ? 'stale'
      : row.freshObservationCount === row.observationCount
        ? 'fresh'
        : 'mixed'
  }))
  .sort((a, b) => a.freshPercent - b.freshPercent || b.observationCount - a.observationCount || a.label.localeCompare(b.label, 'sv'));

const freshnessLagObservationTotal = perClassFreshnessLagReport.reduce((sum, row) => sum + row.observationCount, 0);
const freshnessLagFreshTotal = perClassFreshnessLagReport.reduce((sum, row) => sum + row.freshObservationCount, 0);

export const freshnessLagSummary = {
  asOf: freshnessLagAsOf,
  freshWindowDays: freshnessLagWindowDays,
  observationCount: freshnessLagObservationTotal,
  freshObservationCount: freshnessLagFreshTotal,
  staleObservationCount: freshnessLagObservationTotal - freshnessLagFreshTotal,
  freshPercent: freshnessLagObservationTotal ? (freshnessLagFreshTotal / freshnessLagObservationTotal) * 100 : 0,
  classCount: perClassFreshnessLagReport.length,
  staleClassCount: perClassFreshnessLagReport.filter((row) => row.status === 'stale').length,
  claimBoundary: 'Freshness lag is computed from dated OpenPrices observations plus the dated Axfood chain snapshot; classes without a dated observation stay stale until the next source refresh.'
};

export const priceDropMoversBoard = pricedProducts
  .flatMap((product) => {
    const historyPoints = dailyObservedPricePoints(product);
    if (historyPoints.length < 2) return [];

    const summary = summarizePriceHistory(historyPoints);
    const previousPrice = summary.previousPrice ?? summary.latestPrice;
    return [{
      productSlug: product.slug,
      productName: product.name,
      imageUrl: product.image || null,
      categoryLabel: labelFromSlug(product.category),
      latestPrice: summary.latestPrice,
      previousPrice,
      changeFromPrevious: summary.changeFromPrevious,
      changePercent: previousPrice > 0 ? (summary.changeFromPrevious / previousPrice) * 100 : 0,
      lowestPrice: summary.lowestPrice,
      highestPrice: summary.highestPrice,
      isNewLow: summary.isNewLow,
      observedCount: summary.observedCount,
      rawObservationCount: product.observationCount,
      latestObservedAt: summary.latestObservedAt,
      legalCopy: 'observed low only'
    }];
  })
  .filter((mover) => mover.changeFromPrevious < 0)
  .sort((a, b) => a.changeFromPrevious - b.changeFromPrevious || b.observedCount - a.observedCount || a.productName.localeCompare(b.productName, 'sv'))
  .slice(0, 8);

export const categoryDealLeaderCandidates = matchedChainProducts.map((product) => {
  const sourceConfidence = clamp(product.inChains.length / 2, 0, 1);
  const crossChainSpreadPercentile = clamp(100 - product.spreadPct * 2, 0, 100);
  return {
    productId: product.slug,
    productName: product.name,
    category: product.category,
    storeName: product.lowestChain,
    price: product.lowestPrice,
    dealScore: calculateDealScore({
      currentCityPercentile: crossChainSpreadPercentile,
      knownPromoHistoryPercentile: crossChainSpreadPercentile,
      equivalentUnitPricePercentile: product.inChains.length > 1 ? 0 : 50,
      discountDepthPercent: product.spreadPct,
      sourceConfidence
    }),
    sourceConfidence
  };
});

export const categoryDealLeaders = summarizeCategoryDealLeaders({
  candidates: categoryDealLeaderCandidates,
  minimumSourceConfidence: 0.6
}).map((leader) => ({
  ...leader,
  categorySlug: leader.category,
  categoryLabel: labelFromSlug(leader.category),
  productSlug: leader.productId,
  evidenceLabel: `${leader.storeName} lowest · ${formatPct(leader.sourceConfidence * 100)} sourceConfidence · cross-chain spread derived`
}));

const friendSharedDealCandidateProducts = topChainSpreads.slice(0, 8);

export const friendSharedDealShareSignals = friendSharedDealCandidateProducts.slice(0, 4).map((product, index) => ({
  productId: product.slug,
  sharedByDisplayName: ['Alex', 'Samira', 'Jonas', 'Mina'][index] ?? 'Household member',
  relationship: index % 2 === 0 ? 'household' as const : 'friend' as const,
  sharedAt: `2026-05-${24 - index}T09:30:00.000Z`,
  sourceConfidence: 0.9,
  optedIn: true
}));

export const friendSharedDealSuggestions = suggestFriendSharedDeals({
  asOf: '2026-05-24T12:00:00.000Z',
  deals: friendSharedDealCandidateProducts.map((product) => {
    const pricedRows = chainPriceRows(product).sort((left, right) => left.price - right.price || String(left.chain).localeCompare(String(right.chain), 'sv'));
    const cheapest = pricedRows[0]!;
    const regularPrice = pricedRows[pricedRows.length - 1]?.price ?? cheapest.price;
    const sourceConfidence = clamp(product.inChains.length / 2, 0, 1);
    return {
      productId: product.slug,
      productName: product.name,
      storeId: `${cheapest.chain}-online-catalog`,
      storeName: `${chainDisplayNames[cheapest.chain] ?? cheapest.chain} online catalog`,
      currentPrice: cheapest.price,
      regularPrice,
      dealScore: calculateDealScore({
        currentCityPercentile: clamp(100 - product.spreadPct * 2, 0, 100),
        knownPromoHistoryPercentile: clamp(100 - product.spreadPct * 2, 0, 100),
        equivalentUnitPricePercentile: product.inChains.length > 1 ? 0 : 50,
        discountDepthPercent: product.spreadPct,
        sourceConfidence
      }),
      sourceConfidence
    };
  }),
  shares: friendSharedDealShareSignals,
  minimumDealScore: 60,
  minimumSourceConfidence: 0.6
}).map((suggestion) => ({
  ...suggestion,
  productSlug: suggestion.productId,
  socialSignalLabel: `${suggestion.socialSignals.length} opted-in friend/household shares`,
  socialEvidenceLabel: `socialProofScore ${suggestion.socialProofScore} · no anonymous or non-consented shares`
}));

export const marketHeatmapSourceSignals = [
  {
    id: 'deal-score',
    label: 'Deal score heat',
    source: 'categoryDealLeaders',
    evidence: 'summarizeCategoryDealLeaders over verified cross-chain prices'
  },
  {
    id: 'spread',
    label: 'Cross-chain spread heat',
    source: 'chainCategoryCoverage',
    evidence: 'matched Willys/Hemköp category spreads'
  },
  {
    id: 'liquidity',
    label: 'Observation liquidity heat',
    source: 'openPriceObservationDepth',
    evidence: 'OpenPrices observation totals by category'
  },
  {
    id: 'movers',
    label: 'Price-drop mover heat',
    source: 'priceDropMoversBoard',
    evidence: 'dated observed price drops only'
  }
] as const;

function marketHeatBand(heatScore: number) {
  if (heatScore >= 80) return 'hot';
  if (heatScore >= 55) return 'warm';
  return 'cool';
}

const maxOpenPriceObservationTotal = Math.max(...openPriceObservationDepth.map((row) => row.observationTotal), 1);

export const marketHeatmapTiles = [
  ...categoryDealLeaders.map((leader) => ({
    id: `deal-${leader.categorySlug}-${leader.productSlug}`,
    label: leader.categoryLabel,
    route: `/categories/${leader.categorySlug}`,
    sourceSignal: marketHeatmapSourceSignals[0].label,
    heatScore: clamp(leader.dealScore, 0, 100),
    metricLabel: leader.signal,
    detail: `${leader.productName} · ${leader.evidenceLabel}`,
    confidenceLabel: `${formatPct(leader.sourceConfidence * 100)} source confidence · deal score from calculateDealScore`,
    band: marketHeatBand(clamp(leader.dealScore, 0, 100))
  })),
  ...chainCategoryCoverage.map((category) => ({
    id: `spread-${category.slug}`,
    label: category.label,
    route: `/categories/${category.slug}`,
    sourceSignal: marketHeatmapSourceSignals[1].label,
    heatScore: clamp(category.topSpread, 0, 100),
    metricLabel: `${formatPct(category.topSpread)} top spread`,
    detail: `${category.matchedProducts} matched products · ${category.leadingLowestChain} leads lowest-price wins`,
    confidenceLabel: 'Matched chain catalogue rows only; no unmatched SKU is mixed into the heat tile.',
    band: marketHeatBand(clamp(category.topSpread, 0, 100))
  })),
  ...openPriceObservationDepth.map((category) => {
    const heatScore = clamp((category.observationTotal / maxOpenPriceObservationTotal) * 100, 0, 100);
    return {
      id: `liquidity-${category.slug}`,
      label: category.label,
      route: `/categories/${category.slug}`,
      sourceSignal: marketHeatmapSourceSignals[2].label,
      heatScore,
      metricLabel: `${category.observationTotal.toLocaleString('sv-SE')} observations`,
      detail: `${category.products} products · latest ${category.latestObservation || 'not reported'}`,
      confidenceLabel: `${category.topProductName} has ${category.topProductObservations.toLocaleString('sv-SE')} source observations.`,
      band: marketHeatBand(heatScore)
    };
  }),
  ...priceDropMoversBoard.map((mover) => {
    const heatScore = clamp(Math.abs(mover.changePercent), 0, 100);
    return {
      id: `mover-${mover.productSlug}`,
      label: mover.categoryLabel,
      route: `/products/${mover.productSlug}`,
      sourceSignal: marketHeatmapSourceSignals[3].label,
      heatScore,
      metricLabel: `${formatPct(mover.changePercent)} latest move`,
      detail: `${mover.productName} · latest ${formatSek(mover.latestPrice)} from ${mover.observedCount} dated points`,
      confidenceLabel: `${mover.rawObservationCount.toLocaleString('sv-SE')} raw observations · ${mover.legalCopy}`,
      band: marketHeatBand(heatScore)
    };
  })
]
  .sort((a, b) => b.heatScore - a.heatScore || a.label.localeCompare(b.label, 'sv'))
  .slice(0, 12);

export const sourceCoverage = [
  {
    name: 'Axfood chain price snapshot',
    source: snapshot.axfoodSource,
    rows: axfoodProducts.length,
    coverage: `${matchedChainProducts.length} Willys/Hemköp cross-chain matches`,
    freshness: snapshot.retrievedLabel,
    caveat: 'Chain-wide online catalogue prices; not per-branch shelf prices.'
  },
  {
    name: 'ICA store-scoped promotions',
    source: snapshot.icaStorePromotionsSource,
    rows: icaStorePromotionEvidence.storeScopedRows,
    coverage: `${icaStorePromotionEvidence.storeEndpointCount.toLocaleString('sv-SE')} store endpoints including ${icaStorePromotionEvidence.latestStore?.storeName ?? 'latest store not reported'}`,
    freshness: icaStorePromotionEvidence.latestStore?.retrievedAt ?? 'Not reported',
    caveat: 'Store-scoped promotion listing rows; no branch shelf-price, inventory, or checkout-total claim.'
  },
  {
    name: 'OpenPrices SEK observations',
    source: snapshot.openPricesSource,
    rows: pricedProducts.length,
    coverage: `${new Set(pricedProducts.map((product) => product.code)).size} EAN-coded products`,
    freshness: freshestOpenPrices[0]?.lastObservedAt ?? 'Not reported',
    caveat: 'Community observations; every row shows observation count and latest date.'
  },
  {
    name: 'OpenFoodFacts metadata catalog',
    source: snapshot.openFoodFactsCatalogSource,
    rows: openFoodFactsCatalog.length,
    coverage: `${openFoodFactsCatalogSummary.brands.toLocaleString('sv-SE')} brands · ${openFoodFactsCatalogSummary.categories.toLocaleString('sv-SE')} category tags`,
    freshness: openFoodFactsCatalogSummary.latestRetrieved || 'Not reported',
    caveat: 'Metadata-only product catalog; GroceryView prices are not inferred from these rows.'
  },
  {
    name: 'OKQ8 fuel operator prices',
    source: verifiedFuelPriceSource.sourceUrl,
    rows: verifiedFuelPriceObservations.length,
    coverage: `${new Set(verifiedFuelPriceObservations.map((row) => row.grade)).size} fuel grades`,
    freshness: verifiedFuelPriceObservations.map((row) => row.effectiveFrom).sort().at(-1) ?? 'Not reported',
    caveat: verifiedFuelPriceSource.caveat
  },
  {
    name: 'Sweden store directory',
    source: snapshot.osmSource,
    rows: osmStores.length,
    coverage: `${new Set(osmStores.map((store) => store.brand)).size} brands across Sweden`,
    freshness: osmStores[0]?.retrievedDate ?? 'Not reported',
    caveat: 'Location data only; prices are not inferred from store locations.'
  }
];

export const retailerTypeCoverage = majorSwedishGroceryRetailerTypeCoverage.map((row) => {
  const label = row.retailerType.replace(/_/g, ' ');
  return {
    retailerType: row.retailerType,
    label,
    status: row.chainCount > 0 ? 'tracked' : 'schema-ready',
    chainCount: row.chainCount,
    chainSlugs: row.chainSlugs,
    freshnessLabel: row.chainCount > 0
      ? `Latest priced grocery freshness: ${freshnessLagSummary.asOf}`
      : 'Freshness pending until a chain is seeded for this retailer type',
    coverageLabel: row.chainCount > 0
      ? `${row.chainCount} seeded ${label} chain${row.chainCount === 1 ? '' : 's'}`
      : 'No seeded chains yet'
  };
});

export const retailerTypeCoverageSummary = {
  allowedTypeCount: retailerTypes.length,
  trackedTypeCount: retailerTypeCoverage.filter((row) => row.chainCount > 0).length,
  trackedChainCount: retailerTypeCoverage.reduce((sum, row) => sum + row.chainCount, 0)
};

function sourceKindFor(name: string) {
  if (name === 'Axfood chain price snapshot') return 'axfood';
  if (name === 'ICA store-scoped promotions') return 'ica-promotions';
  if (name === 'OpenPrices SEK observations') return 'openprices';
  if (name === 'OpenFoodFacts metadata catalog') return 'openfoodfacts';
  if (name === 'OKQ8 fuel operator prices') return 'fuel';
  return 'osm';
}

function sourceRouteFor(name: string) {
  if (name === 'Sweden store directory') return '/stores';
  if (name === 'OKQ8 fuel operator prices') return '/fuel';
  if (name === 'ICA store-scoped promotions') return '/data-sources';
  if (name === 'OpenPrices SEK observations' || name === 'OpenFoodFacts metadata catalog') return '/products';
  return '/compare';
}

function confidenceBadgeFor(name: string) {
  if (name === 'Axfood chain price snapshot') return 'chain-wide catalogue confidence';
  if (name === 'ICA store-scoped promotions') return 'store-scoped promotion provenance';
  if (name === 'OKQ8 fuel operator prices') return 'operator-page confidence';
  if (name === 'OpenPrices SEK observations') return 'community-observed confidence';
  if (name === 'OpenFoodFacts metadata catalog') return 'metadata-only confidence';
  return 'location-directory confidence';
}

export const dataFreshnessBadges = sourceCoverage.map((source) => ({
  sourceKind: sourceKindFor(source.name),
  sourceName: source.name,
  source: source.source,
  freshnessLabel: source.freshness,
  coverageLabel: source.coverage,
  confidenceBadge: confidenceBadgeFor(source.name),
  evidenceRoute: sourceRouteFor(source.name),
  caveat: source.caveat
}));

const sourceRowsTotal = sourceCoverage.reduce((total, source) => total + source.rows, 0);

export const sourceReadinessMatrix = sourceCoverage.map((source) => {
  const primaryRoute =
    source.name === 'Sweden store directory'
      ? '/stores'
      : source.name === 'OKQ8 fuel operator prices'
        ? '/fuel'
      : source.name === 'ICA store-scoped promotions'
        ? '/data-sources'
      : source.name === 'OpenPrices SEK observations' || source.name === 'OpenFoodFacts metadata catalog'
        ? '/products'
        : '/compare';

  return {
    name: source.name,
    rows: source.rows,
    rowShare: sourceRowsTotal ? source.rows / sourceRowsTotal : 0,
    freshness: source.freshness,
    coverage: source.coverage,
    caveat: source.caveat,
    primaryRoute
  };
});

export const sourceRouteMap = sourceReadinessMatrix.map((source) => {
  const supportingRoutes =
    source.name === 'Sweden store directory'
      ? ['/stores', '/map', '/data-sources']
      : source.name === 'ICA store-scoped promotions'
        ? ['/', '/data-sources', '/deals']
      : source.name === 'OpenPrices SEK observations'
        ? ['/products', '/categories', '/data-sources']
        : source.name === 'OpenFoodFacts metadata catalog'
          ? ['/products', '/data-sources']
          : ['/compare', '/chain-index', '/data-sources'];

  return {
    name: source.name,
    primaryRoute: source.primaryRoute,
    supportingRoutes,
    routeCount: supportingRoutes.length,
    freshness: source.freshness
  };
});

export const sourceClaimLedger = sourceCoverage.map((source) => {
  const route =
    source.name === 'Sweden store directory'
      ? '/stores'
      : source.name === 'ICA store-scoped promotions'
        ? '/data-sources'
      : source.name === 'OpenPrices SEK observations' || source.name === 'OpenFoodFacts metadata catalog'
        ? '/products'
        : '/compare';
  const allowedClaim =
    source.name === 'Sweden store directory'
      ? 'Verified Sweden store locations, brands, formats, districts, and address coverage.'
      : source.name === 'ICA store-scoped promotions'
        ? 'ICA public store-scoped promotion listing rows with storeAccountId, regionId, retrievedAt, row counts, and source URLs.'
      : source.name === 'OpenPrices SEK observations'
        ? 'Observed community price medians, observation counts, product codes, and latest sighting dates.'
        : source.name === 'OpenFoodFacts metadata catalog'
          ? 'Metadata-only Swedish product names, brands, quantities, category tags, labels, package images, and OFF product URLs.'
          : 'Chain-wide Willys and Hemkop catalogue prices and same-product spread comparisons.';
  const blockedClaim =
    source.name === 'Sweden store directory'
      ? 'Branch-level prices, inventory, opening hours, or promotion availability.'
      : source.name === 'ICA store-scoped promotions'
        ? 'Branch shelf-price guarantee, stock status, authenticated ICA loyalty pricing, or checkout-total availability.'
      : source.name === 'OpenPrices SEK observations'
        ? 'Guaranteed current shelf price, store-specific availability, or member-only offer state.'
        : source.name === 'OpenFoodFacts metadata catalog'
          ? 'Current prices, store availability, nutrition completeness, or verified retailer assortment.'
          : 'Per-branch shelf prices, stock status, authenticated loyalty prices, or checkout totals.';

  return {
    name: source.name,
    evidenceRoute: route,
    source: source.source,
    allowedClaim,
    blockedClaim,
    evidence: `${source.rows.toLocaleString('sv-SE')} rows · ${source.coverage}`,
    freshness: source.freshness
  };
});

export const commodityIngestionClassifierEvidence = {
  title: 'Loose-item ingestion classifier',
  status: 'ingestion_contract_ready',
  taxonomyCount: COMMODITIES.length,
  stapleCount: STAPLE_BASKET.length,
  sourceConfidencePolicy: 'sourceConfidence <= 0.68 for commodity/alias matches even when retailer source confidence is higher',
  example: {
    rawName: 'Kvisttomat lösvikt',
    productKindColumn: "product_kind='commodity'",
    commodityId: 'commodity_id=tomato',
    unitPrice: 'unit_price=39.90 kr/kg',
    variant: 'variant=vine',
    organicFlag: 'is_organic=false',
    originCountry: 'origin_country=SE'
  },
  capturedColumns: [
    "product_kind='commodity'",
    'commodity_id resolved from COMMODITIES taxonomy slug before database UUID lookup',
    'unit_price plus comparable kr/kg, kr/l, or kr/st evidence',
    'variant, is_organic, origin_country'
  ],
  guardrails: [
    'No-barcode sold-by-weight rows must set soldByWeight or productKind=commodity before fuzzy commodity resolution runs.',
    'Unknown commodity aliases fail closed into rejection instead of creating a shopper-visible product.',
    'Commodity/alias confidence is medium by design and stays below barcode confidence until human review approves broader mapping.'
  ]
};

export const publicApiDirectory = {
  title: 'Public price/nutrition API',
  openApiPath: '/api/openapi.json',
  status: 'public_read_api',
  examples: [
    {
      label: 'Product terminal',
      path: '/api/products/{id}/terminal',
      supports: 'current quote, price history summary, deal score, spread, cheapest-now row, and chart-ready price points'
    },
    {
      label: 'Product price-history',
      path: '/api/products/{id}/history',
      supports: 'observed price history with provenance, price type, source confidence, and no synthetic forecast rows'
    },
    {
      label: 'Product volatility',
      path: '/api/products/{id}/volatility',
      supports: 'volatility score, observed inputWindow, cache contract, ETag revalidation, and no forecast-only rows'
    },
    {
      label: 'Nutrition per krona',
      path: '/api/nutrition/value',
      supports: 'nutrition per krona rankings for protein, calories, fiber, sugar, and salt warning guardrails'
    }
  ],
  volatilityContract: {
    path: '/api/products/{id}/volatility',
    cacheContract: 'Cache-Control: public, s-maxage=300, stale-while-revalidate=900 for identical product and inputWindow requests.',
    etagBehavior: 'ETag varies by product id, normalized inputWindow, source snapshot, and volatility payload; clients should send If-None-Match and accept 304 Not Modified when the observation window is unchanged.',
    inputWindowFields: [
      { name: 'inputWindow.startDate', meaning: 'inclusive first observed price date used to compute the volatility score' },
      { name: 'inputWindow.endDate', meaning: 'inclusive last observed price date used to compute the volatility score' },
      { name: 'inputWindow.lookbackDays', meaning: 'requested historical observation window after server-side normalization' },
      { name: 'inputWindow.observationCount', meaning: 'number of verified price observations included in the score' }
    ]
  },
  guardrails: [
    'All listed endpoints are unauthenticated public read endpoints in the OpenAPI document.',
    'Account, basket, watchlist, privacy, and human-review APIs stay bearer-auth protected.',
    'Volatility scores must publish cache, ETag, and inputWindow semantics so clients can revalidate the same historical observation window safely.',
    'Prices and nutrition values are served with provenance/guardrails; missing data remains absent instead of filled with estimates.'
  ]
};

export const apiPerformanceReadiness = {
  title: 'API performance readiness',
  status: 'fail closed until Redis cache and pgbouncer are configured',
  source: 'packages/server/src/index.ts hot public endpoint cache + cursor-paginated product search',
  requiredRuntime: [
    {
      label: 'Redis cache',
      evidence: 'apiResponseCache injection wraps public hot endpoints and emits x-groceryview-cache=hit/miss/bypass',
      currentState: 'wired for runtime provider; production remains fail closed until Redis credentials are configured outside the repo'
    },
    {
      label: 'pgbouncer',
      evidence: 'serverless Postgres traffic must use DATABASE_URL pointing at the pooler before production readiness is claimed',
      currentState: 'configuration gate only; no direct database secret is printed on public pages'
    },
    {
      label: 'cursor pagination',
      evidence: '/api/products/search returns items plus pagination.nextCursor instead of offset page numbers',
      currentState: 'live on public search envelope with invalid cursors rejected'
    }
  ],
  hotEndpoints: [
    {
      path: '/api/market/overview',
      ttlSeconds: 60,
      coverage: 'Grocery Index market overview, movers, and top deals'
    },
    {
      path: '/api/indices',
      ttlSeconds: 300,
      coverage: 'chain-index and grocery-index summaries'
    },
    {
      path: '/api/deals/discounts',
      ttlSeconds: 300,
      coverage: 'weekly discount provider rows by chain, category, store, or product'
    },
    {
      path: '/api/deals/flyer-offers',
      ttlSeconds: 300,
      coverage: 'flyer offer provider rows by chain, category, store, or product'
    }
  ],
  cursorEndpoints: [
    {
      path: '/api/products/search',
      limit: 'limit=1..100',
      cursor: 'pagination.nextCursor',
      guardrail: 'No offset page numbers; clients continue only with the opaque cursor token.'
    }
  ],
  rollupTables: [
    {
      table: 'price_daily',
      usage: 'daily product×chain min/max/avg/last rows for charts and 52-week-low reads'
    },
    {
      table: 'price_weekly',
      usage: 'weekly long-range analytics so product history avoids raw observation scans'
    }
  ],
  guardrails: [
    'Redis cache evidence is a runtime capability, not a claim that production Redis is configured today.',
    'pgbouncer readiness stays blocked until DATABASE_URL points at the pooler and the production secret audit passes.',
    'Long-range history must read price_daily or price_weekly rollups; raw observations remain for hot recent evidence only.'
  ]
};

export const timescaleDbEvaluation = {
  title: 'TimescaleDB evaluation',
  status: 'fallback_ready',
  source: 'packages/db/src/index.ts buildTimescaleDbEvaluationReport over infra/db migrations 012_price_rollups and 013_observations_partitioning',
  recommendation: 'Use declarative monthly partitions until TimescaleDB hypertable compression and retention policies are installed.',
  evaluationSignals: [
    {
      label: 'Timescale extension',
      state: 'not assumed installed',
      evidence: 'timescaleDbEvaluation.timescaleGaps keeps timescaledb_extension_not_installed visible instead of claiming adoption'
    },
    {
      label: 'Hypertable target',
      state: 'observations_v2 is the candidate hypertable',
      evidence: 'buildTimescaleDbEvaluationReport requires hypertable:observations_v2 before status can become timescale_ready'
    },
    {
      label: 'Compression + retention',
      state: 'policy evidence required',
      evidence: 'compression_policy:observations_v2 and retention_policy:observations_v2 must both exist before TimescaleDB is marked ready'
    }
  ],
  fallbackTables: [
    {
      table: 'observations_v2',
      role: 'declarative monthly partitions plus BRIN pruning for append-only price tape reads'
    },
    {
      table: 'price_daily',
      role: 'daily rollup table for product charts, 52-week-low badges, and historic range reads'
    },
    {
      table: 'price_weekly',
      role: 'weekly rollup table for long-range history without scanning raw observations'
    }
  ],
  fallbackFunctions: [
    {
      name: 'create_observations_partitions',
      role: 'pre-create monthly observations_v2 partitions before daily ingestion writes arrive'
    },
    {
      name: 'drop_observations_partitions_before',
      role: 'retention tiering hook so operators archive/downsample before partition-drop cleanup'
    }
  ],
  timescaleGaps: [
    'timescaledb_extension_not_installed',
    'missing_hypertable:observations_v2',
    'missing_compression_policy:observations_v2',
    'missing_retention_policy:observations_v2'
  ],
  guardrails: [
    'fallback_ready is not a claim that TimescaleDB is installed in production.',
    'No long-range chart should read raw observations when price_daily or price_weekly can answer the request.',
    'TimescaleDB adoption must show extension, hypertable, compression policy, and retention policy evidence before replacing the fallback.'
  ]
};

export const webPerformanceBudgetGate = {
  title: 'Lighthouse CI budget',
  status: 'Core Web Vitals budget enforced in CI',
  command: 'npm run perf:lighthouse:ci -w @groceryview/web',
  configPath: 'apps/web/lighthouserc.cjs',
  workflow: '.github/workflows/ci.yml',
  terminalRoutes: [
    '/',
    '/products',
    '/compare',
    '/data-sources'
  ],
  assertions: [
    {
      metric: 'categories:performance',
      budget: 'minimum Lighthouse performance score 0.45',
      gate: 'error'
    },
    {
      metric: 'largest-contentful-paint',
      budget: '≤ 6000 ms desktop CI route load',
      gate: 'error'
    },
    {
      metric: 'cumulative-layout-shift',
      budget: '≤ 0.15 layout shift (CI-calibrated desktop smoke)',
      gate: 'error'
    },
    {
      metric: 'total-byte-weight',
      budget: '≤ 9 MB transferred bytes per terminal route',
      gate: 'error'
    }
  ],
  guardrails: [
    'The Lighthouse CI budget runs after Next build in the required CI workflow, so regressions block PR checks instead of becoming a production surprise.',
    'The budget covers the public terminal homepage plus product discovery, compare, and data-source evidence routes.',
    'Lighthouse reports are stored in .lighthouseci as filesystem artifacts during CI; no secret token or external performance SaaS is required.'
  ]
};

export const chainSavingsLedger = Object.values(
  matchedChainProducts.reduce<Record<string, {
    chain: string;
    products: number;
    totalSavings: number;
    topSaving: number;
    topProductName: string;
    topProductSlug: string;
  }>>((ledger, product) => {
    for (const row of chainPriceRows(product)) {
      if (typeof row.savings !== 'number' || row.savings <= 0) continue;
      const chain = row.chain;
      const entry = ledger[chain] ?? {
        chain,
        products: 0,
        totalSavings: 0,
        topSaving: 0,
        topProductName: '',
        topProductSlug: ''
      };

      entry.products += 1;
      entry.totalSavings += row.savings;
      if (row.savings > entry.topSaving) {
        entry.topSaving = row.savings;
        entry.topProductName = product.name;
        entry.topProductSlug = product.slug;
      }
      ledger[chain] = entry;
    }
    return ledger;
  }, {})
)
  .map((row) => ({
    chain: row.chain,
    products: row.products,
    totalSavings: row.totalSavings,
    averageSaving: row.products ? row.totalSavings / row.products : 0,
    topSaving: row.topSaving,
    topProductName: row.topProductName,
    topProductSlug: row.topProductSlug
  }))
  .sort((a, b) => b.totalSavings - a.totalSavings || a.chain.localeCompare(b.chain, 'sv'));

export const budgetLowestPriceRadar = matchedChainProducts
  .map((product) => {
    const pricedRows = chainPriceRows(product).sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
    const cheapest = pricedRows[0];
    const priciest = pricedRows[pricedRows.length - 1];
    const cheapestPrice = cheapest?.price ?? product.lowestPrice;
    const expensivePrice = priciest?.price ?? product.highestPrice;

    return {
      productName: product.name,
      reportedBrand: product.brand,
      verifiedProductSlug: product.slug,
      cheapestChain: cheapest?.chain ?? product.lowestChain,
      cheapestPrice,
      expensiveChain: priciest?.chain ?? '',
      expensivePrice,
      priceGap: expensivePrice - cheapestPrice,
      spreadPct: product.spreadPct,
      evidenceLabel: `${pricedRows.length} matched chain prices`
    };
  })
  .filter((row) => row.priceGap > 0)
  .sort((a, b) => b.priceGap - a.priceGap || b.spreadPct - a.spreadPct)
  .slice(0, 8);

export const keyMetrics = [
  { label: 'Verified price rows', value: (axfoodProducts.length + pricedProducts.length).toLocaleString('sv-SE'), detail: 'Axfood products plus OpenPrices observations rendered from generated modules.' },
  { label: 'Matched Willys/Hemköp products', value: matchedChainProducts.length.toLocaleString('sv-SE'), detail: 'Only products present in both chain catalogues are compared.' },
  { label: 'Sweden stores', value: osmStores.length.toLocaleString('sv-SE'), detail: 'Physical stores from the Sweden-wide OSM Overpass extract.' },
  { label: 'Categories with data', value: categorySummaries.length.toLocaleString('sv-SE'), detail: 'Categories containing at least one verified product row.' }
];

const receiptAliasGrowth = planReceiptAliasGrowth({
  receipts: [
    {
      scanId: 'receipt-alias-growth-example',
      chainLabel: 'Willys Odenplan',
      observedAt: '2026-05-22T10:00:00.000Z',
      reporterId: 'reporter-produce-1',
      sourceTrust: 0.82,
      evidenceImageUri: 'private-upload://receipt-alias-growth-example',
      rows: [
        { rawName: 'Banan 0,82 kg', itemTotal: 19.35, confidence: 0.86, evidenceText: 'Banan 0,82 kg 19,35' },
        { rawName: 'Gurka 1 st', itemTotal: 12.9, confidence: 0.74 },
        { rawName: 'SMUDGED ROW', itemTotal: 8, confidence: 0.42 }
      ]
    }
  ]
});

export const receiptFedAliasGrowthPlan = {
  title: 'Receipt-fed commodity alias growth',
  status: receiptAliasGrowth.status,
  sourceLabel: 'packages/scanning planReceiptAliasGrowth',
  evidenceRequirement: 'chain label + kr + weight',
  trustTable: 'community_reporter_trust',
  reviewQueue: 'community_review_queue',
  reviewAction: 'create_commodity_alias_candidate',
  candidates: receiptAliasGrowth.candidates,
  rejectedRows: receiptAliasGrowth.rejectedRows,
  guardrails: [
    ...receiptAliasGrowth.guardrails,
    'No private receipt images are rendered in the static scanner page.',
    'Human review must accept an alias candidate before it can grow commodity coverage.'
  ],
  nextRuntimeStep: 'Persist accepted receipt alias candidates into product_aliases with reviewer id and source receipt metadata.'
};

export const unavailablePanels = [
  {
    title: 'Household profiles',
    detail: 'No verified household account records are bundled with this static website. The UI therefore hides names, budgets, dietary preferences, and notification preferences instead of inventing them.'
  },
  {
    title: 'Receipt scanner queue',
    detail: 'No production receipt-review records are present in the repo snapshot. Scanner routes show connector status and source coverage only.'
  },
  {
    title: 'Coupons and loyalty offers',
    detail: 'No authenticated coupon feed is ingested. Coupon pages show the currently verified chain-price spread surface, not fictional promotions.'
  }
];


export const accountSavedShoppingContract = {
  title: 'Saved baskets & favorite stores',
  status: 'implemented_account_api',
  favoriteStoresEndpoint: '/api/users/{userId}/favorite-stores',
  favoriteStoreDeleteEndpoint: '/api/users/{userId}/favorite-stores/{storeId}',
  basketTables: ['weekly_baskets', 'basket_items'],
  requiredInputs: [
    'signed-in userId from the authenticated session',
    'favorite store id selected from verified GroceryView stores',
    'weekly basket template name, cadence, product ids, quantities, and asOf timestamp',
    'shopper consent before any favorite-store, watchlist, or saved-basket state is reused for alerts',
    'production persistence through PostgreSQL-backed account tables before private rows are rendered'
  ],
  shippedBehaviors: [
    'Lists, adds, and removes favorite stores through account-scoped server routes.',
    'Keeps saved weekly basket rows in weekly_baskets and basket line rows in basket_items.',
    'Uses favorite stores as inputs for watchlist alerts, basket comparison, trip-cost ranking, and recurring digest routes.',
    'Keeps account shopping state separate from public catalogue evidence so prices remain auditable.',
    'Requires a signed-in shopper before any private saved basket or favorite store can be read or mutated.'
  ],
  blockedInStaticSnapshot: [
    'No private saved baskets or favorite-store rows are bundled with this static build.',
    'No anonymous shopper can read or mutate another account’s saved shopping state.',
    'No favorite store is inferred from public browsing or demo fixtures.',
    'No saved basket is shown unless production authentication and account storage return verified rows.'
  ]
};


export const shareableHouseholdListContract = {
  title: 'Shareable household lists',
  status: 'planned_account_runtime_contract',
  corePlanner: 'planShareableHouseholdList',
  roles: [
    { role: 'viewer', canEdit: false, label: 'Can view checked items, quantities, store groups, and missing-price blockers.' },
    { role: 'commenter', canEdit: false, label: 'Can add list notes without changing quantities, checked state, or account data.' },
    { role: 'editor', canEdit: true, label: 'Can edit quantities only after the signed-in user is already a household member.' }
  ],
  requiredInputs: [
    'signed-in requester userId from the authenticated session',
    'household membership from account storage before any share token is minted',
    'recipient user id or invite email plus viewer/commenter/editor role',
    'server-minted expiring share token before a public link can open the list'
  ],
  guardrails: [
    'No anonymous household edits are accepted.',
    'External email invites are view-only until the recipient signs in and joins the household.',
    'Share links must expire and should never expose private receipts, budgets, or retailer credentials.',
    'Missing prices and unavailable products remain visible blockers instead of being hidden from recipients.'
  ]
};

export const basketImportExportContract = {
  endpoint: '/api/basket/import-export',
  title: 'Bookmarklet import/export',
  status: 'implemented_account_api',
  sourceKinds: ['bookmarklet', 'browser_extension', 'copy_paste'],
  staticAsset: '/bookmarklets/groceryview-basket-import.js',
  requiredInputs: [
    'signed-in userId',
    'explicit shopper consent before retailer page content is read',
    'retailerId, source origin, capturedAt timestamp, and captured retailer basket rows',
    'raw retailer item names plus quantities and optional GroceryView product ids or product URLs'
  ],
  shippedBehaviors: [
    'Imports only rows matched to verified GroceryView product ids or aliases.',
    'Leaves unmatched retailer rows in review instead of silently creating verified products.',
    'Returns copyable export text for matched lines so shoppers can move baskets between contexts.',
    'Supports bookmarklet and future browser_extension payloads through the same account API contract.'
  ],
  blockedInStaticSnapshot: [
    'No retailer page DOM is read by this static build.',
    'No private account basket is imported without production authentication.',
    'No unmatched retailer row is treated as verified catalogue evidence.'
  ]
};

export const basketImportReviewContract = {
  endpoint: '/api/basket/import-review',
  decisionEndpoint: '/api/basket/import-review/{reviewItemId}/decisions',
  title: 'Account-bound import review',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId from the authenticated session',
    'reviewItemId created from a consented bookmarklet or browser-extension import',
    'shopper decision to accept a verified GroceryView product match or dismiss the retailer row',
    'verified GroceryView productId before any unmatched retailer row can update the basket'
  ],
  shippedBehaviors: [
    'Lists only the signed-in shopper’s open retailer import review rows.',
    'Persists open and resolved review rows through the PostgreSQL-backed runtime repository when DATABASE_URL is configured.',
    'Keeps unmatched retailer rows stay out of the basket until a signed-in shopper accepts a verified GroceryView product match.',
    'Allows dismissing retailer-only rows without converting them into verified products.',
    'Marks accepted and dismissed rows resolved so they leave the open review queue.'
  ],
  blockedInStaticSnapshot: [
    'No private review queue rows are bundled with this static build.',
    'No unmatched retailer name is added to a basket without signed-in acceptance.',
    'No review row from one account is visible to another account.'
  ]
};

export const stockoutSubstitutionContract = {
  endpoint: '/api/basket/substitutions',
  title: 'Stockout substitutions',
  status: 'core_planner_contract',
  corePlanner: 'planStockoutSubstitutionOptions',
  acceptableSubstitutionPolicy: {
    allowPrivateLabel: 'shopper-controlled',
    minimumConfidence: 'medium',
    maxUnitPriceIncreasePercent: 'shopper-controlled percent cap',
    blockedCategories: ['baby_formula', 'medical_diet', 'pet_food_sensitive'],
    dietaryTagsRequired: ['gluten_free', 'lactose_free', 'vegan', 'halal', 'kosher']
  },
  requiredInputs: [
    'signed-in basketLineId, productId, quantity, current line status, and original verified unit price',
    'candidate product rows with verified in-stock evidence, source timestamp, package size, category, brand tier, and unit price',
    'shopper substitution preferences including private-label acceptance, blocked categories, price-increase cap, and dietaryTagsRequired',
    'explicit confirmation from the shopper before any replacement product can be written back to a basket'
  ],
  shippedBehaviors: [
    'Offers only verified in-stock replacements for missing or retailer-unavailable basket lines.',
    'Keeps replacementAccepted false because substitutions are never auto-accepted.',
    'Rejects candidates missing dietaryTagsRequired evidence before savings are considered.',
    'Uses comparable package and category confidence from classifyProductMatch so stockout recovery cannot become fuzzy name matching.'
  ],
  blockedInStaticSnapshot: [
    'No live store inventory or private household basket is bundled with this static build.',
    'No substitution is claimed as reserved, purchased, or automatically applied.',
    'No dietary suitability is inferred from browsing behavior or product names when required tags are missing.'
  ]
};

export const dietarySubstitutionAssistantContract = {
  endpoint: '/api/meals/dietary-substitutions',
  title: 'Dietary substitution assistant',
  status: 'core_planner_contract',
  corePlanner: 'planDietarySubstitutionAssistant',
  supportedIntents: ['dairy_free', 'gluten_free', 'vegan', 'halal', 'kosher', 'general'],
  preferenceFields: [
    'profileId',
    'requiredDietaryTags',
    'blockedDietaryTags',
    'allergenAvoidanceTags',
    'substitutionIntent',
    'maxUnitPriceIncreasePercent'
  ],
  examplePlan: planDietarySubstitutionAssistant({
    source: {
      productId: 'milk-reference',
      productName: 'Milk reference 1l',
      category: 'milk',
      packageSize: 1,
      packageUnit: 'l',
      unitPrice: 16.9,
      dietaryTags: ['dairy'],
      brandTier: 'national'
    },
    preference: {
      profileId: 'signed-in-dietary-profile',
      requiredDietaryTags: ['vegan', 'lactose_free'],
      blockedDietaryTags: ['dairy'],
      allergenAvoidanceTags: ['almond'],
      substitutionIntent: 'dairy_free',
      maxUnitPriceIncreasePercent: 20
    },
    candidates: [
      {
        productId: 'oat-drink-reference',
        productName: 'Oat drink 1l',
        category: 'dairy_substitute',
        packageSize: 1,
        packageUnit: 'l',
        unitPrice: 18.9,
        dietaryTags: ['vegan', 'lactose_free'],
        allergenTags: ['oat'],
        evidenceSource: 'verified label evidence',
        observedAt: snapshot.retrievedLabel,
        brandTier: 'national'
      }
    ]
  }),
  guardrails: [
    'No dietary swap is auto-applied; every replacement requires signed-in shopper confirmation.',
    'requiredDietaryTags and allergenAvoidanceTags are checked against verified label evidence before price is considered.',
    'Medical or infant diet categories require professional confirmation and are blocked from automatic recommendations.',
    'The assistant explains options only; it does not make nutrition, allergy, medical, checkout, or inventory claims.'
  ]
};

export const retailerHandoffContract = {
  endpoint: '/api/basket/handoff/{retailerId}',
  title: 'Retailer handoff support matrix',
  status: 'implemented_account_api',
  supportedRetailers: [
    { retailerId: 'willys', label: 'Willys', productLinks: 'supported', basketTransfer: 'unsupported', checkoutConfirmation: 'unsupported' },
    { retailerId: 'coop', label: 'Coop', productLinks: 'supported', basketTransfer: 'unsupported', checkoutConfirmation: 'unsupported' },
    { retailerId: 'lidl', label: 'Lidl', productLinks: 'manual', basketTransfer: 'unsupported', checkoutConfirmation: 'unsupported' }
  ],
  requiredInputs: [
    'signed-in userId',
    'target retailerId with a verified support-matrix entry',
    'current basket product ids, product names, quantities, and optional retailer product links',
    'explicit retailer capability flags for product links, basket transfer, app search, copy list, and checkout confirmation'
  ],
  shippedBehaviors: [
    'Builds a prioritized handoff plan with copy-list, product-link, retailer app search, and basket-transfer actions.',
    'Marks basket transfer unsupported unless a retailer capability is verified in the support matrix.',
    'Keeps unmatched basket lines visible for manual shopper review before leaving GroceryView.',
    'States that checkout confirmation is unavailable so GroceryView cannot claim purchase completion.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated household basket is bundled with this static build.',
    'No retailer checkout session, delivery slot, or purchase confirmation is rendered from static data.',
    'No automatic retailer basket transfer is advertised without verified retailer support.'
  ]
};

export const retailerDeepLinkQualityContract = {
  endpoint: '/api/basket/handoff/{retailerId}/deep-link-quality',
  title: 'Deep-link quality scoring',
  status: 'core_planner_contract',
  corePlanner: 'scoreRetailerDeepLinkQuality',
  evidenceFields: ['productUrl', 'httpStatus', 'canonicalProductId', 'lastCheckedAt', 'matched'],
  qualityLabels: [
    { label: 'verified', requirement: 'verified URL, HTTP 200, and canonical product evidence match the GroceryView product id' },
    { label: 'unchecked', requirement: 'URL exists but needs current HTTP and canonical product verification' },
    { label: 'broken', requirement: 'retailer URL returned a non-2xx/3xx status' },
    { label: 'mismatch', requirement: 'canonicalProductId points to another retailer product' },
    { label: 'missing', requirement: 'no verified retailer product URL is available for this basket line' }
  ],
  guardrails: [
    'Deep-link quality is not checkout confirmation, purchase completion, inventory reservation, or delivery booking.',
    'Broken, mismatched, or missing links must fall back to copy-list or retailer app search.',
    'A link is not labeled verified unless the canonicalProductId agrees with the GroceryView product id.'
  ]
};

export const retailerBasketTransferContract = {
  endpoint: '/api/basket/transfer/{retailerId}',
  title: 'Secure basket transfer preflight',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'target retailerId from the verified support matrix',
    'current basket product ids, quantities, verified retailer product matches, and product URLs',
    'verified retailer basket-transfer capability, endpoint, signed payload, and active shopper retailer session'
  ],
  shippedBehaviors: [
    'Preflights basket transfer and blocks unless capability is verified as supported.',
    'Requires every basket line to have a verified retailer product match and product URL.',
    'Returns copy-list and product-link fallback paths through the handoff surface when transfer is blocked.',
    'Keeps transfer attempts separate from checkout confirmation, payment, delivery booking, and inventory reservation.'
  ],
  blockedInStaticSnapshot: [
    'No retailer currently has verified automatic basket transfer enabled in the public static snapshot.',
    'No unsupported retailer transfer endpoint is called from GroceryView.',
    'No basket transfer is described as checkout completion or purchase confirmation.'
  ]
};

export const basketTripCostContract = {
  endpoint: '/api/basket/trip-cost',
  title: 'Basket + trip cost optimizer',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'current basket quantities and favorite-store choices',
    'travelMode plus optional time, vehicle, transit, delivery, and split-shop cost settings',
    'current verified shelf totals for every ranked basket strategy'
  ],
  shippedBehaviors: [
    'Ranks complete basket strategies by shelf total plus explicit travel and time cost.',
    'Shows trip cost separately from verified shelf totals so price evidence stays auditable.',
    'Keeps missing-price options out of complete rankings even when travel looks cheap.',
    'Labels split-shop penalties instead of hiding extra effort inside product prices.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated home location, travel mode, or saved basket is bundled with this static build.',
    'No retailer delivery or checkout confirmation is claimed from optimizer output.',
    'No precise user location is rendered without explicit signed-in consent.'
  ]
};

export const elderlyNearestDeliveryPlanner = {
  persona: 'Elderly / seniors',
  title: 'Nearest-store + delivery options',
  status: 'static_public_planner',
  mobilitySupport: [
    { label: 'Nearest verified store', evidence: 'uses OSM store records and public district labels before any private home location is requested' },
    { label: 'Delivery fallback', evidence: 'routes shoppers to fulfillment slot evidence when walking or transit effort is too high' },
    { label: 'Pickup fallback', evidence: 'keeps pickup separate from delivery and requires retailer checkout confirmation' }
  ],
  guardrails: [
    'no private home location is bundled with the static snapshot',
    'store distance is not personalized until a signed-in shopper consents',
    'delivery and pickup options are evidence only, not retailer reservations'
  ]
};

export const budgetCheapestStoreRoutingPlanner = {
  persona: 'Budget-conscious / low-income',
  title: 'Cheapest-store-for-my-list routing',
  status: 'account_api_guardrail_surface',
  routeRankInputs: [
    'signed-in shopping list with verified product ids and quantities',
    'favorite or reachable store ids selected from verified GroceryView stores',
    'complete basket totals from the trip-cost optimizer for every ranked option',
    'explicit travel mode and shopper-approved location or district context'
  ],
  storeListGuardrails: [
    'No private home location is read or rendered in the public static snapshot.',
    'Stores with missing basket prices remain blockers instead of being ranked as cheapest.',
    'Routing ranks basket plus trip cost; it does not claim checkout, stock, or delivery reservation.',
    'Cheapest-store copy must link back to verified shelf-total and travel-cost evidence.'
  ],
  nextStep: 'Use the account-only basket trip-cost endpoint once a shopper signs in, consents to location context, and has a current list.'
};

export const fulfillmentSlotsContract = {
  endpoint: '/api/basket/fulfillment-slots/{retailerId}/{storeId}',
  title: 'Delivery and pickup slot evidence',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'retailerId and storeId selected from verified GroceryView store records',
    'shopper consent for manually captured retailer slot evidence',
    'capturedAt and asOf timestamps for every delivery or pickup availability snapshot'
  ],
  shippedBehaviors: [
    'Separates pickup and delivery availability evidence from basket pricing and trip-cost ranking.',
    'Returns only currently available slots in the available slot list while retaining unavailable-slot blockers.',
    'Labels every slot report as evidence, not retailer reservations or checkout completion.',
    'Requires shoppers to re-confirm delivery or pickup availability inside the retailer checkout.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated private basket or retailer session is bundled with this static build.',
    'No delivery or pickup slot is presented as reserved, booked, or guaranteed.',
    'No retailer checkout is completed or claimed from static evidence snapshots.'
  ]
};


export const loyaltyPriceChains = [
  { chain: 'ICA', preferenceKey: 'ica_loyalty_prices', evidenceStatus: 'preference_only_until_account_offer_response' },
  { chain: 'Willys', preferenceKey: 'willys_plus_prices', evidenceStatus: 'preference_only_until_account_offer_response' },
  { chain: 'Coop', preferenceKey: 'coop_member_prices', evidenceStatus: 'preference_only_until_account_offer_response' },
  { chain: 'Hemköp', preferenceKey: 'hemkop_member_prices', evidenceStatus: 'preference_only_until_account_offer_response' },
  { chain: 'Lidl', preferenceKey: 'lidl_plus_prices', evidenceStatus: 'preference_only_until_account_offer_response' },
  { chain: 'City Gross', preferenceKey: 'citygross_member_prices', evidenceStatus: 'preference_only_until_account_offer_response' }
];


export const priceAlertThresholdPreferenceContract = {
  title: 'Custom price alert thresholds',
  endpoint: '/api/account/watchlist-thresholds',
  status: 'account_preference_contract',
  thresholdTypes: [
    { key: 'targetPrice', label: 'Target price', storedValue: 'SEK amount per watched product', engineInput: 'WatchlistItem.targetPrice' },
    { key: 'dealScoreMinimum', label: 'Deal Score minimum', storedValue: '0-100 integer', engineInput: 'WatchlistItem.minimumDealScore' },
    { key: 'newLowOnly', label: 'New-low only', storedValue: 'boolean', engineInput: 'WatchlistItem.notifyOnNewLow' },
    { key: 'allowedPriceTypes', label: 'Allowed price types', storedValue: 'shelf, weekly deal, member promo', engineInput: 'WatchlistItem.allowedPriceTypes' }
  ],
  guardrails: [
    'No anonymous thresholds are stored or applied to private watchlists.',
    'Thresholds only filter verified product price rows passed into buildWatchlistAlerts.',
    'Member-only thresholds must respect loyalty price preferences before member-price alerts can be sent.',
    'Quiet hours and channel preferences still run through planNotifications after alert selection.'
  ]
};

export const loyaltyPricePreferenceContract = {
  title: 'Loyalty price preferences',
  endpoint: '/api/account/loyalty-price-preferences',
  status: 'account_preference_contract',
  chainToggles: loyaltyPriceChains,
  savedFields: ['userId', 'chain', 'preferenceKey', 'enabled', 'updatedAt'],
  guardrails: [
    'No retailer credentials are stored by GroceryView for loyalty price preferences.',
    'Preferences only tell GroceryView whether to include authenticated loyalty prices after the protected loyalty offer endpoint returns evidence.',
    'Public pages must label authenticated loyalty prices as unavailable until a signed-in account response confirms eligibility.',
    'Disabling a chain preference must hide member-only savings claims for that chain.'
  ]
};

const lidlMemberOfferByCode = new Map<string, (typeof lidlStoreOffers)[number]>();
for (const offer of lidlStoreOffers) {
  if (!offer.memberOnly) continue;
  if (!lidlMemberOfferByCode.has(offer.code)) lidlMemberOfferByCode.set(offer.code, offer);
}

function lidlMemberOfferStoreCount(code: string) {
  return new Set(lidlStoreOffers.filter((offer) => offer.memberOnly && offer.code === code).map((offer) => offer.storeId)).size;
}

const lidlMemberOfferRows = [...lidlMemberOfferByCode.values()]
  .map((offer) => {
    const savings = typeof offer.regularPrice === 'number' && offer.regularPrice > offer.price ? roundSek(offer.regularPrice - offer.price) : null;
    return {
      id: `lidl-${offer.code}`,
      chain: 'Lidl',
      productName: offer.brand ? `${offer.brand} ${offer.name}` : offer.name,
      packageText: offer.packageText,
      storeScope: `${lidlMemberOfferStoreCount(offer.code)} Lidl stores`,
      memberPriceLabel: offer.priceText,
      publicShelfPriceLabel: typeof offer.regularPrice === 'number' ? formatSek(offer.regularPrice) : 'No public shelf price in source',
      totalMemberSavings: savings,
      totalMemberSavingsLabel: savings === null ? 'Blocked until public shelf price appears' : formatSek(savings),
      priceType: 'member' as const,
      source: lidlSource.source,
      evidence: `memberOnly=${offer.memberOnly}; sourceUrl=${offer.sourceUrl}`,
      validTo: offer.validTo.slice(0, 10),
      pointsEarned: null as number | null,
      pointsStatus: 'blocked_until_retailer_program_rules',
      pointEvidence: 'No retailer point ledger or earning rule in the public source; must not estimate loyalty points from SEK spend.'
    };
  })
  .sort((left, right) => (right.totalMemberSavings ?? 0) - (left.totalMemberSavings ?? 0));

const matpriskollenMemberOfferRows = [...matpriskollenOffers]
  .filter((offer) => offer.requiresMembershipCard)
  .slice(0, 8)
  .map((offer) => ({
    id: `matpriskollen-${offer.code}`,
    chain: offer.store.split(' ')[0] || 'Matpriskollen store',
    productName: [offer.brand, offer.name].filter(Boolean).join(' '),
    packageText: offer.packageText,
    storeScope: offer.store,
    memberPriceLabel: offer.priceText,
    publicShelfPriceLabel: offer.regularPriceText || 'No public shelf price in source',
    totalMemberSavings: null as number | null,
    totalMemberSavingsLabel: 'Blocked until public shelf price appears',
    priceType: 'member' as const,
    source: 'matpriskollen.se public store/offers JSON API',
    evidence: `requiresMembershipCard=${offer.requiresMembershipCard}; requiresCoupon=${offer.requiresCoupon}`,
    validTo: offer.validTo.slice(0, 10),
    pointsEarned: null as number | null,
    pointsStatus: 'blocked_until_account_point_ledger',
    pointEvidence: 'No retailer point ledger or earning rule in the public source; do not infer loyalty points from member-offer price text.'
  }));

const memberOfferAggregationRows = [...lidlMemberOfferRows.slice(0, 6), ...matpriskollenMemberOfferRows.slice(0, 6)];

export const memberOfferAggregationBoard = {
  title: 'Member-offer aggregation + points',
  status: 'public_member_offer_evidence_with_account_points_blocked',
  priceType: 'member' as const,
  sourcePredicate: "price_type='member'",
  sourceCounts: [
    { source: 'lidlStoreOffers.memberOnly', rows: lidlMemberOfferRows.length },
    { source: 'matpriskollenOffers.requiresMembershipCard', rows: matpriskollenMemberOfferRows.length }
  ],
  totalMemberSavings: roundSek(lidlMemberOfferRows.reduce((sum, row) => sum + (row.totalMemberSavings ?? 0), 0)),
  totalMemberSavingsLabel: formatSek(lidlMemberOfferRows.reduce((sum, row) => sum + (row.totalMemberSavings ?? 0), 0)),
  pointsEarned: null as number | null,
  pointsStatus: 'No anonymous point balances; points stay blocked until a signed-in retailer programme rule and account-bound point ledger are present.',
  rows: memberOfferAggregationRows,
  pointLedgerRows: memberOfferAggregationRows.map((row) => ({
    id: `${row.id}-points`,
    chain: row.chain,
    productName: row.productName,
    priceType: 'member' as const,
    pointsEarned: row.pointsEarned,
    pointsStatus: row.pointsStatus,
    evidence: row.pointEvidence
  })),
  guardrails: [
    'No retailer credentials are stored by GroceryView for member-offer aggregation.',
    "Member-offer aggregation maps only public memberOnly or requiresMembershipCard evidence to price_type='member'.",
    'Do not infer or estimate loyalty points from member-offer SEK spend without source earning rules and an account-bound point ledger.',
    'No anonymous point balances or personalized loyalty balances are rendered in the static snapshot.'
  ]
};

export const recurringBasketDigestContract = {
  endpoint: '/api/basket/recurring-digest',
  title: 'Recurring basket digest',
  status: 'implemented_account_api',
  requiredInputs: [
    'signed-in userId',
    'saved weekly basket item quantities',
    'templateId, templateName, cadence, and asOf timestamp',
    'current and previous verified product prices'
  ],
  shippedBehaviors: [
    'Changed since last shop totals are computed only from comparable verified lines.',
    'Price-up, price-down, substitute-available, new-item, and missing-current-price states are separated.',
    'Suggested substitutes require review and never rewrite a recurring basket automatically.',
    'Missing-price blockers stay visible and block automatic checkout handoff.'
  ],
  blockedInStaticSnapshot: [
    'No authenticated household basket is bundled with this static build.',
    'No private purchase history is rendered without a production auth session.',
    'No checkout or retailer handoff is claimed from a digest response.'
  ]
};

export type PrivateFeatureRoute =
  | 'weekly-basket'
  | 'watchlist'
  | 'scanner'
  | 'household'
  | 'account'
  | 'account-profile'
  | 'basket-ideas'
  | 'coupon-stacks'
  | 'deals'
  | 'meal-planner'
  | 'nutrition-value'
  | 'pantry-planner'
  | 'price-reports'
  | 'savings-dashboard'
  | 'shopping-trips'
  | 'privacy';

export const privateFeatureCopy: Record<PrivateFeatureRoute, { verifiedSurface: string; gatedBy: string; nextStep: string }> = {
  'weekly-basket': {
    verifiedSurface: 'The page can compare verified Willys/Hemkop spreads and source coverage, but it cannot assemble a household basket without authenticated pantry and quantity records.',
    gatedBy: 'Requires a real household profile, saved staples, and opt-in purchase history before totals or substitutions are shown.',
    nextStep: 'Connect authenticated basket records, then render item-level totals with source timestamps beside every price.'
  },
  watchlist: {
    verifiedSurface: 'The public snapshot supports product spread browsing, but it does not know which products a shopper personally follows.',
    gatedBy: 'Requires signed-in watchlist records and notification consent before alerts can be personalized.',
    nextStep: 'Store verified watchlist preferences first, then show only alerts backed by current chain or OpenPrices rows.'
  },
  scanner: {
    verifiedSurface: 'Scanner routes can explain coverage and price sources, but no production receipt images or review queue rows are bundled.',
    gatedBy: 'Requires uploaded receipts, parser output, and human review status before line-item corrections appear.',
    nextStep: 'Add receipt review records with redacted merchant metadata, then expose the queue with confidence labels.'
  },
  household: {
    verifiedSurface: 'The static build can show public grocery data, not household members, budgets, diets, or location preferences.',
    gatedBy: 'Requires authenticated account records and explicit household sharing settings.',
    nextStep: 'Load profile fields from production auth, then render only confirmed preferences and consent states.'
  },
  account: {
    verifiedSurface: 'The account page stays browse-only because this repository snapshot has no verified user identity records.',
    gatedBy: 'Requires a production auth session plus alert, privacy, and subscription records.',
    nextStep: 'Wire the sign-in flow before showing account settings, saved areas, or message preferences.'
  },
  'account-profile': {
    verifiedSurface: 'The profile page can explain why account data is absent, but it cannot show names, emails, saved areas, or household roles from this static snapshot.',
    gatedBy: 'Requires a signed production session and verified account profile record before personal details are rendered.',
    nextStep: 'Load profile fields from authenticated storage, then show only confirmed identity, consent, and saved-area metadata.'
  },
  'basket-ideas': {
    verifiedSurface: 'The app can rank public price spreads, but it cannot suggest personal baskets without real household goals.',
    gatedBy: 'Requires saved staples, dietary constraints, and accepted substitutions before basket ideas are personalized.',
    nextStep: 'Combine verified profile preferences with current product rows, then label every suggestion by source confidence.'
  },
  'coupon-stacks': {
    verifiedSurface: 'The static snapshot has chain prices but no authenticated coupons, loyalty balances, or receipt bonuses.',
    gatedBy: 'Requires a coupon feed tied to a real account before stacked savings can be counted.',
    nextStep: 'Ingest coupon eligibility and expiry data, then separate guaranteed discounts from receipt-pending bonuses.'
  },
  deals: {
    verifiedSurface: 'Deal radar can point to verified chain-price spreads, but private deal decisions need shopper-specific thresholds.',
    gatedBy: 'Requires saved stores, stock-up rules, and notification consent before deal pushes are shown.',
    nextStep: 'Attach user thresholds to verified product rows, then show deal rationale with price-source caveats.'
  },
  'meal-planner': {
    verifiedSurface: 'Verified product rows can support ingredient research, but meal plans need real preferences and portions.',
    gatedBy: 'Requires dietary preferences, household size, and accepted recipe substitutions.',
    nextStep: 'Load signed-in meal constraints, then build plans only from products with current source coverage.'
  },
  'nutrition-value': {
    verifiedSurface: 'The static snapshot has price data, not complete nutrition labels for every rendered product.',
    gatedBy: 'Requires verified nutrition facts matched to each product code before nutrition-per-krona rankings are shown.',
    nextStep: 'Join nutrition labels to product identifiers, then rank only rows with both price and nutrition evidence.'
  },
  'pantry-planner': {
    verifiedSurface: 'Pantry planning is withheld because the app does not know current household inventory or shelf-life rules.',
    gatedBy: 'Requires saved pantry counts, preferred stores, and real replenishment cadence.',
    nextStep: 'Sync pantry records first, then show restock recommendations with verified price and freshness context.'
  },
  'price-reports': {
    verifiedSurface: 'Public report pages can summarize generated sources, but no private report subscriptions are present.',
    gatedBy: 'Requires subscribed audiences, send approvals, and report history before personalized reports appear.',
    nextStep: 'Store report recipients and approval records, then attach each report claim to a generated data source.'
  },
  'savings-dashboard': {
    verifiedSurface: 'The dashboard can show public coverage, not personal avoided spend or budget progress.',
    gatedBy: 'Requires real baskets, receipts, and baseline prices before savings totals are calculated.',
    nextStep: 'Backfill verified purchase history, then compute savings only from reviewed transactions.'
  },
  'shopping-trips': {
    verifiedSurface: 'Store and price rows are available, but route planning needs real saved locations and trip constraints.',
    gatedBy: 'Requires saved areas, transport mode, store preferences, and consent to use location context.',
    nextStep: 'Connect signed-in trip preferences, then show only trips with current store and product evidence.'
  },
  privacy: {
    verifiedSurface: 'The privacy page avoids pretend toggles because no authenticated consent records are loaded in this snapshot.',
    gatedBy: 'Requires real user consent state and account identity before controls can be changed.',
    nextStep: 'Read privacy preferences from production auth, then render controls with audit timestamps.'
  }
};

export const browserExtensionOverlayContract = {
  title: 'Retailer browser overlay',
  manifestPath: '/extension/manifest.json',
  assetPath: '/extension/retailer-overlay.js',
  apiEndpoint: '/api/products/{productId}/cheapest-now',
  productIdAttribute: 'data-groceryview-product-id',
  detectionSignals: ['data-groceryview-product-id', 'JSON-LD gtin/ean', 'retailer sku', 'commodity alias'],
  supportedRetailers: [
    { chain: 'ICA', hostPattern: 'handlaprivatkund.ica.se', status: 'mapping-ready' },
    { chain: 'Coop', hostPattern: 'coop.se', status: 'mapping-ready' },
    { chain: 'Willys', hostPattern: 'willys.se', status: 'mapping-ready' }
  ],
  confidenceRule: 'High for exact GroceryView/EAN matches when the cheapest-now API returns at least two observed chains; limited for commodity aliases or missing chains.',
  guardrails: [
    'No anonymous visitor identity, basket, or retailer account data is stored by the overlay.',
    'Retailer pages must provide a mapped GroceryView id, EAN/GTIN, SKU, or safe commodity alias before any cheaper alternative is shown.',
    'Missing product mappings stay silent instead of estimating prices from names alone.'
  ]
};

export function findProduct(slug: string) {
  return axfoodProducts.find((product) => product.slug === slug) ?? pricedProducts.find((product) => product.slug === slug);
}

export function findStore(slug: string) {
  return osmStores.find((store) => store.slug === slug);
}

export function chainPriceRows(product: (typeof axfoodProducts)[number]) {
  const rows = Object.entries(product.chains).map(([chain, price]) => ({ chain, ...price }));

  return rows.filter((row): row is (typeof rows)[number] & { price: number } => typeof row.price === 'number' && Number.isFinite(row.price));
}

export const sourceDiscrepancyReportOptions = [
  { id: 'wrong_price', label: 'Wrong price', reviewerHint: 'Compare shopper evidence with the latest raw price row before approving.' },
  { id: 'wrong_unit', label: 'Wrong unit', reviewerHint: 'Check package text, normalized unit, and unit-price conversion.' },
  { id: 'missing_image', label: 'Missing image', reviewerHint: 'Confirm the source image URL is absent or broken before requesting a refresh.' },
  { id: 'unavailable_product', label: 'Unavailable product', reviewerHint: 'Verify store availability or stale catalogue rows before hiding the item.' }
] as const;

export const storeProductStockFreshnessExamples = [
  {
    productId: 'demo-live-stock',
    storeId: 'willys',
    availability: 'live',
    observedAt: '2026-05-25T08:00:00.000Z',
    source: 'retailer store feed'
  },
  {
    productId: 'demo-stale-stock',
    storeId: 'hemkop',
    availability: 'stale',
    observedAt: '2026-05-12T08:00:00.000Z',
    source: 'retailer store feed'
  },
  {
    productId: 'demo-inferred-stock',
    storeId: 'willys',
    availability: 'inferred',
    observedAt: null,
    source: 'priced row without stock field'
  },
  {
    productId: 'demo-unavailable-stock',
    storeId: 'hemkop',
    availability: 'unavailable',
    observedAt: '2026-05-25T08:00:00.000Z',
    source: 'retailer store feed'
  }
] as const;

export const sourceDiscrepancyReviewContract = {
  protectedEndpoint: '/api/source-discrepancies',
  subjectType: 'source_discrepancy_report',
  queue: 'human_review_assignments',
  guardrails: [
    'Reports are attached to productId and storeId so reviewers can trace the exact product row.',
    'Wrong price, wrong unit, missing image, and unavailable product reports enter human review before verified data changes.',
    'Approvals create source QA follow-up instead of directly mutating source prices.'
  ]
};
