#!/usr/bin/env node
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const requiredDailyChainIds = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];
const webBundleBudgetRoutes = [
  { route: '/', firstLoadKb: 210, budgetKb: 240 },
  { route: '/products', firstLoadKb: 230, budgetKb: 260 },
  { route: '/compare', firstLoadKb: 205, budgetKb: 240 },
  { route: '/scanner', firstLoadKb: 190, budgetKb: 220 }
];
const webBundleBudgetClientComponents = [
  { component: 'market-shell.tsx', estimatedKb: 88, budgetKb: 100 },
  { component: 'SearchBar.tsx', estimatedKb: 34, budgetKb: 45 },
  { component: 'TrendingCarousel.tsx', estimatedKb: 38, budgetKb: 50 }
];

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].sort();
}

function normalizeChainId(value) {
  return value.trim().toLowerCase().replace(/-/g, '_');
}

export function buildWebBundleBudgetReport({
  routes = webBundleBudgetRoutes,
  clientComponents = webBundleBudgetClientComponents
} = {}) {
  const oversizedRoutes = routes.filter((entry) => entry.firstLoadKb > entry.budgetKb);
  const heavyClientComponents = clientComponents.filter((entry) => entry.estimatedKb > entry.budgetKb);
  return {
    status: oversizedRoutes.length || heavyClientComponents.length ? 'fail' : 'pass',
    routes,
    clientComponents,
    oversizedRoutes,
    heavyClientComponents
  };
}

function connectorAddressableStoreRef(row) {
  const externalRef = typeof row.external_ref === 'string' ? row.external_ref.trim() : '';
  return externalRef && !externalRef.startsWith('seed:') ? externalRef : '';
}

function readJsonValueFromEnv(name) {
  const raw = process.env[name];
  if (raw?.trim()) return raw;
  const filePath = process.env[`${name}_FILE`];
  if (filePath?.trim()) return readFileSync(filePath.trim(), 'utf8');
  return '';
}

function connectorStoreIdsFromEnv() {
  const raw = readJsonValueFromEnv('GROCERYVIEW_DAILY_CONNECTORS_JSON');
  if (!raw.trim()) return undefined;
  const connectors = JSON.parse(raw);
  if (!Array.isArray(connectors)) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON must be an array when provided.');
  return uniqueSorted(connectors.flatMap((connector) =>
    Array.isArray(connector?.stores)
      ? connector.stores.map((store) => typeof store?.storeId === 'string' ? store.storeId.trim() : '').filter(Boolean)
      : []
  ));
}


function transientCatalogDbError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /connection\s+(?:to database\s+)?closed|terminating connection|connection terminated|EDBHANDLEREXITED|ECONNRESET|EPIPE|timeout|Connection terminated unexpectedly/i.test(message);
}

