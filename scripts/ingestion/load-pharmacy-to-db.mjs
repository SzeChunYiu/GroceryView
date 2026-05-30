#!/usr/bin/env node
// Load Apohem pharmacy products (domain=pharmacy) from the committed ingested file into the DB:
// chains(apohem) -> products -> observations -> latest_prices, with EAN + image_url.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const ING = new URL('../../apps/web/src/lib/ingested/apohem.ts', import.meta.url);

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
function parsePack(t) {
  const m = typeof t === 'string' ? t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|dl|st|pack|pcs|tabletter|kapslar)\b/i) : null;
  if (!m) return { size: null, unit: null };
  let u = m[2].toLowerCase();
  return { size: Number(m[1].replace(',', '.')), unit: ['tabletter','kapslar','pcs','pack'].includes(u) ? 'st' : u };
}
const num = (v) => { const n = Number(String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };

const products = extractArray(readFileSync(ING, 'utf8'), 'apohemProducts');
const rows = [];
for (const p of products) {
  const price = num(p.price); const ean = p.ean && /^\d{8,14}$/.test(String(p.ean)) ? String(p.ean) : null;
  if (!p.name || !price || !ean) continue;
  const { size, unit } = parsePack(p.name);
  rows.push({
    slug: `ean-${ean}`, name: String(p.name).slice(0, 300), brand: p.brand ? String(p.brand).slice(0, 120) : null,
    barcode: ean, price, unit_price: price, size, unit, comparable: unit || 'st',
    category: p.category || 'pharmacy', image: p.imageUrl || null, observed_at: p.retrievedAt || '2026-05-24T00:00:00.000Z'
  });
}
console.error(`apohem pharmacy candidates: ${rows.length}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ensure apohem pharmacy chain exists
  await client.query(`INSERT INTO chains (slug, name, retailer_type, country_code, domain, market_code)
    VALUES ('apohem','Apohem','pharmacy','SE','pharmacy','SE') ON CONFLICT (slug) DO NOTHING`);
  await client.query(`CREATE TEMP TABLE stg (slug text, name text, brand text, barcode text, price numeric, unit_price numeric, size numeric, unit text, comparable text, category text, image text, observed_at timestamptz) ON COMMIT DROP`);
  const cols = 12, batch = 800;
  for (let b = 0; b < rows.length; b += batch) {
    const slice = rows.slice(b, b + batch); const vals = []; const params = [];
    slice.forEach((c, i) => { const o = i*cols; vals.push(`(${Array.from({length:cols},(_,k)=>'$'+(o+k+1)).join(',')})`); params.push(c.slug,c.name,c.brand,c.barcode,c.price,c.unit_price,c.size,c.unit,c.comparable,c.category,c.image,c.observed_at); });
    await client.query(`INSERT INTO stg VALUES ${vals.join(',')}`, params);
  }
  await client.query(`
    INSERT INTO products (slug, canonical_name, brand, barcode, category_path, package_size, package_unit, comparable_unit, image_url, domain, market_code, product_kind)
    SELECT DISTINCT ON (slug) slug, name, brand, barcode, ARRAY[category], size, unit, comparable, image, 'pharmacy', 'SE', 'branded'
    FROM stg ORDER BY slug, price ASC ON CONFLICT (slug) DO UPDATE SET image_url = COALESCE(products.image_url, EXCLUDED.image_url)`);
  await client.query(`
    WITH ranked AS (
      SELECT DISTINCT ON (p.id, c.id) p.id product_id, c.id chain_id, s.price, s.unit_price, s.observed_at
      FROM stg s JOIN products p ON p.slug=s.slug JOIN chains c ON c.slug='apohem' ORDER BY p.id, c.id, s.price ASC
    ), ins AS (
      INSERT INTO observations (product_id, chain_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT product_id, chain_id, 'online', price, unit_price, 'SEK', false, observed_at, 0.6, jsonb_build_object('source','ingested-file','chain','apohem'), 'pharmacy', true, 'SE' FROM ranked
      RETURNING id, product_id, chain_id, price_type, price, unit_price, observed_at, confidence)
    INSERT INTO latest_prices (product_id, chain_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
    SELECT DISTINCT ON (product_id, chain_id) product_id, chain_id, price_type, id, price, unit_price, 'SEK', observed_at, confidence, jsonb_build_object('source','ingested-file'), 'pharmacy', true, 'SE'
    FROM ins ORDER BY product_id, chain_id, price ASC ON CONFLICT DO NOTHING`);
  await client.query('COMMIT');
  const r = await client.query(`SELECT count(*) n, count(*) FILTER (WHERE image_url IS NOT NULL) img FROM products WHERE domain='pharmacy'`);
  console.log('pharmacy products in DB:', JSON.stringify(r.rows[0]));
} catch (e) { await client.query('ROLLBACK'); console.error('FAILED (rolled back):', e.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
