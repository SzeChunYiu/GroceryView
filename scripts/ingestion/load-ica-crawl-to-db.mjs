#!/usr/bin/env node
// Load the ICA per-store crawl (data/ica-crawl/<storeId>.ndjson) into the DB as REAL per-branch prices.
// Product identity = ICA retailerProductId (stable across ICA stores) -> slug `ica-<rpid>`, so the same
// product priced at different branches groups under one product_id => genuine per-store variation.
// Stores already exist (loaded from OSM, keyed by external_ref = the handlaprivatkund store id).
//
// Ends with a GATE: asserts that prices actually vary across stores (the prior load shipped identical
// prices at all 326 stores and nothing caught it). Exits non-zero if no shared product varies.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DIR = path.join(ROOT, 'data', 'ica-crawl');
const NOW = new Date().toISOString();
const SRC = 'ica-store-crawl';

function unitFor(u) {
  if (!u) return 'st';
  const s = String(u).toLowerCase();
  if (s.includes('kg') || s === 'kr/kg') return 'kg';
  if (s.includes('lit') || s === 'kr/l') return 'l';
  return 'st';
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.ndjson'));
// Stream-friendly: a per-store crawl is ~5M product-at-store rows — too many to hold in JS at once.
// Pass 1 collects only the unique PRODUCTS (~50k, keyed by retailerProductId). Pass 2 (below) streams
// observations file-by-file straight into a staging table, never materializing all rows in memory.
function* parseFile(f) {
  for (const line of readFileSync(path.join(DIR, f), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    let r; try { r = JSON.parse(t); } catch { continue; }
    if (!r.rpid || !r.store || !(r.price > 0)) continue;
    yield r;
  }
}
const productMap = new Map();
let totalRows = 0, storeSet = new Set();
for (const f of files) for (const r of parseFile(f)) { totalRows++; storeSet.add(r.store); if (!productMap.has(r.rpid)) productMap.set(r.rpid, r); }
const products = [...productMap.values()];
console.error(`rows:${totalRows} products:${products.length} stores:${storeSet.size}`);
if (!totalRows) { console.error('nothing to load'); process.exit(1); }

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // products (slug ica-<rpid>)
  await client.query(`CREATE TEMP TABLE pstg (slug text, name text, brand text, category text, unit text, image text) ON COMMIT DROP`);
  for (let b = 0; b < products.length; b += 500) {
    const sl = products.slice(b, b + 500); const v = []; const pr = [];
    sl.forEach((p, i) => { const o = i * 6; v.push(`($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6})`);
      pr.push(`ica-${p.rpid}`, p.name, p.brand, p.cat || 'Grocery', unitFor(p.unit), p.image); });
    await client.query(`INSERT INTO pstg VALUES ${v.join(',')}`, pr);
  }
  await client.query(`
    INSERT INTO products (slug, canonical_name, brand, category_path, comparable_unit, image_url, domain, market_code, product_kind)
    SELECT DISTINCT ON (slug) slug, name, brand, ARRAY[category], unit, image, 'grocery', 'SE', 'branded'
    FROM pstg ORDER BY slug
    ON CONFLICT (slug) DO UPDATE SET image_url = COALESCE(EXCLUDED.image_url, products.image_url)`);

  // per-(product,store) observations — streamed per file, batched, never all in JS memory
  await client.query(`CREATE TEMP TABLE ostg (slug text, ext text, price numeric, unit_price numeric) ON COMMIT DROP`);
  let buf = [];
  async function flush() {
    if (!buf.length) return;
    const v = []; const pr = [];
    buf.forEach((r, i) => { const o = i * 4; v.push(`($${o+1},$${o+2},$${o+3},$${o+4})`);
      pr.push(`ica-${r.rpid}`, String(r.store), r.price, r.unitPrice); });
    await client.query(`INSERT INTO ostg VALUES ${v.join(',')}`, pr);
    buf = [];
  }
  for (const f of files) {
    for (const r of parseFile(f)) { buf.push(r); if (buf.length >= 1000) await flush(); }
  }
  await flush();

  const ins = await client.query(`
    WITH ranked AS (
      SELECT DISTINCT ON (p.id, s.id) p.id product_id, s.chain_id, s.id store_id, o.price, o.unit_price
      FROM ostg o
      JOIN products p ON p.slug = o.slug
      JOIN stores   s ON s.external_ref = o.ext AND s.chain_id = (SELECT id FROM chains WHERE slug='ica')
      ORDER BY p.id, s.id
    ), ins AS (
      INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, chain_id, store_id, 'shelf', price, COALESCE(unit_price, price), 'SEK', false, $1::timestamptz, 0.95,
             jsonb_build_object('source', $2::text), 'grocery', true, 'SE'
      FROM ranked
      ON CONFLICT DO NOTHING
      RETURNING id, product_id, chain_id, store_id, price, unit_price, observed_at)
    INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT product_id, chain_id, store_id, 'shelf', id, price, COALESCE(unit_price, price), 'SEK', observed_at, 0.95,
           jsonb_build_object('source', $2::text), 'grocery', true, 'SE'
    FROM ins
    ON CONFLICT (product_id, chain_id, store_id, price_type)
    DO UPDATE SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, observation_id = EXCLUDED.observation_id,
                  observed_at = EXCLUDED.observed_at, provenance = EXCLUDED.provenance`, [NOW, SRC]);

  // GATE: prices must vary across stores for shared products.
  const gate = await client.query(`
    WITH shared AS (
      SELECT product_id, count(DISTINCT store_id) stores, count(DISTINCT price) prices
      FROM latest_prices WHERE provenance->>'source' = $1 AND store_id IS NOT NULL
      GROUP BY product_id HAVING count(DISTINCT store_id) > 1)
    SELECT count(*) shared_multi_store,
           count(*) FILTER (WHERE prices > 1) varying_cnt,
           coalesce(round(100.0*count(*) FILTER (WHERE prices>1)/NULLIF(count(*),0),1),0) pct_varying
    FROM shared`, [SRC]);
  const g = gate.rows[0];
  if (Number(g.varying_cnt) === 0) {
    await client.query('ROLLBACK');
    console.error(`GATE FAILED: 0 of ${g.shared_multi_store} multi-store products vary in price — rolling back (load is wrong).`);
    process.exit(2);
  }
  await client.query('COMMIT');
  console.log(`loaded ICA per-store crawl. multi-store products:${g.shared_multi_store} varying:${g.varying_cnt} (${g.pct_varying}%)`);
} catch (e) {
  await client.query('ROLLBACK');
  console.error('FAILED (rolled back):', e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
