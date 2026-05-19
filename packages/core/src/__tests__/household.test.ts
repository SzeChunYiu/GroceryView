import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHouseholdState, summarizeHousehold } from '../index.js';

describe('household mode', () => {
  it('merges household basket items with member attribution and shared budget', () => {
    const household = createHouseholdState({
      id: 'house-1',
      name: 'Odenplan Household',
      weeklyBudget: 1200,
      members: [
        { userId: 'billy', displayName: 'Billy' },
        { userId: 'partner', displayName: 'Partner' }
      ]
    });

    household.addBasketItem({ productId: 'milk', quantity: 2, addedBy: 'billy' });
    household.addBasketItem({ productId: 'diapers', quantity: 1, addedBy: 'partner' });
    household.addWatchlistItem({ productId: 'coffee', addedBy: 'billy', targetPrice: 50 });
    household.setSharedFavoriteStores(['lidl-sveavagen', 'willys-odenplan']);

    const summary = summarizeHousehold(household.snapshot(), { milk: 15, diapers: 149 });

    assert.deepEqual(summary.memberContributions, [
      { userId: 'billy', displayName: 'Billy', itemCount: 1 },
      { userId: 'partner', displayName: 'Partner', itemCount: 1 }
    ]);
    assert.equal(summary.estimatedTotal, 179);
    assert.equal(summary.remainingBudget, 1021);
    assert.deepEqual(summary.sharedFavoriteStoreIds, ['lidl-sveavagen', 'willys-odenplan']);
  });
});
