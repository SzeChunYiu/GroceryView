import { mkdir, writeFile } from 'node:fs/promises';
import {
  DEFAULT_COOP_PRODUCT_QUERIES,
  DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES,
  DEFAULT_CITY_GROSS_LIVE_PRODUCT_MAX_ROWS_PER_STORE,
  DEFAULT_CITY_GROSS_LIVE_PRODUCT_MAX_STORES,
  DEFAULT_CITY_GROSS_PRODUCT_QUERIES,
  DEFAULT_HEMKOP_LIVE_PRODUCT_MAX_ROWS,
  DEFAULT_HEMKOP_LIVE_WEEKLY_DISCOUNT_MAX_ROWS,
  DEFAULT_HEMKOP_SEARCH_QUERIES,
  DEFAULT_LIDL_LIVE_MAX_STORES,
  DEFAULT_LIDL_LIVE_OFFER_MAX_ROWS,
  DEFAULT_LIDL_OFFER_PATHS,
  DEFAULT_MATHEM_SEARCH_PAGES,
  DEFAULT_MATHEM_SEARCH_QUERIES,
  DEFAULT_MATHEM_MAX_ROWS,
  DEFAULT_MATPRISKOLLEN_REGIONS,
  DEFAULT_MATPRISKOLLEN_STORE_LIMIT,
  DEFAULT_MATPRISKOLLEN_OFFER_LIMIT_PER_STORE,
  DEFAULT_MATPRISKOLLEN_MAX_ROWS,
  DEFAULT_MATSPAR_SEARCH_PAGES,
  DEFAULT_MATSPAR_SEARCH_QUERIES,
  DEFAULT_MATSPAR_MAX_ROWS,
  DEFAULT_OPENFOODFACTS_SWEDEN_CATALOG_MAX_PAGES,
  DEFAULT_ICA_REKLAMBLAD_OFFER_PAGE_URLS,
  DEFAULT_ICA_REKLAMBLAD_MAX_ROWS,
  DEFAULT_WILLYS_SEARCH_QUERIES,
  DEFAULT_WILLYS_LIVE_PRODUCT_MAX_ROWS,
  DEFAULT_WILLYS_LIVE_WEEKLY_DISCOUNT_MAX_ROWS,
  DEFAULT_APOHEM_SOURCE_PATHS,
  DEFAULT_APOTEK_HJARTAT_SEARCH_URLS,
  fetchCityGrossProductsForAllStores,
  fetchCoopProductsForAllStores,
  fetchCoopWeeklyDiscountsForAllStores,
  fetchHemkopProducts,
  fetchHemkopWeeklyDiscountsForAllStores,
  fetchLidlOffersForAllStores,
  fetchMathemProducts,
  fetchMatpriskollenOffers,
  fetchMatsparProducts,
  fetchOpenFoodFactsSwedenCatalog,
  buildOpenFoodFactsSwedenSearchUrl,
  fetchIcaReklambladOffers,
  fetchOkq8FuelPrices,
  fetchPharmacyProducts,
  fetchSevenElevenSeConvenienceProducts,
  fetchSt1FuelPrices,
  fetchWillysProducts,
  fetchWillysWeeklyDiscountsForAllStores
} from '../../packages/ingestion/dist/index.js';

const REPO_ROOT = new URL('../../', import.meta.url);
const INGESTED_DIR = new URL('apps/web/src/lib/ingested/', REPO_ROOT);
const GENERATED_DIR = new URL('apps/web/src/lib/generated/', REPO_ROOT);

const requestedSources = new Set((process.env.GROCERYVIEW_INGEST_SOURCES ?? '')
  .split(',')
  .map((source) => source.trim().toLowerCase())
  .filter(Boolean));
const shouldRun = (source) => requestedSources.size === 0 || requestedSources.has(source);

const CITY_GROSS_QUERIES = DEFAULT_CITY_GROSS_PRODUCT_QUERIES;
const COOP_QUERIES = DEFAULT_COOP_PRODUCT_QUERIES;
const COOP_WEEKLY_QUERIES = DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES;
const WILLYS_QUERIES = DEFAULT_WILLYS_SEARCH_QUERIES;
const HEMKOP_QUERIES = DEFAULT_HEMKOP_SEARCH_QUERIES;
const LIDL_OFFER_PATHS = DEFAULT_LIDL_OFFER_PATHS;
const MATHEM_QUERIES = DEFAULT_MATHEM_SEARCH_QUERIES;
const MATHEM_PAGES = DEFAULT_MATHEM_SEARCH_PAGES;
const MATSPAR_QUERIES = DEFAULT_MATSPAR_SEARCH_QUERIES;
const MATSPAR_PAGES = DEFAULT_MATSPAR_SEARCH_PAGES;
const APOHEM_SOURCE_PATHS = DEFAULT_APOHEM_SOURCE_PATHS;
const APOTEK_HJARTAT_SEARCH_URLS = DEFAULT_APOTEK_HJARTAT_SEARCH_URLS;

const retrievedAt = new Date().toISOString();

