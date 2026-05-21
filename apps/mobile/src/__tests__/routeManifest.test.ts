import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMobileDeepLink, buildMobileRouteManifest, findMobileRoute } from '../routeManifest.js';

describe('mobile route manifest', () => {
  it('declares core, scan, product terminal, review queue, and profile routes as routable Expo screens', () => {
    const manifest = buildMobileRouteManifest();

    assert.equal(manifest.router, 'expo-router');
    assert.equal(manifest.initialRoute, '/today');
    assert.deepEqual(
      manifest.requiredRoutes.map((route) => route.path),
      [
        '/today',
        '/stores',
        '/watchlist',
        '/search',
        '/products/[id]',
        '/products/[id]/terminal',
        '/basket',
        '/budget',
        '/scan/barcode',
        '/scan/receipt',
        '/profile',
        '/household',
        '/privacy',
        '/review-queue'
      ]
    );
    assert.deepEqual(
      manifest.requiredRoutes.map((route) => route.screen),
      [
        'TodayScreen',
        'StoresScreen',
        'WatchlistScreen',
        'SearchScreen',
        'ProductScreen',
        'ProductPriceTerminalScreen',
        'BasketScreen',
        'BudgetScreen',
        'BarcodeScanScreen',
        'ReceiptScanScreen',
        'ProfileScreen',
        'HouseholdScreen',
        'PrivacyScreen',
        'HumanReviewQueueScreen'
      ]
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
    assert.deepEqual(findMobileRoute('/stores')?.preloadQueryIds, ['stores', 'basket']);
    assert.deepEqual(findMobileRoute('/watchlist')?.preloadQueryIds, ['watchlist', 'product']);
    assert.deepEqual(findMobileRoute('/search')?.preloadQueryIds, ['search']);
    assert.deepEqual(findMobileRoute('/products/[id]')?.preloadQueryIds, ['product']);
    assert.deepEqual(findMobileRoute('/products/[id]/terminal')?.preloadQueryIds, ['product', 'productTerminal']);
    assert.deepEqual(findMobileRoute('/basket')?.preloadQueryIds, ['basket', 'budget']);
    assert.deepEqual(findMobileRoute('/budget')?.preloadQueryIds, ['budget', 'basket']);
    assert.deepEqual(findMobileRoute('/scan/barcode')?.preloadQueryIds, ['barcodeScan', 'product']);
    assert.deepEqual(findMobileRoute('/scan/receipt')?.preloadQueryIds, ['receiptReview', 'budget', 'basket']);
    assert.deepEqual(findMobileRoute('/profile')?.preloadQueryIds, ['budget', 'basket']);
    assert.deepEqual(findMobileRoute('/household')?.preloadQueryIds, ['basket', 'budget']);
    assert.deepEqual(findMobileRoute('/privacy')?.preloadQueryIds, []);
    assert.deepEqual(findMobileRoute('/review-queue')?.preloadQueryIds, ['reviewQueue']);
  });

  it('builds stable deep links and requires product ids for product links', () => {
    assert.equal(buildMobileDeepLink('/today'), 'groceryview://today');
    assert.equal(buildMobileDeepLink('/stores'), 'groceryview://stores');
    assert.equal(buildMobileDeepLink('/stores', { selectedStoreId: 'willys-odenplan' }), 'groceryview://stores?selectedStoreId=willys-odenplan');
    assert.equal(buildMobileDeepLink('/watchlist'), 'groceryview://watchlist');
    assert.equal(buildMobileDeepLink('/profile'), 'groceryview://profile');
    assert.equal(buildMobileDeepLink('/privacy'), 'groceryview://privacy');
    assert.equal(buildMobileDeepLink('/search', { q: 'coffee deals' }), 'groceryview://search?q=coffee+deals');
    assert.equal(buildMobileDeepLink('/products/[id]', { id: 'ZOEGAS-COFFEE-450G' }), 'groceryview://products/ZOEGAS-COFFEE-450G');
    assert.equal(buildMobileDeepLink('/products/[id]/terminal', { id: 'coffee' }), 'groceryview://products/coffee/terminal');
    assert.equal(buildMobileDeepLink('/scan/barcode', { code: '7310000000000' }), 'groceryview://scan/barcode?code=7310000000000');
    assert.equal(buildMobileDeepLink('/scan/receipt', { receiptId: 'receipt-1' }), 'groceryview://scan/receipt?receiptId=receipt-1');
    assert.equal(buildMobileDeepLink('/review-queue'), 'groceryview://review-queue');
    assert.throws(() => buildMobileDeepLink('/products/[id]'), /id is required/);
    assert.throws(() => buildMobileDeepLink('/products/[id]/terminal'), /id is required/);
  });
});
