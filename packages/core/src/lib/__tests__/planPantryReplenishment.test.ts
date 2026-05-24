import { describe, expect, it } from 'vitest';
import { createHouseholdState, planPantryReplenishment } from '../../index.js';

describe('planPantryReplenishment', () => {
  it('plans replenishment from pantry levels, household basket, usage, and deals', () => {
    const household = createHouseholdState({
      id: 'stockholm-flat',
      name: 'Stockholm Flat',
      weeklyBudget: 900,
      members: [{ userId: 'anna', displayName: 'Anna' }]
    });
    household.addBasketItem({ productId: 'oats', quantity: 1, addedBy: 'anna' });

    const plan = planPantryReplenishment({
      now: '2026-05-20T08:00:00.000Z',
      household: household.snapshot(),
      pantry: [
        { productId: 'oats', name: 'Rolled oats', category: 'pantry', quantity: 1.25, unit: 'kg', minimumQuantity: 1, targetQuantity: 3 },
        { productId: 'apples', name: 'Apples', category: 'produce', quantity: 6, unit: 'each', minimumQuantity: 4 },
        { productId: 'yogurt', name: 'Yogurt', category: 'dairy', quantity: 2, unit: 'pack', minimumQuantity: 1, expiresAt: '2026-05-22T08:00:00.000Z' }
      ],
      usage: [{ productId: 'oats', quantityUsed: 0.5, usedAt: '2026-05-19T07:30:00.000Z' }],
      deals: [
        { productId: 'oats', storeId: 'coop-sodermalm', storeName: 'Coop Södermalm', price: 34.9, dealScore: 76 },
        { productId: 'oats', storeId: 'willys-alvsjo', storeName: 'Willys Älvsjö', price: 29.9, dealScore: 91 }
      ]
    });

    expect(plan.householdId).toBe('stockholm-flat');
    expect(plan.statuses.map(({ productId, remainingQuantity, status }) => ({ productId, remainingQuantity, status }))).toEqual([
      { productId: 'oats', remainingQuantity: 0.75, status: 'low_stock' },
      { productId: 'apples', remainingQuantity: 6, status: 'in_stock' },
      { productId: 'yogurt', remainingQuantity: 2, status: 'expiring_soon' }
    ]);
    expect(plan.expiringSoonProductIds).toEqual(['yogurt']);
    expect(plan.replenishment).toEqual([
      {
        productId: 'oats',
        name: 'Rolled oats',
        quantityToBuy: 2.25,
        unit: 'kg',
        priority: 'medium',
        reason: 'Pantry item is at or below its minimum quantity.',
        alreadyInBasket: true,
        bestDeal: { productId: 'oats', storeId: 'willys-alvsjo', storeName: 'Willys Älvsjö', price: 29.9, dealScore: 91 }
      }
    ]);
  });

  it('returns an empty pantry plan when no pantry items are provided', () => {
    expect(planPantryReplenishment({ now: '2026-05-20T08:00:00.000Z', pantry: [] })).toEqual({
      statuses: [],
      replenishment: [],
      expiringSoonProductIds: []
    });
  });

  it('rejects malformed input with a missing now field', () => {
    expect(() =>
      planPantryReplenishment({
        pantry: [{ productId: 'rice', name: 'Rice', category: 'pantry', quantity: 2, unit: 'kg', minimumQuantity: 1 }]
      } as Parameters<typeof planPantryReplenishment>[0])
    ).toThrow('now must be an ISO date.');
  });
});