await mkdir(INGESTED_DIR, { recursive: true });
await mkdir(GENERATED_DIR, { recursive: true });

const summary = { retrievedAt };
let cityGrossProducts = [];
let willysProducts = [];
let willysWeeklyDiscounts = [];
let hemkopProducts = [];
let hemkopWeeklyDiscounts = [];
let lidlStoreOffers = [];

if (shouldRun('citygross')) {
  cityGrossProducts = await fetchCityGrossProductsForAllStores({
    maxStores: DEFAULT_CITY_GROSS_LIVE_PRODUCT_MAX_STORES,
    queries: CITY_GROSS_QUERIES,
    maxRowsPerStore: DEFAULT_CITY_GROSS_LIVE_PRODUCT_MAX_ROWS_PER_STORE,
    pageSize: 24,
    retrievedAt
  });
  await writeCityGross(cityGrossProducts);
  summary.cityGrossProducts = cityGrossProducts.length;
}

if (shouldRun('coop')) {
  const coopProducts = await fetchCoopProductsForAllStores({
    queries: COOP_QUERIES,
    maxStores: 18,
    maxRowsPerStore: 360,
    retrievedAt
  });
  const coopWeeklyDiscounts = await fetchCoopWeeklyDiscountsForAllStores({
    productQueries: COOP_WEEKLY_QUERIES,
    maxStores: 230,
    maxRows: 6200,
    retrievedAt
  });
  await writeCoop(coopProducts, coopWeeklyDiscounts);
  summary.coopProducts = coopProducts.length;
  summary.coopWeeklyDiscounts = coopWeeklyDiscounts.length;
}

if (shouldRun('willys')) {
  willysProducts = await fetchWillysProducts({
    maxRows: DEFAULT_WILLYS_LIVE_PRODUCT_MAX_ROWS,
    retrievedAt
  });
  willysWeeklyDiscounts = await fetchWillysWeeklyDiscountsForAllStores({
    maxRows: DEFAULT_WILLYS_LIVE_WEEKLY_DISCOUNT_MAX_ROWS,
    pageSize: 100,
    retrievedAt
  });
  await writeWillys(willysProducts, willysWeeklyDiscounts);
  summary.willysProducts = willysProducts.length;
  summary.willysWeeklyDiscounts = willysWeeklyDiscounts.length;
}

if (shouldRun('hemkop')) {
  hemkopProducts = await fetchHemkopProducts({
    maxRows: DEFAULT_HEMKOP_LIVE_PRODUCT_MAX_ROWS,
    pageSize: 100,
    retrievedAt
  });
  hemkopWeeklyDiscounts = await fetchHemkopWeeklyDiscountsForAllStores({
    maxRows: DEFAULT_HEMKOP_LIVE_WEEKLY_DISCOUNT_MAX_ROWS,
    pageSize: 100,
    retrievedAt
  });
  await writeHemkop(hemkopProducts, hemkopWeeklyDiscounts);
  summary.hemkopProducts = hemkopProducts.length;
  summary.hemkopWeeklyDiscounts = hemkopWeeklyDiscounts.length;
}

if (shouldRun('lidl')) {
  lidlStoreOffers = await fetchLidlOffersForAllStores({
    maxStores: DEFAULT_LIDL_LIVE_MAX_STORES,
    offerPaths: LIDL_OFFER_PATHS,
    maxRows: DEFAULT_LIDL_LIVE_OFFER_MAX_ROWS,
    retrievedAt
  });
  await writeLidl(lidlStoreOffers);
  summary.lidlStoreOffers = lidlStoreOffers.length;
}

if (shouldRun('mathem')) {
  const mathemProducts = await fetchMathemProducts({
    queries: MATHEM_QUERIES,
    pages: MATHEM_PAGES,
    maxRows: DEFAULT_MATHEM_MAX_ROWS,
    retrievedAt
  });
  await writeMathem(mathemProducts);
  summary.mathemProducts = mathemProducts.length;
}

if (shouldRun('matspar')) {
  const matsparProducts = await fetchMatsparProducts({
    queries: MATSPAR_QUERIES,
    pages: MATSPAR_PAGES,
    maxRows: DEFAULT_MATSPAR_MAX_ROWS,
    retrievedAt
  });
  await writeMatspar(matsparProducts);
  summary.matsparProducts = matsparProducts.length;
}

if (shouldRun('matpriskollen')) {
  const matpriskollenOffers = await fetchMatpriskollenOffers({
    regions: DEFAULT_MATPRISKOLLEN_REGIONS,
    storeLimit: DEFAULT_MATPRISKOLLEN_STORE_LIMIT,
    offerLimitPerStore: DEFAULT_MATPRISKOLLEN_OFFER_LIMIT_PER_STORE,
    maxRows: DEFAULT_MATPRISKOLLEN_MAX_ROWS,
    retrievedAt
  });
  await writeMatpriskollen(matpriskollenOffers);
  summary.matpriskollenOffers = matpriskollenOffers.length;
}

