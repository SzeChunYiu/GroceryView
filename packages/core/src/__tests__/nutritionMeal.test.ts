import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankNutritionPerKrona, suggestDealBasedMeals } from '../index.js';

describe('rankNutritionPerKrona', () => {
  it('ranks protein deals per 10 SEK and keeps health metadata', () => {
    const ranked = rankNutritionPerKrona([
      { productId: 'chicken', name: 'Chicken thighs', price: 69.9, nutritionPerPackage: { proteinGrams: 160, calories: 900, fiberGrams: 0, sugarGrams: 0, saltGrams: 2.4 } },
      { productId: 'yogurt', name: 'Greek yogurt', price: 34.9, nutritionPerPackage: { proteinGrams: 55, calories: 380, fiberGrams: 0, sugarGrams: 16, saltGrams: 0.5 } }
    ], 'protein');

    assert.deepEqual(ranked.map((item) => ({ productId: item.productId, valuePer10Sek: item.valuePer10Sek })), [
      { productId: 'chicken', valuePer10Sek: 22.89 },
      { productId: 'yogurt', valuePer10Sek: 15.76 }
    ]);
  });
});

describe('suggestDealBasedMeals', () => {
  it('suggests meals from currently cheap ingredients under budget', () => {
    const meals = suggestDealBasedMeals({
      deals: [
        { productId: 'chicken', name: 'Chicken thighs', category: 'protein', price: 69.9, dealScore: 91 },
        { productId: 'pasta', name: 'Pasta', category: 'pantry', price: 14.9, dealScore: 82 },
        { productId: 'tomatoes', name: 'Tomatoes', category: 'vegetables', price: 19.9, dealScore: 79 }
      ],
      maxMealCost: 110,
      servings: 3
    });

    assert.deepEqual(meals, [
      {
        title: 'Chicken thighs pasta bowl',
        ingredientProductIds: ['chicken', 'pasta', 'tomatoes'],
        estimatedCost: 104.7,
        estimatedCostPerServing: 34.9,
        reason: 'Uses high-scoring current deals across protein, pantry, and vegetables.'
      }
    ]);
  });
});
