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

  async query(text: string, values: unknown[] = []) {
    this.calls.push({ text, values });
    if (text.includes('information_schema.tables')) {
      return {
        rows: [
          'chains',
          'products',
          'source_runs',
          'raw_records',
          'observations',
          'latest_prices',
          'app_users',
          'favorite_stores',
          'user_preferences',
          'watchlist_items',
          'weekly_baskets',
          'basket_items',
          'human_review_assignments',
          'human_reviewers',
          'community_reporter_trust',
          'subscription_entitlements',
          'notification_tasks',
          'notification_suppressions'
        ].map((table_name) => ({ table_name }))
      };
    }
    if (text.includes('select version from schema_migrations')) {
      return {
        rows: ['001_groceryview_schema', '002_repository_support_schema', '003_subscription_entitlements'].map((version) => ({ version }))
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
      METRICS_TOKEN: 'metrics-token'
    });

    assert.deepEqual(config, {
      nodeEnv: 'production',
      port: 8080,
      authSecret: 'super-secret',
      databaseUrl: 'postgres://example',
      publicWebUrl: 'https://groceryview.example',
      notificationWebhookSecret: 'webhook-secret',
      billingWebhookSecret: 'billing-webhook-secret',
      metricsToken: 'metrics-token'
    });
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
  });

  it('builds a health report without exposing secrets', () => {
    const report = buildHealthReport(loadRuntimeConfig({ NODE_ENV: 'development', PORT: '3000' }));

    assert.deepEqual(report, {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'development',
      hasDatabase: false,
      hasAuthSecret: false,
      hasNotificationWebhookSecret: false,
      hasBillingWebhookSecret: false,
      hasMetricsToken: false
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
      hasAuthSecret: true,
      hasNotificationWebhookSecret: true,
      hasBillingWebhookSecret: true,
      hasMetricsToken: true
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
    const repository: RuntimePersistenceRepository = {
      async getSubscriptionEntitlement(userId: string) {
        return userId === 'user-1' ? entitlement : null;
      },
      async upsertSubscriptionEntitlement(nextEntitlement) {
        entitlement = nextEntitlement;
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
      assert.equal(body.evidence.includes('migration:003_subscription_entitlements'), true);
      assert.equal(JSON.stringify(body).includes('runtime-password'), false);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('information_schema.tables')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('select version from schema_migrations')), true);
    assert.equal(pool.calls.some((call) => /\b(insert|update|delete)\b/i.test(call.text)), false);
  });

  it('detects when the server module is executed directly as the deployment entrypoint', () => {
    const moduleUrl = new URL('../index.js', import.meta.url).href;
    const modulePath = fileURLToPath(moduleUrl);

    assert.equal(isDirectServerEntrypoint(moduleUrl, modulePath), true);
    assert.equal(isDirectServerEntrypoint(moduleUrl, '/tmp/other-entrypoint.js'), false);
    assert.equal(isDirectServerEntrypoint(moduleUrl, undefined), false);
  });
});
