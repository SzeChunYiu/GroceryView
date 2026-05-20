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
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.DATABASE_URL = 'postgres://user:secret@localhost:5432/groceryview';
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
      assert.deepEqual(await json(response), {
        status: 'ok',
        service: 'groceryview-server',
        environment: 'test',
        hasDatabase: true,
        hasAuthSecret: true,
        hasNotificationWebhookSecret: true,
        hasBillingWebhookSecret: true,
        hasMetricsToken: true
      });
    } finally {
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
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

    const product = await handle(new Request('http://localhost/api/products/coffee'));
    assert.equal(product.status, 200);
    assert.equal((await json(product) as { ticker: string }).ticker, 'ZOEGAS-COFFEE-450G');

    const index = await handle(new Request('http://localhost/api/indices/stockholm-grocery-index'));
    assert.equal(index.status, 200);
    assert.equal((await json(index) as { label: string }).label, 'Stockholm Grocery Index');
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

    assert.equal((await handle(new Request('http://localhost/api/budget?userId=user-1', {
      method: 'PATCH',
      body: JSON.stringify({ weeklyBudget: 800, monthlyBudget: 3200 })
    }))).status, 200);

    const watchlist = await json(await handle(new Request('http://localhost/api/watchlist?userId=user-1'))) as { alerts: unknown[] };
    assert.equal(watchlist.alerts.length, 3);

    const comparison = await json(await handle(new Request('http://localhost/api/basket/compare?userId=user-1', { method: 'POST' }))) as { cheapestByProduct: { total: number } };
    assert.equal(comparison.cheapestByProduct.total, 49.9);

    const budget = await json(await handle(new Request('http://localhost/api/budget/summary?userId=user-1'))) as { weeklyRemainingAfterEstimate: number };
    assert.equal(budget.weeklyRemainingAfterEstimate, 750.1);
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
