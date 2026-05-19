import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMobileShell, buildScanResult, createMobileViewModel } from '../index.js';
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
});
