import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sitemap = readFileSync(new URL('../../apps/web/src/app/sitemap.ts', import.meta.url), 'utf8');
const required = ['/market', '/browse', '/fuel/stations', '/pharmacy/otc', '/guides', '/guides/compare-grocery-prices', '/guides/fuel-prices-sweden'];
const dynamicPatterns = ['`/market/${category.slug}`', '`/browse/${category.slug}`', '`/fuel/stations/${station.osmId}`', '`/pharmacy/${card.ean}`'];
const forbidden = ["entry('/admin", "entry('/account", "entry('/settings", "entry('/login", "entry('/watchlist"];
const missing = required.filter((route) => !sitemap.includes(`entry('${route}'`) && !sitemap.includes(`'${route}'`));
const missingDynamic = dynamicPatterns.filter((pattern) => !sitemap.includes(pattern));
const forbiddenHits = forbidden.filter((pattern) => sitemap.includes(pattern));
assert.deepEqual(missing, []);
assert.deepEqual(missingDynamic, []);
assert.deepEqual(forbiddenHits, []);
console.log(JSON.stringify({ status: 'ok', required, dynamicPatterns, forbiddenHits }, null, 2));
