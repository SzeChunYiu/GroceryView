#!/usr/bin/env node
// Fast, resilient ICA per-store loader. The naive single-transaction load of ~4.2M product-at-store rows
// is too slow because (a) the observations_partition_lane_sync trigger mirrors every row into observations_v2
// (doubling writes) and (b) one giant transaction rolls back entirely on any interruption. This loader:
//   - disables the partition-sync trigger for the duration (the serving views read latest_prices, not v2),
//   - upserts the ~53k unique products once,
//   - then loads observations + latest_prices in COMMITTED batches of stores (progress persists),
//   - re-enables the trigger and runs the variation GATE at the end.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const DIR = path.resolve(fileURLToPath(new URL('../../data/ica-crawl/', import.meta.url)));
const NOW = new Date().toISOString();
const SRC = 'ica-store-crawl';
const STORES_PER_BATCH = 12;
const unitFor = (u) => { const s = String(u || '').toLowerCase(); if (s.includes('kg')) return 'kg'; if (s.includes('l')) return 'l'; return 'st'; };

function* parse(f) {
  for (const line of readFileSync(path.join(DIR, f), 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    let r; try { r = JSON.parse(t); } catch { continue; }
    if (!r.rpid || !r.store || !(r.price > 0)) continue;
    yield r;
  }
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.ndjson'));
const productMap = new Map();
let totalRows = 0;
for (const f of files) for (const r of parse(f)) { totalRows++; if (!productMap.has(r.rpid)) productMap.set(r.rpid, r); }
const products = [...productMap.values()];
console.error(`files:${files.length} rows:${totalRows} products:${products.length}`);
if (!totalRows) process.exit(1);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const client = await pool.connect();
async function batchInsert(table, cols, rows, perRow) {
  for (let b = 0; b < rows.length; b += 500) {
    const sl = rows.slice(b, b + 500); const v = []; const pr = [];
    sl.forEach((r, i) => { const vals = perRow(r); const o = i * vals.length;
      v.push('(' + vals.map((_, k) => '$' + (o + k + 1)).join(',') + ')'); pr.push(...vals); });
    await client.query(`INSERT INTO ${table} (${cols}) VALUES ${v.join(',')}`, pr);
  }
}

// resume: skip stores already loaded (per-batch commits persist across runs)
const loaded = new Set((await client.query(
  `SELECT DISTINCT s.external_ref FROM latest_prices lp JOIN stores s ON s.id=lp.store_id WHERE lp.provenance->>'source'=$1`, [SRC]
)).rows.map((r) => r.external_ref));
const todo = files.filter((f) => !loaded.has(f.replace('.ndjson', '')));
console.error(`already loaded: ${loaded.size} stores; remaining to load: ${todo.length}`);

try {
  await client.query(`ALTER TABLE observations DISABLE TRIGGER observations_partition_lane_sync`);
  // products (once)
  await client.query(`CREATE TEMP TABLE pstg (slug text, name text, brand text, category text, unit text, image text)`);
  await batchInsert('pstg', 'slug,name,brand,category,unit,image', products,
    (p) => [`ica-${p.rpid}`, p.name, p.brand, p.cat || 'Grocery', unitFor(p.unit), p.image]);
  await client.query(`
    INSERT INTO products (slug, canonical_name, brand, category_path, comparable_unit, image_url, domain, market_code, product_kind)
    SELECT DISTINCT ON (slug) slug, name, brand, ARRAY[category], unit, image, 'grocery', 'SE', 'branded'
    FROM pstg ORDER BY slug
    ON CONFLICT (slug) DO UPDATE SET image_url = COALESCE(EXCLUDED.image_url, products.image_url)`);
  await client.query(`CREATE TEMP TABLE ostg (slug text, ext text, price numeric, unit_price numeric)`);

  let done = 0;
  for (let i = 0; i < todo.length; i += STORES_PER_BATCH) {
    const group = todo.slice(i, i + STORES_PER_BATCH);
    const rows = [];
    for (const f of group) for (const r of parse(f)) rows.push(r);
    if (!rows.length) { done += group.length; continue; }
    await client.query('BEGIN');
    await client.query('TRUNCATE ostg');
    await batchInsert('ostg', 'slug,ext,price,unit_price', rows,
      (r) => [`ica-${r.rpid}`, String(r.store), r.price, r.unitPrice]);
    await client.query(`
      WITH ranked AS (
        SELECT DISTINCT ON (p.id, s.id) p.id product_id, s.chain_id, s.id store_id, o.price, o.unit_price
        FROM ostg o JOIN products p ON p.slug=o.slug
        JOIN stores s ON s.external_ref=o.ext AND s.chain_id=(SELECT id FROM chains WHERE slug='ica')
        ORDER BY p.id, s.id
      ), ins AS (
        INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
        SELECT product_id, chain_id, store_id, 'shelf', price, COALESCE(unit_price,price), 'SEK', false, $1::timestamptz, 0.95, jsonb_build_object('source',$2::text), 'grocery', true, 'SE' FROM ranked
        ON CONFLICT DO NOTHING
        RETURNING id, product_id, chain_id, store_id, price, unit_price, observed_at)
      INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, chain_id, store_id, 'shelf', id, price, COALESCE(unit_price,price), 'SEK', observed_at, 0.95, jsonb_build_object('source',$2::text), 'grocery', true, 'SE' FROM ins
      ON CONFLICT (product_id, chain_id, store_id, price_type)
      DO UPDATE SET price=EXCLUDED.price, unit_price=EXCLUDED.unit_price, observation_id=EXCLUDED.observation_id, observed_at=EXCLUDED.observed_at`, [NOW, SRC]);
    await client.query('COMMIT');
    done += group.length;
    console.error(`  committed ${done}/${todo.length} remaining stores (+${rows.length} rows)`);
  }
  await client.query(`ALTER TABLE observations ENABLE TRIGGER observations_partition_lane_sync`);
  const g = (await client.query(`
    WITH shared AS (SELECT product_id, count(DISTINCT price) prices FROM latest_prices
      WHERE provenance->>'source'=$1 AND store_id IS NOT NULL GROUP BY product_id HAVING count(DISTINCT store_id)>1)
    SELECT count(*) multi, count(*) FILTER (WHERE prices>1) varying_cnt FROM shared`, [SRC])).rows[0];
  const tot = (await client.query(`SELECT count(*) c, count(DISTINCT store_id) s FROM latest_prices WHERE provenance->>'source'=$1`, [SRC])).rows[0];
  console.log(`DONE: ${tot.c} per-store rows across ${tot.s} stores; multi-store products ${g.multi}, varying ${g.varying_cnt}`);
} catch (e) {
  try { await client.query('ROLLBACK'); } catch {}
  try { await client.query(`ALTER TABLE observations ENABLE TRIGGER observations_partition_lane_sync`); } catch {}
  console.error('FAILED:', e.message); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
