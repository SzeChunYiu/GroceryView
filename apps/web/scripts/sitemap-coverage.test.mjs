import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sitemap = readFileSync(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8');

test('sitemap covers SEO audit domain and guide routes', () => {
  for (const route of ['/market', '/browse', '/fuel/stations', '/pharmacy/otc', '/guides', '/guides/compare-grocery-prices', '/guides/real-grocery-deals', '/guides/fuel-prices-sweden', '/guides/otc-pharmacy-price-comparison']) {
    assert.match(sitemap, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const dynamic of ['`/market/${category.slug}`', '`/browse/${category.slug}`', '`/fuel/stations/${station.osmId}`', '`/pharmacy/${card.ean}`']) {
    assert.match(sitemap, new RegExp(dynamic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('sitemap excludes private and noindex route families', () => {
  for (const forbidden of ["entry('/admin", "entry('/account", "entry('/settings", "entry('/login", "entry('/watchlist"]) {
    assert.doesNotMatch(sitemap, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
