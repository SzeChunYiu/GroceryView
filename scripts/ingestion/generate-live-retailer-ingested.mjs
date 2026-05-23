import { mkdir, writeFile } from 'node:fs/promises';
import {
  buildSwedishCountyGroceryOverpassQuery,
  fetchCityGrossProductsForAllStores,
  fetchHemkopProducts,
  fetchHemkopWeeklyDiscountsForAllStores,
  fetchIcaReklambladOffers,
  fetchLidlOffersForAllStores,
  fetchMatpriskollenOffers,
  fetchMathemProducts,
  fetchMatsparProducts,
  fetchOverpassGroceryStores,
  fetchWillysProducts,
  fetchWillysWeeklyDiscountsForAllStores
} from '../../packages/ingestion/dist/index.js';

const REPO_ROOT = new URL('../../', import.meta.url);
const INGESTED_DIR = new URL('apps/web/src/lib/ingested/', REPO_ROOT);

const CITY_GROSS_QUERIES = ['kaffe'];
const CITY_GROSS_MAX_ROWS_PER_STORE = 100;
const WILLYS_PRODUCT_MAX_ROWS = 900;
const WILLYS_WEEKLY_DISCOUNT_MAX_STORES = 210;
const WILLYS_WEEKLY_DISCOUNT_MAX_ROWS = 42000;
const MATPRISKOLLEN_STORE_LIMIT = 90;
const MATPRISKOLLEN_MAX_ROWS = 1600;
const ICA_REKLAMBLAD_SOURCE_URLS = [
  'https://www.ica.se/erbjudanden/ica-focus-1004247/',
  'https://www.ica.se/erbjudanden/ica-kvantum-kista-1004587/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-solna-1003380/',
  'https://www.ica.se/erbjudanden/ica-kvantum-kungsholmen-1004599/',
  'https://www.ica.se/erbjudanden/ica-supermarket-faltoversten-1004228/',
  'https://www.ica.se/erbjudanden/ica-kvantum-sodermalm-1004222/',
  'https://www.ica.se/erbjudanden/maxi-ica-stormarknad-bromma-1015001/'
];
const LIDL_OFFER_PATHS = [
  '/c/veckans-frukt-groent/a10094676',
  '/c/mandag-soendag/a10094677',
  '/c/torsdag-soendag/a10094678',
  '/c/fira-matriket-tre-ar-med-oss/a10094679',
  '/c/xxl/a10094680',
  '/c/bjud-pa-spaennande-smaker/a10094681',
  '/c/lidl-plus-erbjudanden/a10094682',
  '/c/superklipp-fran-torsdag/a10094683',
  '/c/veckans-frukt-groent/a10094782',
  '/c/mandag-soendag/a10094783',
  '/c/torsdag-soendag/a10094784',
  '/c/med-smak-av-alperna/a10094785',
  '/c/superklipp-fran-torsdag/a10094787',
  '/c/lidl-plus-erbjudanden/a10094788',
  '/c/veckans-blommor/a10094398',
  '/c/veckans-blommor/a10094884'
];

const retrievedAt = new Date().toISOString();
const requestedSources = new Set((process.env.GROCERYVIEW_LIVE_SOURCES ?? 'citygross,lidl,overpass,ica-reklamblad')
  .split(',')
  .map((source) => source.trim())
  .filter(Boolean));

await mkdir(INGESTED_DIR, { recursive: true });

const summary = { retrievedAt };

if (shouldRun('citygross')) {
  const cityGrossProducts = await fetchCityGrossProductsForAllStores({
    maxStores: 40,
    queries: CITY_GROSS_QUERIES,
    maxRowsPerStore: CITY_GROSS_MAX_ROWS_PER_STORE,
    pageSize: CITY_GROSS_MAX_ROWS_PER_STORE,
    retrievedAt
  });
  await writeCityGross(cityGrossProducts);
  summary.cityGrossProducts = cityGrossProducts.length;
}

if (shouldRun('hemkop')) {
  const [hemkopProducts, hemkopWeeklyDiscounts] = await Promise.all([
    fetchHemkopProducts({
      maxRows: 3200,
      pageSize: 100,
      retrievedAt
    }),
    fetchHemkopWeeklyDiscountsForAllStores({
      maxStores: 180,
      maxRows: 54000,
      pageSize: 100,
      retrievedAt
    })
  ]);
  await writeHemkop(hemkopProducts, hemkopWeeklyDiscounts);
  summary.hemkopProducts = hemkopProducts.length;
  summary.hemkopWeeklyDiscounts = hemkopWeeklyDiscounts.length;
}

