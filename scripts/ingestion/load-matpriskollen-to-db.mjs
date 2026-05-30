#!/usr/bin/env node
// Load Matpriskollen per-STORE offers into the DB — the only source with real price variation
// across stores/locations. Creates a store row per Matpriskollen store (mapped to its chain,
// geolocated from OSM where the name matches) and a per-(product,store) price observation.
// This makes price genuinely multivariate: f(chain, store, product, time).
import { readFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const ING = new URL('../../apps/web/src/lib/ingested/matpriskollen.ts', import.meta.url);
function extractArray(text, name) {
  const decl = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(text);
  if (!decl) return [];
  let i = decl.index + decl[0].length - 1, depth = 0, inStr = false, esc = false, start = i;
  for (; i < text.length; i++) { const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '[') depth++; else if (ch === ']') { if (--depth === 0) return JSON.parse(text.slice(start, i + 1)); } }
  return [];
}
function chainOf(store) {
  const s = (store || '').toLowerCase();
  if (s.includes('willys')) return 'willys';
  if (s.includes('hemköp') || s.includes('hemkop')) return 'hemkop';
  if (s.includes('city gross') || s.includes('citygross')) return 'city-gross';
  if (s.includes('lidl')) return 'lidl';
  if (s.includes('coop')) return 'coop';
  if (s.includes('ica')) return 'ica';
  return null;
}
// "2 för 30,00" -> 15; "29,90 kr" -> 29.9
function parsePrice(text) {
  if (!text) return null;
  const multi = String(text).match(/(\d+)\s*för\s*([\d.,]+)/i);
  if (multi) { const qty = Number(multi[1]); const tot = Number(multi[2].replace(',', '.')); if (qty > 0 && tot > 0) return Math.round((tot / qty) * 100) / 100; }
  const m = String(text).replace(/\s/g, '').match(/([\d]+[.,][\d]+|[\d]+)/);
  const n = m ? Number(m[1].replace(',', '.')) : null;
  return Number.isFinite(n) && n > 0 ? n : null;
}

const offers = extractArray(readFileSync(ING, 'utf8'), 'matpriskollenOffers');
const rows = [];
for (const o of offers) {
  const chain = chainOf(o.store); if (!chain || !o.storeId || !o.name) continue;
  const price = parsePrice(o.regularPriceText) ?? parsePrice(o.priceText); if (!price) continue;
  // Product identity = normalized name + brand (+ package), SHARED across stores, so the same
  // product priced at different branches groups under one product_id -> real per-store variation.
  const key = `${o.name}-${o.brand || ''}-${o.packageText || ''}`.toLowerCase()
    .normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  rows.push({
    chain, storeRef: String(o.storeId), storeName: String(o.store).slice(0, 200),
    prodSlug: `mpk-${key}`, name: String(o.name).slice(0, 300), brand: o.brand ? String(o.brand).slice(0, 120) : null,
    category: o.category || 'Grocery', image: o.imageUrl || null, price, observed_at: o.retrievedAt || '2026-05-24T00:00:00.000Z'
  });
}
const stores = [...new Map(rows.map(r => [r.chain + ':' + r.storeRef, r])).values()];
const prods = [...new Map(rows.map(r => [r.prodSlug, r])).values()];
console.error(`offers:${rows.length} stores:${stores.length} products:${prods.length}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // stores: slug mpk-<chain>-<storeRef>; geolocate from an OSM store whose name matches, else null
  for (const s of stores) {
    await client.query(`
      INSERT INTO stores (chain_id, slug, external_ref, name, address_line1, city, country_code, store_type, opening_hours, position, domain, market_code, supported_fuel_grade_ids)
      SELECT c.id, $2, $3, $4, '—', '—', 'SE', 'supermarket', '{}'::jsonb,
             (SELECT o.position FROM stores o JOIN chains oc ON oc.id=o.chain_id WHERE oc.slug=$1 AND o.position IS NOT NULL AND lower(o.name)=lower($4) LIMIT 1),
             'grocery', 'SE', '{}'
      FROM chains c WHERE c.slug=$1 ON CONFLICT (slug) DO NOTHING`,
      [s.chain, `mpk-${s.chain}-${s.storeRef}`, s.storeRef, s.storeName]);
  }
  // products
  await client.query(`CREATE TEMP TABLE pstg (slug text, name text, brand text, category text, image text) ON COMMIT DROP`);
  for (let b = 0; b < prods.length; b += 500) {
    const sl = prods.slice(b, b+500); const v=[]; const pr=[];
    sl.forEach((p,i)=>{const o=i*5; v.push(`($${o+1},$${o+2},$${o+3},$${o+4},$${o+5})`); pr.push(p.prodSlug,p.name,p.brand,p.category,p.image);});
    await client.query(`INSERT INTO pstg VALUES ${v.join(',')}`, pr);
  }
  await client.query(`INSERT INTO products (slug,canonical_name,brand,category_path,comparable_unit,image_url,domain,market_code,product_kind)
    SELECT DISTINCT ON (slug) slug,name,brand,ARRAY[category],'st',image,'grocery','SE','branded' FROM pstg ORDER BY slug
    ON CONFLICT (slug) DO NOTHING`);
  // per-(product,store) observations + latest_prices (store_id set -> price_type 'shelf')
  await client.query(`CREATE TEMP TABLE ostg (prod text, store text, price numeric, observed_at timestamptz) ON COMMIT DROP`);
  for (let b = 0; b < rows.length; b += 500) {
    const sl = rows.slice(b, b+500); const v=[]; const pr=[];
    sl.forEach((r,i)=>{const o=i*4; v.push(`($${o+1},$${o+2},$${o+3},$${o+4})`); pr.push(r.prodSlug, `mpk-${r.chain}-${r.storeRef}`, r.price, r.observed_at);});
    await client.query(`INSERT INTO ostg VALUES ${v.join(',')}`, pr);
  }
  const res = await client.query(`
    WITH ranked AS (
      SELECT DISTINCT ON (p.id, s.id) p.id product_id, s.chain_id, s.id store_id, o.price, o.observed_at
      FROM ostg o JOIN products p ON p.slug=o.prod JOIN stores s ON s.slug=o.store
      ORDER BY p.id, s.id, o.observed_at DESC
    ), ins AS (
      INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, chain_id, store_id, 'shelf', price, price, 'SEK', false, observed_at, 0.6, jsonb_build_object('source','matpriskollen'), 'grocery', true, 'SE' FROM ranked
      ON CONFLICT DO NOTHING
      RETURNING id, product_id, chain_id, store_id, price, observed_at)
    INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT product_id, chain_id, store_id, 'shelf', id, price, price, 'SEK', observed_at, 0.6, jsonb_build_object('source','matpriskollen'), 'grocery', true, 'SE' FROM ins
    ON CONFLICT DO NOTHING`);
  await client.query('COMMIT');
  const v = await client.query(`SELECT count(*) AS products_varying_across_stores FROM (SELECT product_id FROM latest_prices WHERE provenance->>'source'='matpriskollen' GROUP BY product_id HAVING count(DISTINCT price)>1) x`);
  console.log('matpriskollen per-store prices loaded; products varying across stores:', v.rows[0].products_varying_across_stores);
} catch (e) { await client.query('ROLLBACK'); console.error('FAILED (rolled back):', e.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
