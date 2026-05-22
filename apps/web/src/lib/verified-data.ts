import { COMMODITIES, STAPLE_BASKET, SUPPORTED_PRICE_DOMAINS, type Commodity, type ComparableUnit } from '@groceryview/catalog';
import { calculateChainPriceIndex, calculateDealScore, compareCommodityUnitPrices, planBasketTripCost, planCommunityReportAbuseControls, planDietarySubstitutionAssistant, planHumanReviewAssignments, planHumanReviewQueue, planRecurringBasketDigest, recommendSmartSwaps, summarizeCategoryDealLeaders, summarizePriceHistory, type BrandTier, type ChainPriceObservation, type CommodityPriceObservation, type ProductMatchInput } from '@groceryview/core';
import { planReceiptAliasGrowth } from '@groceryview/scanning';
import { axfoodProducts } from './axfood-products';
import { icaReklambladOffers, icaReklambladSource } from './ingested/ica-reklamblad';
import { mathemProducts, mathemSource } from './ingested/mathem';
import { openFoodFactsCatalog } from './openfoodfacts-catalog';
import { lidlStoreOffers, lidlSource } from './ingested/lidl';
import { matpriskollenOffers } from './ingested/matpriskollen';
import { categoryLabels, pricedProducts } from './openprices-products';
import { osmStores } from './osm-stores';
import {
  currencyFromObservation,
  defaultLocale,
  formatLocalizedDate,
  formatLocalizedMoney,
  formatLocalizedUnitPrice,
  supportedCurrencies
} from './i18n';

export const snapshot = {
  retrievedLabel: '20-21 May 2026',
  axfoodSource: 'Willys and Hemköp public search endpoints',
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
  const average = peerUnitPrices.reduce((sum, value) => sum + value, 0) / peerUnitPrices.length;
  if (!Number.isFinite(average) || average <= unitPrice) return null;
  const advantage = ((average - unitPrice) / average) * 100;
  return `cheapest-per-unit · 🟢 -${formatPct(advantage)}/${unitLabel.replace('kr/', '')} vs chain avg`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

export const matchedChainProducts = axfoodProducts.filter((product) => product.inChains.length > 1 && product.lowestPrice > 0);
export const topChainSpreads = [...matchedChainProducts].sort((a, b) => b.spreadPct - a.spreadPct).slice(0, 18);
export const freshestOpenPrices = [...pricedProducts].sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt)).slice(0, 18);
export const productUniverse = [...topChainSpreads, ...freshestOpenPrices].slice(0, 36);

const groceryObservationCount = pricedProducts.reduce((sum, product) => sum + product.observationCount, 0);

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
  priceObservationsAvailable: domain.slug === 'grocery' ? groceryObservationCount : 0,
  confidence: domain.slug === 'grocery' ? 'active verified grocery rows' : 'foundation only',
  priceClaim: domain.priceClaim,
  claimBoundary: domain.slug === 'grocery'
    ? 'Grocery can render verified price observations with source confidence.'
    : 'No non-grocery prices are rendered until connector observations land.',
  migrationFields: ['chains.domain', 'stores.domain', 'products.domain', 'observations.domain', 'latest_prices.domain'],
  schemaDefault: "domain default 'grocery'",
  guardrails: [
    "Existing GroceryView rows default to domain='grocery'.",
    'Fuel and pharmacy routes may show supported item and location models, but must not show prices before domain-scoped observations exist.',
    'Non-grocery matching remains domain-scoped: fuel grades are not compared to grocery EANs, and pharmacy OTC rows exclude prescription claims.'
  ]
}));

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
    onlineUnitPriceText: row.onlineProduct.unitPriceText,
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

