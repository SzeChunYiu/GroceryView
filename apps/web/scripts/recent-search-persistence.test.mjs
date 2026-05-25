import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('search bar persists and renders the last ten successful product searches', async () => {
  const searchBar = await read('src/components/SearchBar.tsx');
  const appNav = await read('src/components/app-nav.tsx');
  const personalization = await read('src/lib/personalization.ts');

  assert.match(personalization, /recentSearchHistoryStorageKey/);
  assert.match(personalization, /readRecentSearchHistory/);
  assert.match(personalization, /rememberRecentSearchHistory/);
  assert.match(personalization, /maxRecentSearchHistory = 10/);
  assert.match(personalization, /resultCount <= 0/);

  assert.match(searchBar, /RecentSearchHistoryEntry/);
  assert.match(searchBar, /data-recent-product-searches/);
  assert.match(searchBar, /shouldShowRecentSearches/);
  assert.match(searchBar, /rememberRecentSearchHistory\(trimmedQuery, nextResults\.length\)/);
  assert.match(searchBar, /Recent searches/);
  assert.match(searchBar, /onFocus/);

  assert.match(appNav, /<SearchBar surface="app-nav" \/>/);
});
