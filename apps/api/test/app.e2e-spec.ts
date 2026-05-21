import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('GroceryView API app', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves health and OpenAPI docs', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'api' });

    const docs = await request(app.getHttpServer()).get('/api-json').expect(200);
    assert.equal(docs.body.info.title, 'GroceryView API');
    assert.ok(docs.body.paths['/categories/{category}/market']);
    assert.ok(docs.body.paths['/users/demo/account/subscription-access']);
    assert.ok(docs.body.paths['/users/demo/account/subscription-entitlement']);
    assert.ok(docs.body.paths['/users/demo/budget/summary']);
    assert.ok(docs.body.paths['/users/demo/budget/categories']);
    assert.ok(docs.body.paths['/users/demo/ads/disclosure']);
    assert.ok(docs.body.paths['/users/demo/expiry-deals/radar']);
    assert.ok(docs.body.paths['/health']);
    assert.ok(docs.body.paths['/users/demo/households/current']);
    assert.ok(docs.body.paths['/indices']);
    assert.ok(docs.body.paths['/indices/{id}']);
    assert.ok(docs.body.paths['/market/overview']);
    assert.ok(docs.body.paths['/users/demo/loyalty/offers']);
    assert.ok(docs.body.paths['/users/demo/meal-plans/suggestions']);
    assert.ok(docs.body.paths['/nutrition/value']);
    assert.ok(docs.body.paths['/users/demo/pantry/replenishment']);
    assert.ok(docs.body.paths['/prices/freshness']);
    assert.ok(docs.body.paths['/users/demo/privacy/export']);
    assert.ok(docs.body.paths['/users/demo/privacy/deletion-plan']);
    assert.ok(docs.body.paths['/products']);
    assert.ok(docs.body.paths['/products/{id}/terminal']);
    assert.ok(docs.body.paths['/products/{id}/spread']);
    assert.ok(docs.body.paths['/products/{id}/store-savings']);
    assert.ok(docs.body.paths['/products/{id}/history-summary']);
    assert.ok(docs.body.paths['/products/{id}/history-confidence']);
    assert.ok(docs.body.paths['/products/{id}/deal-score']);
    assert.ok(docs.body.paths['/products/{id}/equivalents']);
    assert.ok(docs.body.paths['/products/{id}/history']);
    assert.ok(docs.body.paths['/users/demo/receipts/review']);
    assert.ok(docs.body.paths['/stores']);
    assert.ok(docs.body.paths['/stores/{id}/category-coverage']);
    assert.ok(docs.body.paths['/stores/{id}/coverage']);
    assert.ok(docs.body.paths['/stores/{id}/deal-summary']);
    assert.ok(docs.body.paths['/stores/{id}/deals']);
    assert.ok(docs.body.paths['/users/demo/favorite-stores']);
    assert.ok(docs.body.paths['/users/demo/favorite-stores/{storeId}']);
    assert.ok(docs.body.paths['/users/demo/alerts/inbox']);
    assert.ok(docs.body.paths['/users/demo/basket/local-offers']);
    assert.ok(docs.body.paths['/users/demo/basket/stores/{storeId}/quote']);
  });

  it('serves products, stores, prices, watchlists, baskets, and alerts', async () => {
    const market = await request(app.getHttpServer()).get('/market/overview').expect(200);
    assert.equal(market.body.city, 'Stockholm');
    assert.equal(market.body.demo, true);
    assert.equal(market.body.movers[0].productId, 'coffee');
    assert.equal(market.body.movers[0].oneMonthMovePercent, -16.7);
    assert.equal(market.body.topDeals[0].productId, 'coffee');

    const nutrition = await request(app.getHttpServer()).get('/nutrition/value?metric=protein').expect(200);
    assert.equal(nutrition.body.metric, 'protein');
    assert.equal(nutrition.body.currency, 'SEK');
    assert.equal(nutrition.body.demo, true);
    assert.equal(nutrition.body.leader.productId, 'chicken');
    assert.equal(nutrition.body.rows[0].valuePer10Sek, 22.89);
    assert.equal(nutrition.body.guardrails.length, 3);

    const subscriptionAccess = await request(app.getHttpServer())
      .get('/users/demo/account/subscription-access?now=2026-05-20T00:00:00.000Z')
      .expect(200);
    assert.equal(subscriptionAccess.body.userTier, 'free');
    assert.equal(subscriptionAccess.body.premiumFeaturesEnabled, false);
    assert.equal(subscriptionAccess.body.adsRemoved, false);
    assert.equal(subscriptionAccess.body.checkoutRequired, true);
    assert.deepEqual(subscriptionAccess.body.enforcementReasons, ['missing_subscription_entitlement']);
    assert.deepEqual(subscriptionAccess.body.accountActions, ['show_upgrade']);
    assert.equal(subscriptionAccess.body.summary, 'Free tier: no active subscription entitlement.');
    assert.equal(subscriptionAccess.body.demo, true);

    const subscriptionEntitlement = await request(app.getHttpServer()).get('/users/demo/account/subscription-entitlement').expect(200);
    assert.deepEqual(subscriptionEntitlement.body, { userId: 'demo', entitlement: null, demo: true });

    const mealPlan = await request(app.getHttpServer())
      .get('/users/demo/meal-plans/suggestions?maxMealCost=120&servings=4')
      .expect(200);
    assert.equal(mealPlan.body.userId, 'demo');
    assert.equal(mealPlan.body.currency, 'SEK');
    assert.equal(mealPlan.body.maxMealCost, 120);
    assert.equal(mealPlan.body.servings, 4);
    assert.equal(mealPlan.body.dealCount, 4);
    assert.deepEqual(mealPlan.body.ingredientProductIds, ['chicken', 'pasta', 'tomatoes']);
    assert.equal(mealPlan.body.suggestions[0].title, 'Chicken thighs pasta bowl');
    assert.equal(mealPlan.body.suggestions[0].estimatedCostPerServing, 26.18);
    assert.match(mealPlan.body.guardrails[0], /never update a basket/i);
    assert.equal(mealPlan.body.demo, true);

    const constrainedMealPlan = await request(app.getHttpServer())
      .get('/users/demo/meal-plans/suggestions?maxMealCost=20')
      .expect(200);
    assert.deepEqual(constrainedMealPlan.body.suggestions, []);
    assert.deepEqual(constrainedMealPlan.body.ingredientProductIds, []);

    const freshness = await request(app.getHttpServer())
      .get('/prices/freshness?asOf=2026-06-03T00:00:00.000Z')
      .expect(200);
    assert.equal(freshness.body.asOf, '2026-06-03T00:00:00.000Z');
    assert.equal(freshness.body.demo, true);
    assert.deepEqual(freshness.body.summary, { fresh: 0, aging: 0, stale: 4 });
    assert.deepEqual(freshness.body.backfillProductIds, ['butter', 'coffee', 'milk', 'private-label-milk']);

    const indices = await request(app.getHttpServer()).get('/indices').expect(200);
    assert.equal(indices.body[0].id, 'stockholm-grocery-index');
    assert.equal(indices.body[0].demo, true);

    const index = await request(app.getHttpServer()).get('/indices/stockholm-grocery-index').expect(200);
    assert.equal(index.body.label, 'Stockholm Grocery Index');
    assert.equal(index.body.demo, true);

    const products = await request(app.getHttpServer()).get('/products?q=coffee').expect(200);
    assert.equal(products.body[0].id, 'coffee');
    assert.equal(products.body[0].currentPrices[0].priceType, 'shelf');
    assert.equal(products.body[0].currentPrices[0].sourceType, 'demo_seed');
    assert.ok(products.body[0].currentPrices[0].provenance);

    await request(app.getHttpServer()).get('/products/coffee').expect(200);
    await request(app.getHttpServer()).get('/stores/willys-odenplan').expect(200);

    const storeDeals = await request(app.getHttpServer()).get('/stores/willys-odenplan/deals').expect(200);
    assert.deepEqual(
      storeDeals.body.map((deal: { productId: string; storeId: string; dealScore: number; demo: boolean }) => ({
        productId: deal.productId,
        storeId: deal.storeId,
        dealScore: deal.dealScore,
        demo: deal.demo
      })),
      [
        { productId: 'coffee', storeId: 'willys-odenplan', dealScore: 82, demo: true },
        { productId: 'private-label-milk', storeId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'milk', storeId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'butter', storeId: 'willys-odenplan', dealScore: 40, demo: true }
      ]
    );

    const prices = await request(app.getHttpServer()).get('/products/coffee/prices').expect(200);
    assert.equal(prices.body[0].currency, 'SEK');
    assert.equal(prices.body[0].confidence, 'high');

    const terminal = await request(app.getHttpServer()).get('/products/coffee/terminal').expect(200);
    assert.equal(terminal.body.productId, 'coffee');
    assert.equal(terminal.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(terminal.body.quote.bestPrice, 49.9);
    assert.deepEqual(terminal.body.distributions.map((distribution: { label: string }) => distribution.label), [
      'Whole Stockholm',
      'Odenplan local area'
    ]);
    assert.equal(terminal.body.chart.series[0].id, 'willys-odenplan:shelf');
    assert.equal(terminal.body.historySummary.isNewLow, true);
    assert.equal(terminal.body.evidenceGuardrails.length, 3);

    const spread = await request(app.getHttpServer()).get('/products/coffee/spread').expect(200);
    assert.equal(spread.body.productId, 'coffee');
    assert.equal(spread.body.currency, 'SEK');
    assert.equal(spread.body.sampleSize, 3);
    assert.equal(spread.body.bestStoreId, 'willys-odenplan');
    assert.equal(spread.body.highestStoreId, 'coop-odenplan');
    assert.equal(spread.body.spread, 15);
    assert.equal(spread.body.spreadPercent, 30.1);
    assert.deepEqual(spread.body.rows.map((row: { storeId: string; rank: number; priceLabel: string }) => ({
      storeId: row.storeId,
      rank: row.rank,
      priceLabel: row.priceLabel
    })), [
      { storeId: 'willys-odenplan', rank: 1, priceLabel: 'best' },
      { storeId: 'lidl-sveavagen', rank: 2, priceLabel: 'above_best' },
      { storeId: 'coop-odenplan', rank: 3, priceLabel: 'above_best' }
    ]);
    assert.match(spread.body.customerRead, /ranges 15.00 SEK/);
    assert.equal(spread.body.guardrails.length, 3);

    const storeSavings = await request(app.getHttpServer()).get('/products/coffee/store-savings').expect(200);
    assert.equal(storeSavings.body.productId, 'coffee');
    assert.equal(storeSavings.body.currency, 'SEK');
    assert.equal(storeSavings.body.sampleSize, 3);
    assert.equal(storeSavings.body.bestStoreId, 'willys-odenplan');
    assert.equal(storeSavings.body.highestStoreId, 'coop-odenplan');
    assert.equal(storeSavings.body.maxSavings, 15);
    assert.equal(storeSavings.body.maxSavingsPercent, 23.1);
    assert.deepEqual(
      storeSavings.body.rows.map((row: { storeId: string; rank: number; savingsVsHighest: number; priceLabel: string }) => ({
        storeId: row.storeId,
        rank: row.rank,
        savingsVsHighest: row.savingsVsHighest,
        priceLabel: row.priceLabel
      })),
      [
        { storeId: 'willys-odenplan', rank: 1, savingsVsHighest: 15, priceLabel: 'best_savings' },
        { storeId: 'lidl-sveavagen', rank: 2, savingsVsHighest: 5, priceLabel: 'saves_vs_highest' },
        { storeId: 'coop-odenplan', rank: 3, savingsVsHighest: 0, priceLabel: 'highest_price' }
      ]
    );
    assert.match(storeSavings.body.guardrails[0], /verified quotes/i);
    assert.equal(storeSavings.body.demo, true);

    const historySummary = await request(app.getHttpServer()).get('/products/coffee/history-summary').expect(200);
    assert.equal(historySummary.body.productId, 'coffee');
    assert.equal(historySummary.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(historySummary.body.trend, 'new_low');
    assert.deepEqual(historySummary.body.summary, {
      latestPrice: 49.9,
      previousPrice: 59.9,
      changeFromPrevious: -10,
      lowestPrice: 49.9,
      highestPrice: 69.9,
      isNewLow: true,
      observedCount: 3,
      latestObservedAt: '2026-05-19T00:00:00.000Z'
    });
    assert.match(historySummary.body.guardrails[0], /recorded product history/i);
    assert.equal(historySummary.body.demo, true);

    const historyConfidence = await request(app.getHttpServer()).get('/products/coffee/history-confidence').expect(200);
    assert.equal(historyConfidence.body.productId, 'coffee');
    assert.equal(historyConfidence.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.deepEqual(historyConfidence.body.disclosure, {
      rangeDays: 90,
      firstObservedAt: '2026-04-01T00:00:00.000Z',
      lastObservedAt: '2026-05-19T00:00:00.000Z',
      observationCount: 3,
      sourceTypesIncluded: ['shelf'],
      sourceTypesMissing: [],
      availabilityGapCount: 0,
      hasConfirmedOutOfStock: false,
      hasEstimatedPoints: false,
      hasMemberOnlyExcluded: false,
      confidenceState: 'limited_history',
      headlineCopy: 'Limited history',
      detailCopy: 'We have observed this item for 49 days, so older lows may be missing.',
      canClaimLowestInWindow: false,
      legalCopyMode: 'observed_low_only'
    });
    assert.match(historyConfidence.body.guardrails[0], /lowest-price claim/i);
    assert.equal(historyConfidence.body.demo, true);

    const dealScore = await request(app.getHttpServer()).get('/products/coffee/deal-score?distanceKm=12.5').expect(200);
    assert.equal(dealScore.body.productId, 'coffee');
    assert.equal(dealScore.body.score, 82);
    assert.deepEqual(dealScore.body.band, { label: 'Good deal', verdict: 'Buy' });
    assert.equal(dealScore.body.verdict, 'Buy');
    assert.equal(dealScore.body.discountVsMedianPercent, 16.7);
    assert.equal(dealScore.body.historicalPercentile, 12);
    assert.equal(dealScore.body.confidence, 0.9);
    assert.match(dealScore.body.reasons[0], /Willys Odenplan/);
    assert.equal(dealScore.body.demo, true);

    const equivalents = await request(app.getHttpServer()).get('/products/milk/equivalents').expect(200);
    assert.deepEqual(
      equivalents.body.map((equivalent: { productId: string; bestStoreId: string; dealScore: number; demo: boolean }) => ({
        productId: equivalent.productId,
        bestStoreId: equivalent.bestStoreId,
        dealScore: equivalent.dealScore,
        demo: equivalent.demo
      })),
      [
        { productId: 'private-label-milk', bestStoreId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'butter', bestStoreId: 'coop-odenplan', dealScore: 40, demo: true }
      ]
    );

    const history = await request(app.getHttpServer()).get('/products/coffee/history').expect(200);
    assert.deepEqual(
      history.body.map((point: { productId: string; date: string; price: number; verified: boolean; demo: boolean }) => ({
        productId: point.productId,
        date: point.date,
        price: point.price,
        verified: point.verified,
        demo: point.demo
      })),
      [
        { productId: 'coffee', date: '2026-04-01', price: 69.9, verified: true, demo: true },
        { productId: 'coffee', date: '2026-05-01', price: 59.9, verified: true, demo: true },
        { productId: 'coffee', date: '2026-05-19', price: 49.9, verified: true, demo: true }
      ]
    );

    await request(app.getHttpServer())
      .post('/users/demo/watchlist')
      .send({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, allowedPriceTypes: ['shelf'] })
      .expect(201);
    const watchlist = await request(app.getHttpServer()).get('/users/demo/watchlist').expect(200);
    assert.equal(watchlist.body.items[0].productId, 'coffee');
    assert.deepEqual(watchlist.body.items[0].allowedPriceTypes, ['shelf']);

    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 2 })
      .expect(201);
    const basket = await request(app.getHttpServer()).get('/users/demo/basket').expect(200);
    assert.equal(basket.body.items[0].quantity, 2);

    const budget = await request(app.getHttpServer()).get('/users/demo/budget/summary').expect(200);
    assert.equal(budget.body.weeklyBudget, 0);
    assert.equal(budget.body.monthlyBudget, 0);
    assert.equal(budget.body.estimatedBasketTotal, 99.8);
    assert.equal(budget.body.weeklyActualSpend, 0);
    assert.equal(budget.body.monthlyActualSpend, 0);
    assert.equal(budget.body.weeklyRemainingAfterEstimate, -99.8);
    assert.equal(budget.body.weeklyRemainingActual, 0);
    assert.equal(budget.body.monthlyRemainingActual, 0);
    assert.equal(budget.body.weeklyStatus, 'under');
    assert.equal(budget.body.monthlyStatus, 'under');
    assert.equal(budget.body.demo, true);

    const categoryBudget = await request(app.getHttpServer()).get('/users/demo/budget/categories').expect(200);
    assert.equal(categoryBudget.body.userId, 'demo');
    assert.deepEqual(categoryBudget.body.categories, []);
    assert.deepEqual(categoryBudget.body.unbudgetedCategories, [
      { category: 'coffee', estimatedSpend: 99.8, productIds: ['coffee'] }
    ]);
    assert.equal(categoryBudget.body.demo, true);

    await request(app.getHttpServer()).get('/users/demo/households/current').expect(404);

    const householdPayload = {
      householdId: 'demo-household',
      name: 'Demo Household',
      weeklyBudget: 500,
      approvalLimit: 70,
      reviewer: 'demo',
      members: [
        { userId: 'demo', displayName: 'Demo Shopper' },
        { userId: 'partner', displayName: 'Partner Shopper' }
      ],
      basketItems: [
        { productId: 'milk', quantity: 2, addedBy: 'demo' },
        { productId: 'coffee', quantity: 1, addedBy: 'partner' }
      ],
      watchlistItems: [{ productId: 'coffee', addedBy: 'demo', targetPrice: 50 }],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    };
    const householdWrite = await request(app.getHttpServer())
      .put('/users/demo/households/current')
      .send(householdPayload)
      .expect(200);
    assert.equal(householdWrite.body.userId, 'demo');
    assert.equal(householdWrite.body.household.id, 'demo-household');
    assert.equal(householdWrite.body.summary.estimatedTotal, 77.7);
    assert.equal(householdWrite.body.summary.remainingBudget, 422.3);
    assert.deepEqual(householdWrite.body.summary.sharedFavoriteStoreIds, ['lidl-sveavagen', 'willys-odenplan']);
    assert.deepEqual(householdWrite.body.approvalPolicy, {
      approvalLimit: 70,
      reviewer: 'demo',
      requiresOwnerApproval: true
    });
    assert.equal(householdWrite.body.demo, true);

    const householdRead = await request(app.getHttpServer()).get('/users/demo/households/current').expect(200);
    assert.equal(householdRead.body.household.id, 'demo-household');
    assert.equal(householdRead.body.household.members.length, 2);
    assert.equal(householdRead.body.demo, true);

    const pantry = await request(app.getHttpServer())
      .get('/users/demo/pantry/replenishment?asOf=2026-05-20T08:00:00.000Z')
      .expect(200);
    assert.equal(pantry.body.householdId, 'demo');
    assert.deepEqual(
      pantry.body.statuses.map((item: { productId: string; status: string; remainingQuantity: number }) => ({
        productId: item.productId,
        status: item.status,
        remainingQuantity: item.remainingQuantity
      })),
      [
        { productId: 'coffee', status: 'low_stock', remainingQuantity: 0.5 },
        { productId: 'milk', status: 'expiring_soon', remainingQuantity: 1 },
        { productId: 'butter', status: 'in_stock', remainingQuantity: 1 }
      ]
    );
    assert.deepEqual(pantry.body.expiringSoonProductIds, ['milk']);
    assert.deepEqual(
      pantry.body.replenishment.map((item: { productId: string; alreadyInBasket: boolean; bestDeal?: { storeId: string; price: number } }) => ({
        productId: item.productId,
        alreadyInBasket: item.alreadyInBasket,
        bestDeal: item.bestDeal && { storeId: item.bestDeal.storeId, price: item.bestDeal.price }
      })),
      [{ productId: 'coffee', alreadyInBasket: true, bestDeal: { storeId: 'willys-odenplan', price: 49.9 } }]
    );
    assert.equal(pantry.body.demo, true);

    const loyalty = await request(app.getHttpServer()).get('/users/demo/loyalty/offers').expect(200);
    assert.equal(loyalty.body.userId, 'demo');
    assert.equal(loyalty.body.totalEligibleSavings, 26);
    assert.equal(loyalty.body.requiresActionCount, 1);
    assert.equal(loyalty.body.membershipRequiredCount, 1);
    assert.deepEqual(
      loyalty.body.offers.map((offer: { productId: string; chain: string; savings: number; status: string; actionRequired: boolean }) => ({
        productId: offer.productId,
        chain: offer.chain,
        savings: offer.savings,
        status: offer.status,
        actionRequired: offer.actionRequired
      })),
      [
        { productId: 'coffee', chain: 'ica', savings: 7, status: 'eligible', actionRequired: false },
        { productId: 'milk', chain: 'coop', savings: 12, status: 'needs_coupon', actionRequired: true },
        { productId: 'private-label-milk', chain: 'willys', savings: 7, status: 'eligible', actionRequired: false }
      ]
    );
    assert.match(loyalty.body.guardrails[0], /member-only savings never overwrite verified public shelf evidence/i);
    assert.equal(loyalty.body.demo, true);

    const disclosure = await request(app.getHttpServer()).get('/users/demo/ads/disclosure').expect(200);
    assert.equal(disclosure.body.userId, 'demo');
    assert.equal(disclosure.body.userTier, 'free');
    assert.equal(disclosure.body.placementPlan.slots.length, 2);
    assert.equal(disclosure.body.premiumAdsRemoved, false);
    assert.equal(disclosure.body.affectsDealScore, false);
    assert.equal(disclosure.body.allowedCount, 2);
    assert.equal(disclosure.body.blockedCount, 2);
    assert.deepEqual(disclosure.body.excludedSurfaces, ['deal_score', 'checkout_decision', 'basket_optimizer']);
    assert.match(disclosure.body.guardrails[0], /Sponsored placements cannot change Deal Score/i);
    assert.equal(disclosure.body.demo, true);

    const expiryRadar = await request(app.getHttpServer())
      .get('/users/demo/expiry-deals/radar?now=2026-05-20T10:00:00.000Z&category=vegetables&maxDistanceKm=2')
      .expect(200);
    assert.equal(expiryRadar.body.userId, 'demo');
    assert.deepEqual(expiryRadar.body.categoryFilter, ['vegetables']);
    assert.equal(expiryRadar.body.maxDistanceKm, 2);
    assert.equal(expiryRadar.body.reportCount, 3);
    assert.deepEqual(expiryRadar.body.stores.map((store: { storeId: string }) => store.storeId), ['coop-odenplan']);
    assert.deepEqual(
      expiryRadar.body.stores[0].items.map((item: { id: string; urgency: string; verification: string; savings: number; radarScore: number }) => ({
        id: item.id,
        urgency: item.urgency,
        verification: item.verification,
        savings: item.savings,
        radarScore: item.radarScore
      })),
      [{ id: 'expiry-tomatoes-coop', urgency: 'expires_soon', verification: 'needs_confirmation', savings: 15, radarScore: 68 }]
    );
    assert.deepEqual(expiryRadar.body.alerts, []);
    assert.match(expiryRadar.body.guardrails[0], /separate from public shelf-price history/i);
    assert.equal(expiryRadar.body.demo, true);

    const receiptReview = await request(app.getHttpServer()).get('/users/demo/receipts/review').expect(200);
    assert.equal(receiptReview.body.userId, 'demo');
    assert.equal(receiptReview.body.lineCount, 3);
    assert.equal(receiptReview.body.matchedCount, 2);
    assert.equal(receiptReview.body.needsReviewCount, 2);
    assert.equal(receiptReview.body.review.budget.afterReceiptSpend, 762);
    assert.equal(receiptReview.body.review.budget.remaining, 38);
    assert.equal(receiptReview.body.review.comparedWithLocalMedianDelta, 3);
    assert.deepEqual(receiptReview.body.review.goodBuys.map((item: { productId: string }) => item.productId), ['coffee']);
    assert.deepEqual(
      receiptReview.body.review.overspend.map((item: { productId: string; deltaVsMedian: number }) => [
        item.productId,
        item.deltaVsMedian
      ]),
      [['cheese', 18]]
    );
    assert.match(receiptReview.body.guardrails[0], /Low confidence.*cannot update catalog or Deal Score/i);
    assert.equal(receiptReview.body.demo, true);

    const comparison = await request(app.getHttpServer()).get('/users/demo/basket/comparison').expect(200);
    assert.deepEqual(comparison.body.strategies.map((strategy: { id: string }) => strategy.id), [
      'cheapest_across_selected',
      'all_at_one_store',
      'favorite_only',
      'private_label_substitution'
    ]);
    assert.deepEqual(comparison.body.strategies[0].missingProductIds, ['coffee']);
    assert.match(comparison.body.strategies[0].warnings[0], /missing verified prices/);

    const localOffers = await request(app.getHttpServer())
      .get('/users/demo/basket/local-offers?asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.equal(localOffers.body.userId, 'demo');
    assert.equal(localOffers.body.demo, true);
    assert.equal(localOffers.body.basketItemCount, 1);
    assert.ok(localOffers.body.storeIds.length > 0);
    assert.equal(localOffers.body.bestStore.storeId, 'willys-odenplan');
    assert.equal(localOffers.body.bestStore.matchedProductIds[0], 'coffee');
    assert.equal(localOffers.body.guardrails.length, 3);

    const storeQuote = await request(app.getHttpServer()).get('/users/demo/basket/stores/willys-odenplan/quote').expect(200);
    assert.equal(storeQuote.body.storeId, 'willys-odenplan');
    assert.equal(storeQuote.body.storeName, 'Willys Odenplan');
    assert.equal(storeQuote.body.total, 99.8);
    assert.equal(storeQuote.body.priceGapVsCheapestComplete, 0);
    assert.deepEqual(storeQuote.body.missingProductIds, []);
    assert.equal(storeQuote.body.demo, true);

    const categoryMarket = await request(app.getHttpServer()).get('/categories/coffee/market').expect(200);
    assert.equal(categoryMarket.body.category, 'coffee');
    assert.equal(categoryMarket.body.city, 'Stockholm');
    assert.equal(categoryMarket.body.productCount, 1);
    assert.deepEqual(categoryMarket.body.topDeal, { productId: 'coffee', currentPrice: 49.9, dealScore: 82 });
    assert.equal(categoryMarket.body.rows[0].productId, 'coffee');
    assert.equal(categoryMarket.body.rows[0].currentPrice, 49.9);
    assert.equal(categoryMarket.body.rows[0].verifiedHistoryPoints, 3);
    assert.match(categoryMarket.body.rows[0].customerRead, /49\.90 SEK at Willys Odenplan/);
    assert.equal(categoryMarket.body.guardrails.length, 3);
    assert.equal(categoryMarket.body.demo, true);

    await request(app.getHttpServer()).get('/users/demo/alerts').expect(200);
    const inbox = await request(app.getHttpServer()).get('/users/demo/alerts/inbox').expect(200);
    assert.equal(inbox.body.userId, 'demo');
    assert.equal(inbox.body.demo, true);
    assert.equal(inbox.body.quietHoursWindow, '21:00-07:00');
    assert.equal(inbox.body.heldCount, 1);
    assert.equal(inbox.body.suppressedCount, 1);
    assert.deepEqual(
      inbox.body.queue
        .filter((item: { status: string }) => item.status !== 'delivered')
        .map((item: { id: string; status: string; channel: string }) => ({
          id: item.id,
          status: item.status,
          channel: item.channel
        })),
      [
        { id: 'receipt-review-quiet-hours', status: 'held', channel: 'push' },
        { id: 'butter-provider-suppression', status: 'suppressed', channel: 'push' }
      ]
    );

    const initialFavorites = await request(app.getHttpServer()).get('/users/demo/favorite-stores').expect(200);
    assert.deepEqual(initialFavorites.body, []);

    const addedFavorite = await request(app.getHttpServer())
      .post('/users/demo/favorite-stores')
      .send({ storeId: 'willys-odenplan' })
      .expect(201);
    assert.deepEqual(
      addedFavorite.body.map((store: { id: string; demo: boolean }) => ({ id: store.id, demo: store.demo })),
      [{ id: 'willys-odenplan', demo: true }]
    );

    await request(app.getHttpServer())
      .post('/users/demo/favorite-stores')
      .send({ storeId: 'lidl-sveavagen' })
      .expect(201);

    const removedFavorite = await request(app.getHttpServer())
      .delete('/users/demo/favorite-stores/lidl-sveavagen')
      .expect(200);
    assert.deepEqual(
      removedFavorite.body.map((store: { id: string; demo: boolean }) => ({ id: store.id, demo: store.demo })),
      [{ id: 'willys-odenplan', demo: true }]
    );

    const privacyExport = await request(app.getHttpServer()).get('/users/demo/privacy/export').expect(200);
    assert.equal(privacyExport.body.userId, 'demo');
    assert.equal(privacyExport.body.generatedAt, '2026-05-20T12:00:00.000Z');
    assert.deepEqual(privacyExport.body.sections.find((section: { name: string }) => section.name === 'favorite_stores')?.records, [
      { storeId: 'willys-odenplan' }
    ]);
    assert.deepEqual(privacyExport.body.sections.find((section: { name: string }) => section.name === 'watchlist')?.records, [
      { productId: 'coffee' }
    ]);
    assert.equal(privacyExport.body.demo, true);

    const deletionPlan = await request(app.getHttpServer()).post('/users/demo/privacy/deletion-plan').expect(200);
    assert.equal(deletionPlan.body.userId, 'demo');
    assert.equal(deletionPlan.body.destructiveAction, false);
    assert.equal(deletionPlan.body.requiresReauthentication, true);
    assert.ok(deletionPlan.body.deleteFromTables.includes('receipt_uploads'));
    assert.deepEqual(deletionPlan.body.anonymizeTables, ['community_price_reports']);
    assert.equal(deletionPlan.body.demo, true);
  });

  it('rejects invalid request DTOs through the global ValidationPipe', async () => {
    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 0 })
      .expect(400);
  });

  it('returns 404 for missing product terminal data', async () => {
    await request(app.getHttpServer()).get('/products/missing-product/terminal').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/spread').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/store-savings').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/history-summary').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/history-confidence').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/deal-score').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/equivalents').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/history').expect(404);
  });

  it('returns 404 for missing store deals', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/deals').expect(404);
    await request(app.getHttpServer()).get('/users/demo/basket/stores/missing-store/quote').expect(404);
    await request(app.getHttpServer()).post('/users/demo/favorite-stores').send({ storeId: 'missing-store' }).expect(404);
    await request(app.getHttpServer()).delete('/users/demo/favorite-stores/missing-store').expect(404);
  });

  it('rejects invalid nutrition metrics', async () => {
    await request(app.getHttpServer()).get('/nutrition/value?metric=sugar').expect(400);
  });

  it('rejects invalid meal plan suggestion inputs', async () => {
    await request(app.getHttpServer()).get('/users/demo/meal-plans/suggestions?servings=0').expect(400);
    await request(app.getHttpServer()).get('/users/demo/meal-plans/suggestions?maxMealCost=abc').expect(400);
  });

  it('rejects invalid expiry markdown radar inputs', async () => {
    await request(app.getHttpServer()).get('/users/demo/expiry-deals/radar?maxDistanceKm=0').expect(400);
  });

  it('rejects invalid household plan inputs', async () => {
    await request(app.getHttpServer())
      .put('/users/demo/households/current')
      .send({
        householdId: 'demo-household',
        name: 'Demo Household',
        weeklyBudget: 500,
        approvalLimit: 70,
        reviewer: 'demo',
        members: [{ userId: 'demo', displayName: 'Demo Shopper' }],
        basketItems: [{ productId: 'missing-product', quantity: 1, addedBy: 'demo' }]
      })
      .expect(400);
  });

  it('returns 404 for missing indices', async () => {
    await request(app.getHttpServer()).get('/indices/missing-index').expect(404);
  });

  it('returns 404 for missing category market reports', async () => {
    await request(app.getHttpServer()).get('/categories/missing-category/market').expect(404);
  });
});
