#!/usr/bin/env node
// LOCAL-ONLY: build a multi-chain site catalog (apps/web/src/lib/generated/db-site-products.ts)
// from the committed per-chain ingested data files. Products are matched ACROSS chains by EAN
// (explicit ean/gtin field, or the GTIN embedded in the Axfood image URL), so the same product
// in multiple chains collapses into one entry with per-chain prices -> real comparison.
// Not part of the production pipeline; a developer convenience to view all chains locally.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildDbSiteAxfoodProducts } from './export-db-site-snapshot.mjs';

const ING = new URL('../../apps/web/src/lib/ingested/', import.meta.url);
const OUT = new URL('../../apps/web/src/lib/generated/db-site-products.ts', import.meta.url);

// chain file -> { chainSlug, export array name }
const SOURCES = [
  { file: 'willys.ts', chain: 'willys', arr: 'willysProducts' },
  { file: 'hemkop.ts', chain: 'hemkop', arr: 'hemkopProducts' },
  { file: 'coop.ts', chain: 'coop', arr: 'coopProducts' },
  { file: 'citygross.ts', chain: 'city_gross', arr: 'cityGrossProducts' },
  { file: 'ica.ts', chain: 'ica', arr: 'icaProducts' }
];

// Slice a `export const NAME: T[] = [ ... ];` array out of a .ts module and JSON.parse it.
function extractArray(text, name) {
  const decl = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(text);
  if (!decl) return [];
  let i = decl.index + decl[0].length - 1; // at the opening '['
  let depth = 0, inStr = false, esc = false, start = i;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { return JSON.parse(text.slice(start, i + 1)); } }
  }
  return [];
}

function eanFrom(row) {
  const explicit = row.ean || row.gtin;
  if (explicit && /^\d{8,14}$/.test(String(explicit))) return String(explicit).replace(/^0+(?=\d{13}$)/, '');
  const m = typeof row.imageUrl === 'string' ? row.imageUrl.match(/\/(0?\d{13})(?:[_./]|$)/) : null;
  if (m) return m[1].replace(/^0+(?=\d{13}$)/, '');
  return null;
}
function parsePack(text) {
  const m = typeof text === 'string' ? text.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|dl|st|pack|pcs)\b/i) : null;
  if (!m) return { packageSize: null, packageUnit: null };
  return { packageSize: Number(m[1].replace(',', '.')), packageUnit: m[2].toLowerCase() };
}
function num(v) { const n = Number(String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : null; }

const rows = [];
for (const src of SOURCES) {
  let products = [];
  try { products = extractArray(readFileSync(new URL(src.file, ING), 'utf8'), src.arr); }
  catch (e) { console.error(`skip ${src.file}: ${e.message}`); continue; }
  let kept = 0;
  for (const p of products) {
    const price = num(p.price);
    if (!p.name || !Number.isFinite(price) || price <= 0) continue;
    const ean = eanFrom(p);
    const { packageSize, packageUnit } = parsePack(p.packageText);
    const unitPrice = num(p.unitPrice) ?? num(p.unitPriceText);
    rows.push({
      productSlug: ean ? `ean-${ean}` : `${src.chain}-${p.code || p.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      canonicalName: p.name,
      chainSlug: src.chain,
      chainName: src.chain,
      price,
      regularPrice: num(p.regularPrice),
      unitPrice,
      brand: p.brand || '',
      packageSize,
      packageUnit,
      comparableUnit: packageUnit === 'g' ? 'kg' : packageUnit === 'ml' ? 'l' : (packageUnit || 'st'),
      categoryPath: [p.superCategory || p.category || 'Grocery'].filter(Boolean),
      imageUrl: p.imageUrl || '',
      observedAt: p.retrievedAt || '2026-05-25T00:00:00.000Z',
      isAvailable: p.outOfStock !== true
    });
    kept++;
  }
  console.error(`${src.chain}: ${kept} priced products`);
}

// Build products (grouped by productSlug -> EAN matches merge chains), then prefer multi-chain
// (comparable) products and cap the catalog so the generated module stays a reasonable size.
const all = buildDbSiteAxfoodProducts(rows);
const multi = all.filter((p) => (p.inChains || []).length >= 2);
const single = all.filter((p) => (p.inChains || []).length < 2);
// Keep the catalog small enough for fast builds/compare. Prefer multi-chain (comparable)
// products with a plausible (non-promo-noise) spread first; drop the extreme outliers that
// are usually a campaign price compared against a regular price.
const plausible = multi.filter((p) => (p.spreadPct ?? 0) <= 40).sort((a, b) => (b.spreadPct ?? 0) - (a.spreadPct ?? 0));
const rest = multi.filter((p) => (p.spreadPct ?? 0) > 40);
const catalog = [...plausible, ...rest, ...single].slice(0, 600);

const text = [
  '// Generated locally from committed multi-chain ingested files (generate-multichain-catalog.mjs).',
  '// Do not commit — production regenerates from the production DB during deploy.',
  "import type { AxfoodProduct } from '../axfood-products';",
  '',
  `export const dbSiteSnapshotGeneratedAt = ${JSON.stringify('2026-05-25T00:00:00.000Z')};`,
  `export const dbSiteAxfoodProducts: AxfoodProduct[] = ${JSON.stringify(catalog, null, 2)};`,
  ''
].join('\n');
writeFileSync(OUT, text);
console.log(JSON.stringify({ totalCandidates: rows.length, builtProducts: all.length, multiChain: multi.length, catalogWritten: catalog.length }, null, 2));
