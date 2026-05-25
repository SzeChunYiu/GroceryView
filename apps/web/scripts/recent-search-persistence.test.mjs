import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('search bar persists and renders the last ten successful product searches', async () => {
  const searchBar = await read('src/components/SearchBar.tsx');
  const recentSearches = await read('src/lib/recent-searches.ts');
  const analytics = await read('src/lib/analytics.ts');
  const appNav = await read('src/components/app-nav.tsx');

  assert.match(recentSearches, /recentProductSearchesStorageKey/);
  assert.match(recentSearches, /readRecentProductSearches/);
  assert.match(recentSearches, /rememberRecentProductSearch/);
  assert.match(recentSearches, /maxRecentSearches = 10/);
  assert.match(recentSearches, /resultCount <= 0/);

  assert.match(analytics, /recentProductSearchesStorageKey/);
  assert.match(analytics, /readRecentProductSearches/);
  assert.match(analytics, /rememberRecentProductSearch/);

  assert.match(searchBar, /RecentProductSearch/);
  assert.match(searchBar, /data-recent-product-searches/);
  assert.match(searchBar, /shouldShowRecentSearches/);
  assert.match(searchBar, /rememberRecentProductSearch\(trimmedQuery, nextResults\.length\)/);
  assert.match(searchBar, /Recent searches/);
  assert.match(searchBar, /onFocus/);

  assert.match(appNav, /<SearchBar surface="app-nav" \/>/);
});

test('products page renders locally saved recent search chips above results', async () => {
  const productsPage = await read('src/app/products/page.tsx');
  const panel = await read('src/components/recent-product-searches-panel.tsx');

  assert.match(productsPage, /RecentProductSearchesPanel/);
  assert.match(panel, /readRecentProductSearches/);
  assert.match(panel, /data-products-recent-searches/);
  assert.match(panel, /Compare staples again/);
  assert.match(panel, /Saved locally on this device/);
  assert.match(panel, /href=\{search\.href\}/);
});
