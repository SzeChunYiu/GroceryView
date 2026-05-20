import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertPriceObservationDto, createGroceryViewApi, validatePriceObservationDto } from '../index.js';

describe('createGroceryViewApi', () => {
  it('validates canonical price observation provenance DTOs', () => {
    const baseObservation = {
      observationId: 'obs-coffee-willys-2026-05-20',
      productId: 'coffee',
      retailerId: 'willys',
      storeId: 'willys-odenplan',
      priceType: 'online' as const,
      packagePrice: 49.9,
      unitPrice: 110.89,
      currency: 'SEK' as const,
      quantityBasis: 'kg',
      observedAt: '2026-05-20T08:00:00.000Z',
      validFrom: '2026-05-20T00:00:00.000Z',
      validThrough: '2026-05-26T23:59:59.000Z',
      availability: 'in_stock' as const,
      confidence: 0.92,
      confidenceReasons: ['official_source' as const],
      sourceSurface: 'store_page' as const,
      sourceUrl: 'https://example.test/willys/coffee',
      rawSnapshotRef: {
        uri: 's3://groceryview-raw/willys/coffee/2026-05-20.html',
        contentType: 'text/html',
        retrievedAt: '2026-05-20T08:00:03.000Z',
        contentDigest: {
          algorithm: 'sha-256' as const,
          value: 'sha256-test-digest'
        }
      },
      captureActivityId: 'capture-run-2026-05-20',
      capturedBy: 'worker:data-pipeline',
      legalReviewStatus: 'approved' as const,
      reviewStatus: 'approved' as const
    };

    assert.deepEqual(validatePriceObservationDto(baseObservation), []);
    assert.equal(assertPriceObservationDto(baseObservation).priceType, 'online');

    assert.deepEqual(validatePriceObservationDto({
      ...baseObservation,
      priceType: undefined,
      confidence: 1.2,
      sourceSurface: undefined,
      rawSnapshotRef: undefined
    }), [
      'missing_price_type',
      'invalid_confidence',
      'missing_source_surface',
      'missing_raw_snapshot_ref',
      'missing_content_digest'
    ]);

    assert.deepEqual(validatePriceObservationDto({
      ...baseObservation,
      priceType: 'member',
      confidenceReasons: ['member_only']
    }), ['missing_membership_requirement']);

    assert.throws(() => assertPriceObservationDto({
      ...baseObservation,
      rawSnapshotRef: {
        ...baseObservation.rawSnapshotRef,
        contentDigest: { algorithm: 'sha-256', value: '' }
      }
    }), /missing_content_digest/);
  });

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

    const dealScore = api.getProductDealScore('coffee');
    assert.deepEqual(dealScore, {
      productId: 'coffee',
      score: 82,
      band: 'Good deal',
      verdict: 'Buy',
      discountVsMedianPercent: 25,
      historicalPercentile: 12,
      confidence: 'high',
      reasons: [
        '25% below the local median reference.',
        'Historical promo percentile 12 means this is rare versus known promotions.',
        'Source confidence 90% keeps the verdict high confidence.'
      ]
    });
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
    api.updateWatchlistItem('user-1', 'coffee', { targetPrice: 48 });
    api.updateBasketItem('user-1', 'coffee', 2);
    api.updateBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });

    assert.deepEqual(api.getFavoriteStores('user-1').map((store) => store.id), ['willys-odenplan']);
    assert.equal(api.getWatchlist('user-1').alerts.length, 2);
    assert.deepEqual(api.getBasket('user-1').items[0], { productId: 'coffee', quantity: 2 });
    assert.equal(api.compareBasket('user-1').cheapestByProduct.total, 99.8);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 800);
    assert.equal(api.getIndex('stockholm-grocery-index')?.label, 'Stockholm Grocery Index');

    api.removeWatchlistItem('user-1', 'coffee');
    api.removeBasketItem('user-1', 'coffee');
    assert.deepEqual(api.getWatchlist('user-1').items, []);
    assert.deepEqual(api.getBasket('user-1').items, []);
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
    assert.throws(() => api.updateWatchlistItem('user-1', 'coffee', { targetPrice: 40 }), /Watchlist item not found/);
    assert.deepEqual(api.removeWatchlistItem('user-1', 'coffee'), { removed: false });
    assert.throws(() => api.updateBasketItem('user-1', 'coffee', 1), /Basket item not found/);
    assert.throws(() => api.removeBasketItem('user-1', 'coffee'), /Basket item not found/);
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 98 });
    assert.throws(() => api.addBasketItem('user-1', { productId: 'coffee', quantity: 2 }), /quantity must be an integer/);
    assert.throws(() => api.updateBudget('user-1', { weeklyBudget: -1, monthlyBudget: 3200 }), /weeklyBudget/);

    assert.deepEqual(api.getFavoriteStores('user-1'), []);
    assert.deepEqual(api.getWatchlist('user-1').items, []);
    assert.deepEqual(api.getBasket('user-1').items, [{ productId: 'coffee', quantity: 98 }]);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 0);
  });
});
