#!/usr/bin/env node
import process from 'node:process';
import { Client } from 'pg';

const requiredDailyChainIds = ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'];

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].sort();
}

function normalizeChainId(value) {
  return value.trim().toLowerCase().replace(/-/g, '_');
}

export function buildCatalogCoverageTargets(rows) {
  const targetProducts = uniqueSorted(rows.products.map((row) => row.id));
  const targetCategories = uniqueSorted(rows.products.map((row) => row.category_id ?? 'uncategorized'));
  const targetStores = uniqueSorted(rows.stores.map((row) => row.external_ref));
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
    requireEveryProductInEveryStore: true
  };
}

async function readCatalogRows(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const products = await client.query(`select id, coalesce(category_path[1], 'uncategorized') as category_id from products order by id`);
    const stores = await client.query('select slug, external_ref, id from stores order by slug');
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
          { id: 'daily-coop-kirseberg', slug: '216502', external_ref: '216502' },
          { id: 'daily-ica-kungsholmen', slug: '1004599', external_ref: '1004599' }
        ]
      : [
          { id: 'daily-willys-odenplan', slug: 'willys-odenplan', external_ref: 'willys-odenplan' },
          { id: 'daily-coop-odenplan', slug: 'coop-odenplan', external_ref: 'coop-odenplan' }
        ];
    const targets = buildCatalogCoverageTargets({
      products: [{ id: 'coffee', category_id: 'coffee' }, { id: 'milk', category_id: 'dairy' }],
      stores,
      chains: chainIds.map((id) => ({ id }))
    });
    process.stdout.write(`${JSON.stringify(targets)}\n`);
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const targets = buildCatalogCoverageTargets(await readCatalogRows(databaseUrl));
  process.stdout.write(`${JSON.stringify(targets)}\n`);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