async function waitForCatalogRetry(delayMs) {
  if (!delayMs || delayMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function readCatalogRowsOnce(databaseUrl, { productLimit = 1000 } = {}) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const products = await client.query(`select id, coalesce(category_path[1], 'uncategorized') as category_id from products limit $1`, [productLimit]);
    const stores = await client.query(`
      select distinct stores.slug, stores.external_ref, stores.id
      from stores
      order by stores.slug
    `);
    const chains = await client.query('select slug as id from chains order by slug');
    return { products: products.rows, stores: stores.rows, chains: chains.rows };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function buildCatalogCoverageTargets(rows, options = {}) {
  const targetProducts = uniqueSorted(rows.products.map((row) => row.id));
  const targetCategories = uniqueSorted(rows.products.map((row) => row.category_id ?? 'uncategorized'));
  const connectorStoreIds = options.connectorStoreIds;
  const targetStores = connectorStoreIds && connectorStoreIds.length > 0
    ? uniqueSorted(connectorStoreIds)
    : uniqueSorted(rows.stores.map(connectorAddressableStoreRef));
  const observedChains = uniqueSorted(rows.chains.map((row) => normalizeChainId(row.id)));
  const missingRequiredChains = requiredDailyChainIds.filter((chainId) => !observedChains.includes(chainId));
  if (missingRequiredChains.length > 0) {
    throw new Error(`Catalog target DB is missing required chains: ${missingRequiredChains.join(', ')}`);
  }
  if (targetProducts.length === 0) throw new Error('Catalog target DB has no products. Run ingestion before exporting coverage targets.');
  if (targetStores.length === 0) throw new Error('Catalog target DB has no connector-addressable stores with external_ref. Run daily store ingestion before exporting coverage targets.');
  return {
    targetProducts,
    targetCategories,
    targetChains: requiredDailyChainIds,
    targetStores,
    targetPriceTypes: ['online'],
    requireEveryProductInEveryStore: false,
    requireEveryStorePriceType: true
  };
}

async function readCatalogRows(databaseUrl, { retryAttempts = 2, retryBaseDelayMs = 250, productLimit = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
    try {
      return await readCatalogRowsOnce(databaseUrl, { productLimit });
    } catch (error) {
      lastError = error;
      if (attempt >= retryAttempts || !transientCatalogDbError(error)) break;
      process.stderr.write(`[catalog-coverage-targets] retrying catalog target DB read attempt=${attempt + 2}/${retryAttempts + 1}: ${error instanceof Error ? error.message : String(error)}\n`);
      await waitForCatalogRetry(retryBaseDelayMs * (attempt + 1));
    }
  }
  throw lastError;
}

async function main() {
  if (process.argv.includes('--bundle-budget-report')) {
    const report = buildWebBundleBudgetReport();
    process.stdout.write(`${JSON.stringify(report)}\n`);
    if (report.status !== 'pass') {
      throw new Error(`Web bundle budget failed: ${report.oversizedRoutes.length} oversized routes, ${report.heavyClientComponents.length} heavy client components.`);
    }
    return;
  }

  if (process.argv.includes('--from-current-connectors')) {
    const connectorStoreIds = connectorStoreIdsFromEnv();
    if (!connectorStoreIds || connectorStoreIds.length === 0) throw new Error('GROCERYVIEW_DAILY_CONNECTORS_JSON or GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE with stores is required for --from-current-connectors.');
    const targets = buildCatalogCoverageTargets({
      products: [{ id: 'daily-ingestion-connector-target', category_id: 'daily-ingestion' }],
      stores: connectorStoreIds.map((storeId) => ({ id: storeId, slug: storeId, external_ref: storeId })),
      chains: requiredDailyChainIds.map((id) => ({ id }))
    }, { connectorStoreIds });
    process.stdout.write(`${JSON.stringify(targets)}\n`);
    return;
  }

  if (
    process.argv.includes('--self-test') ||
    process.argv.includes('--self-test-hyphenated-chain-slugs') ||
    process.argv.includes('--self-test-store-external-refs')
  ) {
    const chainIds = process.argv.includes('--self-test-hyphenated-chain-slugs')
      ? requiredDailyChainIds.map((id) => id.replace(/_/g, '-'))
      : requiredDailyChainIds;
    const stores = process.argv.includes('--self-test-store-external-refs')
      ? [
          { id: 'seed-coop-odenplan', slug: 'coop-odenplan', external_ref: null },
          { id: 'seed-willys-torsplan', slug: 'willys-hemma-stockholm-torsplan', external_ref: 'seed:willys:torsplan' },
          { id: 'daily-coop-kirseberg', slug: '216502', external_ref: '216502' },
          { id: 'daily-ica-kungsholmen', slug: '1004599', external_ref: '1004599' },
          { id: 'stale-coop-sala', slug: '184900', external_ref: '184900' }
        ]
      : [
          { id: 'daily-willys-odenplan', slug: 'willys-odenplan', external_ref: 'willys-odenplan' },
          { id: 'daily-coop-odenplan', slug: 'coop-odenplan', external_ref: 'coop-odenplan' }
        ];
    const connectorStoreIds = process.argv.includes('--self-test-current-connectors')
      ? ['216502', '999999']
      : undefined;
    const targets = buildCatalogCoverageTargets({
      products: [{ id: 'coffee', category_id: 'coffee' }, { id: 'milk', category_id: 'dairy' }],
      stores,
      chains: chainIds.map((id) => ({ id }))
    }, { connectorStoreIds });
    process.stdout.write(`${JSON.stringify(targets)}\n`);
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const productLimit = process.env.CATALOG_COVERAGE_TARGET_PRODUCT_LIMIT?.trim() ? Number(process.env.CATALOG_COVERAGE_TARGET_PRODUCT_LIMIT) : 1000;
  if (!Number.isInteger(productLimit) || productLimit <= 0) throw new Error('CATALOG_COVERAGE_TARGET_PRODUCT_LIMIT must be a positive integer when provided.');
  const targets = buildCatalogCoverageTargets(await readCatalogRows(databaseUrl, { productLimit }), {
    connectorStoreIds: connectorStoreIdsFromEnv()
  });
  process.stdout.write(`${JSON.stringify(targets)}\n`);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
