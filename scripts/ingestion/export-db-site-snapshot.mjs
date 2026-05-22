#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import process from 'node:process';

function optional(value, key) {
  return value === undefined || value === null ? {} : { [key]: value };
}

export function buildDbSiteSnapshotArtifact({ generatedAt = new Date().toISOString(), rows }) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No latest price rows available for DB-to-site snapshot export.');

  const priceRows = rows.map((row) => ({
    productSlug: row.productSlug,
    canonicalName: row.canonicalName,
    ...optional(row.brand, 'brand'),
    categoryPath: row.categoryPath ?? [],
    ...optional(row.packageSize, 'packageSize'),
    ...optional(row.packageUnit, 'packageUnit'),
    comparableUnit: row.comparableUnit,
    chainSlug: row.chainSlug,
    chainName: row.chainName,
    ...optional(row.storeSlug, 'storeSlug'),
    ...optional(row.storeExternalRef, 'storeExternalRef'),
    ...optional(row.storeName, 'storeName'),
    ...optional(row.city, 'city'),
    priceType: row.priceType,
    price: row.price,
    ...optional(row.regularPrice, 'regularPrice'),
    unitPrice: row.unitPrice,
    currency: row.currency,
    observedAt: row.observedAt,
    confidence: row.confidence,
    observationId: row.observationId,
    provenance: row.provenance ?? {}
  }));

  return {
    status: 'passed',
    generatedAt,
    source: 'postgres.latest_prices',
    coverage: {
      products: new Set(priceRows.map((row) => row.productSlug)).size,
      chains: new Set(priceRows.map((row) => row.chainSlug)).size,
      stores: new Set(priceRows.map((row) => row.storeSlug).filter(Boolean)).size,
      observations: priceRows.length
    },
    priceRows
  };
}

async function exportDbSiteSnapshotFromEnv(env = process.env) {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required for DB-to-site snapshot export.');
  const outputPath = env.GROCERYVIEW_DB_SITE_SNAPSHOT_PATH?.trim();
  if (!outputPath) throw new Error('GROCERYVIEW_DB_SITE_SNAPSHOT_PATH is required for DB-to-site snapshot export.');
  const minConfidence = env.GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE ? Number(env.GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE) : undefined;
  const limit = env.GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT ? Number(env.GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT) : undefined;

  const [{ createPgQueryExecutor, createPostgresSiteSnapshotReader }, pg] = await Promise.all([
    import('@groceryview/db'),
    import('pg')
  ]);
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const reader = createPostgresSiteSnapshotReader(createPgQueryExecutor(pool));
    const rows = await reader.listLatestPriceSnapshotRows({ minConfidence, limit });
    const artifact = buildDbSiteSnapshotArtifact({ rows });
    writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
    return artifact;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  exportDbSiteSnapshotFromEnv()
    .then((artifact) => {
      process.stdout.write(`${JSON.stringify({ status: artifact.status, coverage: artifact.coverage, outputPath: process.env.GROCERYVIEW_DB_SITE_SNAPSHOT_PATH }, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
