#!/usr/bin/env node
// Backfill products.image_url from the committed ingested files (the retailer image URLs are
// already captured there — no scraping needed). Matches Axfood products by ean-<gtin> slug and
// ICA products by ica-<productId> slug.
import { readFileSync, readdirSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const ING = new URL('../../apps/web/src/lib/ingested/', import.meta.url);

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

const pairs = []; // {slug, url}
// Axfood chains -> ean slug
for (const [file, arr] of [['willys.ts','willysProducts'],['hemkop.ts','hemkopProducts'],['coop.ts','coopProducts'],['citygross.ts','cityGrossProducts']]) {
  let products = [];
  try { products = extractArray(readFileSync(new URL(file, ING), 'utf8'), arr); } catch (e) { console.error(`skip ${file}: ${e.message}`); continue; }
  let n = 0;
  for (const p of products) { const ean = eanFrom(p); if (ean && p.imageUrl) { pairs.push({ slug: `ean-${ean}`, url: p.imageUrl }); n++; } }
  console.error(`${file}: ${n} image URLs`);
}
// ICA chunks -> ica-<productId> slug
const icaDir = new URL('ica-products/', ING);
for (const f of readdirSync(icaDir).filter((f) => /^chunk-\d+\.ts$/.test(f)).sort()) {
  const name = 'icaProductsChunk' + f.match(/chunk-(\d+)/)[1];
  let products = [];
  try { products = extractArray(readFileSync(new URL(f, icaDir), 'utf8'), name); } catch (e) { console.error(`skip ${f}: ${e.message}`); continue; }
  let n = 0;
  for (const p of products) { if (p.productId && p.imageUrl) { pairs.push({ slug: `ica-${p.productId}`, url: p.imageUrl }); n++; } }
  console.error(`${f}: ${n} image URLs`);
}
console.error(`total image pairs: ${pairs.length}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('CREATE TEMP TABLE img (slug text, url text) ON COMMIT DROP');
  const batch = 1000;
  for (let b = 0; b < pairs.length; b += batch) {
    const slice = pairs.slice(b, b + batch);
    const vals = []; const params = [];
    slice.forEach((x, i) => { vals.push(`($${i*2+1},$${i*2+2})`); params.push(x.slug, x.url); });
    await client.query(`INSERT INTO img VALUES ${vals.join(',')}`, params);
  }
  await client.query('CREATE INDEX ON img(slug)');
  const res = await client.query(`
    UPDATE products SET image_url = img.url, updated_at = now()
    FROM (SELECT DISTINCT ON (slug) slug, url FROM img) img
    WHERE products.slug = img.slug AND (products.image_url IS NULL OR products.image_url = '')`);
  await client.query('COMMIT');
  console.log(JSON.stringify({ imagePairs: pairs.length, productsUpdated: res.rowCount }, null, 2));
} catch (e) {
  await client.query('ROLLBACK'); console.error('BACKFILL FAILED (rolled back):', e.message); process.exitCode = 1;
} finally { client.release(); await pool.end(); }