if (shouldRun('openfoodfacts')) {
  const pageEvents = [];
  const openFoodFactsProducts = await fetchOpenFoodFactsSwedenCatalog({
    maxPages: DEFAULT_OPENFOODFACTS_SWEDEN_CATALOG_MAX_PAGES,
    pageSize: 100,
    skipFailedPages: true,
    retrievedAt,
    onPage: (event) => pageEvents.push(event)
  });
  await writeOpenFoodFacts(openFoodFactsProducts, pageEvents);
  summary.openFoodFactsProducts = openFoodFactsProducts.length;
}

if (shouldRun('ica-reklamblad')) {
  const icaReklambladOffers = await fetchIcaReklambladOffers({
    sourceUrls: DEFAULT_ICA_REKLAMBLAD_OFFER_PAGE_URLS,
    maxRows: DEFAULT_ICA_REKLAMBLAD_MAX_ROWS,
    retrievedAt
  });
  await writeIcaReklamblad(icaReklambladOffers);
  summary.icaReklambladOffers = icaReklambladOffers.length;
}

if (shouldRun('okq8-fuel-prices')) {
  const okq8FuelPrices = (await fetchOkq8FuelPrices({ capturedAt: retrievedAt }))
    .map((row) => ({ ...row, retrievedAt: row.capturedAt }));
  await writeOkq8FuelPrices(okq8FuelPrices);
  summary.okq8FuelPrices = okq8FuelPrices.length;
}

if (shouldRun('st1-fuel-prices')) {
  const st1FuelPrices = (await fetchSt1FuelPrices({ retrievedAt }))
    .map((row) => ({
      ...row,
      sourceUrl: row.provenance.sourceUrl,
      retrievedAt: row.provenance.capturedAt
    }));
  await writeSt1FuelPrices(st1FuelPrices);
  summary.st1FuelPrices = st1FuelPrices.length;
}

if (shouldRun('apohem')) {
  const pharmacyProducts = await fetchPharmacyProducts({
    sourcePaths: APOHEM_SOURCE_PATHS,
    apotekHjartatUrls: APOTEK_HJARTAT_SEARCH_URLS,
    maxRows: 3500,
    retrievedAt
  });
  await writeApohem(pharmacyProducts);
  summary.pharmacyProducts = pharmacyProducts.length;
}

if (shouldRun('seven-eleven-se')) {
  const sevenElevenSeProducts = await fetchSevenElevenSeConvenienceProducts({ retrievedAt });
  await writeSevenElevenSe(sevenElevenSeProducts);
  summary.sevenElevenSeProducts = sevenElevenSeProducts.length;
}

if (['citygross', 'willys', 'hemkop', 'lidl'].some((source) => shouldRun(source))) {
  await writeDbSiteIngestedOverrides([
    buildCompareStoreCapability({
      chainId: 'city_gross',
      productRows: cityGrossProducts,
      pickupRows: cityGrossProducts
    }),
    buildCompareStoreCapability({
      chainId: 'willys',
      productRows: willysProducts,
      couponRows: willysWeeklyDiscounts,
      deliveryRows: willysProducts.filter((row) => row.online === true),
      pickupRows: willysWeeklyDiscounts
    }),
    buildCompareStoreCapability({
      chainId: 'hemkop',
      productRows: hemkopProducts,
      couponRows: hemkopWeeklyDiscounts,
      deliveryRows: hemkopProducts.filter((row) => row.online === true),
      pickupRows: hemkopWeeklyDiscounts
    }),
    buildCompareStoreCapability({
      chainId: 'lidl',
      couponRows: lidlStoreOffers.filter((row) => row.memberOnly === true),
      pickupRows: lidlStoreOffers
    })
  ]);
}

console.log(JSON.stringify(summary, null, 2));

