import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildOpenApiDocument } from '../index.js';

describe('buildOpenApiDocument', () => {
  it('documents proposal API routes and bearer auth for user-scoped endpoints', () => {
    const doc = buildOpenApiDocument();
    const paths = Object.keys(doc.paths).sort();

    assert.deepEqual(paths, [
      '/api/basket/compare',
      '/api/basket/current',
      '/api/basket/items',
      '/api/budget',
      '/api/budget/summary',
      '/api/indices',
      '/api/indices/{id}',
      '/api/market/overview',
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
    assert.deepEqual(doc.components.securitySchemes.webhookSignature, { type: 'apiKey', in: 'header', name: 'x-groceryview-signature' });
    assert.deepEqual(doc.paths['/api/watchlist'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/notifications/suppression-events'].post?.security, [{ webhookSignature: [] }]);
    assert.equal(doc.paths['/api/market/overview'].get?.security, undefined);
  });
});
