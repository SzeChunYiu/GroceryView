import { createHash } from 'crypto';
import { openFoodFactsProducts } from './ingested/openfoodfacts';
import {
  adaptiveProductCards,
  commodityComparisonCaveat,
  commodityComparisonReports,
  compareOverlayChart,
  featuredStores
} from './verified-data';

export const publicApiVersion = '2026-05-25';
export const publicApiRateLimit = {
  limit: 60,
  window: '60 seconds',
  policy: '60 requests per minute per API key while the public beta is static-file backed.'
} as const;

export const publicApiDisclaimers = [
  'Prices, store availability, labels, allergens, and nutrition fields are informational and can change without notice.',
  'Nutrition and allergen data is not medical advice; always verify the package label before buying or consuming.',
  'Responses expose only observed GroceryView/OpenPrices/OpenFoodFacts/OpenStreetMap source rows; missing fields are null or omitted rather than inferred.'
] as const;

const supportedResources = ['products', 'current-prices', 'price-history', 'nutrition', 'allergens-labels', 'stores', 'comparisons'] as const;
export type PublicApiResource = typeof supportedResources[number];

export function isPublicApiResource(resource: string): resource is PublicApiResource {
  return supportedResources.includes(resource as PublicApiResource);
}

export function publicApiCatalog() {
  return supportedResources.map((resource) => ({
    resource,
    href: `/api/public/v1?resource=${resource}`
  }));
}

export function clampPublicApiLimit(value: string | null) {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(100, Math.max(1, Math.floor(parsed)));
}

export function issuePublicApiKey(contact: string, purpose: string) {
  const normalizedContact = contact.trim().toLowerCase();
  const normalizedPurpose = purpose.trim().toLowerCase();
  const digest = createHash('sha256')
    .update(`${normalizedContact}\n${normalizedPurpose}\n${publicApiVersion}`)
    .digest('hex')
    .slice(0, 24);

  return `gv_public_${digest}`;
}

export function isAcceptedPublicApiKey(apiKey: string | null) {
  return apiKey === 'gv_public_demo' || /^gv_public_[a-f0-9]{24}$/.test(apiKey ?? '');
}

function productRows(limit: number) {
  return adaptiveProductCards.slice(0, limit).map((card) => ({
    slug: card.slug,
    name: card.name,
    brand: card.brand,
    productKind: card.productKind,
    packageLabel: card.packageLabel,
    imageUrl: card.imageUrl,
    confidence: {
      level: card.confidenceLevel,
      label: card.confidenceLabel,
      sourceCount: card.confidenceDrilldown.sourceCount
    },
    source: card.sourceLabel
  }));
}

function currentPriceRows(limit: number) {
  return adaptiveProductCards.slice(0, limit).map((card) => ({
    productSlug: card.slug,
    name: card.name,
    totalPrice: card.totalSortPrice,
    totalPriceLabel: card.totalPriceLabel,
    unitPrice: card.unitSortPrice,
    unitPriceLabel: card.unitPriceLabel,
    packageLabel: card.packageLabel,
    availability: card.isAvailable ? 'available' : 'out_of_stock',
    source: card.sourceLabel,
    confidenceLevel: card.confidenceLevel
  }));
}

function priceHistoryRows(limit: number) {
  return adaptiveProductCards
    .filter((card) => card.sparklinePoints.length > 0)
    .slice(0, limit)
    .map((card) => ({
      productSlug: card.slug,
      name: card.name,
      windowDays: card.sparklineWindowDays,
      points: card.sparklinePoints,
      source: card.sparklineLabel
    }));
}

function nutritionRows(limit: number) {
  return openFoodFactsProducts.slice(0, limit).map((product) => ({
    barcode: product.barcode,
    name: product.name,
    brand: product.brands,
    quantity: product.quantity,
    nutriscoreGrade: product.nutriscoreGrade,
    novaGroup: product.novaGroup,
    nutritionPer100g: product.nutritionPer100g,
    dataQualityTags: product.dataQualityTags,
    sourceUrl: product.sourceUrl,
    retrievedAt: product.retrievedAt
  }));
}

function allergenLabelRows(limit: number) {
  return openFoodFactsProducts.slice(0, limit).map((product) => ({
    barcode: product.barcode,
    name: product.name,
    brand: product.brands,
    labels: product.labels,
    allergens: product.allergens,
    traces: product.traces,
    additives: product.additives,
    sourceUrl: product.sourceUrl,
    retrievedAt: product.retrievedAt
  }));
}

function storeRows(limit: number) {
  return featuredStores.slice(0, limit).map((store) => ({
    slug: store.slug,
    name: store.name,
    brand: store.brand,
    format: store.format,
    shop: store.shop,
    address: store.address,
    city: store.city,
    district: store.district,
    lat: store.lat,
    lng: store.lng,
    source: store.source,
    retrievedDate: store.retrievedDate
  }));
}

function comparisonRows(limit: number) {
  return commodityComparisonReports.slice(0, limit).map((report) => ({
    commodityId: report.commodityId,
    commodityName: report.commodityName,
    comparableUnit: report.comparableUnit,
    coverage: report.coverage,
    cheapestChain: report.cheapestChain,
    caveat: commodityComparisonCaveat
  }));
}

export function publicApiRows(resource: PublicApiResource, limit: number) {
  if (resource === 'products') return productRows(limit);
  if (resource === 'current-prices') return currentPriceRows(limit);
  if (resource === 'price-history') return priceHistoryRows(limit);
  if (resource === 'nutrition') return nutritionRows(limit);
  if (resource === 'allergens-labels') return allergenLabelRows(limit);
  if (resource === 'stores') return storeRows(limit);
  return comparisonRows(limit);
}

export function publicApiSmokeExamples() {
  return {
    issueKey: {
      method: 'POST',
      path: '/api/public/keys',
      body: { contact: 'data@example.org', purpose: 'local smoke test', acceptedTerms: true }
    },
    readProducts: {
      method: 'GET',
      path: '/api/public/v1?resource=products&limit=2',
      header: 'x-groceryview-api-key: gv_public_demo'
    },
    overlaySource: {
      resource: 'price-history',
      products: compareOverlayChart.overlayProducts.length,
      source: compareOverlayChart.subtitle
    }
  };
}
