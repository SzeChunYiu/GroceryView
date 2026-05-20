import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMobileDeepLink, buildMobileRouteManifest, findMobileRoute } from '../routeManifest.js';

describe('mobile route manifest', () => {
  it('declares the P8 Today, Search, Product, Basket, and Budget routes as routable Expo screens', () => {
    const manifest = buildMobileRouteManifest();

    assert.equal(manifest.router, 'expo-router');
    assert.equal(manifest.initialRoute, '/today');
    assert.deepEqual(
      manifest.requiredRoutes.map((route) => route.path),
      ['/today', '/search', '/products/[id]', '/basket', '/budget']
    );
    assert.deepEqual(
      manifest.requiredRoutes.map((route) => route.screen),
      ['TodayScreen', 'SearchScreen', 'ProductScreen', 'BasketScreen', 'BudgetScreen']
    );
    assert.equal(manifest.requiredRoutes.every((route) => route.requiresAuth), true);
  });

  it('keeps camera and notification provider placeholders routable without treating them as core MVP screens', () => {
    const manifest = buildMobileRouteManifest();

    assert.deepEqual(
      manifest.placeholderRoutes.map((route) => ({ path: route.path, placeholderFor: route.placeholderFor })),
      [
        { path: '/scan/camera-placeholder', placeholderFor: 'camera' },
        { path: '/profile/notifications-placeholder', placeholderFor: 'notifications' }
      ]
    );
  });

  it('maps route preloads to the mobile query cache ids needed by each screen', () => {
    assert.deepEqual(findMobileRoute('/today')?.preloadQueryIds, ['today', 'basket', 'budget']);
    assert.deepEqual(findMobileRoute('/search')?.preloadQueryIds, ['search']);
    assert.deepEqual(findMobileRoute('/products/[id]')?.preloadQueryIds, ['product']);
    assert.deepEqual(findMobileRoute('/basket')?.preloadQueryIds, ['basket', 'budget']);
    assert.deepEqual(findMobileRoute('/budget')?.preloadQueryIds, ['budget', 'basket']);
  });

  it('builds stable deep links and requires product ids for product links', () => {
    assert.equal(buildMobileDeepLink('/today'), 'groceryview://today');
    assert.equal(buildMobileDeepLink('/search', { q: 'coffee deals' }), 'groceryview://search?q=coffee+deals');
    assert.equal(buildMobileDeepLink('/products/[id]', { id: 'ZOEGAS-COFFEE-450G' }), 'groceryview://products/ZOEGAS-COFFEE-450G');
    assert.throws(() => buildMobileDeepLink('/products/[id]'), /id is required/);
  });
});