if (shouldRun('lidl')) {
  const lidlStoreOffers = await fetchLidlOffersForAllStores({
    maxStores: 30,
    offerPaths: LIDL_OFFER_PATHS,
    maxRows: 320,
    retrievedAt
  });
  await writeLidl(lidlStoreOffers);
  summary.lidlStoreOffers = lidlStoreOffers.length;
}

if (shouldRun('mathem')) {
  const mathemProducts = await fetchMathemProducts({
    maxRows: 4600,
    retrievedAt
  });
  await writeMathem(mathemProducts);
  summary.mathemProducts = mathemProducts.length;
}

if (shouldRun('matpriskollen')) {
  const matpriskollenOffers = await fetchMatpriskollenOffers({
    storeLimit: MATPRISKOLLEN_STORE_LIMIT,
    maxRows: MATPRISKOLLEN_MAX_ROWS,
    retrievedAt
  });
  await writeMatpriskollen(matpriskollenOffers);
  summary.matpriskollenOffers = matpriskollenOffers.length;
}

if (shouldRun('matspar')) {
  const matsparProducts = await fetchMatsparProducts({
    maxRows: 1800,
    retrievedAt
  });
  await writeMatspar(matsparProducts);
  summary.matsparProducts = matsparProducts.length;
}

if (shouldRun('willys')) {
  const [willysProducts, willysWeeklyDiscounts] = await Promise.all([
    fetchWillysProducts({
      maxRows: WILLYS_PRODUCT_MAX_ROWS,
      retrievedAt
    }),
    fetchWillysWeeklyDiscountsForAllStores({
      maxStores: WILLYS_WEEKLY_DISCOUNT_MAX_STORES,
      maxRows: WILLYS_WEEKLY_DISCOUNT_MAX_ROWS,
      pageSize: 100,
      retrievedAt
    })
  ]);
  await writeWillys(willysProducts, willysWeeklyDiscounts);
  summary.willysProducts = willysProducts.length;
  summary.willysWeeklyDiscounts = willysWeeklyDiscounts.length;
}

if (shouldRun('overpass')) {
  const overpassQuery = buildSwedishCountyGroceryOverpassQuery('SE-AB');
  const overpassStores = await fetchOverpassGroceryStores({
    query: overpassQuery,
    retrievedAt
  });
  await writeOverpass(overpassStores, overpassQuery);
  summary.overpassStores = overpassStores.length;
}

if (shouldRun('ica-reklamblad')) {
  const icaReklambladOffers = await fetchIcaReklambladOffers({
    sourceUrls: ICA_REKLAMBLAD_SOURCE_URLS,
    maxRows: 1000,
    retrievedAt
  });
  await writeIcaReklamblad(icaReklambladOffers);
  summary.icaReklambladOffers = icaReklambladOffers.length;
}

console.log(JSON.stringify(summary, null, 2));

function shouldRun(source) {
  return requestedSources.has(source) || requestedSources.has('all');
}

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

