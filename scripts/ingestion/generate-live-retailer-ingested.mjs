import { mkdir, writeFile } from 'node:fs/promises';
import {
  DEFAULT_CITY_GROSS_PRODUCT_QUERIES,
  DEFAULT_HEMKOP_SEARCH_QUERIES,
  DEFAULT_LIDL_OFFER_PATHS,
  fetchCityGrossProductsForAllStores,
  fetchHemkopProducts,
  fetchHemkopWeeklyDiscountsForAllStores,
  fetchLidlOffersForAllStores,
  fetchWillysProducts,
  fetchWillysWeeklyDiscountsForAllStores
} from '../../packages/ingestion/dist/index.js';

const REPO_ROOT = new URL('../../', import.meta.url);
const INGESTED_DIR = new URL('apps/web/src/lib/ingested/', REPO_ROOT);

const CITY_GROSS_QUERIES = [DEFAULT_CITY_GROSS_PRODUCT_QUERIES[0]];
const HEMKOP_QUERIES = DEFAULT_HEMKOP_SEARCH_QUERIES;
const LIDL_OFFER_PATHS = DEFAULT_LIDL_OFFER_PATHS;

const retrievedAt = new Date().toISOString();

await mkdir(INGESTED_DIR, { recursive: true });

const cityGrossProducts = await fetchCityGrossProductsForAllStores({
  maxStores: 40,
  queries: CITY_GROSS_QUERIES,
  maxRowsPerStore: 180,
  pageSize: 24,
  retrievedAt
});
await writeCityGross(cityGrossProducts);

const willysProducts = await fetchWillysProducts({
  maxRows: 1200,
  retrievedAt
});
const willysWeeklyDiscounts = await fetchWillysWeeklyDiscountsForAllStores({
  maxRows: 50000,
  pageSize: 100,
  retrievedAt
});
await writeWillys(willysProducts, willysWeeklyDiscounts);

const hemkopProducts = await fetchHemkopProducts({
  queries: HEMKOP_QUERIES,
  maxRows: 4200,
  pageSize: 100,
  retrievedAt
});
const hemkopWeeklyDiscounts = await fetchHemkopWeeklyDiscountsForAllStores({
  maxRows: 30000,
  pageSize: 100,
  retrievedAt
});
await writeHemkop(hemkopProducts, hemkopWeeklyDiscounts);

const lidlStoreOffers = await fetchLidlOffersForAllStores({
  maxStores: 40,
  offerPaths: LIDL_OFFER_PATHS,
  maxRows: 150,
  retrievedAt
});
await writeLidl(lidlStoreOffers);

console.log(JSON.stringify({
  retrievedAt,
  cityGrossProducts: cityGrossProducts.length,
  willysProducts: willysProducts.length,
  willysWeeklyDiscounts: willysWeeklyDiscounts.length,
  hemkopProducts: hemkopProducts.length,
  hemkopWeeklyDiscounts: hemkopWeeklyDiscounts.length,
  lidlStoreOffers: lidlStoreOffers.length
}, null, 2));

