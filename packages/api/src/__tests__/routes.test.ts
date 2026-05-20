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
      market.movers.find((mover) => mover.productId === 'coffee'),
      {
        productId: 'coffee',
        ticker: 'ZOEGAS-COFFEE-450G',
        productName: 'Zoégas Coffee 450g',
        currentPrice: 49.9,
        bestStoreId: 'willys-odenplan',
        bestStoreName: 'Willys Odenplan',
        oneMonthMovePercent: -16.7,
        range52Week: { low: 49.9, high: 69.9 },
        range52WeekPositionPercent: 0,
        stockholmMedianGap: -10,
        historyPoints: 3,
        verifiedHistoryPoints: 3
      }
    );
    assert.deepEqual(
      market.movers.find((mover) => mover.productId === 'milk')?.range52Week,
      { low: 13.9, high: 16.9 }
    );
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

  it('serves nutrition-per-krona value rows for customer value comparisons', () => {
    const api = createGroceryViewApi();

    const report = api.getNutritionValueReport('protein');

    assert.equal(report.metric, 'protein');
    assert.equal(report.currency, 'SEK');
    assert.equal(report.rows.length, 3);
    assert.deepEqual(report.rows.map((row) => row.productId), ['chicken', 'eggs', 'yogurt']);
    assert.deepEqual(report.leader, {
      productId: 'chicken',
      name: 'Chicken thighs',
      valuePer10Sek: 22.89,
      saltWarning: true
    });
    assert.match(report.guardrails[0], /nutrition labels cannot override allergen locks/i);
  });

  it('serves pantry replenishment plans with live deal and basket duplicate context', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });

    const plan = api.getPantryReplenishment('user-1', '2026-05-20T08:00:00.000Z');

    assert.equal(plan.householdId, 'user-1');
    assert.deepEqual(
      plan.statuses.map((item) => ({ productId: item.productId, status: item.status, remainingQuantity: item.remainingQuantity })),
      [
        { productId: 'coffee', status: 'low_stock', remainingQuantity: 0.5 },
        { productId: 'milk', status: 'expiring_soon', remainingQuantity: 1 },
        { productId: 'butter', status: 'in_stock', remainingQuantity: 1 }
      ]
    );
    assert.deepEqual(plan.expiringSoonProductIds, ['milk']);
    assert.deepEqual(plan.replenishment.map((item) => ({
      productId: item.productId,
      alreadyInBasket: item.alreadyInBasket,
      bestDeal: item.bestDeal && { storeId: item.bestDeal.storeId, price: item.bestDeal.price }
    })), [
      { productId: 'coffee', alreadyInBasket: true, bestDeal: { storeId: 'willys-odenplan', price: 49.9 } }
    ]);
  });

  it('serves account-scoped loyalty offers with savings and action requirements', () => {
    const api = createGroceryViewApi();

    const report = api.getLoyaltyOfferReport('user-1');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.totalEligibleSavings, 26);
    assert.equal(report.requiresActionCount, 1);
    assert.equal(report.membershipRequiredCount, 1);
    assert.deepEqual(report.offers.map((offer) => ({
      productId: offer.productId,
      chain: offer.chain,
      savings: offer.savings,
      status: offer.status,
      actionRequired: offer.actionRequired
    })), [
      { productId: 'coffee', chain: 'ica', savings: 7, status: 'eligible', actionRequired: false },
      { productId: 'milk', chain: 'coop', savings: 12, status: 'needs_coupon', actionRequired: true },
      { productId: 'private-label-milk', chain: 'willys', savings: 7, status: 'eligible', actionRequired: false }
    ]);
    assert.match(report.guardrails[0], /member-only savings never overwrite verified public shelf evidence/i);
  });

  it('serves receipt review reports with budget actuals, match confidence, and writeback guardrails', () => {
    const api = createGroceryViewApi();

    const report = api.getReceiptReviewReport('user-1');

    assert.equal(report.userId, 'user-1');
    assert.equal(report.lineCount, 3);
    assert.equal(report.matchedCount, 2);
    assert.equal(report.needsReviewCount, 2);
    assert.equal(report.review.budget.afterReceiptSpend, 762);
    assert.equal(report.review.budget.remaining, 38);
    assert.equal(report.review.comparedWithLocalMedianDelta, 3);
    assert.deepEqual(report.review.goodBuys.map((item) => item.productId), ['coffee']);
    assert.deepEqual(report.review.overspend.map((item) => [item.productId, item.deltaVsMedian]), [['cheese', 18]]);
    assert.match(report.guardrails[0], /Low confidence.*cannot update catalog or Deal Score/i);
  });

  it('serves category market reports with terminal-style mover evidence', () => {
    const api = createGroceryViewApi();

    const coffee = api.getCategoryMarket('coffee');

    assert.equal(coffee?.category, 'coffee');
    assert.equal(coffee?.city, 'Stockholm');
    assert.equal(coffee?.productCount, 1);
    assert.equal(coffee?.topDeal?.productId, 'coffee');
    assert.deepEqual(coffee?.rows.map((row) => ({
      productId: row.productId,
      currentPrice: row.currentPrice,
      dealScore: row.dealScore,
      oneMonthMovePercent: row.oneMonthMovePercent,
      range52WeekPositionPercent: row.range52WeekPositionPercent,
      stockholmMedianGap: row.stockholmMedianGap,
      verifiedHistoryPoints: row.verifiedHistoryPoints
    })), [
      {
        productId: 'coffee',
        currentPrice: 49.9,
        dealScore: 82,
        oneMonthMovePercent: -16.7,
        range52WeekPositionPercent: 0,
        stockholmMedianGap: -10,
        verifiedHistoryPoints: 3
      }
    ]);
    assert.match(coffee?.rows[0]?.customerRead ?? '', /49\.90 SEK at Willys Odenplan/);
    assert.match(coffee?.guardrails[0] ?? '', /verified category rows/i);
    assert.equal(api.getCategoryMarket('missing-category'), null);
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
        { productId: 'private-label-milk', storeId: 'willys-odenplan', dealScore: 73 },
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
    assert.deepEqual(api.getProductPriceTerminal('milk')?.quote.range52Week, { low: 13.9, high: 16.9 });
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
        productId: 'private-label-milk',
        productName: 'Garant Milk 1L',
        category: 'dairy',
        bestPrice: 12.9,
        bestStoreId: 'willys-odenplan',
        dealScore: 73,
        reason: 'Same dairy category with comparable current price evidence.'
      },
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

    assert.deepEqual(api.getPriceFreshnessReport('2026-05-20').summary, { fresh: 4, aging: 0, stale: 0 });

    const report = api.getPriceFreshnessReport('2026-06-03T00:00:00.000Z');
    assert.deepEqual(report.thresholds, { agingAfterDays: 7, staleAfterDays: 14 });
    assert.deepEqual(report.summary, { fresh: 0, aging: 0, stale: 4 });
    assert.deepEqual(report.backfillProductIds, ['butter', 'coffee', 'milk', 'private-label-milk']);
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
          productId: 'private-label-milk',
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
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.removeFavoriteStore('user-1', 'lidl-sveavagen');
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

  it('summarizes category budgets from the current basket and reports unbudgeted spend', () => {
    const api = createGroceryViewApi();

    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });
    api.updateCategoryBudgets('user-1', [
      { category: 'dairy', weeklyBudget: 70 },
      { category: 'coffee', weeklyBudget: 40 },
      { category: 'pantry', weeklyBudget: 120 }
    ]);

    assert.deepEqual(api.getCategoryBudgetSummary('user-1'), {
      userId: 'user-1',
      categories: [
        { category: 'coffee', weeklyBudget: 40, estimatedSpend: 49.9, remaining: -9.9, status: 'over', productIds: ['coffee'] },
        { category: 'dairy', weeklyBudget: 70, estimatedSpend: 82.7, remaining: -12.7, status: 'over', productIds: ['butter', 'milk'] },
        { category: 'pantry', weeklyBudget: 120, estimatedSpend: 0, remaining: 120, status: 'under', productIds: [] }
      ],
      unbudgetedCategories: []
    });

    api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: 60 }]);
    assert.deepEqual(api.getCategoryBudgetSummary('user-1').unbudgetedCategories, [
      { category: 'dairy', estimatedSpend: 82.7, productIds: ['butter', 'milk'] }
    ]);
    assert.throws(
      () => api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: 10 }, { category: ' coffee ', weeklyBudget: 20 }]),
      /categories must be unique/
    );
    assert.throws(() => api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: -1 }]), /weeklyBudget/);
  });

  it('returns basket comparison reports with explicit strategy and trust labels', () => {
    const api = createGroceryViewApi();

    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addBasketItem('user-1', { productId: 'butter', quantity: 1 });

    const report = api.compareBasketReport('user-1');
    assert.equal(report.currency, 'SEK');
    assert.deepEqual(report.favoriteStoreIds, ['willys-odenplan', 'lidl-sveavagen']);
    assert.deepEqual(report.strategies.map((strategy) => strategy.id), [
      'cheapest_across_selected',
      'all_at_one_store',
      'favorite_only',
      'private_label_substitution'
    ]);
    assert.deepEqual(report.strategies[0], {
      id: 'cheapest_across_selected',
      label: 'Cheapest across selected stores',
      total: 84.7,
      savingsVsBestSingleStore: 2,
      storeCount: 2,
      assignments: [
        {
          productId: 'milk',
          productName: 'Arla Milk 1L',
          quantity: 2,
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          unitPrice: 13.9,
          lineTotal: 27.8,
          priceLabel: 'verified_shelf'
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          quantity: 1,
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          unitPrice: 56.9,
          lineTotal: 56.9,
          priceLabel: 'verified_shelf'
        }
      ],
      missingProductIds: [],
      estimatedProductIds: [],
      warnings: ['All included prices are verified shelf demo prices.']
    });
    assert.deepEqual(report.strategies[1]?.total, 86.7);
    assert.deepEqual(report.strategies[3]?.assignments[0], {
      productId: 'private-label-milk',
      productName: 'Garant Milk 1L',
      quantity: 2,
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      unitPrice: 12.9,
      lineTotal: 25.8,
      priceLabel: 'verified_shelf',
      substitutionForProductId: 'milk',
      substitutionForProductName: 'Arla Milk 1L'
    });
    assert.equal(report.strategies[3]?.total, 82.7);
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
