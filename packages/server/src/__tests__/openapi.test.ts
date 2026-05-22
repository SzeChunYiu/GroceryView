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
      '/api/basket/recurring-digest',
      '/api/basket/stores/{storeId}/quote',
      '/api/billing/subscription-events',
      '/api/budget',
      '/api/budget/categories',
      '/api/budget/summary',
      '/api/categories/{category}/market',
      '/api/deals/flyer-offers',
      '/api/expiry-deals/radar',
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
      '/api/products/{id}/history-confidence',
      '/api/products/{id}/history-summary',
      '/api/products/{id}/price-spread',
      '/api/products/{id}/prices',
      '/api/products/{id}/store-savings',
      '/api/products/{id}/terminal',
      '/api/readiness/catalog-coverage',
      '/api/readiness/postgres',
      '/api/readiness/source-runs',
      '/api/receipts/review',
      '/api/scans/process',
      '/api/scans/upload-url',
      '/api/stores',
      '/api/stores/{id}',
      '/api/stores/{id}/category-coverage',
      '/api/stores/{id}/deal-summary',
      '/api/stores/{id}/deals',
      '/api/stores/{id}/flyer-offers',
      '/api/stores/{id}/price-coverage',
      '/api/users/{userId}/favorite-stores',
      '/api/users/{userId}/favorite-stores/{storeId}',
      '/api/watchlist',
      '/api/watchlist/items/{productId}',
      '/api/watchlist/price-alerts',
      '/api/workers/notifications/run'
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
    assert.deepEqual(doc.paths['/api/basket/recurring-digest'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/expiry-deals/radar'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/meal-plans/suggestions'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/budget/categories'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/budget/categories'].patch?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist/price-alerts'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist/price-alerts'].post?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/households/current'].get?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/households/current'].put?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/users/{userId}/favorite-stores/{storeId}'].delete?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/watchlist/items/{productId}'].delete?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/basket/items/{productId}'].patch?.security, [{ bearerAuth: [] }]);
    assert.deepEqual(doc.paths['/api/basket/stores/{storeId}/quote'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/basket/stores/{storeId}/quote'].get?.summary ?? '', /quote.*basket/i);
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
    assert.deepEqual(doc.paths['/api/workers/notifications/run'].post?.security, [{ metricsToken: [] }]);
    assert.match(doc.paths['/api/workers/notifications/run'].post?.summary ?? '', /notification worker/i);
    assert.deepEqual(doc.paths['/api/notifications/suppression-events'].post?.security, [{ webhookSignature: [] }]);
    assert.deepEqual(doc.paths['/api/notifications/provider-suppression-events'].post?.security, [{ webhookSignature: [] }]);
    assert.deepEqual(doc.paths['/api/notifications/inbox'].get?.security, [{ bearerAuth: [] }]);
    assert.match(doc.paths['/api/notifications/inbox'].get?.summary ?? '', /notification inbox/i);
    assert.match(doc.paths['/api/health'].get?.summary ?? '', /without exposing secrets/i);
    assert.equal(doc.paths['/api/products/{id}/terminal'].get?.security, undefined);
    assert.match(doc.paths['/api/products/{id}/terminal'].get?.summary ?? '', /price terminal/i);
    assert.equal(doc.paths['/api/products/{id}/history-summary'].get?.security, undefined);
    assert.match(doc.paths['/api/products/{id}/history-summary'].get?.summary ?? '', /history summary/i);
    assert.equal(doc.paths['/api/products/{id}/history-confidence'].get?.security, undefined);
    assert.match(doc.paths['/api/products/{id}/history-confidence'].get?.summary ?? '', /history confidence/i);
    assert.equal(doc.paths['/api/products/{id}/price-spread'].get?.security, undefined);
    assert.match(doc.paths['/api/products/{id}/price-spread'].get?.summary ?? '', /price spread/i);
    assert.equal(doc.paths['/api/products/{id}/store-savings'].get?.security, undefined);
    assert.match(doc.paths['/api/products/{id}/store-savings'].get?.summary ?? '', /store savings/i);
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
    assert.equal(doc.paths['/api/stores/{id}/category-coverage'].get?.security, undefined);
    assert.match(doc.paths['/api/stores/{id}/category-coverage'].get?.summary ?? '', /category/i);
    assert.equal(doc.paths['/api/stores/{id}/deal-summary'].get?.security, undefined);
    assert.match(doc.paths['/api/stores/{id}/deal-summary'].get?.summary ?? '', /deal summary/i);
    assert.equal(doc.paths['/api/stores/{id}/flyer-offers'].get?.security, undefined);
    assert.match(doc.paths['/api/stores/{id}/flyer-offers'].get?.summary ?? '', /flyer offers/i);
    assert.equal(doc.paths['/api/deals/flyer-offers'].get?.security, undefined);
    assert.match(doc.paths['/api/deals/flyer-offers'].get?.summary ?? '', /flyer offers/i);
    assert.equal(doc.paths['/api/stores/{id}/price-coverage'].get?.security, undefined);
    assert.match(doc.paths['/api/stores/{id}/price-coverage'].get?.summary ?? '', /price coverage/i);
  });
});
