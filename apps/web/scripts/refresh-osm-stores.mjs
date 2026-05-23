#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const outputPath = resolve(repoRoot, 'apps/web/src/lib/osm-stores.ts');
const ingestionDistPath = resolve(repoRoot, 'packages/ingestion/dist/index.js');

let ingestion;
try {
  ingestion = await import(ingestionDistPath);
} catch (error) {
  throw new Error(`Build @groceryview/ingestion before refreshing OSM stores: ${error instanceof Error ? error.message : String(error)}`);
}

const {
  buildSwedishCountyGroceryOverpassQuery,
  fetchOverpassGroceryStores,
  SWEDEN_GROCERY_OVERPASS_QUERY,
  SWEDISH_COUNTY_ISO3166_2_CODES
} = ingestion;

if (
  typeof buildSwedishCountyGroceryOverpassQuery !== 'function' ||
  typeof fetchOverpassGroceryStores !== 'function' ||
  typeof SWEDEN_GROCERY_OVERPASS_QUERY !== 'string' ||
  !Array.isArray(SWEDISH_COUNTY_ISO3166_2_CODES)
) {
  throw new Error('The ingestion build does not export the Overpass refresh functions and queries.');
}

const retrievedAt = new Date().toISOString();
const stores = await fetchSwedenStoresWithCountyFallback(retrievedAt);
const rows = dedupeStores(stores)
  .map(toWebStore)
  .sort((a, b) => a.name.localeCompare(b.name, 'sv') || a.city.localeCompare(b.city, 'sv') || a.slug.localeCompare(b.slug, 'sv'));

if (rows.length < 2000) {
  throw new Error(`OpenStreetMap Overpass Sweden extract returned only ${rows.length} grocery stores; refusing to replace the generated nationwide file.`);
}

await writeFile(outputPath, renderModule(rows, retrievedAt));
console.log(`Wrote ${rows.length} OpenStreetMap grocery stores to apps/web/src/lib/osm-stores.ts`);

async function fetchSwedenStoresWithCountyFallback(retrievedAt) {
  try {
    return await fetchOverpassGroceryStores({ query: SWEDEN_GROCERY_OVERPASS_QUERY, retrievedAt });
  } catch (error) {
    console.warn(`Sweden-wide Overpass query failed; falling back to ${SWEDISH_COUNTY_ISO3166_2_CODES.length} county-scoped queries: ${error instanceof Error ? error.message : String(error)}`);
  }

  const allStores = [];
  for (const countyCode of SWEDISH_COUNTY_ISO3166_2_CODES) {
    const countyRows = await fetchOverpassGroceryStores({
      query: buildSwedishCountyGroceryOverpassQuery(countyCode),
      retrievedAt
    });
    console.log(`${countyCode}: ${countyRows.length} stores`);
    allStores.push(...countyRows);
  }
  return allStores;
}

function dedupeStores(stores) {
  const seen = new Set();
  return stores.filter((store) => {
    const key = `${store.osmType}:${store.osmId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toWebStore(store) {
  const city = store.city || inferDistrict(store) || 'Sweden';
  const district = city;
  const brand = normalizeBrand(store.brand || store.name);
  const name = store.name || brand;
  const address = [store.street, store.houseNumber, store.postcode, store.city].filter(Boolean).join(', ');
  return {
    slug: uniqueSafeSlug([name, city, String(store.osmId)].filter(Boolean).join(' ')),
    name,
    brand,
    format: formatFor(store.shop, brand, name),
    shop: store.shop,
    address,
    city,
    district,
    lat: roundCoordinate(store.latitude),
    lng: roundCoordinate(store.longitude),
    source: 'osm',
    retrievedDate: retrievedAt.slice(0, 10)
  };
}

function normalizeBrand(value) {
  const cleaned = String(value || '').trim();
  if (!cleaned) return 'Unbranded';
  const lower = cleaned.toLowerCase();
  if (lower.includes('willys')) return 'Willys';
  if (lower.includes('hemköp') || lower.includes('hemkop')) return 'Hemköp';
  if (lower.includes('city gross')) return 'City Gross';
  if (lower.includes('stora coop')) return 'Stora Coop';
  if (lower.includes('coop')) return 'Coop';
  if (lower.includes('ica maxi') || lower.includes('maxi ica') || lower.includes('maxi stormarknad')) return 'Maxi ICA Stormarknad';
  if (lower.includes('ica kvantum')) return 'ICA Kvantum';
  if (lower.includes('ica supermarket')) return 'ICA Supermarket';
  if (lower.includes('ica nära') || lower.includes('ica nara')) return 'ICA Nära';
  if (lower === 'ica' || lower.startsWith('ica ')) return 'ICA';
  if (lower.includes('lidl')) return 'Lidl';
  if (lower.includes('tempo')) return 'Tempo';
  if (lower.includes('pressbyrån') || lower.includes('pressbyran')) return 'Pressbyrån';
  if (lower.includes('7-eleven')) return '7-Eleven';
  return cleaned;
}

function formatFor(shop, brand, name) {
  const text = `${brand} ${name}`.toLowerCase();
  if (text.includes('maxi') || text.includes('stormarknad') || text.includes('city gross')) return 'big-box supermarket';
  if (text.includes('lidl') || text.includes('willys')) return 'discount supermarket';
  if (shop === 'convenience') return 'convenience store';
  if (shop === 'grocery') return 'grocery store';
  if (shop === 'supermarket') return 'full-service supermarket';
  return shop || 'store';
}

function inferDistrict(store) {
  const source = [store.street, store.website].filter(Boolean).join(' ');
  const match = source.match(/\b(Stockholm|Göteborg|Malmö|Uppsala|Västerås|Örebro|Linköping|Helsingborg|Jönköping|Norrköping|Lund|Umeå|Gävle|Borås|Södertälje|Eskilstuna|Karlstad|Täby|Växjö|Halmstad|Sundsvall)\b/i);
  return match?.[1] ?? '';
}

function uniqueSafeSlug(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function roundCoordinate(value) {
  return Math.round(value * 100000) / 100000;
}

function renderModule(rows, retrievedAt) {
  return `// AUTO-GENERATED from OpenStreetMap Overpass (Sweden, shop=supermarket|convenience|grocery)\n// Retrieved: ${retrievedAt} via https://overpass-api.de/api/interpreter\n// Source: © OpenStreetMap contributors, ODbL.\n// Do not hand-edit; regenerate via apps/web/scripts/refresh-osm-stores.mjs.\n\nexport type OsmStore = {\n  slug: string; name: string; brand: string; format: string; shop: string;\n  address: string; city: string; district: string; lat: number; lng: number;\n  source: 'osm'; retrievedDate: string;\n};\n\nexport const osmStores: OsmStore[] = ${JSON.stringify(rows, null, 2)};\n`;
}