export type AdaptiveProductCard = {
  slug: string;
  name: string;
  brand: string;
  productKind: 'branded' | 'commodity';
  totalPriceLabel: string;
  unitPriceLabel: string;
  packageLabel: string;
  sourceLabel: string;
  confidenceLabel: string;
  totalSortPrice: number;
  unitSortPrice: number | null;
  defaultCompareMode: 'total' | 'unit';
  cheapestUnitBadge: string | null;
};
export const adaptiveProductCards: AdaptiveProductCard[] = productUniverse.map((product) => {
  const isChainProduct = 'lowestPrice' in product;
  const totalPrice = isChainProduct ? product.lowestPrice : product.priceMedian;
  const packageText = isChainProduct ? product.subline : product.quantity;
  const normalizedUnit = normalizeComparableUnitPrice(totalPrice, packageText);
  const productKind = adaptiveProductKind(product.category);
  const peerUnitPrices = isChainProduct && normalizedUnit
    ? Object.values(product.chains)
      .map((row) => row.price === null ? null : normalizeComparableUnitPrice(row.price, packageText)?.unitPrice ?? null)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    : [];

  return {
    slug: product.slug,
    name: product.name,
    brand: isChainProduct ? product.brand : product.brands || 'Brand not reported',
    productKind,
    totalPriceLabel: formatSek(totalPrice),
    unitPriceLabel: normalizedUnit ? formatLocalizedUnitPrice(normalizedUnit.unitPrice, {
      locale: defaultLocale,
      currency: observedSnapshotCurrency,
      unit: normalizedUnit.unitLabel.replace('kr/', '')
    }) : 'Unit price not reported',
    packageLabel: normalizedUnit?.packageLabel || packageText || 'Package size not reported',
    sourceLabel: isChainProduct ? `${product.lowestChain} lowest · ${formatPct(product.spreadPct)} spread` : `OpenPrices · ${product.observationCount.toLocaleString('sv-SE')} observations`,
    confidenceLabel: normalizedUnit ? `Derived from observed price + package size (${normalizedUnit.unitLabel})` : 'No synthetic unit prices: package quantity missing',
    totalSortPrice: totalPrice,
    unitSortPrice: normalizedUnit?.unitSortPrice ?? null,
    defaultCompareMode: productKind === 'commodity' ? 'unit' : 'total',
    cheapestUnitBadge: normalizedUnit ? cheapestUnitBadge(normalizedUnit.unitPrice, peerUnitPrices, normalizedUnit.unitLabel) : null
  };
});
export const homepageAdaptiveProductCards = adaptiveProductCards.slice(0, 6);

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
      ? localeFormattingSampleCard?.unitPriceLabel ?? 'Unit price not reported'
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
    comparisonPrice: offer.comparisonPrice || 'Jämförpris not reported',
    regularPriceText: offer.regularPriceText || 'Regular price not reported',
    validTo: offer.validTo,
    storeName: offer.storeName,
    sourceUrl: offer.sourceUrl,
    flyerUrl: offer.flyerUrl,
    flyerPdfUrl: offer.flyerPdfUrl,
    eanCount: offer.eans.length,
    evidenceLabel: `${offer.storeName} · ${offer.availableOnline ? 'online + in-store' : offer.availableInStore ? 'in-store' : 'availability not reported'}`
  }));

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
      comparePriceText: offer.comparePriceText,
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
    label: labelFromSlug(row.slug),
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

