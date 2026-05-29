#!/usr/bin/env node
// Load committed per-chain ingested files into the database as the source of truth:
// staging -> products (EAN-keyed for cross-chain matching) -> observations -> latest_prices.
// Idempotent-ish: products upsert on slug; latest_prices refreshed per (product, chain).
import { readFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const ING = new URL('../../apps/web/src/lib/ingested/', import.meta.url);
const SOURCES = [
  { file: 'willys.ts', chain: 'willys', arr: 'willysProducts' },
  { file: 'hemkop.ts', chain: 'hemkop', arr: 'hemkopProducts' },
  { file: 'coop.ts', chain: 'coop', arr: 'coopProducts' },
  { file: 'citygross.ts', chain: 'city-gross', arr: 'cityGrossProducts' }
];

function extractArray(text, name) {
  const decl = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(text);
  if (!decl) return [];
  let i = decl.index + decl[0].length - 1, depth = 0, inStr = false, esc = false, start = i;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '[') depth++; else if (ch === ']') { if (--depth === 0) return JSON.parse(text.slice(start, i + 1)); }
  }
  return [];
}
function eanFrom(row) {
  const x = row.ean || row.gtin;
  if (x && /^\d{8,14}$/.test(String(x))) return String(x).replace(/^0+(?=\d{13}$)/, '');
  const m = typeof row.imageUrl === 'string' ? row.imageUrl.match(/\/(0?\d{13})(?:[_./]|$)/) : null;
  return m ? m[1].replace(/^0+(?=\d{13}$)/, '') : null;
}
function parsePack(t) {
  const m = typeof t === 'string' ? t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|dl|st|pack|pcs)\b/i) : null;
  return m ? { size: Number(m[1].replace(',', '.')), unit: m[2].toLowerCase() } : { size: null, unit: null };
}
const num = (v) => { const n = Number(String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };

// Build candidate rows
const candidates = [];
for (const src of SOURCES) {
  let products = [];
  try { products = extractArray(readFileSync(new URL(src.file, ING), 'utf8'), src.arr); }
  catch (e) { console.error(`skip ${src.file}: ${e.message}`); continue; }
  let kept = 0;
  for (const p of products) {
    const price = num(p.price); if (!p.name || !price) continue;
    const ean = eanFrom(p); const { size, unit } = parsePack(p.packageText);
    const comparable = unit === 'g' ? 'kg' : unit === 'ml' ? 'l' : (unit || 'st');
    candidates.push({
      slug: ean ? `ean-${ean}` : `${src.chain}-${String(p.code || p.name)}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120),
      name: String(p.name).slice(0, 300), brand: p.brand ? String(p.brand).slice(0, 120) : null,
      barcode: ean, chain: src.chain, price, unit_price: num(p.unitPrice) ?? num(p.unitPriceText) ?? price,
      size, unit, comparable, category: p.superCategory || p.category || 'Grocery',
      observed_at: p.retrievedAt || '2026-05-25T00:00:00.000Z'
    });
    kept++;
  }
  console.error(`${src.chain}: ${kept} candidates`);
}
console.error(`total candidates: ${candidates.length}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(`CREATE TEMP TABLE stg (slug text, name text, brand text, barcode text, chain text, price numeric, unit_price numeric, size numeric, unit text, comparable text, category text, observed_at timestamptz) ON COMMIT DROP`);
  // batch insert into staging
  const cols = 12; const batchSize = 800;
  for (let b = 0; b < candidates.length; b += batchSize) {
    const slice = candidates.slice(b, b + batchSize);
    const values = []; const params = [];
    slice.forEach((c, i) => {
      const o = i * cols;
      values.push(`($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8},$${o+9},$${o+10},$${o+11},$${o+12})`);
      params.push(c.slug, c.name, c.brand, c.barcode, c.chain, c.price, c.unit_price, c.size, c.unit, c.comparable, c.category, c.observed_at);
    });
    await client.query(`INSERT INTO stg VALUES ${values.join(',')}`, params);
  }
  // 1) products upsert (one row per slug; cheapest candidate provides display fields)
  await client.query(`
    INSERT INTO products (slug, canonical_name, brand, barcode, category_path, package_size, package_unit, comparable_unit, domain, market_code, product_kind)
    SELECT DISTINCT ON (slug) slug, name, brand, barcode, ARRAY[category], size, unit, comparable, 'grocery', 'SE', 'branded'
    FROM stg ORDER BY slug, price ASC
    ON CONFLICT (slug) DO NOTHING`);
  // 2) observations (one per candidate row), 3) latest_prices (cheapest obs per product+chain)
  await client.query(`
    WITH ranked AS (
      SELECT DISTINCT ON (p.id, c.id) p.id AS product_id, c.id AS chain_id, s.price, s.unit_price, s.observed_at, s.chain
      FROM stg s JOIN products p ON p.slug = s.slug JOIN chains c ON c.slug = s.chain
      ORDER BY p.id, c.id, s.price ASC
    ), ins_obs AS (
      INSERT INTO observations (product_id, chain_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, chain_id, 'online', price, unit_price, 'SEK', false, observed_at, 0.6,
             jsonb_build_object('source','ingested-file', 'chain', chain), 'grocery', true, 'SE'
      FROM ranked
      RETURNING id, product_id, chain_id, price_type, price, unit_price, observed_at, confidence
    )
    INSERT INTO latest_prices (product_id, chain_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT DISTINCT ON (product_id, chain_id) product_id, chain_id, price_type, id, price, unit_price, 'SEK', observed_at, confidence,
           jsonb_build_object('source','ingested-file'), 'grocery', true, 'SE'
    FROM ins_obs ORDER BY product_id, chain_id, price ASC
    ON CONFLICT DO NOTHING`);
  await client.query('COMMIT');
  const r = await client.query(`SELECT c.slug, count(*) n, count(distinct lp.product_id) prods FROM latest_prices lp JOIN chains c ON c.id=lp.chain_id GROUP BY c.slug ORDER BY n DESC`);
  console.log('chains in DB:', JSON.stringify(r.rows));
} catch (e) {
  await client.query('ROLLBACK'); console.error('LOAD FAILED (rolled back):', e.message); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
