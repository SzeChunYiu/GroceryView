#!/usr/bin/env node
// Load the full City Gross (national) + Coop (regional) catalogs crawled to /tmp/*.ndjson.
// Products are EAN-keyed (slug `ean-<gtin>`), so City Gross/Coop merge into the SAME product rows as
// Willys/Hemköp → instant cross-chain comparison by EAN. City Gross = national (store_id NULL). Coop =
// regional: one store row per production-unit region (geocoded from an OSM Coop store in that city), prices
// attached per region (store_id set) so the 13k cross-region varying products feed the heatmap honestly.
import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const NOW = new Date().toISOString();
const CG = '/tmp/citygross-catalog.ndjson';
const COOP = '/tmp/coop-catalog.ndjson';
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
function readNdjson(f) {
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();

async function upsertProducts(rows, eanKey, catKey) {
  await client.query(`DROP TABLE IF EXISTS pstg`);
  await client.query(`CREATE TEMP TABLE pstg (ean text, name text, brand text, category text)`);
  const seen = new Map();
  for (const r of rows) { const e = String(r[eanKey] || '').trim(); if (e && !seen.has(e)) seen.set(e, r); }
  const prods = [...seen.values()];
  for (let b = 0; b < prods.length; b += 500) {
    const sl = prods.slice(b, b + 500); const v = []; const pr = [];
    sl.forEach((r, i) => { const o = i * 4; v.push(`($${o+1},$${o+2},$${o+3},$${o+4})`);
      pr.push(String(r[eanKey]).trim(), String(r.name || '').slice(0, 300), r.brand ? String(r.brand).slice(0, 120) : null, r[catKey] || 'Grocery'); });
    await client.query(`INSERT INTO pstg VALUES ${v.join(',')}`, pr);
  }
  await client.query(`
    INSERT INTO products (slug, canonical_name, brand, barcode, category_path, comparable_unit, domain, market_code, product_kind)
    SELECT DISTINCT ON (ean) 'ean-'||ean, name, brand, ean, ARRAY[category], 'st', 'grocery', 'SE', 'branded'
    FROM pstg WHERE ean <> '' ORDER BY ean
    ON CONFLICT (slug) DO UPDATE SET
      brand = COALESCE(products.brand, EXCLUDED.brand),
      barcode = COALESCE(NULLIF(products.barcode,''), EXCLUDED.barcode)`);
  return prods.length;
}

async function loadCityGross() {
  const rows = readNdjson(CG);
  if (!rows.length) { console.log('city-gross: no file'); return; }
  const nProds = await upsertProducts(rows, 'gtin', 'category');
  await client.query(`DROP TABLE IF EXISTS ostg`);
  await client.query(`CREATE TEMP TABLE ostg (ean text, price numeric, cmp numeric)`);
  for (let b = 0; b < rows.length; b += 500) {
    const sl = rows.slice(b, b + 500); const v = []; const pr = [];
    sl.forEach((r, i) => { const o = i * 3; v.push(`($${o+1},$${o+2},$${o+3})`); pr.push(String(r.gtin).trim(), num(r.price), num(r.comparePrice)); });
    await client.query(`INSERT INTO ostg VALUES ${v.join(',')}`, pr);
  }
  const ins = await client.query(`
    WITH cg AS (SELECT id FROM chains WHERE slug='city-gross'),
    ranked AS (
      SELECT DISTINCT ON (p.id) p.id product_id, o.price, o.cmp
      FROM ostg o JOIN products p ON p.slug='ean-'||o.ean WHERE o.price IS NOT NULL),
    ins AS (
      INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, (SELECT id FROM cg), NULL, 'online', price, COALESCE(cmp,price), 'SEK', false, $1::timestamptz, 0.9, jsonb_build_object('source','citygross-crawl'), 'grocery', true, 'SE' FROM ranked
      ON CONFLICT DO NOTHING RETURNING id, product_id, price, unit_price, observed_at)
    INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT product_id, (SELECT id FROM cg), NULL, 'online', id, price, unit_price, 'SEK', observed_at, 0.9, jsonb_build_object('source','citygross-crawl'), 'grocery', true, 'SE' FROM ins
    ON CONFLICT (product_id, chain_id, store_id, price_type) DO UPDATE SET price=EXCLUDED.price, unit_price=EXCLUDED.unit_price, observation_id=EXCLUDED.observation_id, observed_at=EXCLUDED.observed_at`, [NOW]);
  console.log(`city-gross: products=${nProds} national prices=${ins.rowCount}`);
}

async function loadCoop() {
  const rows = readNdjson(COOP);
  if (!rows.length) { console.log('coop: no file'); return; }
  await upsertProducts(rows, 'ean', 'categoryLabel');
  // region stores: one per productionUnitId, geocoded from an OSM coop store in the region city
  const regions = [...new Map(rows.map((r) => [r.productionUnitId, r])).values()];
  for (const reg of regions) {
    const city = String(reg.regionLabel || '').split('-')[0].trim();
    await client.query(`
      INSERT INTO stores (chain_id, slug, external_ref, name, address_line1, city, country_code, store_type, opening_hours, position, domain, market_code, supported_fuel_grade_ids)
      SELECT c.id, $1, $2, $3, '—', $4, 'SE', 'supermarket', '{}'::jsonb,
        (SELECT o.position FROM stores o JOIN chains oc ON oc.id=o.chain_id WHERE oc.slug='coop' AND o.position IS NOT NULL AND (lower(o.city)=lower($4) OR lower(o.name) LIKE '%'||lower($4)||'%') LIMIT 1),
        'grocery','SE','{}'
      FROM chains c WHERE c.slug='coop'
      ON CONFLICT (slug) DO UPDATE SET position=COALESCE(stores.position, EXCLUDED.position), city=EXCLUDED.city`,
      [`coop-region-${reg.productionUnitId}`, reg.productionUnitId, `Coop ${reg.regionLabel}`, city]);
  }
  await client.query(`DROP TABLE IF EXISTS rstg`);
  await client.query(`CREATE TEMP TABLE rstg (ean text, puid text, price numeric, cmp numeric)`);
  for (let b = 0; b < rows.length; b += 700) {
    const sl = rows.slice(b, b + 700); const v = []; const pr = [];
    sl.forEach((r, i) => { const o = i * 4; v.push(`($${o+1},$${o+2},$${o+3},$${o+4})`); pr.push(String(r.ean).trim(), String(r.productionUnitId), num(r.price), num(r.comparePrice)); });
    await client.query(`INSERT INTO rstg VALUES ${v.join(',')}`, pr);
  }
  const ins = await client.query(`
    WITH cp AS (SELECT id FROM chains WHERE slug='coop'),
    ranked AS (
      SELECT DISTINCT ON (p.id, s.id) p.id product_id, s.id store_id, r.price, r.cmp
      FROM rstg r JOIN products p ON p.slug='ean-'||r.ean
      JOIN stores s ON s.slug='coop-region-'||r.puid
      WHERE r.price IS NOT NULL),
    ins AS (
      INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, (SELECT id FROM cp), store_id, 'shelf', price, COALESCE(cmp,price), 'SEK', false, $1::timestamptz, 0.9, jsonb_build_object('source','coop-crawl'), 'grocery', true, 'SE' FROM ranked
      ON CONFLICT DO NOTHING RETURNING id, product_id, store_id, price, unit_price, observed_at)
    INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT product_id, (SELECT id FROM cp), store_id, 'shelf', id, price, unit_price, 'SEK', observed_at, 0.9, jsonb_build_object('source','coop-crawl'), 'grocery', true, 'SE' FROM ins
    ON CONFLICT (product_id, chain_id, store_id, price_type) DO UPDATE SET price=EXCLUDED.price, unit_price=EXCLUDED.unit_price, observation_id=EXCLUDED.observation_id, observed_at=EXCLUDED.observed_at`, [NOW]);
  const vary = await client.query(`
    SELECT count(*) FROM (SELECT product_id FROM latest_prices WHERE provenance->>'source'='coop-crawl' AND store_id IS NOT NULL GROUP BY product_id HAVING count(DISTINCT price)>1) x`);
  console.log(`coop: regions=${regions.length} regional prices=${ins.rowCount} products varying across regions=${vary.rows[0].count}`);
}

try {
  await client.query('BEGIN');
  await loadCityGross();
  await loadCoop();
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK'); console.error('FAILED (rolled back):', e.message); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
