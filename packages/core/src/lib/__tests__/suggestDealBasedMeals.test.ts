import { describe, expect, it } from 'vitest';

import { suggestDealBasedMeals, type MealDeal } from '../../index.js';

const deals: MealDeal[] = [
  {
    productId: 'protein-salmon-400g',
    name: 'Salmon Fillet',
    category: 'protein',
    price: 49.9,
    dealScore: 91
  },
  {
    productId: 'protein-beans-380g',
    name: 'Black Beans',
    category: 'protein',
    price: 14.5,
    dealScore: 72
  },
  {
    productId: 'pantry-rice-1kg',
    name: 'Jasmine Rice',
    category: 'pantry',
    price: 24.9,
    dealScore: 88
  },
  {
    productId: 'vegetables-broccoli-250g',
    name: 'Broccoli',
    category: 'vegetables',
    price: 19.9,
    dealScore: 84
  }
];

describe('suggestDealBasedMeals', () => {
  it('builds a meal from the highest-scoring protein, pantry, and vegetable deals', () => {
    expect(suggestDealBasedMeals({ deals, maxMealCost: 100, servings: 2 })).toEqual([
      {
        title: 'Salmon Fillet jasmine rice bowl',
        ingredientProductIds: ['protein-salmon-400g', 'pantry-rice-1kg', 'vegetables-broccoli-250g'],
        estimatedCost: 94.7,
        estimatedCostPerServing: 47.35,
        reason: 'Uses high-scoring current deals across protein, pantry, and vegetables.'
      }
    ]);
  });

  it('returns no suggestions when there are no deals', () => {
    expect(suggestDealBasedMeals({ deals: [], maxMealCost: 100, servings: 2 })).toEqual([]);
  });

  it('returns no suggestions for malformed deals missing required categories', () => {
    const malformedDeals = [
      {
        productId: 'protein-salmon-400g',
        name: 'Salmon Fillet',
        price: 49.9,
        dealScore: 91
      },
      {
        productId: 'pantry-rice-1kg',
        name: 'Jasmine Rice',
        category: 'pantry',
        price: 24.9,
        dealScore: 88
      }
    ] as unknown as MealDeal[];

    expect(suggestDealBasedMeals({ deals: malformedDeals, maxMealCost: 100, servings: 2 })).toEqual([]);
  });
});
