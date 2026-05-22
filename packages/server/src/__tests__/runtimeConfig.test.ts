import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSessionToken } from '@groceryview/auth';
import {
  buildHealthReport,
  createRuntimeHttpService,
  createRuntimeHttpHandler,
  isDirectServerEntrypoint,
  loadRuntimeConfig,
  type RuntimePersistenceRepository,
  type SubscriptionEntitlementLookupRecord
} from '../index.js';

function signBillingWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

class RecordingPgPool {
  calls: Array<{ text: string; values: unknown[] }> = [];
  closed = false;
  private entitlementRow: unknown | null = null;
  private watchlistRows: Array<{
    product_id: string;
    target_price: number;
    alert_deal_score_at: null;
    favorite_stores_only: boolean;
    allowed_price_types: string[];
  }> = [{
    product_id: 'product-coffee',
    target_price: 50,
    alert_deal_score_at: null,
    favorite_stores_only: true,
    allowed_price_types: ['promotion']
  }];

  async query(text: string, values: unknown[] = []) {
    this.calls.push({ text, values });
    if (text.includes('information_schema.tables')) {
      return {
        rows: [
          'chains',
          'products',
          'source_runs',
          'raw_records',
          'retailer_source_policies',
          'observations',
          'latest_prices',
          'app_users',
          'favorite_stores',
          'user_preferences',
          'watchlist_items',
          'weekly_baskets',
          'basket_items',
          'basket_import_review_items',
          'human_review_assignments',
          'human_reviewers',
          'community_reporter_trust',
          'subscription_entitlements',
          'notification_tasks',
          'notification_suppressions',
          'alert_rules',
          'pantry_items',
          'receipt_uploads',
          'receipt_items',
          'household_plans',
          'household_members',
          'household_basket_items',
          'household_watchlist_items',
          'household_favorite_stores'
        ].map((table_name) => ({ table_name }))
      };
    }
    if (text.includes('select version from schema_migrations')) {
      return {
        rows: [
          '001_groceryview_schema',
          '002_repository_support_schema',
          '003_subscription_entitlements',
          '004_alert_rules',
          '005_pantry_inventory',
          '006_source_runs_official_api',
          '007_receipt_uploads',
          '008_household_plans',
          '009_retailer_source_policies',
          '010_basket_import_reviews'
        ].map((version) => ({ version }))
      };
    }
    if (text.includes('insert into subscription_entitlements')) {
      this.entitlementRow = {
        user_id: values[0],
        tier: values[1],
        plan: values[2],
        status: values[3],
        current_period_ends_at: values[4],
        provider: values[5],
        provider_customer_id: values[6],
        provider_subscription_id: values[7],
        updated_at: values[8]
      };
      return { rows: [] };
    }
    if (text.includes('from subscription_entitlements')) {
      const row = this.entitlementRow as { user_id?: string } | null;
      return { rows: row?.user_id === values[0] ? [row] : [] };
    }
    if (text.includes("observations.price_type in ('promotion', 'member')")) {
      return {
        rows: [{
          observation_id: 'obs-runtime-flyer-coffee',
          source_run_id: 'run-runtime-flyer',
          raw_record_id: 'raw-runtime-flyer',
          price_type: 'promotion',
          price: '49.90',
          regular_price: '64.90',
          currency: 'SEK',
          promotion_text: 'Runtime weekly flyer',
          promotion_starts_on: '2026-05-19',
          promotion_ends_on: '2026-05-25',
          member_required: false,
          observed_at: '2026-05-19T06:30:00.000Z',
          valid_from: '2026-05-19T00:00:00.000Z',
          valid_until: '2026-05-25T21:59:59.000Z',
          confidence: '0.9200',
          provenance: { sourceUrl: 'https://example.test/runtime-flyer' },
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          category_path: ['coffee'],
          chain_id: 'chain-willys',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_id: 'store-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          store_city: 'Stockholm'
        }]
      };
    }
    if (text.includes('from stores') && text.includes('join chains') && text.includes('where stores.slug = $1')) {
      return {
        rows: values[0] === 'willys-odenplan'
          ? [{ store_slug: 'willys-odenplan', store_name: 'Willys Odenplan', chain_slug: 'willys' }]
          : []
      };
    }
    if (text.includes('select store_id from favorite_stores')) {
      return { rows: [{ store_id: 'store-willys' }] };
    }
    if (text.includes('select slug as store_slug from stores')) {
      return { rows: [{ store_slug: 'willys-odenplan' }] };
    }
    if (text.includes('select product_id, target_price, alert_deal_score_at, favorite_stores_only, allowed_price_types from watchlist_items')) {
      return { rows: this.watchlistRows };
    }
    if (text.includes('select id::text from watchlist_items')) {
      return { rows: [] };
    }
    if (text.includes('select id::text as product_id from products')) {
      return { rows: [{ product_id: 'product-coffee' }] };
    }
    if (text.includes('insert into watchlist_items')) {
      this.watchlistRows = [{
        product_id: values[1] as string,
        target_price: values[2] as number,
        alert_deal_score_at: null,
        favorite_stores_only: values[4] as boolean,
        allowed_price_types: values[5] as string[]
      }];
      return { rows: [] };
    }
    if (text.includes('from latest_prices')) {
      return {
        rows: [{
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          price: '49.90',
          price_type: 'promotion',
          confidence: '0.9200',
          observed_at: '2026-05-19T06:30:00.000Z'
        }]
      };
    }
    if (text.includes('left join latest_prices')) {
      return {
        rows: [
          {
            product_id: 'coffee',
            category_id: 'coffee',
            observed_chain_ids: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
            observed_store_ids: ['willys-odenplan', 'coop-odenplan']
          },
          {
            product_id: 'milk',
            category_id: 'dairy',
            observed_chain_ids: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
            observed_store_ids: ['willys-odenplan']
          }
        ]
      };
    }
    return { rows: [] };
  }

