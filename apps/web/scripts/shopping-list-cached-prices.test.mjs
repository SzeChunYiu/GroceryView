import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const prices = new URL('../src/lib/shopping-list-prices.ts', import.meta.url);
const page = new URL('../src/app/list/page.tsx', import.meta.url);
const item = new URL('../src/components/CheckableListItem.tsx', import.meta.url);

test('shopping list price helper resolves live prices before cached offline prices', async () => {
  const source = await readFile(prices, 'utf8');

  assert.match(source, /OFFLINE_SHOPPING_LIST_CACHE_KEY = 'groceryview:shopping-list:offline-cache:v1'/);
  assert.match(source, /parseOfflineShoppingListSnapshot/);
  assert.match(source, /mergeLastKnownShoppingListPrices/);
  assert.match(source, /cachedSourceForProductSlug/);
  assert.match(source, /shoppingListPriceSourceForProductSlug/);
  assert.match(source, /freshness: 'cached'/);
  assert.match(source, /freshness: 'live'/);
});

test('shopping list page reads the offline snapshot and passes cached price sources to rows', async () => {
  const source = await readFile(page, 'utf8');

  assert.match(source, /parseOfflineShoppingListSnapshot\(window\.localStorage\.getItem\(OFFLINE_SHOPPING_LIST_CACHE_KEY\)\)/);
  assert.match(source, /mergeLastKnownShoppingListPrices\(livePrices, offlineCachedSnapshot\)/);
  assert.match(source, /shoppingListPriceSourceForProductSlug\(item\.matchedProductSlug, offlineShoppingListSnapshot\)/);
  assert.match(source, /priceSource=\{item\.matchedProductSlug \? priceSourcesBySlug\.get\(item\.matchedProductSlug\) \?\? null : null\}/);
});

test('checkable list item labels cached prices as last known prices', async () => {
  const source = await readFile(item, 'utf8');

  assert.match(source, /priceSource\?: ShoppingListPriceSource \| null/);
  assert.match(source, /Last known price/);
  assert.match(source, /saved \$\{resolvedPriceSource\.cachedAt\.slice\(0, 10\)\}/);
  assert.match(source, /Cheapest source unavailable until a verified latest price row exists for this item/);
});
