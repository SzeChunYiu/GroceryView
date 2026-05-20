import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildHealthReport, createRuntimeHttpHandler, isDirectServerEntrypoint, loadRuntimeConfig } from '../index.js';

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

  it('detects when the server module is executed directly as the deployment entrypoint', () => {
    const moduleUrl = new URL('../index.js', import.meta.url).href;
    const modulePath = fileURLToPath(moduleUrl);

    assert.equal(isDirectServerEntrypoint(moduleUrl, modulePath), true);
    assert.equal(isDirectServerEntrypoint(moduleUrl, '/tmp/other-entrypoint.js'), false);
    assert.equal(isDirectServerEntrypoint(moduleUrl, undefined), false);
  });
});
