import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMealCostBreakdown, rankNutritionPerKrona, suggestDealBasedMeals } from '../index.js';

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

describe('calculateMealCostBreakdown', () => {
  it('costs a meal from ingredient quantities, exposes per-serving cost, and selects the cheapest complete chain', () => {
    const summary = calculateMealCostBreakdown({
      mealId: 'pantry-pasta-night',
      title: 'Pantry pasta night',
      servings: 4,
      ingredients: [
        {
          ingredientId: 'pasta',
          label: 'Spaghetti',
          quantityNeeded: 0.5,
          unit: 'kg',
          offers: [
            { chainId: 'city-gross', storeName: 'City Gross Stockholm', productId: 'barilla-spaghetti-1kg', productName: 'Barilla Spaghetti 1kg', packageQuantity: 1, packageUnit: 'kg', packagePrice: 27.9, confidence: 0.78, source: 'visible product row' },
            { chainId: 'hemkop', storeName: 'Hemköp Hornstull', productId: 'garant-spaghetti-1kg', productName: 'Garant Spaghetti 1kg', packageQuantity: 1, packageUnit: 'kg', packagePrice: 29.9, confidence: 0.7, source: 'matched shelf row' }
          ]
        },
        {
          ingredientId: 'tomatoes',
          label: 'Cherry tomatoes',
          quantityNeeded: 0.25,
          unit: 'kg',
          offers: [
            { chainId: 'city-gross', storeName: 'City Gross Stockholm', productId: 'citygross-tomater-250g', productName: 'City Gross Tomater 250g', packageQuantity: 0.25, packageUnit: 'kg', packagePrice: 18.9, confidence: 0.7, source: 'matched produce row' },
            { chainId: 'hemkop', storeName: 'Hemköp Hornstull', productId: 'garant-korsbarstomater-250g', productName: 'Garant Körsbärstomater 250g', packageQuantity: 0.25, packageUnit: 'kg', packagePrice: 19.9, confidence: 0.74, source: 'visible product row' }
          ]
        },
        {
          ingredientId: 'sauce',
          label: 'Tomato sauce',
          quantityNeeded: 0.5,
          unit: 'kg',
          offers: [
            { chainId: 'city-gross', storeName: 'City Gross Stockholm', productId: 'citygross-tomatsas-500g', productName: 'City Gross Tomatsås 500g', packageQuantity: 0.5, packageUnit: 'kg', packagePrice: 21.9, confidence: 0.68, source: 'matched pantry row' },
            { chainId: 'hemkop', storeName: 'Hemköp Stockholm', productId: 'felix-ketchup-1kg', productName: 'Felix Tomatketchup 1kg', packageQuantity: 1, packageUnit: 'kg', packagePrice: 32, confidence: 0.72, source: 'visible product row' }
          ]
        }
      ]
    });

    assert.equal(summary.status, 'priced');
    assert.equal(summary.cheapestChain?.chainId, 'hemkop');
    assert.equal(summary.cheapestChain?.totalCost, 50.85);
    assert.equal(summary.costPerServing, 12.71);
    assert.deepEqual(summary.breakdown.map((row) => [row.ingredientId, row.selectedProductId, row.ingredientCost]), [
      ['pasta', 'garant-spaghetti-1kg', 14.95],
      ['tomatoes', 'garant-korsbarstomater-250g', 19.9],
      ['sauce', 'felix-ketchup-1kg', 16]
    ]);
    assert.equal(summary.coverage.matchedIngredients, 3);
    assert.match(summary.confidenceLabel, /real ingredient offer rows/);
  });
});