  async end() {
    this.closed = true;
  }
}

describe('runtime config', () => {
  it('loads production runtime config with required secrets and urls', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan']
      })
    });

    assert.deepEqual(config, {
      nodeEnv: 'production',
      port: 8080,
      authSecret: 'super-secret',
      databaseUrl: 'postgres://example',
      publicWebUrl: 'https://groceryview.example',
      notificationWebhookSecret: 'webhook-secret',
      billingWebhookSecret: 'billing-webhook-secret',
      metricsToken: 'metrics-token',
      catalogCoverageTargets: {
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan'],
        requireEveryProductInEveryStore: true
      }
    });
  });

  it('loads catalog coverage targets from runtime environment JSON', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'development',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee', 'milk'],
        targetCategories: ['coffee', 'dairy'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan', 'coop-odenplan'],
        requireEveryProductInEveryStore: true
      })
    });

    assert.deepEqual(config.catalogCoverageTargets, {
      targetProducts: ['coffee', 'milk'],
      targetCategories: ['coffee', 'dairy'],
      targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
      targetStores: ['willys-odenplan', 'coop-odenplan'],
      requireEveryProductInEveryStore: true
    });
  });

  it('fails closed when catalog coverage targets omit required daily chains', () => {
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'development',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['willys', 'coop'],
        targetStores: ['willys-odenplan']
      })
    }), /targetChains is missing required chains: ica, hemkop, lidl, city_gross/);
  });

  it('fails closed when production secrets are missing', () => {
    assert.throws(() => loadRuntimeConfig({ NODE_ENV: 'production', PORT: '8080' }), /AUTH_SECRET is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example'
    }), /NOTIFICATION_WEBHOOK_SECRET is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret'
    }), /BILLING_WEBHOOK_SECRET is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret'
    }), /METRICS_TOKEN is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token'
    }), /CATALOG_COVERAGE_TARGETS_JSON is required/);
  });

  it('rejects invalid public web urls', () => {
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'development',
      PORT: '3000',
      PUBLIC_WEB_URL: 'groceryview.example'
    }), /PUBLIC_WEB_URL must be a valid absolute URL/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'mailto:support@groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan']
      })
    }), /PUBLIC_WEB_URL must use http or https/);
  });

  it('builds a health report without exposing secrets', () => {
    const report = buildHealthReport(loadRuntimeConfig({ NODE_ENV: 'development', PORT: '3000' }));

    assert.deepEqual(report, {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'development',
      hasDatabase: false,
      hasPublicWebUrl: false,
      hasAuthSecret: false,
      hasNotificationWebhookSecret: false,
      hasBillingWebhookSecret: false,
      hasMetricsToken: false,
      hasScanUploadStorage: false
    });
  });

  it('creates a runtime HTTP handler from deployment environment secrets', async () => {
    const handle = createRuntimeHttpHandler({
      NODE_ENV: 'development',
      PORT: '3000',
      AUTH_SECRET: 'auth-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
      BILLING_WEBHOOK_SECRET: 'billing-secret',
      METRICS_TOKEN: 'metrics-secret'
    });

    const health = await handle(new Request('http://localhost/api/health'));
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'development',
      hasDatabase: true,
      hasPublicWebUrl: true,
      hasAuthSecret: true,
      hasNotificationWebhookSecret: true,
      hasBillingWebhookSecret: true,
      hasMetricsToken: true,
      hasScanUploadStorage: false
    });

    const protectedAccountRoute = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1'));
    assert.equal(protectedAccountRoute.status, 401);

    const metricsRoute = await handle(new Request('http://localhost/api/metrics/notifications', {
      headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
    }));
    assert.equal(metricsRoute.status, 503);
  });

  it('wires repository-backed runtime sinks into account access and billing webhooks', async () => {
    let entitlement: SubscriptionEntitlementLookupRecord | null = null;
    let persistedBudget: { weeklyBudget: number; monthlyBudget: number } | null = null;
    const repository: RuntimePersistenceRepository = {
      async getSubscriptionEntitlement(userId: string) {
        return userId === 'user-1' ? entitlement : null;
      },
      async upsertSubscriptionEntitlement(nextEntitlement) {
        entitlement = nextEntitlement;
      },
      async upsertBudget(userId, budget) {
        if (userId === 'user-1') persistedBudget = { ...budget };
      },
      async getBudget(userId) {
        return userId === 'user-1' ? persistedBudget : null;
      },
      async getHumanReviewer() {
        return null;
      },
      async listOpenHumanReviewAssignments() {
        return [];
      },
      async saveHumanReviewAssignment(assignment) {
        void assignment;
      },
      async upsertNotificationSuppression(suppression) {
        void suppression;
      }
    };
    const secret = 'billing-secret';
    const authSecret = 'auth-secret';
    const handle = createRuntimeHttpHandler(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://example',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: secret,
        METRICS_TOKEN: 'metrics-secret'
      },
      { repository }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    const budgetPatch = await handle(new Request('http://localhost/api/budget?userId=user-1', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ weeklyBudget: 900, monthlyBudget: 3600 })
    }));
    assert.equal(budgetPatch.status, 200);
    assert.equal((await budgetPatch.json() as { weeklyBudget: number }).weeklyBudget, 900);
    assert.deepEqual(persistedBudget, { weeklyBudget: 900, monthlyBudget: 3600 });

    persistedBudget = { weeklyBudget: 650, monthlyBudget: 2600 };
    const budgetSummary = await handle(new Request('http://localhost/api/budget/summary?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(budgetSummary.status, 200);
    assert.equal((await budgetSummary.json() as { weeklyBudget: number }).weeklyBudget, 650);

    const before = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(before.status, 200);
    assert.deepEqual((await before.json() as { enforcementReasons: string[] }).enforcementReasons, ['missing_subscription_entitlement']);

    const body = JSON.stringify({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_active_runtime',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_yearly',
      currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
      providerCustomerId: 'cus_internal_only',
      providerSubscriptionId: 'sub_internal_only',
      occurredAt: '2026-05-20T00:00:00.000Z'
    });
    const accepted = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, secret) },
      body
    }));
    assert.equal(accepted.status, 202);

    const after = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(after.status, 200);
    const policy = await after.json() as {
      enforcementReasons: string[];
      accountActions: string[];
      checkoutRequired: boolean;
    };
    assert.deepEqual(policy.enforcementReasons, ['active_subscription_entitlement:premium_yearly']);
    assert.deepEqual(policy.accountActions, ['show_manage_subscription']);
    assert.equal(policy.checkoutRequired, false);
    assert.equal(JSON.stringify(policy).includes('cus_internal_only'), false);
    assert.equal(JSON.stringify(policy).includes('sub_internal_only'), false);
  });

  it('bootstraps a PostgreSQL-backed runtime repository from DATABASE_URL', async () => {
    const pool = new RecordingPgPool();
    const authSecret = 'auth-secret';
    const billingSecret = 'billing-secret';
    let connectionString: string | undefined;
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: billingSecret,
        METRICS_TOKEN: 'metrics-secret'
      },
      {
        pgPoolFactory: (databaseUrl) => {
          connectionString = databaseUrl;
          return pool;
        }
      }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    try {
      const body = JSON.stringify({
        provider: 'stripe_compatible',
        providerEventId: 'evt_subscription_active_pg_runtime',
        type: 'subscription.active',
        userId: 'user-1',
        plan: 'premium_monthly',
        currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
        providerCustomerId: 'cus_internal_only',
        providerSubscriptionId: 'sub_internal_only',
        occurredAt: '2026-05-20T00:00:00.000Z'
      });

      const accepted = await service.handler(new Request('http://localhost/api/billing/subscription-events', {
        method: 'POST',
        headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, billingSecret) },
        body
      }));
      assert.equal(accepted.status, 202);

      const account = await service.handler(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
        headers: { authorization: `Bearer ${token}` }
      }));
      assert.equal(account.status, 200);
      assert.deepEqual((await account.json() as { enforcementReasons: string[] }).enforcementReasons, [
        'active_subscription_entitlement:premium_monthly'
      ]);
    } finally {
      await service.close();
    }

    assert.equal(connectionString, 'postgres://runtime-db.example/groceryview');
    assert.equal(pool.closed, true);
    const writeCall = pool.calls.find((call) => call.text.includes('insert into subscription_entitlements'));
    assert.deepEqual(writeCall?.values.slice(0, 4), ['user-1', 'premium', 'premium_monthly', 'active']);
    assert.equal(writeCall?.text.includes('$1'), true);
  });

  it('serves runtime flyer offers and watchlist price alerts from persisted PostgreSQL rows', async () => {
    const pool = new RecordingPgPool();
    const authSecret = 'auth-secret';
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      { pgPoolFactory: () => pool }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    try {
      const flyerOffers = await service.handler(new Request('http://localhost/api/deals/flyer-offers?chain=willys&asOf=2026-05-20T12:00:00.000Z'));
      assert.equal(flyerOffers.status, 200);
      const flyerBody = await flyerOffers.json() as {
        offerCount: number;
        offers: Array<{ offerId: string; sourceRunId: string; sourceUrl: string; savings: number }>;
      };
      assert.equal(flyerBody.offerCount, 1);
      assert.deepEqual(flyerBody.offers.map((offer) => [offer.offerId, offer.sourceRunId, offer.sourceUrl, offer.savings]), [
        ['obs-runtime-flyer-coffee', 'run-runtime-flyer', 'https://example.test/runtime-flyer', 15]
      ]);

      const storeFlyerOffers = await service.handler(new Request('http://localhost/api/stores/willys-odenplan/flyer-offers?asOf=2026-05-20T12:00:00.000Z'));
      assert.equal(storeFlyerOffers.status, 200);
      assert.equal((await storeFlyerOffers.json() as { storeId: string; bestOffer: { offerId: string } }).bestOffer.offerId, 'obs-runtime-flyer-coffee');

      const alerts = await service.handler(new Request('http://localhost/api/watchlist/price-alerts?userId=user-1', {
        headers: { authorization: `Bearer ${token}` }
      }));
      assert.equal(alerts.status, 200);
      const alertBody = await alerts.json() as {
        userId: string;
        trackedItemCount: number;
        alertCount: number;
        alerts: Array<{ type: string; trigger: { storeId: string; value: number } }>;
      };
      assert.equal(alertBody.userId, 'user-1');
      assert.equal(alertBody.trackedItemCount, 1);
      assert.equal(alertBody.alertCount, 1);
      assert.deepEqual(alertBody.alerts.map((alert) => [alert.type, alert.trigger.storeId, alert.trigger.value]), [
        ['target_price', 'willys-odenplan', 49.9]
      ]);

      const created = await service.handler(new Request('http://localhost/api/watchlist/price-alerts?userId=user-1', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ productId: 'coffee', targetPrice: 45, favoriteStoresOnly: true, allowedPriceTypes: ['promotion'] })
      }));
      assert.equal(created.status, 201);
      assert.equal((await created.json() as { alertCount: number }).alertCount, 0);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('from observations')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('from latest_prices')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('insert into watchlist_items')), true);
  });

  it('exposes PostgreSQL readiness from the runtime DATABASE_URL pool without leaking secrets', async () => {
    const pool = new RecordingPgPool();
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: 'auth-secret',
        DATABASE_URL: 'postgres://runtime-user:runtime-password@runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      { pgPoolFactory: () => pool }
    );

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/postgres', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 200);
      const body = await response.json() as { status: string; evidence: string[]; blockers: string[]; summary: string };
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.blockers, []);
      assert.equal(body.evidence.includes('table:app_users'), true);
      assert.equal(body.evidence.includes('table:alert_rules'), true);
      assert.equal(body.evidence.includes('table:pantry_items'), true);
      assert.equal(body.evidence.includes('table:receipt_uploads'), true);
      assert.equal(body.evidence.includes('table:receipt_items'), true);
      assert.equal(body.evidence.includes('table:household_plans'), true);
      assert.equal(body.evidence.includes('table:household_members'), true);
      assert.equal(body.evidence.includes('migration:003_subscription_entitlements'), true);
      assert.equal(body.evidence.includes('migration:004_alert_rules'), true);
      assert.equal(body.evidence.includes('migration:005_pantry_inventory'), true);
      assert.equal(body.evidence.includes('migration:007_receipt_uploads'), true);
      assert.equal(body.evidence.includes('migration:008_household_plans'), true);
      assert.equal(JSON.stringify(body).includes('runtime-password'), false);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('information_schema.tables')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('select version from schema_migrations')), true);
    assert.equal(pool.calls.some((call) => /\b(insert|update|delete)\b/i.test(call.text)), false);
  });

  it('exposes source-run freshness from the runtime DATABASE_URL pool and blocks missing daily chain ingestion', async () => {
    const pool = new RecordingPgPool();
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: 'auth-secret',
        DATABASE_URL: 'postgres://runtime-user:runtime-password@runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      { pgPoolFactory: () => pool }
    );

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/source-runs', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 503);
      const body = await response.json() as { report: { blockers: string[] }; summary: { blockers: { noFreshRuns: number; missingFreshChains: number } } };
      assert.equal(body.report.blockers.includes('source_run_no_fresh_success'), true);
      assert.equal(body.report.blockers.includes('source_run_missing_fresh_chain:willys'), true);
      assert.equal(body.report.blockers.includes('source_run_missing_fresh_chain:ica'), true);
      assert.equal(body.summary.blockers.noFreshRuns, 1);
      assert.equal(body.summary.blockers.missingFreshChains, 6);
      assert.equal(JSON.stringify(body).includes('runtime-password'), false);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('from source_runs')), true);
  });

  it('exposes catalog coverage readiness from PostgreSQL coverage rows and configured targets', async () => {
    const pool = new RecordingPgPool();
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://runtime-db.example/groceryview',
        METRICS_TOKEN: 'metrics-secret',
        CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
          targetProducts: ['coffee', 'milk'],
          targetCategories: ['coffee', 'dairy'],
          targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
          targetStores: ['willys-odenplan', 'coop-odenplan'],
          requireEveryProductInEveryStore: true
        })
      },
      { pgPoolFactory: () => pool }
    );

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/catalog-coverage', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));
      assert.equal(response.status, 503);
      const body = await response.json() as {
        missingProductStorePairs: Array<{ productId: string; storeId: string }>;
        requiredActions: string[];
      };
      assert.deepEqual(body.missingProductStorePairs, [{ productId: 'milk', storeId: 'coop-odenplan' }]);
      assert.deepEqual(body.requiredActions, ['backfill_product_store_pairs:1']);
    } finally {
      await service.close();
    }

    assert.equal(pool.calls.some((call) => call.text.includes('left join latest_prices')), true);
    assert.equal(pool.closed, true);
  });

  it('detects when the server module is executed directly as the deployment entrypoint', () => {
    const moduleUrl = new URL('../index.js', import.meta.url).href;
    const modulePath = fileURLToPath(moduleUrl);

    assert.equal(isDirectServerEntrypoint(moduleUrl, modulePath), true);
    assert.equal(isDirectServerEntrypoint(moduleUrl, '/tmp/other-entrypoint.js'), false);
    assert.equal(isDirectServerEntrypoint(moduleUrl, undefined), false);
  });
});
