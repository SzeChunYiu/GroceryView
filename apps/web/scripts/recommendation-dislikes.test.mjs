import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('shared recommendation preferences parse and match anti-recommendation signals', async () => {
  const source = await read('src/lib/user-preferences.ts');

  assert.match(source, /groceryview:user-recommendation-preferences:v1/);
  assert.match(source, /parseUserRecommendationPreferences/);
  assert.match(source, /serializeUserRecommendationPreferences/);
  assert.match(source, /createRecommendationDislikeSignal/);
  assert.match(source, /recommendationMatchesDislike/);
  assert.match(source, /filterDislikedRecommendations/);
  assert.match(source, /MAX_DISLIKE_SIGNALS = 50/);
});

test('trending carousel hides disliked product-backed rows and offers restore controls', async () => {
  const source = await read('src/components/TrendingCarousel.tsx');

  assert.match(source, /'use client';/);
  assert.match(source, /filterDislikedRecommendations\(preferenceItems, preferences\)/);
  assert.match(source, /createRecommendationDislikeSignal\(item, 'trending-carousel'\)/);
  assert.match(source, /localStorage\.setItem\(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY/);
  assert.match(source, /data-trending-carousel/);
  assert.match(source, /Hide from recommendations/);
  assert.match(source, /Hidden trending products/);
  assert.match(source, /Restore \{item\.productName\}/);
});

test('market shell category deals use the same dislike list for hide and restore', async () => {
  const source = await read('src/components/market-shell.tsx');

  assert.match(source, /filterDislikedRecommendations\(categoryDealPreferenceItems, preferences\)/);
  assert.match(source, /createRecommendationDislikeSignal\(leader, 'market-shell-category-deals'\)/);
  assert.match(source, /data-market-category-deal-preferences-ready/);
  assert.match(source, /data-product-slug=\{leader\.productSlug\}/);
  assert.match(source, /Hide deal/);
  assert.match(source, /Hidden category deals/);
  assert.match(source, /Restore \{leader\.productName\}/);
});
