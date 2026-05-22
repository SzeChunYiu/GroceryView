#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const outputPath = resolve(repoRoot, 'apps/web/src/lib/openfoodfacts-catalog.ts');
const ingestionDistPath = resolve(repoRoot, 'packages/ingestion/dist/index.js');

let ingestion;
try {
  ingestion = await import(ingestionDistPath);
} catch (error) {
  throw new Error(`Build @groceryview/ingestion before refreshing OpenFoodFacts catalog: ${error instanceof Error ? error.message : String(error)}`);
}

const { fetchOpenFoodFactsSwedenCatalog } = ingestion;
if (typeof fetchOpenFoodFactsSwedenCatalog !== 'function') {
  throw new Error('The ingestion build does not export fetchOpenFoodFactsSwedenCatalog.');
}

const retrievedAt = new Date().toISOString();
const minimumRows = Number(process.env.GROCERYVIEW_OPENFOODFACTS_MIN_ROWS ?? 900);
const forceFallback = process.env.GROCERYVIEW_OPENFOODFACTS_REFRESH_MODE === 'fallback';
let lastProgressAt = 0;
let products = [];
let generationSource = 'OpenFoodFacts Sweden metadata catalog API';

if (!forceFallback) {
  try {
    products = await fetchOpenFoodFactsSwedenCatalog({
      concurrency: 2,
      maxPages: Number(process.env.GROCERYVIEW_OPENFOODFACTS_MAX_PAGES ?? 10),
      maxRows: Number(process.env.GROCERYVIEW_OPENFOODFACTS_MAX_ROWS ?? 1000),
      onPage: (event) => {
        const now = Date.now();
        if (event.skipped || now - lastProgressAt > 2000 || event.page === event.totalPages || event.rows >= 1000) {
          const total = Number.isFinite(event.totalPages) ? event.totalPages : '?';
          const status = event.skipped ? 'skipped' : 'fetched';
          console.error(`OpenFoodFacts catalog ${status} page ${event.page}/${total}; rows=${event.rows}`);
          lastProgressAt = now;
        }
      },
      pageDelayMs: 250,
      pageSize: 100,
      requestRetryAttempts: 12,
      requestRetryBaseDelayMs: 750,
      retrievedAt,
      skipFailedPages: true
    });
  } catch (error) {
    console.error(`OpenFoodFacts live catalog refresh failed; falling back to existing OpenPrices/OpenFoodFacts metadata slice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (products.length < minimumRows) {
  if (!forceFallback) {
    console.error(`OpenFoodFacts live catalog produced ${products.length} rows (<${minimumRows}); using existing OpenPrices/OpenFoodFacts metadata slice.`);
  }
  products = await loadExistingOpenPricesMetadata(retrievedAt);
  generationSource = 'existing OpenPrices/OpenFoodFacts metadata slice';
}

const rows = products
  .map(toCatalogProduct)
  .sort((a, b) => a.name.localeCompare(b.name, 'sv') || a.code.localeCompare(b.code, 'sv'));

if (rows.length < minimumRows) {
  throw new Error(`OpenFoodFacts Sweden metadata catalog produced only ${rows.length} products; refusing to replace the generated metadata catalog.`);
}

await writeFile(outputPath, renderModule(rows, retrievedAt, generationSource));
console.log(`Wrote ${rows.length} OpenFoodFacts Sweden metadata catalog products to apps/web/src/lib/openfoodfacts-catalog.ts (${generationSource})`);


async function loadExistingOpenPricesMetadata(retrievedAt) {
  const sourcePath = resolve(repoRoot, 'apps/web/src/lib/openprices-products.ts');
  const source = await readFile(sourcePath, 'utf8');
  const start = source.indexOf('export const pricedProducts: PricedProduct[] = [');
  const end = source.indexOf('\n];', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not locate pricedProducts in existing OpenPrices product module.');
  }
  const arrayText = source.slice(source.indexOf('[', start), end + 2);
  const pricedProducts = Function(`return ${arrayText};`)();
  return pricedProducts.map((product) => ({
    code: product.code,
    name: product.name,
    brands: product.brands,
    quantity: product.quantity,
    categories: product.categories,
    labels: [],
    nutriscoreGrade: product.nutriscore,
    imageUrl: product.image,
    productUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(product.code)}`,
    sourceUrl: 'apps/web/src/lib/openprices-products.ts',
    retrievedAt
  }));
}

function toCatalogProduct(product) {
  return {
    code: product.code,
    slug: slugify([product.name, product.code].filter(Boolean).join(' ')),
    name: product.name,
    brands: product.brands,
    quantity: product.quantity,
    categories: product.categories,
    labels: product.labels,
    nutriscoreGrade: product.nutriscoreGrade,
    imageUrl: product.imageUrl,
    productUrl: product.productUrl,
    sourceUrl: product.sourceUrl,
    retrievedDate: product.retrievedAt.slice(0, 10)
  };
}

function slugify(value) {
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

function renderModule(rows, retrievedAt, generationSource) {
  return `// AUTO-GENERATED from ${generationSource}.\n// Retrieved: ${retrievedAt} via https://world.openfoodfacts.org/api/v2/search?countries_tags=sweden\n// Source: OpenFoodFacts contributors, ODbL. Metadata only; no GroceryView prices are inferred from these rows.\n// Do not hand-edit; regenerate via apps/web/scripts/refresh-openfoodfacts-catalog.mjs.\n\nexport type OpenFoodFactsCatalogProduct = {\n  code: string; slug: string; name: string; brands: string; quantity: string;\n  categories: string[]; labels: string[]; nutriscoreGrade: string; imageUrl: string;\n  productUrl: string; sourceUrl: string; retrievedDate: string;\n};\n\nexport const openFoodFactsCatalog: OpenFoodFactsCatalogProduct[] = ${JSON.stringify(rows)};\n`;
}
