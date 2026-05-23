#!/usr/bin/env node
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const requiredDailyChainIds = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].sort();
}

function normalizeChainId(value) {
  return value.trim().toLowerCase().replace(/-/g, '_');
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

async function readCatalogRows(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const products = await client.query(`select id, coalesce(category_path[1], 'uncategorized') as category_id from products order by id`);
    const stores = await client.query(`
      select distinct stores.slug, stores.external_ref, stores.id
      from stores
      order by stores.slug
    `);
    const chains = await client.query('select slug as id from chains order by slug');
    return { products: products.rows, stores: stores.rows, chains: chains.rows };
  } finally {
    await client.end();
  }
}

async function main() {
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
  const targets = buildCatalogCoverageTargets(await readCatalogRows(databaseUrl), {
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
