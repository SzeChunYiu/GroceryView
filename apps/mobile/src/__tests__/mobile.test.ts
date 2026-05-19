import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildExpoReadinessPlan, buildMobileShell, buildScanResult, createMobileViewModel } from '../index.js';

describe('mobile app foundation', () => {
  it('defines the proposal bottom navigation and Today dashboard modules', () => {
    const shell = buildMobileShell();

    assert.deepEqual(shell.tabs.map((tab) => tab.id), ['today', 'stores', 'basket', 'scan', 'profile']);
    assert.deepEqual(shell.todayModules, ['weekly_budget', 'favorite_store_deals', 'watchlist_alerts', 'weekly_basket', 'recommended_actions', 'recent_price_drops', 'receipt_insights']);
  });

  it('builds a mobile view model from API data for daily use', () => {
    const viewModel = createMobileViewModel('user-1');

    assert.equal(viewModel.today.marketCity, 'Stockholm');
    assert.equal(viewModel.today.topDeals[0].ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(viewModel.scan.supportedModes.join(','), 'barcode,receipt');
    assert.equal(viewModel.basket.emptyStateAction, 'Add from deals or scan a barcode');
  });

  it('builds barcode scan results with deal score, equivalent products, and actions', () => {
    const result = buildScanResult({ mode: 'barcode', code: '7310000000000', productId: 'coffee' });

    assert.equal(result.product?.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(result.verdict, 'Buy');
    assert.deepEqual(result.actions, ['add_to_weekly_basket', 'add_to_watchlist', 'compare_stores']);
  });

  it('builds receipt scan placeholder with confidence and budget review action', () => {
    const result = buildScanResult({ mode: 'receipt', code: 'receipt-image://local' });

    assert.equal(result.product, null);
    assert.equal(result.confidenceLabel, 'medium-high after OCR review');
    assert.deepEqual(result.actions, ['extract_receipt_items', 'review_budget_impact', 'confirm_matches']);
  });

  it('defines Expo route and device-build readiness for proposal-critical screens', () => {
    const plan = buildExpoReadinessPlan();

    assert.deepEqual(plan.routes.map((route) => route.path), [
      '/today',
      '/stores',
      '/basket',
      '/scan/barcode',
      '/scan/receipt',
      '/profile',
      '/household',
      '/privacy'
    ]);
    assert.deepEqual(plan.requiredDeviceCapabilities, ['camera', 'secure-storage', 'push-notifications']);
    assert.equal(plan.buildProfiles.production.distribution, 'store');
    assert.equal(plan.failClosedWithoutProviders, true);
  });

  it('ships Expo and EAS config placeholders for device builds', () => {
    const appConfig = JSON.parse(readFileSync(new URL('../../app.config.json', import.meta.url), 'utf8'));
    const easConfig = JSON.parse(readFileSync(new URL('../../eas.json', import.meta.url), 'utf8'));

    assert.equal(appConfig.expo.name, 'GroceryView');
    assert.equal(appConfig.expo.ios.infoPlist.NSCameraUsageDescription.includes('barcodes and receipts'), true);
    assert.deepEqual(appConfig.expo.android.permissions, ['CAMERA', 'POST_NOTIFICATIONS']);
    assert.equal(appConfig.expo.extra.failClosedWithoutProviders, true);
    assert.equal(easConfig.build.production.distribution, 'store');
  });
});
