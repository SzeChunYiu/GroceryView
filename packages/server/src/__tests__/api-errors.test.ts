import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('API error contract', () => {
  it('returns the success response shape for the health endpoint', async () => {
    const response = await createHttpHandler(undefined, {
      runtimeConfig: { nodeEnv: 'test', port: 3000 }
    })(new Request('http://localhost/api/health'));

    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'test',
      hasDatabase: false,
      hasPublicWebUrl: false,
      hasAuthSecret: false,
      hasNotificationWebhookSecret: false,
      hasBillingWebhookSecret: false,
      hasMetricsToken: false,
      hasScanUploadStorage: false
    });
  });

  it('returns 400 with a stable error envelope for invalid JSON request bodies', async () => {
    const response = await createHttpHandler()(new Request('http://localhost/api/watchlist?userId=user-1', {
      method: 'POST',
      body: '{'
    }));

    assert.equal(response.status, 400);
    assert.match(response.headers.get('content-type') ?? '', /^application\/json/);
    const body = await json(response) as { error?: unknown };
    assert.deepEqual(Object.keys(body).sort(), ['error']);
    assert.equal(typeof body.error, 'string');
    assert.match(body.error, /^Invalid JSON:/);
  });

  it('returns 400 with field-level validation errors for request schema failures', async () => {
    const response = await createHttpHandler()(new Request('http://localhost/api/watchlist?userId=user-1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetPrice: 25 })
    }));

    assert.equal(response.status, 400);
    assert.deepEqual(await json(response), { error: 'productId is required.' });
  });

  it('returns 404 with a stable error envelope for unknown routes', async () => {
    const response = await createHttpHandler()(new Request('http://localhost/api/not-a-real-route'));

    assert.equal(response.status, 404);
    assert.deepEqual(await json(response), { error: 'Route not found: GET /api/not-a-real-route' });
  });
});
