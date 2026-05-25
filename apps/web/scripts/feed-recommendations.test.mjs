import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('home feed exposes personalized recommended deals from combined signals', async () => {
  const home = await read('src/app/page.tsx');
  const trending = await read('src/app/page-sections/trending.tsx');
  const feedRecommendations = await read('src/lib/feed-recommendations.ts');

  assert.match(feedRecommendations, /export function buildRecommendedDealsFeed/);
  assert.match(feedRecommendations, /RecommendedDealSignal = 'favorite' \| 'watchlist' \| 'household' \| 'local_price_drop'/);
  assert.match(feedRecommendations, /watchlistAlertBoard/);
  assert.match(feedRecommendations, /householdCategorySignals/);
  assert.match(feedRecommendations, /dietaryPreferenceOnboardingContract/);
  assert.match(feedRecommendations, /buildLocalPriceDropFeed/);
  assert.match(feedRecommendations, /scoreBrandTolerance/);

  assert.match(trending, /export function RecommendedDealsRail/);
  assert.match(trending, /data-recommended-deals-rail/);
  assert.match(trending, /favorite brands, watchlist targets, household preference settings, and verified local price drops/);
  assert.match(trending, /recommendedDealsFeed\.map/);

  assert.match(home, /RecommendedDealsRail/);
  assert.match(home, /<RecommendedDealsRail \/>/);
});
