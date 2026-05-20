import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSessionToken } from '@groceryview/auth';
import {
  buildHealthReport,
  createRuntimeHttpHandler,
  isDirectServerEntrypoint,
  loadRuntimeConfig,
  type RuntimePersistenceRepository,
  type SubscriptionEntitlementLookupRecord
} from '../index.js';

function signBillingWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
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

  it('detects when the server module is executed directly as the deployment entrypoint', () => {
    const moduleUrl = new URL('../index.js', import.meta.url).href;
    const modulePath = fileURLToPath(moduleUrl);

    assert.equal(isDirectServerEntrypoint(moduleUrl, modulePath), true);
    assert.equal(isDirectServerEntrypoint(moduleUrl, '/tmp/other-entrypoint.js'), false);
    assert.equal(isDirectServerEntrypoint(moduleUrl, undefined), false);
  });
});
