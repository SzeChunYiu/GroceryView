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

    const detail = api.getProduct('milk');
    assert.deepEqual(
      detail?.currentPrices.map((price) => price.storeId),
      ['lidl-sveavagen', 'willys-odenplan']
    );
    assert.equal(detail?.dealScore, 73);
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
        severity: 'opportunity',
        trigger: {
          metric: 'price',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavagen',
          threshold: 14,
          value: 13.9
        },
        message: 'Arla Milk 1L is 13.90 SEK at Lidl Sveavagen, below your 14.00 SEK target.'
      }
    ]);
  });

  it('returns ranked store-specific deals without mixing other stores', () => {
    const api = createGroceryViewApi();

    const willysDeals = api.getStoreDeals('willys-odenplan');
    assert.deepEqual(
      willysDeals.map((deal) => ({ productId: deal.productId, storeId: deal.storeId, dealScore: deal.dealScore })),
      [
        { productId: 'coffee', storeId: 'willys-odenplan', dealScore: 82 },
        { productId: 'milk', storeId: 'willys-odenplan', dealScore: 73 },
        { productId: 'butter', storeId: 'willys-odenplan', dealScore: 40 }
      ]
    );
    assert.deepEqual(willysDeals[0].band, { label: 'Good deal', verdict: 'Buy' });
    assert.throws(() => api.getStoreDeals('missing-store'), /Unknown storeId/);
  });


  it('returns product price terminal reports with distribution and chart data', () => {
    const api = createGroceryViewApi();

    const terminal = api.getProductPriceTerminal('coffee');
    assert.equal(terminal?.productId, 'coffee');
    assert.equal(terminal?.ticker, 'ZOEGAS-COFFEE-450G');
    assert.deepEqual(terminal?.quote, {
      bestPrice: 49.9,
      bestStoreId: 'willys-odenplan',
      bestStoreName: 'Willys Odenplan',
      unitPrice: '110.89 SEK/kg',
      dealScore: 82,
      band: { label: 'Good deal', verdict: 'Buy' },
      oneMonthMovePercent: -16.7,
      range52Week: { low: 49.9, high: 69.9 },
      evidenceVolume: { currentPrices: 3, historyPoints: 3, verifiedHistoryPoints: 3 }
    });
    assert.deepEqual(terminal?.distributions.map((distribution) => distribution.label), [
      'Whole Stockholm',
      'Odenplan local area'
    ]);
    assert.equal(terminal?.distributions[0].sampleSize, 3);
    assert.equal(terminal?.distributions[0].median, 59.9);
    assert.equal(terminal?.distributions[0].currentPercentile, 8);
    assert.match(terminal?.distributions[0].customerRead ?? '', /cheaper than 92% of verified Stockholm observations/);
    assert.equal(terminal?.distributions[1].sampleSize, 2);
    assert.equal(terminal?.chart.series[0].id, 'willys-odenplan:shelf');
    assert.equal(terminal?.chart.series[0].lineStyle, 'solid');
    assert.deepEqual(terminal?.chart.series[0].points.map((point) => point.value), [69.9, 59.9, 49.9]);
    assert.equal(terminal?.historySummary?.isNewLow, true);
    assert.deepEqual(terminal?.evidenceGuardrails, [
      'Verified shelf or retailer-page prices can power current quote, Deal Score, and basket totals.',
      'Member, promotion, estimated, and low-confidence rows must stay explicitly labeled before customer action.',
      'Distribution and chart samples include sample size and provenance-aware confidence styling.'
    ]);
    assert.equal(api.getProductPriceTerminal('missing-product'), null);
  });

  it('returns Deal Score v1 reports without using distance in the default score', () => {
    const api = createGroceryViewApi();

    const nearby = api.getDealScore('coffee', { distanceKm: 0.3 });
    const farAway = api.getDealScore('coffee', { distanceKm: 12.5 });

    assert.deepEqual(nearby, farAway);
    assert.deepEqual(nearby, {
      productId: 'coffee',
      score: 82,
      band: { label: 'Good deal', verdict: 'Buy' },
      verdict: 'Buy',
      discountVsMedianPercent: 16.7,
      historicalPercentile: 12,
      confidence: 0.9,
      reasons: [
        'Best current quote is 49.90 SEK at Willys Odenplan.',
        'Zoégas Coffee 450g is in the 8th city price percentile.',
        'Historical promo percentile is 12.',
        'Equivalent unit-price percentile is 18.',
        'Source confidence is 90%.',
        'Default verdict is Buy.'
      ]
    });
    assert.equal(api.getDealScore('missing-product'), null);
  });

  it('serves product equivalents for comparison routes', () => {
    const api = createGroceryViewApi();

    assert.deepEqual(api.getProductEquivalents('milk'), [
      {
        productId: 'butter',
        productName: 'Butter 600g',
        category: 'dairy',
        bestPrice: 54.9,
        bestStoreId: 'coop-odenplan',
        dealScore: 40,
        reason: 'Same dairy category with comparable current price evidence.'
      }
    ]);
    assert.deepEqual(api.getProductEquivalents('coffee'), []);
    assert.deepEqual(api.getProductEquivalents('missing-product'), []);
  });

  it('builds a price freshness report with stale backfill actions', () => {
    const api = createGroceryViewApi();

    assert.deepEqual(api.getPriceFreshnessReport('2026-05-20').summary, { fresh: 3, aging: 0, stale: 0 });

    const report = api.getPriceFreshnessReport('2026-06-03T00:00:00.000Z');
    assert.deepEqual(report.thresholds, { agingAfterDays: 7, staleAfterDays: 14 });
    assert.deepEqual(report.summary, { fresh: 0, aging: 0, stale: 3 });
    assert.deepEqual(report.backfillProductIds, ['butter', 'coffee', 'milk']);
    assert.deepEqual(
      report.products.map((product) => ({
        productId: product.productId,
        latestVerifiedPriceDate: product.latestVerifiedPriceDate,
        ageDays: product.ageDays,
        status: product.status,
        action: product.action
      })),
      [
        {
          productId: 'coffee',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'milk',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'butter',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        }
      ]
    );
    assert.throws(() => api.getPriceFreshnessReport('June 3, 2026'), /asOf must be an ISO timestamp/);
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

  it('removes watched products and recomputes alerts from remaining items', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.addWatchlistItem('user-1', { productId: 'milk', targetPrice: 14, favoriteStoresOnly: true });

    assert.equal(api.getWatchlist('user-1').items.length, 2);
    assert.equal(api.removeWatchlistItem('user-1', 'coffee').removed, true);

    const watchlist = api.getWatchlist('user-1');
    assert.deepEqual(watchlist.items.map((item) => item.productId), ['milk']);
    assert.equal(watchlist.alerts.some((alert) => alert.productId === 'coffee'), false);
    assert.equal(api.removeWatchlistItem('user-1', 'coffee').removed, false);
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
