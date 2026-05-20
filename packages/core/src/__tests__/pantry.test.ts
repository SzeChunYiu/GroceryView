import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHouseholdState, planPantryReplenishment } from '../index.js';

describe('planPantryReplenishment', () => {
  it('plans household pantry restocks from usage, basket state, and current deals', () => {
    const household = createHouseholdState({
      id: 'house-1',
      name: 'Odenplan Household',
      weeklyBudget: 1200,
      members: [
        { userId: 'billy', displayName: 'Billy' },
        { userId: 'partner', displayName: 'Partner' }
      ]
    });
    household.addBasketItem({ productId: 'coffee', quantity: 1, addedBy: 'billy' });

    const plan = planPantryReplenishment({
      now: '2026-05-20T08:00:00.000Z',
      household: household.snapshot(),
      pantry: [
        { productId: 'coffee', name: 'Coffee', category: 'pantry', quantity: 1, unit: 'pack', minimumQuantity: 1, targetQuantity: 3 },
        { productId: 'milk', name: 'Milk', category: 'dairy', quantity: 2, unit: 'l', minimumQuantity: 1, expiresAt: '2026-05-22T08:00:00.000Z' },
        { productId: 'rice', name: 'Rice', category: 'pantry', quantity: 5, unit: 'kg', minimumQuantity: 2 }
      ],
      usage: [
        { productId: 'coffee', quantityUsed: 0.5, usedAt: '2026-05-19T07:00:00.000Z' },
        { productId: 'rice', quantityUsed: 1, usedAt: '2026-05-19T18:00:00.000Z' }
      ],
      deals: [
        { productId: 'coffee', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, dealScore: 88 },
        { productId: 'coffee', storeId: 'ica-odenplan', storeName: 'ICA Odenplan', price: 59.9, dealScore: 72 }
      ]
    });

    assert.equal(plan.householdId, 'house-1');
    assert.deepEqual(
      plan.statuses.map((item) => ({ productId: item.productId, remainingQuantity: item.remainingQuantity, status: item.status })),
      [
        { productId: 'coffee', remainingQuantity: 0.5, status: 'low_stock' },
        { productId: 'milk', remainingQuantity: 2, status: 'expiring_soon' },
        { productId: 'rice', remainingQuantity: 4, status: 'in_stock' }
      ]
    );
    assert.deepEqual(plan.expiringSoonProductIds, ['milk']);
    assert.deepEqual(plan.replenishment, [
      {
        productId: 'coffee',
        name: 'Coffee',
        quantityToBuy: 2.5,
        unit: 'pack',
        priority: 'medium',
        reason: 'Pantry item is at or below its minimum quantity.',
        alreadyInBasket: true,
        bestDeal: { productId: 'coffee', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, dealScore: 88 }
      }
    ]);
  });

  it('marks expired or fully depleted pantry items as high-priority restocks', () => {
    const plan = planPantryReplenishment({
      now: '2026-05-20T08:00:00.000Z',
      pantry: [
        { productId: 'eggs', name: 'Eggs', category: 'dairy', quantity: 0, unit: 'pack', minimumQuantity: 1, targetQuantity: 2 },
        { productId: 'yogurt', name: 'Yogurt', category: 'dairy', quantity: 1, unit: 'pack', minimumQuantity: 1, expiresAt: '2026-05-18T08:00:00.000Z' }
      ]
    });

    assert.deepEqual(
      plan.replenishment.map((item) => ({ productId: item.productId, quantityToBuy: item.quantityToBuy, priority: item.priority, reason: item.reason })),
      [
        { productId: 'eggs', quantityToBuy: 2, priority: 'high', reason: 'Pantry item is at or below its minimum quantity.' },
        { productId: 'yogurt', quantityToBuy: 1, priority: 'high', reason: 'Expired pantry item should be replaced.' }
      ]
    );
  });
});
