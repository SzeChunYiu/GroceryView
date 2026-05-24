import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

async function loadUserPreferencesModule() {
  const source = await read('src/lib/user-preferences.ts');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('recommendation preferences parse and persist localStorage payloads safely', async () => {
  const preferences = await loadUserPreferencesModule();

  assert.deepEqual(preferences.parseUserRecommendationPreferences(null), { dislikedRecommendations: [] });
  assert.deepEqual(preferences.parseUserRecommendationPreferences('not json'), { dislikedRecommendations: [] });

  const dislikedAt = '2026-05-24T09:30:00.000Z';
  const signal = preferences.createRecommendationDislikeSignal(
    { productId: 'swap-a', productName: 'Smart swap A', category: 'Dairy', brand: 'Coop' },
    'source-product',
    dislikedAt
  );
  const raw = JSON.stringify({
    dislikedRecommendations: [
      signal,
      { productId: 'invalid-without-required-fields' }
    ]
  });

  assert.deepEqual(preferences.parseUserRecommendationPreferences(raw), { dislikedRecommendations: [signal] });
  assert.equal(preferences.serializeUserRecommendationPreferences({ dislikedRecommendations: [signal] }), JSON.stringify({
    dislikedRecommendations: [signal]
  }));
  assert.equal(preferences.USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY, 'groceryview:user-recommendation-preferences:v1');
});

test('disliked smart-swap rows are hidden until Restore removes the anti-recommendation', async () => {
  const preferences = await loadUserPreferencesModule();
  const sourceSignal = preferences.createRecommendationDislikeSignal(
    { productId: 'swap-a', productName: 'Smart swap A', category: 'Dairy', brand: 'Coop' },
    'source-product',
    '2026-05-24T09:30:00.000Z'
  );
  const storedPreferences = preferences.addRecommendationDislike({ dislikedRecommendations: [] }, sourceSignal);
  const smartSwaps = [
    { productId: 'swap-a', productName: 'Smart swap A', category: 'Dairy', brand: 'Coop' },
    { productId: 'swap-b', productName: 'Smart swap B', category: 'Dairy', brand: 'Coop' },
    { productId: 'swap-c', productName: 'Smart swap C', category: 'Dairy', brand: 'Other brand' }
  ];

  assert.deepEqual(
    preferences.filterDislikedRecommendations(smartSwaps, storedPreferences).map((item) => item.productId),
    ['swap-c']
  );
  assert.deepEqual(preferences.removeRecommendationDislike(storedPreferences, 'swap-a'), { dislikedRecommendations: [] });
});

test('RecommendationStrip wires storage refresh, Dislike persist, and Restore controls', async () => {
  const strip = await read('src/components/recommendation-strip.tsx');

  assert.match(strip, /localStorage\.getItem\(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY\)/);
  assert.match(strip, /parseUserRecommendationPreferences\(localStorage\.getItem\(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY\)\)/);
  assert.match(strip, /localStorage\.setItem\(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY, serializeUserRecommendationPreferences\(nextPreferences\)\)/);
  assert.match(strip, /window\.addEventListener\('storage', syncFromStorage\)/);
  assert.match(strip, /window\.addEventListener\(USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT, syncFromStorage\)/);
  assert.match(strip, /const visibleItems = useMemo\(\(\) => filterDislikedRecommendations\(items, preferences\)/);
  assert.match(strip, /onClick=\{\(\) => dislikeRecommendation\(item\)\}/);
  assert.match(strip, /addRecommendationDislike\(preferences, createRecommendationDislikeSignal\(item, sourceProductId\)\)/);
  assert.match(strip, /const suppressedItems = useMemo/);
  assert.match(strip, /Anti-recommendation list/);
  assert.match(strip, /Restore \{item\.productName\}/);
  assert.match(strip, /onClick=\{\(\) => restoreRecommendation\(item\.productId\)\}/);
  assert.match(strip, /removeRecommendationDislike\(preferences, productId\)/);
});
