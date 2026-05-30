#!/usr/bin/env node
// Crawl ICA's per-store catalog (handlaprivatkund.ica.se) to capture REAL per-branch shelf prices.
// First-party, no commercial API / partnership: the store-id is in the URL path and the endpoint is
// plain-curl accessible. price = f(chain, store, product, time) — the per-store price genuinely varies.
//
//   GET /stores/{storeId}/api/webproductpagews/v5/product-pages?retailerCategoryId={rcid}&limit=300&tag=web
//
// Coverage model (verified): the retailer category tree is GLOBAL across stores. A node returns at most
// 300 products (hard cap; limit>300 -> HTTP 400, offset past 300 is dead). A node with total<300 is fully
// retrieved; a node at total==300 is capped, so we recurse into its children. Every product therefore lives
// in some <300 node (leaves bottom out — verified Ost 267: children 165/37/137/48/168/9/18). We collect the
// set of <300 "fetch-target" categories ONCE (global tree), then fetch that set for every store. Products
// are deduped per (store, retailerProductId), so parent/child overlap is harmless.
//
// Output: newline-delimited JSON (one product-at-store row per line) under data/ica-crawl/<storeId>.ndjson.
// Resumable: a store file that already ends with a DONE marker is skipped.
//
// Usage:
//   node crawl-ica.mjs --discover            # (re)build the global fetch-target category list
//   node crawl-ica.mjs --stores 1004599,1003714
//   node crawl-ica.mjs --all [--limit N]     # all numeric ICA store refs from the DB
import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const OUT_DIR = path.join(ROOT, 'data', 'ica-crawl');
const LEAF_FILE = path.join(OUT_DIR, '_fetch-targets.json');
const BASE = 'https://handlaprivatkund.ica.se/stores';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CAP = 300;                 // hard page cap
const DISCOVER_STORE = '1004599';
const CONCURRENCY = 4;
const DELAY_MS = 250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT_DIR, { recursive: true });

async function fetchPage(storeId, rcid, limit = CAP, tries = 4) {
  const u = new URL(`${BASE}/${storeId}/api/webproductpagews/v5/product-pages`);
  if (rcid != null) u.searchParams.set('retailerCategoryId', String(rcid));
  u.searchParams.set('limit', String(limit));
  u.searchParams.set('tag', 'web');
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': UA, accept: 'application/json' } });
      if (res.status === 200) return await res.json();
      if (res.status === 404) return null; // store/category absent at this branch
      if (res.status === 400 && limit > CAP) throw new Error('limit too large');
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(DELAY_MS * (i + 1) * 2);
  }
  return null;
}

// Find every {retailerProductId, price:{amount}} dict anywhere in the payload — robust to shape changes.
function walkProducts(node, acc) {
  if (Array.isArray(node)) { for (const v of node) walkProducts(v, acc); return; }
  if (node && typeof node === 'object') {
    if (node.retailerProductId && node.price && typeof node.price === 'object') acc.push(node);
    for (const v of Object.values(node)) walkProducts(v, acc);
  }
}
function childCats(payload) {
  return (payload?.categories ?? []).filter((c) => c?.retailerCategoryId).map((c) => ({ rcid: String(c.retailerCategoryId), name: c.name }));
}

// Recurse the global tree from the 24 top categories; collect nodes with total<CAP as fetch-targets.
async function discover() {
  const top = await fetchPage(DISCOVER_STORE, null, 2);
  const roots = childCats(top);
  if (!roots.length) throw new Error('no top categories — endpoint shape changed');
  const targets = [];
  const stuck = [];
  const seen = new Set();
  async function visit(rcid, name) {
    if (seen.has(rcid)) return;
    seen.add(rcid);
    const p = await fetchPage(DISCOVER_STORE, rcid, 1);
    await sleep(DELAY_MS);
    if (!p) return;
    const total = Number(p.totalProducts ?? 0);
    const kids = childCats(p);
    if (total < CAP) {
      targets.push({ rcid, name, total });
    } else if (kids.length) {
      for (const k of kids) await visit(k.rcid, k.name);
    } else {
      stuck.push({ rcid, name, total }); // capped leaf with no children — would need brand partitioning
      targets.push({ rcid, name, total: CAP });
    }
  }
  for (const r of roots) await visit(r.rcid, r.name);
  const out = { discoveredAt: null, store: DISCOVER_STORE, count: targets.length, stuck, targets };
  writeFileSync(LEAF_FILE, JSON.stringify(out, null, 2));
  console.error(`discovered ${targets.length} fetch-target categories; ${stuck.length} capped-leaf(s) need brand partitioning`);
  if (stuck.length) console.error('STUCK:', JSON.stringify(stuck));
  return out;
}

function loadTargets() {
  if (!existsSync(LEAF_FILE)) throw new Error('run --discover first');
  return JSON.parse(readFileSync(LEAF_FILE, 'utf8')).targets;
}

