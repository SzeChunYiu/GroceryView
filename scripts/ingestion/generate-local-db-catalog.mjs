#!/usr/bin/env node
// LOCAL-ONLY helper: build the full site catalog (apps/web/src/lib/generated/db-site-products.ts)
// from every product in the connected database, one cheapest representative row per product.
// This bypasses the 10k store-row cap in listLatestPriceSnapshotRows, which clips the catalog
// when a single chain replicates one price across hundreds of stores (the local gv-pg shape).
// Not part of the production export pipeline — it is a developer convenience for local browsing.
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';
import { buildDbSiteAxfoodProducts } from './export-db-site-snapshot.mjs';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
const outPath = new URL('../../apps/web/src/lib/generated/db-site-products.ts', import.meta.url);

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
// One row per (product, chain) so the catalog builder can record per-chain prices and
// surface real cross-chain comparison (products are EAN-keyed, shared across chains).
const { rows } = await pool.query(`
  SELECT
    p.slug              AS "productSlug",
    p.canonical_name    AS "canonicalName",
    c.slug              AS "chainSlug",
    c.name              AS "chainName",
    lp.price            AS price,
    lp.regular_price    AS "regularPrice",
    lp.unit_price       AS "unitPrice",
    lp.observed_at      AS "observedAt",
    COALESCE(lp.is_available, true) AS "isAvailable",
    p.brand             AS brand,
    p.package_size      AS "packageSize",
    p.package_unit      AS "packageUnit",
    p.comparable_unit   AS "comparableUnit",
    p.category_path     AS "categoryPath",
    p.image_url         AS "imageUrl"
  FROM latest_prices lp
  JOIN products p ON p.id = lp.product_id
  JOIN chains   c ON c.id = lp.chain_id
  WHERE lp.domain = 'grocery'
    AND lp.price > 0
    AND COALESCE(p.deleted_at, 'infinity'::timestamptz) > now()
`);
await pool.end();

// pg returns numeric columns as strings and timestamptz as Date — coerce to the shapes the builder expects.
const normalized = rows.map((row) => ({
  ...row,
  price: Number(row.price),
  regularPrice: row.regularPrice == null ? null : Number(row.regularPrice),
  unitPrice: row.unitPrice == null ? null : Number(row.unitPrice),
  packageSize: row.packageSize == null ? null : Number(row.packageSize),
  observedAt: row.observedAt instanceof Date ? row.observedAt.toISOString() : String(row.observedAt ?? ''),
  categoryPath: Array.isArray(row.categoryPath) ? row.categoryPath : []
}));

const all = buildDbSiteAxfoodProducts(normalized);
// Prefer multi-chain (comparable) products with plausible spreads; keep the catalog small
// enough for fast builds. Extreme spreads are usually promo-vs-regular noise.
const multi = all.filter((p) => (p.inChains || []).length >= 2);
const plausible = multi.filter((p) => (p.spreadPct ?? 0) <= 40).sort((a, b) => (b.spreadPct ?? 0) - (a.spreadPct ?? 0));
const rest = multi.filter((p) => (p.spreadPct ?? 0) > 40);
const single = all.filter((p) => (p.inChains || []).length < 2);
const products = [...plausible, ...rest, ...single].slice(0, 600);
const generatedAt = normalized[0]?.observedAt ?? null;
console.error(`built ${all.length} products, ${multi.length} multi-chain, wrote ${products.length}`);
const text = [
  '// Generated locally from the connected database (scripts/ingestion/generate-local-db-catalog.mjs).',
  '// Do not commit — production regenerates this from the production DB during deploy.',
  "import type { AxfoodProduct } from '../axfood-products';",
  '',
  `export const dbSiteSnapshotGeneratedAt = ${JSON.stringify(generatedAt)};`,
  `export const dbSiteAxfoodProducts: AxfoodProduct[] = ${JSON.stringify(products, null, 2)};`,
  ''
].join('\n');
writeFileSync(outPath, text);
console.log(JSON.stringify({ sourceRows: rows.length, catalogProducts: products.length }, null, 2));
