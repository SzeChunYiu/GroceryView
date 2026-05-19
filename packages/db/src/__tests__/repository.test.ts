import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepository } from '../index.js';

describe('createMemoryRepository', () => {
  it('persists users, favorite stores, budgets, watchlist items, and baskets', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'shopper@example.com' });
    await repo.addFavoriteStore('user-1', 'willys-odenplan');
    await repo.upsertBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });
    await repo.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true });
    await repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });

    assert.deepEqual(await repo.getFavoriteStoreIds('user-1'), ['willys-odenplan']);
    assert.deepEqual(await repo.getBudget('user-1'), { weeklyBudget: 800, monthlyBudget: 3200 });
    assert.deepEqual(await repo.getWatchlist('user-1'), [{ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true }]);
    assert.deepEqual(await repo.getBasket('user-1'), [{ productId: 'coffee', quantity: 2 }]);
  });
});