async function writeCityGross(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const storeIds = unique(rows.map((row) => row.storeId));
  await writeGeneratedFile('citygross.ts', [
    '// AUTO-GENERATED from City Gross public store catalog and Loop54 product API.',
    `// Store source URL: https://www.citygross.se/api/v1/PageData/stores`,
    `// Product source URL pattern: https://www.citygross.se/api/v1/Loop54/products?Q={query}&skip={skip}&take={take}&siteId={siteId}`,
    `// Product source URLs: ${sourceUrls.join('; ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real product rows fetched from citygross.se across ${storeIds.length} stores.`,
    '',
    'export type CityGrossIngestedProduct = {',
    '  code: string;',
    '  gtin: string;',
    '  name: string;',
    '  brand: string;',
    '  category: string;',
    '  packageText: string;',
    '  storeId: string;',
    '  price: number;',
    '  regularPrice: number | null;',
    '  unitPrice: number | null;',
    '  unitPriceUnit: string;',
    '  priceText: string;',
    '  productUrl: string;',
    '  imageUrl: string;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const cityGrossSource = ${literal({
      source: 'citygross.se public store catalog and Loop54 product API',
      retrievedAt,
      rowCount: rows.length,
      storeSourceUrl: 'https://www.citygross.se/api/v1/PageData/stores',
      sourceUrlPattern: 'https://www.citygross.se/api/v1/Loop54/products?Q={query}&skip={skip}&take={take}&siteId={siteId}',
      queries: CITY_GROSS_QUERIES,
      storeIds,
      sourceUrls
    })} as const;`,
    '',
    `export const cityGrossProducts: CityGrossIngestedProduct[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeWillys(products, weeklyDiscounts) {
  const productSourceUrls = unique(products.map((row) => row.sourceUrl));
  const weeklySourceUrls = unique(weeklyDiscounts.map((row) => row.sourceUrl));
  const weeklyStoreIds = unique(weeklyDiscounts.map((row) => row.storeId));
  await writeGeneratedFile('willys.ts', [
    '// AUTO-GENERATED from public Willys category JSON and public Axfood campaign JSON.',
    `// Product category source URL pattern: https://www.willys.se/c/{categoryPath}?page={page}&size=100`,
    `// Product source URLs: ${productSourceUrls.join('; ')}`,
    `// Product retrieved: ${retrievedAt}`,
    `// Product row count: ${products.length} real product rows fetched from willys.se category pages.`,
    `// Weekly discount store catalog source URL: https://www.willys.se/axfood/rest/store`,
    `// Weekly discount source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100`,
    `// Weekly discount source URLs: ${weeklySourceUrls.join('; ')}`,
    `// Weekly discount retrieved: ${retrievedAt}`,
    `// Weekly discount row count: ${weeklyDiscounts.length} real Axfood campaign rows fetched from willys.se across ${weeklyStoreIds.length} store IDs.`,
    '',
    'export type WillysIngestedProduct = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  category: string;',
    '  price: number;',
    '  priceText: string;',
    '  unitPriceText: string;',
    '  unitPriceUnit: string;',
    '  imageUrl: string;',
    '  labels: string[];',
    '  online: boolean;',
    '  outOfStock: boolean;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    'export type WillysIngestedWeeklyDiscount = {',
    '  code: string;',
    '  productCode: string;',
    '  name: string;',
    '  brand: string;',
    '  storeId: string;',
    '  storeName: string;',
    '  city: string;',
    '  campaignType: string;',
    '  promotionType: string;',
    '  price: number;',
    '  priceText: string;',
    '  comparePriceText: string;',
    '  regularPriceText: string;',
    '  savePriceText: string;',
    '  packageText: string;',
    '  conditionText: string;',
    '  redeemLimitText: string;',
    '  startDate: string;',
    '  endDate: string;',
    '  validUntil: string;',
    '  category: string;',
    '  imageUrl: string;',
    '  labels: string[];',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const willysSource = ${literal({
      source: 'willys.se public category JSON',
      retrievedAt,
      rowCount: products.length,
      sourceUrlPattern: 'https://www.willys.se/c/{categoryPath}?page={page}&size=100',
      sourceUrls: productSourceUrls
    })} as const;`,
    '',
    `export const willysProducts: WillysIngestedProduct[] = ${literal(products)};`,
    '',
    `export const willysWeeklyDiscountSource = ${literal({
      source: 'willys.se public Axfood campaign JSON',
      retrievedAt,
      rowCount: weeklyDiscounts.length,
      storeSourceUrl: 'https://www.willys.se/axfood/rest/store',
      sourceUrlPattern: 'https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100',
      storeIds: weeklyStoreIds,
      sourceUrls: weeklySourceUrls
    })} as const;`,
    '',
    `export const willysWeeklyDiscounts: WillysIngestedWeeklyDiscount[] = ${literal(weeklyDiscounts)};`,
    ''
  ]);
}

async function writeHemkop(products, weeklyDiscounts) {
  const productSourceUrls = unique(products.map((row) => row.sourceUrl));
  const weeklySourceUrls = unique(weeklyDiscounts.map((row) => row.sourceUrl));
  const weeklyStoreIds = unique(weeklyDiscounts.map((row) => row.storeId));
  await writeGeneratedFile('hemkop.ts', [
    '// AUTO-GENERATED from public Hemkop search JSON and public Axfood campaign JSON.',
    `// Product source URL pattern: https://www.hemkop.se/search?q={query}&page={page}&size=100`,
    `// Product source URLs: ${productSourceUrls.join('; ')}`,
    `// Product retrieved: ${retrievedAt}`,
    `// Product row count: ${products.length} real product rows fetched from hemkop.se search.`,
    `// Weekly discount store catalog source URL: https://www.hemkop.se/axfood/rest/store`,
    `// Weekly discount source URL pattern: https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100`,
    `// Weekly discount source URLs: ${weeklySourceUrls.join('; ')}`,
    `// Weekly discount retrieved: ${retrievedAt}`,
    `// Weekly discount row count: ${weeklyDiscounts.length} real Axfood campaign rows fetched from hemkop.se across ${weeklyStoreIds.length} store IDs.`,
    '',
    'export type HemkopIngestedProduct = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  category: string;',
    '  price: number;',
    '  priceText: string;',
    '  unitPriceText: string;',
    '  unitPriceUnit: string;',
    '  imageUrl: string;',
    '  labels: string[];',
    '  online: boolean;',
    '  outOfStock: boolean;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    'export type HemkopIngestedWeeklyDiscount = {',
    '  code: string;',
    '  productCode: string;',
    '  name: string;',
    '  brand: string;',
    '  storeId: string;',
    '  storeName: string;',
    '  city: string;',
    '  campaignType: string;',
    '  promotionType: string;',
    '  price: number;',
    '  priceText: string;',
    '  comparePriceText: string;',
    '  regularPriceText: string;',
    '  savePriceText: string;',
    '  packageText: string;',
    '  conditionText: string;',
    '  redeemLimitText: string;',
    '  startDate: string;',
    '  endDate: string;',
    '  validUntil: string;',
    '  category: string;',
    '  imageUrl: string;',
    '  labels: string[];',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const hemkopSource = ${literal({
      source: 'hemkop.se public search JSON',
      retrievedAt,
      rowCount: products.length,
      sourceUrlPattern: 'https://www.hemkop.se/search?q={query}&page={page}&size=100',
      queries: HEMKOP_QUERIES,
      sourceUrls: productSourceUrls
    })} as const;`,
    '',
    `export const hemkopProducts: HemkopIngestedProduct[] = ${literal(products)};`,
    '',
    `export const hemkopWeeklyDiscountSource = ${literal({
      source: 'hemkop.se public Axfood campaign JSON',
      retrievedAt,
      rowCount: weeklyDiscounts.length,
      storeSourceUrl: 'https://www.hemkop.se/axfood/rest/store',
      sourceUrlPattern: 'https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100',
      storeIds: weeklyStoreIds,
      sourceUrls: weeklySourceUrls
    })} as const;`,
    '',
    `export const hemkopWeeklyDiscounts: HemkopIngestedWeeklyDiscount[] = ${literal(weeklyDiscounts)};`,
    ''
  ]);
}

async function writeLidl(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const storeIds = unique(rows.map((row) => row.storeId));
  await writeGeneratedFile('lidl.ts', [
    '// AUTO-GENERATED from Lidl public store pages and public offer pages.',
    `// Store source URL: https://www.lidl.se/s/sv-SE/butiker/`,
    `// Offer source URLs: ${sourceUrls.join('; ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real store-offer rows fetched from lidl.se across ${storeIds.length} stores.`,
    '',
    'export type LidlIngestedStoreOffer = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  category: string;',
    '  price: number;',
    '  regularPrice: number | null;',
    '  priceText: string;',
    '  unitPriceText: string;',
    '  promotionText: string;',
    '  memberOnly: boolean;',
    '  regions: string[];',
    '  validFrom: string;',
    '  validTo: string;',
    '  productUrl: string;',
    '  imageUrl: string;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '  storeId: string;',
    '  storeName: string;',
    '  city: string;',
    '};',
    '',
    `export const lidlSource = ${literal({
      source: 'lidl.se public store pages and public offer pages',
      retrievedAt,
      rowCount: rows.length,
      storeSourceUrl: 'https://www.lidl.se/s/sv-SE/butiker/',
      offerPaths: LIDL_OFFER_PATHS,
      sourceUrls,
      storeIds
    })} as const;`,
    '',
    `export const lidlStoreOffers: LidlIngestedStoreOffer[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeOverpass(rows, query) {
  await writeGeneratedFile('overpass.ts', [
    '// AUTO-GENERATED from Overpass API for OpenStreetMap grocery stores in Stockholms län.',
    '// Source URL: https://overpass-api.de/api/interpreter',
    `// Query: ${oneLine(query)}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real OSM rows fetched from overpass-api.de.`,
    '// Source data: (C) OpenStreetMap contributors, ODbL.',
    '',
    'export type OverpassIngestedStore = {',
    "  osmType: 'node' | 'way' | 'relation';",
    '  osmId: number;',
    '  name: string;',
    '  brand: string;',
    '  shop: string;',
    '  latitude: number;',
    '  longitude: number;',
    '  street: string;',
    '  houseNumber: string;',
    '  postcode: string;',
    '  city: string;',
    '  openingHours: string;',
    '  website: string;',
    '  phone: string;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const overpassSource = ${literal({
      source: 'overpass-api.de for OSM',
      retrievedAt,
      rowCount: rows.length,
      sourceUrl: 'https://overpass-api.de/api/interpreter',
      query,
      license: 'ODbL, (C) OpenStreetMap contributors'
    })} as const;`,
    '',
    `export const overpassStores: OverpassIngestedStore[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeIcaReklamblad(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const flyerUrls = unique(rows.map((row) => row.flyerUrl).filter(Boolean));
  const flyerPdfUrls = unique(rows.map((row) => row.flyerPdfUrl).filter(Boolean));
  const stores = unique(rows.map((row) => row.storeName).filter(Boolean));
  await writeGeneratedFile('ica-reklamblad.ts', [
    '// AUTO-GENERATED from ICA public weekly offers with e-magin flyer provenance.',
    `// Source URLs: ${sourceUrls.join(', ')}`,
    `// Flyer URLs: ${flyerUrls.join(', ')}`,
    `// Flyer PDF API URLs: ${flyerPdfUrls.join(', ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real weekly offer rows fetched from ica.se.`,
    '',
    'export type IcaReklambladIngestedOffer = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  category: string;',
    '  priceText: string;',
    '  comparisonPrice: string;',
    '  regularPriceText: string;',
    '  validTo: string;',
    '  storeName: string;',
    '  storeId: string;',
    '  availableInStore: boolean;',
    '  availableOnline: boolean;',
    '  eans: string[];',
    '  sourceUrl: string;',
    '  flyerUrl: string;',
    '  flyerPdfUrl: string;',
    '  imageUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const icaReklambladSource = ${literal({
      source: 'ica.se public weekly offers with e-magin reklamblad links',
      retrievedAt,
      rowCount: rows.length,
      stores,
      sourceUrls,
      flyerUrls,
      flyerPdfUrls
    })} as const;`,
    '',
    `export const icaReklambladOffers: IcaReklambladIngestedOffer[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeGeneratedFile(fileName, lines) {
  await writeFile(new URL(fileName, INGESTED_DIR), `${lines.join('\n')}\n`);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function literal(value) {
  return JSON.stringify(value, null, 2);
}

function oneLine(value) {
  return value.replace(/\s+/g, ' ').trim();
}
