import { mkdir, writeFile } from 'node:fs/promises';
import {
  buildSwedishCountyGroceryOverpassQuery,
  fetchCityGrossProductsForAllStores,
  fetchIcaReklambladOffers,
  fetchLidlOffersForAllStores,
  fetchOverpassGroceryStores
} from '../../packages/ingestion/dist/index.js';

const REPO_ROOT = new URL('../../', import.meta.url);
const INGESTED_DIR = new URL('apps/web/src/lib/ingested/', REPO_ROOT);

const CITY_GROSS_QUERIES = ['kaffe', 'mjolk', 'pasta', 'ris', 'smor'];
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
  '/c/lidl-plus-erbjudanden/a10094682',
  '/c/veckans-blommor/a10094398'
];

const retrievedAt = new Date().toISOString();

await mkdir(INGESTED_DIR, { recursive: true });

const cityGrossProducts = await fetchCityGrossProductsForAllStores({
  maxStores: 5,
  queries: CITY_GROSS_QUERIES,
  maxRowsPerStore: 24,
  pageSize: 24,
  retrievedAt
});
await writeCityGross(cityGrossProducts);

const lidlStoreOffers = await fetchLidlOffersForAllStores({
  maxStores: 6,
  offerPaths: LIDL_OFFER_PATHS,
  maxRows: 150,
  retrievedAt
});
await writeLidl(lidlStoreOffers);

const overpassQuery = buildSwedishCountyGroceryOverpassQuery('SE-AB');
const overpassStores = await fetchOverpassGroceryStores({
  query: overpassQuery,
  retrievedAt
});
await writeOverpass(overpassStores, overpassQuery);

const icaReklambladOffers = await fetchIcaReklambladOffers({
  sourceUrls: ICA_REKLAMBLAD_SOURCE_URLS,
  maxRows: 1000,
  retrievedAt
});
await writeIcaReklamblad(icaReklambladOffers);

console.log(JSON.stringify({
  retrievedAt,
  cityGrossProducts: cityGrossProducts.length,
  lidlStoreOffers: lidlStoreOffers.length,
  overpassStores: overpassStores.length,
  icaReklambladOffers: icaReklambladOffers.length
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
