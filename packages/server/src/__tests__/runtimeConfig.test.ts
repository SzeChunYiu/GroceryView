import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthReport, loadRuntimeConfig } from '../index.js';

describe('runtime config', () => {
  it('loads production runtime config with required secrets and urls', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret'
    });

    assert.deepEqual(config, {
      nodeEnv: 'production',
      port: 8080,
      authSecret: 'super-secret',
      databaseUrl: 'postgres://example',
      publicWebUrl: 'https://groceryview.example',
      notificationWebhookSecret: 'webhook-secret'
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
  });

  it('builds a health report without exposing secrets', () => {
    const report = buildHealthReport(loadRuntimeConfig({ NODE_ENV: 'development', PORT: '3000' }));

    assert.deepEqual(report, {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'development',
      hasDatabase: false,
      hasAuthSecret: false,
      hasNotificationWebhookSecret: false
    });
  });
});
