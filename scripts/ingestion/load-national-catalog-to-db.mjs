#!/usr/bin/env node
// Generic loader for NATIONAL, EAN-keyed catalogs (pharmacy, beauty). One NDJSON file with mixed chains:
//   {chain, ean, name, brand, price, comparePrice|ordinaryPrice, category, varunr|sku, rx?}
// Products are EAN-keyed within a domain (slug `<domain>-ean-<ean>`) so all chains in that domain compare
// by EAN; products without an EAN fall back to a chain-scoped slug (stay chain-specific, no false matches).
// Prices are national: store_id NULL, price_type 'online' (per the observations CHECK).
//   usage: node load-national-catalog-to-db.mjs <file.ndjson> <domain> <retailer_type>
import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const [, , FILE, DOMAIN, RTYPE] = process.argv;
if (!FILE || !DOMAIN) { console.error('usage: load-national-catalog-to-db.mjs <file> <domain> [retailer_type]'); process.exit(1); }
const retailerType = RTYPE || DOMAIN;
const NOW = new Date().toISOString();
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
const titleCase = (s) => s.replace(/(^|[-\s])([a-z])/g, (_, p, c) => p + c.toUpperCase());

if (!existsSync(FILE)) { console.error('no file', FILE); process.exit(1); }
const rows = readFileSync(FILE, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  .map((r) => {
    const ean = String(r.ean || '').replace(/[^0-9]/g, '');
    const alt = String(r.varunr || r.sku || r.code || '').trim();
    const price = num(r.price);
    return { chain: r.chain, ean, alt, name: r.name, brand: r.brand || null,
      cat: r.category || titleCase(DOMAIN), price, cmp: num(r.comparePrice) || num(r.ordinaryPrice),
      slug: ean ? `${DOMAIN}-ean-${ean}`
        : (alt ? `${DOMAIN}-${r.chain}-${alt}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null) };
  })
  .filter((r) => r.chain && r.slug && r.name && r.price);

const chains = [...new Set(rows.map((r) => r.chain))];
console.error(`rows:${rows.length} chains:${JSON.stringify(chains)} products:${new Set(rows.map((r) => r.slug)).size}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ensure chains exist
  for (const c of chains) {
    await client.query(`
      INSERT INTO chains (slug, name, retailer_type, country_code, domain, market_code, pricing_model, created_at, updated_at)
      VALUES ($1, $2, $3, 'SE', $4, 'SE', 'national', $5::timestamptz, $5::timestamptz)
      ON CONFLICT (slug) DO NOTHING`, [c, titleCase(c.replace(/-/g, ' ')), retailerType, DOMAIN, NOW]);
  }
  // products (one row per slug; EAN slugs shared across chains in this domain)
  await client.query(`DROP TABLE IF EXISTS pstg`);
  await client.query(`CREATE TEMP TABLE pstg (slug text, name text, brand text, category text)`);
  const prods = [...new Map(rows.map((r) => [r.slug, r])).values()];
  for (let b = 0; b < prods.length; b += 500) {
    const sl = prods.slice(b, b + 500); const v = []; const pr = [];
    sl.forEach((p, i) => { const o = i * 4; v.push(`($${o+1},$${o+2},$${o+3},$${o+4})`);
      pr.push(p.slug, String(p.name).slice(0, 300), p.brand ? String(p.brand).slice(0, 120) : null, String(p.cat).slice(0, 120)); });
    await client.query(`INSERT INTO pstg VALUES ${v.join(',')}`, pr);
  }
  await client.query(`
    INSERT INTO products (slug, canonical_name, brand, barcode, category_path, comparable_unit, domain, market_code, product_kind)
    SELECT DISTINCT ON (slug) slug, name, brand, CASE WHEN slug LIKE '%-ean-%' THEN split_part(slug,'-ean-',2) ELSE NULL END,
           ARRAY[category], 'st', $1, 'SE', 'branded'
    FROM pstg ORDER BY slug
    ON CONFLICT (slug) DO UPDATE SET brand = COALESCE(products.brand, EXCLUDED.brand)`, [DOMAIN]);
  // prices (national): one row per (chain, product)
  await client.query(`DROP TABLE IF EXISTS ostg`);
  await client.query(`CREATE TEMP TABLE ostg (chain text, slug text, price numeric, cmp numeric)`);
  for (let b = 0; b < rows.length; b += 700) {
    const sl = rows.slice(b, b + 700); const v = []; const pr = [];
    sl.forEach((r, i) => { const o = i * 4; v.push(`($${o+1},$${o+2},$${o+3},$${o+4})`); pr.push(r.chain, r.slug, r.price, r.cmp); });
    await client.query(`INSERT INTO ostg VALUES ${v.join(',')}`, pr);
  }
  const ins = await client.query(`
    WITH ranked AS (
      SELECT DISTINCT ON (c.id, p.id) c.id chain_id, p.id product_id, o.price, o.cmp
      FROM ostg o JOIN products p ON p.slug=o.slug JOIN chains c ON c.slug=o.chain
      WHERE o.price IS NOT NULL),
    ins AS (
      INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, chain_id, NULL, 'online', price, COALESCE(cmp,price), 'SEK', false, $1::timestamptz, 0.9, jsonb_build_object('source',$2::text), $3, true, 'SE' FROM ranked
      ON CONFLICT DO NOTHING RETURNING id, product_id, chain_id, price, unit_price, observed_at)
    INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT product_id, chain_id, NULL, 'online', id, price, unit_price, 'SEK', observed_at, 0.9, jsonb_build_object('source',$2::text), $3, true, 'SE' FROM ins
    ON CONFLICT (product_id, chain_id, store_id, price_type) DO UPDATE SET price=EXCLUDED.price, unit_price=EXCLUDED.unit_price, observation_id=EXCLUDED.observation_id, observed_at=EXCLUDED.observed_at`,
    [NOW, `${DOMAIN}-crawl`, DOMAIN]);
  // comparability report
  const cmp = await client.query(`
    SELECT count(*) FILTER (WHERE chains>1) multi_chain, count(*) total FROM (
      SELECT p.id, count(DISTINCT lp.chain_id) chains FROM products p JOIN latest_prices lp ON lp.product_id=p.id
      WHERE lp.domain=$1 AND p.slug LIKE $1||'-ean-%' GROUP BY p.id) x`, [DOMAIN]);
  await client.query('COMMIT');
  console.log(`${DOMAIN}: prices=${ins.rowCount} | EAN products comparable across >1 chain: ${cmp.rows[0].multi_chain}/${cmp.rows[0].total}`);
} catch (e) {
  await client.query('ROLLBACK'); console.error('FAILED (rolled back):', e.message); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
