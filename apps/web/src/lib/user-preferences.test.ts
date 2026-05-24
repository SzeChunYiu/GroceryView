import { describe, expect, it } from 'vitest';
import {
  getHiddenRecommendationProductSlugs,
  hideRecommendationProduct,
  productMatchesHiddenRecommendationPreference,
  restoreRecommendationProduct
} from './user-preferences';

function createStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    values
  };
}

describe('user preference recommendation filters', () => {
  it('matches hidden product slugs across product-backed feed shapes', () => {
    const hidden = new Set(['milk-1l']);

    expect(productMatchesHiddenRecommendationPreference({ productSlug: 'Milk-1L' }, hidden)).toBe(true);
    expect(productMatchesHiddenRecommendationPreference({ slug: 'milk-1l' }, hidden)).toBe(true);
    expect(productMatchesHiddenRecommendationPreference({ productSlug: 'coffee' }, hidden)).toBe(false);
  });

  it('persists hide and restore controls for product recommendations', () => {
    const storage = createStorage();

    hideRecommendationProduct({ productSlug: 'Milk-1L' }, storage);
    expect(getHiddenRecommendationProductSlugs(storage)).toEqual(new Set(['milk-1l']));

    restoreRecommendationProduct({ slug: 'milk-1l' }, storage);
    expect(getHiddenRecommendationProductSlugs(storage)).toEqual(new Set());
  });
});
