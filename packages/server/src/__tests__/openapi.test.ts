import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildOpenApiDocument } from '../index.js';

describe('buildOpenApiDocument', () => {
  it('documents proposal API routes and bearer auth for user-scoped endpoints', () => {
    const doc = buildOpenApiDocument();
    const paths = Object.keys(doc.paths).sort();

    assert.deepEqual(paths, [
      '/api/account/subscription-access',
      '/api/basket/compare',
      '/api/basket/current',
      '/api/basket/items',
      '/api/billing/subscription-events',
      '/api/budget',
      '/api/budget/summary',
      '/api/health',
      '/api/human-review/assignments',
      '/api/human-review/assignments/{id}/decisions',
      '/api/indices',
      '/api/indices/{id}',
      '/api/market/overview',
      '/api/metrics/notifications',
      '/api/notifications/suppression-events',
      '/api/products/search',
      '/api/products/{id}',
      '/api/products/{id}/history',
      '/api/products/{id}/prices',
      '/api/stores',
      '/api/stores/{id}',
      '/api/users/{userId}/favorite-stores',
      '/api/watchlist'
    ]);

    assert.deepEqual(doc.components.securitySchemes.bearerAuth, { type: 'http', scheme: 'bearer' });
    assert.deepEqual(doc.components.securitySchemes.metricsToken, { type: 'apiKey', in: 'header', name: 'x-groceryview-metrics-token' });
    assert.deepEqual(doc.components.securitySchemes.webhookSignature, { type: 'apiKey', in: 'header', name: 'x-groceryview-signature' });
    assert.deepEqual(doc.components.securitySchemes.billingWebhookSignature, { type: 'apiKey', in: 'header', name: 'x-groceryview-billing-signature' });
    assert.deepEqual(doc.paths['/api/account/subscription-access'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/billing/subscription-events'].post?.security, [{ billingWebhookSignature: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/human-review/assignments'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/human-review/assignments/{id}/decisions'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/metrics/notifications'].get?.security, [{ metricsToken: [] }]);
    assert.deepEqual(doc.paths['/api/notifications/suppression-events'].post?.security, [{ webhookSignature: [] }]);
    assert.match(doc.paths['/api/health'].get?.summary ?? '', /without exposing secrets/i);
    assert.equal(doc.paths['/api/market/overview'].get?.security, undefined);
  });
});
