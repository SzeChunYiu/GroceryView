import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('search bar persists and renders the last ten successful product searches', async () => {
  const searchBar = await read('src/components/SearchBar.tsx');
  const analytics = await read('src/lib/analytics.ts');
  const appNav = await read('src/components/app-nav.tsx');

  assert.match(analytics, /recentProductSearchesStorageKey/);
  assert.match(analytics, /readRecentProductSearches/);
  assert.match(analytics, /rememberRecentProductSearch/);
  assert.match(analytics, /maxRecentSearches = 10/);
  assert.match(analytics, /resultCount <= 0/);

  assert.match(searchBar, /RecentProductSearch/);
  assert.match(searchBar, /data-recent-product-searches/);
  assert.match(searchBar, /shouldShowRecentSearches/);
  assert.match(searchBar, /rememberRecentProductSearch\(trimmedQuery, nextResults\.length\)/);
  assert.match(searchBar, /Recent searches/);
  assert.match(searchBar, /onFocus/);

  assert.match(appNav, /<SearchBar surface="app-nav" \/>/);
});
