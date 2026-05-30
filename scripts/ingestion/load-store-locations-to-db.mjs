#!/usr/bin/env node
// Load OpenStreetMap store locations (overpass.ts) into the stores table so every chain has a
// complete store directory (for the map / store list). Maps OSM brand -> chain; sets PostGIS
// position from lat/long. Prices stay where they are (ICA per-store; Axfood national).
import { readFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const ING = new URL('../../apps/web/src/lib/ingested/overpass.ts', import.meta.url);
function extractArray(text, name) {
  const decl = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(text);
  if (!decl) return [];
  let i = decl.index + decl[0].length - 1, depth = 0, inStr = false, esc = false, start = i;
  for (; i < text.length; i++) { const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '[') depth++; else if (ch === ']') { if (--depth === 0) return JSON.parse(text.slice(start, i + 1)); } }
  return [];
}
function chainOf(s) {
  const b = `${s.brand || ''} ${s.name || ''}`.toLowerCase();
  if (b.includes('willys')) return 'willys';
  if (b.includes('hemköp') || b.includes('hemkop')) return 'hemkop';
  if (b.includes('city gross') || b.includes('citygross')) return 'city-gross';
  if (b.includes('lidl')) return 'lidl';
  if (b.includes('coop')) return 'coop';
  if (b.includes('ica')) return 'ica';
  return null;
}

const stores = extractArray(readFileSync(ING, 'utf8'), 'overpassStores');
const rows = [];
for (const s of stores) {
  const chain = chainOf(s);
  const lat = Number(s.latitude), lng = Number(s.longitude);
  if (!chain || !s.osmId || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  rows.push({
    chain, slug: `osm-${s.osmId}`, ext: String(s.osmId), name: String(s.name || `${chain} store`).slice(0, 200),
    addr: [s.street, s.houseNumber].filter(Boolean).join(' ') || '—', city: s.city || '—',
    openingHours: s.openingHours ? JSON.stringify({ raw: s.openingHours }) : '{}',
    website: s.website || null, lng, lat
  });
}
const byChain = {}; for (const r of rows) byChain[r.chain] = (byChain[r.chain] || 0) + 1;
console.error('mappable OSM stores:', rows.length, JSON.stringify(byChain));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(`CREATE TEMP TABLE stg (chain text, slug text, ext text, name text, addr text, city text, opening_hours jsonb, website text, lng float8, lat float8) ON COMMIT DROP`);
  const cols = 10, batch = 700;
  for (let b = 0; b < rows.length; b += batch) {
    const slice = rows.slice(b, b + batch); const vals = []; const params = [];
    slice.forEach((r, i) => { const o = i*cols; vals.push(`(${Array.from({length:cols},(_,k)=>'$'+(o+k+1)).join(',')})`); params.push(r.chain,r.slug,r.ext,r.name,r.addr,r.city,r.openingHours,r.website,r.lng,r.lat); });
    await client.query(`INSERT INTO stg VALUES ${vals.join(',')}`, params);
  }
  const res = await client.query(`
    INSERT INTO stores (chain_id, slug, external_ref, name, address_line1, city, country_code, store_type, opening_hours, online_order_url, position, domain, market_code, supported_fuel_grade_ids)
    SELECT c.id, s.slug, s.ext, s.name, s.addr, s.city, 'SE', 'supermarket', s.opening_hours, s.website,
           ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography, 'grocery', 'SE', '{}'
    FROM stg s JOIN chains c ON c.slug = s.chain
    ON CONFLICT (slug) DO NOTHING`);
  await client.query('COMMIT');
  const r = await client.query(`SELECT c.slug, count(*) FROM stores s JOIN chains c ON c.id=s.chain_id GROUP BY c.slug ORDER BY count(*) DESC`);
  console.log('inserted:', res.rowCount, '| stores per chain:', JSON.stringify(r.rows));
} catch (e) { await client.query('ROLLBACK'); console.error('FAILED (rolled back):', e.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