async function writeHemkop(productRows, weeklyDiscountRows) {
  const productSourceUrls = unique(productRows.map((row) => row.sourceUrl));
  const weeklyDiscountSourceUrls = unique(weeklyDiscountRows.map((row) => row.sourceUrl));
  const weeklyDiscountStoreIds = unique(weeklyDiscountRows.map((row) => row.storeId));
  await writeGeneratedFile('hemkop.ts', [
    '// AUTO-GENERATED from public Hemkop category/search JSON and Axfood campaign JSON.',
    `// Product source URL pattern: https://www.hemkop.se/c/{categoryPath}?page={page}&size=100 or https://www.hemkop.se/search?q={query}&page={page}&size=100`,
    `// Product source URLs: ${productSourceUrls.join('; ')}`,
    `// Product retrieved: ${retrievedAt}`,
    `// Product row count: ${productRows.length} real product rows fetched from hemkop.se search.`,
    `// Weekly discount store catalog source URL: https://www.hemkop.se/axfood/rest/store`,
    `// Weekly discount source URL pattern: https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100`,
    `// Weekly discount source URLs: ${weeklyDiscountSourceUrls.join('; ')}`,
    `// Weekly discount retrieved: ${retrievedAt}`,
    `// Weekly discount row count: ${weeklyDiscountRows.length} real Axfood campaign rows in this file for ${weeklyDiscountStoreIds.length} store IDs with campaign rows.`,
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
      source: 'hemkop.se public category/search JSON',
      retrievedAt,
      rowCount: productRows.length,
      sourceUrlPattern: 'https://www.hemkop.se/c/{categoryPath}?page={page}&size=100 or https://www.hemkop.se/search?q={query}&page={page}&size=100',
      sourceUrls: productSourceUrls
    })} as const;`,
    '',
    `export const hemkopProducts: HemkopIngestedProduct[] = ${literal(productRows)};`,
    '',
    `export const hemkopWeeklyDiscountSource = ${literal({
      source: 'hemkop.se public Axfood campaign JSON',
      retrievedAt,
      rowCount: weeklyDiscountRows.length,
      storeSourceUrl: 'https://www.hemkop.se/axfood/rest/store',
      sourceUrlPattern: 'https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100',
      storeIds: weeklyDiscountStoreIds,
      sourceUrls: weeklyDiscountSourceUrls
    })} as const;`,
    '',
    `export const hemkopWeeklyDiscounts: HemkopIngestedWeeklyDiscount[] = ${literal(weeklyDiscountRows)};`,
    ''
  ]);
}

async function writeWillys(productRows, weeklyDiscountRows) {
  const productSourceUrls = unique(productRows.map((row) => row.sourceUrl));
  const weeklyDiscountSourceUrls = unique(weeklyDiscountRows.map((row) => row.sourceUrl));
  const weeklyDiscountStoreIds = unique(weeklyDiscountRows.map((row) => row.storeId));
  await writeGeneratedFile('willys.ts', [
    '// AUTO-GENERATED from public Willys search JSON and Axfood campaign JSON.',
    `// Product source URL pattern: https://www.willys.se/search?q={query}`,
    `// Product source URLs: ${productSourceUrls.join('; ')}`,
    `// Product retrieved: ${retrievedAt}`,
    `// Product row count: ${productRows.length} real product rows fetched from handla.willys.se search.`,
    `// Weekly discount store catalog source URL: https://www.willys.se/axfood/rest/store`,
    `// Weekly discount source URL pattern: https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100`,
    `// Weekly discount source URLs: ${weeklyDiscountSourceUrls.join('; ')}`,
    `// Weekly discount retrieved: ${retrievedAt}`,
    `// Weekly discount row count: ${weeklyDiscountRows.length} real Axfood campaign rows in this file for ${weeklyDiscountStoreIds.length} store IDs with campaign rows.`,
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
      source: 'handla.willys.se public search JSON',
      retrievedAt,
      rowCount: productRows.length,
      maxRows: WILLYS_PRODUCT_MAX_ROWS,
      sourceUrlPattern: 'https://www.willys.se/search?q={query}',
      sourceUrls: productSourceUrls
    })} as const;`,
    '',
    `export const willysProducts: WillysIngestedProduct[] = ${literal(productRows)};`,
    '',
    `export const willysWeeklyDiscountSource = ${literal({
      source: 'willys.se public Axfood campaign JSON',
      retrievedAt,
      rowCount: weeklyDiscountRows.length,
      maxStores: WILLYS_WEEKLY_DISCOUNT_MAX_STORES,
      maxRows: WILLYS_WEEKLY_DISCOUNT_MAX_ROWS,
      storeSourceUrl: 'https://www.willys.se/axfood/rest/store',
      sourceUrlPattern: 'https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100',
      storeIds: weeklyDiscountStoreIds,
      sourceUrls: weeklyDiscountSourceUrls
    })} as const;`,
    '',
    `export const willysWeeklyDiscounts: WillysIngestedWeeklyDiscount[] = ${literal(weeklyDiscountRows)};`,
    ''
  ]);
}

async function writeMathem(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  await writeGeneratedFile('mathem.ts', [
    '// AUTO-GENERATED from public Mathem search page __NEXT_DATA__.',
    `// Source URL pattern: https://www.mathem.se/se/search/products/?q={query}`,
    `// Source URLs: ${sourceUrls.join('; ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real product rows fetched from mathem.se search.`,
    '',
    'export type MathemIngestedProduct = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  price: number;',
    '  priceText: string;',
    '  unitPrice: number | null;',
    '  unitPriceText: string;',
    '  unitPriceUnit: string;',
    '  imageUrl: string;',
    '  productUrl: string;',
    '  available: boolean;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const mathemSource = ${literal({
      source: 'mathem.se public search page __NEXT_DATA__',
      retrievedAt,
      rowCount: rows.length,
      sourceUrlPattern: 'https://www.mathem.se/se/search/products/?q={query}',
      sourceUrls
    })} as const;`,
    '',
    `export const mathemProducts: MathemIngestedProduct[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeMatpriskollen(rows) {
  const storesSourceUrls = unique(rows.map((row) => {
    const url = new URL('/api/v1/stores', 'https://matpriskollen.se');
    const source = new URL(row.sourceUrl);
    url.searchParams.set('lat', source.searchParams.get('lat') ?? '');
    url.searchParams.set('lon', source.searchParams.get('lon') ?? '');
    url.searchParams.set('limit', String(MATPRISKOLLEN_STORE_LIMIT));
    return url.toString();
  }));
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const storeKeys = unique(rows.map((row) => row.storeKey));
  await writeGeneratedFile('matpriskollen.ts', [
    '// AUTO-GENERATED from Matpriskollen public store/offers JSON API.',
    `// Stores source URLs: ${storesSourceUrls.join('; ')}`,
    `// Offer source URL pattern: https://matpriskollen.se/api/v1/stores/{storeKey}/offers?lat={lat}&lon={lon}&limit=200`,
    `// Offer source URLs: ${sourceUrls.join('; ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real grocery offer rows fetched from matpriskollen.se across ${storeKeys.length} stores.`,
    '',
    'export type MatpriskollenIngestedOffer = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  store: string;',
    '  storeKey: string;',
    '  storeId: string;',
    '  category: string;',
    '  priceText: string;',
    '  comparePriceText: string;',
    '  regularPriceText: string;',
    '  packageText: string;',
    '  condition: string;',
    '  origin: string;',
    '  requiresMembershipCard: boolean;',
    '  requiresCoupon: boolean;',
    '  validFrom: string;',
    '  validTo: string;',
    '  sourceUrl: string;',
    '  productUrl: string;',
    '  imageUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const matpriskollenSource = ${literal({
      source: 'matpriskollen.se public store/offers JSON API',
      retrievedAt,
      rowCount: rows.length,
      storeLimit: MATPRISKOLLEN_STORE_LIMIT,
      maxRows: MATPRISKOLLEN_MAX_ROWS,
      storesSourceUrls,
      sourceUrlPattern: 'https://matpriskollen.se/api/v1/stores/{storeKey}/offers?lat={lat}&lon={lon}&limit=200',
      storeKeys,
      sourceUrls
    })} as const;`,
    '',
    `export const matpriskollenOffers: MatpriskollenIngestedOffer[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeMatspar(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  await writeGeneratedFile('matspar.ts', [
    '// AUTO-GENERATED from public Matspar search page __PAGEDATA__.',
    `// Source URL pattern: https://www.matspar.se/kategori?q={query}`,
    `// Source URLs: ${sourceUrls.join('; ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real product rows fetched from matspar.se.`,
    '',
    'export type MatsparIngestedProduct = {',
    '  code: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  countryFrom: string;',
    '  price: number;',
    '  priceText: string;',
    '  medianPrice: number | null;',
    '  warehousePriceCount: number;',
    '  sourceUrl: string;',
    '  productUrl: string;',
    '  imageHash: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const matsparSource = ${literal({
      source: 'matspar.se public search page __PAGEDATA__',
      retrievedAt,
      rowCount: rows.length,
      sourceUrlPattern: 'https://www.matspar.se/kategori?q={query}',
      sourceUrls
    })} as const;`,
    '',
    `export const matsparProducts: MatsparIngestedProduct[] = ${literal(rows)};`,
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
  const outputLines = [...lines];
  while (outputLines.at(-1) === '') {
    outputLines.pop();
  }
  await writeFile(new URL(fileName, INGESTED_DIR), `${outputLines.join('\n')}\n`);
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
