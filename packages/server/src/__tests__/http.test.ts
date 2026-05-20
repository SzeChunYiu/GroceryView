import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createGroceryViewApi } from '@groceryview/api';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

function signBillingWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

describe('createHttpHandler', () => {
  it('serves runtime health without leaking configured secret values', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousPublicWebUrl = process.env.PUBLIC_WEB_URL;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.DATABASE_URL = 'postgres://user:secret@localhost:5432/groceryview';
    process.env.PUBLIC_WEB_URL = 'https://groceryview.example';
    process.env.NODE_ENV = 'test';

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
        hasMetricsToken: true
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
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });

  it('serves market, store, product, and index GET endpoints as JSON', async () => {
    const handle = createHttpHandler();

    const market = await handle(new Request('http://localhost/api/market/overview'));
    assert.equal(market.status, 200);
    assert.equal((await json(market) as { city: string }).city, 'Stockholm');

    const stores = await handle(new Request('http://localhost/api/stores'));
    assert.equal(stores.status, 200);
    assert.equal((await json(stores) as Array<{ id: string }>)[0].id, 'willys-odenplan');

    const storeDeals = await handle(new Request('http://localhost/api/stores/willys-odenplan/deals'));
    assert.equal(storeDeals.status, 200);
    assert.deepEqual((await json(storeDeals) as Array<{ productId: string; storeId: string }>).map((deal) => [deal.productId, deal.storeId]), [
      ['coffee', 'willys-odenplan'],
      ['milk', 'willys-odenplan'],
      ['butter', 'willys-odenplan']
    ]);

    const product = await handle(new Request('http://localhost/api/products/coffee'));
    assert.equal(product.status, 200);
    assert.equal((await json(product) as { ticker: string }).ticker, 'ZOEGAS-COFFEE-450G');

    const freshness = await handle(new Request('http://localhost/api/prices/freshness?asOf=2026-06-03T00:00:00.000Z'));
    assert.equal(freshness.status, 200);
    assert.deepEqual((await json(freshness) as { summary: Record<string, number>; backfillProductIds: string[] }), {
      asOf: '2026-06-03T00:00:00.000Z',
      thresholds: { agingAfterDays: 7, staleAfterDays: 14 },
      summary: { fresh: 0, aging: 0, stale: 3 },
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
          productId: 'butter',
          productName: 'Butter 600g',
          category: 'dairy',
          latestVerifiedPriceDate: '2026-05-19',
          ageDays: 15,
          status: 'stale',
          action: 'prioritize_manual_or_feed_refresh'
        }
      ],
      backfillProductIds: ['butter', 'coffee', 'milk']
    });

    const index = await handle(new Request('http://localhost/api/indices/stockholm-grocery-index'));
    assert.equal(index.status, 200);
    assert.equal((await json(index) as { label: string }).label, 'Stockholm Grocery Index');
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
  });

  it('mutates favorite stores, watchlist, basket, and budget through proposal routes', async () => {
    const handle = createHttpHandler();

    assert.equal((await handle(new Request('http://localhost/api/users/user-1/favorite-stores', {
      method: 'POST',
      body: JSON.stringify({ storeId: 'willys-odenplan' })
    }))).status, 201);

    assert.equal((await handle(new Request('http://localhost/api/watchlist?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true })
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

    const watchlist = await json(await handle(new Request('http://localhost/api/watchlist?userId=user-1'))) as { alerts: unknown[] };
    assert.equal(watchlist.alerts.length, 2);

    const comparison = await json(await handle(new Request('http://localhost/api/basket/compare?userId=user-1', { method: 'POST' }))) as { cheapestByProduct: { total: number } };
    assert.equal(comparison.cheapestByProduct.total, 99.8);

    const budget = await json(await handle(new Request('http://localhost/api/budget/summary?userId=user-1'))) as { weeklyRemainingAfterEstimate: number };
    assert.equal(budget.weeklyRemainingAfterEstimate, 700.2);

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
    const handle = createHttpHandler(api, { now: new Date('2026-05-20T12:00:00.000Z') });

    const exported = await json(await handle(new Request('http://localhost/api/privacy/export?userId=user-1'))) as {
      generatedAt: string;
      sections: Array<{ name: string; records: Array<Record<string, unknown>> }>;
    };
    assert.equal(exported.generatedAt, '2026-05-20T12:00:00.000Z');
    assert.deepEqual(exported.sections.find((section) => section.name === 'favorite_stores')?.records, [{ storeId: 'willys-odenplan' }]);
    assert.deepEqual(exported.sections.find((section) => section.name === 'watchlist')?.records, [{ productId: 'coffee' }]);

    const deletion = await handle(new Request('http://localhost/api/privacy/deletion-plan?userId=user-1', { method: 'POST' }));
    assert.equal(deletion.status, 200);
    const plan = await json(deletion) as { userId: string; deleteFromTables: string[]; anonymizeTables: string[]; destructiveAction: boolean };
    assert.equal(plan.userId, 'user-1');
    assert.equal(plan.destructiveAction, false);
    assert.ok(plan.deleteFromTables.includes('receipt_uploads'));
    assert.deepEqual(plan.anonymizeTables, ['community_price_reports']);
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

    const missing = await json(await handle(new Request('http://localhost/api/account/subscription-access?userId=user-2'))) as {
      enforcementReasons: string[];
    };
    assert.deepEqual(missing.enforcementReasons, ['missing_subscription_entitlement']);
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
});
