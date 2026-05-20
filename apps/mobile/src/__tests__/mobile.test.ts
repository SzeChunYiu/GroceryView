import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGroceryViewApi } from '@groceryview/api';
import {
  buildExpoReadinessPlan,
  buildMobileProviderReadinessReport,
  buildMobileScreenBlueprints,
  buildMobileShell,
  buildScanResult,
  composeMobileProductTerminalScreen,
  createMobileDiscoveryViewModel,
  createMobileProductPriceTerminalViewModel,
  createMobileViewModel,
  loadMobileProductTerminal
} from '../index.js';

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

  it('builds product discovery state for search, product price detail, basket comparison, budget, and watchlist alerts', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });

    const viewModel = createMobileDiscoveryViewModel({ userId: 'user-1', query: 'coffee', selectedProductId: 'coffee' }, api);

    assert.deepEqual(viewModel.favoriteStores.map((store) => store.id), ['willys-odenplan', 'lidl-sveavagen']);
    assert.deepEqual(viewModel.searchResults.map((product) => product.ticker), ['ZOEGAS-COFFEE-450G']);
    assert.equal(viewModel.searchResults[0].bestPrice, 49.9);
    assert.equal(viewModel.selectedProduct?.currentPrices[0].storeId, 'willys-odenplan');
    assert.equal(viewModel.selectedProduct?.priceTerminal.quote.bestPrice, 49.9);
    assert.equal(viewModel.selectedProduct?.priceTerminal.quote.bestStoreName, 'Willys Odenplan');
    assert.deepEqual(viewModel.selectedProduct?.priceTerminal.distributionSummaries.map((distribution) => distribution.label), [
      'Whole Stockholm',
      'Odenplan local area'
    ]);
    assert.equal(viewModel.selectedProduct?.priceTerminal.chartSummary.seriesCount, 1);
    assert.equal(viewModel.selectedProduct?.priceTerminal.chartSummary.historyPointCount, 3);
    assert.equal(viewModel.selectedProduct?.priceTerminal.chartSummary.isNewLow, true);
    assert.equal(viewModel.selectedProduct?.priceTerminal.guardrails.length, 3);
    assert.deepEqual(viewModel.selectedProduct?.priceHistory.map((point) => point.lineStyle), ['solid', 'solid', 'solid']);
    assert.deepEqual(viewModel.selectedProduct?.actions, ['open_price_terminal', 'add_to_weekly_basket', 'add_to_watchlist', 'compare_stores', 'scan_receipt_to_verify']);
    assert.equal(viewModel.weeklyBasket.itemCount, 3);
    assert.equal(viewModel.weeklyBasket.cheapestTotal, 77.7);
    assert.equal(viewModel.weeklyBasket.bestSingleStore?.storeId, 'willys-odenplan');
    assert.equal(viewModel.weeklyBasket.savingsVsBestSingleStore, 2);
    assert.equal(viewModel.budget.weeklyRemainingAfterEstimate, 72.3);
    assert.equal(viewModel.budget.weeklyStatus, 'under');
    assert.deepEqual(viewModel.watchlist.alertTypes, ['deal_score', 'new_52_week_low', 'target_price']);
  });

  it('loads connected product terminal numbers from the public API route for mobile product detail', async () => {
    const api = createGroceryViewApi();
    const terminal = api.getProductPriceTerminal('coffee');
    assert.ok(terminal);
    const requestedUrls: string[] = [];

    const summary = await loadMobileProductTerminal({
      apiBase: 'https://api.groceryview.example',
      productId: 'coffee',
      asOf: '2026-05-19T00:00:00.000Z',
      bearerToken: 'session-token',
      fetcher: async (url, init) => {
        requestedUrls.push(String(url));
        assert.equal(init?.method, 'GET');
        assert.deepEqual(init?.headers, { authorization: 'Bearer session-token' });
        return new Response(JSON.stringify(terminal), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    assert.deepEqual(requestedUrls, ['https://api.groceryview.example/api/products/coffee/terminal?asOf=2026-05-19T00%3A00%3A00.000Z']);
    assert.equal(summary.quote.bestPrice, 49.9);
    assert.equal(summary.distributionSummaries[0].currentPercentile, 8);
    assert.equal(summary.chartSummary.historyPointCount, 3);
    assert.equal(summary.chartSummary.isNewLow, true);
    assert.match(summary.guardrails.join(' '), /Verified shelf/);
  });

  it('fails closed for missing mobile terminal API configuration or route errors', async () => {
    await assert.rejects(() => loadMobileProductTerminal({ apiBase: ' ', productId: 'coffee' }), /apiBase is required/);
    await assert.rejects(() => loadMobileProductTerminal({ apiBase: 'https://api.groceryview.example', productId: ' ' }), /productId is required/);
    await assert.rejects(
      () => loadMobileProductTerminal({
        apiBase: 'https://api.groceryview.example',
        productId: 'missing-product',
        fetcher: async () => new Response(JSON.stringify({ error: 'Product not found.' }), { status: 404 })
      }),
      /Product not found/
    );
  });

  it('builds mobile product terminal state from quote, distribution, chart, and evidence data', () => {
    const viewModel = createMobileProductPriceTerminalViewModel('coffee');

    assert.equal(viewModel?.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(viewModel?.quote.bestPriceLabel, '49.90 SEK');
    assert.equal(viewModel?.quote.bestStoreName, 'Willys Odenplan');
    assert.equal(viewModel?.quote.dealVerdict, 'Buy');
    assert.equal(viewModel?.quote.oneMonthMoveLabel, '-16.7%');
    assert.equal(viewModel?.quote.range52WeekLabel, '49.90-69.90 SEK');
    assert.deepEqual(viewModel?.evidence, {
      currentPrices: 3,
      historyPoints: 3,
      verifiedHistoryPoints: 3,
      latestObservedAt: '2026-05-19T00:00:00.000Z',
      isNewLow: true,
      guardrails: [
        'Verified shelf or retailer-page prices can power current quote, Deal Score, and basket totals.',
        'Member, promotion, estimated, and low-confidence rows must stay explicitly labeled before customer action.',
        'Distribution and chart samples include sample size and provenance-aware confidence styling.'
      ]
    });
    assert.deepEqual(viewModel?.distributions.map((distribution) => ({
      scope: distribution.scope,
      sampleSize: distribution.sampleSize,
      medianPrice: distribution.medianPrice,
      cheaperThanPercent: distribution.cheaperThanPercent
    })), [
      { scope: 'stockholm', sampleSize: 3, medianPrice: 59.9, cheaperThanPercent: 92 },
      { scope: 'local_area', sampleSize: 2, medianPrice: 57.4, cheaperThanPercent: 50 }
    ]);
    assert.deepEqual(viewModel?.chartSeries, [
      {
        id: 'willys-odenplan:shelf',
        storeName: 'Willys Odenplan',
        lineStyle: 'solid',
        pointCount: 3,
        latestPrice: 49.9,
        markerCount: 1
      }
    ]);
    assert.deepEqual(viewModel?.actions, ['add_to_watchlist', 'add_to_weekly_basket', 'compare_stores', 'scan_receipt_to_verify']);
    assert.equal(createMobileProductPriceTerminalViewModel('missing-product'), null);
  });

  it('composes a renderable mobile product terminal screen with quote, evidence, chart, and actions', () => {
    const screen = composeMobileProductTerminalScreen('coffee');
    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Zoégas Coffee 450g');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['quote', 'evidence', 'distribution', 'chart', 'actions']);

    const quote = screen.children.find((section) => section.key === 'quote');
    assert.equal(quote?.type, 'section');
    assert.deepEqual(quote?.children.map((metric) => metric.type), ['metric', 'metric', 'metric', 'metric']);
    assert.deepEqual(quote?.children.map((metric) => 'value' in metric ? metric.value : null), [
      '49.90 SEK',
      '82 / Buy',
      '-16.7%',
      '49.90-69.90 SEK'
    ]);

    const distribution = screen.children.find((section) => section.key === 'distribution');
    if (!distribution || distribution.type !== 'section') throw new Error('distribution section missing');
    assert.deepEqual(distribution?.children.map((row) => 'value' in row ? row.value : null), [
      '59.90 SEK median, cheaper than 92%',
      '57.40 SEK median, cheaper than 50%'
    ]);

    const chart = screen.children.find((section) => section.key === 'chart');
    if (!chart || chart.type !== 'section') throw new Error('chart section missing');
    assert.deepEqual(chart?.children.map((row) => 'value' in row ? row.value : null), [
      '3 points, latest 49.90 SEK, 1 markers'
    ]);

    const actions = screen.children.find((section) => section.key === 'actions');
    if (!actions || actions.type !== 'section') throw new Error('actions section missing');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), [
      'Watch price',
      'Add to basket',
      'Compare stores',
      'Verify with receipt'
    ]);
  });

  it('composes an empty mobile product terminal screen when product data is missing', () => {
    const screen = composeMobileProductTerminalScreen('missing-product');

    assert.equal(screen.type, 'screen');
    assert.equal(screen.state, 'empty');
    assert.deepEqual(screen.children, [
      {
        type: 'empty',
        key: 'missing-product',
        message: 'Product terminal data is unavailable for this product.',
        action: 'search_product'
      }
    ]);
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
      '/products/[id]/terminal',
      '/basket',
      '/scan/barcode',
      '/scan/receipt',
      '/profile',
      '/household',
      '/privacy',
      '/review-queue'
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

  it('defines screen blueprints with states, actions, provider gates, and offline behavior', () => {
    const plan = buildMobileScreenBlueprints();

    assert.equal(plan.authRequiredByDefault, true);
    assert.deepEqual(plan.screens.map((screen) => screen.route), [
      '/today',
      '/products/[id]/terminal',
      '/basket',
      '/scan/barcode',
      '/scan/receipt',
      '/review-queue',
      '/profile'
    ]);

    const terminal = plan.screens.find((screen) => screen.route === '/products/[id]/terminal');
    assert.equal(terminal?.screen, 'ProductPriceTerminalScreen');
    assert.match(terminal?.dataDependencies.join(','), /product_terminal_report/);
    assert.deepEqual(terminal?.actions, ['open_price_terminal', 'open_product', 'compare_basket']);
    assert.match(terminal?.offlineBehavior ?? '', /cached terminal report/i);

    const receipt = plan.screens.find((screen) => screen.route === '/scan/receipt');
    assert.equal(receipt?.primaryState, 'needs_provider');
    assert.deepEqual(receipt?.providerRequirements, ['camera', 'ocr', 'secure-session']);
    assert.match(receipt?.offlineBehavior ?? '', /block budget writeback/i);

    const reviewQueue = plan.screens.find((screen) => screen.route === '/review-queue');
    assert.equal(reviewQueue?.screen, 'HumanReviewQueueScreen');
    assert.deepEqual(reviewQueue?.actions, ['review_assignment', 'submit_review_decision']);
    assert.match(reviewQueue?.dataDependencies.join(','), /reviewer_permissions/);

    assert.deepEqual(plan.blockedWithoutProviders.map((screen) => screen.route), [
      '/scan/barcode',
      '/scan/receipt',
      '/profile'
    ]);
  });

  it('blocks mobile screens when required providers are unavailable', () => {
    const report = buildMobileProviderReadinessReport({
      providers: {
        camera: 'available',
        'secure-session': 'available',
        'barcode-lookup': 'available',
        ocr: 'not_configured',
        'push-notifications': 'denied'
      }
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'mobile_provider_missing:/scan/receipt:ocr',
      'mobile_provider_missing:/profile:push-notifications'
    ]);

    const barcode = report.screenStates.find((screen) => screen.route === '/scan/barcode');
    const receipt = report.screenStates.find((screen) => screen.route === '/scan/receipt');
    const profile = report.screenStates.find((screen) => screen.route === '/profile');

    assert.equal(barcode?.state, 'ready');
    assert.equal(receipt?.state, 'needs_provider');
    assert.deepEqual(receipt?.actions, []);
    assert.equal(profile?.state, 'needs_provider');
    assert.deepEqual(profile?.missingProviders, ['push-notifications']);
  });

  it('marks mobile provider readiness ready when all provider gates are available', () => {
    const report = buildMobileProviderReadinessReport({
      providers: {
        camera: 'available',
        'secure-session': 'available',
        'barcode-lookup': 'available',
        ocr: 'available',
        'push-notifications': 'available'
      }
    });

    assert.equal(report.status, 'ready');
    assert.deepEqual(report.blockers, []);
    assert.equal(report.screenStates.every((screen) => screen.state === 'ready'), true);
    assert.equal(report.summary, 'Mobile providers are ready.');
  });
});
