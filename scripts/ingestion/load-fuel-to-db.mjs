#!/usr/bin/env node
// Load fuel grade prices (OKQ8 + St1) into the DB as domain=fuel:
// chains(okq8,st1) -> products(one per fuel grade) -> observations -> latest_prices (price per litre).
import { readFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const ING = new URL('../../apps/web/src/lib/ingested/', import.meta.url);
function extractArray(text, name) {
  const decl = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(text);
  if (!decl) return [];
  let i = decl.index + decl[0].length - 1, depth = 0, inStr = false, esc = false, start = i;
  for (; i < text.length; i++) { const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '[') depth++; else if (ch === ']') { if (--depth === 0) return JSON.parse(text.slice(start, i + 1)); } }
  return [];
}
const rows = [];
for (const [file, arr, chain, op] of [
  ['okq8-fuel-prices.ts', 'okq8FuelPriceObservations', 'okq8', 'OKQ8'],
  ['st1-fuel-prices.ts', 'st1FuelPriceObservations', 'st1', 'St1']
]) {
  for (const o of extractArray(readFileSync(new URL(file, ING), 'utf8'), arr)) {
    if (!Number.isFinite(o.pricePerLitre) || o.pricePerLitre <= 0) continue;
    rows.push({ chain, op, grade: o.fuelGrade, slug: `fuel-${o.fuelGrade}`, name: o.gradeLabel || `Fuel ${o.fuelGrade}`,
      price: o.pricePerLitre, observed_at: o.observedAt || '2026-05-24T00:00:00.000Z' });
  }
}
console.error(`fuel grade prices: ${rows.length}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const [slug, name] of [['okq8', 'OKQ8'], ['st1', 'St1']])
    await client.query(`INSERT INTO chains (slug,name,retailer_type,country_code,domain,market_code) VALUES ($1,$2,'fuel','SE','fuel','SE') ON CONFLICT (slug) DO NOTHING`, [slug, name]);
  // one product per distinct grade
  const grades = [...new Map(rows.map(r => [r.slug, r])).values()];
  for (const g of grades)
    await client.query(`INSERT INTO products (slug,canonical_name,comparable_unit,domain,market_code,product_kind,package_unit) VALUES ($1,$2,'l','fuel','SE','commodity','l') ON CONFLICT (slug) DO NOTHING`, [g.slug, g.name]);
  for (const r of rows) {
    const obs = await client.query(`
      INSERT INTO observations (product_id, chain_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
      SELECT p.id, c.id, 'online', $3::numeric, $3::numeric, 'SEK', false, $4::timestamptz, 0.7, jsonb_build_object('source','fuel-ingested','operator',$5::text), 'fuel', true, 'SE'
      FROM products p, chains c WHERE p.slug=$1 AND c.slug=$2 RETURNING id, product_id, chain_id`, [r.slug, r.chain, r.price, r.observed_at, r.op]);
    if (obs.rows[0]) await client.query(`
      INSERT INTO latest_prices (product_id, chain_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
      VALUES ($1,$2,'online',$3,$4,$4,'SEK',$5,0.7, jsonb_build_object('source','fuel-ingested'), 'fuel', true, 'SE') ON CONFLICT DO NOTHING`,
      [obs.rows[0].product_id, obs.rows[0].chain_id, obs.rows[0].id, r.price, r.observed_at]);
  }
  await client.query('COMMIT');
  const res = await client.query(`SELECT c.slug, count(*) FROM latest_prices lp JOIN chains c ON c.id=lp.chain_id WHERE lp.domain='fuel' GROUP BY c.slug`);
  console.log('fuel in DB:', JSON.stringify(res.rows));
} catch (e) { await client.query('ROLLBACK'); console.error('FAILED (rolled back):', e.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
