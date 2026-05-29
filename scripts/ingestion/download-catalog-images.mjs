#!/usr/bin/env node
// Download the catalog's product images from the retailer CDNs and save them locally, then
// rewrite the catalog so the site serves /product-images/<file> instead of hotlinking the CDN.
// Local artifact (apps/web/public/product-images is gitignored). Scoped to the catalog (~600).
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const CATALOG = new URL('../../apps/web/src/lib/generated/db-site-products.ts', import.meta.url);
const OUTDIR = new URL('../../apps/web/public/product-images/', import.meta.url);
mkdirSync(OUTDIR, { recursive: true });

const text = readFileSync(CATALOG, 'utf8');
const arr = JSON.parse(text.slice(text.indexOf('= [') + 2, text.lastIndexOf('];') + 1));

function extOf(url) { const m = url.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)$/i); return m ? m[1].toLowerCase() : 'jpg'; }
async function fetchTo(url, file) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 GroceryView/local' } });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return false;
    writeFileSync(file, buf);
    return true;
  } catch { return false; } finally { clearTimeout(t); }
}

const targets = arr.filter((p) => typeof p.image === 'string' && p.image.startsWith('http'));
let ok = 0, fail = 0, done = 0;
const CONC = 8;
async function worker(items) {
  for (const p of items) {
    const fname = `${p.slug}.${extOf(p.image)}`;
    const fpath = new URL(fname, OUTDIR);
    const local = `/product-images/${fname}`;
    if (existsSync(fpath)) { p.image = local; ok++; }
    else if (await fetchTo(p.image, fpath)) { p.image = local; ok++; }
    else { fail++; }
    if (++done % 100 === 0) console.error(`  ${done}/${targets.length} (ok ${ok}, fail ${fail})`);
  }
}
// split into CONC lanes
const lanes = Array.from({ length: CONC }, (_, i) => targets.filter((_, idx) => idx % CONC === i));
await Promise.all(lanes.map(worker));

// rewrite catalog with local image paths
const header = text.slice(0, text.indexOf('export const dbSiteAxfoodProducts'));
const out = header + `export const dbSiteAxfoodProducts: AxfoodProduct[] = ${JSON.stringify(arr, null, 2)};\n`;
writeFileSync(CATALOG, out);
console.log(JSON.stringify({ targets: targets.length, saved: ok, failed: fail }, null, 2));
