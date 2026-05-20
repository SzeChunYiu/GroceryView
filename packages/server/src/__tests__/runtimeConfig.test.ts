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
          'notification_suppressions',
          'alert_rules'
        ].map((table_name) => ({ table_name }))
      };
    }
    if (text.includes('select version from schema_migrations')) {
      return {
        rows: ['001_groceryview_schema', '002_repository_support_schema', '003_subscription_entitlements', '004_alert_rules'].map((version) => ({ version }))
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
      METRICS_TOKEN: 'metrics-token',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_REGION: 'us-east-1',
      S3_BUCKET: 'groceryview-raw',
      S3_ACCESS_KEY_ID: 'groceryview',
      S3_SECRET_ACCESS_KEY: 'storage-secret'
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
      s3Endpoint: 'http://localhost:9000',
      s3Region: 'us-east-1',
      s3Bucket: 'groceryview-raw',
      s3AccessKeyId: 'groceryview',
      s3SecretAccessKey: 'storage-secret'
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
      METRICS_TOKEN: 'metrics-token'
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

  it('wires S3-compatible scan upload tickets from runtime storage environment', async () => {
    const authSecret = 'auth-secret';
    const handle = createRuntimeHttpHandler(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://example',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_REGION: 'us-east-1',
        S3_BUCKET: 'groceryview-raw',
        S3_ACCESS_KEY_ID: 'groceryview',
        S3_SECRET_ACCESS_KEY: 'storage-secret',
        SCAN_UPLOAD_MAX_BYTES: '5000000'
      },
      { now: new Date('2026-05-20T08:30:00.000Z') }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    const response = await handle(new Request('http://localhost/api/scans/upload-url?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        scanId: 'receipt-1',
        kind: 'receipt',
        contentType: 'image/jpeg',
        byteLength: 123456
      })
    }));

    assert.equal(response.status, 200);
    const payload = await response.json() as {
      result: {
        status: string;
        ticket: {
          scanId: string;
          uploadUrl: string;
          payloadUri: string;
          expiresAt: string;
          maxBytes: number;
          headers: Record<string, string>;
        };
      };
    };
    assert.equal(payload.result.status, 'ready');
    assert.equal(payload.result.ticket.scanId, 'receipt-1');
    assert.equal(payload.result.ticket.payloadUri, 's3://groceryview-raw/scan-uploads/receipt/receipt-1');
    assert.equal(payload.result.ticket.expiresAt, '2026-05-20T08:40:00.000Z');
    assert.equal(payload.result.ticket.maxBytes, 5_000_000);
    assert.deepEqual(payload.result.ticket.headers, { 'content-type': 'image/jpeg' });
    const uploadUrl = new URL(payload.result.ticket.uploadUrl);
    assert.equal(uploadUrl.origin, 'http://localhost:9000');
    assert.equal(uploadUrl.pathname, '/groceryview-raw/scan-uploads/receipt/receipt-1');
    assert.equal(uploadUrl.searchParams.get('X-Amz-Algorithm'), 'AWS4-HMAC-SHA256');
    assert.equal(uploadUrl.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
    assert.equal(uploadUrl.searchParams.get('X-Amz-Expires'), '600');
    assert.match(uploadUrl.searchParams.get('X-Amz-Credential') ?? '', /^groceryview\/20260520\/us-east-1\/s3\/aws4_request$/);
    assert.match(uploadUrl.searchParams.get('X-Amz-Signature') ?? '', /^[0-9a-f]{64}$/);
    assert.equal(payload.result.ticket.uploadUrl.includes('storage-secret'), false);
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
      assert.equal(body.evidence.includes('table:alert_rules'), true);
      assert.equal(body.evidence.includes('migration:003_subscription_entitlements'), true);
      assert.equal(body.evidence.includes('migration:004_alert_rules'), true);
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