async function writeCityGross(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const storeIds = unique(rows.map((row) => row.storeId));
  await writeGeneratedFile('citygross.ts', [
    '// AUTO-GENERATED from City Gross public store catalog and Loop54 product API.',
    `// sourceUrl: ${sourceUrls[0] ?? 'https://www.citygross.se/api/v1/Loop54/products?Q={query}&skip={skip}&take={take}&siteId={siteId}'}`,
    `// retrievedAt: ${retrievedAt}`,
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

async function writeCoop(products, weeklyDiscounts) {
  const productSourceUrls = unique(products.map((row) => row.sourceUrl));
  const productStoreIds = unique(products.map((row) => row.storeId));
  const weeklySourceUrls = unique(weeklyDiscounts.map((row) => row.sourceUrl));
  const weeklyStoreIds = unique(weeklyDiscounts.map((row) => row.storeId));
  const weeklyValidFroms = unique(weeklyDiscounts.map((row) => row.validFrom).filter(Boolean)).sort();
  const weeklyValidTos = unique(weeklyDiscounts.map((row) => row.validTo).filter(Boolean)).sort();
  const weeklyValidityText = weeklyValidFroms.length || weeklyValidTos.length
    ? `, valid ${weeklyValidFroms[0] ?? 'unknown'} through ${weeklyValidTos.at(-1) ?? 'unknown'}`
    : '';
  await writeGeneratedFile('coop.ts', [
    '// AUTO-GENERATED from Coop public personalization search API.',
    `// sourceUrl: ${productSourceUrls[0] ?? weeklySourceUrls[0] ?? 'https://external.api.coop.se/personalization/search/products?store={storeId}&device=desktop&direct=true&api-version=v1'}`,
    `// retrievedAt: ${retrievedAt}`,
    `// Product source URL pattern: https://external.api.coop.se/personalization/search/products?store={storeId}&device=desktop&direct=true&api-version=v1`,
    `// Product source URLs: ${productSourceUrls.join(' | ')}`,
    `// Product queries: ${COOP_QUERIES.join(', ')}`,
    `// Product retrieved: ${retrievedAt}`,
    `// Product row count: ${products.length} real product rows fetched from coop.se across ${productStoreIds.length} online-price stores.`,
    '//',
    `// Weekly discounts source URLs: ${weeklySourceUrls.join(' | ')}`,
    `// Weekly discounts retrieved: ${retrievedAt}`,
    `// Weekly discounts row count: ${weeklyDiscounts.length} real current flyer discount rows for ${weeklyStoreIds.length} Coop branches${weeklyValidityText}.`,
    '',
    'export type CoopIngestedProduct = {',
    '  code: string;',
    '  ean: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  category: string;',
    '  price: number;',
    '  priceText: string;',
    '  unitPrice: number | null;',
    '  unitPriceText: string;',
    '  unitPriceUnit: string;',
    '  promotionText: string;',
    '  promotionPrice: number | null;',
    '  medMeraRequired: boolean;',
    '  availableOnline: boolean;',
    '  storeId: string;',
    '  storeName: string;',
    '  city: string;',
    '  sourceUrl: string;',
    '  productUrl: string;',
    '  imageUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    'export type CoopIngestedWeeklyDiscount = {',
    '  code: string;',
    '  ean: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  ordinaryPrice: number;',
    '  ordinaryPriceText: string;',
    '  offerPrice: number;',
    '  offerPriceText: string;',
    '  offerUnitPrice: number | null;',
    '  offerUnitPriceText: string;',
    '  offerMechanicText: string;',
    '  promotionId: string;',
    '  medMeraRequired: boolean;',
    '  storeId: string;',
    '  storeName: string;',
    '  region: string;',
    '  validFrom: string;',
    '  validTo: string;',
    '  flyerUrl: string;',
    '  productSearchUrl: string;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const coopSource = ${literal({
      source: 'coop.se public personalization search API',
      retrievedAt,
      rowCount: products.length,
      sourceUrlPattern: 'https://external.api.coop.se/personalization/search/products?store={storeId}&device=desktop&direct=true&api-version=v1',
      queries: COOP_QUERIES,
      storeIds: productStoreIds,
      sourceUrls: productSourceUrls
    })} as const;`,
    '',
    `export const coopWeeklyDiscountSource = ${literal({
      source: 'Coop public store API current flyer plus public personalization product search',
      retrievedAt,
      rowCount: weeklyDiscounts.length,
      storeIds: weeklyStoreIds,
      sourceUrls: weeklySourceUrls,
      validFroms: weeklyValidFroms,
      validTos: weeklyValidTos
    })} as const;`,
    '',
    `export const coopProducts: CoopIngestedProduct[] = ${literal(products)};`,
    '',
    `export const coopWeeklyDiscounts: CoopIngestedWeeklyDiscount[] = ${literal(weeklyDiscounts)};`,
    ''
  ]);
}

async function writeWillys(products, weeklyDiscounts) {
  const productSourceUrls = unique(products.map((row) => row.sourceUrl));
  const weeklySourceUrls = unique(weeklyDiscounts.map((row) => row.sourceUrl));
  const weeklyStoreIds = unique(weeklyDiscounts.map((row) => row.storeId));
  await writeGeneratedFile('willys.ts', [
    '// AUTO-GENERATED from public Willys search JSON and public Axfood campaign JSON.',
    `// sourceUrl: ${productSourceUrls[0] ?? weeklySourceUrls[0] ?? 'https://www.willys.se/search?q={query}'}`,
    `// retrievedAt: ${retrievedAt}`,
    `// Product source URL pattern: https://www.willys.se/search?q={query}`,
    `// Product source URLs: ${productSourceUrls.join('; ')}`,
    `// Product retrieved: ${retrievedAt}`,
    `// Product row count: ${products.length} real product rows fetched from willys.se search.`,
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
      source: 'willys.se public search JSON',
      retrievedAt,
      rowCount: products.length,
      sourceUrlPattern: 'https://www.willys.se/search?q={query}',
      queries: WILLYS_QUERIES,
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
    `// sourceUrl: ${productSourceUrls[0] ?? weeklySourceUrls[0] ?? 'https://www.hemkop.se/search?q={query}&page={page}&size=100'}`,
    `// retrievedAt: ${retrievedAt}`,
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
    `// sourceUrl: ${sourceUrls[0] ?? 'https://www.lidl.se/s/sv-SE/butiker/'}`,
    `// retrievedAt: ${retrievedAt}`,
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

async function writeMathem(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  await writeGeneratedFile('mathem.ts', [
    '// AUTO-GENERATED from public Mathem search page __NEXT_DATA__.',
    `// sourceUrl: ${sourceUrls[0] ?? 'https://www.mathem.se/se/search/products/?q={query}'}`,
    `// retrievedAt: ${retrievedAt}`,
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
      queries: MATHEM_QUERIES,
      pages: MATHEM_PAGES,
      sourceUrls
    })} as const;`,
    '',
    `export const mathemProducts: MathemIngestedProduct[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeMatspar(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  await writeGeneratedFile('matspar.ts', [
    '// AUTO-GENERATED from Matspar public search pages with embedded __PAGEDATA__.',
    `// sourceUrl: ${sourceUrls[0] ?? 'https://www.matspar.se/kategori?q={query}&page={page}'}`,
    `// retrievedAt: ${retrievedAt}`,
    `// Source URL pattern: https://www.matspar.se/kategori?q={query}&page={page}`,
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
      source: 'matspar.se public search page embedded __PAGEDATA__',
      retrievedAt,
      rowCount: rows.length,
      sourceUrlPattern: 'https://www.matspar.se/kategori?q={query}&page={page}',
      queries: MATSPAR_QUERIES,
      pages: MATSPAR_PAGES,
      sourceUrls
    })} as const;`,
    '',
    `export const matsparProducts: MatsparIngestedProduct[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeMatpriskollen(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const stores = unique(rows.map((row) => row.storeKey));
  await writeGeneratedFile('matpriskollen.ts', [
    '// AUTO-GENERATED from Matpriskollen public stores and offers API.',
    `// sourceUrl: ${sourceUrls[0] ?? 'https://matpriskollen.se/api/v1/stores/{storeKey}/offers?lat={lat}&lon={lon}&limit={limit}'}`,
    `// retrievedAt: ${retrievedAt}`,
    ' // Store source URL pattern: https://matpriskollen.se/api/v1/stores?lat={lat}&lon={lon}&limit={limit}'.trim(),
    ' // Offer source URL pattern: https://matpriskollen.se/api/v1/stores/{storeKey}/offers?lat={lat}&lon={lon}&limit={limit}'.trim(),
    `// Offer source URLs: ${sourceUrls.join('; ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real grocery offer rows fetched from matpriskollen.se across ${stores.length} stores.`,
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
      source: 'matpriskollen.se public stores and offers API',
      retrievedAt,
      rowCount: rows.length,
      regions: DEFAULT_MATPRISKOLLEN_REGIONS,
      storeLimit: DEFAULT_MATPRISKOLLEN_STORE_LIMIT,
      offerLimitPerStore: DEFAULT_MATPRISKOLLEN_OFFER_LIMIT_PER_STORE,
      stores,
      sourceUrls
    })} as const;`,
    '',
    `export const matpriskollenOffers: MatpriskollenIngestedOffer[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeOpenFoodFacts(rows, pageEvents) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const pageSummaries = pageEvents
    .filter((event) => !event.skipped)
    .map((event, index, events) => {
      const previousRows = index > 0 ? events[index - 1].rows : 0;
      return {
        page: event.page,
        sourceUrl: buildOpenFoodFactsSwedenSearchUrl(event.page, 100),
        fetchedProductCount: event.products,
        normalizedRowCount: event.rows - previousRows
      };
    });
  const reportedTotalPages = pageEvents.find((event) => Number.isFinite(event.totalPages))?.totalPages ?? null;
  const ingestedRows = rows.map((row) => ({
    barcode: row.code,
    name: row.name,
    brands: row.brands,
    quantity: row.quantity,
    categories: row.categories,
    labels: row.labels,
    allergens: row.allergens ?? [],
    traces: row.traces ?? [],
    additives: row.additives ?? [],
    countries: row.countries ?? [],
    stores: row.stores ?? [],
    origins: row.origins ?? [],
    manufacturingPlaces: row.manufacturingPlaces ?? [],
    packaging: row.packaging ?? [],
    ingredientsText: row.ingredientsText ?? '',
    servingSize: row.servingSize ?? '',
    nutriscoreGrade: row.nutriscoreGrade,
    novaGroup: row.novaGroup ?? null,
    ecoscoreGrade: row.ecoscoreGrade ?? '',
    dataQualityTags: row.dataQualityTags ?? [],
    nutritionPer100g: row.nutritionPer100g,
    imageUrl: row.imageUrl,
    productUrl: row.productUrl,
    sourceUrl: row.sourceUrl,
    retrievedAt: row.retrievedAt,
    retailerMatches: []
  }));

  await writeGeneratedFile('openfoodfacts.ts', [
    '// AUTO-GENERATED from OpenFoodFacts Sweden public product search API metadata.',
    `// sourceUrl: ${sourceUrls[0] ?? buildOpenFoodFactsSwedenSearchUrl(1, 100)}`,
    `// retrievedAt: ${retrievedAt}`,
    ...sourceUrls.map((sourceUrl) => `// Source URL: ${sourceUrl}`),
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real normalized Sweden API product metadata rows from ${pageSummaries.reduce((total, page) => total + page.fetchedProductCount, 0)} fetched products across ${pageSummaries.length} pages.`,
    '// Metadata only; no GroceryView prices, retailer availability, or discounts are inferred from these rows.',
    '',
    'export type OpenFoodFactsNutritionPer100g = {',
    '  energyKj: number | null;',
    '  energyKcal: number | null;',
    '  fat: number | null;',
    '  saturatedFat: number | null;',
    '  carbohydrates: number | null;',
    '  sugars: number | null;',
    '  fiber: number | null;',
    '  proteins: number | null;',
    '  salt: number | null;',
    '  sodium: number | null;',
    '};',
    '',
    'export type OpenFoodFactsRetailerMatch = {',
    "  chain: 'citygross' | 'willys' | 'hemkop' | 'coop' | 'ica';",
    '  productCode: string;',
    '  name: string;',
    '  brand: string;',
    '  packageText: string;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    'export type OpenFoodFactsIngestedProduct = {',
    '  barcode: string;',
    '  name: string;',
    '  brands: string;',
    '  quantity: string;',
    '  categories: string[];',
    '  labels: string[];',
    '  allergens: string[];',
    '  traces: string[];',
    '  additives: string[];',
    '  countries: string[];',
    '  stores: string[];',
    '  origins: string[];',
    '  manufacturingPlaces: string[];',
    '  packaging: string[];',
    '  ingredientsText: string;',
    '  servingSize: string;',
    '  nutriscoreGrade: string;',
    '  novaGroup: number | null;',
    '  ecoscoreGrade: string;',
    '  dataQualityTags: string[];',
    '  nutritionPer100g: OpenFoodFactsNutritionPer100g;',
    '  imageUrl: string;',
    '  productUrl: string;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '  retailerMatches: OpenFoodFactsRetailerMatch[];',
    '};',
    '',
    `export const openFoodFactsSource = ${literal({
      source: 'openfoodfacts.org Sweden public product search API metadata catalog',
      retrievedAt,
      rowCount: rows.length,
      fetchedProductCount: pageSummaries.reduce((total, page) => total + page.fetchedProductCount, 0),
      reportedTotalPages,
      pageSize: 100,
      pages: pageSummaries,
      sourceUrls
    })} as const;`,
    '',
    `export const openFoodFactsProducts: OpenFoodFactsIngestedProduct[] = ${literal(ingestedRows)};`,
    ''
  ]);
}

async function writeApohem(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const chains = unique(rows.map((row) => row.chain)).sort();
  const categories = unique(rows.map((row) => row.category)).sort();
  const matchesByEan = new Map();
  for (const row of rows) {
    const match = matchesByEan.get(row.ean) ?? { ean: row.ean, chains: new Set(), names: new Set() };
    match.chains.add(row.chain);
    match.names.add(row.name);
    matchesByEan.set(row.ean, match);
  }
  const eanMatches = [...matchesByEan.values()]
    .filter((match) => match.chains.size > 1)
    .map((match) => ({
      ean: match.ean,
      chains: [...match.chains].sort(),
      names: [...match.names].sort()
    }));
  await writeGeneratedFile('apohem.ts', [
    '// AUTO-GENERATED from public Apohem SSR pages and Apotek Hjärtat search HTML.',
    `// sourceUrl: ${sourceUrls[0] ?? 'https://www.apohem.se/sok?q={query}'}`,
    `// retrievedAt: ${retrievedAt}`,
    `// Source URLs: ${sourceUrls.join(', ')}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real OTC, supplement, and beauty pharmacy rows; all include EAN and exclude prescription products.`,
    '',
    "export type PharmacyChain = 'apohem' | 'apotek-hjartat';",
    '',
    "export type PharmacyProductCategory = 'otc' | 'supplement' | 'beauty';",
    '',
    'export type ApohemIngestedProduct = {',
    '  chain: PharmacyChain;',
    '  code: string;',
    '  ean: string;',
    '  name: string;',
    '  brand: string;',
    '  category: PharmacyProductCategory;',
    '  price: number;',
    '  priceText: string;',
    '  originalPrice: number | null;',
    '  originalPriceText: string;',
    '  vatPercent: number | null;',
    '  stockStatus: string;',
    '  productUrl: string;',
    '  imageUrl: string;',
    '  isOtc: boolean;',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const apohemSource = ${literal({
      source: 'apohem.se public SSR CURRENT_PAGE + apotekhjartat.se public INITIAL_DATA search HTML',
      retrievedAt,
      rowCount: rows.length,
      sourceUrls,
      chains,
      categories,
      eanMatchCount: eanMatches.length
    })} as const;`,
    '',
    `export const apohemEanMatches = ${literal(eanMatches)} as const;`,
    '',
    `export const apohemProducts: ApohemIngestedProduct[] = ${literal(rows)};`,
    '',
    'export const pharmacyProducts = apohemProducts;',
    ''
  ]);
}

async function writeOkq8FuelPrices(rows) {
  await writeGeneratedFile('okq8-fuel-prices.ts', [
    '// AUTO-GENERATED from OKQ8 public business fuel price page.',
    '// Source URL: https://www.okq8.se/foretag/priser/',
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real operator fuel price rows fetched from okq8.se.`,
    '',
    'export type Okq8FuelPriceIngestedObservation = {',
    "  domain: 'fuel';",
    "  productId: 'fuel-95-e10' | 'fuel-98' | 'fuel-diesel' | 'fuel-hvo100' | 'fuel-e85';",
    "  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';",
    '  gradeLabel: string;',
    "  chainId: 'okq8';",
    "  operatorName: 'OKQ8';",
    "  sourceKind: 'operator_public_price_page';",
    '  sourceUrl: string;',
    '  observedAt: string;',
    '  capturedAt: string;',
    '  effectiveFrom: string;',
    '  pricePerLitre: number;',
    "  currency: 'SEK';",
    "  unit: 'l';",
    '  confidence: number;',
    '  provenance: {',
    "    source: 'okq8_fuel_prices';",
    '    sourceUrl: string;',
    '    parserVersion: string;',
    '    rawSnapshotRef: string;',
    '    originalTitle: string;',
    '    originalPriceText: string;',
    '    originalEffectiveDate: string;',
    '  };',
    '  retrievedAt: string;',
    '};',
    '',
    `export const okq8FuelPriceSource = ${literal({
      source: 'OKQ8 public business fuel price page',
      retrievedAt,
      rowCount: rows.length,
      sourceUrl: 'https://www.okq8.se/foretag/priser/',
      parserVersion: 'okq8-fuel-prices-v1'
    })} as const;`,
    '',
    `export const okq8FuelPriceObservations: Okq8FuelPriceIngestedObservation[] = ${literal(rows)};`,
    ''
  ]);
}

async function writeSt1FuelPrices(rows) {
  await writeGeneratedFile('st1-fuel-prices.ts', [
    '// AUTO-GENERATED from St1 public business fuel list price page.',
    '// Source URL: https://st1.se/foretag/listpris',
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${rows.length} real operator fuel price rows fetched from st1.se.`,
    '',
    'export type St1FuelPriceIngestedObservation = {',
    '  id: string;',
    "  domain: 'fuel';",
    "  grade: '95' | '98' | 'diesel' | 'HVO100' | 'E85';",
    '  label: string;',
    '  pricePerLitre: number;',
    "  currency: 'SEK';",
    '  litreBasis: 1;',
    '  observedAt: string;',
    '  validFrom: string;',
    '  confidence: number;',
    '  source: {',
    '    id: string;',
    "    kind: 'operator';",
    '    name: string;',
    '    operatorName: string;',
    '    sourceUrl: string;',
    "    legalReviewStatus: 'approved';",
    '  };',
    '  provenance: {',
    '    sourceRunId: string;',
    '    sourceUrl: string;',
    '    capturedAt: string;',
    '    parserVersion: string;',
    '    contentDigest: {',
    "      algorithm: 'sha-256';",
    '      value: string;',
    '    };',
    '  };',
    '  sourceUrl: string;',
    '  retrievedAt: string;',
    '};',
    '',
    `export const st1FuelPriceSource = ${literal({
      source: 'St1 public business fuel list price page',
      retrievedAt,
      rowCount: rows.length,
      sourceUrl: 'https://st1.se/foretag/listpris',
      parserVersion: 'st1-fuel-listpris-v1'
    })} as const;`,
    '',
    `export const st1FuelPriceObservations: St1FuelPriceIngestedObservation[] = ${literal(rows)};`,
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

async function writeSevenElevenSe(rows) {
  const sourceUrls = unique(rows.map((row) => row.sourceUrl));
  const pdfUrls = unique(rows.map((row) => row.pdfUrl));
  await writeGeneratedFile('seven-eleven-se.ts', [
    '// AUTO-GENERATED from 7-Eleven Sweden public B2B assortment PDF.',
    `// sourceUrl: ${sourceUrls[0] ?? 'https://7-eleven.se/foretagsbestallningar/'}`,
    `// pdfUrl: ${pdfUrls[0] ?? 'https://storage.googleapis.com/seveneleven-media-bucket-prod/1/2025/06/7E-Sortimentlista-B2B-A4-enkelsidor.pdf'}`,
    `// retrievedAt: ${retrievedAt}`,
    `// rowCount: ${rows.length} real convenience-product rows parsed from the public PDF.`,
    '',
    "export type SevenElevenSeIngestedProduct = {",
    '  productId: string;',
    "  chainId: 'seven_eleven_se';",
    "  chainName: '7-Eleven Sweden';",
    "  category: 'breakfast' | 'bakery' | 'lunch' | 'drink' | 'snack' | 'convenience';",
    '  name: string;',
    '  priceMin: number;',
    '  priceMax: number;',
    '  priceText: string;',
    "  currency: 'SEK';",
    '  depositIncluded: boolean;',
    "  dietaryTags: Array<'lacto_vegetarian' | 'vegetarian' | 'plant_based' | 'vegan'>;",
    '  sourceUrl: string;',
    '  pdfUrl: string;',
    '  retrievedAt: string;',
    '  provenance: {',
    "    source: 'seven_eleven_se_b2b_assortment_pdf';",
    '    parserVersion: string;',
    '    rawSnapshotRef: string;',
    '  };',
    '};',
    '',
    `export const sevenElevenSeSource = ${literal({
      source: 'seven_eleven_se_b2b_assortment_pdf',
      retrievedAt,
      rowCount: rows.length,
      sourceUrl: sourceUrls[0] ?? null,
      sourceUrls,
      pdfUrl: pdfUrls[0] ?? null,
      pdfUrls
    })} as const;`,
    '',
    `export const sevenElevenSeProducts: SevenElevenSeIngestedProduct[] = ${literal(rows)};`,
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
    `// sourceUrl: ${sourceUrls[0] ?? 'https://www.ica.se/erbjudanden/{store}/'}`,
    `// retrievedAt: ${retrievedAt}`,
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
  while (lines.at(-1) === '') lines.pop();
  await writeFile(new URL(fileName, INGESTED_DIR), `${lines.join('\n')}\n`);
}

async function writeDbSiteIngestedOverrides(compareStoreCapabilities) {
  await writeFile(new URL('db-site-ingested-overrides.ts', GENERATED_DIR), `${[
    '// AUTO-GENERATED from live retailer ingestion by scripts/ingestion/generate-live-retailer-ingested.mjs.',
    `// Generated at: ${retrievedAt}`,
    `// Compare store capability row count: ${compareStoreCapabilities.length}`,
    "import type { IcaReklambladIngestedOffer } from '../ingested/ica-reklamblad';",
    "import type { LidlIngestedStoreOffer } from '../ingested/lidl';",
    "import type { MathemIngestedProduct } from '../ingested/mathem';",
    "import type { MatpriskollenIngestedOffer } from '../ingested/matpriskollen';",
    '',
    'export type DbSiteCompareStoreCapability = {',
    '  chainId: string;',
    '  coupon: boolean;',
    '  delivery: boolean;',
    '  pickup: boolean;',
    '  evidenceLabel: string;',
    '  evidenceUpdatedAt: string | null;',
    '};',
    '',
    `export const dbSiteIngestedOverridesGeneratedAt = ${literal(retrievedAt)};`,
    '',
    'export const dbSiteMatpriskollenOffers: MatpriskollenIngestedOffer[] = [];',
    'export const dbSiteLidlStoreOffers: LidlIngestedStoreOffer[] = [];',
    'export const dbSiteIcaReklambladOffers: IcaReklambladIngestedOffer[] = [];',
    'export const dbSiteMathemProducts: MathemIngestedProduct[] = [];',
    `export const dbSiteCompareStoreCapabilities: DbSiteCompareStoreCapability[] = ${literal(compareStoreCapabilities)};`,
    '',
    `export const dbSiteMatpriskollenSource = ${literal({ source: 'postgres.latest_prices/observations Matpriskollen-compatible fallback', retrievedAt: null, rowCount: 0 })} as const;`,
    `export const dbSiteLidlSource = ${literal({ source: 'postgres.latest_prices/observations Lidl-compatible fallback', retrievedAt: null, rowCount: 0 })} as const;`,
    `export const dbSiteIcaReklambladSource = ${literal({ source: 'postgres.latest_prices/observations ICA flyer-compatible fallback', retrievedAt: null, rowCount: 0 })} as const;`,
    `export const dbSiteMathemSource = ${literal({ source: 'postgres.latest_prices/observations Mathem-compatible fallback', retrievedAt: null, rowCount: 0 })} as const;`,
    ''
  ].join('\n')}\n`);
}

function buildCompareStoreCapability({ chainId, productRows = [], couponRows = [], deliveryRows = [], pickupRows = [] }) {
  const evidenceRows = [...productRows, ...couponRows, ...deliveryRows, ...pickupRows];
  const evidenceUpdatedAt = latestRetrievedAt(evidenceRows);
  return {
    chainId,
    coupon: couponRows.length > 0,
    delivery: deliveryRows.length > 0,
    pickup: pickupRows.length > 0,
    evidenceLabel: [
      productRows.length > 0 ? `${productRows.length} product rows` : null,
      couponRows.length > 0 ? `${couponRows.length} coupon/offer rows` : null,
      deliveryRows.length > 0 ? `${deliveryRows.length} online rows` : null,
      pickupRows.length > 0 ? `${pickupRows.length} store rows` : null
    ].filter(Boolean).join(' · ') || 'no live retailer rows',
    evidenceUpdatedAt
  };
}

function latestRetrievedAt(rows) {
  return rows
    .map((row) => row.retrievedAt)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
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