export const priceDropMoversBoard = pricedProducts
  .flatMap((product) => {
    const historyPoints = dailyObservedPricePoints(product);
    if (historyPoints.length < 2) return [];

    const summary = summarizePriceHistory(historyPoints);
    const previousPrice = summary.previousPrice ?? summary.latestPrice;
    return [{
      productSlug: product.slug,
      productName: product.name,
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
    name: 'Sweden store directory',
    source: snapshot.osmSource,
    rows: osmStores.length,
    coverage: `${new Set(osmStores.map((store) => store.brand)).size} brands across Sweden`,
    freshness: osmStores[0]?.retrievedDate ?? 'Not reported',
    caveat: 'Location data only; prices are not inferred from store locations.'
  }
];

function sourceKindFor(name: string) {
  if (name === 'Axfood chain price snapshot') return 'axfood';
  if (name === 'OpenPrices SEK observations') return 'openprices';
  if (name === 'OpenFoodFacts metadata catalog') return 'openfoodfacts';
  return 'osm';
}

function sourceRouteFor(name: string) {
  if (name === 'Sweden store directory') return '/stores';
  if (name === 'OpenPrices SEK observations' || name === 'OpenFoodFacts metadata catalog') return '/products';
  return '/compare';
}

function confidenceBadgeFor(name: string) {
  if (name === 'Axfood chain price snapshot') return 'chain-wide catalogue confidence';
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
      : source.name === 'OpenPrices SEK observations' || source.name === 'OpenFoodFacts metadata catalog'
        ? '/products'
        : '/compare';
  const allowedClaim =
    source.name === 'Sweden store directory'
      ? 'Verified Sweden store locations, brands, formats, districts, and address coverage.'
      : source.name === 'OpenPrices SEK observations'
        ? 'Observed community price medians, observation counts, product codes, and latest sighting dates.'
        : source.name === 'OpenFoodFacts metadata catalog'
          ? 'Metadata-only Swedish product names, brands, quantities, category tags, labels, package images, and OFF product URLs.'
          : 'Chain-wide Willys and Hemkop catalogue prices and same-product spread comparisons.';
  const blockedClaim =
    source.name === 'Sweden store directory'
      ? 'Branch-level prices, inventory, opening hours, or promotion availability.'
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
      label: 'Nutrition per krona',
      path: '/api/nutrition/value',
      supports: 'nutrition per krona rankings for protein, calories, fiber, sugar, and salt warning guardrails'
    }
  ],
  guardrails: [
    'All listed endpoints are unauthenticated public read endpoints in the OpenAPI document.',
    'Account, basket, watchlist, privacy, and human-review APIs stay bearer-auth protected.',
    'Prices and nutrition values are served with provenance/guardrails; missing data remains absent instead of filled with estimates.'
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
      rows: [
        { rawName: 'Banan 0,82 kg', itemTotal: 19.35, confidence: 0.86 },
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
    { role: 'editor', canEdit: true, label: 'Can edit quantities only after the signed-in user is already a household member.' }
  ],
  requiredInputs: [
    'signed-in requester userId from the authenticated session',
    'household membership from account storage before any share token is minted',
    'recipient user id or invite email plus viewer/editor role',
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
  assetPath: '/extension/retailer-overlay.js',
  apiEndpoint: '/api/products/{productId}/cheapest-now',
  productIdAttribute: 'data-groceryview-product-id',
  supportedRetailers: [
    { chain: 'ICA', hostPattern: 'handlaprivatkund.ica.se', status: 'mapping-ready' },
    { chain: 'Coop', hostPattern: 'coop.se', status: 'mapping-ready' },
    { chain: 'Willys', hostPattern: 'willys.se', status: 'mapping-ready' }
  ],
  confidenceRule: 'High when the cheapest-now API returns at least two observed chains for the exact product id; limited when chains are missing.',
  guardrails: [
    'No anonymous visitor identity, basket, or retailer account data is stored by the overlay.',
    'Retailer pages must provide a mapped data-groceryview-product-id before any cheaper alternative is shown.',
    'Missing product mappings stay silent instead of estimating alternatives from names alone.'
  ]
};

export function findProduct(slug: string) {
  return axfoodProducts.find((product) => product.slug === slug) ?? pricedProducts.find((product) => product.slug === slug);
}

export function findStore(slug: string) {
  return osmStores.find((store) => store.slug === slug);
}

export function chainPriceRows(product: (typeof axfoodProducts)[number]) {
  return Object.entries(product.chains)
    .map(([chain, price]) => ({ chain, ...price }))
    .filter((row) => typeof row.price === 'number');
}
