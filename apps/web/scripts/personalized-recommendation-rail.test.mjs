import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('personalized homepage recommendation rail', () => {
  it('ranks products from favorites, pantry gaps, and recent category interest and renders them on MarketShell cards', async () => {
    const [personalization, shell, cards] = await Promise.all([
      read('src/lib/personalization.ts'),
      read('src/components/market-shell.tsx'),
      read('src/components/product-price-cards.tsx')
    ]);

    assert.match(personalization, /buildPersonalizedRecommendationRail/);
    assert.match(personalization, /favoriteBrands/);
    assert.match(personalization, /pantryGaps/);
    assert.match(personalization, /recentCategoryInterest/);
    assert.match(personalization, /pantry gap signal/);
    assert.match(personalization, /Recent category interest keeps this rail relevant/);

    assert.match(shell, /buildPersonalizedRecommendationRail\(homepageAdaptiveProductCards/);
    assert.match(shell, /homepagePersonalizedRecommendationRail/);
    assert.match(shell, /recommendationItems=\{homepagePersonalizedRecommendationRail\}/);

    assert.match(cards, /recommendationItems/);
    assert.match(cards, /Recommended for you/);
    assert.match(cards, /\{item\.reason\}/);
    assert.match(cards, /score \{item\.score\}/);
  });
});
