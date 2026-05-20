import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildOpenApiDocument } from '../index.js';

describe('buildOpenApiDocument', () => {
  it('documents proposal API routes and bearer auth for user-scoped endpoints', () => {
    const doc = buildOpenApiDocument();
    const paths = Object.keys(doc.paths).sort();

    assert.deepEqual(paths, [
      '/api/account/subscription-access',
      '/api/ads/disclosure',
      '/api/auth/session',
      '/api/basket/compare',
      '/api/basket/comparison-report',
      '/api/basket/current',
      '/api/basket/items',
      '/api/basket/items/{productId}',
      '/api/basket/local-offers',
      '/api/billing/subscription-events',
      '/api/budget',
      '/api/budget/categories',
      '/api/budget/summary',
      '/api/categories/{category}/market',
      '/api/health',
      '/api/households/current',
      '/api/human-review/assignments',
      '/api/human-review/assignments/{id}/decisions',
      '/api/indices',
      '/api/indices/{id}',
      '/api/loyalty/offers',
      '/api/market/overview',
      '/api/meal-plans/suggestions',
      '/api/metrics/notifications',
      '/api/notifications/inbox',
      '/api/notifications/provider-suppression-events',
      '/api/notifications/suppression-events',
      '/api/nutrition/value',
      '/api/pantry/replenishment',
      '/api/prices/freshness',
      '/api/privacy/deletion-plan',
      '/api/privacy/export',
      '/api/privacy/request-fulfillment',
      '/api/products/search',
      '/api/products/{id}',
      '/api/products/{id}/deal-score',
      '/api/products/{id}/equivalents',
      '/api/products/{id}/history',
      '/api/products/{id}/prices',
      '/api/products/{id}/terminal',
      '/api/readiness/postgres',
      '/api/readiness/source-runs',
      '/api/receipts/review',
      '/api/scans/process',
      '/api/scans/upload-url',
      '/api/stores',
      '/api/stores/{id}',
      '/api/stores/{id}/deals',
      '/api/users/{userId}/favorite-stores',
      '/api/users/{userId}/favorite-stores/{storeId}',
      '/api/watchlist',
      '/api/watchlist/items/{productId}'
    ]);

    assert.deepEqual(doc.components.securitySchemes.bearerAuth, { type: 'http', scheme: 'bearer' });
    assert.deepEqual(doc.components.securitySchemes.metricsToken, { type: 'apiKey', in: 'header', name: 'x-groceryview-metrics-token' });
    assert.deepEqual(doc.components.securitySchemes.webhookSignature, { type: 'apiKey', in: 'header', name: 'x-groceryview-signature' });
    assert.deepEqual(doc.components.securitySchemes.billingWebhookSignature, { type: 'apiKey', in: 'header', name: 'x-groceryview-billing-signature' });
    assert.deepEqual(doc.paths['/api/account/subscription-access'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/ads/disclosure'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/ads/disclosure'].get?.summary ?? '', /ad disclosure/i);
    assert.equal(doc.paths['/api/auth/session'].post?.security, undefined);
    assert.deepEqual(doc.paths['/api/billing/subscription-events'].post?.security, [{ billingWebhookSignature: [] }]);
    assert.deepEqual(doc.paths['/api/basket/comparison-report'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/basket/local-offers'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/meal-plans/suggestions'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/budget/categories'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/budget/categories'].patch?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/households/current'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/households/current'].put?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/users/{userId}/favorite-stores/{storeId}'].delete?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist/items/{productId}'].delete?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/basket/items/{productId}'].patch?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/human-review/assignments'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/human-review/assignments/{id}/decisions'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/privacy/export'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/privacy/deletion-plan'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/privacy/request-fulfillment'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/pantry/replenishment'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/scans/process'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/scans/upload-url'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/metrics/notifications'].get?.security, [{ metricsToken: [] }]);
    assert.deepEqual(doc.paths['/api/readiness/postgres'].get?.security, [{ metricsToken: [] }]);
    assert.deepEqual(doc.paths['/api/readiness/source-runs'].get?.security, [{ metricsToken: [] }]);
    assert.match(doc.paths['/api/readiness/source-runs'].get?.summary ?? '', /source run/i);
    assert.deepEqual(doc.paths['/api/notifications/suppression-events'].post?.security, [{ webhookSignature: [] }]);
    assert.deepEqual(doc.paths['/api/notifications/provider-suppression-events'].post?.security, [{ webhookSignature: [] }]);
    assert.deepEqual(doc.paths['/api/notifications/inbox'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/notifications/inbox'].get?.summary ?? '', /notification inbox/i);
    assert.match(doc.paths['/api/health'].get?.summary ?? '', /without exposing secrets/i);
    assert.equal(doc.paths['/api/products/{id}/terminal'].get?.security, undefined);
    assert.match(doc.paths['/api/products/{id}/terminal'].get?.summary ?? '', /price terminal/i);
    assert.equal(doc.paths['/api/market/overview'].get?.security, undefined);
    assert.equal(doc.paths['/api/nutrition/value'].get?.security, undefined);
    assert.match(doc.paths['/api/nutrition/value'].get?.summary ?? '', /nutrition.*krona/i);
    assert.deepEqual(doc.paths['/api/pantry/replenishment'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/pantry/replenishment'].get?.summary ?? '', /pantry replenishment/i);
    assert.deepEqual(doc.paths['/api/loyalty/offers'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/loyalty/offers'].get?.summary ?? '', /loyalty offers/i);
    assert.deepEqual(doc.paths['/api/receipts/review'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/receipts/review'].get?.summary ?? '', /receipt review/i);
    assert.equal(doc.paths['/api/categories/{category}/market'].get?.security, undefined);
    assert.match(doc.paths['/api/categories/{category}/market'].get?.summary ?? '', /category market/i);
  });
});
