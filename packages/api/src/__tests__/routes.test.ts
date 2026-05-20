import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGroceryViewApi } from '../index.js';

describe('createGroceryViewApi', () => {
  it('serves market overview, product search, and product details', () => {
    const api = createGroceryViewApi();

    const market = api.getMarketOverview();
    assert.equal(market.city, 'Stockholm');
    assert.ok(market.topDeals.length >= 3);
    assert.equal(market.indices[0].id, 'stockholm-grocery-index');
    assert.deepEqual(
      market.topDeals.find((deal) => deal.productId === 'milk'),
      {
        productId: 'milk',
        ticker: 'ARLA-MILK-1L',
        bestPrice: 13.9,
        bestStoreId: 'lidl-sveavagen',
        dealScore: 73,
        band: { label: 'Fair deal', verdict: 'Compare' }
      }
    );

    const search = api.searchProducts('coffee');
    assert.equal(search[0].ticker, 'ZOEGAS-COFFEE-450G');

    const detail = api.getProduct('coffee');
    assert.equal(detail?.currentPrices[0].storeName, 'Willys Odenplan');
    assert.equal(detail?.dealScore, 82);
  });

  it('returns cheapest product prices first and uses the cheapest quote for watchlist alerts', () => {
    const api = createGroceryViewApi();

    const milkPrices = api.getProductPrices('milk');
    assert.deepEqual(
      milkPrices.map((price) => price.storeId),
      ['lidl-sveavagen', 'willys-odenplan']
    );

    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addWatchlistItem('user-1', { productId: 'milk', targetPrice: 14, favoriteStoresOnly: true });

    assert.deepEqual(api.getWatchlist('user-1').alerts, [
      {
        productId: 'milk',
        productName: 'Arla Milk 1L',
        type: 'target_price',
        message: 'Arla Milk 1L is 13.90 SEK at Lidl Sveavagen, below your 14.00 SEK target.'
      }
    ]);
  });

  it('supports favorite stores, watchlist, basket, budget, and index endpoints', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });

    assert.deepEqual(api.getFavoriteStores('user-1').map((store) => store.id), ['willys-odenplan']);
    assert.equal(api.getWatchlist('user-1').alerts.length, 3);
    assert.deepEqual(api.getBasket('user-1').items, [{ productId: 'coffee', quantity: 3 }]);
    assert.equal(api.compareBasket('user-1').cheapestByProduct.total, 149.7);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 800);
    assert.equal(api.getIndex('stockholm-grocery-index')?.label, 'Stockholm Grocery Index');
  });

  it('rejects invalid mutable route inputs before storing state', () => {
    const api = createGroceryViewApi();

    assert.throws(() => api.addFavoriteStore('user-1', 'missing-store'), /Unknown storeId/);
    assert.throws(
      () => api.addWatchlistItem('user-1', { productId: 'missing-product', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true }),
      /Unknown productId/
    );
    assert.throws(
      () => api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 0, alertDealScoreAt: 80, favoriteStoresOnly: true }),
      /targetPrice must be positive/
    );
    assert.throws(() => api.addBasketItem('user-1', { productId: 'coffee', quantity: 0 }), /quantity must be an integer/);
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 98 });
    assert.throws(() => api.addBasketItem('user-1', { productId: 'coffee', quantity: 2 }), /quantity must be an integer/);
    assert.throws(() => api.updateBudget('user-1', { weeklyBudget: -1, monthlyBudget: 3200 }), /weeklyBudget/);

    assert.deepEqual(api.getFavoriteStores('user-1'), []);
    assert.deepEqual(api.getWatchlist('user-1').items, []);
    assert.deepEqual(api.getBasket('user-1').items, [{ productId: 'coffee', quantity: 98 }]);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 0);
  });
});
