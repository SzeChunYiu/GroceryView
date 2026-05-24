import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { rankNutritionPerKrona } from '../../../index.js';

describe('rankNutritionPerKrona ranker', () => {
  it('ranks fixture products by selected nutrition value per 10 SEK and preserves filtering metadata', () => {
    const ranked = rankNutritionPerKrona([
      { productId: 'beans', name: 'Beans', price: 20, nutritionPerPackage: { proteinGrams: 24, calories: 600, fiberGrams: 18, sugarGrams: 3, saltGrams: 0.8 } },
      { productId: 'yogurt', name: 'Yogurt', price: 15, nutritionPerPackage: { proteinGrams: 15, calories: 250, fiberGrams: 0, sugarGrams: 12, saltGrams: 0.3 } },
      { productId: 'jerky', name: 'Jerky', price: 40, nutritionPerPackage: { proteinGrams: 38, calories: 300, fiberGrams: 1, sugarGrams: 5, saltGrams: 2.4 } }
    ], 'protein');

    assert.deepEqual(ranked.map((product) => product.productId), ['beans', 'yogurt', 'jerky']);
    assert.deepEqual(ranked.map((product) => product.valuePer10Sek), [12, 10, 9.5]);
    assert.equal(ranked.find((product) => product.productId === 'jerky')?.saltWarning, true);
  });
});
