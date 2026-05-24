import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRecipeCost, parseRecipeIngredients } from '../index.js';

describe('recipe cost calculator', () => {
  it('parses ingredient quantities and returns cheapest cost per portion', () => {
    const ingredients = parseRecipeIngredients('400 g chicken\n2 dl cream');
    assert.deepEqual(ingredients.map((item) => [item.quantity, item.unit, item.ingredient]), [[400, 'g', 'chicken'], [200, 'ml', 'cream']]);

    const result = calculateRecipeCost({
      country: 'SE',
      portions: 4,
      recipeText: '400 g chicken\n300 g rice\n250 g broccoli\n2 dl cream'
    });

    assert.equal(result.cheapestStore?.storeId, 'willys');
    assert.ok((result.cheapestStore?.costPerPortion ?? 0) > 0);
    assert.equal(result.unmatchedIngredients.length, 0);
    assert.equal(result.matches.length, 4);
  });
});
