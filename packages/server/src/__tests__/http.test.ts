import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createGroceryViewApi, type BasketImportReviewItem } from '@groceryview/api';
import { createSessionToken } from '@groceryview/auth';
import type { FriendSharedDealSignalRecord } from '@groceryview/db';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

function signBillingWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

function signStripeWebhookBody(body: string, secret: string, timestamp: number): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('createHttpHandler', () => {
  it('serves runtime health without leaking configured secret values', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousPublicWebUrl = process.env.PUBLIC_WEB_URL;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.DATABASE_URL = 'postgres://user:secret@localhost:5432/groceryview';
    process.env.PUBLIC_WEB_URL = 'https://groceryview.example';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';

    try {
      const handle = createHttpHandler(undefined, {
        authSecret: 'session-secret',
        notificationWebhookSecret: 'webhook-secret',
        billingWebhookSecret: 'billing-webhook-secret',
        notificationMetricsToken: 'metrics-secret'
      });

      const response = await handle(new Request('http://localhost/api/health'));
      assert.equal(response.status, 200);
      const body = await json(response);
      assert.deepEqual(body, {
        status: 'ok',
        service: 'groceryview-server',
        environment: 'test',
        hasDatabase: true,
        hasPublicWebUrl: true,
        hasAuthSecret: true,
        hasNotificationWebhookSecret: true,
        hasBillingWebhookSecret: true,
        hasMetricsToken: true,
        hasScanUploadStorage: false
      });
      assert.equal(JSON.stringify(body).includes('groceryview.example'), false);
    } finally {
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
      if (previousPublicWebUrl === undefined) {
        delete process.env.PUBLIC_WEB_URL;
      } else {
        process.env.PUBLIC_WEB_URL = previousPublicWebUrl;
      }
      if (previousNodeEnv === undefined) {
        delete (process.env as Record<string, string | undefined>).NODE_ENV;
      } else {
        (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
      }
    }
  });

  it('accepts contact requests without echoing messages and returns structured validation errors', async () => {
    const handle = createHttpHandler(undefined, { now: new Date('2026-05-20T08:00:00.000Z') });
    const validBody = {
      name: 'Ada Shopper',
      email: 'ada@example.com',
      subject: 'Question about price alerts',
      message: 'Please tell me how grocery price alerts work.',
      consent: true,
      source: 'web'
    };

    const accepted = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
      body: JSON.stringify(validBody)
    }));
    assert.equal(accepted.status, 202);
    const acceptedBody = await json(accepted) as { ok: boolean; status: string; requestId: string; receivedAt: string };
    assert.deepEqual(acceptedBody, {
      ok: true,
      status: 'accepted',
      requestId: 'contact_1a1cf37d882c8365',
      receivedAt: '2026-05-20T08:00:00.000Z'
    });
    assert.equal(JSON.stringify(acceptedBody).includes(validBody.message), false);
    assert.equal(JSON.stringify(acceptedBody).includes(validBody.email), false);

    const invalid = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.11' },
      body: JSON.stringify({ ...validBody, email: 'not-an-email', message: 'short' })
    }));
    assert.equal(invalid.status, 400);
    const invalidBody = await json(invalid) as { ok: boolean; error: { code: string; details: Array<{ path: string }> } };
    assert.equal(invalidBody.ok, false);
    assert.equal(invalidBody.error.code, 'validation_failed');
    assert.deepEqual(invalidBody.error.details.map((detail) => detail.path), ['email', 'message']);

    const unsupported = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'text/plain', 'x-forwarded-for': '203.0.113.12' },
      body: 'hello'
    }));
    assert.equal(unsupported.status, 415);
    assert.equal(((await json(unsupported) as { error: { code: string } }).error.code), 'unsupported_media_type');

    const tooLarge = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.13' },
      body: JSON.stringify({ ...validBody, message: 'x'.repeat(9000) })
    }));
    assert.equal(tooLarge.status, 413);
    assert.equal(((await json(tooLarge) as { error: { code: string } }).error.code), 'payload_too_large');

    for (let index = 0; index < 5; index += 1) {
      const response = await handle(new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.14' },
        body: JSON.stringify({ ...validBody, message: `Valid contact message ${index}.` })
      }));
      assert.equal(response.status, 202);
    }
    const rateLimited = await handle(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.14' },
      body: JSON.stringify(validBody)
    }));
    assert.equal(rateLimited.status, 429);
    assert.equal(rateLimited.headers.get('retry-after'), '3600');
    assert.equal(((await json(rateLimited) as { error: { code: string } }).error.code), 'contact_rate_limited');

    const previousDisabled = process.env.CONTACT_FORM_DISABLED;
    process.env.CONTACT_FORM_DISABLED = 'true';
    try {
      const unavailable = await handle(new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.15' },
        body: JSON.stringify(validBody)
      }));
      assert.equal(unavailable.status, 503);
      assert.equal(((await json(unavailable) as { error: { code: string } }).error.code), 'contact_unavailable');
    } finally {
      if (previousDisabled === undefined) delete process.env.CONTACT_FORM_DISABLED;
      else process.env.CONTACT_FORM_DISABLED = previousDisabled;
    }
  });

  it('exchanges verified auth provider assertions for bearer sessions', async () => {
    const handle = createHttpHandler(undefined, {
      authSecret: 'session-secret',
      now: new Date('2026-05-20T00:00:00.000Z'),
      authSessionExchange: {
        verify: async (assertion) => {
          assert.deepEqual(assertion, {
            provider: 'magic_link',
            assertion: 'valid-code',
            email: 'shopper@example.com'
          });
          return { userId: 'user-1', email: 'shopper@example.com' };
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ provider: 'magic_link', assertion: 'valid-code', email: 'shopper@example.com' })
    }));
    assert.equal(response.status, 200);
    const session = await json(response) as {
      userId: string;
      email: string;
      tokenType: string;
      accessToken: string;
      expiresAt: string;
    };
    assert.equal(session.userId, 'user-1');
    assert.equal(session.email, 'shopper@example.com');
    assert.equal(session.tokenType, 'Bearer');
    assert.equal(session.expiresAt, '2026-05-27T00:00:00.000Z');
    assert.equal(session.accessToken.includes('valid-code'), false);
    assert.equal(JSON.stringify(session).includes('valid-code'), false);

    const protectedResponse = await handle(new Request('http://localhost/api/watchlist?userId=user-1', {
      headers: { authorization: `Bearer ${session.accessToken}` }
    }));
    assert.equal(protectedResponse.status, 200);

    const missingVerifier = createHttpHandler(undefined, { authSecret: 'session-secret' });
    const unavailable = await missingVerifier(new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ provider: 'magic_link', assertion: 'valid-code' })
    }));
    assert.equal(unavailable.status, 503);
  });

  it('serves market, store, product, and index GET endpoints as JSON', async () => {
    const notificationInboxTaskNowValues: string[] = [];
    const handle = createHttpHandler(undefined, {
      now: new Date('2026-05-20T08:00:00.000Z'),
      notificationInboxRepository: {
        async listDueNotificationTasks(now) {
          notificationInboxTaskNowValues.push(now);
          return [
            {
              id: 'receipt-review-quiet-hours',
              title: 'Receipt review reminder',
              body: 'Review receipt OCR matches',
              channel: 'push',
              type: 'receipt_review',
              priority: 'normal',
              sendAt: '2026-05-20T07:00:00.000Z',
              recipient: 'user-1',
              attemptCount: 0,
              maxAttempts: 3,
              status: 'queued'
            }
          ];
        },
        async listActiveNotificationSuppressions() {
          return [
            {
              id: 'suppression-provider-record-123',
              recipient: 'ExponentPushToken[butter]',
              channel: 'push',
              reason: 'bounce',
              active: true
            }
          ];
        }
      }
    });

    const openApi = await handle(new Request('http://localhost/api/openapi.json'));
    assert.equal(openApi.status, 200);
    const openApiBody = await json(openApi) as { openapi: string; paths: Record<string, unknown> };
    assert.equal(openApiBody.openapi, '3.1.0');
    assert.ok(openApiBody.paths['/api/products/{id}/terminal']);
    assert.ok(openApiBody.paths['/api/products/{id}/history']);
    assert.ok(openApiBody.paths['/api/nutrition/value']);

    const market = await handle(new Request('http://localhost/api/market/overview'));
    assert.equal(market.status, 200);
    const marketBody = await json(market) as { city: string; movers: Array<{ productId: string; oneMonthMovePercent: number; stockholmMedianGap: number; verifiedHistoryPoints: number }> };
    assert.equal(marketBody.city, 'Stockholm');
    assert.equal(marketBody.movers[0]?.productId, 'coffee');
    assert.equal(marketBody.movers[0]?.oneMonthMovePercent, -16.7);
    assert.equal(marketBody.movers[0]?.stockholmMedianGap, -10);
    assert.equal(marketBody.movers[0]?.verifiedHistoryPoints, 3);

    const fuel = await handle(new Request('http://localhost/api/fuel'));
    assert.equal(fuel.status, 200);
    const fuelBody = await json(fuel) as {
      domain: string;
      grades: string[];
      observations: Array<{ grade: string; pricePerLitre: { amount: number; currency: string }; domain: string; source: { kind: string; operatorName: string } }>;
      sources: Array<{ kind: string; sourceUrl: string }>;
    };
    assert.equal(fuelBody.domain, 'fuel');
    assert.deepEqual(fuelBody.grades, ['98', '95', 'E85', 'diesel', 'HVO100']);
    assert.deepEqual(fuelBody.observations.map((row) => [row.grade, row.pricePerLitre.amount, row.pricePerLitre.currency, row.domain]), [
      ['98', 20.19, 'SEK', 'fuel'],
      ['95', 18.89, 'SEK', 'fuel'],
      ['E85', 15.84, 'SEK', 'fuel'],
      ['diesel', 21.34, 'SEK', 'fuel'],
      ['HVO100', 29.74, 'SEK', 'fuel']
    ]);
    assert.equal(fuelBody.observations[0]?.source.kind, 'operator');
    assert.equal(fuelBody.observations[0]?.source.operatorName, 'St1 Sverige AB');
    assert.equal(fuelBody.sources[0]?.sourceUrl, 'https://st1.se/foretag/listpris');

    const fuelAlias = await handle(new Request('http://localhost/fuel'));
    assert.equal(fuelAlias.status, 200);
    assert.equal((await json(fuelAlias) as { domain: string }).domain, 'fuel');

    const nutrition = await handle(new Request('http://localhost/api/nutrition/value?metric=protein'));
    assert.equal(nutrition.status, 200);
    const nutritionBody = await json(nutrition) as { metric: string; rows: Array<{ productId: string; valuePer10Sek: number }>; leader: { productId: string } };
    assert.equal(nutritionBody.metric, 'protein');
    assert.deepEqual(nutritionBody.rows.map((row) => [row.productId, row.valuePer10Sek]), [
      ['chicken', 22.89],
      ['eggs', 21.49],
      ['yogurt', 15.76]
    ]);
    assert.equal(nutritionBody.leader.productId, 'chicken');

    const mealPlans = await handle(new Request('http://localhost/api/meal-plans/suggestions?userId=user-1&maxMealCost=120&servings=4'));
    assert.equal(mealPlans.status, 200);
    const mealPlansBody = await json(mealPlans) as {
      userId: string;
      suggestions: Array<{ title: string; estimatedCost: number; estimatedCostPerServing: number; ingredientProductIds: string[] }>;
      ingredientProductIds: string[];
      guardrails: string[];
    };
    assert.equal(mealPlansBody.userId, 'user-1');
    assert.deepEqual(mealPlansBody.suggestions.map((meal) => [meal.title, meal.estimatedCost, meal.estimatedCostPerServing]), [
      ['Chicken thighs pasta bowl', 104.7, 26.18]
    ]);
    assert.deepEqual(mealPlansBody.ingredientProductIds, ['chicken', 'pasta', 'tomatoes']);
    assert.match(mealPlansBody.guardrails[0] ?? '', /never update a basket/i);

    const expiryRadar = await handle(new Request('http://localhost/api/expiry-deals/radar?userId=user-1&now=2026-05-20T10:00:00.000Z&category=protein&maxDistanceKm=3'));
    assert.equal(expiryRadar.status, 200);
    const expiryRadarBody = await json(expiryRadar) as {
      stores: Array<{ storeId: string; items: Array<{ id: string; urgency: string; verification: string; savings: number; radarScore: number }> }>;
      alerts: Array<{ reportId: string; message: string }>;
      staleReportIds: string[];
      guardrails: string[];
    };
    assert.deepEqual(expiryRadarBody.stores.map((store) => store.storeId), ['hemkop-fridhemsplan']);
    assert.deepEqual(expiryRadarBody.stores[0]?.items.map((item) => ({
      id: item.id,
      urgency: item.urgency,
      verification: item.verification,
      savings: item.savings,
      radarScore: item.radarScore
    })), [{
      id: 'expiry-chicken-hemkop',
      urgency: 'expires_today',
      verification: 'verified',
      savings: 50,
      radarScore: 100
    }]);
    assert.deepEqual(expiryRadarBody.alerts, [{
      reportId: 'expiry-chicken-hemkop',
      productId: 'chicken',
      storeId: 'hemkop-fridhemsplan',
      type: 'expiry_markdown',
      message: 'Chicken breast is 50% off at Hemkop Fridhemsplan before expiry.'
    }]);
    assert.deepEqual(expiryRadarBody.staleReportIds, []);
    assert.match(expiryRadarBody.guardrails[0] ?? '', /separate from public shelf-price history/i);

    const pantry = await handle(new Request('http://localhost/api/pantry/replenishment?userId=user-1&asOf=2026-05-20T08:00:00.000Z'));
    assert.equal(pantry.status, 200);
    const pantryBody = await json(pantry) as { statuses: Array<{ productId: string; status: string }>; replenishment: Array<{ productId: string; alreadyInBasket: boolean }>; expiringSoonProductIds: string[] };
    assert.deepEqual(pantryBody.statuses.map((row) => [row.productId, row.status]), [
      ['coffee', 'low_stock'],
      ['milk', 'expiring_soon'],
      ['butter', 'in_stock']
    ]);
    assert.deepEqual(pantryBody.replenishment.map((row) => [row.productId, row.alreadyInBasket]), [['coffee', false]]);
    assert.deepEqual(pantryBody.expiringSoonProductIds, ['milk']);

    const loyalty = await handle(new Request('http://localhost/api/loyalty/offers?userId=user-1'));
    assert.equal(loyalty.status, 200);
    const loyaltyBody = await json(loyalty) as { totalEligibleSavings: number; requiresActionCount: number; offers: Array<{ productId: string; status: string; savings: number }> };
    assert.equal(loyaltyBody.totalEligibleSavings, 26);
    assert.equal(loyaltyBody.requiresActionCount, 1);
    assert.deepEqual(loyaltyBody.offers.map((offer) => [offer.productId, offer.status, offer.savings]), [
      ['coffee', 'eligible', 7],
      ['milk', 'needs_coupon', 12],
      ['private-label-milk', 'eligible', 7]
    ]);

    const adDisclosure = await handle(new Request('http://localhost/api/ads/disclosure?userId=user-1'));
    assert.equal(adDisclosure.status, 200);
    const adDisclosureBody = await json(adDisclosure) as {
      userId: string;
      userTier: string;
      allowedCount: number;
      blockedCount: number;
      premiumAdsRemoved: boolean;
      affectsDealScore: boolean;
      placementPlan: { slots: Array<{ surface: string; label: string }> };
      guardrails: string[];
    };
    assert.equal(adDisclosureBody.userId, 'user-1');
    assert.equal(adDisclosureBody.userTier, 'free');
    assert.equal(adDisclosureBody.placementPlan.slots.length, 2);
    assert.equal(adDisclosureBody.allowedCount, 2);
    assert.equal(adDisclosureBody.blockedCount, 2);
    assert.equal(adDisclosureBody.premiumAdsRemoved, false);
    assert.equal(adDisclosureBody.affectsDealScore, false);
    assert.match(adDisclosureBody.guardrails[0] ?? '', /Sponsored placements cannot change Deal Score/i);

    const notificationInbox = await handle(new Request('http://localhost/api/notifications/inbox?userId=user-1'));
    assert.equal(notificationInbox.status, 200);
    const notificationInboxBody = await json(notificationInbox) as {
      userId: string;
      generatedAt: string;
      activeAlertCount: number;
      deliveredCount: number;
      heldCount: number;
      suppressedCount: number;
      summary: { total: number };
      queue: Array<{ id: string; status: string; reason: string; sendAt: string }>;
      guardrails: string[];
    };
    assert.equal(notificationInboxBody.userId, 'user-1');
    assert.equal(notificationInboxBody.generatedAt, '2026-05-20T08:00:00.000Z');
    assert.equal(notificationInboxBody.activeAlertCount, 0);
    assert.equal(notificationInboxBody.deliveredCount, 0);
    assert.equal(notificationInboxBody.heldCount, 1);
    assert.equal(notificationInboxBody.suppressedCount, 1);
    assert.equal(notificationInboxBody.summary.total, 2);
    assert.deepEqual(notificationInboxTaskNowValues, ['2026-05-20T08:00:00.000Z']);
    assert.equal(notificationInboxBody.queue.some((item) => item.id === 'receipt-review-quiet-hours'), true);
    assert.equal(notificationInboxBody.queue.some((item) => item.id === 'suppression-provider-record-123'), true);
    assert.equal(notificationInboxBody.queue.find((item) => item.id === 'receipt-review-quiet-hours')?.sendAt, '2026-05-20T07:00:00.000Z');
    assert.equal(notificationInboxBody.queue.find((item) => item.id === 'suppression-provider-record-123')?.sendAt, '2026-05-20T08:00:00.000Z');
    assert.match(notificationInboxBody.queue.find((item) => item.status === 'held')?.reason ?? '', /Quiet hours/i);
    assert.match(notificationInboxBody.guardrails[0] ?? '', /Estimated prices never generate household alerts/i);

    const receiptReview = await handle(new Request('http://localhost/api/receipts/review?userId=user-1'));
    assert.equal(receiptReview.status, 200);
    const receiptReviewBody = await json(receiptReview) as {
      userId: string;
      lineCount: number;
      matchedCount: number;
      needsReviewCount: number;
      review: { budget: { afterReceiptSpend: number; remaining: number }; comparedWithLocalMedianDelta: number; confidenceLabel: string };
      guardrails: string[];
    };
    assert.equal(receiptReviewBody.userId, 'user-1');
    assert.equal(receiptReviewBody.lineCount, 3);
    assert.equal(receiptReviewBody.matchedCount, 2);
    assert.equal(receiptReviewBody.needsReviewCount, 2);
    assert.equal(receiptReviewBody.review.budget.afterReceiptSpend, 762);
    assert.equal(receiptReviewBody.review.budget.remaining, 38);
    assert.equal(receiptReviewBody.review.comparedWithLocalMedianDelta, 3);
    assert.equal(receiptReviewBody.review.confidenceLabel, 'medium-high');
    assert.match(receiptReviewBody.guardrails[0] ?? '', /cannot update catalog or Deal Score/i);

    const categoryMarket = await handle(new Request('http://localhost/api/categories/coffee/market'));
    assert.equal(categoryMarket.status, 200);
    const categoryMarketBody = await json(categoryMarket) as {
      category: string;
      productCount: number;
      topDeal: { productId: string; currentPrice: number; dealScore: number };
      rows: Array<{ productId: string; oneMonthMovePercent: number; range52WeekPositionPercent: number; verifiedHistoryPoints: number }>;
    };
    assert.equal(categoryMarketBody.category, 'coffee');
    assert.equal(categoryMarketBody.productCount, 1);
    assert.deepEqual(categoryMarketBody.topDeal, { productId: 'coffee', currentPrice: 49.9, dealScore: 82 });
    assert.deepEqual(categoryMarketBody.rows.map((row) => [row.productId, row.oneMonthMovePercent, row.range52WeekPositionPercent, row.verifiedHistoryPoints]), [
      ['coffee', -16.7, 0, 3]
    ]);

    const categories = await handle(new Request('http://localhost/api/categories'));
    assert.equal(categories.status, 200);
    assert.deepEqual(await json(categories), [
      { id: 'coffee', name: 'Coffee', slug: 'coffee', parentId: null, itemCount: 1 },
      { id: 'dairy', name: 'Dairy', slug: 'dairy', parentId: null, itemCount: 3 }
    ]);

    const stores = await handle(new Request('http://localhost/api/stores'));
    assert.equal(stores.status, 200);
    assert.equal((await json(stores) as Array<{ id: string }>)[0].id, 'willys-odenplan');

    const retailers = await handle(new Request('http://localhost/api/retailers'));
    assert.equal(retailers.status, 200);
    assert.deepEqual((await json(retailers) as Array<{ id: string; name: string; logo: string; websiteUrl: string }>).map((retailer) => [
      retailer.id,
      retailer.name,
      retailer.logo,
      retailer.websiteUrl
    ]), [
      ['city-gross', 'City Gross', '/retailers/city-gross.svg', 'https://www.citygross.se/'],
      ['coop', 'Coop', '/retailers/coop.svg', 'https://www.coop.se/'],
      ['hemkop', 'Hemköp', '/retailers/hemkop.svg', 'https://www.hemkop.se/'],
      ['ica', 'ICA', '/retailers/ica.svg', 'https://www.ica.se/'],
      ['lidl', 'Lidl', '/retailers/lidl.svg', 'https://www.lidl.se/'],
      ['netto', 'Netto', '/retailers/netto.svg', 'https://www.coop.se/'],
      ['willys', 'Willys', '/retailers/willys.svg', 'https://www.willys.se/']
    ]);

    const storeDetail = await handle(new Request('http://localhost/api/stores/willys-odenplan'));
    assert.equal(storeDetail.status, 200);
    const storeDetailBody = await json(storeDetail) as {
      id: string;
      name: string;
      store: { id: string; address: string };
      openingHours: string[];
      assortment: {
        items: Array<{ category: string; productId: string; priceLabel: string }>;
        categories: Array<{ category: string; itemCount: number }>;
      };
      guardrails: string[];
    };
    assert.equal(storeDetailBody.id, 'willys-odenplan');
    assert.equal(storeDetailBody.name, 'Willys Odenplan');
    assert.equal(storeDetailBody.store.id, 'willys-odenplan');
    assert.equal(storeDetailBody.store.address, 'Odenplan, Stockholm');
    assert.deepEqual(storeDetailBody.openingHours, ['Mon-Fri 08:00-22:00', 'Sat-Sun 09:00-21:00']);
    assert.deepEqual(storeDetailBody.assortment.items.map((item) => [item.category, item.productId, item.priceLabel]), [
      ['coffee', 'coffee', 'verified_shelf'],
      ['dairy', 'milk', 'verified_shelf'],
      ['dairy', 'butter', 'verified_shelf'],
      ['dairy', 'private-label-milk', 'verified_shelf']
    ]);
    assert.deepEqual(storeDetailBody.assortment.categories.map((category) => [category.category, category.itemCount]), [
      ['coffee', 1],
      ['dairy', 3]
    ]);
    assert.match(storeDetailBody.guardrails[0] ?? '', /verified shelf price rows/i);

    const storeDeals = await handle(new Request('http://localhost/api/stores/willys-odenplan/deals'));
    assert.equal(storeDeals.status, 200);
    assert.deepEqual((await json(storeDeals) as Array<{ productId: string; storeId: string }>).map((deal) => [deal.productId, deal.storeId]), [
      ['coffee', 'willys-odenplan'],
      ['private-label-milk', 'willys-odenplan'],
      ['milk', 'willys-odenplan'],
      ['butter', 'willys-odenplan']
    ]);

    const deals = await handle(new Request('http://localhost/api/deals?category=dairy'));
    assert.equal(deals.status, 503);
    assert.deepEqual(await json(deals), { error: 'Deals provider is not configured.' });

    const flyerOffers = await handle(new Request('http://localhost/api/deals/flyer-offers?chain=willys&asOf=2026-05-20T12:00:00.000Z'));
    assert.equal(flyerOffers.status, 503);
    assert.deepEqual(await json(flyerOffers), { error: 'Flyer offers provider is not configured.' });

    const discounts = await handle(new Request('http://localhost/api/deals/discounts?chain=willys&asOf=2026-05-20T12:00:00.000Z'));
    assert.equal(discounts.status, 503);
    assert.deepEqual(await json(discounts), { error: 'Discounts provider is not configured.' });

    const storeFlyerOffers = await handle(new Request('http://localhost/api/stores/lidl-sveavagen/flyer-offers?asOf=2026-05-20T12:00:00.000Z'));
    assert.equal(storeFlyerOffers.status, 503);
    assert.deepEqual(await json(storeFlyerOffers), { error: 'Store flyer offers provider is not configured.' });

    const storeDiscounts = await handle(new Request('http://localhost/api/stores/lidl-sveavagen/discounts?asOf=2026-05-20T12:00:00.000Z'));
    assert.equal(storeDiscounts.status, 503);
    assert.deepEqual(await json(storeDiscounts), { error: 'Store discounts provider is not configured.' });

    const storeDealSummary = await handle(new Request('http://localhost/api/stores/willys-odenplan/deal-summary'));
    assert.equal(storeDealSummary.status, 200);
    const storeDealSummaryBody = await json(storeDealSummary) as {
      storeId: string;
      dealCount: number;
      buyVerdictCount: number;
      averageDealScore: number;
      topDeal: { productId: string; dealScore: number };
      categories: Array<{ category: string; dealCount: number; averageDealScore: number; topProductId: string; topDealScore: number }>;
      guardrails: string[];
    };
    assert.equal(storeDealSummaryBody.storeId, 'willys-odenplan');
    assert.equal(storeDealSummaryBody.dealCount, 4);
    assert.equal(storeDealSummaryBody.buyVerdictCount, 1);
    assert.equal(storeDealSummaryBody.averageDealScore, 67);
    assert.deepEqual(storeDealSummaryBody.topDeal, {
      productId: 'coffee',
      ticker: 'ZOEGAS-COFFEE-450G',
      productName: 'Zoégas Coffee 450g',
      category: 'coffee',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      price: 49.9,
      dealScore: 82,
      band: { label: 'Good deal', verdict: 'Buy' },
      unitPrice: '110.89 SEK/kg'
    });
    assert.deepEqual(storeDealSummaryBody.categories, [
      { category: 'coffee', dealCount: 1, averageDealScore: 82, topProductId: 'coffee', topDealScore: 82 },
      { category: 'dairy', dealCount: 3, averageDealScore: 62, topProductId: 'private-label-milk', topDealScore: 73 }
    ]);
    assert.match(storeDealSummaryBody.guardrails[0] ?? '', /verified in-store deal rows/i);

    const storeCoverage = await handle(new Request('http://localhost/api/stores/lidl-sveavagen/price-coverage'));
    assert.equal(storeCoverage.status, 200);
    const storeCoverageBody = await json(storeCoverage) as {
      storeId: string;
      productCount: number;
      pricedProductCount: number;
      coveragePercent: number;
      totalKnownPrice: number;
      missingProductIds: string[];
      lines: Array<{ productId: string; price: number | null; priceLabel: string }>;
      guardrails: string[];
    };
    assert.equal(storeCoverageBody.storeId, 'lidl-sveavagen');
    assert.equal(storeCoverageBody.productCount, 4);
    assert.equal(storeCoverageBody.pricedProductCount, 2);
    assert.equal(storeCoverageBody.coveragePercent, 50);
    assert.equal(storeCoverageBody.totalKnownPrice, 73.8);
    assert.deepEqual(storeCoverageBody.missingProductIds, ['private-label-milk', 'butter']);
    assert.deepEqual(storeCoverageBody.lines.map((line) => [line.productId, line.price, line.priceLabel]), [
      ['coffee', 59.9, 'verified_shelf'],
      ['milk', 13.9, 'verified_shelf'],
      ['private-label-milk', null, 'missing_price'],
      ['butter', null, 'missing_price']
    ]);
    assert.match(storeCoverageBody.guardrails[0] ?? '', /verified shelf prices/i);

    const categoryCoverage = await handle(new Request('http://localhost/api/stores/lidl-sveavagen/category-coverage'));
    assert.equal(categoryCoverage.status, 200);
    const categoryCoverageBody = await json(categoryCoverage) as {
      storeId: string;
      categoryCount: number;
      fullyPricedCategoryCount: number;
      categories: Array<{
        category: string;
        productCount: number;
        pricedProductCount: number;
        coveragePercent: number;
        totalKnownPrice: number;
        missingProductIds: string[];
        bestDealProductId: string | null;
        bestDealScore: number | null;
      }>;
      guardrails: string[];
    };
    assert.equal(categoryCoverageBody.storeId, 'lidl-sveavagen');
    assert.equal(categoryCoverageBody.categoryCount, 2);
    assert.equal(categoryCoverageBody.fullyPricedCategoryCount, 1);
    assert.deepEqual(categoryCoverageBody.categories, [
      {
        category: 'coffee',
        productCount: 1,
        pricedProductCount: 1,
        coveragePercent: 100,
        totalKnownPrice: 59.9,
        missingProductIds: [],
        bestDealProductId: 'coffee',
        bestDealScore: 82
      },
      {
        category: 'dairy',
        productCount: 3,
        pricedProductCount: 1,
        coveragePercent: 33.3,
        totalKnownPrice: 13.9,
        missingProductIds: ['private-label-milk', 'butter'],
        bestDealProductId: 'milk',
        bestDealScore: 73
      }
    ]);
    assert.match(categoryCoverageBody.guardrails[0] ?? '', /verified store-price rows/i);

    const product = await handle(new Request('http://localhost/api/products/coffee'));
    assert.equal(product.status, 200);
    assert.equal((await json(product) as { ticker: string }).ticker, 'ZOEGAS-COFFEE-450G');

    const dealScore = await handle(new Request('http://localhost/api/products/coffee/deal-score?distanceKm=12.5'));
    assert.equal(dealScore.status, 200);
    assert.deepEqual(await json(dealScore), {
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

    const priceSpread = await handle(new Request('http://localhost/api/products/coffee/price-spread'));
    assert.equal(priceSpread.status, 200);
    const priceSpreadBody = await json(priceSpread) as {
      productId: string;
      sampleSize: number;
      bestStoreId: string;
      highestStoreId: string;
      spread: number;
      spreadPercent: number;
      rows: Array<{ storeId: string; rank: number; deltaFromBest: number; priceLabel: string }>;
      guardrails: string[];
    };
    assert.equal(priceSpreadBody.productId, 'coffee');
    assert.equal(priceSpreadBody.sampleSize, 3);
    assert.equal(priceSpreadBody.bestStoreId, 'willys-odenplan');
    assert.equal(priceSpreadBody.highestStoreId, 'coop-odenplan');
    assert.equal(priceSpreadBody.spread, 15);
    assert.equal(priceSpreadBody.spreadPercent, 30.1);
    assert.deepEqual(priceSpreadBody.rows.map((row) => [row.storeId, row.rank, row.deltaFromBest, row.priceLabel]), [
      ['willys-odenplan', 1, 0, 'best'],
      ['lidl-sveavagen', 2, 10, 'above_best'],
      ['coop-odenplan', 3, 15, 'above_best']
    ]);
    assert.match(priceSpreadBody.guardrails[0] ?? '', /verified store quotes/i);

    const cheapestNow = await handle(new Request('http://localhost/api/products/coffee/cheapest-now'));
    assert.equal(cheapestNow.status, 200);
    assert.deepEqual(await json(cheapestNow), {
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      category: 'coffee',
      currency: 'SEK',
      cheapest: {
        chain: 'willys',
        storeId: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        packagePrice: 49.9,
        comparableUnitPrice: 110.89,
        comparableUnit: 'kg'
      },
      chainPrices: [
        {
          chain: 'willys',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          packagePrice: 49.9,
          comparableUnitPrice: 110.89,
          comparableUnit: 'kg'
        },
        {
          chain: 'lidl',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          packagePrice: 59.9,
          comparableUnitPrice: 133.11,
          comparableUnit: 'kg'
        },
        {
          chain: 'coop',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          packagePrice: 64.9,
          comparableUnitPrice: 144.22,
          comparableUnit: 'kg'
        }
      ],
      chainCount: 3,
      observedPriceCount: 3,
      lastObservedAt: '2026-05-19T00:00:00.000Z',
      guardrails: [
        'Cheapest-now compares only current observed prices for this exact product.',
        'Each chain contributes at most its cheapest currently observed store row.',
        'Missing chains stay absent instead of being estimated from other chains or products.'
      ]
    });

    const storeSavings = await handle(new Request('http://localhost/api/products/coffee/store-savings'));
    assert.equal(storeSavings.status, 200);
    const storeSavingsBody = await json(storeSavings) as {
      productId: string;
      sampleSize: number;
      bestStoreId: string;
      highestStoreId: string;
      maxSavings: number;
      maxSavingsPercent: number;
      rows: Array<{ storeId: string; rank: number; savingsVsHighest: number; priceLabel: string }>;
      guardrails: string[];
    };
    assert.equal(storeSavingsBody.productId, 'coffee');
    assert.equal(storeSavingsBody.sampleSize, 3);
    assert.equal(storeSavingsBody.bestStoreId, 'willys-odenplan');
    assert.equal(storeSavingsBody.highestStoreId, 'coop-odenplan');
    assert.equal(storeSavingsBody.maxSavings, 15);
    assert.equal(storeSavingsBody.maxSavingsPercent, 23.1);
    assert.deepEqual(storeSavingsBody.rows.map((row) => [row.storeId, row.rank, row.savingsVsHighest, row.priceLabel]), [
      ['willys-odenplan', 1, 15, 'best_savings'],
      ['lidl-sveavagen', 2, 5, 'saves_vs_highest'],
      ['coop-odenplan', 3, 0, 'highest_price']
    ]);
    assert.match(storeSavingsBody.guardrails[0] ?? '', /verified quotes/i);

    const terminal = await handle(new Request('http://localhost/api/products/coffee/terminal?asOf=2026-05-19T00:00:00.000Z'));
    assert.equal(terminal.status, 200);
    const terminalBody = await json(terminal) as {
      quote: { bestPrice: number; range52Week: { low: number; high: number }; evidenceVolume: { currentPrices: number } };
      distributions: Array<{ label: string; median: number; currentPercentile: number; customerRead: string }>;
      chart: { series: Array<{ id: string; points: Array<{ value: number }> }> };
      historySummary: { isNewLow: boolean };
    };
    assert.equal(terminalBody.quote.bestPrice, 49.9);
    assert.deepEqual(terminalBody.quote.range52Week, { low: 49.9, high: 69.9 });
    assert.equal(terminalBody.quote.evidenceVolume.currentPrices, 3);
    assert.deepEqual(terminalBody.distributions.map((distribution) => distribution.label), ['Whole Stockholm', 'Odenplan local area']);
    assert.equal(terminalBody.distributions[0].median, 59.9);
    assert.equal(terminalBody.distributions[0].currentPercentile, 8);
    assert.match(terminalBody.distributions[0].customerRead, /cheaper than 92%/);
    assert.equal(terminalBody.chart.series[0].id, 'willys-odenplan:shelf');
    assert.deepEqual(terminalBody.chart.series[0].points.map((point) => point.value), [69.9, 59.9, 49.9]);
    assert.equal(terminalBody.historySummary.isNewLow, true);

    const historySummary = await handle(new Request('http://localhost/api/products/coffee/history-summary'));
    assert.equal(historySummary.status, 200);
    const historySummaryBody = await json(historySummary) as {
      productId: string;
      trend: string;
      summary: { latestPrice: number; previousPrice: number; changeFromPrevious: number; lowestPrice: number; highestPrice: number; isNewLow: boolean; observedCount: number; latestObservedAt: string };
      guardrails: string[];
    };
    assert.equal(historySummaryBody.productId, 'coffee');
    assert.equal(historySummaryBody.trend, 'new_low');
    assert.deepEqual(historySummaryBody.summary, {
      latestPrice: 49.9,
      previousPrice: 59.9,
      changeFromPrevious: -10,
      lowestPrice: 49.9,
      highestPrice: 69.9,
      isNewLow: true,
      observedCount: 3,
      latestObservedAt: '2026-05-19T00:00:00.000Z'
    });
    assert.match(historySummaryBody.guardrails[0] ?? '', /recorded product history/i);

    const historyConfidence = await handle(new Request('http://localhost/api/products/coffee/history-confidence'));
    assert.equal(historyConfidence.status, 200);
    const historyConfidenceBody = await json(historyConfidence) as {
      productId: string;
      disclosure: {
        rangeDays: number;
        observationCount: number;
        confidenceState: string;
        headlineCopy: string;
        canClaimLowestInWindow: boolean;
        legalCopyMode: string;
        sourceTypesIncluded: string[];
        sourceTypesMissing: string[];
      };
      guardrails: string[];
    };
    assert.equal(historyConfidenceBody.productId, 'coffee');
    assert.equal(historyConfidenceBody.disclosure.rangeDays, 90);
    assert.equal(historyConfidenceBody.disclosure.observationCount, 3);
    assert.equal(historyConfidenceBody.disclosure.confidenceState, 'limited_history');
    assert.equal(historyConfidenceBody.disclosure.headlineCopy, 'Limited history');
    assert.equal(historyConfidenceBody.disclosure.canClaimLowestInWindow, false);
    assert.equal(historyConfidenceBody.disclosure.legalCopyMode, 'observed_low_only');
    assert.deepEqual(historyConfidenceBody.disclosure.sourceTypesIncluded, ['shelf']);
    assert.deepEqual(historyConfidenceBody.disclosure.sourceTypesMissing, []);
    assert.match(historyConfidenceBody.guardrails[0] ?? '', /lowest-price claim/i);

    const equivalents = await handle(new Request('http://localhost/api/products/milk/equivalents'));
    assert.equal(equivalents.status, 200);
    assert.deepEqual(await json(equivalents), [
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

    const freshness = await handle(new Request('http://localhost/api/prices/freshness?asOf=2026-06-03T00:00:00.000Z'));
    assert.equal(freshness.status, 200);
    assert.deepEqual(await json(freshness), {
      asOf: '2026-06-03T00:00:00.000Z',
      thresholds: { agingAfterDays: 7, staleAfterDays: 14 },
      summary: { fresh: 0, aging: 0, stale: 4 },
      products: [
        {
          productId: 'coffee',
          productName: 'Zoégas Coffee 450g',
          category: 'coffee',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'milk',
          productName: 'Arla Milk 1L',
          category: 'dairy',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'private-label-milk',
          productName: 'Garant Milk 1L',
          category: 'dairy',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          category: 'dairy',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        }
      ],
      backfillProductIds: ['butter', 'coffee', 'milk', 'private-label-milk']
    });

    const index = await handle(new Request('http://localhost/api/indices/stockholm-grocery-index'));
    assert.equal(index.status, 200);
    assert.equal((await json(index) as { label: string }).label, 'Stockholm Grocery Index');
  });

  it('caches hot public API endpoints through an injected response cache', async () => {
    const entries = new Map<string, string>();
    const writes: Array<{ key: string; ttlSeconds: number }> = [];
    const handle = createHttpHandler(undefined, {
      apiResponseCache: {
        get: async (key: string) => entries.get(key) ?? null,
        set: async (key: string, value: string, options: { ttlSeconds: number }) => {
          writes.push({ key, ttlSeconds: options.ttlSeconds });
          entries.set(key, value);
        }
      }
    } as any);

    const first = await handle(new Request('http://localhost/api/market/overview'));
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('x-groceryview-cache'), 'miss');
    const firstBody = await json(first);
    assert.equal(writes.length, 1);
    assert.match(writes[0]?.key ?? '', /^hot-endpoint:v1:\/api\/market\/overview/);
    assert.equal(writes[0]?.ttlSeconds, 60);

    const second = await handle(new Request('http://localhost/api/market/overview'));
    assert.equal(second.status, 200);
    assert.equal(second.headers.get('x-groceryview-cache'), 'hit');
    assert.deepEqual(await json(second), firstBody);
  });

  it('serves provider-backed rolling-average deals', async () => {
    const handle = createHttpHandler(undefined, {
      dealsProvider: async (query) => ({
        asOf: '2026-05-24T12:00:00.000Z',
        filters: query.category ? { category: query.category } : {},
        dealCount: 1,
        sortedBy: 'discount_percentage_desc',
        windowDays: 30,
        deals: [
          {
            productId: 'product-private-label-milk',
            productSlug: 'private-label-milk',
            productName: 'Garant Milk 1L',
            category: 'dairy',
            categoryPath: ['dairy'],
            storeId: 'store-willys',
            storeSlug: 'willys-odenplan',
            storeName: 'Willys Odenplan',
            chainId: 'chain-willys',
            chainSlug: 'willys',
            chainName: 'Willys',
            currentPrice: 12.9,
            rollingAveragePrice: 19.9,
            discountPercentage: 35.18,
            currency: 'SEK',
            observedAt: '2026-05-21T10:00:00.000Z'
          }
        ]
      })
    });

    const response = await handle(new Request('http://localhost/api/deals?category=dairy'));
    assert.equal(response.status, 200);
    const body = await json(response) as { filters: { category: string }; deals: Array<{ productId: string; discountPercentage: number }> };
    assert.deepEqual(body.filters, { category: 'dairy' });
    assert.deepEqual(body.deals.map((deal) => [deal.productId, deal.discountPercentage]), [
      ['product-private-label-milk', 35.18]
    ]);
  });

  it('returns cursor-paginated product envelopes for public product listing and search', async () => {
    const handle = createHttpHandler();

    const listing = await handle(new Request('http://localhost/api/products?limit=2'));
    assert.equal(listing.status, 200);
    const listingBody = await json(listing) as { items: Array<{ id: string }>; pagination: { hasMore: boolean; nextCursor: string | null } };
    assert.deepEqual(listingBody.items.map((product) => product.id), ['coffee', 'milk']);
    assert.equal(listingBody.pagination.hasMore, true);
    assert.match(listingBody.pagination.nextCursor ?? '', /^[A-Za-z0-9_-]+$/);

    const first = await handle(new Request('http://localhost/api/products/search?q=&limit=2'));
    assert.equal(first.status, 200);
    const firstBody = await json(first) as {
      items: Array<{ id: string }>;
      pagination: { limit: number; nextCursor: string | null; hasMore: boolean; source: string; totalItems: number; totalProductCount: number; totalReturned: number };
      guardrails: string[];
    };
    assert.deepEqual(firstBody.items.map((product) => product.id), ['coffee', 'milk']);
    assert.equal(firstBody.pagination.limit, 2);
    assert.equal(firstBody.pagination.totalReturned, 2);
    assert.equal(firstBody.pagination.totalItems, 4);
    assert.equal(firstBody.pagination.totalProductCount, 4);
    assert.equal(firstBody.pagination.hasMore, true);
    assert.match(firstBody.pagination.nextCursor ?? '', /^[A-Za-z0-9_-]+$/);
    assert.match(firstBody.pagination.source, /cursor pagination/i);
    assert.match(firstBody.guardrails.join(' '), /No offset page numbers/i);

    const second = await handle(new Request(`http://localhost/api/products/search?q=&limit=2&cursor=${firstBody.pagination.nextCursor}`));
    assert.equal(second.status, 200);
    const secondBody = await json(second) as { items: Array<{ id: string }>; pagination: { limit: number; nextCursor: string | null; hasMore: boolean; totalItems: number; totalProductCount: number; totalReturned: number } };
    assert.deepEqual(secondBody.items.map((product) => product.id), ['private-label-milk', 'butter']);
    assert.equal(secondBody.pagination.limit, 2);
    assert.equal(secondBody.pagination.totalReturned, 2);
    assert.equal(secondBody.pagination.totalItems, 4);
    assert.equal(secondBody.pagination.totalProductCount, 4);
    assert.equal(secondBody.pagination.hasMore, false);
    assert.equal(secondBody.pagination.nextCursor, null);
  });

  it('returns product not found for unknown product child resources', async () => {
    const handle = createHttpHandler();

    const product = await handle(new Request('http://localhost/api/products/missing-product'));
    assert.equal(product.status, 404);
    assert.deepEqual(await json(product), { error: 'Product not found.' });

    const prices = await handle(new Request('http://localhost/api/products/missing-product/prices'));
    assert.equal(prices.status, 404);
    assert.deepEqual(await json(prices), { error: 'Product not found.' });

    const history = await handle(new Request('http://localhost/api/products/missing-product/history'));
    assert.equal(history.status, 404);
    assert.deepEqual(await json(history), { error: 'Product not found.' });

    const historySummary = await handle(new Request('http://localhost/api/products/missing-product/history-summary'));
    assert.equal(historySummary.status, 404);
    assert.deepEqual(await json(historySummary), { error: 'Product not found.' });

    const historyConfidence = await handle(new Request('http://localhost/api/products/missing-product/history-confidence'));
    assert.equal(historyConfidence.status, 404);
    assert.deepEqual(await json(historyConfidence), { error: 'Product not found.' });

    const terminal = await handle(new Request('http://localhost/api/products/missing-product/terminal'));
    assert.equal(terminal.status, 404);
    assert.deepEqual(await json(terminal), { error: 'Product not found.' });

    const cheapestNow = await handle(new Request('http://localhost/api/products/missing-product/cheapest-now'));
    assert.equal(cheapestNow.status, 404);
    assert.deepEqual(await json(cheapestNow), { error: 'Product not found.' });

    const priceSpread = await handle(new Request('http://localhost/api/products/missing-product/price-spread'));
    assert.equal(priceSpread.status, 404);
    assert.deepEqual(await json(priceSpread), { error: 'Product not found.' });

    const storeSavings = await handle(new Request('http://localhost/api/products/missing-product/store-savings'));
    assert.equal(storeSavings.status, 404);
    assert.deepEqual(await json(storeSavings), { error: 'Product not found.' });

    const dealScore = await handle(new Request('http://localhost/api/products/missing-product/deal-score'));
    assert.equal(dealScore.status, 404);
    assert.deepEqual(await json(dealScore), { error: 'Product not found.' });

    const equivalents = await handle(new Request('http://localhost/api/products/missing-product/equivalents'));
    assert.equal(equivalents.status, 404);
    assert.deepEqual(await json(equivalents), { error: 'Product not found.' });

    const storeCoverage = await handle(new Request('http://localhost/api/stores/missing-store/price-coverage'));
    assert.equal(storeCoverage.status, 404);
    assert.deepEqual(await json(storeCoverage), { error: 'Store not found.' });

    const dealSummary = await handle(new Request('http://localhost/api/stores/missing-store/deal-summary'));
    assert.equal(dealSummary.status, 404);
    assert.deepEqual(await json(dealSummary), { error: 'Store not found.' });

    const flyerOffers = await handle(new Request('http://localhost/api/stores/missing-store/flyer-offers'));
    assert.equal(flyerOffers.status, 503);
    assert.deepEqual(await json(flyerOffers), { error: 'Store flyer offers provider is not configured.' });

    const discounts = await handle(new Request('http://localhost/api/stores/missing-store/discounts'));
    assert.equal(discounts.status, 503);
    assert.deepEqual(await json(discounts), { error: 'Store discounts provider is not configured.' });

    const categoryCoverage = await handle(new Request('http://localhost/api/stores/missing-store/category-coverage'));
    assert.equal(categoryCoverage.status, 404);
    assert.deepEqual(await json(categoryCoverage), { error: 'Store not found.' });
  });

  it('mutates favorite stores, watchlist, basket, and budget through proposal routes', async () => {
    const handle = createHttpHandler();

    assert.equal((await handle(new Request('http://localhost/api/users/user-1/favorite-stores', {
      method: 'POST',
      body: JSON.stringify({ storeId: 'willys-odenplan' })
    }))).status, 201);
    assert.equal((await handle(new Request('http://localhost/api/users/user-1/favorite-stores', {
      method: 'POST',
      body: JSON.stringify({ storeId: 'lidl-sveavagen' })
    }))).status, 201);
    assert.equal((await handle(new Request('http://localhost/api/users/user-1/favorite-stores/lidl-sveavagen', {
      method: 'DELETE'
    }))).status, 200);

    assert.equal((await handle(new Request('http://localhost/api/watchlist?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true, allowedPriceTypes: ['shelf'] })
    }))).status, 201);

    assert.equal((await handle(new Request('http://localhost/api/basket/items?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ productId: 'coffee', quantity: 1 })
    }))).status, 201);

    const mergedBasket = await handle(new Request('http://localhost/api/basket/items?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ productId: 'coffee', quantity: 2 })
    }));
    assert.equal(mergedBasket.status, 201);
    assert.deepEqual((await json(mergedBasket) as { items: unknown[] }).items, [{ productId: 'coffee', quantity: 3 }]);

    assert.equal((await handle(new Request('http://localhost/api/watchlist/items/coffee?userId=user-1', {
      method: 'PATCH',
      body: JSON.stringify({ targetPrice: 48, favoriteStoresOnly: false })
    }))).status, 200);

    assert.equal((await handle(new Request('http://localhost/api/basket/items/coffee?userId=user-1', {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 2 })
    }))).status, 200);

    assert.equal((await handle(new Request('http://localhost/api/budget?userId=user-1', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyBudget: 800, monthlyBudget: 3200 })
    }))).status, 200);

    assert.equal((await handle(new Request('http://localhost/api/budget/categories?userId=user-1', {
      method: 'PATCH',
      body: JSON.stringify({ categories: [{ category: 'coffee', weeklyBudget: 100 }, { category: 'dairy', weeklyBudget: 40 }] })
    }))).status, 200);

    const watchlist = await json(await handle(new Request('http://localhost/api/watchlist?userId=user-1'))) as {
      items: Array<{ allowedPriceTypes?: string[] }>;
      alerts: unknown[];
    };
    assert.deepEqual(watchlist.items[0]?.allowedPriceTypes, ['shelf']);
    assert.equal(watchlist.alerts.length, 2);

    const priceAlerts = await handle(new Request('http://localhost/api/watchlist/price-alerts?userId=user-1'));
    assert.equal(priceAlerts.status, 503);
    assert.deepEqual(await json(priceAlerts), { error: 'Watchlist price-alert provider is not configured.' });

    const updatedPriceAlerts = await handle(new Request('http://localhost/api/watchlist/price-alerts?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ productId: 'coffee', targetPrice: 50, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] })
    }));
    assert.equal(updatedPriceAlerts.status, 503);
    assert.deepEqual(await json(updatedPriceAlerts), { error: 'Watchlist price-alert writer is not configured.' });

    const comparison = await json(await handle(new Request('http://localhost/api/basket/compare?userId=user-1', { method: 'POST' }))) as { cheapestByProduct: { total: number } };
    assert.equal(comparison.cheapestByProduct.total, 99.8);

    const comparisonReport = await json(await handle(new Request('http://localhost/api/basket/comparison-report?userId=user-1'))) as {
      currency: string;
      favoriteStoreIds: string[];
      strategies: Array<{ id: string; assignments: Array<{ productId: string; lineTotal: number; priceLabel: string }> }>;
    };
    assert.equal(comparisonReport.currency, 'SEK');
    assert.deepEqual(comparisonReport.favoriteStoreIds, ['willys-odenplan']);
    assert.deepEqual(comparisonReport.strategies.map((strategy) => strategy.id), [
      'cheapest_across_selected',
      'all_at_one_store',
      'favorite_only',
      'private_label_substitution'
    ]);
    assert.deepEqual(comparisonReport.strategies[0]?.assignments.map((assignment) => ({
      productId: assignment.productId,
      lineTotal: assignment.lineTotal,
      priceLabel: assignment.priceLabel
    })), [{ productId: 'coffee', lineTotal: 99.8, priceLabel: 'verified_shelf' }]);



    const handoff = await json(await handle(new Request('http://localhost/api/basket/handoff/willys?userId=user-1'))) as {
      userId: string;
      retailerId: string;
      primaryAction: { actionType: string; status: string };
      actions: Array<{ actionType: string; status: string; lineCount: number }>;
      unsupportedReasons: string[];
      guardrails: string[];
    };
    assert.equal(handoff.userId, 'user-1');
    assert.equal(handoff.retailerId, 'willys');
    assert.deepEqual(handoff.primaryAction, {
      actionType: 'copy_list',
      status: 'ready',
      label: 'Copy list',
      lineCount: 1,
      productIds: ['coffee'],
      urlCount: 1,
      requiresRetailerConfirmation: true,
      reason: 'Copy list is ready for all basket lines.'
    });
    assert.deepEqual(handoff.actions.map((action) => ({ actionType: action.actionType, status: action.status, lineCount: action.lineCount })), [
      { actionType: 'copy_list', status: 'ready', lineCount: 1 },
      { actionType: 'product_deep_links', status: 'ready', lineCount: 1 },
      { actionType: 'retailer_app_search', status: 'manual_review', lineCount: 1 },
      { actionType: 'basket_transfer', status: 'unsupported', lineCount: 0 }
    ]);
    assert.match(handoff.unsupportedReasons[1] ?? '', /cannot claim purchase completion/i);
    assert.match(handoff.guardrails[0], /not checkout confirmation/i);

    const transfer = await json(await handle(new Request('http://localhost/api/basket/transfer/willys?userId=user-1'))) as {
      userId: string;
      retailerId: string;
      status: string;
      canAttemptTransfer: boolean;
      blockedReasons: string[];
      guardrails: string[];
    };
    assert.equal(transfer.userId, 'user-1');
    assert.equal(transfer.retailerId, 'willys');
    assert.equal(transfer.status, 'blocked');
    assert.equal(transfer.canAttemptTransfer, false);
    assert.match(transfer.blockedReasons[0] ?? '', /not verified as supported/);
    assert.match(transfer.guardrails[0] ?? '', /verified retailer capability/);


    const importExport = await handle(new Request('http://localhost/api/basket/import-export?userId=user-import', {
      method: 'POST',
      body: JSON.stringify({
        source: { sourceKind: 'bookmarklet', retailerId: 'willys', origin: 'https://www.willys.se', capturedAt: '2026-05-22T09:35:00.000Z', consentGranted: true },
        capturedLines: [
          { rawName: 'Zoégas Coffee 450g', productId: 'coffee', quantity: 1, productUrl: 'https://www.willys.se/produkt/coffee' },
          { rawName: 'Arla Milk 1L', quantity: 2 },
          { rawName: 'Retailer-only bakery bun', quantity: 3 }
        ]
      })
    }));
    assert.equal(importExport.status, 201);
    const importExportBody = await json(importExport) as {
      userId: string;
      status: string;
      importedItemCount: number;
      reviewItemCount: number;
      acceptedItems: Array<{ productId: string; quantity: number }>;
      reviewItems: Array<{ rawName: string }>;
      guardrails: string[];
    };
    assert.equal(importExportBody.userId, 'user-import');
    assert.equal(importExportBody.status, 'needs_review');
    assert.equal(importExportBody.importedItemCount, 2);
    assert.equal(importExportBody.reviewItemCount, 1);
    assert.deepEqual(importExportBody.acceptedItems.map((item) => [item.productId, item.quantity]), [['coffee', 1], ['milk', 2]]);
    assert.equal(importExportBody.reviewItems[0]?.rawName, 'Retailer-only bakery bun');
    assert.match(importExportBody.guardrails[0] ?? '', /explicit shopper consent/i);
    const importedBasket = await json(await handle(new Request('http://localhost/api/basket/current?userId=user-import'))) as { items: Array<{ productId: string; quantity: number }> };
    assert.deepEqual(importedBasket.items, [{ productId: 'coffee', quantity: 1 }, { productId: 'milk', quantity: 2 }]);

    const importReview = await json(await handle(new Request('http://localhost/api/basket/import-review?userId=user-import'))) as {
      userId: string;
      openItemCount: number;
      items: Array<{ reviewItemId: string; rawName: string; status: string }>;
      guardrails: string[];
    };
    assert.equal(importReview.userId, 'user-import');
    assert.equal(importReview.openItemCount, 1);
    assert.equal(importReview.items[0]?.rawName, 'Retailer-only bakery bun');
    assert.match(importReview.guardrails[0] ?? '', /account-bound/i);

    const importReviewDecision = await handle(new Request(`http://localhost/api/basket/import-review/${encodeURIComponent(importReview.items[0]!.reviewItemId)}/decisions?userId=user-import`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'accept_as_product', productId: 'coffee', quantity: 3 })
    }));
    assert.equal(importReviewDecision.status, 200);
    const importReviewDecisionBody = await json(importReviewDecision) as { status: string; resolvedProductId: string };
    assert.equal(importReviewDecisionBody.status, 'accepted');
    assert.equal(importReviewDecisionBody.resolvedProductId, 'coffee');
    assert.equal((await json(await handle(new Request('http://localhost/api/basket/import-review?userId=user-import'))) as { openItemCount: number }).openItemCount, 0);

    const slots = await json(await handle(new Request('http://localhost/api/basket/fulfillment-slots/willys/willys-odenplan?userId=user-1'))) as {
      userId: string;
      status: string;
      availableSlotCount: number;
      availableSlots: Array<{ slotId: string; mode: string; fee: number }>;
      guardrails: string[];
    };
    assert.equal(slots.userId, 'user-1');
    assert.equal(slots.status, 'evidence_available');
    assert.equal(slots.availableSlotCount, 1);
    assert.deepEqual(slots.availableSlots.map((slot) => [slot.slotId, slot.mode, slot.fee]), [['willys-pickup-tomorrow-0900', 'pickup', 0]]);
    assert.match(slots.guardrails[0], /not retailer reservations/i);

    const tripCost = await json(await handle(new Request('http://localhost/api/basket/trip-cost?userId=user-1&travelMode=car&valueOfTimePerHour=120&carCostPerKm=3.5&splitTripPenalty=15'))) as {
      userId: string;
      bestOption?: { strategyId: string; pricedBasketTotal: number; travelCost: number; effectiveTotal: number; storeIds: string[] };
      guardrails: string[];
    };
    assert.equal(tripCost.userId, 'user-1');
    assert.deepEqual(tripCost.bestOption, {
      strategyId: 'all_at_one_store',
      label: 'All at one store',
      basketTotal: 99.8,
      storeIds: ['willys-odenplan'],
      distanceKm: 0.5,
      durationMinutes: 5.29,
      missingProductIds: [],
      pricedBasketTotal: 99.8,
      travelCost: 12.33,
      effectiveTotal: 112.13,
      complete: true,
      warnings: []
    });
    assert.match(tripCost.guardrails[2], /not retailer checkout or delivery confirmations/i);

    const localOffers = await json(await handle(new Request('http://localhost/api/basket/local-offers?userId=user-1&asOf=2026-05-20T12:00:00.000Z'))) as {
      storeIds: string[];
      basketItemCount: number;
      baselineTotal: number;
      bestStore?: { storeId: string; subtotal: number; coveragePercent: number; savingsVsBaseline?: number };
      guardrails: string[];
    };
    assert.deepEqual(localOffers.storeIds, ['willys-odenplan']);
    assert.equal(localOffers.basketItemCount, 1);
    assert.equal(localOffers.baselineTotal, 119.8);
    assert.deepEqual(localOffers.bestStore, {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      subtotal: 99.8,
      matchedProductIds: ['coffee'],
      missingProductIds: [],
      unavailableProductIds: [],
      staleProductIds: [],
      coveragePercent: 100,
      averageConfidence: 0.9,
      confidenceLabel: 'high',
      freshnessLabel: 'fresh',
      sourceTypes: ['online'],
      lines: [{
        productId: 'coffee',
        quantity: 2,
        unitPrice: 49.9,
        lineTotal: 99.8,
        sourceType: 'online',
        confidence: 0.9,
        observedAt: '2026-05-19T08:00:00.000Z',
        stale: false
      }],
      savingsVsBaseline: 20
    });
    assert.match(localOffers.guardrails[0], /favorite stores/);

    const recurringDigest = await json(await handle(new Request('http://localhost/api/basket/recurring-digest?userId=user-1&templateId=weekly-basics&templateName=Weekly%20basics&cadence=weekly&asOf=2026-05-22T08:00:00.000Z'))) as {
      templateId: string;
      lineCount: number;
      comparableDelta: number;
      lines: Array<{ productId: string; changeType: string; currentStoreName?: string }>;
      guardrails: string[];
    };
    assert.equal(recurringDigest.templateId, 'weekly-basics');
    assert.equal(recurringDigest.lineCount, 1);
    assert.equal(recurringDigest.comparableDelta, -20);
    assert.deepEqual(recurringDigest.lines, [{
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      quantity: 2,
      currentUnitPrice: 49.9,
      previousUnitPrice: 59.9,
      currentLineTotal: 99.8,
      previousLineTotal: 119.8,
      lineDelta: -20,
      lineDeltaPercent: -16.69,
      currentStoreName: 'Willys Odenplan',
      confidence: 0.9,
      changeType: 'price_down',
      recommendedAction: 'Keep in recurring basket; current verified price is lower than the previous shop.'
    }]);
    assert.match(recurringDigest.guardrails[0], /both current and previous verified prices/);

    const storeQuote = await json(await handle(new Request('http://localhost/api/basket/stores/willys-odenplan/quote?userId=user-1'))) as {
      storeId: string;
      total: number | null;
      priceGapVsCheapestComplete: number | null;
      missingProductIds: string[];
    };
    assert.equal(storeQuote.storeId, 'willys-odenplan');
    assert.equal(storeQuote.total, 99.8);
    assert.equal(storeQuote.priceGapVsCheapestComplete, 0);
    assert.deepEqual(storeQuote.missingProductIds, []);

    const budget = await json(await handle(new Request('http://localhost/api/budget/summary?userId=user-1'))) as { weeklyRemainingAfterEstimate: number };
    assert.equal(budget.weeklyRemainingAfterEstimate, 700.2);

    const categoryBudget = await json(await handle(new Request('http://localhost/api/budget/categories?userId=user-1'))) as {
      categories: Array<{ category: string; estimatedSpend: number; remaining: number; status: string }>;
    };
    assert.deepEqual(categoryBudget.categories, [
      { category: 'coffee', weeklyBudget: 100, estimatedSpend: 99.8, remaining: 0.2, status: 'under', productIds: ['coffee'] },
      { category: 'dairy', weeklyBudget: 40, estimatedSpend: 0, remaining: 40, status: 'under', productIds: [] }
    ]);

    assert.equal((await handle(new Request('http://localhost/api/watchlist/items/coffee?userId=user-1', { method: 'DELETE' }))).status, 200);
    assert.equal((await handle(new Request('http://localhost/api/basket/items/coffee?userId=user-1', { method: 'DELETE' }))).status, 200);
    const emptyWatchlist = await json(await handle(new Request('http://localhost/api/watchlist?userId=user-1'))) as { items: unknown[] };
    assert.equal(emptyWatchlist.items.length, 0);
    const emptyBasket = await json(await handle(new Request('http://localhost/api/basket/current?userId=user-1'))) as { items: unknown[] };
    assert.equal(emptyBasket.items.length, 0);
  });

  it('serves user-scoped privacy export and deletion plans from protected account data', async () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, favoriteStoresOnly: true });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 100, monthlyBudget: 400 });
    (api as typeof api & { getFriendSharedDealSignals(userId: string): unknown[] }).getFriendSharedDealSignals = (userId) => userId === 'user-1'
      ? [{ signalId: 'friend-share-1', productId: 'coffee', sharedByUserId: 'friend-1', dealScore: 82 }]
      : [];
    const handle = createHttpHandler(api, { now: new Date('2026-05-20T12:00:00.000Z') });

    const exported = await json(await handle(new Request('http://localhost/api/privacy/export?userId=user-1'))) as {
      generatedAt: string;
      sections: Array<{ name: string; records: Array<Record<string, unknown>> }>;
    };
    assert.equal(exported.generatedAt, '2026-05-20T12:00:00.000Z');
    assert.deepEqual(exported.sections.find((section) => section.name === 'favorite_stores')?.records, [{ storeId: 'willys-odenplan' }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'watchlist')?.records, [{ productId: 'coffee' }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'lists')?.records, [
      { id: 'current_basket', items: [{ productId: 'milk', quantity: 2 }] }
    ]);
    assert.equal(exported.sections.find((section) => section.name === 'alerts')?.records.length, 1);
    assert.deepEqual(exported.sections.find((section) => section.name === 'preferences')?.records, [{ weeklyBudget: 100, monthlyBudget: 400 }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'analytics_events')?.records, []);
    assert.deepEqual(exported.sections.find((section) => section.name === 'friend_shared_deal_signals')?.records, [
      { signalId: 'friend-share-1', productId: 'coffee', sharedByUserId: 'friend-1', dealScore: 82 }
    ]);

    const settingsExport = await json(await handle(new Request('http://localhost/api/settings/data-export?userId=user-1'))) as {
      generatedAt: string;
      sections: Array<{ name: string; records: Array<Record<string, unknown>> }>;
    };
    assert.equal(settingsExport.generatedAt, '2026-05-20T12:00:00.000Z');
    assert.deepEqual(settingsExport.sections.map((section) => section.name), exported.sections.map((section) => section.name));

    const deletion = await handle(new Request('http://localhost/api/privacy/deletion-plan?userId=user-1', { method: 'POST' }));
    assert.equal(deletion.status, 200);
    const plan = await json(deletion) as { userId: string; deleteFromTables: string[]; anonymizeTables: string[]; destructiveAction: boolean };
    assert.equal(plan.userId, 'user-1');
    assert.equal(plan.destructiveAction, false);
    assert.ok(plan.deleteFromTables.includes('receipt_uploads'));
    assert.ok(plan.deleteFromTables.includes('friend_shared_deal_signals'));
    assert.deepEqual(plan.anonymizeTables, ['community_price_reports']);

    const fulfillment = await handle(new Request('http://localhost/api/privacy/request-fulfillment?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({
        slaDays: 30,
        alertBeforeDays: 5,
        requests: [
          {
            id: 'privacy-export-overdue',
            userId: 'user-1',
            type: 'data_export',
            receivedAt: '2026-04-19T12:00:00.000Z',
            status: 'in_progress'
          },
          {
            id: 'privacy-delete-due-soon',
            userId: 'user-1',
            type: 'account_deletion',
            receivedAt: '2026-04-25T12:00:00.000Z',
            status: 'received'
          }
        ]
      })
    }));
    assert.equal(fulfillment.status, 200);
    const fulfillmentPlan = await json(fulfillment) as {
      status: string;
      overdueRequestIds: string[];
      dueSoonRequestIds: string[];
      items: Array<{ id: string; requiredAction: string; risk: string }>;
    };
    assert.equal(fulfillmentPlan.status, 'attention_required');
    assert.deepEqual(fulfillmentPlan.overdueRequestIds, ['privacy-export-overdue']);
    assert.deepEqual(fulfillmentPlan.dueSoonRequestIds, ['privacy-delete-due-soon']);
    assert.deepEqual(fulfillmentPlan.items.map((item) => ({
      id: item.id,
      requiredAction: item.requiredAction,
      risk: item.risk
    })), [
      { id: 'privacy-export-overdue', requiredAction: 'fulfill_export', risk: 'overdue' },
      { id: 'privacy-delete-due-soon', requiredAction: 'fulfill_deletion', risk: 'due_soon' }
    ]);

    const crossUser = await handle(new Request('http://localhost/api/privacy/request-fulfillment?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ id: 'other-user-request', userId: 'user-2', type: 'data_export', receivedAt: '2026-05-20T12:00:00.000Z', status: 'received' }]
      })
    }));
    assert.equal(crossUser.status, 400);
  });

  it('persists friend share signals through the repository-backed deals endpoint', async () => {
    const signals: FriendSharedDealSignalRecord[] = [];
    const handle = createHttpHandler(undefined, {
      now: new Date('2026-05-20T12:00:00.000Z'),
      friendSharedDealSignalRepository: {
        async upsertFriendSharedDealSignal(signal) {
          signals.push(signal);
        },
        async listFriendSharedDealSignals(userId) {
          return signals.filter((signal) => signal.userId === userId);
        }
      }
    });

    const saved = await handle(new Request('http://localhost/api/deals/friend-share-signals?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({
        signalId: 'friend-share-1',
        productId: 'coffee',
        sharedByUserId: 'friend-1',
        sharedByDisplayName: 'Ada',
        relationship: 'friend',
        sharedAt: '2026-05-20T10:30:00.000Z',
        sourceConfidence: 0.87,
        optedIn: true,
        dealScore: 82
      })
    }));
    assert.equal(saved.status, 202);
    const savedBody = await json(saved) as { persisted: boolean; signal: { createdAt: string; userId: string } };
    assert.equal(savedBody.persisted, true);
    assert.equal(savedBody.signal.userId, 'user-1');
    assert.equal(savedBody.signal.createdAt, '2026-05-20T12:00:00.000Z');

    const listed = await json(await handle(new Request('http://localhost/api/deals/friend-share-signals?userId=user-1'))) as {
      signals: Array<Record<string, unknown>>;
      guardrails: string[];
    };
    assert.match(listed.guardrails.join('\n'), /Only opted-in/);
    assert.deepEqual(listed.signals, [
      {
        signalId: 'friend-share-1',
        userId: 'user-1',
        productId: 'coffee',
        sharedByUserId: 'friend-1',
        sharedByDisplayName: 'Ada',
        relationship: 'friend',
        sharedAt: '2026-05-20T10:30:00.000Z',
        sourceConfidence: 0.87,
        optedIn: true,
        dealScore: 82,
        createdAt: '2026-05-20T12:00:00.000Z'
      }
    ]);

    const exported = await json(await handle(new Request('http://localhost/api/privacy/export?userId=user-1'))) as {
      sections: Array<{ name: string; records: Array<Record<string, unknown>> }>;
    };
    assert.deepEqual(exported.sections.find((section) => section.name === 'friend_shared_deal_signals')?.records, listed.signals);

    const nonConsented = await handle(new Request('http://localhost/api/deals/friend-share-signals?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({
        signalId: 'friend-share-private',
        productId: 'coffee',
        sharedByUserId: 'friend-1',
        sharedByDisplayName: 'Ada',
        relationship: 'friend',
        sharedAt: '2026-05-20T10:30:00.000Z',
        sourceConfidence: 0.87,
        optedIn: false
      })
    }));
    assert.equal(nonConsented.status, 400);
    assert.equal((await handle(new Request('http://localhost/api/deals/friend-share-signals', { method: 'POST', body: '{}' }))).status, 400);
  });

  it('deletes signed-in settings account data after explicit confirmation', async () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, favoriteStoresOnly: true });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 100, monthlyBudget: 400 });
    const handle = createHttpHandler(api, { now: new Date('2026-05-20T12:00:00.000Z') });

    const unconfirmed = await handle(new Request('http://localhost/api/settings/account?userId=user-1', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'delete' })
    }));
    assert.equal(unconfirmed.status, 400);

    const deleted = await json(await handle(new Request('http://localhost/api/settings/account?userId=user-1', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE ACCOUNT' })
    }))) as { userId: string; deleted: boolean; deletedTables: string[]; requiresReauthentication: boolean };

    assert.equal(deleted.userId, 'user-1');
    assert.equal(deleted.deleted, true);
    assert.equal(deleted.requiresReauthentication, true);
    assert.deepEqual(deleted.deletedTables, ['basket_items', 'weekly_baskets', 'watchlist_items', 'user_preferences', 'favorite_stores', 'app_users']);
    assert.deepEqual(api.getFavoriteStores('user-1'), []);
    assert.deepEqual(api.getWatchlist('user-1').items, []);
    assert.deepEqual(api.getBasket('user-1').items, []);
    assert.equal(api.getBudgetSummary('user-1').weeklyBudget, 0);
    assert.equal(api.getBudgetSummary('user-1').monthlyBudget, 0);
  });

  it('plans pantry replenishment from stock, usage, expiry, and deal candidates', async () => {
    const handle = createHttpHandler(undefined, { now: new Date('2026-05-20T12:00:00.000Z') });

    const response = await handle(new Request('http://localhost/api/pantry/replenishment?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({
        pantry: [
          { productId: 'coffee', name: 'Coffee', category: 'pantry', quantity: 1, unit: 'pack', minimumQuantity: 1, targetQuantity: 3 },
          { productId: 'tomatoes', name: 'Tomatoes', category: 'vegetables', quantity: 1, unit: 'kg', minimumQuantity: 0.2, expiresAt: '2026-05-21T12:00:00.000Z' },
          { productId: 'yogurt', name: 'Yogurt', category: 'dairy', quantity: 1, unit: 'each', minimumQuantity: 1, expiresAt: '2026-05-18T12:00:00.000Z' }
        ],
        usage: [{ productId: 'coffee', quantityUsed: 0.25, usedAt: '2026-05-20T08:00:00.000Z' }],
        deals: [{ productId: 'coffee', storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, dealScore: 82 }]
      })
    }));

    assert.equal(response.status, 200);
    const body = await json(response) as {
      userId: string;
      statuses: Array<{ productId: string; remainingQuantity: number; status: string; daysUntilExpiry?: number }>;
      replenishment: Array<{ productId: string; quantityToBuy: number; priority: string; bestDeal?: { storeName: string } }>;
      expiringSoonProductIds: string[];
    };
    assert.equal(body.userId, 'user-1');
    assert.deepEqual(body.statuses.map((item) => [item.productId, item.remainingQuantity, item.status, item.daysUntilExpiry]), [
      ['coffee', 0.75, 'low_stock', undefined],
      ['tomatoes', 1, 'expiring_soon', 1],
      ['yogurt', 1, 'expired', -2]
    ]);
    assert.deepEqual(body.replenishment.map((item) => [item.productId, item.quantityToBuy, item.priority, item.bestDeal?.storeName]), [
      ['yogurt', 1, 'high', undefined],
      ['coffee', 2.25, 'medium', 'Willys Odenplan']
    ]);
    assert.deepEqual(body.expiringSoonProductIds, ['tomatoes']);

    const invalid = await handle(new Request('http://localhost/api/pantry/replenishment?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ pantry: [{ productId: 'coffee', name: 'Coffee', category: 'pantry', quantity: -1, unit: 'pack', minimumQuantity: 1 }] })
    }));
    assert.equal(invalid.status, 400);
  });

  it('writes and reads user-scoped household plans through protected proposal routes', async () => {
    const handle = createHttpHandler();
    const payload = {
      householdId: 'house-1',
      name: 'Odenplan Household',
      weeklyBudget: 500,
      approvalLimit: 70,
      reviewer: 'user-2',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'user-2', displayName: 'Mina' }
      ],
      basketItems: [
        { productId: 'milk', quantity: 2, addedBy: 'user-1' },
        { productId: 'coffee', quantity: 1, addedBy: 'user-2' }
      ],
      watchlistItems: [{ productId: 'coffee', addedBy: 'user-1', targetPrice: 50 }],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    };

    const written = await handle(new Request('http://localhost/api/households/current?userId=user-1', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }));
    assert.equal(written.status, 200);
    const body = await json(written) as {
      userId: string;
      summary: { estimatedTotal: number; remainingBudget: number; sharedFavoriteStoreIds: string[] };
      approvalPolicy: { requiresOwnerApproval: boolean; reviewer: string };
    };
    assert.equal(body.userId, 'user-1');
    assert.equal(body.summary.estimatedTotal, 77.7);
    assert.equal(body.summary.remainingBudget, 422.3);
    assert.deepEqual(body.summary.sharedFavoriteStoreIds, ['lidl-sveavagen', 'willys-odenplan']);
    assert.deepEqual(body.approvalPolicy, { approvalLimit: 70, reviewer: 'user-2', requiresOwnerApproval: true });

    const read = await json(await handle(new Request('http://localhost/api/households/current?userId=user-1'))) as { household: { id: string; members: unknown[] } };
    assert.equal(read.household.id, 'house-1');
    assert.equal(read.household.members.length, 2);

    const invalid = await handle(new Request('http://localhost/api/households/current?userId=user-1', {
      method: 'PUT',
      body: JSON.stringify({ ...payload, basketItems: [{ productId: 'missing-product', quantity: 1, addedBy: 'user-1' }] })
    }));
    assert.equal(invalid.status, 400);
    assert.match(JSON.stringify(await json(invalid)), /Unknown productId: missing-product/);
  });

  it('lets invited household members join and check shared grocery list lines with attribution', async () => {
    const handle = createHttpHandler();
    const payload = {
      householdId: 'house-join-1',
      name: 'Shared flat',
      weeklyBudget: 500,
      approvalLimit: 70,
      reviewer: 'user-1',
      members: [{ userId: 'user-1', displayName: 'Alex', role: 'owner' }],
      basketItems: [{ productId: 'milk', quantity: 2, addedBy: 'user-1' }],
      watchlistItems: [{ productId: 'coffee', addedBy: 'user-1', targetPrice: 50 }],
      sharedFavoriteStoreIds: ['willys-odenplan']
    };

    await handle(new Request('http://localhost/api/households/current?userId=user-1', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }));

    const joined = await handle(new Request('http://localhost/api/households/join?userId=user-2', {
      method: 'POST',
      body: JSON.stringify({
        householdId: 'house-join-1',
        inviteToken: 'house-join-1:join',
        displayName: 'Mina',
        role: 'editor'
      })
    }));
    assert.equal(joined.status, 200);
    const joinedBody = await json(joined) as { household: { members: Array<{ userId: string; role: string }> } };
    assert.deepEqual(joinedBody.household.members.map((member) => `${member.userId}:${member.role}`), ['user-1:owner', 'user-2:editor']);

    const checked = await handle(new Request('http://localhost/api/households/current/basket/check?userId=user-2', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'milk',
        checked: true,
        checkedAt: '2026-05-23T11:00:00.000Z'
      })
    }));
    assert.equal(checked.status, 200);
    const checkedBody = await json(checked) as {
      household: { basketItems: Array<{ productId: string; checked: boolean; checkedBy?: string }> };
      summary: { checkedItemCount: number; openItemCount: number };
    };
    assert.deepEqual(checkedBody.household.basketItems.map((item) => [item.productId, item.checked, item.checkedBy]), [
      ['milk', true, 'user-2']
    ]);
    assert.equal(checkedBody.summary.checkedItemCount, 1);
    assert.equal(checkedBody.summary.openItemCount, 0);

    const partnerRead = await json(await handle(new Request('http://localhost/api/households/current?userId=user-2'))) as { household: { id: string } };
    assert.equal(partnerRead.household.id, 'house-join-1');
  });

  it('creates private scan upload tickets before scan processing', async () => {
    const handle = createHttpHandler(undefined, {
      now: new Date('2026-05-20T08:00:00.000Z'),
      scanUploadStorage: {
        createUploadTicket: async (request) => ({
          scanId: request.scanId,
          uploadUrl: 'https://uploads.example/' + request.scanId + '?signature=redacted',
          payloadUri: 'private-upload://' + request.scanId,
          expiresAt: '2026-05-20T08:10:00.000Z',
          maxBytes: 5_000_000,
          headers: { 'content-type': request.contentType }
        })
      }
    });

    const health = await json(await handle(new Request('http://localhost/api/health'))) as { hasScanUploadStorage: boolean };
    assert.equal(health.hasScanUploadStorage, true);

    const response = await handle(new Request('http://localhost/api/scans/upload-url?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'receipt-1', kind: 'receipt', contentType: 'image/jpeg', byteLength: 123456 })
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), {
      userId: 'user-1',
      result: {
        status: 'ready',
        ticket: {
          scanId: 'receipt-1',
          uploadUrl: 'https://uploads.example/receipt-1?signature=redacted',
          payloadUri: 'private-upload://receipt-1',
          expiresAt: '2026-05-20T08:10:00.000Z',
          maxBytes: 5_000_000,
          headers: { 'content-type': 'image/jpeg' }
        }
      }
    });

    const missingStorage = await createHttpHandler(undefined, { now: new Date('2026-05-20T08:00:00.000Z') })(new Request('http://localhost/api/scans/upload-url?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'receipt-2', kind: 'receipt', contentType: 'image/png', byteLength: 42 })
    }));
    assert.equal(missingStorage.status, 200);
    assert.deepEqual(await json(missingStorage), {
      userId: 'user-1',
      result: {
        status: 'failed_no_storage',
        kind: 'receipt',
        reason: 'No scan upload storage provider configured.'
      }
    });
  });

  it('processes scan uploads through configured providers and returns review work items', async () => {
    const handle = createHttpHandler(undefined, {
      now: new Date('2026-05-20T13:00:00.000Z'),
      scanProviders: {
        barcode: {
          lookup: async (barcode) => ({ barcode, productId: 'coffee', confidence: 0.93, needsHumanReview: false })
        },
        receiptOcr: {
          parse: async () => ({
            rows: [
              { rawName: 'ZOEGAS 450G', itemTotal: 49.9, confidence: 0.91 },
              { rawName: 'SMUDGED ITEM', itemTotal: 12.5, confidence: 0.41 }
            ],
            totalAmount: 62.4,
            confidence: 0.66
          })
        }
      }
    });

    const barcode = await json(await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'barcode-1', kind: 'barcode', payload: '0735000123456' })
    }))) as { scanId: string; result: { status: string; productId: string }; reviewWorkItems: unknown[] };
    assert.equal(barcode.scanId, 'barcode-1');
    assert.deepEqual(barcode.reviewWorkItems, []);
    assert.equal(barcode.result.status, 'matched');
    assert.equal(barcode.result.productId, 'coffee');

    const receipt = await json(await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'receipt-1', kind: 'receipt', payload: 'private-upload://receipt.jpg' })
    }))) as { result: { status: string; lowConfidenceRows: string[] }; reviewWorkItems: Array<{ id: string; priority: string; evidence: string[] }> };
    assert.equal(receipt.result.status, 'parsed');
    assert.deepEqual(receipt.result.lowConfidenceRows, ['SMUDGED ITEM']);
    assert.deepEqual(receipt.reviewWorkItems, [
      {
        id: 'scan-review-receipt-1',
        scanId: 'receipt-1',
        kind: 'receipt',
        priority: 'high',
        reason: 'Receipt has 1 low-confidence rows.',
        evidence: ['confidence:0.66', 'total:62.4', 'low_confidence_row:SMUDGED ITEM']
      }
    ]);
  });

  it('gates OCR scan history reads and writes to active premium entitlements', async () => {
    const requestedUserIds: string[] = [];
    const api = createGroceryViewApi();
    const handle = createHttpHandler(api, {
      now: new Date('2026-05-20T13:00:00.000Z'),
      subscriptionEntitlementRepository: {
        async getSubscriptionEntitlement(userId) {
          requestedUserIds.push(userId);
          if (userId !== 'user-1') return null;
          return {
            userId,
            tier: 'premium',
            plan: 'premium_monthly',
            status: 'active',
            currentPeriodEndsAt: '2026-06-20T13:00:00.000Z',
            provider: 'stripe_compatible',
            providerCustomerId: 'cus_internal_only',
            updatedAt: '2026-05-20T13:00:00.000Z'
          };
        }
      }
    });

    const freeRead = await handle(new Request('http://localhost/api/scans/history?userId=user-2'));
    assert.equal(freeRead.status, 402);
    assert.deepEqual((await json(freeRead) as { access: { enforcementReasons: string[] } }).access.enforcementReasons, ['missing_subscription_entitlement']);

    const saved = await handle(new Request('http://localhost/api/scans/history?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({
        scanId: 'receipt-1',
        kind: 'receipt',
        uploadedAt: '2026-05-20T12:59:00.000Z',
        result: {
          status: 'parsed',
          rows: [{ rawName: 'ZOEGAS 450G' }],
          totalAmount: 49.9,
          confidence: 0.91,
          lowConfidenceRows: ['SMUDGED ITEM']
        }
      })
    }));
    assert.equal(saved.status, 201);
    assert.deepEqual(await json(saved), {
      userId: 'user-1',
      item: {
        scanId: 'receipt-1',
        kind: 'receipt',
        capturedAt: '2026-05-20T12:59:00.000Z',
        status: 'parsed',
        itemCount: 1,
        totalAmount: 49.9,
        confidence: 0.91,
        lowConfidenceRows: ['SMUDGED ITEM']
      }
    });

    const history = await json(await handle(new Request('http://localhost/api/scans/history?userId=user-1'))) as {
      userId: string;
      itemCount: number;
      items: Array<Record<string, unknown>>;
      guardrails: string[];
    };
    assert.equal(history.userId, 'user-1');
    assert.equal(history.itemCount, 1);
    assert.deepEqual(history.items, [
      {
        scanId: 'receipt-1',
        kind: 'receipt',
        capturedAt: '2026-05-20T12:59:00.000Z',
        status: 'parsed',
        itemCount: 1,
        totalAmount: 49.9,
        confidence: 0.91,
        lowConfidenceRows: ['SMUDGED ITEM']
      }
    ]);
    assert.equal(history.guardrails.some((guardrail) => /active premium entitlement/i.test(guardrail)), true);
    assert.deepEqual(requestedUserIds, ['user-2', 'user-1', 'user-1']);
  });

  it('serves account subscription access from user-scoped entitlements', async () => {
    const api = createGroceryViewApi();
    api.upsertSubscriptionEntitlement('user-1', {
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'active',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });
    const handle = createHttpHandler(api, { now: new Date('2026-05-20T00:00:00.000Z') });

    const premium = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1'));
    assert.equal(premium.status, 200);
    assert.deepEqual(await json(premium), {
      userTier: 'premium',
      premiumFeaturesEnabled: true,
      adsRemoved: true,
      checkoutRequired: false,
      enforcementReasons: ['active_subscription_entitlement:premium_monthly'],
      accountActions: ['show_manage_subscription'],
      summary: 'Premium access is active.'
    });

    const missing = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-2'));
    assert.equal(missing.status, 200);
    assert.deepEqual((await json(missing) as { enforcementReasons: string[] }).enforcementReasons, ['missing_subscription_entitlement']);
  });

  it('prefers repository-backed subscription entitlements for account access when configured', async () => {
    const api = createGroceryViewApi();
    api.upsertSubscriptionEntitlement('user-1', {
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'past_due',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });
    const requestedUserIds: string[] = [];
    const handle = createHttpHandler(api, {
      now: new Date('2026-05-20T00:00:00.000Z'),
      subscriptionEntitlementRepository: {
        async getSubscriptionEntitlement(userId) {
          requestedUserIds.push(userId);
          if (userId !== 'user-1') return null;
          return {
            userId,
            tier: 'premium',
            plan: 'premium_yearly',
            status: 'active',
            currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
            provider: 'stripe_compatible',
            providerCustomerId: 'cus_internal_only',
            providerSubscriptionId: 'sub_internal_only',
            updatedAt: '2026-05-20T00:00:00.000Z'
          };
        }
      }
    });

    const premium = await json(await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1'))) as {
      enforcementReasons: string[];
      accountActions: string[];
      checkoutRequired: boolean;
    };
    assert.deepEqual(requestedUserIds, ['user-1']);
    assert.deepEqual(premium.enforcementReasons, ['active_subscription_entitlement:premium_yearly']);
    assert.deepEqual(premium.accountActions, ['show_manage_subscription']);
    assert.equal(premium.checkoutRequired, false);
    assert.equal(JSON.stringify(premium).includes('cus_internal_only'), false);

    const adDisclosure = await json(await handle(new Request('http://localhost/api/ads/disclosure?userId=user-1'))) as {
      userTier: string;
      premiumAdsRemoved: boolean;
      placementPlan: { slots: unknown[] };
    };
    assert.deepEqual(requestedUserIds, ['user-1', 'user-1']);
    assert.equal(adDisclosure.userTier, 'premium');
    assert.equal(adDisclosure.premiumAdsRemoved, true);
    assert.deepEqual(adDisclosure.placementPlan.slots, []);
    assert.equal(JSON.stringify(adDisclosure).includes('cus_internal_only'), false);

    const missing = await json(await handle(new Request('http://localhost/api/account/subscription-access?userId=user-2'))) as {
      enforcementReasons: string[];
    };
    assert.deepEqual(missing.enforcementReasons, ['missing_subscription_entitlement']);
  });

  it('creates account-bound billing checkout sessions through the configured provider', async () => {
    const createdRequests: unknown[] = [];
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'checkout-secret');
    const handle = createHttpHandler(undefined, {
      authSecret: 'checkout-secret',
      runtimeConfig: {
        nodeEnv: 'test',
        port: 3000,
        publicWebUrl: 'https://groceryview.example'
      },
      billingCheckoutPriceIds: { premium_yearly: 'price_yearly_123' },
      billingCheckoutProvider: {
        async createCheckoutSession(request) {
          createdRequests.push(request);
          return {
            sessionId: 'cs_test_account_bound',
            checkoutUrl: 'https://checkout.stripe.example/session/cs_test_account_bound'
          };
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/checkout-sessions?userId=user-1', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ plan: 'premium_yearly' })
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(await json(response), {
      provider: 'stripe_compatible',
      sessionId: 'cs_test_account_bound',
      checkoutUrl: 'https://checkout.stripe.example/session/cs_test_account_bound',
      plan: 'premium_yearly'
    });
    assert.deepEqual(createdRequests, [{
      customerReference: 'user-1',
      priceId: 'price_yearly_123',
      successUrl: 'https://groceryview.example/account?checkout=success&plan=premium_yearly',
      cancelUrl: 'https://groceryview.example/account?checkout=cancel&plan=premium_yearly',
      metadata: { plan: 'premium_yearly' }
    }]);
    assert.equal(JSON.stringify(createdRequests).includes('checkout-secret'), false);
  });

  it('fails billing checkout sessions closed without provider configuration', async () => {
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'checkout-secret');
    const handle = createHttpHandler(undefined, {
      authSecret: 'checkout-secret',
      runtimeConfig: {
        nodeEnv: 'test',
        port: 3000,
        publicWebUrl: 'https://groceryview.example'
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/checkout-sessions?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: 'premium_monthly' })
    }));

    assert.equal(response.status, 503);
    assert.deepEqual(await json(response), {
      error: 'Subscription checkout requires configured billing provider and price id.'
    });
  });

  it('creates account-bound billing portal sessions from persisted provider customers', async () => {
    const createdRequests: unknown[] = [];
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'portal-secret');
    const handle = createHttpHandler(undefined, {
      authSecret: 'portal-secret',
      runtimeConfig: {
        nodeEnv: 'test',
        port: 3000,
        publicWebUrl: 'https://groceryview.example'
      },
      now: new Date('2026-05-22T00:00:00.000Z'),
      subscriptionEntitlementRepository: {
        async getSubscriptionEntitlement(userId) {
          if (userId !== 'user-1') return null;
          return {
            userId,
            tier: 'premium',
            plan: 'premium_monthly',
            status: 'active',
            currentPeriodEndsAt: '2026-06-22T00:00:00.000Z',
            provider: 'stripe_compatible',
            providerCustomerId: 'cus_portal_123',
            providerSubscriptionId: 'sub_portal_123',
            updatedAt: '2026-05-22T00:00:00.000Z'
          };
        }
      },
      billingPortalProvider: {
        async createPortalSession(request) {
          createdRequests.push(request);
          return {
            sessionId: 'bps_test_account_bound',
            portalUrl: 'https://billing.stripe.example/session/bps_test_account_bound'
          };
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/portal-sessions?userId=user-1', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      }
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(await json(response), {
      provider: 'stripe_compatible',
      sessionId: 'bps_test_account_bound',
      portalUrl: 'https://billing.stripe.example/session/bps_test_account_bound'
    });
    assert.deepEqual(createdRequests, [{
      customerReference: 'cus_portal_123',
      returnUrl: 'https://groceryview.example/account?billing=return'
    }]);
  });

  it('fails billing portal sessions closed without provider customer evidence', async () => {
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'portal-secret');
    const handle = createHttpHandler(undefined, {
      authSecret: 'portal-secret',
      runtimeConfig: {
        nodeEnv: 'test',
        port: 3000,
        publicWebUrl: 'https://groceryview.example'
      },
      subscriptionEntitlementRepository: {
        async getSubscriptionEntitlement(userId) {
          return {
            userId,
            tier: 'premium',
            plan: 'premium_monthly',
            status: 'active',
            currentPeriodEndsAt: '2026-06-22T00:00:00.000Z',
            provider: 'stripe_compatible',
            updatedAt: '2026-05-22T00:00:00.000Z'
          };
        }
      },
      billingPortalProvider: {
        async createPortalSession() {
          throw new Error('should not call provider without customer evidence');
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/portal-sessions?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` }
    }));

    assert.equal(response.status, 503);
    assert.deepEqual(await json(response), {
      error: 'Billing portal requires an active provider customer for this account.'
    });
  });

  it('uses the runtime repository for account-bound basket import review persistence when configured', async () => {
    const api = createGroceryViewApi();
    const savedRows: Array<{ userId: string; items: Array<{ reviewItemId: string; rawName: string; status: string }> }> = [];
    const openRows = new Map<string, BasketImportReviewItem[]>();
    const handle = createHttpHandler(api, {
      basketImportReviewRepository: {
        async saveBasketImportReviewItems(userId, items) {
          savedRows.push({ userId, items: items.map((item) => ({ reviewItemId: item.reviewItemId, rawName: item.rawName, status: item.status })) });
          openRows.set(userId, items.map((item) => ({ ...item })));
        },
        async listOpenBasketImportReviewItems(userId) {
          return openRows.get(userId)?.filter((item) => item.status === 'open') ?? [];
        },
        async resolveBasketImportReviewItem(userId, reviewItemId, resolution) {
          const items = openRows.get(userId) ?? [];
          const index = items.findIndex((item) => item.reviewItemId === reviewItemId && item.status === 'open');
          if (index === -1) throw new Error(`Basket import review item not found: ${reviewItemId}`);
          const resolved = {
            ...items[index]!,
            status: resolution.status,
            resolvedAt: resolution.resolvedAt,
            ...(resolution.resolvedProductId ? { resolvedProductId: resolution.resolvedProductId } : {}),
            ...(resolution.quantity === undefined ? {} : { quantity: resolution.quantity })
          };
          openRows.set(userId, items.map((item, itemIndex) => itemIndex === index ? resolved : item));
          return resolved;
        }
      }
    });

    await handle(new Request('http://localhost/api/basket/import-export?userId=user-db-import', {
      method: 'POST',
      body: JSON.stringify({
        source: { sourceKind: 'bookmarklet', retailerId: 'willys', origin: 'https://www.willys.se', capturedAt: '2026-05-22T09:35:00.000Z', consentGranted: true },
        capturedLines: [
          { rawName: 'Retailer-only bakery bun', quantity: 3 }
        ]
      })
    }));

    assert.equal(savedRows[0]?.userId, 'user-db-import');
    assert.equal(savedRows[0]?.items[0]?.rawName, 'Retailer-only bakery bun');
    const queue = await json(await handle(new Request('http://localhost/api/basket/import-review?userId=user-db-import'))) as {
      openItemCount: number;
      items: Array<{ reviewItemId: string; rawName: string }>;
    };
    assert.equal(queue.openItemCount, 1);
    assert.equal(queue.items[0]?.rawName, 'Retailer-only bakery bun');

    const decision = await handle(new Request(`http://localhost/api/basket/import-review/${encodeURIComponent(queue.items[0]!.reviewItemId)}/decisions?userId=user-db-import`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'dismiss' })
    }));
    assert.equal(decision.status, 200);
    assert.equal((await json(decision) as { status: string }).status, 'dismissed');
    assert.equal((await json(await handle(new Request('http://localhost/api/basket/import-review?userId=user-db-import'))) as { openItemCount: number }).openItemCount, 0);
  });

  it('accepts signed billing subscription events and persists entitlement mutations', async () => {
    const persisted: unknown[] = [];
    const secret = 'billing-webhook-secret';
    const body = JSON.stringify({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_active_1',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_yearly',
      currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
      providerCustomerId: 'cus_internal_only',
      providerSubscriptionId: 'sub_internal_only',
      occurredAt: '2026-05-20T00:00:00.000Z'
    });
    const handle = createHttpHandler(undefined, {
      billingWebhookSecret: secret,
      billingSubscriptionSink: {
        async upsertSubscriptionEntitlement(entitlement) {
          persisted.push(entitlement);
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, secret) },
      body
    }));

    assert.equal(response.status, 202);
    const accepted = await json(response);
    assert.deepEqual(accepted, {
      accepted: true,
      persisted: true,
      userId: 'user-1',
      status: 'active'
    });
    assert.equal(JSON.stringify(accepted).includes('cus_internal_only'), false);
    assert.deepEqual(persisted, [
      {
        userId: 'user-1',
        tier: 'premium',
        plan: 'premium_yearly',
        status: 'active',
        currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
        provider: 'stripe_compatible',
        providerCustomerId: 'cus_internal_only',
        providerSubscriptionId: 'sub_internal_only',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    ]);
  });

  it('accepts signed Stripe-compatible subscription webhooks and persists entitlement mutations', async () => {
    const persisted: unknown[] = [];
    const secret = 'billing-webhook-secret';
    const body = JSON.stringify({
      id: 'evt_stripe_subscription_active_1',
      type: 'customer.subscription.updated',
      created: 1779278400,
      data: {
        object: {
          id: 'sub_provider_1',
          customer: 'cus_provider_1',
          status: 'active',
          current_period_end: 1810771200,
          metadata: { userId: 'user-1' },
          items: { data: [{ price: { id: 'price_yearly_123' } }] }
        }
      }
    });
    const handle = createHttpHandler(undefined, {
      billingWebhookSecret: secret,
      billingPriceIdPlanMap: { price_yearly_123: 'premium_yearly' },
      now: new Date('2026-05-20T12:00:00.000Z'),
      billingSubscriptionSink: {
        async upsertSubscriptionEntitlement(entitlement) {
          persisted.push(entitlement);
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, secret) },
      body
    }));

    assert.equal(response.status, 202);
    assert.deepEqual(await json(response), {
      accepted: true,
      persisted: true,
      userId: 'user-1',
      status: 'active'
    });
    assert.deepEqual(persisted, [
      {
        userId: 'user-1',
        tier: 'premium',
        plan: 'premium_yearly',
        status: 'active',
        currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
        provider: 'stripe_compatible',
        providerCustomerId: 'cus_provider_1',
        providerSubscriptionId: 'sub_provider_1',
        updatedAt: '2026-05-20T12:00:00.000Z'
      }
    ]);
  });

  it('accepts provider-native Stripe signatures for Stripe-compatible subscription webhooks', async () => {
    const persisted: unknown[] = [];
    const secret = 'whsec_provider_native';
    const body = JSON.stringify({
      id: 'evt_stripe_native_signature_1',
      type: 'customer.subscription.updated',
      created: 1779278400,
      data: {
        object: {
          id: 'sub_provider_native_1',
          customer: 'cus_provider_native_1',
          status: 'active',
          current_period_end: 1810771200,
          metadata: { userId: 'user-stripe-native' },
          items: { data: [{ price: { id: 'price_monthly_native' } }] }
        }
      }
    });
    const handle = createHttpHandler(undefined, {
      billingWebhookSecret: secret,
      billingPriceIdPlanMap: { price_monthly_native: 'premium_monthly' },
      now: new Date('2026-05-20T12:00:00.000Z'),
      billingSubscriptionSink: {
        async upsertSubscriptionEntitlement(entitlement) {
          persisted.push(entitlement);
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'stripe-signature': signStripeWebhookBody(body, secret, 1779278400) },
      body
    }));

    assert.equal(response.status, 202);
    assert.deepEqual(await json(response), {
      accepted: true,
      persisted: true,
      userId: 'user-stripe-native',
      status: 'active'
    });
    assert.deepEqual(persisted, [{
      userId: 'user-stripe-native',
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'active',
      currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      providerCustomerId: 'cus_provider_native_1',
      providerSubscriptionId: 'sub_provider_native_1',
      updatedAt: '2026-05-20T12:00:00.000Z'
    }]);
  });

  it('rejects stale provider-native Stripe billing webhook signatures', async () => {
    const persisted: unknown[] = [];
    const secret = 'whsec_provider_native';
    const body = JSON.stringify({
      id: 'evt_stale_stripe_native_signature_1',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_stale_provider_native_1',
          customer: 'cus_stale_provider_native_1',
          status: 'active',
          metadata: { userId: 'user-stripe-native' },
          items: { data: [{ price: { id: 'price_monthly_native' } }] }
        }
      }
    });
    const handle = createHttpHandler(undefined, {
      billingWebhookSecret: secret,
      billingPriceIdPlanMap: { price_monthly_native: 'premium_monthly' },
      now: new Date('2026-05-20T12:10:01.000Z'),
      billingSubscriptionSink: {
        async upsertSubscriptionEntitlement(entitlement) {
          persisted.push(entitlement);
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'stripe-signature': signStripeWebhookBody(body, secret, 1779278400) },
      body
    }));

    assert.equal(response.status, 401);
    assert.deepEqual(persisted, []);
  });

  it('fails billing subscription events closed without configured secret, valid signature, and sink', async () => {
    const secret = 'billing-webhook-secret';
    const body = JSON.stringify({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_active_1',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_monthly',
      occurredAt: '2026-05-20T00:00:00.000Z'
    });

    const missingSecret = await createHttpHandler()(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      body
    }));
    assert.equal(missingSecret.status, 503);

    const invalidSignature = await createHttpHandler(undefined, {
      billingWebhookSecret: secret,
      billingSubscriptionSink: { async upsertSubscriptionEntitlement() {} }
    })(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': 'sha256=bad' },
      body
    }));
    assert.equal(invalidSignature.status, 401);

    const missingSink = await createHttpHandler(undefined, {
      billingWebhookSecret: secret
    })(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, secret) },
      body
    }));
    assert.equal(missingSink.status, 503);
  });

  it('rejects sensitive payment fields in billing subscription events before persistence', async () => {
    const persisted: unknown[] = [];
    const secret = 'billing-webhook-secret';
    const body = JSON.stringify({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_active_1',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_monthly',
      occurredAt: '2026-05-20T00:00:00.000Z',
      cardNumber: '4242424242424242',
      clientSecret: 'pi_secret_should_not_be_sent'
    });
    const handle = createHttpHandler(undefined, {
      billingWebhookSecret: secret,
      billingSubscriptionSink: {
        async upsertSubscriptionEntitlement(entitlement) {
          persisted.push(entitlement);
        }
      }
    });

    const response = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, secret) },
      body
    }));

    assert.equal(response.status, 400);
    assert.match((await json(response) as { error: string }).error, /sensitive payment fields/i);
    assert.deepEqual(persisted, []);
  });

  it('returns explicit errors for invalid JSON, missing user id, and unknown routes', async () => {
    const handle = createHttpHandler();

    const badJson = await handle(new Request('http://localhost/api/watchlist?userId=user-1', { method: 'POST', body: '{' }));
    assert.equal(badJson.status, 400);
    assert.match((await json(badJson) as { error: string }).error, /invalid json/i);

    const missingUser = await handle(new Request('http://localhost/api/watchlist'));
    assert.equal(missingUser.status, 400);

    const missing = await handle(new Request('http://localhost/api/nope'));
    assert.equal(missing.status, 404);
  });

  it('returns structured error JSON for malformed POST bodies', async () => {
    const handle = createHttpHandler();

    const response = await handle(new Request('http://localhost/api/watchlist?userId=user-1', {
      method: 'POST',
      body: '[]'
    }));

    assert.equal(response.status, 400);
    assert.deepEqual(await json(response), {
      error: 'Invalid JSON body.',
      code: 'malformed_post_body',
      details: { reason: 'JSON body must be an object.' }
    });
  });
});
