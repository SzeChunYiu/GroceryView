import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGroceryViewApi } from '@groceryview/api';
import {
  buildExpoReadinessPlan,
  buildMobileOfflineSyncPlan,
  buildMobileProviderReadinessReport,
  buildMobilePrivacyRequestPlan,
  buildMobileScreenBlueprints,
  buildMobileShell,
  buildScanResult,
  composeMobileBarcodeScanScreen,
  composeMobileBasketScreen,
  composeMobileBudgetScreen,
  composeMobileHouseholdScreen,
  composeMobileHumanReviewQueueScreen,
  composeMobilePrivacyScreen,
  composeMobileProfileScreen,
  composeMobileReceiptScanScreen,
  composeMobileSearchScreen,
  composeMobileStoresScreen,
  composeMobileTodayScreen,
  composeMobileWatchlistScreen,
  composeMobileProductTerminalScreen,
  createMobileBarcodeScanViewModel,
  createMobileBudgetRouteViewModel,
  createMobileHouseholdViewModel,
  createMobilePrivacyViewModel,
  createMobileProfileHubViewModel,
  createMobileProductPriceTerminalViewModel,
  createMobileBasketViewModel,
  createMobileDiscoveryViewModel,
  createMobileStoresViewModel,
  createMobileWatchlistViewModel,
  createMobileViewModel,
  loadMobileProductTerminal,
  type MobileHumanReviewAssignment,
  type MobileReceiptReview
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

  it('composes a renderable mobile Search screen with results, selected product context, basket, and actions', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });

    const screen = composeMobileSearchScreen({ userId: 'user-1', query: 'coffee', selectedProductId: 'coffee' }, api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Search');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'results', 'selected-product', 'basket-context', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['1', '2', '3', '3']);

    const results = screen.children.find((section) => section.key === 'results');
    if (!results || results.type !== 'section') throw new Error('search results section missing');
    assert.equal(results.children[0]?.key, 'search-result:coffee');
    assert.equal('value' in results.children[0]! ? results.children[0]!.value : null, 'Zoégas Coffee 450g, 49.90 SEK, Deal Score 82');

    const selected = screen.children.find((section) => section.key === 'selected-product');
    if (!selected || selected.type !== 'section') throw new Error('selected product section missing');
    assert.deepEqual(selected.children.map((row) => 'value' in row ? row.value : null), [
      'Buy, Deal Score 82',
      '49.90 SEK at Willys Odenplan',
      '3 points, new low'
    ]);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Open product', 'Add to basket', 'Compare stores', 'Scan barcode']);
  });

  it('composes a Search empty state when no products match', () => {
    const screen = composeMobileSearchScreen({ userId: 'new-user', query: 'zzzz' });
    assert.equal(screen.type, 'screen');
    assert.equal(screen.state, 'empty');

    const results = screen.children.find((section) => section.key === 'results');
    const selected = screen.children.find((section) => section.key === 'selected-product');
    const actions = screen.children.find((section) => section.key === 'actions');
    if (!results || results.type !== 'section') throw new Error('search results section missing');
    if (!selected || selected.type !== 'section') throw new Error('selected product section missing');
    if (!actions || actions.type !== 'section') throw new Error('search actions section missing');

    assert.deepEqual(results.children, [
      {
        type: 'empty',
        key: 'no-search-results',
        message: 'Search products by name or scan a barcode to match shelf prices.',
        action: 'scan_barcode'
      }
    ]);
    assert.deepEqual(selected.children, [
      {
        type: 'empty',
        key: 'no-selected-product',
        message: 'Open a result to compare price history, store coverage, and basket impact.',
        action: 'search_product'
      }
    ]);
    assert.deepEqual(actions.children.map((action) => 'label' in action ? action.label : null), ['Scan barcode']);
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
    assert.equal(viewModel?.priceDropContext.label, 'Temporary store clearance');
    assert.equal(viewModel?.priceDropContext.purchaseTiming, 'Buy only if the local shelf still shows the price; do not assume it will hold.');
    assert.deepEqual(viewModel?.actions, ['add_to_watchlist', 'add_to_weekly_basket', 'compare_stores', 'scan_receipt_to_verify']);
    assert.equal(createMobileProductPriceTerminalViewModel('missing-product'), null);
  });

  it('composes a renderable mobile Today screen from budget, deal, store, and watchlist data', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });

    const screen = composeMobileTodayScreen('user-1', api);
    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Stockholm Today');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['budget', 'top-deals', 'favorite-stores', 'watchlist', 'actions']);

    const budget = screen.children.find((section) => section.key === 'budget');
    assert.equal(budget?.type, 'section');
    assert.deepEqual(budget?.children.map((metric) => 'value' in metric ? metric.value : null), ['150 SEK', '49.9 SEK', '100.1 SEK']);

    const topDeals = screen.children.find((section) => section.key === 'top-deals');
    assert.equal(topDeals?.type, 'section');
    assert.equal(topDeals?.children[0]?.key, 'deal:ZOEGAS-COFFEE-450G');
    assert.equal('value' in topDeals!.children[0]! ? topDeals!.children[0]!.value : null, '49.90 SEK, score 82');

    const stores = screen.children.find((section) => section.key === 'favorite-stores');
    assert.equal(stores?.type, 'section');
    assert.deepEqual(stores?.children.map((row) => row.key), ['store:willys-odenplan', 'store:lidl-sveavagen']);

    const watchlist = screen.children.find((section) => section.key === 'watchlist');
    assert.equal(watchlist?.type, 'section');
    assert.deepEqual(watchlist?.children.map((metric) => 'value' in metric ? metric.value : null), ['1', '3']);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Open deal', 'Compare basket', 'Scan barcode']);
  });

  it('composes a Today empty state when no favorite stores are saved', () => {
    const screen = composeMobileTodayScreen('new-user');
    assert.equal(screen.type, 'screen');
    const stores = screen.children.find((section) => section.key === 'favorite-stores');

    if (!stores || stores.type !== 'section') throw new Error('favorite stores section missing');
    assert.deepEqual(stores.children, [
      {
        type: 'empty',
        key: 'no-favorite-stores',
        message: 'Add favorite stores to personalize Today.',
        action: 'search_product'
      }
    ]);
  });

  it('builds mobile Stores state from favorites, store deals, and local offer baskets', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });

    const viewModel = createMobileStoresViewModel('user-1', api);

    assert.equal(viewModel.favoriteStoreCount, 2);
    assert.equal(viewModel.basketItemCount, 2);
    assert.deepEqual(viewModel.actions, ['open_store', 'compare_basket', 'scan_barcode']);

    const willys = viewModel.stores.find((store) => store.id === 'willys-odenplan');
    assert.equal(willys?.isFavorite, true);
    assert.equal(willys?.topDeal?.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(willys?.topDeal?.price, 49.9);
    assert.equal(willys?.basketQuote?.coveragePercent, 100);
    assert.equal(willys?.basketQuote?.subtotal, 79.7);

    const selected = createMobileStoresViewModel({ userId: 'user-1', selectedStoreId: 'willys-odenplan' }, api);
    assert.equal(selected.selectedStoreId, 'willys-odenplan');
    assert.equal(selected.selectedStore?.name, 'Willys Odenplan');
    assert.deepEqual(selected.selectedStore?.deals.slice(0, 3).map((deal) => deal.productId), ['coffee', 'private-label-milk', 'milk']);

    const coop = viewModel.stores.find((store) => store.id === 'coop-odenplan');
    assert.equal(coop?.isFavorite, false);
    assert.equal(coop?.basketQuote, null);
  });

  it('composes a renderable mobile Stores screen with ranked stores, deal rows, and actions', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });

    const screen = composeMobileStoresScreen('user-1', api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Stores');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'favorite-stores', 'ranked-stores', 'top-store-deals', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['2', '2']);

    const favorites = screen.children.find((section) => section.key === 'favorite-stores');
    assert.equal(favorites?.type, 'section');
    assert.deepEqual(favorites?.children.map((row) => row.key), ['favorite-store:willys-odenplan', 'favorite-store:lidl-sveavagen']);

    const ranked = screen.children.find((section) => section.key === 'ranked-stores');
    if (!ranked || ranked.type !== 'section') throw new Error('ranked stores section missing');
    assert.equal(ranked.children[0]?.key, 'store:willys-odenplan');
    assert.equal('value' in ranked.children[0]! ? ranked.children[0]!.value : null, '100% coverage, 79.70 SEK, fresh');

    const deals = screen.children.find((section) => section.key === 'top-store-deals');
    if (!deals || deals.type !== 'section') throw new Error('top store deals section missing');
    assert.equal(deals.children[0]?.key, 'store-deal:willys-odenplan:coffee');
    assert.equal('value' in deals.children[0]! ? deals.children[0]!.value : null, '49.90 SEK, score 82, Buy');

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Open store', 'Compare basket', 'Scan barcode']);

    const selectedScreen = composeMobileStoresScreen({ userId: 'user-1', selectedStoreId: 'willys-odenplan' }, api);
    assert.equal(selectedScreen.type, 'screen');
    assert.deepEqual(selectedScreen.children.map((section) => section.key), ['summary', 'favorite-stores', 'ranked-stores', 'top-store-deals', 'selected-store', 'actions']);
    const selectedStore = selectedScreen.children.find((section) => section.key === 'selected-store');
    if (!selectedStore || selectedStore.type !== 'section') throw new Error('selected store section missing');
    assert.deepEqual(selectedStore.children.map((row) => row.key), ['selected-store-name', 'selected-deal:coffee', 'selected-deal:private-label-milk', 'selected-deal:milk']);
  });

  it('composes a Stores empty state when favorites have not been selected', () => {
    const screen = composeMobileStoresScreen('new-user');
    assert.equal(screen.type, 'screen');
    const favorites = screen.children.find((section) => section.key === 'favorite-stores');

    if (!favorites || favorites.type !== 'section') throw new Error('favorite stores section missing');
    assert.deepEqual(favorites.children, [
      {
        type: 'empty',
        key: 'no-favorite-stores',
        message: 'Save favorite stores to rank nearby offers.',
        action: 'scan_barcode'
      }
    ]);
  });

  it('builds mobile Watchlist state from tracked products, alerts, and best price data', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.addWatchlistItem('user-1', { productId: 'milk', targetPrice: 14, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] });

    const viewModel = createMobileWatchlistViewModel('user-1', api);

    assert.equal(viewModel.itemCount, 2);
    assert.equal(viewModel.alertCount, 4);
    assert.equal(viewModel.urgentAlertCount, 1);
    assert.deepEqual(viewModel.actions, ['open_product', 'compare_stores', 'add_to_weekly_basket', 'scan_barcode']);
    assert.deepEqual(viewModel.trackedProducts.map((product) => product.ticker), ['ZOEGAS-COFFEE-450G', 'ARLA-MILK-1L']);
    assert.deepEqual(viewModel.trackedProducts[0], {
      productId: 'coffee',
      ticker: 'ZOEGAS-COFFEE-450G',
      productName: 'Zoégas Coffee 450g',
      targetPriceLabel: '55.00 SEK',
      alertDealScoreAt: 80,
      favoriteStoresOnly: true,
      allowedPriceTypes: ['shelf', 'member', 'promotion', 'estimated'],
      bestPriceLabel: '49.90 SEK',
      bestStoreName: 'Willys Odenplan',
      dealScore: 82,
      alertTypes: ['deal_score', 'new_52_week_low', 'target_price']
    });
    assert.deepEqual(viewModel.alerts.map((alert) => `${alert.type}:${alert.severity}`), [
      'target_price:opportunity',
      'deal_score:opportunity',
      'new_52_week_low:urgent',
      'target_price:opportunity'
    ]);
  });

  it('composes a renderable mobile Watchlist screen with tracked product rows, alerts, and actions', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.addWatchlistItem('user-1', { productId: 'milk', targetPrice: 14, favoriteStoresOnly: false, allowedPriceTypes: ['shelf'] });

    const screen = composeMobileWatchlistScreen('user-1', api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Watchlist');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'tracked-products', 'active-alerts', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['2', '4', '1']);

    const tracked = screen.children.find((section) => section.key === 'tracked-products');
    if (!tracked || tracked.type !== 'section') throw new Error('tracked products section missing');
    assert.deepEqual(tracked.children.map((row) => row.key), ['watch:coffee', 'watch:milk']);
    assert.equal('value' in tracked.children[0]! ? tracked.children[0]!.value : null, '49.90 SEK at Willys Odenplan, target 55.00 SEK, 3 alerts');

    const alerts = screen.children.find((section) => section.key === 'active-alerts');
    if (!alerts || alerts.type !== 'section') throw new Error('alerts section missing');
    assert.equal(alerts.children[0]?.key, 'alert:coffee:new_52_week_low');
    assert.equal('value' in alerts.children[0]! ? alerts.children[0]!.value : null, 'urgent: new 52 week low');

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Open product', 'Compare stores', 'Add to basket', 'Scan barcode']);
  });

  it('composes a Watchlist empty state when no products are tracked', () => {
    const screen = composeMobileWatchlistScreen('new-user');
    assert.equal(screen.type, 'screen');
    assert.equal(screen.state, 'empty');
    const tracked = screen.children.find((section) => section.key === 'tracked-products');
    const alerts = screen.children.find((section) => section.key === 'active-alerts');

    if (!tracked || tracked.type !== 'section') throw new Error('tracked products section missing');
    if (!alerts || alerts.type !== 'section') throw new Error('alerts section missing');
    assert.deepEqual(tracked.children, [
      {
        type: 'empty',
        key: 'no-watchlist-items',
        message: 'Watch products to get price, Deal Score, and new-low alerts.',
        action: 'search_product'
      }
    ]);
    assert.deepEqual(alerts.children, [
      {
        type: 'empty',
        key: 'no-watchlist-alerts',
        message: 'No watched products are crossing alert thresholds yet.',
        action: 'scan_barcode'
      }
    ]);
  });

  it('builds mobile Budget state from budget, category, basket, and comparison data', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });
    api.updateCategoryBudgets('user-1', [
      { category: 'coffee', weeklyBudget: 70 },
      { category: 'dairy', weeklyBudget: 20 }
    ]);

    const viewModel = createMobileBudgetRouteViewModel('user-1', api);

    assert.deepEqual(viewModel.summary, {
      weeklyBudgetLabel: '150.00 SEK',
      plannedBasketLabel: '77.70 SEK',
      remainingLabel: '72.30 SEK',
      utilizationPercentLabel: '51.8%',
      status: 'under'
    });
    assert.deepEqual(viewModel.basket, {
      itemCount: 3,
      cheapestTotalLabel: '77.70 SEK',
      bestSingleStoreLabel: 'Willys Odenplan, 79.70 SEK',
      splitStoreCount: 2,
      missingProductCount: 0
    });
    assert.deepEqual(viewModel.categoryBudgets.map((category) => `${category.category}:${category.estimatedSpendLabel}:${category.remainingLabel}`), [
      'coffee:49.90 SEK:20.10 SEK',
      'dairy:27.80 SEK:-7.80 SEK'
    ]);
    assert.deepEqual(viewModel.unbudgetedCategories, []);
    assert.deepEqual(viewModel.actions, ['set_weekly_budget', 'review_category_budgets', 'review_receipts']);
  });

  it('composes a renderable mobile Budget screen with summary, basket impact, categories, and actions', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });
    api.updateCategoryBudgets('user-1', [{ category: 'coffee', weeklyBudget: 70 }]);

    const screen = composeMobileBudgetScreen('user-1', api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Budget');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['budget-summary', 'basket-impact', 'category-budgets', 'unbudgeted-categories', 'actions']);

    const summary = screen.children.find((section) => section.key === 'budget-summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['150.00 SEK', '77.70 SEK', '72.30 SEK', '51.8%']);

    const basket = screen.children.find((section) => section.key === 'basket-impact');
    if (!basket || basket.type !== 'section') throw new Error('basket impact section missing');
    assert.deepEqual(basket.children.map((row) => 'value' in row ? row.value : null), ['3 planned', '77.70 SEK', 'Willys Odenplan, 79.70 SEK', '2 stores, 0 missing']);

    const categories = screen.children.find((section) => section.key === 'category-budgets');
    if (!categories || categories.type !== 'section') throw new Error('category budget section missing');
    assert.equal(categories.children[0]?.key, 'category-budget:coffee');
    assert.equal('value' in categories.children[0]! ? categories.children[0]!.value : null, '49.90 SEK of 70.00 SEK, 20.10 SEK remaining, 1 products');

    const unbudgeted = screen.children.find((section) => section.key === 'unbudgeted-categories');
    if (!unbudgeted || unbudgeted.type !== 'section') throw new Error('unbudgeted categories section missing');
    assert.deepEqual(unbudgeted.children.map((row) => row.key), ['unbudgeted:dairy']);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Set budget', 'Review categories', 'Review receipts']);
  });

  it('builds mobile Basket state from cheapest assignments, single-store options, and budget data', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });

    const viewModel = createMobileBasketViewModel('user-1', api);

    assert.equal(viewModel.itemCount, 3);
    assert.equal(viewModel.cheapestTotalLabel, '77.70 SEK');
    assert.deepEqual(viewModel.bestSingleStore, {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      totalLabel: '79.70 SEK',
      itemCount: 2
    });
    assert.equal(viewModel.savingsVsBestSingleStoreLabel, '2.00 SEK');
    assert.equal(viewModel.splitStoreCount, 2);
    assert.deepEqual(viewModel.budget, {
      weeklyBudgetLabel: '150.00 SEK',
      remainingLabel: '72.30 SEK',
      status: 'under'
    });
    assert.deepEqual(viewModel.assignments.map((assignment) => ({
      productId: assignment.productId,
      ticker: assignment.ticker,
      storeName: assignment.storeName,
      quantity: assignment.quantity,
      lineTotalLabel: assignment.lineTotalLabel
    })), [
      { productId: 'coffee', ticker: 'ZOEGAS-COFFEE-450G', storeName: 'Willys Odenplan', quantity: 1, lineTotalLabel: '49.90 SEK' },
      { productId: 'milk', ticker: 'ARLA-MILK-1L', storeName: 'Lidl Sveavägen', quantity: 2, lineTotalLabel: '27.80 SEK' }
    ]);
    assert.deepEqual(viewModel.singleStoreOptions.map((option) => option.storeId), ['willys-odenplan', 'lidl-sveavagen']);
    assert.deepEqual(viewModel.actions, ['compare_basket', 'open_product', 'scan_barcode']);
  });

  it('composes a renderable mobile Basket screen with assignment rows, store options, and actions', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addFavoriteStore('user-1', 'lidl-sveavagen');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addBasketItem('user-1', { productId: 'milk', quantity: 2 });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });

    const screen = composeMobileBasketScreen('user-1', api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Basket');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'assignments', 'single-store-options', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['3', '77.70 SEK', '72.30 SEK']);

    const assignments = screen.children.find((section) => section.key === 'assignments');
    if (!assignments || assignments.type !== 'section') throw new Error('assignments section missing');
    assert.deepEqual(assignments.children.map((row) => row.key), ['assignment:coffee:willys-odenplan', 'assignment:milk:lidl-sveavagen']);
    assert.equal('value' in assignments.children[0]! ? assignments.children[0]!.value : null, '1 x 49.90 SEK at Willys Odenplan, line 49.90 SEK');

    const storeOptions = screen.children.find((section) => section.key === 'single-store-options');
    if (!storeOptions || storeOptions.type !== 'section') throw new Error('single store options section missing');
    assert.equal(storeOptions.children[0]?.key, 'store-option:willys-odenplan');
    assert.equal('value' in storeOptions.children[0]! ? storeOptions.children[0]!.value : null, '79.70 SEK, 2 matched items');

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Compare basket', 'Open product', 'Scan barcode']);
  });

  it('composes a Basket empty state when no products have been added', () => {
    const screen = composeMobileBasketScreen('new-user');
    assert.equal(screen.type, 'screen');
    assert.equal(screen.state, 'empty');
    const assignments = screen.children.find((section) => section.key === 'assignments');
    const storeOptions = screen.children.find((section) => section.key === 'single-store-options');

    if (!assignments || assignments.type !== 'section') throw new Error('assignments section missing');
    if (!storeOptions || storeOptions.type !== 'section') throw new Error('single store options section missing');
    assert.deepEqual(assignments.children, [
      {
        type: 'empty',
        key: 'empty-basket',
        message: 'Start a basket from a deal, search result, or barcode scan.',
        action: 'scan_barcode'
      }
    ]);
    assert.deepEqual(storeOptions.children, [
      {
        type: 'empty',
        key: 'no-store-options',
        message: 'Add items and favorite stores to compare basket totals.',
        action: 'scan_barcode'
      }
    ]);
  });

  it('builds mobile Profile hub state from budget, household, notification, and privacy data', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });
    api.upsertHouseholdPlan('user-1', {
      householdId: 'house-1',
      name: 'Shared flat',
      weeklyBudget: 6800,
      approvalLimit: 400,
      reviewer: 'user-1',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'partner', displayName: 'Mina' }
      ],
      basketItems: [{ productId: 'coffee', quantity: 1, addedBy: 'user-1' }],
      watchlistItems: [{ productId: 'coffee', addedBy: 'partner', targetPrice: 55 }],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    });

    const viewModel = createMobileProfileHubViewModel('user-1', api);

    assert.deepEqual(viewModel.budget, {
      weeklyBudgetLabel: '150.00 SEK',
      plannedBasketLabel: '49.90 SEK',
      remainingLabel: '100.10 SEK',
      status: 'under'
    });
    assert.deepEqual(viewModel.watchlist, { itemCount: 1, alertCount: 3 });
    assert.equal(viewModel.notifications.heldCount, 1);
    assert.equal(viewModel.household?.name, 'Shared flat');
    assert.equal(viewModel.household?.memberCount, 2);
    assert.equal(viewModel.household?.approvalLimitLabel, '400.00 SEK');
    assert.deepEqual(viewModel.privacyControls.map((control) => control.label), [
      'Raw receipt media',
      'Location precision',
      'Catalog contributions',
      'Advertiser payloads'
    ]);
  });

  it('composes a renderable mobile Profile screen with household and privacy controls', () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addBasketItem('user-1', { productId: 'coffee', quantity: 1 });
    api.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 55, alertDealScoreAt: 80, favoriteStoresOnly: true });
    api.updateBudget('user-1', { weeklyBudget: 150, monthlyBudget: 600 });
    api.upsertHouseholdPlan('user-1', {
      householdId: 'house-1',
      name: 'Shared flat',
      weeklyBudget: 6800,
      approvalLimit: 400,
      reviewer: 'user-1',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'partner', displayName: 'Mina' }
      ],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    });

    const screen = composeMobileProfileScreen('user-1', api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Profile');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['account-summary', 'household', 'privacy-controls', 'actions']);

    const account = screen.children.find((section) => section.key === 'account-summary');
    assert.equal(account?.type, 'section');
    assert.deepEqual(account?.children.map((metric) => 'value' in metric ? metric.value : null), ['150.00 SEK', '49.90 SEK', '1', '1']);

    const household = screen.children.find((section) => section.key === 'household');
    if (!household || household.type !== 'section') throw new Error('household section missing');
    assert.deepEqual(household.children.map((row) => 'value' in row ? row.value : null), [
      '2 members',
      '6800.00 SEK',
      'Alex reviews over 400.00 SEK',
      '2 favorites'
    ]);

    const privacy = screen.children.find((section) => section.key === 'privacy-controls');
    if (!privacy || privacy.type !== 'section') throw new Error('privacy section missing');
    assert.equal(privacy.children.length, 4);
    assert.equal(privacy.children[0]?.key, 'privacy:raw-receipt-media');

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Configure alerts', 'Update privacy', 'Invite member']);
  });

  it('builds mobile Household state from members, shared stores, basket, watchlist, and approval data', () => {
    const api = createGroceryViewApi();
    api.upsertHouseholdPlan('user-1', {
      householdId: 'house-1',
      name: 'Shared flat',
      weeklyBudget: 100,
      approvalLimit: 60,
      reviewer: 'partner',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'partner', displayName: 'Mina' }
      ],
      basketItems: [
        { productId: 'coffee', quantity: 1, addedBy: 'user-1' },
        { productId: 'milk', quantity: 2, addedBy: 'partner' }
      ],
      watchlistItems: [{ productId: 'coffee', addedBy: 'partner', targetPrice: 55 }],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    });

    const viewModel = createMobileHouseholdViewModel('user-1', api);

    assert.equal(viewModel.household?.name, 'Shared flat');
    assert.equal(viewModel.household?.memberCount, 2);
    assert.equal(viewModel.household?.weeklyBudgetLabel, '100.00 SEK');
    assert.equal(viewModel.household?.estimatedTotalLabel, '77.70 SEK');
    assert.equal(viewModel.household?.remainingBudgetLabel, '22.30 SEK');
    assert.equal(viewModel.household?.approvalLimitLabel, '60.00 SEK');
    assert.equal(viewModel.household?.requiresOwnerApproval, true);
    assert.equal(viewModel.household?.reviewer, 'Mina');
    assert.deepEqual(viewModel.household?.members.map((member) => `${member.displayName}:${member.itemCount}`), ['Alex:1', 'Mina:1']);
    assert.deepEqual(viewModel.household?.sharedFavoriteStores.map((store) => store.storeName), ['Lidl Sveavägen', 'Willys Odenplan']);
    assert.deepEqual(viewModel.household?.basketItems.map((item) => `${item.ticker}:${item.quantity}:${item.addedByName}`), [
      'ZOEGAS-COFFEE-450G:1:Alex',
      'ARLA-MILK-1L:2:Mina'
    ]);
    assert.deepEqual(viewModel.household?.watchlistItems.map((item) => `${item.ticker}:${item.targetPriceLabel}:${item.addedByName}`), [
      'ZOEGAS-COFFEE-450G:55.00 SEK:Mina'
    ]);
    assert.deepEqual(viewModel.actions, ['invite_household_member', 'review_household_basket', 'review_household_watchlist']);
  });

  it('composes a renderable mobile Household screen with approval, members, shared stores, basket, watchlist, and actions', () => {
    const api = createGroceryViewApi();
    api.upsertHouseholdPlan('user-1', {
      householdId: 'house-1',
      name: 'Shared flat',
      weeklyBudget: 100,
      approvalLimit: 60,
      reviewer: 'partner',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'partner', displayName: 'Mina' }
      ],
      basketItems: [
        { productId: 'coffee', quantity: 1, addedBy: 'user-1' },
        { productId: 'milk', quantity: 2, addedBy: 'partner' }
      ],
      watchlistItems: [{ productId: 'coffee', addedBy: 'partner', targetPrice: 55 }],
      sharedFavoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen']
    });

    const screen = composeMobileHouseholdScreen('user-1', api);

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Shared flat');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'approval', 'members', 'shared-stores', 'basket-items', 'watchlist-items', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['2', '100.00 SEK', '77.70 SEK', '22.30 SEK']);

    const approval = screen.children.find((section) => section.key === 'approval');
    if (!approval || approval.type !== 'section') throw new Error('approval section missing');
    assert.deepEqual(approval.children.map((row) => 'value' in row ? row.value : null), ['60.00 SEK', 'Mina', 'Review required']);

    const members = screen.children.find((section) => section.key === 'members');
    if (!members || members.type !== 'section') throw new Error('members section missing');
    assert.deepEqual(members.children.map((row) => row.key), ['member:user-1', 'member:partner']);

    const sharedStores = screen.children.find((section) => section.key === 'shared-stores');
    if (!sharedStores || sharedStores.type !== 'section') throw new Error('shared stores section missing');
    assert.deepEqual(sharedStores.children.map((row) => row.key), ['shared-store:lidl-sveavagen', 'shared-store:willys-odenplan']);

    const basket = screen.children.find((section) => section.key === 'basket-items');
    if (!basket || basket.type !== 'section') throw new Error('basket section missing');
    assert.equal('value' in basket.children[1]! ? basket.children[1]!.value : null, '2 planned by Mina');

    const watchlist = screen.children.find((section) => section.key === 'watchlist-items');
    if (!watchlist || watchlist.type !== 'section') throw new Error('watchlist section missing');
    assert.equal('value' in watchlist.children[0]! ? watchlist.children[0]!.value : null, '55.00 SEK, watched by Mina');

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Invite member', 'Review basket', 'Review watchlist']);
  });

  it('composes a Household empty state when the user has not joined a household', () => {
    const screen = composeMobileHouseholdScreen('new-user');

    assert.equal(screen.type, 'screen');
    assert.equal(screen.state, 'empty');
    assert.deepEqual(screen.children.map((child) => child.key), ['no-household', 'actions']);
    assert.equal(screen.children[0]?.type, 'empty');
    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Invite member']);
  });

  it('composes a renderable mobile product terminal screen with quote, evidence, chart, and actions', () => {
    const screen = composeMobileProductTerminalScreen('coffee');
    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Zoégas Coffee 450g');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['quote', 'evidence', 'distribution', 'chart', 'price-drop-context', 'actions']);

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

    const context = screen.children.find((section) => section.key === 'price-drop-context');
    if (!context || context.type !== 'section') throw new Error('price drop context section missing');
    assert.deepEqual(context?.children.map((row) => 'value' in row ? row.value : null), [
      'Temporary store clearance',
      'The latest drop is a one-observation 17% move without repeated campaign evidence.',
      'Buy only if the local shelf still shows the price; do not assume it will hold.'
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

  it('builds mobile Barcode Scan state from verified product matches and unknown barcodes', () => {
    const matched = createMobileBarcodeScanViewModel({ code: '7310000000000', productId: 'coffee' });
    assert.deepEqual(matched.product, {
      productId: 'coffee',
      ticker: 'ZOEGAS-COFFEE-450G',
      productName: 'Zoégas Coffee 450g',
      bestPriceLabel: '49.90 SEK',
      dealScore: 82
    });
    assert.equal(matched.verdict, 'Buy');
    assert.equal(matched.confidenceLabel, 'verified observed price');
    assert.deepEqual(matched.equivalentProducts, ['same_category_equivalents', 'private_label_swaps']);
    assert.deepEqual(matched.actions, ['add_to_weekly_basket', 'add_to_watchlist', 'compare_stores']);

    const unknown = createMobileBarcodeScanViewModel({ code: 'unknown-code' });
    assert.equal(unknown.product, null);
    assert.equal(unknown.verdict, 'Compare');
    assert.equal(unknown.confidenceLabel, 'unknown barcode');
    assert.deepEqual(unknown.actions, ['search_product', 'report_unknown_barcode']);
  });

  it('composes a renderable mobile Barcode Scan screen with product, equivalents, and actions', () => {
    const screen = composeMobileBarcodeScanScreen({ code: '7310000000000', productId: 'coffee' });

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Barcode scan');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'product', 'equivalents', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['verified observed price', 'Buy', '2']);

    const product = screen.children.find((section) => section.key === 'product');
    if (!product || product.type !== 'section') throw new Error('product section missing');
    assert.equal(product.children[0]?.key, 'product:coffee');
    assert.equal('value' in product.children[0]! ? product.children[0]!.value : null, '49.90 SEK, score 82');

    const equivalents = screen.children.find((section) => section.key === 'equivalents');
    if (!equivalents || equivalents.type !== 'section') throw new Error('equivalents section missing');
    assert.deepEqual(equivalents.children.map((row) => row.key), ['equivalent:same_category_equivalents', 'equivalent:private_label_swaps']);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Add to basket', 'Watch price', 'Compare stores']);
  });

  it('composes a Barcode Scan empty state for unknown barcodes', () => {
    const screen = composeMobileBarcodeScanScreen({ code: 'unknown-code' });

    assert.equal(screen.type, 'screen');
    assert.equal(screen.state, 'empty');
    const product = screen.children.find((section) => section.key === 'product');
    const actions = screen.children.find((section) => section.key === 'actions');
    if (!product || product.type !== 'section') throw new Error('product section missing');
    assert.deepEqual(product.children, [
      {
        type: 'empty',
        key: 'unknown-barcode',
        message: 'No verified product is linked to this barcode yet.',
        action: 'search_product'
      }
    ]);
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Search product', 'Report barcode']);
  });

  it('builds receipt scan placeholder with confidence and budget review action', () => {
    const result = buildScanResult({ mode: 'receipt', code: 'receipt-image://local' });

    assert.equal(result.product, null);
    assert.equal(result.confidenceLabel, 'medium-high after OCR review');
    assert.deepEqual(result.actions, ['extract_receipt_items', 'review_budget_impact', 'confirm_matches']);
  });

  it('composes a renderable mobile Receipt Scan screen with OCR rows, blockers, budget impact, and actions', () => {
    const review: MobileReceiptReview = {
      storeId: 'willys-odenplan',
      purchasedAt: '2026-05-19T16:00:00.000Z',
      confidenceLabel: 'medium-high',
      matchedItems: [
        { rawName: 'ZOEGA SKANEROST', productId: 'coffee', canonicalName: 'Zoegas Coffee 450g', itemTotal: 49.9, matchConfidence: 0.9, deltaVsMedian: -15 },
        { rawName: 'CHEESE 500G', productId: 'cheese', canonicalName: 'Cheese 500g', itemTotal: 78, matchConfidence: 0.7, deltaVsMedian: 18 },
        { rawName: 'SMUDGED ITEM', productId: null, canonicalName: null, itemTotal: 18, matchConfidence: 0, deltaVsMedian: 0 }
      ],
      goodBuys: [{ rawName: 'ZOEGA SKANEROST', productId: 'coffee', canonicalName: 'Zoegas Coffee 450g', itemTotal: 49.9, matchConfidence: 0.9, deltaVsMedian: -15 }],
      overspend: [{ rawName: 'CHEESE 500G', productId: 'cheese', canonicalName: 'Cheese 500g', itemTotal: 78, matchConfidence: 0.7, deltaVsMedian: 18 }],
      comparedWithLocalMedianDelta: 3,
      budget: {
        weeklyBudget: 800,
        beforeReceiptSpend: 120,
        afterReceiptSpend: 762,
        remaining: 38,
        status: 'under'
      }
    };

    const screen = composeMobileReceiptScanScreen({
      userId: 'shopper-1',
      receiptId: 'receipt-1',
      review,
      now: '2026-05-20T09:00:00.000Z',
      networkOnline: true,
      cameraPermissionReady: true
    });

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Receipt scan');
    assert.equal(screen.state, 'needs_human_review');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'receipt-lines', 'budget-impact', 'blockers', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['medium-high', '3', '2', '38.00 SEK']);

    const lines = screen.children.find((section) => section.key === 'receipt-lines');
    if (!lines || lines.type !== 'section') throw new Error('receipt lines section missing');
    assert.deepEqual(lines.children.map((row) => row.key), ['receipt-line:ZOEGA SKANEROST', 'receipt-line:CHEESE 500G', 'receipt-line:SMUDGED ITEM']);
    assert.equal('value' in lines.children[1]! ? lines.children[1]!.value : null, '78.00 SEK, 70% match, review required');

    const budget = screen.children.find((section) => section.key === 'budget-impact');
    if (!budget || budget.type !== 'section') throw new Error('budget impact section missing');
    assert.deepEqual(budget.children.map((row) => 'value' in row ? row.value : null), ['642.00 SEK', '1', '1', '3.00 SEK']);

    const blockers = screen.children.find((section) => section.key === 'blockers');
    if (!blockers || blockers.type !== 'section') throw new Error('blockers section missing');
    assert.deepEqual(blockers.children.map((row) => row.key), ['blocker:line_match_review_required']);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Review matches']);
  });

  it('composes a renderable mobile Review Queue screen with assignments, SLA status, permissions, and actions', () => {
    const assignments: MobileHumanReviewAssignment[] = [
      {
        assignmentId: 'review-1',
        kind: 'receipt_line_match',
        title: 'Match CHEESE 500G to catalog item',
        submittedBy: 'shopper-1',
        confidenceLabel: 'low',
        slaDueAt: '2026-05-20T08:00:00.000Z',
        status: 'open'
      },
      {
        assignmentId: 'review-2',
        kind: 'barcode_report',
        title: 'Verify unknown barcode report',
        submittedBy: 'shopper-2',
        confidenceLabel: 'medium',
        slaDueAt: '2026-05-21T12:00:00.000Z',
        status: 'blocked'
      }
    ];

    const screen = composeMobileHumanReviewQueueScreen({
      reviewerId: 'reviewer-1',
      canSubmitDecisions: true,
      assignments,
      now: '2026-05-20T09:00:00.000Z'
    });

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Review queue');
    assert.equal(screen.state, 'needs_human_review');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'assignments', 'sla', 'permissions', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['2', '1', '1', '1']);

    const assignmentRows = screen.children.find((section) => section.key === 'assignments');
    if (!assignmentRows || assignmentRows.type !== 'section') throw new Error('assignments section missing');
    assert.deepEqual(assignmentRows.children.map((row) => row.key), ['assignment:review-1', 'assignment:review-2']);
    assert.equal('value' in assignmentRows.children[0]! ? assignmentRows.children[0]!.value : null, 'receipt_line_match, low confidence, open');

    const sla = screen.children.find((section) => section.key === 'sla');
    if (!sla || sla.type !== 'section') throw new Error('sla section missing');
    assert.equal('value' in sla.children[0]! ? sla.children[0]!.value : null, 'Overdue since 2026-05-20T08:00:00.000Z');

    const permissions = screen.children.find((section) => section.key === 'permissions');
    if (!permissions || permissions.type !== 'section') throw new Error('permissions section missing');
    assert.deepEqual(permissions.children.map((row) => 'value' in row ? row.value : null), ['reviewer-1', 'Enabled']);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Review assignment', 'Submit decision']);
  });

  it('defines Expo route and device-build readiness for proposal-critical screens', () => {
    const plan = buildExpoReadinessPlan();

    assert.deepEqual(plan.routes.map((route) => route.path), [
      '/today',
      '/stores',
      '/watchlist',
      '/search',
      '/products/[id]/terminal',
      '/basket',
      '/budget',
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
      '/watchlist',
      '/search',
      '/products/[id]/terminal',
      '/basket',
      '/budget',
      '/scan/barcode',
      '/scan/receipt',
      '/review-queue',
      '/profile'
    ]);

    const watchlist = plan.screens.find((screen) => screen.route === '/watchlist');
    assert.equal(watchlist?.screen, 'WatchlistScreen');
    assert.match(watchlist?.dataDependencies.join(','), /watchlist_alerts/);
    assert.deepEqual(watchlist?.actions, ['open_product', 'compare_stores', 'add_to_weekly_basket']);
    assert.match(watchlist?.offlineBehavior ?? '', /cached watchlist alerts/i);

    const search = plan.screens.find((screen) => screen.route === '/search');
    assert.equal(search?.screen, 'SearchScreen');
    assert.deepEqual(search?.actions, ['open_product', 'add_to_weekly_basket', 'compare_stores', 'scan_barcode']);
    assert.match(search?.dataDependencies.join(','), /product_search/);
    assert.match(search?.offlineBehavior ?? '', /cached search results/i);

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

    const budget = plan.screens.find((screen) => screen.route === '/budget');
    assert.equal(budget?.screen, 'BudgetScreen');
    assert.deepEqual(budget?.actions, ['set_weekly_budget', 'review_category_budgets', 'review_receipts']);
    assert.match(budget?.dataDependencies.join(','), /category_budgets/);

    assert.deepEqual(plan.blockedWithoutProviders.map((screen) => screen.route), [
      '/scan/barcode',
      '/scan/receipt',
      '/profile'
    ]);
  });

  it('plans authenticated mobile privacy exports from the privacy route', () => {
    const plan = buildMobilePrivacyRequestPlan({
      userId: 'user-1',
      requestType: 'export_data',
      authenticated: true,
      networkOnline: true
    });

    assert.equal(plan.route, '/privacy');
    assert.equal(plan.confirmationRequired, false);
    assert.deepEqual(plan.exportSections, ['profile', 'favorite_stores', 'watchlist', 'receipts', 'households']);
    assert.deepEqual(plan.actions, ['download_export']);
    assert.deepEqual(plan.blockers, []);
  });

  it('blocks mobile account deletion until the user confirms the destructive action', () => {
    const plan = buildMobilePrivacyRequestPlan({
      userId: 'user-1',
      requestType: 'delete_account',
      authenticated: true,
      networkOnline: true
    });

    assert.equal(plan.confirmationRequired, true);
    assert.deepEqual(plan.blockers, ['account_deletion_confirmation_required']);
    assert.deepEqual(plan.actions, ['confirm_account_deletion']);
  });

  it('fails closed for mobile privacy requests that are offline or unauthenticated', () => {
    const plan = buildMobilePrivacyRequestPlan({
      userId: 'user-1',
      requestType: 'ad_privacy',
      authenticated: false,
      networkOnline: false
    });

    assert.deepEqual(plan.blockers, ['mobile_reauthentication_required', 'network_required_for_privacy_request']);
    assert.deepEqual(plan.actions, ['reauthenticate', 'retry_online']);
  });

  it('schedules receipt image cleanup only after privacy prerequisites pass', () => {
    const plan = buildMobilePrivacyRequestPlan({
      userId: 'user-1',
      requestType: 'receipt_retention',
      authenticated: true,
      networkOnline: true,
      receiptImageRetentionDays: 7
    });

    assert.deepEqual(plan.actions, ['schedule_receipt_image_cleanup']);
    assert.deepEqual(plan.blockers, []);
  });

  it('builds mobile Privacy state from controls and request prerequisites', () => {
    const viewModel = createMobilePrivacyViewModel({
      userId: 'user-1',
      authenticated: true,
      networkOnline: true,
      confirmedDestructiveAction: true,
      receiptImageRetentionDays: 7
    });

    assert.equal(viewModel.controlCount, 4);
    assert.equal(viewModel.blockerCount, 0);
    assert.equal(viewModel.exportSectionCount, 5);
    assert.deepEqual(viewModel.controls.map((control) => control.label), [
      'Raw receipt media',
      'Location precision',
      'Catalog contributions',
      'Advertiser payloads'
    ]);
    assert.deepEqual(viewModel.requests.map((request) => `${request.label}:${request.status}:${request.blockerCount}:${request.exportSectionCount}`), [
      'Data export:ready:0:5',
      'Delete account:ready:0:0',
      'Ad privacy:ready:0:0',
      'Receipt retention:ready:0:0'
    ]);
    assert.deepEqual(viewModel.actions, ['download_export', 'open_ad_privacy_controls', 'schedule_receipt_image_cleanup']);
  });

  it('composes a renderable mobile Privacy screen with controls, request rows, blockers, and actions', () => {
    const screen = composeMobilePrivacyScreen({
      userId: 'user-1',
      authenticated: false,
      networkOnline: false
    });

    assert.equal(screen.type, 'screen');
    assert.equal(screen.title, 'Privacy');
    assert.equal(screen.state, 'ready');
    assert.deepEqual(screen.children.map((section) => section.key), ['summary', 'controls', 'requests', 'actions']);

    const summary = screen.children.find((section) => section.key === 'summary');
    assert.equal(summary?.type, 'section');
    assert.deepEqual(summary?.children.map((metric) => 'value' in metric ? metric.value : null), ['4', '9', '5']);

    const controls = screen.children.find((section) => section.key === 'controls');
    if (!controls || controls.type !== 'section') throw new Error('controls section missing');
    assert.equal(controls.children[0]?.key, 'privacy-control:raw-receipt-media');

    const requests = screen.children.find((section) => section.key === 'requests');
    if (!requests || requests.type !== 'section') throw new Error('requests section missing');
    assert.deepEqual(requests.children.map((row) => 'value' in row ? row.value : null), [
      'blocked, 2 blockers, 5 export sections',
      'blocked, 3 blockers, 0 export sections',
      'blocked, 2 blockers, 0 export sections',
      'blocked, 2 blockers, 0 export sections'
    ]);

    const actions = screen.children.find((section) => section.key === 'actions');
    assert.equal(actions?.type, 'section');
    assert.deepEqual(actions?.children.map((action) => 'label' in action ? action.label : null), ['Reauthenticate', 'Retry online', 'Confirm deletion']);
  });

it('plans offline cache coverage and prioritized mobile sync queue', () => {
    const plan = buildMobileOfflineSyncPlan({
      userId: 'user-1',
      offlineEnabled: true,
      secureStorageConfigured: true,
      pendingMutations: [
        { id: 'mutation-1', kind: 'add_to_basket', createdAt: '2026-05-20T04:00:00.000Z' },
        { id: 'mutation-2', kind: 'save_receipt_match', createdAt: '2026-05-20T04:01:00.000Z' }
      ]
    });

    assert.deepEqual(plan.cachedScreens, ['today', 'stores', 'basket', 'scan', 'profile']);
    assert.deepEqual(
      plan.mutationQueue.map((mutation) => [mutation.kind, mutation.syncPriority]),
      [
        ['add_to_basket', 'normal'],
        ['save_receipt_match', 'high']
      ]
    );
    assert.deepEqual(plan.actions, ['cache_mobile_home', 'queue_mutations', 'sync_when_online']);
    assert.deepEqual(plan.blockers, []);
  });

  it('fails closed for mobile offline sync when secure storage is unavailable', () => {
    const plan = buildMobileOfflineSyncPlan({
      userId: 'user-1',
      offlineEnabled: true,
      secureStorageConfigured: false,
      pendingMutations: []
    });

    assert.deepEqual(plan.cachedScreens, []);
    assert.deepEqual(plan.blockers, ['secure_storage_not_configured']);
    assert.deepEqual(plan.actions, ['configure_secure_storage']);
  });

  it('prompts before caching mobile data when offline mode is disabled', () => {
    const plan = buildMobileOfflineSyncPlan({
      userId: 'user-1',
      offlineEnabled: false,
      secureStorageConfigured: true,
      pendingMutations: [{ id: 'mutation-1', kind: 'update_budget', createdAt: '2026-05-20T04:02:00.000Z' }]
    });

    assert.deepEqual(plan.cachedScreens, []);
    assert.deepEqual(plan.blockers, ['mobile_offline_mode_disabled']);
    assert.deepEqual(plan.actions, ['prompt_enable_offline', 'queue_mutations', 'sync_when_online']);
    assert.equal(plan.mutationQueue[0].syncPriority, 'high');
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