const DONE = '#DONE';
function isStoreDone(storeId) {
  const f = path.join(OUT_DIR, `${storeId}.ndjson`);
  if (!existsSync(f) || statSync(f).size === 0) return false;
  const buf = readFileSync(f, 'utf8');
  return buf.trimEnd().endsWith(DONE);
}

async function crawlStore(storeId, targets) {
  const f = path.join(OUT_DIR, `${storeId}.ndjson`);
  // Liveness check: one cheap request. If the store has no online catalog (404 / no products),
  // mark it dead and skip the 296-category loop (avoids ~74s wasted per non-online store).
  const probe = await fetchPage(storeId, null, 2);
  await sleep(DELAY_MS);
  const probeAcc = [];
  if (probe) walkProducts(probe, probeAcc);
  if (!probe || probeAcc.length === 0) {
    writeFileSync(f, `${DONE} dead\n`);
    return { products: 0, pages: 0, dead: true };
  }
  const byProduct = new Map(); // retailerProductId -> row (dedupe across overlapping categories)
  let pages = 0;
  for (const t of targets) {
    const p = await fetchPage(storeId, t.rcid, CAP);
    await sleep(DELAY_MS);
    if (!p) continue;
    pages++;
    const acc = [];
    walkProducts(p, acc);
    for (const pr of acc) {
      const amount = pr.price?.amount;
      if (!pr.name || amount == null || Number(amount) <= 0) continue; // assert: real named priced product
      const rpid = String(pr.retailerProductId);
      if (byProduct.has(rpid)) continue;
      byProduct.set(rpid, {
        store: storeId,
        rpid,
        pid: pr.productId != null ? String(pr.productId) : null,
        name: String(pr.name).slice(0, 300),
        brand: pr.brand ? String(pr.brand).slice(0, 120) : null,
        pack: pr.packSizeDescription || null,
        price: Number(amount),
        unitPrice: pr.unitPrice?.price?.amount != null ? Number(pr.unitPrice.price.amount) : null,
        unit: pr.unitPrice?.unit || null,
        cat: Array.isArray(pr.categoryPath) ? pr.categoryPath[0] : t.name,
        rcid: t.rcid,
        image: pr.image || (Array.isArray(pr.imagePaths) ? pr.imagePaths[0] : null) || null
      });
    }
  }
  const lines = [...byProduct.values()].map((r) => JSON.stringify(r));
  writeFileSync(f, lines.join('\n') + `\n${DONE}\n`);
  return { products: byProduct.size, pages };
}

async function runPool(items, worker) {
  let i = 0, done = 0;
  const results = [];
  async function next() {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await worker(items[idx], idx); }
      catch (e) { results[idx] = { error: e.message }; }
      done++;
      if (done % 10 === 0 || done === items.length) console.error(`  ${done}/${items.length} stores`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next));
  return results;
}

async function resolveStores(arg) {
  if (arg.stores) return arg.stores.split(',').map((s) => s.trim()).filter(Boolean);
  if (arg.all) {
    const pg = (await import('pg')).default;
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
    const { rows } = await pool.query(
      `select s.external_ref from stores s join chains c on c.id=s.chain_id
       where c.slug='ica' and s.external_ref ~ '^100[0-9]+$' order by s.external_ref`);
    await pool.end();
    let ids = rows.map((r) => r.external_ref);
    if (arg.limit) ids = ids.slice(0, Number(arg.limit));
    return ids;
  }
  return [];
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--discover') a.discover = true;
    else if (t === '--all') a.all = true;
    else if (t === '--stores') a.stores = argv[++i];
    else if (t === '--limit') a.limit = argv[++i];
    else if (t === '--force') a.force = true;
  }
  return a;
}

const arg = parseArgs(process.argv.slice(2));
if (arg.discover) { await discover(); process.exit(0); }

const targets = loadTargets();
const stores = await resolveStores(arg);
if (!stores.length) { console.error('no stores (use --stores a,b or --all)'); process.exit(1); }
const todo = arg.force ? stores : stores.filter((s) => !isStoreDone(s));
console.error(`stores: ${stores.length} total, ${todo.length} to crawl, ${targets.length} categories each`);

const t0 = Date.now;
const res = await runPool(todo, async (s) => {
  const r = await crawlStore(s, targets);
  return { store: s, ...r };
});
const ok = res.filter((r) => r && r.products);
const totalProducts = ok.reduce((n, r) => n + r.products, 0);
console.error(`DONE: ${ok.length}/${todo.length} stores crawled, ${totalProducts} product-at-store rows written to ${OUT_DIR}`);
const errs = res.filter((r) => r?.error);
if (errs.length) console.error('errors:', errs.length, JSON.stringify(errs.slice(0, 5)));
