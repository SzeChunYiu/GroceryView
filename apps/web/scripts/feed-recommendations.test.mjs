import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('recommended deals rail has an explicit empty state without sample deal cards', async () => {
  const trending = await read('src/app/page-sections/trending.tsx');

  assert.match(trending, /function PriceDropDiscoveryEmptyState/);
  assert.match(trending, /data-price-drop-discovery-empty-state/);
  assert.match(trending, /No verified recommended deals yet/);
  assert.match(trending, /Only dated price observations can populate this rail/);
  assert.doesNotMatch(trending, /discoveryRailItems\.length === 0\) return null/);
  assert.doesNotMatch(trending, /sample deal|fake deal|invented discount/i);
});

test('recommended deal feed shapes signed-in account preferences and fails closed anonymously', async () => {
  const source = await read('src/lib/feed-recommendations.ts');
  const route = await read('src/app/api/feed/recommended-deals/route.ts');

  assert.match(source, /shapeAccountRecommendationPreferences/);
  assert.match(source, /favoriteBrands: stringArray\(record\.favoriteBrands\)/);
  assert.match(source, /source: 'anonymous-static-feed'/);
  assert.match(source, /source: 'signed-in-account-preferences'/);
  assert.match(route, /x-groceryview-account-preferences/);
  assert.match(route, /buildRecommendedDealsFeed/);
});
