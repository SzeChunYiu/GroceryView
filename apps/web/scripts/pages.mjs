import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const flowScript = `<script>
window.GroceryViewFlowActions = (() => {
  const formatSek = (value) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
  const formatPreciseSek = (value) => Number.isFinite(Number(value))
    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))
    : 'unknown price';
  const formatPercent = (value) => Number.isFinite(Number(value))
    ? (Number(value) > 0 ? '+' : '') + Number(value).toFixed(1) + '%'
    : 'n/a';
  const formatUnsignedPercent = (value) => Number.isFinite(Number(value))
    ? Number(value).toFixed(1) + '%'
    : 'n/a';
  const setResult = (flow, message) => {
    const target = document.querySelector('[data-flow-result="' + flow + '"]');
    if (target) target.textContent = message;
  };
  const setProductTerminalMetric = (metric, message) => {
    const target = document.querySelector('[data-product-terminal-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setMarketMoverMetric = (metric, message) => {
    const target = document.querySelector('[data-market-movers-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setCategoryMarketMetric = (metric, message) => {
    const target = document.querySelector('[data-category-market-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setMarketIndexMetric = (metric, message) => {
    const target = document.querySelector('[data-market-index-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setPriceFreshnessMetric = (metric, message) => {
    const target = document.querySelector('[data-price-freshness-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setCatalogCoverageMetric = (metric, message) => {
    const target = document.querySelector('[data-catalog-coverage-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setPriceConfidenceMetric = (metric, message) => {
    const target = document.querySelector('[data-price-confidence-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setWatchlistMetric = (metric, message) => {
    const target = document.querySelector('[data-watchlist-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setNotificationInboxMetric = (metric, message) => {
    const target = document.querySelector('[data-notification-inbox-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setDailyDealsMetric = (metric, message) => {
    const target = document.querySelector('[data-daily-deals-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setBudgetSummaryMetric = (metric, message) => {
    const target = document.querySelector('[data-budget-summary-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setBillingStatusMetric = (metric, message) => {
    const target = document.querySelector('[data-billing-status-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setMealPlansMetric = (metric, message) => {
    const target = document.querySelector('[data-meal-plans-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setNutritionValueMetric = (metric, message) => {
    const target = document.querySelector('[data-nutrition-value-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setPantryMetric = (metric, message) => {
    const target = document.querySelector('[data-pantry-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setLoyaltyOffersMetric = (metric, message) => {
    const target = document.querySelector('[data-loyalty-offers-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setAdDisclosureMetric = (metric, message) => {
    const target = document.querySelector('[data-ad-disclosure-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setReceiptReviewMetric = (metric, message) => {
    const target = document.querySelector('[data-receipt-review-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setHumanReviewMetric = (metric, message) => {
    const target = document.querySelector('[data-human-review-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setSavingsLedgerMetric = (metric, message) => {
    const target = document.querySelector('[data-savings-ledger-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setSmartSwapsMetric = (metric, message) => {
    const target = document.querySelector('[data-smart-swaps-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setStoreDealsMetric = (metric, message) => {
    const target = document.querySelector('[data-store-deals-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setStoreMapMetric = (metric, message) => {
    const target = document.querySelector('[data-store-map-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setStoreComparisonMetric = (metric, message) => {
    const target = document.querySelector('[data-store-comparison-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setRoutePlanMetric = (metric, message) => {
    const target = document.querySelector('[data-route-plan-' + metric + ']');
    if (target) target.textContent = message;
  };
  const setApiSessionResult = (message) => {
    const target = document.querySelector('[data-api-session-result]');
    if (target) target.textContent = message;
  };
  const getApiConfig = () => ({
    apiBase: localStorage.getItem('groceryview.apiBase') || '',
    userId: localStorage.getItem('groceryview.userId') || 'user-1',
    bearerToken: sessionStorage.getItem('groceryview.bearerToken') || ''
  });
  const hasApiSession = (config = getApiConfig()) => Boolean(config.apiBase && config.userId && config.bearerToken);
  const apiUrl = (path, config = getApiConfig(), appendUserId = true) => {
    const url = new URL(path, config.apiBase);
    if (appendUserId && !url.searchParams.has('userId')) url.searchParams.set('userId', config.userId);
    return url.toString();
  };
  const apiHeaders = (config) => ({
    'content-type': 'application/json',
    authorization: 'Bearer ' + config.bearerToken
  });
  const readJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return {};
    }
  };
  const requireApiSuccess = async (response) => {
    const payload = await readJson(response);
    if (!response.ok) {
      const error = payload && typeof payload.error === 'string' ? payload.error : 'HTTP ' + response.status;
      throw new Error(error);
    }
    return payload;
  };
  const requireUploadSuccess = async (response) => {
    if (!response.ok) throw new Error('Upload failed with HTTP ' + response.status);
  };
  const configureApiSessionPanel = () => {
    const panel = document.querySelector('[data-api-session-panel]');
    if (!panel) return;
    const form = panel.querySelector('form');
    const config = getApiConfig();
    const apiBase = form?.elements.namedItem('apiBase');
    const apiUserId = form?.elements.namedItem('apiUserId');
    const apiBearerToken = form?.elements.namedItem('apiBearerToken');
    if (apiBase) apiBase.value = config.apiBase;
    if (apiUserId) apiUserId.value = config.userId;
    if (apiBearerToken) apiBearerToken.value = config.bearerToken;
    setApiSessionResult(hasApiSession(config) ? 'Connected mode ready for authenticated API calls.' : 'Local preview mode. Add an API base, user id, and bearer token to save through protected routes.');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const nextApiBase = String(data.get('apiBase') || '').trim();
      const nextUserId = String(data.get('apiUserId') || '').trim() || 'user-1';
      const nextBearerToken = String(data.get('apiBearerToken') || '').trim();
      if (nextApiBase) localStorage.setItem('groceryview.apiBase', nextApiBase);
      if (nextUserId) localStorage.setItem('groceryview.userId', nextUserId);
      if (nextBearerToken) sessionStorage.setItem('groceryview.bearerToken', nextBearerToken);
      if (!nextApiBase) localStorage.removeItem('groceryview.apiBase');
      if (!nextBearerToken) sessionStorage.removeItem('groceryview.bearerToken');
      setApiSessionResult(nextApiBase && nextUserId && nextBearerToken ? 'Connected mode ready for authenticated API calls.' : 'Local preview mode. Add all session fields before API writes.');
    });
  };
  const summarizeBasket = (form) => {
    const data = new FormData(form);
    const coffee = Number(data.get('coffeeQuantity') || 0);
    const milk = Number(data.get('milkQuantity') || 0);
    const eggs = Number(data.get('eggsQuantity') || 0);
    return coffee * 49.9 + milk * 13.9 + eggs * 34.9;
  };
  const requestLoginSessionFromApi = async (form) => {
    const config = getApiConfig();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    if (!config.apiBase) {
      setResult('login', 'Demo mode: sign-in link queued for ' + (email || 'your email') + '. Add an API base URL to exchange a provider session.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/auth/session', config, false), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'magic_link',
          assertion: 'demo-magic-link:' + (email || 'unknown'),
          email
        })
      });
      const payload = await requireApiSuccess(response);
      if (payload.accessToken) sessionStorage.setItem('groceryview.bearerToken', payload.accessToken);
      if (payload.userId) localStorage.setItem('groceryview.userId', payload.userId);
      setResult('login', 'Connected API: session exchanged for ' + (payload.email || email || payload.userId || 'signed-in user') + '; bearer token stored in sessionStorage.');
      setApiSessionResult('Connected mode ready for authenticated API calls.');
    } catch (error) {
      setResult('login', 'Session exchange failed: ' + error.message + '. Provider credentials may still be unconfigured.');
    }
  };
  const saveCoffeeAlertToApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('account', 'Local preview: connect the API session bridge before saving alert rules.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/watchlist', config), {
        method: 'POST',
        headers: apiHeaders(config),
        body: JSON.stringify({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true })
      });
      const payload = await requireApiSuccess(response);
      const alertCount = Array.isArray(payload.alerts) ? payload.alerts.length : 0;
      setResult('account', 'Connected API: coffee alert saved; ' + alertCount + ' active alert signals returned.');
    } catch (error) {
      setResult('account', 'API save failed: ' + error.message + '. Local alert preview preserved.');
    }
  };
  const loadSubscriptionAccessFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('account', 'Billing portal handoff prepared locally; connect the API session bridge for live subscription access.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/account/subscription-access', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      setResult('account', 'Connected API: ' + (payload.summary || 'subscription access loaded') + ' Actions: ' + ((payload.accountActions || []).join(', ') || 'none') + '.');
    } catch (error) {
      setResult('account', 'Subscription access check failed: ' + error.message + '.');
    }
  };
  const loadBillingStatusFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('billing-status', 'Local preview mode: connect the API session bridge before loading live billing status.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/account/subscription-access', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const actions = Array.isArray(payload.accountActions) ? payload.accountActions : [];
      const adState = payload.hideAds ? 'Ads hidden for premium' : 'Ads eligible until premium is active';
      const checkoutState = payload.requiresCheckout ? 'Checkout required' : 'Checkout not required';
      setBillingStatusMetric('entitlement', (payload.summary || 'subscription access loaded') + ' · ' + checkoutState);
      setBillingStatusMetric('ads', adState + ' · tier ' + (payload.tier || 'unknown') + ' · status ' + (payload.status || 'unknown'));
      setBillingStatusMetric('actions', actions.length ? actions.join(', ') : 'No account actions returned');
      setResult('billing-status', 'Connected billing status loaded: ' + (payload.summary || 'subscription access loaded') + '; ' + actions.length + ' account actions.');
    } catch (error) {
      setResult('billing-status', 'Billing status API load failed: ' + error.message + '. Static billing status remains visible.');
    }
  };
  const checkSavedDataSyncFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('sync', 'Local preview: connect the API session bridge before checking server-backed saved data.');
      return;
    }
    const checks = [
      ['account subscription', '/api/account/subscription-access', 'GET'],
      ['household plan', '/api/households/current', 'GET'],
      ['weekly basket', '/api/basket/current', 'GET'],
      ['budget summary', '/api/budget/summary', 'GET'],
      ['privacy export', '/api/privacy/export', 'GET']
    ];
    const results = [];
    for (const [label, path, method] of checks) {
      try {
        await requireApiSuccess(await fetch(apiUrl(path, config), { method, headers: apiHeaders(config) }));
        results.push(label + ': reachable');
      } catch (error) {
        results.push(label + ': ' + error.message);
      }
    }
    setResult('sync', 'Connected API sync check: ' + results.join(' | ') + '.');
  };
  const loadPrivacyExportFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('privacy', 'Local preview: connect the API session bridge before downloading an account export.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/privacy/export', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const sectionCount = Array.isArray(payload.sections) ? payload.sections.length : 0;
      setResult('privacy', 'Connected API: privacy export generated with ' + sectionCount + ' sections at ' + (payload.generatedAt || 'current time') + '.');
    } catch (error) {
      setResult('privacy', 'Privacy export failed: ' + error.message + '. Local export preview preserved.');
    }
  };
  const loadDeletionPlanFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('privacy', 'Local preview: connect the API session bridge before planning account deletion.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/privacy/deletion-plan', config), {
        method: 'POST',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const deleteCount = Array.isArray(payload.deleteFromTables) ? payload.deleteFromTables.length : 0;
      setResult('privacy', 'Connected API: deletion plan prepared for ' + deleteCount + ' personal tables; destructive action requires re-authentication.');
    } catch (error) {
      setResult('privacy', 'Deletion plan failed: ' + error.message + '. Local plan preview preserved.');
    }
  };
  const loadPrivacyFulfillmentFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('privacy', 'Local preview: connect the API session bridge before checking privacy request deadlines.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/privacy/request-fulfillment', config), {
        method: 'POST',
        headers: apiHeaders(config),
        body: JSON.stringify({
          slaDays: 30,
          alertBeforeDays: 5,
          requests: [
            {
              id: 'privacy-export-request',
              userId: config.userId,
              type: 'data_export',
              receivedAt: '2026-04-19T12:00:00.000Z',
              status: 'in_progress'
            },
            {
              id: 'privacy-delete-request',
              userId: config.userId,
              type: 'account_deletion',
              receivedAt: '2026-04-25T12:00:00.000Z',
              status: 'received'
            },
            {
              id: 'privacy-ad-request',
              userId: config.userId,
              type: 'ad_data_opt_out',
              receivedAt: '2026-05-10T12:00:00.000Z',
              status: 'received'
            }
          ]
        })
      });
      const payload = await requireApiSuccess(response);
      const overdueCount = Array.isArray(payload.overdueRequestIds) ? payload.overdueRequestIds.length : 0;
      const dueSoonCount = Array.isArray(payload.dueSoonRequestIds) ? payload.dueSoonRequestIds.length : 0;
      setResult('privacy', 'Connected API: privacy fulfillment has ' + overdueCount + ' overdue and ' + dueSoonCount + ' due-soon requests.');
    } catch (error) {
      setResult('privacy', 'Privacy request deadline check failed: ' + error.message + '. Local deadline preview preserved.');
    }
  };
  const processScannerUploadWithApi = async (form) => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('scanner', 'Local preview: connect the API session bridge before routing scans through the server.');
      return;
    }
    const data = new FormData(form);
    const file = data.get('scanImage');
    const fileName = file && typeof file === 'object' && 'name' in file ? file.name : 'manual-scan';
    const contentType = file && typeof file === 'object' && 'type' in file && file.type ? file.type : 'image/jpeg';
    const byteLength = file && typeof file === 'object' && 'size' in file && Number.isFinite(file.size) && file.size > 0 ? file.size : 1;
    const scanId = 'scanner-preview-' + Date.now();
    try {
      const uploadTicket = await requireApiSuccess(await fetch(apiUrl('/api/scans/upload-url', config), {
        method: 'POST',
        headers: apiHeaders(config),
        body: JSON.stringify({
          scanId,
          kind: 'receipt',
          contentType,
          byteLength,
          requestedAt: new Date().toISOString()
        })
      }));
      const ticket = uploadTicket.result?.status === 'ready' ? uploadTicket.result.ticket : null;
      if (!ticket) throw new Error(uploadTicket.result?.reason || 'Scan upload storage is not configured.');
      const filePayload = file && typeof file === 'object' ? file : new Blob([]);
      await requireUploadSuccess(await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: ticket.headers || {},
        body: filePayload
      }));

      const payload = {
        scanId,
        kind: 'receipt',
        payload: ticket.payloadUri || 'private-upload://scanner-preview/' + encodeURIComponent(fileName || 'manual-scan'),
        uploadedAt: new Date().toISOString()
      };
      const response = await fetch(apiUrl('/api/scans/process', config), {
        method: 'POST',
        headers: apiHeaders(config),
        body: JSON.stringify(payload)
      });
      const result = await requireApiSuccess(response);
      const reviewCount = Array.isArray(result.reviewWorkItems) ? result.reviewWorkItems.length : 0;
      setResult('scanner', 'Connected API: uploaded scan bytes to private storage as ' + (ticket.payloadUri || payload.payload) + '; scan processed as ' + (result.result?.status || 'unknown') + ' with ' + reviewCount + ' review work items.');
    } catch (error) {
      setResult('scanner', 'Scan API processing failed: ' + error.message + '. Local preview remains staged.');
    }
  };
  const loadScannerStorageHealthFromApi = async () => {
    const config = getApiConfig();
    if (!config.apiBase) {
      setResult('scanner', 'Local preview: add an API base URL before checking private scan upload storage.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/health', config, false), {
        method: 'GET'
      });
      const payload = await requireApiSuccess(response);
      setResult('scanner', payload.hasScanUploadStorage
        ? 'Connected API: private scan upload storage is configured for receipt and barcode captures.'
        : 'Connected API: private scan upload storage is not configured; uploads will stay in local preview.');
    } catch (error) {
      setResult('scanner', 'Scan storage health check failed: ' + error.message + '. Local preview remains staged.');
    }
  };
  const saveHouseholdToApi = async (form) => {
    const config = getApiConfig();
    const data = new FormData(form);
    const approvalLimit = Number(data.get('approvalLimit') || 400);
    const reviewerName = String(data.get('reviewer') || 'Mina');
    if (!hasApiSession(config)) {
      setResult('household', 'Local preview: household approval limit updated to ' + (approvalLimit || 400) + ' SEK. Connect the API session bridge to save the household plan.');
      return;
    }
    const reviewerId = reviewerName === 'Alex' ? config.userId : 'household-' + reviewerName.toLowerCase();
    const members = [
      { userId: config.userId, displayName: 'Alex' },
      ...(reviewerId === config.userId ? [] : [{ userId: reviewerId, displayName: reviewerName }])
    ];
    try {
      const response = await fetch(apiUrl('/api/households/current', config), {
        method: 'PUT',
        headers: apiHeaders(config),
        body: JSON.stringify({
          householdId: 'web-household-preview',
          name: 'GroceryView household',
          weeklyBudget: 800,
          approvalLimit: Number.isFinite(approvalLimit) ? approvalLimit : 400,
          reviewer: reviewerId,
          members,
          basketItems: [
            { productId: 'milk', quantity: 2, addedBy: config.userId },
            { productId: 'coffee', quantity: 1, addedBy: reviewerId }
          ],
          watchlistItems: [{ productId: 'coffee', addedBy: config.userId, targetPrice: 50 }],
          sharedFavoriteStoreIds: ['lidl-sveavagen', 'willys-odenplan']
        })
      });
      const payload = await requireApiSuccess(response);
      const total = payload.summary ? payload.summary.estimatedTotal : 0;
      const approvalState = payload.approvalPolicy?.requiresOwnerApproval ? 'owner approval required' : 'no owner approval required';
      setResult('household', 'Connected API: household plan saved at ' + formatSek(total) + '; ' + approvalState + '.');
    } catch (error) {
      setResult('household', 'Household API save failed: ' + error.message + '. Local approval preview preserved.');
    }
  };
  const saveBasketToApi = async (form) => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('basket', 'Local preview: connect the API session bridge before saving basket lines.');
      return;
    }
    const data = new FormData(form);
    const quantities = [
      ['coffee', Number(data.get('coffeeQuantity') || 0)],
      ['milk', Number(data.get('milkQuantity') || 0)],
      ['eggs', Number(data.get('eggsQuantity') || 0)]
    ].filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0);
    try {
      await requireApiSuccess(await fetch(apiUrl('/api/users/' + encodeURIComponent(config.userId) + '/favorite-stores', config, false), {
        method: 'POST',
        headers: apiHeaders(config),
        body: JSON.stringify({ storeId: 'willys-odenplan' })
      }));
      for (const [productId, quantity] of quantities) {
        await requireApiSuccess(await fetch(apiUrl('/api/basket/items', config), {
          method: 'POST',
          headers: apiHeaders(config),
          body: JSON.stringify({ productId, quantity })
        }));
      }
      const comparison = await requireApiSuccess(await fetch(apiUrl('/api/basket/compare', config), {
        method: 'POST',
        headers: apiHeaders(config)
      }));
      const total = comparison && comparison.cheapestByProduct ? comparison.cheapestByProduct.total : summarizeBasket(form);
      setResult('basket', 'Connected API: basket saved and compared at ' + formatSek(total) + '.');
    } catch (error) {
      setResult('basket', 'Basket API save failed: ' + error.message + '. Local preview remains ' + formatSek(summarizeBasket(form)) + '.');
    }
  };
  const loadProductTerminalFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="product-terminal"]');
    const productId = panel?.dataset.productId || 'coffee';
    if (!config.apiBase) {
      setResult('product-terminal', 'Local preview mode: connect the API session bridge before loading live product terminal numbers.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/products/' + encodeURIComponent(productId) + '/terminal', config, false), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const quote = payload.quote || {};
      const distributions = Array.isArray(payload.distributions) ? payload.distributions : [];
      const stockholm = distributions.find((distribution) => distribution.scope === 'stockholm') || distributions[0];
      const local = distributions.find((distribution) => distribution.scope === 'local_area') || distributions[1];
      const chartSeriesCount = Array.isArray(payload.chart?.series) ? payload.chart.series.length : 0;
      const evidenceVolume = quote.evidenceVolume || {};
      const bestPrice = quote.bestPrice == null ? 'no verified price' : formatPreciseSek(quote.bestPrice);
      const bestStore = quote.bestStoreName || 'unknown store';
      const historyPointCount = Number(evidenceVolume.historyPoints || 0);
      const verifiedHistoryPointCount = Number(evidenceVolume.verifiedHistoryPoints || 0);
      const historyMessage = payload.historySummary?.isNewLow ? 'new 52-week low signal' : 'history loaded';
      const oneMonthMove = quote.oneMonthMovePercent;
      const range52Week = quote.range52Week;
      const rangeMessage = range52Week && Number.isFinite(Number(range52Week.low)) && Number.isFinite(Number(range52Week.high))
        ? formatPreciseSek(range52Week.low) + ' to ' + formatPreciseSek(range52Week.high)
        : '52W range unavailable';
      const stockholmMedianDelta = stockholm && Number.isFinite(Number(stockholm.median)) && quote.bestPrice != null
        ? formatPreciseSek(Number(stockholm.median) - Number(quote.bestPrice)) + ' vs Stockholm median'
        : 'median comparison unavailable';

      setProductTerminalMetric('quote', bestPrice + ' at ' + bestStore);
      setProductTerminalMetric('move', '1M move ' + formatPercent(oneMonthMove) + ' · ' + stockholmMedianDelta);
      setProductTerminalMetric('range', '52W range ' + rangeMessage);
      setProductTerminalMetric('evidence', verifiedHistoryPointCount + '/' + historyPointCount + ' verified history points');
      if (stockholm) {
        setProductTerminalMetric('stockholm', stockholm.label + ': median ' + formatPreciseSek(stockholm.median) + ', current percentile ' + stockholm.currentPercentile + ', sample ' + stockholm.sampleSize + '.');
      }
      if (local) {
        setProductTerminalMetric('local', local.label + ': median ' + formatPreciseSek(local.median) + ', ' + (local.customerRead || 'local distribution loaded') + '.');
      }
      setProductTerminalMetric('chart', chartSeriesCount + ' chart series · ' + historyPointCount + ' history points · ' + historyMessage + '.');
      const stockholmSummary = stockholm ? stockholm.label + ' median ' + formatPreciseSek(stockholm.median) : 'distribution unavailable';
      setResult('product-terminal', 'Connected product terminal loaded: ' + bestPrice + ' at ' + bestStore + ' · 1M move ' + formatPercent(oneMonthMove) + ' · ' + stockholmSummary + ' · ' + chartSeriesCount + ' chart series.');
    } catch (error) {
      setResult('product-terminal', 'Product terminal API load failed: ' + error.message + '. Static evidence remains visible.');
    }
  };
  const loadPriceConfidenceFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="price-confidence"]');
    const productId = panel?.dataset.productId || 'coffee';
    const asOf = panel?.dataset.asOf || new Date().toISOString();
    if (!config.apiBase) {
      setResult('price-confidence', 'Local preview mode: connect the API session bridge before loading live price confidence evidence.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/products/' + encodeURIComponent(productId) + '/terminal?asOf=' + encodeURIComponent(asOf), config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const payload = await requireApiSuccess(response);
      const quote = payload.quote || {};
      const evidenceVolume = quote.evidenceVolume || {};
      const guardrails = Array.isArray(payload.evidenceGuardrails) ? payload.evidenceGuardrails : [];
      const series = Array.isArray(payload.chart?.series) ? payload.chart.series : [];
      const styles = [...new Set(series.map((item) => item.lineStyle).filter(Boolean))];
      const bestPrice = quote.bestPrice == null ? 'no verified price' : formatPreciseSek(quote.bestPrice);
      const currentPrices = Number(evidenceVolume.currentPrices || 0);
      const historyPointCount = Number(evidenceVolume.historyPoints || 0);
      const verifiedHistoryPointCount = Number(evidenceVolume.verifiedHistoryPoints || 0);
      setPriceConfidenceMetric('quote', bestPrice + ' at ' + (quote.bestStoreName || 'unknown store') + ' · ' + (quote.band?.verdict || 'verdict pending'));
      setPriceConfidenceMetric('volume', currentPrices + ' current price rows · ' + verifiedHistoryPointCount + '/' + historyPointCount + ' verified history points');
      setPriceConfidenceMetric('guardrails', guardrails.length + ' guardrails · ' + (guardrails[0] || 'evidence rules unavailable'));
      setPriceConfidenceMetric('chart', series.length + ' confidence-styled chart series · ' + (styles.length ? styles.join(', ') : 'style unavailable'));
      setResult('price-confidence', 'Connected price confidence loaded: ' + currentPrices + ' current price rows, ' + verifiedHistoryPointCount + '/' + historyPointCount + ' verified history points, and ' + guardrails.length + ' guardrails.');
    } catch (error) {
      setResult('price-confidence', 'Price confidence API load failed: ' + error.message + '. Static confidence labels remain visible.');
    }
  };
  const loadMarketMoversFromApi = async () => {
    const config = getApiConfig();
    if (!config.apiBase) {
      setResult('market-movers', 'Local preview mode: connect the API session bridge before loading live market movers.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/market/overview', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const payload = await requireApiSuccess(response);
      const movers = Array.isArray(payload.movers) ? payload.movers : [];
      const leader = movers[0] || {};
      const range52Week = leader.range52Week;
      const rangeMessage = range52Week && Number.isFinite(Number(range52Week.low)) && Number.isFinite(Number(range52Week.high))
        ? formatPreciseSek(range52Week.low) + ' to ' + formatPreciseSek(range52Week.high) + ' · ' + formatUnsignedPercent(leader.range52WeekPositionPercent) + ' through range'
        : '52W range unavailable';
      const medianGap = Number.isFinite(Number(leader.stockholmMedianGap))
        ? formatPreciseSek(leader.stockholmMedianGap) + ' vs Stockholm median'
        : 'median gap unavailable';
      const evidence = Number(leader.verifiedHistoryPoints || 0) + '/' + Number(leader.historyPoints || 0) + ' verified history points';
      setMarketMoverMetric('leader', (leader.productName || leader.ticker || 'Top mover') + ': ' + formatPreciseSek(leader.currentPrice) + ' · 1M move ' + formatPercent(leader.oneMonthMovePercent) + ' · ' + medianGap);
      setMarketMoverMetric('range', '52W range ' + rangeMessage);
      setMarketMoverMetric('evidence', evidence);
      setResult('market-movers', 'Connected market movers loaded: ' + movers.length + ' movers from /api/market/overview; leader ' + (leader.ticker || leader.productId || 'n/a') + ' at ' + formatPreciseSek(leader.currentPrice) + '.');
    } catch (error) {
      setResult('market-movers', 'Market movers API load failed: ' + error.message + '. Static mover board remains visible.');
    }
  };
  const loadCategoryMarketFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="category-market"]');
    const categoryId = panel?.dataset.category || 'coffee';
    if (!config.apiBase) {
      setResult('category-market', 'Local preview mode: connect the API session bridge before loading live category market numbers.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/categories/' + encodeURIComponent(categoryId) + '/market', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const payload = await requireApiSuccess(response);
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      const leader = rows[0] || {};
      const range52Week = leader.range52Week;
      const rangeMessage = range52Week && Number.isFinite(Number(range52Week.low)) && Number.isFinite(Number(range52Week.high))
        ? formatPreciseSek(range52Week.low) + ' to ' + formatPreciseSek(range52Week.high) + ' · ' + formatUnsignedPercent(leader.range52WeekPositionPercent) + ' through range'
        : '52W range unavailable';
      const medianGap = Number.isFinite(Number(leader.stockholmMedianGap))
        ? formatPreciseSek(leader.stockholmMedianGap) + ' vs Stockholm median'
        : 'median gap unavailable';
      const evidence = Number(leader.verifiedHistoryPoints || 0) + '/' + Number(leader.historyPoints || 0) + ' verified history points';
      setCategoryMarketMetric('leader', (leader.productName || leader.ticker || 'Category leader') + ': ' + formatPreciseSek(leader.currentPrice) + ' · Deal Score ' + Number(leader.dealScore || 0) + ' · 1M move ' + formatPercent(leader.oneMonthMovePercent));
      setCategoryMarketMetric('range', '52W range ' + rangeMessage);
      setCategoryMarketMetric('median', medianGap);
      setCategoryMarketMetric('evidence', evidence);
      setResult('category-market', 'Connected category market loaded: ' + rows.length + ' ' + (payload.category || categoryId) + ' rows from /api/categories/' + categoryId + '/market; leader ' + (leader.ticker || leader.productId || 'n/a') + '.');
    } catch (error) {
      setResult('category-market', 'Category market API load failed: ' + error.message + '. Static category board remains visible.');
    }
  };
  const loadMarketIndicesFromApi = async () => {
    const config = getApiConfig();
    if (!config.apiBase) {
      setResult('market-indices', 'Local preview mode: add an API base URL before loading live grocery indices.');
      return;
    }
    try {
      const payload = await requireApiSuccess(await fetch(apiUrl('/api/indices', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      }));
      const indices = Array.isArray(payload) ? payload : [];
      const primary = indices[0] || {};
      const components = Array.isArray(primary.components) ? primary.components : [];
      setMarketIndexMetric('value', primary.label ? primary.label + ' ' + (primary.value ?? 'n/a') : 'No index returned');
      setMarketIndexMetric('movement', (primary.movementPercent ?? 'n/a') + '% from ' + (primary.baseDate || 'base date'));
      setMarketIndexMetric('confidence', (primary.confidence || 'unknown') + ' confidence · ' + components.length + ' components');
      setResult('market-indices', 'Connected grocery indices loaded: ' + indices.length + ' index reports from /api/indices.');
    } catch (error) {
      setResult('market-indices', 'Grocery indices API load failed: ' + error.message + '. Static index copy remains visible.');
    }
  };
  const loadPriceFreshnessFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="price-freshness"]');
    const asOf = panel?.dataset.asOf || new Date().toISOString();
    if (!config.apiBase) {
      setResult('price-freshness', 'Local preview mode: connect the API session bridge before loading live price freshness.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/prices/freshness?asOf=' + encodeURIComponent(asOf), config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const payload = await requireApiSuccess(response);
      const summary = payload.summary || {};
      const products = Array.isArray(payload.products) ? payload.products : [];
      const backfillIds = Array.isArray(payload.backfillProductIds) ? payload.backfillProductIds : [];
      const staleProducts = products.filter((product) => product.status === 'stale').map((product) => product.productName || product.productId);
      setPriceFreshnessMetric('summary', 'Fresh ' + Number(summary.fresh || 0) + ' · aging ' + Number(summary.aging || 0) + ' · stale ' + Number(summary.stale || 0));
      setPriceFreshnessMetric('backfill', backfillIds.length ? backfillIds.join(', ') : 'No backfill needed');
      setPriceFreshnessMetric('thresholds', 'Aging after ' + Number(payload.thresholds?.agingAfterDays || 0) + 'd · stale after ' + Number(payload.thresholds?.staleAfterDays || 0) + 'd');
      setPriceFreshnessMetric('stale', staleProducts.length ? staleProducts.join(', ') : 'No stale products');
      setResult('price-freshness', 'Connected price freshness loaded: ' + products.length + ' products as of ' + (payload.asOf || asOf) + '; ' + backfillIds.length + ' backfill actions.');
    } catch (error) {
      setResult('price-freshness', 'Price freshness API load failed: ' + error.message + '. Static retailer freshness board remains visible.');
    }
  };
  const loadCatalogCoverageFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="catalog-coverage"]');
    const asOf = panel?.dataset.asOf || new Date().toISOString();
    if (!config.apiBase) {
      setResult('catalog-coverage', 'Local preview mode: connect the API session bridge before loading live catalog coverage.');
      return;
    }
    try {
      const headers = config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' };
      const [freshness, stores, market] = await Promise.all([
        requireApiSuccess(await fetch(apiUrl('/api/prices/freshness?asOf=' + encodeURIComponent(asOf), config, false), {
          method: 'GET',
          headers
        })),
        requireApiSuccess(await fetch(apiUrl('/api/stores', config, false), {
          method: 'GET',
          headers
        })),
        requireApiSuccess(await fetch(apiUrl('/api/market/overview', config, false), {
          method: 'GET',
          headers
        }))
      ]);
      const products = Array.isArray(freshness.products) ? freshness.products : [];
      const storeRows = Array.isArray(stores) ? stores : [];
      const topDeals = Array.isArray(market.topDeals) ? market.topDeals : [];
      const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
      const chains = [...new Set(storeRows.map((store) => store.chain).filter(Boolean))];
      const districts = [...new Set(storeRows.map((store) => store.district).filter(Boolean))];
      const backfillIds = Array.isArray(freshness.backfillProductIds) ? freshness.backfillProductIds : [];
      const summary = freshness.summary || {};
      const buyReadyDeals = topDeals.filter((deal) => deal.band?.verdict === 'Buy');
      setCatalogCoverageMetric('products', products.length + ' products · ' + categories.length + ' categories · ' + topDeals.length + ' market rows');
      setCatalogCoverageMetric('freshness', 'Fresh ' + Number(summary.fresh || 0) + ' · aging ' + Number(summary.aging || 0) + ' · stale ' + Number(summary.stale || 0));
      setCatalogCoverageMetric('stores', storeRows.length + ' stores · ' + chains.length + ' chains · ' + districts.length + ' districts');
      setCatalogCoverageMetric('backfill', backfillIds.length ? backfillIds.join(', ') : 'No backfill actions · ' + buyReadyDeals.length + ' buy-ready deal rows');
      setResult('catalog-coverage', 'Connected catalog coverage loaded: ' + products.length + ' products, ' + storeRows.length + ' stores, ' + backfillIds.length + ' backfill actions.');
    } catch (error) {
      setResult('catalog-coverage', 'Catalog coverage API load failed: ' + error.message + '. Static coverage board remains visible.');
    }
  };
  const formatWatchlistTriggerValue = (metric, value) => {
    if (!Number.isFinite(Number(value))) return 'n/a';
    if (metric === 'price') return formatPreciseSek(value);
    if (metric === 'deal_score') return Math.round(Number(value)).toString();
    return Number(value).toFixed(1);
  };
  const loadWatchlistFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('watchlist', 'Local preview mode: connect the API session bridge before loading live watchlist alerts.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/watchlist', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const items = Array.isArray(payload.items) ? payload.items : [];
      const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];
      const targetItems = items.filter((item) => Number.isFinite(Number(item.targetPrice)));
      const scopedItems = items.filter((item) => item.favoriteStoresOnly);
      const lowAlerts = alerts.filter((alert) => alert.type === 'new_52w_low');
      const firstAlert = alerts[0] || {};
      const trigger = firstAlert.trigger || {};
      const triggerMetric = trigger.metric || firstAlert.type || 'alert';
      const triggerValue = formatWatchlistTriggerValue(trigger.metric, trigger.value);
      const triggerThreshold = formatWatchlistTriggerValue(trigger.metric, trigger.threshold);
      setWatchlistMetric('summary', items.length + ' tracked · ' + alerts.length + ' active alerts');
      setWatchlistMetric('target', targetItems.length ? targetItems.map((item) => item.productId + ' ≤ ' + formatPreciseSek(item.targetPrice)).join(' · ') : 'No target prices set');
      setWatchlistMetric('trigger', alerts.length ? triggerMetric + ' ' + triggerValue + ' vs threshold ' + triggerThreshold : 'No active trigger from current prices');
      setWatchlistMetric('scope', scopedItems.length + '/' + items.length + ' favorite-store scoped · ' + lowAlerts.length + ' 52-week-low alerts');
      setResult('watchlist', 'Connected watchlist loaded: ' + items.length + ' tracked items and ' + alerts.length + ' active alerts. ' + (firstAlert.message || 'No current alert messages.'));
    } catch (error) {
      setResult('watchlist', 'Watchlist API load failed: ' + error.message + '. Static watchlist board remains visible.');
    }
  };
  const loadNotificationInboxFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('notification-inbox', 'Local preview mode: connect the API session bridge before loading live notification inbox.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/notifications/inbox', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const queue = Array.isArray(payload.queue) ? payload.queue : [];
      const delivered = Number(payload.deliveredCount || 0);
      const held = Number(payload.heldCount || 0);
      const suppressed = Number(payload.suppressedCount || 0);
      const firstHeld = queue.find((item) => item.status === 'held') || {};
      const firstSuppressed = queue.find((item) => item.status === 'suppressed') || {};
      const guardrails = Array.isArray(payload.guardrails) ? payload.guardrails : [];
      setNotificationInboxMetric('alerts', Number(payload.activeAlertCount || 0) + ' active alerts · ' + Number(payload.trackedItemCount || 0) + ' tracked items');
      setNotificationInboxMetric('delivery', delivered + ' delivered · ' + held + ' held · ' + suppressed + ' suppressed');
      setNotificationInboxMetric('guardrails', (firstHeld.reason || 'No held alerts') + ' · ' + (firstSuppressed.reason || 'No suppressions') + ' · ' + guardrails.length + ' guardrails');
      setResult('notification-inbox', 'Connected notification inbox loaded: ' + delivered + ' delivered, ' + held + ' held, ' + suppressed + ' suppressed from ' + queue.length + ' queue rows.');
    } catch (error) {
      setResult('notification-inbox', 'Notification inbox API load failed: ' + error.message + '. Static notification inbox remains visible.');
    }
  };
  const notificationMetricValue = (metricsText, status) => {
    const match = metricsText.match(new RegExp('groceryview_notification_worker_events_total\\\\{[^}]*status="' + status + '"[^}]*\\\\}\\\\s+([0-9.]+)'));
    return match ? Number(match[1]) : 0;
  };
  const loadNotificationMetricsFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="notification-inbox"]');
    const metricsToken = String(panel?.querySelector('[name="metricsToken"]')?.value || '').trim();
    if (!config.apiBase) {
      setResult('notification-inbox', 'Local preview mode: add an API base before loading notification operations metrics.');
      return;
    }
    if (!metricsToken) {
      setResult('notification-inbox', 'Metrics token required before loading notification operations metrics.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/metrics/notifications', config, false), {
        method: 'GET',
        headers: { 'x-groceryview-metrics-token': metricsToken }
      });
      const metricsText = await response.text();
      if (!response.ok) throw new Error(metricsText || 'HTTP ' + response.status);
      const delivered = notificationMetricValue(metricsText, 'delivered');
      const failed = notificationMetricValue(metricsText, 'failed');
      const deadLetter = notificationMetricValue(metricsText, 'dead_letter');
      const suppressed = notificationMetricValue(metricsText, 'suppressed');
      setNotificationInboxMetric('ops', delivered + ' delivered · ' + failed + ' failed · ' + deadLetter + ' dead-lettered · ' + suppressed + ' suppressed');
      setResult('notification-inbox', 'Connected notification metrics loaded: ' + delivered + ' delivered, ' + failed + ' failed, ' + deadLetter + ' dead-lettered, ' + suppressed + ' suppressed.');
    } catch (error) {
      setResult('notification-inbox', 'Notification metrics load failed: ' + error.message + '. Static notification inbox remains visible.');
    }
  };
  const loadDailyDealsFromApi = async () => {
    const config = getApiConfig();
    if (!config.apiBase) {
      setResult('daily-deals', 'Local preview mode: connect the API session bridge before loading live daily deals.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/market/overview', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const payload = await requireApiSuccess(response);
      const topDeals = Array.isArray(payload.topDeals) ? payload.topDeals : [];
      const leader = topDeals[0] || {};
      const buyDeals = topDeals.filter((deal) => deal.band?.verdict === 'Buy');
      const compareDeals = topDeals.filter((deal) => deal.band?.verdict === 'Compare');
      setDailyDealsMetric('leader', (leader.ticker || leader.productId || 'Top deal') + ' · Deal Score ' + Number(leader.dealScore || 0) + ' · ' + (leader.band?.verdict || 'no verdict'));
      setDailyDealsMetric('price', formatPreciseSek(leader.bestPrice) + ' at ' + (leader.bestStoreId || 'unknown store'));
      setDailyDealsMetric('count', topDeals.length + ' ranked deals · ' + buyDeals.length + ' buy · ' + compareDeals.length + ' compare');
      setResult('daily-deals', 'Connected daily deals loaded: ' + topDeals.length + ' top deals from /api/market/overview; leader ' + (leader.ticker || leader.productId || 'n/a') + '.');
    } catch (error) {
      setResult('daily-deals', 'Daily deals API load failed: ' + error.message + '. Static deal board remains visible.');
    }
  };
  const loadBudgetSummaryFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('budget-summary', 'Local preview mode: connect the API session bridge before loading live budget summary.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/budget/summary', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      setBudgetSummaryMetric('weekly', 'Weekly ' + formatSek(payload.weeklyBudget) + ' · remaining actual ' + formatSek(payload.weeklyRemainingActual) + ' · ' + (payload.weeklyStatus || 'unknown'));
      setBudgetSummaryMetric('monthly', 'Monthly ' + formatSek(payload.monthlyBudget) + ' · remaining actual ' + formatSek(payload.monthlyRemainingActual) + ' · ' + (payload.monthlyStatus || 'unknown'));
      setBudgetSummaryMetric('estimate', 'Next basket ' + formatSek(payload.estimatedBasketTotal) + ' · after-estimate buffer ' + formatSek(payload.weeklyRemainingAfterEstimate));
      setResult('budget-summary', 'Connected budget summary loaded: weekly ' + (payload.weeklyStatus || 'unknown') + ', monthly ' + (payload.monthlyStatus || 'unknown') + ', next basket ' + formatSek(payload.estimatedBasketTotal) + '.');
    } catch (error) {
      setResult('budget-summary', 'Budget summary API load failed: ' + error.message + '. Static budget forecast remains visible.');
    }
  };
  const loadMealPlansFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('meal-plans', 'Local preview mode: connect the API session bridge and save a basket before loading live meal plan budget.');
      return;
    }
    try {
      const [budget, comparison, market] = await Promise.all([
        requireApiSuccess(await fetch(apiUrl('/api/budget/summary', config), {
          method: 'GET',
          headers: apiHeaders(config)
        })),
        requireApiSuccess(await fetch(apiUrl('/api/basket/compare', config), {
          method: 'POST',
          headers: apiHeaders(config)
        })),
        requireApiSuccess(await fetch(apiUrl('/api/market/overview', config, false), {
          method: 'GET',
          headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
        }))
      ]);
      const cheapest = comparison.cheapestByProduct || {};
      const assignments = Array.isArray(cheapest.assignments) ? cheapest.assignments : [];
      const missing = Array.isArray(comparison.missingProductIds) ? comparison.missingProductIds : [];
      const splitSavings = Number(comparison.savingsVsBestSingleStore || 0);
      const topDeals = Array.isArray(market.topDeals) ? market.topDeals : [];
      const mealDealIds = new Set(['coffee', 'milk', 'eggs']);
      const mealDeals = topDeals.filter((deal) => mealDealIds.has(deal.productId));
      const bestMealDeal = mealDeals[0] || topDeals[0] || {};
      setMealPlansMetric('budget', 'Weekly buffer after planned basket ' + formatSek(budget.weeklyRemainingAfterEstimate) + ' · next basket ' + formatSek(budget.estimatedBasketTotal) + ' · ' + (budget.weeklyStatus || 'unknown'));
      setMealPlansMetric('basket', assignments.length + ' verified ingredient lines · split stores ' + Number(comparison.splitStoreCount || 0) + ' · saves ' + formatSek(Math.max(0, splitSavings)) + ' · missing ' + missing.length);
      setMealPlansMetric('deals', mealDeals.length + ' meal-relevant deals · leader ' + (bestMealDeal.ticker || bestMealDeal.productId || 'n/a') + ' at ' + formatPreciseSek(bestMealDeal.bestPrice));
      setResult('meal-plans', 'Connected meal plan budget loaded: weekly buffer ' + formatSek(budget.weeklyRemainingAfterEstimate) + ', ' + assignments.length + ' verified ingredient lines, ' + mealDeals.length + ' meal-relevant deals.');
    } catch (error) {
      setResult('meal-plans', 'Meal plan API load failed: ' + error.message + '. Static meal plan remains visible.');
    }
  };
  const loadNutritionValueFromApi = async () => {
    const config = getApiConfig();
    if (!config.apiBase) {
      setResult('nutrition-value', 'Local preview mode: add an API base URL before loading live nutrition value rankings.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/nutrition/value?metric=protein', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const payload = await requireApiSuccess(response);
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      const leader = payload.leader || rows[0] || {};
      const warningRows = rows.filter((row) => row.saltWarning || Number(row.sugarPerPackage || 0) > 12);
      const ranking = rows.slice(0, 3).map((row) => row.name + ' ' + Number(row.valuePer10Sek || 0).toFixed(2) + 'g/10 SEK').join(' · ');
      setNutritionValueMetric('leader', leader.name ? leader.name + ' · ' + Number(leader.valuePer10Sek || 0).toFixed(2) + 'g protein/10 SEK' : 'No nutrition value leader returned');
      setNutritionValueMetric('ranking', ranking || 'No protein value rows returned');
      setNutritionValueMetric('warnings', warningRows.length + ' salt/sugar warnings · ' + (Array.isArray(payload.guardrails) ? payload.guardrails.length : 0) + ' guardrails');
      setResult('nutrition-value', 'Connected nutrition value loaded: ' + rows.length + ' protein-value rows; leader ' + (leader.name || 'n/a') + '.');
    } catch (error) {
      setResult('nutrition-value', 'Nutrition value API load failed: ' + error.message + '. Static nutrition review remains visible.');
    }
  };
  const loadPantryFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('pantry', 'Local preview mode: connect the API session bridge before loading live pantry replenishment.');
      return;
    }
    try {
      const asOf = new Date().toISOString();
      const response = await fetch(apiUrl('/api/pantry/replenishment?asOf=' + encodeURIComponent(asOf), config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const statuses = Array.isArray(payload.statuses) ? payload.statuses : [];
      const replenishment = Array.isArray(payload.replenishment) ? payload.replenishment : [];
      const expiringSoon = Array.isArray(payload.expiringSoonProductIds) ? payload.expiringSoonProductIds : [];
      const lowOrExpired = statuses.filter((item) => item.status === 'low_stock' || item.status === 'expired');
      const duplicateBlocks = replenishment.filter((item) => item.alreadyInBasket);
      const dealBacked = replenishment.filter((item) => item.bestDeal);
      const firstRestock = replenishment[0] || {};
      setPantryMetric('summary', statuses.length + ' pantry rows · ' + lowOrExpired.length + ' low/expired · ' + expiringSoon.length + ' expiring soon');
      setPantryMetric('restock', replenishment.length ? (firstRestock.name || firstRestock.productId || 'Restock') + ' x' + Number(firstRestock.quantityToBuy || 0) + ' ' + (firstRestock.unit || '') + ' · ' + (firstRestock.priority || 'unknown') + ' priority' : 'No live restock rows returned');
      setPantryMetric('expiry', expiringSoon.length ? expiringSoon.join(', ') + ' expiring soon · ' + duplicateBlocks.length + ' already in basket · ' + dealBacked.length + ' deal-backed restocks' : 'No expiring rows · ' + duplicateBlocks.length + ' already in basket · ' + dealBacked.length + ' deal-backed restocks');
      setResult('pantry', 'Connected pantry replenishment loaded: ' + statuses.length + ' inventory rows, ' + replenishment.length + ' restock actions, ' + expiringSoon.length + ' expiring soon.');
    } catch (error) {
      setResult('pantry', 'Pantry API load failed: ' + error.message + '. Static pantry inventory remains visible.');
    }
  };
  const loadLoyaltyOffersFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('loyalty-offers', 'Local preview mode: connect the API session bridge before loading live loyalty offers.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/loyalty/offers', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const offers = Array.isArray(payload.offers) ? payload.offers : [];
      const actionOffers = offers.filter((offer) => offer.actionRequired);
      const eligibleOffers = offers.filter((offer) => offer.status === 'eligible');
      const topOffer = offers[0] || {};
      setLoyaltyOffersMetric('savings', formatSek(payload.totalEligibleSavings || 0) + ' eligible savings · ' + eligibleOffers.length + '/' + offers.length + ' offers ready');
      setLoyaltyOffersMetric('actions', actionOffers.length + ' action-required offers · top ' + (topOffer.productName || topOffer.productId || 'n/a') + ' saves ' + formatSek(topOffer.savings || 0));
      setLoyaltyOffersMetric('guardrails', Number(payload.membershipRequiredCount || 0) + ' membership confirmations · ' + (Array.isArray(payload.guardrails) ? payload.guardrails.length : 0) + ' loyalty guardrails');
      setResult('loyalty-offers', 'Connected loyalty offers loaded: ' + offers.length + ' offers, ' + formatSek(payload.totalEligibleSavings || 0) + ' eligible savings, ' + actionOffers.length + ' actions required.');
    } catch (error) {
      setResult('loyalty-offers', 'Loyalty offers API load failed: ' + error.message + '. Static loyalty offer queue remains visible.');
    }
  };
  const loadAdDisclosureFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('ad-disclosure', 'Local preview mode: connect the API session bridge before loading live ad disclosure.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/ads/disclosure', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const slots = Array.isArray(payload.placementPlan?.slots) ? payload.placementPlan.slots : [];
      const blocked = Array.isArray(payload.compliance?.blocked) ? payload.compliance.blocked : [];
      const excluded = Array.isArray(payload.excludedSurfaces) ? payload.excludedSurfaces : [];
      const slotLabels = slots.map((slot) => slot.surface + ' ' + slot.label).join(' · ');
      const firstBlocked = blocked[0];
      const firstReason = Array.isArray(firstBlocked?.reasons) ? firstBlocked.reasons[0] : null;
      setAdDisclosureMetric('slots', slots.length + ' labeled slots · ' + (slotLabels || 'ads removed or no providers configured'));
      setAdDisclosureMetric('blocked', Number(payload.blockedCount || blocked.length) + ' blocked attempts · ' + (firstReason || 'no policy violations'));
      setAdDisclosureMetric('premium', (payload.premiumAdsRemoved ? 'Premium ads removed' : 'Free tier ads eligible') + ' · tier ' + (payload.userTier || 'unknown') + ' · excluded ' + excluded.length);
      setResult('ad-disclosure', 'Connected ad disclosure loaded: ' + slots.length + ' labeled slots, ' + Number(payload.blockedCount || blocked.length) + ' blocked unsafe placements, Deal Score influence ' + (payload.affectsDealScore ? 'detected' : 'zero') + '.');
    } catch (error) {
      setResult('ad-disclosure', 'Ad disclosure API load failed: ' + error.message + '. Static ad disclosure remains visible.');
    }
  };
  const loadReceiptReviewFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('receipt-review', 'Local preview mode: connect the API session bridge before loading live receipt review.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/receipts/review', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const review = payload.review || {};
      const budget = review.budget || {};
      const items = Array.isArray(review.matchedItems) ? review.matchedItems : [];
      const goodBuys = Array.isArray(review.goodBuys) ? review.goodBuys : [];
      const overspend = Array.isArray(review.overspend) ? review.overspend : [];
      const guardrails = Array.isArray(payload.guardrails) ? payload.guardrails : [];
      const lineCount = Number(payload.lineCount || items.length);
      const matchedCount = Number(payload.matchedCount || items.filter((item) => item.productId).length);
      const needsReviewCount = Number(payload.needsReviewCount || items.filter((item) => !item.productId || Number(item.matchConfidence || 0) < 0.8).length);
      setReceiptReviewMetric('budget', 'After receipt ' + formatSek(budget.afterReceiptSpend) + ' · remaining ' + formatSek(budget.remaining) + ' · ' + (budget.status || 'unknown'));
      setReceiptReviewMetric('lines', matchedCount + '/' + lineCount + ' matched · ' + needsReviewCount + ' needs review · confidence ' + (review.confidenceLabel || 'unknown'));
      setReceiptReviewMetric('guardrails', goodBuys.length + ' good buys · ' + overspend.length + ' overspend rows · ' + guardrails.length + ' guardrails');
      setResult('receipt-review', 'Connected receipt review loaded: ' + matchedCount + '/' + lineCount + ' lines matched, budget remaining ' + formatSek(budget.remaining) + ', local median delta ' + formatSek(review.comparedWithLocalMedianDelta) + '.');
    } catch (error) {
      setResult('receipt-review', 'Receipt review API load failed: ' + error.message + '. Static receipt review remains visible.');
    }
  };
  const loadHumanReviewFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('human-review', 'Local preview mode: connect the API session bridge before loading live human review queue.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/human-review/assignments', config), {
        method: 'GET',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const assignments = Array.isArray(payload.assignments) ? payload.assignments : [];
      const sla = payload.sla || {};
      const highPriority = assignments.filter((assignment) => assignment.priority === 'high');
      const inProgress = assignments.filter((assignment) => assignment.status === 'in_progress');
      setHumanReviewMetric('assignments', assignments.length + ' open assignments · ' + inProgress.length + ' in progress');
      setHumanReviewMetric('sla', (sla.status || 'unknown SLA') + ' · overdue ' + Number(sla.overdueCount || 0) + ' · due soon ' + Number(sla.dueSoonCount || 0));
      setHumanReviewMetric('priority', highPriority.length + ' high-priority rows · ' + (assignments[0]?.reviewId || 'no live assignment id'));
      setResult('human-review', 'Connected human review queue loaded: ' + assignments.length + ' assignments, SLA ' + (sla.status || 'unknown') + ', ' + highPriority.length + ' high-priority rows.');
    } catch (error) {
      setResult('human-review', 'Human review API load failed: ' + error.message + '. Static moderator queue remains visible.');
    }
  };
  const loadSavingsLedgerFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('savings-ledger', 'Local preview mode: connect the API session bridge and save a basket before loading live savings ledger.');
      return;
    }
    try {
      const [budget, comparison] = await Promise.all([
        requireApiSuccess(await fetch(apiUrl('/api/budget/summary', config), {
          method: 'GET',
          headers: apiHeaders(config)
        })),
        requireApiSuccess(await fetch(apiUrl('/api/basket/compare', config), {
          method: 'POST',
          headers: apiHeaders(config)
        }))
      ]);
      const cheapest = comparison.cheapestByProduct || {};
      const assignments = Array.isArray(cheapest.assignments) ? cheapest.assignments : [];
      const missing = Array.isArray(comparison.missingProductIds) ? comparison.missingProductIds : [];
      const splitSavings = Number(comparison.savingsVsBestSingleStore || 0);
      const forecastSavings = Math.max(0, splitSavings);
      const forecastStatus = missing.length ? 'blocked by missing products' : 'eligible forecast';
      setSavingsLedgerMetric('confirmed', 'Weekly actual remaining ' + formatSek(budget.weeklyRemainingActual) + ' · monthly actual remaining ' + formatSek(budget.monthlyRemainingActual));
      setSavingsLedgerMetric('forecast', 'Forecast savings ' + formatSek(forecastSavings) + ' · next basket ' + formatSek(budget.estimatedBasketTotal) + ' · ' + forecastStatus);
      setSavingsLedgerMetric('blockers', missing.length + ' missing products · ' + assignments.length + ' verified assignment lines · split stores ' + Number(comparison.splitStoreCount || 0));
      setResult('savings-ledger', 'Connected savings ledger loaded: forecast savings ' + formatSek(forecastSavings) + ', next basket ' + formatSek(budget.estimatedBasketTotal) + ', ' + missing.length + ' blockers.');
    } catch (error) {
      setResult('savings-ledger', 'Savings ledger API load failed: ' + error.message + '. Static ledger remains visible.');
    }
  };
  const loadSmartSwapsFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="smart-swaps"]');
    const productId = panel?.dataset.productId || 'milk';
    if (!config.apiBase) {
      setResult('smart-swaps', 'Local preview mode: connect the API session bridge before loading live swap candidates.');
      return;
    }
    try {
      const [equivalents, terminal] = await Promise.all([
        requireApiSuccess(await fetch(apiUrl('/api/products/' + encodeURIComponent(productId) + '/equivalents', config, false), {
          method: 'GET',
          headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
        })),
        requireApiSuccess(await fetch(apiUrl('/api/products/' + encodeURIComponent(productId) + '/terminal', config, false), {
          method: 'GET',
          headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
        }))
      ]);
      const candidates = Array.isArray(equivalents) ? equivalents : [];
      const best = candidates[0] || {};
      const currentPrice = Number(terminal.quote?.bestPrice);
      const bestPrice = Number(best.bestPrice);
      const savings = Number.isFinite(currentPrice) && Number.isFinite(bestPrice)
        ? Math.max(0, currentPrice - bestPrice)
        : null;
      setSmartSwapsMetric('best', best.productName ? best.productName + ' · ' + formatPreciseSek(best.bestPrice) + ' at ' + (best.bestStoreId || 'unknown store') : 'No live swap candidates returned');
      setSmartSwapsMetric('count', candidates.length + ' comparable products for ' + productId);
      setSmartSwapsMetric('confidence', best.productName ? 'Deal Score ' + Number(best.dealScore || 0) + (savings == null ? ' · savings unavailable' : ' · saves ' + formatPreciseSek(savings) + ' vs current best') : 'No confidence evidence returned');
      setSmartSwapsMetric('reason', best.reason || 'Live equivalent-product reason unavailable');
      setResult('smart-swaps', 'Connected smart swaps loaded: ' + candidates.length + ' comparable products for ' + productId + '; best ' + (best.productName || 'n/a') + '.');
    } catch (error) {
      setResult('smart-swaps', 'Smart swaps API load failed: ' + error.message + '. Static swap candidates remain visible.');
    }
  };
  const loadStoreDealsFromApi = async (button) => {
    const config = getApiConfig();
    const panel = button.closest('[data-groceryview-flow="store-deals"]');
    const storeId = panel?.dataset.storeId || 'willys-odenplan';
    if (!config.apiBase) {
      setResult('store-deals', 'Local preview mode: connect the API session bridge before loading live store deals.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/stores/' + encodeURIComponent(storeId) + '/deals', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const deals = await requireApiSuccess(response);
      const rows = Array.isArray(deals) ? deals : [];
      const leader = rows[0] || {};
      const categories = [...new Set(rows.map((deal) => deal.category).filter(Boolean))];
      const buyDeals = rows.filter((deal) => deal.band?.verdict === 'Buy');
      const compareDeals = rows.filter((deal) => deal.band?.verdict === 'Compare');
      setStoreDealsMetric('leader', (leader.ticker || leader.productName || 'Top store deal') + ' · ' + formatPreciseSek(leader.price) + ' · Deal Score ' + Number(leader.dealScore || 0));
      setStoreDealsMetric('count', rows.length + ' store deals · ' + (categories.length ? categories.join(', ') : 'no categories'));
      setStoreDealsMetric('verdict', (leader.band?.verdict || 'no verdict') + ' leader · ' + buyDeals.length + ' buy · ' + compareDeals.length + ' compare');
      setResult('store-deals', 'Connected store deals loaded: ' + rows.length + ' deals from /api/stores/' + storeId + '/deals; leader ' + (leader.ticker || leader.productId || 'n/a') + '.');
    } catch (error) {
      setResult('store-deals', 'Store deals API load failed: ' + error.message + '. Static store highlights remain visible.');
    }
  };
  const loadStoreMapFromApi = async () => {
    const config = getApiConfig();
    if (!config.apiBase) {
      setResult('store-map', 'Local preview mode: connect the API session bridge before loading live store map.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/stores', config, false), {
        method: 'GET',
        headers: config.bearerToken ? apiHeaders(config) : { 'content-type': 'application/json' }
      });
      const stores = await requireApiSuccess(response);
      const rows = Array.isArray(stores) ? stores : [];
      const districts = [...new Set(rows.map((store) => store.district).filter(Boolean))];
      const chains = [...new Set(rows.map((store) => store.chain).filter(Boolean))];
      const highConfidence = rows.filter((store) => store.confidence === 'high');
      setStoreMapMetric('count', rows.length + ' mapped stores · ' + (chains.length ? chains.join(', ') : 'no chains'));
      setStoreMapMetric('districts', districts.length + ' districts · ' + (districts.length ? districts.join(', ') : 'none reported'));
      setStoreMapMetric('confidence', highConfidence.length + '/' + rows.length + ' high-confidence store profiles');
      setResult('store-map', 'Connected store map loaded: ' + rows.length + ' stores across ' + districts.length + ' districts from /api/stores.');
    } catch (error) {
      setResult('store-map', 'Store map API load failed: ' + error.message + '. Static store map remains visible.');
    }
  };
  const loadStoreComparisonFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('store-comparison', 'Local preview mode: connect the API session bridge and save a basket before loading live store comparison.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/basket/compare', config), {
        method: 'POST',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const cheapest = payload.cheapestByProduct || {};
      const options = Array.isArray(payload.singleStoreOptions) ? payload.singleStoreOptions : [];
      const best = payload.bestSingleStore || options[0] || {};
      const missing = Array.isArray(payload.missingProductIds) ? payload.missingProductIds : [];
      const splitCount = Number(payload.splitStoreCount || 0);
      const splitTotal = Number(cheapest.total || 0);
      const savings = Number(payload.savingsVsBestSingleStore || 0);
      setStoreComparisonMetric('best', best.storeName ? best.storeName + ' · ' + formatSek(Number(best.total || 0)) + ' · ' + Number(best.itemCount || 0) + ' items' : 'No full-coverage single store yet');
      setStoreComparisonMetric('split', 'Split basket ' + formatSek(splitTotal) + ' across ' + splitCount + ' stores · saves ' + formatSek(savings));
      setStoreComparisonMetric('coverage', options.length + ' favorite stores compared · ' + missing.length + ' missing products');
      setResult('store-comparison', 'Connected store comparison loaded: ' + options.length + ' favorite-store totals, split basket ' + formatSek(splitTotal) + ', ' + missing.length + ' missing products.');
    } catch (error) {
      setResult('store-comparison', 'Store comparison API load failed: ' + error.message + '. Static comparison remains visible.');
    }
  };
  const loadRoutePlanFromApi = async () => {
    const config = getApiConfig();
    if (!hasApiSession(config)) {
      setResult('route-planner', 'Local preview mode: connect the API session bridge and save a basket before loading live route plan.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/basket/compare', config), {
        method: 'POST',
        headers: apiHeaders(config)
      });
      const payload = await requireApiSuccess(response);
      const cheapest = payload.cheapestByProduct || {};
      const assignments = Array.isArray(cheapest.assignments) ? cheapest.assignments : [];
      const missing = Array.isArray(payload.missingProductIds) ? payload.missingProductIds : [];
      const splitCount = Number(payload.splitStoreCount || 0);
      const splitTotal = Number(cheapest.total || 0);
      const savings = Number(payload.savingsVsBestSingleStore || 0);
      const storeNames = [...new Set(assignments.map((assignment) => assignment.storeName).filter(Boolean))];
      const productNames = assignments.map((assignment) => assignment.productId + ' → ' + assignment.storeName).slice(0, 3);
      setRoutePlanMetric('stops', splitCount + ' live stops · ' + (storeNames.length ? storeNames.join(' → ') : 'no assigned stores'));
      setRoutePlanMetric('total', 'Split basket ' + formatSek(splitTotal) + ' · saves ' + formatSek(savings) + ' vs best single store');
      setRoutePlanMetric('assignments', assignments.length + ' assigned items · ' + (productNames.length ? productNames.join(' · ') : 'save basket first') + ' · missing ' + missing.length);
      setResult('route-planner', 'Connected route plan loaded: ' + assignments.length + ' assigned basket lines across ' + splitCount + ' stops; ' + missing.length + ' missing products.');
    } catch (error) {
      setResult('route-planner', 'Route planner API load failed: ' + error.message + '. Static route plan remains visible.');
    }
  };
  const messages = {
    'toggle-alert': 'Alert rule updated locally; production save waits for authenticated account API.',
    'manage-subscription': 'Billing portal handoff prepared without exposing provider customer IDs.',
    'download-export': 'Data export plan prepared with receipts, budgets, baskets, and anonymous contributions.',
    'plan-deletion': 'Deletion plan queued; destructive production action still requires re-authentication.',
    'route-review': 'Capture routed to manual review queue before it can update catalog prices.',
    'mark-matched': 'Matched capture previewed for basket and budget update.'
  };
  configureApiSessionPanel();
  document.querySelectorAll('[data-groceryview-flow] form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const flow = form.closest('[data-groceryview-flow]')?.dataset.groceryviewFlow;
      const data = new FormData(form);
      if (flow === 'login') await requestLoginSessionFromApi(form);
      if (flow === 'household') await saveHouseholdToApi(form);
      if (flow === 'basket' && event.submitter?.dataset.flowAction === 'save-basket-api') {
        await saveBasketToApi(form);
      } else if (flow === 'basket') {
        setResult(flow, 'Basket preview recalculated at ' + formatSek(summarizeBasket(form)) + ' before checkout.');
      }
      if (flow === 'scanner') await processScannerUploadWithApi(form);
    });
  });
  document.querySelectorAll('[data-flow-action]').forEach((button) => {
    if (button.tagName === 'BUTTON' && button.type === 'submit') return;
    button.addEventListener('click', async () => {
      const flow = button.closest('[data-groceryview-flow]')?.dataset.groceryviewFlow;
      const action = button.dataset.flowAction;
      if (flow === 'account' && action === 'toggle-alert') {
        await saveCoffeeAlertToApi();
        return;
      }
      if (flow === 'account' && action === 'manage-subscription') {
        await loadSubscriptionAccessFromApi();
        return;
      }
      if (flow === 'sync' && action === 'check-sync') {
        await checkSavedDataSyncFromApi();
        return;
      }
      if (flow === 'privacy' && action === 'download-export') {
        await loadPrivacyExportFromApi();
        return;
      }
      if (flow === 'privacy' && action === 'plan-deletion') {
        await loadDeletionPlanFromApi();
        return;
      }
      if (flow === 'privacy' && action === 'check-fulfillment') {
        await loadPrivacyFulfillmentFromApi();
        return;
      }
      if (flow === 'scanner' && action === 'check-storage-health') {
        await loadScannerStorageHealthFromApi();
        return;
      }
      if (flow === 'product-terminal' && action === 'load-product-terminal') {
        await loadProductTerminalFromApi(button);
        return;
      }
      if (flow === 'price-confidence' && action === 'load-price-confidence') {
        await loadPriceConfidenceFromApi(button);
        return;
      }
      if (flow === 'market-movers' && action === 'load-market-movers') {
        await loadMarketMoversFromApi();
        return;
      }
      if (flow === 'category-market' && action === 'load-category-market') {
        await loadCategoryMarketFromApi(button);
        return;
      }
      if (flow === 'notification-inbox' && action === 'load-notification-metrics') {
        await loadNotificationMetricsFromApi(button);
        return;
      }
      if (flow === 'market-indices' && action === 'load-market-indices') {
        await loadMarketIndicesFromApi();
        return;
      }
      if (flow === 'price-freshness' && action === 'load-price-freshness') {
        await loadPriceFreshnessFromApi(button);
        return;
      }
      if (flow === 'catalog-coverage' && action === 'load-catalog-coverage') {
        await loadCatalogCoverageFromApi(button);
        return;
      }
      if (flow === 'watchlist' && action === 'load-watchlist') {
        await loadWatchlistFromApi();
        return;
      }
      if (flow === 'notification-inbox' && action === 'load-notification-inbox') {
        await loadNotificationInboxFromApi();
        return;
      }
      if (flow === 'daily-deals' && action === 'load-daily-deals') {
        await loadDailyDealsFromApi();
        return;
      }
      if (flow === 'budget-summary' && action === 'load-budget-summary') {
        await loadBudgetSummaryFromApi();
        return;
      }
      if (flow === 'billing-status' && action === 'load-billing-status') {
        await loadBillingStatusFromApi();
        return;
      }
      if (flow === 'meal-plans' && action === 'load-meal-plans') {
        await loadMealPlansFromApi();
        return;
      }
      if (flow === 'nutrition-value' && action === 'load-nutrition-value') {
        await loadNutritionValueFromApi();
        return;
      }
      if (flow === 'pantry' && action === 'load-pantry') {
        await loadPantryFromApi();
        return;
      }
      if (flow === 'loyalty-offers' && action === 'load-loyalty-offers') {
        await loadLoyaltyOffersFromApi();
        return;
      }
      if (flow === 'ad-disclosure' && action === 'load-ad-disclosure') {
        await loadAdDisclosureFromApi();
        return;
      }
      if (flow === 'receipt-review' && action === 'load-receipt-review') {
        await loadReceiptReviewFromApi();
        return;
      }
      if (flow === 'human-review' && action === 'load-human-review') {
        await loadHumanReviewFromApi();
        return;
      }
      if (flow === 'savings-ledger' && action === 'load-savings-ledger') {
        await loadSavingsLedgerFromApi();
        return;
      }
      if (flow === 'smart-swaps' && action === 'load-smart-swaps') {
        await loadSmartSwapsFromApi(button);
        return;
      }
      if (flow === 'store-deals' && action === 'load-store-deals') {
        await loadStoreDealsFromApi(button);
        return;
      }
      if (flow === 'store-map' && action === 'load-store-map') {
        await loadStoreMapFromApi();
        return;
      }
      if (flow === 'store-comparison' && action === 'load-store-comparison') {
        await loadStoreComparisonFromApi();
        return;
      }
      if (flow === 'route-planner' && action === 'load-route-plan') {
        await loadRoutePlanFromApi();
        return;
      }
      if (flow && action) setResult(flow, messages[action] || 'Action preview recorded.');
    });
  });
  return { setResult, summarizeBasket, getApiConfig, hasApiSession };
})();
</script>`;

const apiSessionPanel = `<section class="card api-session" data-api-session-panel><div class="eyebrow">API session bridge</div><h2>Save through protected routes</h2><p class="lede">Provider-safe local previews stay available, but staging or production sessions can connect these controls to the authenticated GroceryView API without putting bearer tokens in localStorage.</p><form class="flow-panel" aria-label="Authenticated API session bridge"><label>API base URL<input name="apiBase" type="url" placeholder="http://localhost:3000" autocomplete="off" /></label><label>User ID<input name="apiUserId" type="text" value="user-1" autocomplete="username" /></label><label>Bearer session token<input name="apiBearerToken" type="password" autocomplete="off" /></label><button type="submit">Save API session</button></form><p class="flow-result" data-api-session-result aria-live="polite">Local preview mode until an API session is configured.</p></section>`;

const layout = ({ title, description, body }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="shell">
      <a class="pill" href="/">← GroceryView</a>
      ${body}
      ${body.includes('data-groceryview-flow') ? apiSessionPanel : ''}
    </main>
    ${flowScript}
  </body>
</html>`;

const productPriceRows = [
  {
    store: 'Willys Odenplan',
    price: '49.90 SEK',
    unitPrice: '110.89 SEK/kg',
    priceType: 'Promo',
    confidence: 'High confidence',
    sourceTime: '2026-05-16 09:30 UTC',
    sourceType: 'retailer_page',
    label: 'Promo campaign',
    note: 'Temporary promotion. Not presented as an official shelf price.',
    tone: 'promo'
  },
  {
    store: 'ICA Kvantum Liljeholmen',
    price: '54.90 SEK',
    unitPrice: '122.00 SEK/kg',
    priceType: 'Shelf',
    confidence: 'High confidence',
    sourceTime: '2026-05-16 08:45 UTC',
    sourceType: 'retailer_page',
    label: 'Official shelf price',
    note: 'Verified retailer source with current shelf treatment.',
    tone: 'verified'
  },
  {
    store: 'Coop Farsta',
    price: '57.90 SEK',
    unitPrice: '128.67 SEK/kg',
    priceType: 'Estimated',
    confidence: 'Low confidence',
    sourceTime: '2026-05-15 17:20 UTC',
    sourceType: 'estimated',
    label: 'Unverified / estimated',
    note: 'Estimated fallback. Never styled as an official shelf price.',
    tone: 'estimated'
  },
  {
    store: 'Hemkop T-Centralen',
    price: '46.90 SEK',
    unitPrice: '104.11 SEK/kg',
    priceType: 'Member',
    confidence: 'Medium confidence',
    sourceTime: '2026-05-14 12:18 UTC',
    sourceType: 'manual_admin',
    label: 'Member-only',
    note: 'Requires loyalty context and cannot be treated as a public shelf price.',
    tone: 'member'
  }
];

const productPriceTable = `
  <div class="price-terminal">
    <div class="price-summary">
      <div>
        <div class="eyebrow">Current best comparable price</div>
        <h2>ICA Kvantum Liljeholmen - 54.90 SEK</h2>
        <p class="lede">Best verified shelf source. Promo, member-only, estimated, and low-confidence observations are separated before comparison.</p>
      </div>
      <span class="status verified">Official shelf price</span>
    </div>
    <table class="table price-table">
      <thead><tr><th>Store</th><th>Price</th><th>Unit</th><th>Type</th><th>Confidence</th><th>Source timestamp</th></tr></thead>
      <tbody>
        ${productPriceRows.map((row) => `<tr class="${row.tone}">
          <td><strong>${row.store}</strong><br><span class="footer-note">${row.note}</span></td>
          <td>${row.price}</td>
          <td>${row.unitPrice}</td>
          <td><span class="status ${row.tone}">${row.priceType}</span><br><span class="footer-note">${row.label}</span></td>
          <td>${row.confidence}</td>
          <td>${row.sourceTime}<br><span class="footer-note">${row.sourceType}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;

const productTerminalSections = `
  <section class="card product-terminal"><div class="eyebrow">Product price terminal</div><h1>ZOEGAS-COFFEE-450G</h1><p class="lede">A stock-style grocery quote view for Zoégas Coffee 450g. Current best verified shelf price: 54.90 SEK at ICA Kvantum Liljeholmen, while lower promo, member-only, and estimated observations remain visible but separated from official shelf-price claims.</p><div class="quote-strip" aria-label="Quote summary"><div><span>Best verified shelf</span><strong>54.90 SEK</strong><em>ICA Kvantum Liljeholmen · 2026-05-16 08:45 UTC</em></div><div><span>Lowest visible promo</span><strong>49.90 SEK</strong><em>Willys Odenplan · not official shelf price</em></div><div><span>52W range</span><strong>49.90–72.90</strong><em>promo low separated from shelf rank</em></div><div><span>Evidence volume</span><strong>42 obs</strong><em>31 verified · 8 retailer · 3 review</em></div></div><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score</span></div><div class="metric"><strong>25th</strong><span>Stockholm shelf percentile</span></div><div class="metric"><strong>4th</strong><span>visible local promo percentile</span></div></div></section>
  <section class="card" style="margin-top:16px"><h2>Stockholm vs local price distribution</h2><p class="lede">The verified 54.90 SEK shelf quote sits near the Stockholm P25 for the same package size. The 49.90 SEK local promo is shown as the visible low, but it is not treated as an official shelf-price comparison.</p><div class="distribution-board" aria-label="Same product price distribution across Stockholm and Odenplan"><div class="distribution-row"><div class="distribution-label"><strong>Stockholm</strong><span>P05 48.90 · P25 54.90 · Median 59.90 · P75 64.90 · P95 72.90</span></div><div class="histogram" aria-label="Stockholm histogram"><span style="--h:38%"></span><span style="--h:64%"></span><span style="--h:92%"></span><span style="--h:74%"></span><span style="--h:45%"></span><i style="left:25%">54.90</i></div></div><div class="distribution-row"><div class="distribution-label"><strong>Odenplan local area</strong><span>P05 49.90 · P25 52.90 · Median 57.90 · P75 62.90 · P95 69.90</span></div><div class="histogram local" aria-label="Odenplan histogram"><span style="--h:46%"></span><span style="--h:72%"></span><span style="--h:86%"></span><span style="--h:58%"></span><span style="--h:28%"></span><i style="left:4%">49.90</i></div></div></div><table class="table"><thead><tr><th>Scope</th><th>Best visible</th><th>Median</th><th>Current rank</th><th>Customer read</th></tr></thead><tbody><tr><td>Whole Stockholm</td><td>54.90 SEK verified shelf</td><td>59.90 SEK</td><td>25th percentile</td><td>Below the Stockholm median without relying on promo-only evidence.</td></tr><tr><td>Odenplan local area</td><td>49.90 SEK promo</td><td>57.90 SEK</td><td>4th visible percentile</td><td>Cheaper than 96% of local observations, but explicitly marked as promotion evidence.</td></tr></tbody></table></section>
  <section class="card" style="margin-top:16px"><h2>Trading-style price chart</h2><div class="toolbar" aria-label="Chart range"><span class="pill">7D</span><span class="pill">30D</span><span class="pill">90D</span><span class="pill">1Y</span><span class="pill">All verified</span></div><svg class="price-chart" viewBox="0 0 720 300" role="img" aria-label="Trading-style coffee price history with candlesticks, moving median, promo markers, and confidence styling"><line x1="44" y1="42" x2="44" y2="248" stroke="#37524b"/><line x1="44" y1="248" x2="690" y2="248" stroke="#37524b"/><text x="54" y="58" fill="#88a49c" font-size="12">72.90</text><text x="54" y="238" fill="#88a49c" font-size="12">49.90</text><g stroke="#20d9a6" stroke-width="3"><line x1="110" y1="92" x2="110" y2="172"/><rect x="96" y="112" width="28" height="48" rx="4" fill="#0d6f5d"/><line x1="208" y1="110" x2="208" y2="190"/><rect x="194" y="132" width="28" height="44" rx="4" fill="#0d6f5d"/><line x1="306" y1="128" x2="306" y2="206"/><rect x="292" y="146" width="28" height="48" rx="4" fill="#0d6f5d"/><line x1="404" y1="150" x2="404" y2="220"/><rect x="390" y="170" width="28" height="36" rx="4" fill="#0d6f5d"/><line x1="502" y1="164" x2="502" y2="230"/><rect x="488" y="188" width="28" height="28" rx="4" fill="#0d6f5d"/></g><g stroke="#ffca66" stroke-width="3"><line x1="600" y1="152" x2="600" y2="238"/><rect x="586" y="196" width="28" height="30" rx="4" fill="#6a4711"/></g><polyline points="110,120 208,132 306,148 404,166 502,184 600,196" fill="none" stroke="#7cf2ce" stroke-width="3" stroke-dasharray="10 7"/><circle cx="600" cy="226" r="8" fill="#ffca66"/><text x="610" y="214" fill="#ccfff0" font-size="13">weekly promo</text><text x="94" y="272" fill="#88a49c" font-size="12">Apr 01</text><text x="292" y="272" fill="#88a49c" font-size="12">May 01</text><text x="558" y="272" fill="#88a49c" font-size="12">May 20</text></svg><table class="table"><thead><tr><th>Stock-style signal</th><th>Value</th><th>Meaning</th></tr></thead><tbody><tr><td>30D moving median</td><td>59.90 SEK</td><td>Verified shelf quote is 8.3% under median.</td></tr><tr><td>52-week low touch</td><td>Promo-only</td><td>The visible 49.90 low is tracked, but official shelf claims stay at verified shelf evidence.</td></tr><tr><td>Freshness</td><td>4 days old shelf</td><td>Local promo evidence is newer but remains promo-labeled.</td></tr></tbody></table></section>`;

const productTerminalLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="product-terminal" data-product-id="coffee" style="margin-top:16px"><div class="eyebrow">Connected product terminal API</div><h2>Pull current API terminal numbers</h2><p class="lede">Use the API session bridge to fetch <code>/api/products/coffee/terminal</code> and refresh the customer-facing quote, 1M move, 52W range, Stockholm/local distribution, history evidence, and chart-series counts from the live API response.</p><div class="grid" aria-label="Live product terminal API metrics"><div class="metric"><strong data-product-terminal-quote>Waiting for API pull</strong><span>best API quote</span></div><div class="metric"><strong data-product-terminal-move>Static 1M move preview</strong><span>1M move and median gap</span></div><div class="metric"><strong data-product-terminal-range>Static 52W range preview</strong><span>52W range</span></div><div class="metric"><strong data-product-terminal-stockholm>Static Stockholm preview</strong><span>whole-city distribution</span></div><div class="metric"><strong data-product-terminal-chart>Static chart preview</strong><span>chart series and history</span></div><div class="metric"><strong data-product-terminal-evidence>Static verified history preview</strong><span>verified history</span></div></div><p class="footer-note" data-product-terminal-local>Local area distribution updates after the API pull.</p><div class="flow-panel" aria-label="Connected product terminal actions"><button type="button" data-flow-action="load-product-terminal">Load live terminal numbers</button></div><p class="flow-result" data-flow-result="product-terminal" aria-live="polite">Local preview mode: connect the API session bridge before loading live product terminal numbers.</p></section>`;

const priceConfidenceLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="price-confidence" data-product-id="coffee" data-as-of="2026-05-20T00:00:00.000Z" style="margin-top:16px"><div class="eyebrow">Connected price confidence API</div><h2>Pull live confidence evidence</h2><p class="lede">Fetch <code>/api/products/coffee/terminal</code> to turn the confidence guide into live evidence: current price-row volume, verified-history ratio, Deal Score eligibility verdict, guardrail count, and chart confidence styling.</p><div class="grid" aria-label="Live price confidence API metrics"><div class="metric"><strong data-price-confidence-quote>Waiting for API pull</strong><span>quote and eligibility verdict</span></div><div class="metric"><strong data-price-confidence-volume>Static evidence-volume preview</strong><span>current rows and verified history</span></div><div class="metric"><strong data-price-confidence-guardrails>Static guardrail preview</strong><span>evidence rules protecting shoppers</span></div><div class="metric"><strong data-price-confidence-chart>Static chart-style preview</strong><span>confidence-styled chart series</span></div></div><div class="flow-panel" aria-label="Connected price confidence actions"><button type="button" data-flow-action="load-price-confidence">Load live confidence evidence</button></div><p class="flow-result" data-flow-result="price-confidence" aria-live="polite">Local preview mode: connect the API session bridge before loading live price confidence evidence.</p></section>`;

const productPriceGuardrails = `
  <section class="card" style="margin-top:16px"><h2>Price evidence guardrails</h2><table class="table"><thead><tr><th>Signal</th><th>Displayed behavior</th></tr></thead><tbody><tr><td>Verified shelf or retailer page</td><td>Can contribute to current price, Deal Score, and basket totals.</td></tr><tr><td>Member or promotion price</td><td>Shown with explicit loyalty or campaign label before shoppers act.</td></tr><tr><td>Estimated or low-confidence row</td><td>Marked unverified and excluded from official shelf-price claims.</td></tr></tbody></table></section>`;

const categoryMarketLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="category-market" data-category="coffee" style="margin-top:16px"><div class="eyebrow">Connected category market API</div><h2>Pull current coffee category numbers</h2><p class="lede">Fetch <code>/api/categories/coffee/market</code> to refresh category rows with current price, Deal Score, 1M move, 52-week position, Stockholm median gap, and verified-history evidence from the API instead of static copy.</p><div class="grid" aria-label="Live category market API metrics"><div class="metric"><strong data-category-market-leader>Waiting for API pull</strong><span>category leader</span></div><div class="metric"><strong data-category-market-range>Static 52W range preview</strong><span>52W position</span></div><div class="metric"><strong data-category-market-median>Static Stockholm median preview</strong><span>same-product median gap</span></div><div class="metric"><strong data-category-market-evidence>Static verified history preview</strong><span>verified category evidence</span></div></div><div class="flow-panel" aria-label="Connected category market actions"><button type="button" data-flow-action="load-category-market">Load live category market</button></div><p class="flow-result" data-flow-result="category-market" aria-live="polite">Local preview mode: connect the API session bridge before loading live category market numbers.</p></section>`;

const marketIndicesLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="market-indices" style="margin-top:16px"><div class="eyebrow">Connected grocery indices API</div><h2>Pull live fixed-basket index</h2><p class="lede">Fetch <code>/api/indices</code> to refresh the Stockholm Grocery Index value, movement, confidence, and component count from the API behind the market surface.</p><div class="grid" aria-label="Live grocery index API metrics"><div class="metric"><strong data-market-index-value>Waiting for API pull</strong><span>index value</span></div><div class="metric"><strong data-market-index-movement>Static movement preview</strong><span>movement from base</span></div><div class="metric"><strong data-market-index-confidence>Static confidence preview</strong><span>confidence and components</span></div></div><div class="flow-panel" aria-label="Connected grocery index actions"><button type="button" data-flow-action="load-market-indices">Load live grocery indices</button></div><p class="flow-result" data-flow-result="market-indices" aria-live="polite">Local preview mode: add an API base URL before loading live grocery indices.</p></section>`;

const priceFreshnessLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="price-freshness" data-as-of="2026-05-20T00:00:00.000Z" style="margin-top:16px"><div class="eyebrow">Connected price freshness API</div><h2>Pull live freshness and backfill status</h2><p class="lede">Fetch <code>/api/prices/freshness</code> to replace static freshness copy with API counts for fresh, aging, stale, and backfill-needed product rows before those rows power deal boards or alerts.</p><div class="grid" aria-label="Live price freshness API metrics"><div class="metric"><strong data-price-freshness-summary>Waiting for API pull</strong><span>fresh/aging/stale</span></div><div class="metric"><strong data-price-freshness-backfill>Static backfill preview</strong><span>backfill queue</span></div><div class="metric"><strong data-price-freshness-thresholds>Static freshness thresholds</strong><span>aging and stale windows</span></div><div class="metric"><strong data-price-freshness-stale>Static stale-product preview</strong><span>stale products</span></div></div><div class="flow-panel" aria-label="Connected price freshness actions"><button type="button" data-flow-action="load-price-freshness">Load live freshness report</button></div><p class="flow-result" data-flow-result="price-freshness" aria-live="polite">Local preview mode: connect the API session bridge before loading live price freshness.</p></section>`;

const catalogCoverageLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="catalog-coverage" data-as-of="2026-05-20T00:00:00.000Z" style="margin-top:16px"><div class="eyebrow">Connected catalog coverage API</div><h2>Pull live coverage report</h2><p class="lede">Fetch <code>/api/prices/freshness</code>, <code>/api/stores</code>, and <code>/api/market/overview</code> to refresh product/category coverage, freshness status, store-chain footprint, market rows, and backfill actions before low-coverage rows power shopper alerts or deal boards.</p><div class="grid" aria-label="Live catalog coverage API metrics"><div class="metric"><strong data-catalog-coverage-products>Waiting for API pull</strong><span>products, categories, and market rows</span></div><div class="metric"><strong data-catalog-coverage-freshness>Static freshness preview</strong><span>fresh/aging/stale mix</span></div><div class="metric"><strong data-catalog-coverage-stores>Static store footprint preview</strong><span>stores, chains, districts</span></div><div class="metric"><strong data-catalog-coverage-backfill>Static backfill preview</strong><span>backfill queue and buy-ready rows</span></div></div><div class="flow-panel" aria-label="Connected catalog coverage actions"><button type="button" data-flow-action="load-catalog-coverage">Load live coverage report</button></div><p class="flow-result" data-flow-result="catalog-coverage" aria-live="polite">Local preview mode: connect the API session bridge before loading live catalog coverage.</p></section>`;

const watchlistLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="watchlist" style="margin-top:16px"><div class="eyebrow">Connected watchlist API</div><h2>Pull live target and alert numbers</h2><p class="lede">Fetch <code>/api/watchlist</code> through the protected API session bridge to refresh tracked-item counts, target-price rules, active trigger values, favorite-store scope, and 52-week-low alert evidence from account data.</p><div class="grid" aria-label="Live watchlist API metrics"><div class="metric"><strong data-watchlist-summary>Waiting for API pull</strong><span>tracked items and alerts</span></div><div class="metric"><strong data-watchlist-target>Static target preview</strong><span>target price rules</span></div><div class="metric"><strong data-watchlist-trigger>Static trigger preview</strong><span>current trigger value</span></div><div class="metric"><strong data-watchlist-scope>Static scope preview</strong><span>favorite-store and 52W scope</span></div></div><div class="flow-panel" aria-label="Connected watchlist actions"><button type="button" data-flow-action="load-watchlist">Load live watchlist alerts</button></div><p class="flow-result" data-flow-result="watchlist" aria-live="polite">Local preview mode: connect the API session bridge before loading live watchlist alerts.</p></section>`;

const notificationInboxLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="notification-inbox" style="margin-top:16px"><div class="eyebrow">Connected notification inbox API</div><h2>Pull live notification inbox</h2><p class="lede">Fetch <code>/api/notifications/inbox</code> through the protected API session bridge to refresh active grocery alerts, delivered rows, quiet-hours holds, provider suppressions, and alert guardrails before households miss price drops or receive noisy notifications.</p><div class="grid" aria-label="Live notification inbox API metrics"><div class="metric"><strong data-notification-inbox-alerts>Waiting for API pull</strong><span>active alerts and tracked items</span></div><div class="metric"><strong data-notification-inbox-delivery>Static delivery preview</strong><span>delivered, held, suppressed</span></div><div class="metric"><strong data-notification-inbox-guardrails>Static guardrail preview</strong><span>quiet-hours and suppression rules</span></div><div class="metric"><strong data-notification-inbox-ops>Static worker metrics preview</strong><span>delivered, failed, dead-lettered, suppressed</span></div></div><div class="flow-panel" aria-label="Connected notification inbox actions"><button type="button" data-flow-action="load-notification-inbox">Load live notification inbox</button><label>Metrics token<input name="metricsToken" type="password" autocomplete="off" /></label><button type="button" data-flow-action="load-notification-metrics">Load worker metrics</button></div><p class="flow-result" data-flow-result="notification-inbox" aria-live="polite">Local preview mode: connect the API session bridge before loading live notification inbox.</p></section>`;

const dailyDealsLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="daily-deals" style="margin-top:16px"><div class="eyebrow">Connected daily deals API</div><h2>Pull live ranked deal board</h2><p class="lede">Fetch <code>/api/market/overview</code> to refresh the daily shopper board with top deal ticker, best price, Deal Score, verdict mix, and store evidence from the public market API.</p><div class="grid" aria-label="Live daily deals API metrics"><div class="metric"><strong data-daily-deals-leader>Waiting for API pull</strong><span>top ranked deal</span></div><div class="metric"><strong data-daily-deals-price>Static best-price preview</strong><span>price and store</span></div><div class="metric"><strong data-daily-deals-count>Static deal-count preview</strong><span>ranked deal count</span></div></div><div class="flow-panel" aria-label="Connected daily deals actions"><button type="button" data-flow-action="load-daily-deals">Load live deal board</button></div><p class="flow-result" data-flow-result="daily-deals" aria-live="polite">Local preview mode: connect the API session bridge before loading live daily deals.</p></section>`;

const budgetSummaryLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="budget-summary" style="margin-top:16px"><div class="eyebrow">Connected budget API</div><h2>Pull live household budget summary</h2><p class="lede">Fetch <code>/api/budget/summary</code> through the protected API session bridge to refresh weekly budget, month-to-date spend, next-basket estimate, remaining buffers, and over/under status from account data.</p><div class="grid" aria-label="Live budget summary API metrics"><div class="metric"><strong data-budget-summary-weekly>Waiting for API pull</strong><span>weekly budget status</span></div><div class="metric"><strong data-budget-summary-monthly>Static monthly preview</strong><span>monthly budget status</span></div><div class="metric"><strong data-budget-summary-estimate>Static basket estimate preview</strong><span>next basket buffer</span></div></div><div class="flow-panel" aria-label="Connected budget summary actions"><button type="button" data-flow-action="load-budget-summary">Load live budget summary</button></div><p class="flow-result" data-flow-result="budget-summary" aria-live="polite">Local preview mode: connect the API session bridge before loading live budget summary.</p></section>`;

const billingStatusLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="billing-status" style="margin-top:16px"><div class="eyebrow">Connected billing API</div><h2>Pull live billing status</h2><p class="lede">Fetch <code>/api/account/subscription-access</code> through the protected API session bridge to refresh entitlement status, checkout requirement, ad-removal state, and account actions before premium UI or billing prompts are shown.</p><div class="grid" aria-label="Live billing status API metrics"><div class="metric"><strong data-billing-status-entitlement>Waiting for API pull</strong><span>entitlement and checkout state</span></div><div class="metric"><strong data-billing-status-ads>Static ad-removal preview</strong><span>ad removal and plan status</span></div><div class="metric"><strong data-billing-status-actions>Static account action preview</strong><span>billing actions</span></div></div><div class="flow-panel" aria-label="Connected billing status actions"><button type="button" data-flow-action="load-billing-status">Load live billing status</button></div><p class="flow-result" data-flow-result="billing-status" aria-live="polite">Local preview mode: connect the API session bridge before loading live billing status.</p></section>`;

const mealPlansLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="meal-plans" style="margin-top:16px"><div class="eyebrow">Connected meal plan API</div><h2>Pull live meal plan budget</h2><p class="lede">Fetch protected <code>/api/budget/summary</code> and <code>/api/basket/compare</code> plus public <code>/api/market/overview</code> to refresh weekly meal budget buffer, verified ingredient coverage, split-store savings, missing-product blockers, and meal-relevant deal signals from live API data.</p><div class="grid" aria-label="Live meal plan API metrics"><div class="metric"><strong data-meal-plans-budget>Waiting for API pull</strong><span>weekly budget buffer and next basket</span></div><div class="metric"><strong data-meal-plans-basket>Static ingredient coverage preview</strong><span>verified ingredient lines and blockers</span></div><div class="metric"><strong data-meal-plans-deals>Static meal deal preview</strong><span>meal-relevant deal signals</span></div></div><div class="flow-panel" aria-label="Connected meal plan actions"><button type="button" data-flow-action="load-meal-plans">Load live meal plan budget</button></div><p class="flow-result" data-flow-result="meal-plans" aria-live="polite">Local preview mode: connect the API session bridge and save a basket before loading live meal plan budget.</p></section>`;

const nutritionValueLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="nutrition-value" style="margin-top:16px"><div class="eyebrow">Connected nutrition value API</div><h2>Pull live nutrition value</h2><p class="lede">Fetch <code>/api/nutrition/value?metric=protein</code> to compare protein per 10 SEK, sugar exposure, salt warnings, and guardrails before a cheap item is treated as a healthy grocery swap or meal-plan ingredient.</p><div class="grid" aria-label="Live nutrition value API metrics"><div class="metric"><strong data-nutrition-value-leader>Waiting for API pull</strong><span>best protein value per 10 SEK</span></div><div class="metric"><strong data-nutrition-value-ranking>Static nutrition ranking preview</strong><span>top value rows</span></div><div class="metric"><strong data-nutrition-value-warnings>Static warning preview</strong><span>sugar, salt, and allergen guardrails</span></div></div><div class="flow-panel" aria-label="Connected nutrition value actions"><button type="button" data-flow-action="load-nutrition-value">Load live nutrition value</button></div><p class="flow-result" data-flow-result="nutrition-value" aria-live="polite">Local preview mode: add an API base URL before loading live nutrition value rankings.</p></section>`;

const pantryLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="pantry" style="margin-top:16px"><div class="eyebrow">Connected pantry API</div><h2>Pull live pantry replenishment</h2><p class="lede">Fetch <code>/api/pantry/replenishment</code> through the protected API session bridge to refresh live low-stock status, expiring-soon rows, restock quantities, duplicate basket blockers, and best-deal context before pantry suggestions modify a basket or meal plan.</p><div class="grid" aria-label="Live pantry replenishment API metrics"><div class="metric"><strong data-pantry-summary>Waiting for API pull</strong><span>inventory status mix</span></div><div class="metric"><strong data-pantry-restock>Static restock preview</strong><span>top restock action</span></div><div class="metric"><strong data-pantry-expiry>Static expiry preview</strong><span>expiry, duplicate, and deal context</span></div></div><div class="flow-panel" aria-label="Connected pantry actions"><button type="button" data-flow-action="load-pantry">Load live pantry replenishment</button></div><p class="flow-result" data-flow-result="pantry" aria-live="polite">Local preview mode: connect the API session bridge before loading live pantry replenishment.</p></section>`;

const loyaltyOffersLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="loyalty-offers" style="margin-top:16px"><div class="eyebrow">Connected loyalty API</div><h2>Pull live loyalty offers</h2><p class="lede">Fetch <code>/api/loyalty/offers</code> through the protected API session bridge to refresh eligible member savings, coupon action counts, membership confirmations, and shelf-price separation guardrails before loyalty offers affect household savings.</p><div class="grid" aria-label="Live loyalty offer API metrics"><div class="metric"><strong data-loyalty-offers-savings>Waiting for API pull</strong><span>eligible savings and ready offers</span></div><div class="metric"><strong data-loyalty-offers-actions>Static action preview</strong><span>coupon and top-offer actions</span></div><div class="metric"><strong data-loyalty-offers-guardrails>Static guardrail preview</strong><span>membership and shelf-price guardrails</span></div></div><div class="flow-panel" aria-label="Connected loyalty offer actions"><button type="button" data-flow-action="load-loyalty-offers">Load live loyalty offers</button></div><p class="flow-result" data-flow-result="loyalty-offers" aria-live="polite">Local preview mode: connect the API session bridge before loading live loyalty offers.</p></section>`;

const adDisclosureLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="ad-disclosure" style="margin-top:16px"><div class="eyebrow">Connected ad disclosure API</div><h2>Pull live ad disclosure</h2><p class="lede">Fetch <code>/api/ads/disclosure</code> through the protected API session bridge to refresh labeled ad slots, blocked unsafe placements, premium ad-removal state, and Deal Score separation evidence before sponsored content appears beside grocery recommendations.</p><div class="grid" aria-label="Live ad disclosure API metrics"><div class="metric"><strong data-ad-disclosure-slots>Waiting for API pull</strong><span>labeled ad slots</span></div><div class="metric"><strong data-ad-disclosure-blocked>Static policy-block preview</strong><span>blocked unsafe placements</span></div><div class="metric"><strong data-ad-disclosure-premium>Static premium-state preview</strong><span>premium removal and excluded surfaces</span></div></div><div class="flow-panel" aria-label="Connected ad disclosure actions"><button type="button" data-flow-action="load-ad-disclosure">Load live ad disclosure</button></div><p class="flow-result" data-flow-result="ad-disclosure" aria-live="polite">Local preview mode: connect the API session bridge before loading live ad disclosure.</p></section>`;

const receiptReviewLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="receipt-review" style="margin-top:16px"><div class="eyebrow">Connected receipt review API</div><h2>Pull live receipt review</h2><p class="lede">Fetch <code>/api/receipts/review</code> through the protected API session bridge to refresh actual receipt spend, local median delta, confidence routing, and writeback guardrails before receipt rows update household actuals or price history.</p><div class="grid" aria-label="Live receipt review API metrics"><div class="metric"><strong data-receipt-review-budget>Waiting for API pull</strong><span>actual spend and budget buffer</span></div><div class="metric"><strong data-receipt-review-lines>Static line-review preview</strong><span>matched lines and review queue</span></div><div class="metric"><strong data-receipt-review-guardrails>Static writeback preview</strong><span>good buys, overspend, and guardrails</span></div></div><div class="flow-panel" aria-label="Connected receipt review actions"><button type="button" data-flow-action="load-receipt-review">Load live receipt review</button></div><p class="flow-result" data-flow-result="receipt-review" aria-live="polite">Local preview mode: connect the API session bridge before loading live receipt review.</p></section>`;

const humanReviewLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="human-review" style="margin-top:16px"><div class="eyebrow">Connected human review API</div><h2>Pull live review queue</h2><p class="lede">Fetch <code>/api/human-review/assignments</code> through the protected reviewer session to refresh open assignment count, SLA status, due-soon or overdue rows, and high-priority review work before catalog writebacks are approved.</p><div class="grid" aria-label="Live human review API metrics"><div class="metric"><strong data-human-review-assignments>Waiting for API pull</strong><span>open assignments and progress</span></div><div class="metric"><strong data-human-review-sla>Static SLA preview</strong><span>SLA status, overdue, due soon</span></div><div class="metric"><strong data-human-review-priority>Static priority preview</strong><span>high-priority rows</span></div></div><div class="flow-panel" aria-label="Connected human review actions"><button type="button" data-flow-action="load-human-review">Load live review queue</button></div><p class="flow-result" data-flow-result="human-review" aria-live="polite">Local preview mode: connect the API session bridge with a reviewer account before loading live human review operations.</p></section>`;

const savingsLedgerLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="savings-ledger" style="margin-top:16px"><div class="eyebrow">Connected savings ledger API</div><h2>Pull live savings ledger</h2><p class="lede">Fetch protected <code>/api/budget/summary</code> and <code>/api/basket/compare</code> to reconcile budget remaining, next-basket estimate, split-basket forecast savings, verified assignment lines, and missing-product blockers before savings are treated as realized.</p><div class="grid" aria-label="Live savings ledger API metrics"><div class="metric"><strong data-savings-ledger-confirmed>Waiting for API pull</strong><span>budget actuals</span></div><div class="metric"><strong data-savings-ledger-forecast>Static forecast preview</strong><span>forecast savings and next basket</span></div><div class="metric"><strong data-savings-ledger-blockers>Static blocker preview</strong><span>assignment evidence and blockers</span></div></div><div class="flow-panel" aria-label="Connected savings ledger actions"><button type="button" data-flow-action="load-savings-ledger">Load live savings ledger</button></div><p class="flow-result" data-flow-result="savings-ledger" aria-live="polite">Local preview mode: connect the API session bridge and save a basket before loading live savings ledger.</p></section>`;

const smartSwapsLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="smart-swaps" data-product-id="milk" style="margin-top:16px"><div class="eyebrow">Connected smart swaps API</div><h2>Pull live swap candidates</h2><p class="lede">Fetch <code>/api/products/milk/equivalents</code> plus the current product terminal quote to rank comparable products by best known price, Deal Score, estimated savings versus the current best quote, and equivalence reason.</p><div class="grid" aria-label="Live smart swaps API metrics"><div class="metric"><strong data-smart-swaps-best>Waiting for API pull</strong><span>best comparable product</span></div><div class="metric"><strong data-smart-swaps-count>Static candidate preview</strong><span>live comparable-product count</span></div><div class="metric"><strong data-smart-swaps-confidence>Static score preview</strong><span>Deal Score and savings evidence</span></div><div class="metric"><strong data-smart-swaps-reason>Static reason preview</strong><span>equivalence rule</span></div></div><div class="flow-panel" aria-label="Connected smart swaps actions"><button type="button" data-flow-action="load-smart-swaps">Load live swap candidates</button></div><p class="flow-result" data-flow-result="smart-swaps" aria-live="polite">Local preview mode: connect the API session bridge before loading live swap candidates.</p></section>`;

const storeDealsLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="store-deals" data-store-id="willys-odenplan" style="margin-top:16px"><div class="eyebrow">Connected store deals API</div><h2>Pull live in-store deal board</h2><p class="lede">Fetch <code>/api/stores/willys-odenplan/deals</code> to refresh this favorite-store profile with ranked products, current store price, Deal Score, category coverage, and Buy/Compare verdict mix from the public API.</p><div class="grid" aria-label="Live store deals API metrics"><div class="metric"><strong data-store-deals-leader>Waiting for API pull</strong><span>top in-store deal</span></div><div class="metric"><strong data-store-deals-count>Static deal-count preview</strong><span>ranked store products and categories</span></div><div class="metric"><strong data-store-deals-verdict>Static verdict preview</strong><span>Buy and Compare mix</span></div></div><div class="flow-panel" aria-label="Connected store deal actions"><button type="button" data-flow-action="load-store-deals">Load live store deals</button></div><p class="flow-result" data-flow-result="store-deals" aria-live="polite">Local preview mode: connect the API session bridge before loading live store deals.</p></section>`;

const storeMapLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="store-map" style="margin-top:16px"><div class="eyebrow">Connected store map API</div><h2>Pull live Stockholm store coverage</h2><p class="lede">Fetch <code>/api/stores</code> to refresh mapped store count, districts, chains, and confidence coverage from the public API before a shopper uses map or route guidance.</p><div class="grid" aria-label="Live store map API metrics"><div class="metric"><strong data-store-map-count>Waiting for API pull</strong><span>mapped stores and chains</span></div><div class="metric"><strong data-store-map-districts>Static district preview</strong><span>covered districts</span></div><div class="metric"><strong data-store-map-confidence>Static confidence preview</strong><span>high-confidence profiles</span></div></div><div class="flow-panel" aria-label="Connected store map actions"><button type="button" data-flow-action="load-store-map">Load live store map</button></div><p class="flow-result" data-flow-result="store-map" aria-live="polite">Local preview mode: connect the API session bridge before loading live store map.</p></section>`;

const storeComparisonLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="store-comparison" style="margin-top:16px"><div class="eyebrow">Connected store comparison API</div><h2>Pull live favorite-store basket totals</h2><p class="lede">Fetch <code>/api/basket/compare</code> through the protected API session bridge to refresh favorite-store totals, best single-store option, split-basket total, split-store count, missing products, and savings against the best single-store basket.</p><div class="grid" aria-label="Live store comparison API metrics"><div class="metric"><strong data-store-comparison-best>Waiting for API pull</strong><span>best single-store option</span></div><div class="metric"><strong data-store-comparison-split>Static split-basket preview</strong><span>split-store basket and savings</span></div><div class="metric"><strong data-store-comparison-coverage>Static coverage preview</strong><span>favorite-store coverage and missing products</span></div></div><div class="flow-panel" aria-label="Connected store comparison actions"><button type="button" data-flow-action="load-store-comparison">Load live store comparison</button></div><p class="flow-result" data-flow-result="store-comparison" aria-live="polite">Local preview mode: connect the API session bridge and save a basket before loading live store comparison.</p></section>`;

const routePlanLivePanel = `
  <section class="card terminal-live-panel" data-groceryview-flow="route-planner" style="margin-top:16px"><div class="eyebrow">Connected route planner API</div><h2>Pull live split-basket route plan</h2><p class="lede">Fetch <code>/api/basket/compare</code> through the protected API session bridge to translate the saved basket into route stops, assigned products, split-basket total, split-store count, savings, and missing-product blockers without letting route convenience change Deal Score.</p><div class="grid" aria-label="Live route planner API metrics"><div class="metric"><strong data-route-plan-stops>Waiting for API pull</strong><span>live stop count and order</span></div><div class="metric"><strong data-route-plan-total>Static split-basket preview</strong><span>split basket total and savings</span></div><div class="metric"><strong data-route-plan-assignments>Static assignment preview</strong><span>assigned products and blockers</span></div></div><div class="flow-panel" aria-label="Connected route planner actions"><button type="button" data-flow-action="load-route-plan">Load live route plan</button></div><p class="flow-result" data-flow-result="route-planner" aria-live="polite">Local preview mode: connect the API session bridge and save a basket before loading live route plan.</p></section>`;

const pages = [
  {
    path: 'login/index.html',
    title: 'Sign in to GroceryView — GroceryView',
    description: 'Secure GroceryView sign-in entry point for personalized watchlists, baskets, budgets, and household features.',
    body: `<section class="card" data-groceryview-flow="login"><div class="eyebrow">Account access</div><h1>Sign in to GroceryView</h1><p class="lede">Passkey or magic link authentication keeps personal grocery budgets and watchlists protected.</p><div class="grid"><div class="metric"><strong>Fail closed</strong><span>protected routes require a valid session</span></div><div class="metric"><strong>Bearer auth</strong><span>API contract already documents user-scoped routes</span></div><div class="metric"><strong>No password reuse</strong><span>passwordless sign-in target</span></div></div><form class="flow-panel" aria-label="Demo sign-in form"><label>Email for magic link<input name="email" type="email" placeholder="you@example.com" autocomplete="email" /></label><label>Workspace<select name="workspace"><option>Household workspace</option><option>Solo price watch</option><option>Reviewer desk</option></select></label><button type="submit">Send sign-in link</button></form><p class="flow-result" data-flow-result="login" aria-live="polite">Demo mode: no email sent until auth provider credentials are configured.</p></section>`
  },
  {
    path: 'account/index.html',
    title: 'Account settings — GroceryView',
    description: 'GroceryView account page scaffold for favorite stores, notification preferences, and personal price alerts.',
    body: `<section class="card" data-groceryview-flow="account"><div class="eyebrow">Settings</div><h1>Account settings</h1><p class="lede">Manage favorite stores, watchlist alerts, quiet hours, and grocery budget preferences from one account view.</p><div class="grid"><div class="metric"><strong>Stores</strong><span>favorite-store basket scope</span></div><div class="metric"><strong>Alerts</strong><span>target price and 52-week-low notifications</span></div><div class="metric"><strong>Budget</strong><span>weekly and monthly guardrails</span></div></div><div class="flow-panel" aria-label="Account actions"><button type="button" data-flow-action="toggle-alert">Toggle coffee alert</button><button type="button" data-flow-action="manage-subscription">Manage subscription</button></div><p class="flow-result" data-flow-result="account" aria-live="polite">Account actions preview locally until an authenticated session is present.</p></section><section class="card" style="margin-top:16px"><h2>Subscription access</h2><p class="lede">Premium access is active from <code>/api/account/subscription-access</code>; ads are removed and checkout prompts stay hidden while the entitlement remains current.</p><div class="grid"><div class="metric"><strong>Premium</strong><span>active entitlement</span></div><div class="metric"><strong>Ads removed</strong><span>non-critical ad slots hidden</span></div><div class="metric"><strong>Manage subscription</strong><span>billing portal action</span></div></div></section><section class="card" style="margin-top:16px"><h2>Alert preferences</h2><table class="table"><thead><tr><th>Rule</th><th>Channel</th><th>Quiet hours</th><th>Scope</th></tr></thead><tbody><tr><td>Coffee below 50 SEK</td><td>Push</td><td>21:00-07:00</td><td>Favorite stores</td></tr><tr><td>Butter deal score above 80</td><td>Email</td><td>Daily digest</td><td>All Stockholm stores</td></tr><tr><td>Receipt review reminder</td><td>Push</td><td>Immediate</td><td>Household queue</td></tr></tbody></table></section>`
  },
  {
    path: 'account/sync/index.html',
    title: 'Saved data sync — GroceryView',
    description: 'Check whether GroceryView account, household, basket, budget, and privacy state can be loaded through protected server-backed APIs.',
    body: `<section class="card" data-groceryview-flow="sync"><div class="eyebrow">Saved data</div><h1>Saved data sync</h1><p class="lede">Check that signed-in account state is reachable from protected APIs before relying on local previews for household planning, weekly baskets, budgets, or privacy controls.</p><div class="grid"><div class="metric"><strong>5</strong><span>protected API checks</span></div><div class="metric"><strong>Bearer</strong><span>session required</span></div><div class="metric"><strong>Fail closed</strong><span>missing server state is visible</span></div></div><div class="flow-panel" aria-label="Saved data sync actions"><button type="button" data-flow-action="check-sync">Check saved data</button></div><p class="flow-result" data-flow-result="sync" aria-live="polite">Connect an API session to verify server-backed saved state.</p></section><section class="card" style="margin-top:16px"><h2>Server-backed state</h2><table class="table"><thead><tr><th>Area</th><th>Protected route</th><th>Use in UI</th><th>Fail-closed behavior</th></tr></thead><tbody><tr><td>Subscription</td><td>/api/account/subscription-access</td><td>Premium access and ad removal</td><td>Show checkout required when unavailable</td></tr><tr><td>Household</td><td>/api/households/current</td><td>Members, shared stores, approval policy</td><td>Keep local preview until a plan exists</td></tr><tr><td>Basket</td><td>/api/basket/current</td><td>Weekly saved basket lines</td><td>Do not claim basket persistence</td></tr><tr><td>Budget</td><td>/api/budget/summary</td><td>Weekly and monthly spend status</td><td>Hold budget decisions locally</td></tr><tr><td>Privacy</td><td>/api/privacy/export</td><td>Export coverage and account data proof</td><td>Require authenticated export before deletion planning</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Durable UI guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>No silent local-only state</td><td>Connected screens show whether protected saved-data APIs are reachable.</td></tr><tr><td>Bearer token stays session-scoped</td><td>The sync check reuses the API session bridge and does not persist tokens in localStorage.</td></tr><tr><td>Partial outages stay visible</td><td>Each saved-data area reports its own API status instead of hiding failed reads.</td></tr></tbody></table></section>`
  },
  {
    path: 'ads/disclosure/index.html',
    title: 'Ad disclosure center — GroceryView',
    description: 'Review GroceryView sponsored placement labels, ad eligibility, premium ad removal, and ranking separation guardrails.',
    body: `<section class="card"><div class="eyebrow">Ads</div><h1>Ad disclosure center</h1><p class="lede">Audit sponsored placements, premium ad removal, and ranking separation so ads never look like organic grocery deal recommendations.</p><div class="grid"><div class="metric"><strong>3</strong><span>labeled placements</span></div><div class="metric"><strong>0</strong><span>ranking influence</span></div><div class="metric"><strong>Premium</strong><span>non-critical ads removed</span></div></div></section><section class="card" style="margin-top:16px"><h2>Disclosure states</h2><table class="table"><thead><tr><th>Surface</th><th>Placement</th><th>Label</th><th>Premium state</th><th>Rule</th></tr></thead><tbody><tr><td>Daily deals</td><td>Sponsored banner</td><td>Sponsored</td><td>Hidden for premium</td><td>Never affects Deal Score</td></tr><tr><td>Product page</td><td>Brand offer card</td><td>Ad</td><td>Hidden for premium</td><td>Separated from price rows</td></tr><tr><td>Store map</td><td>Promoted pickup note</td><td>Sponsored</td><td>Visible only when useful</td><td>No route ranking boost</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Ad guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Ranking separation</td><td>Sponsored placements cannot change Deal Score, basket totals, or store ordering.</td></tr><tr><td>Premium removal</td><td>Premium entitlements hide non-critical ad slots while preserving disclosure history.</td></tr><tr><td>Privacy boundary</td><td>Advertiser payloads stay aggregated and never include raw receipts.</td></tr></tbody></table></section>${adDisclosureLivePanel}`
  },
  {
    path: 'billing/status/index.html',
    title: 'Billing status — GroceryView',
    description: 'Review GroceryView subscription entitlement, checkout requirement, ad removal state, billing issue actions, and provider webhook status.',
    body: `<section class="card"><div class="eyebrow">Billing</div><h1>Billing status</h1><p class="lede">Audit subscription entitlement, checkout enforcement, ad removal, and provider webhook state before premium features are shown.</p><div class="grid"><div class="metric"><strong>Premium</strong><span>active entitlement</span></div><div class="metric"><strong>Ads off</strong><span>non-critical slots removed</span></div><div class="metric"><strong>0</strong><span>billing blockers</span></div></div></section><section class="card" style="margin-top:16px"><h2>Entitlement state</h2><table class="table"><thead><tr><th>Account</th><th>Plan</th><th>Status</th><th>Checkout</th><th>Action</th></tr></thead><tbody><tr><td>Household workspace</td><td>premium_monthly</td><td>Active</td><td>Not required</td><td>Show manage subscription</td></tr><tr><td>Solo price watch</td><td>free</td><td>No entitlement</td><td>Required</td><td>Show upgrade</td></tr><tr><td>Reviewer desk</td><td>premium_yearly</td><td>Past due</td><td>Required</td><td>Show billing issue</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Billing guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Fail closed</td><td>Missing or past-due entitlements keep checkout required.</td></tr><tr><td>Ads removed only for premium</td><td>Free and past-due accounts keep non-critical ad slots eligible.</td></tr><tr><td>Webhook freshness</td><td>Provider updates must be newer than stored entitlement state.</td></tr></tbody></table></section>${billingStatusLivePanel}`
  },
  {
    path: 'loyalty/offers/index.html',
    title: 'Loyalty offer tracker — GroceryView',
    description: 'Track GroceryView member-only offers, coupon eligibility, membership requirements, basket impact, and loyalty-price guardrails.',
    body: `<section class="card"><div class="eyebrow">Loyalty</div><h1>Loyalty offer tracker</h1><p class="lede">Review member-only prices, coupon eligibility, and basket impact before loyalty offers affect household savings decisions.</p><div class="grid"><div class="metric"><strong>3</strong><span>active member offers</span></div><div class="metric"><strong>38 SEK</strong><span>eligible savings</span></div><div class="metric"><strong>1</strong><span>needs membership confirmation</span></div></div></section><section class="card" style="margin-top:16px"><h2>Member offer queue</h2><table class="table"><thead><tr><th>Offer</th><th>Chain</th><th>Requirement</th><th>Savings</th><th>Status</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g Stammis price</td><td>ICA</td><td>ICA Stammis linked</td><td>7 SEK</td><td>Eligible</td></tr><tr><td>Coop Medmera dairy coupon</td><td>Coop</td><td>Clip coupon before checkout</td><td>12 SEK</td><td>Needs action</td></tr><tr><td>Willys Plus pantry bundle</td><td>Willys</td><td>Member account verified</td><td>19 SEK</td><td>Ready for basket</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Loyalty guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Separate public shelf price</td><td>Member-only savings never overwrite verified public shelf evidence.</td></tr><tr><td>Confirm membership</td><td>Unlinked programs stay out of basket savings until the household confirms access.</td></tr><tr><td>Coupon action required</td><td>Clip-required offers show an action before checkout routing.</td></tr></tbody></table></section>${loyaltyOffersLivePanel}`
  },
  {
    path: 'loyalty/coupons/index.html',
    title: 'Coupon expiry planner — GroceryView',
    description: 'Plan GroceryView coupon clips by expiry window, basket fit, membership requirement, and shelf-price separation before coupons affect household savings.',
    body: `<section class="card"><div class="eyebrow">Coupons</div><h1>Coupon expiry planner</h1><p class="lede">Prioritize clip-required and expiring coupons without letting member-only savings overwrite public shelf-price evidence.</p><div class="grid"><div class="metric"><strong>5</strong><span>active coupons</span></div><div class="metric"><strong>2</strong><span>expire today</span></div><div class="metric"><strong>31 SEK</strong><span>basket-fit savings</span></div></div></section><section class="card" style="margin-top:16px"><h2>Coupon action queue</h2><table class="table"><thead><tr><th>Coupon</th><th>Chain</th><th>Expires</th><th>Basket fit</th><th>Action</th></tr></thead><tbody><tr><td>Coop Medmera dairy coupon</td><td>Coop</td><td>Today 21:00</td><td>Meal-plan milk line</td><td>Clip before route</td></tr><tr><td>ICA coffee member price</td><td>ICA</td><td>Tomorrow</td><td>Watchlist coffee</td><td>Confirm membership</td></tr><tr><td>Willys pantry bundle</td><td>Willys</td><td>3 days</td><td>Rice and pasta restock</td><td>Add if pantry low</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Coupon guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Expiry visibility</td><td>Coupons expiring within 24 hours show before lower-value offers.</td></tr><tr><td>Basket fit first</td><td>Coupons only count as savings when the household already needs the item.</td></tr><tr><td>Shelf-price separation</td><td>Coupon savings stay separate from verified public shelf prices and Deal Score inputs.</td></tr></tbody></table></section>`
  },
  {
    path: 'meal-plans/index.html',
    title: 'Meal plan builder — GroceryView',
    description: 'Plan GroceryView weekly meals from verified basket prices, household dietary constraints, prep windows, and budget guardrails.',
    body: `<section class="card"><div class="eyebrow">Meal planning</div><h1>Meal plan builder</h1><p class="lede">Turn a weekly grocery basket into planned meals while preserving verified-price budgets, household diet rules, and prep constraints.</p><div class="grid"><div class="metric"><strong>4</strong><span>planned dinners</span></div><div class="metric"><strong>684 SEK</strong><span>verified ingredient spend</span></div><div class="metric"><strong>116 SEK</strong><span>budget buffer</span></div></div></section><section class="card" style="margin-top:16px"><h2>Weekly meal plan</h2><table class="table"><thead><tr><th>Meal</th><th>Key basket items</th><th>Cost</th><th>Household fit</th><th>Status</th></tr></thead><tbody><tr><td>Tuesday pasta bake</td><td>Tomatoes, milk, private-label cheese</td><td>142 SEK</td><td>Vegetarian</td><td>Ready</td></tr><tr><td>Thursday egg bowls</td><td>Eggs, rice, frozen vegetables</td><td>118 SEK</td><td>School lunch staples</td><td>Ready</td></tr><tr><td>Saturday coffee brunch</td><td>Zoégas Coffee 450g, eggs, bread</td><td>176 SEK</td><td>Favorite-store pickup</td><td>Needs coffee promo confirmation</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Planning guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified ingredient costs</td><td>Estimated produce prices cannot reduce the weekly meal budget.</td></tr><tr><td>Diet rules first</td><td>Household restrictions block incompatible recipe swaps before savings are considered.</td></tr><tr><td>Prep window</td><td>Meals requiring long prep stay out of weekday recommendations.</td></tr></tbody></table></section>${mealPlansLivePanel}`
  },
  {
    path: 'pantry/index.html',
    title: 'Pantry inventory — GroceryView',
    description: 'Track GroceryView pantry stock, expiry risk, reorder thresholds, substitution candidates, and budget-safe replenishment actions.',
    body: `<section class="card"><div class="eyebrow">Pantry</div><h1>Pantry inventory</h1><p class="lede">Track household staples already on hand before GroceryView recommends basket additions, swaps, or meal-plan ingredients.</p><div class="grid"><div class="metric"><strong>18</strong><span>tracked pantry items</span></div><div class="metric"><strong>4</strong><span>low-stock staples</span></div><div class="metric"><strong>2</strong><span>expiry risks</span></div></div></section><section class="card" style="margin-top:16px"><h2>Inventory signals</h2><table class="table"><thead><tr><th>Item</th><th>On hand</th><th>Reorder rule</th><th>Basket action</th><th>Status</th></tr></thead><tbody><tr><td>Rice 1kg</td><td>0.3 kg</td><td>Reorder below 0.5 kg</td><td>Add Lidl private-label rice</td><td>Low stock</td></tr><tr><td>Eggs</td><td>4 left</td><td>Needed for meal plan</td><td>Add verified 12-pack deal</td><td>Reorder</td></tr><tr><td>Tomatoes</td><td>2 days fresh</td><td>Use before expiry</td><td>Hold new produce line</td><td>Use first</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Pantry guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Use-on-hand first</td><td>Meal plans consume expiring pantry items before adding duplicate basket lines.</td></tr><tr><td>Verified reorder cost</td><td>Only verified shelf or fresh retailer-page prices can update replenishment budgets.</td></tr><tr><td>Allergen lock</td><td>Substitutions cannot bypass household dietary restrictions.</td></tr></tbody></table></section>${pantryLivePanel}`
  },
  {
    path: 'watchlist/index.html',
    title: 'Price watchlist workbench — GroceryView',
    description: 'GroceryView watchlist workbench for target prices, Deal Score triggers, notification channels, and confidence-safe alert status.',
    body: `<section class="card"><div class="eyebrow">Watchlist</div><h1>Price watchlist workbench</h1><p class="lede">Review target prices, Deal Score triggers, source confidence, and notification readiness before alerts reach a household.</p><div class="grid"><div class="metric"><strong>4</strong><span>tracked staples</span></div><div class="metric"><strong>2</strong><span>alerts ready</span></div><div class="metric"><strong>1</strong><span>held for review</span></div></div></section><section class="card" style="margin-top:16px"><h2>Tracked items</h2><table class="table"><thead><tr><th>Product</th><th>Target</th><th>Current</th><th>Trigger</th><th>Status</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>50 SEK</td><td>49.90 SEK</td><td>Deal Score ≥ 80</td><td>Ready for push</td></tr><tr><td>Butter 600g</td><td>45 SEK</td><td>54.90 SEK</td><td>52-week low</td><td>Watching</td></tr><tr><td>Eggs 12-pack</td><td>35 SEK</td><td>34.90 SEK</td><td>Favorite stores only</td><td>Ready for email</td></tr><tr><td>Loose tomatoes</td><td>29 SEK/kg</td><td>Estimated</td><td>Confidence ≥ 80%</td><td>Held for review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Notification guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied behavior</th></tr></thead><tbody><tr><td>Quiet hours</td><td>Push alerts pause from 21:00 to 07:00.</td></tr><tr><td>Confidence floor</td><td>Estimated prices cannot trigger household notifications.</td></tr><tr><td>Favorite-store scope</td><td>Scoped rules ignore stores outside the household basket set.</td></tr></tbody></table></section>${watchlistLivePanel}`
  },
  {
    path: 'notifications/inbox/index.html',
    title: 'Grocery alert inbox — GroceryView',
    description: 'Review GroceryView alert delivery status, quiet-hours holds, suppressions, dead-letter candidates, and household notification actions.',
    body: `<section class="card"><div class="eyebrow">Notification inbox</div><h1>Grocery alert inbox</h1><p class="lede">Audit delivered, held, and suppressed grocery alerts before households miss price drops or receive noisy notifications.</p><div class="grid"><div class="metric"><strong>2</strong><span>delivered alerts</span></div><div class="metric"><strong>1</strong><span>quiet-hours hold</span></div><div class="metric"><strong>1</strong><span>suppressed provider token</span></div></div></section><section class="card" style="margin-top:16px"><h2>Alert delivery queue</h2><table class="table"><thead><tr><th>Alert</th><th>Channel</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead><tbody><tr><td>Coffee below 50 SEK</td><td>Push</td><td>Delivered</td><td>Verified shelf price</td><td>Open deal</td></tr><tr><td>Eggs favorite-store drop</td><td>Email</td><td>Delivered</td><td>Retailer page confidence</td><td>Open basket</td></tr><tr><td>Receipt review reminder</td><td>Push</td><td>Held</td><td>Quiet hours 21:00-07:00</td><td>Send in digest</td></tr><tr><td>Butter target price</td><td>Push</td><td>Suppressed</td><td>Provider token invalid</td><td>Request device refresh</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Delivery guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Quiet-hours respect</td><td>Non-critical push alerts wait for the morning digest.</td></tr><tr><td>Provider suppression</td><td>Invalid tokens stop future sends until the device refreshes.</td></tr><tr><td>Confidence floor</td><td>Estimated prices never generate household alerts.</td></tr></tbody></table></section>${notificationInboxLivePanel}`
  },
  {
    path: 'nutrition/allergens/index.html',
    title: 'Nutrition and allergen review — GroceryView',
    description: 'Review GroceryView nutrition labels, allergen conflicts, household diet rules, and safe substitution decisions before items enter baskets.',
    body: `<section class="card"><div class="eyebrow">Nutrition</div><h1>Nutrition and allergen review</h1><p class="lede">Check grocery items against household allergen locks, dietary goals, and substitution rules before recommendations reach a basket or meal plan.</p><div class="grid"><div class="metric"><strong>3</strong><span>diet rules active</span></div><div class="metric"><strong>1</strong><span>blocked allergen</span></div><div class="metric"><strong>2</strong><span>safe swaps ready</span></div></div></section><section class="card" style="margin-top:16px"><h2>Diet review queue</h2><table class="table"><thead><tr><th>Item</th><th>Signal</th><th>Household rule</th><th>Decision</th><th>Action</th></tr></thead><tbody><tr><td>Peanut granola</td><td>Contains peanuts</td><td>Nut alert</td><td>Blocked</td><td>Suggest oat granola</td></tr><tr><td>ICA Milk 1L</td><td>Lactose</td><td>Lactose ok</td><td>Allowed</td><td>Keep dairy swap</td></tr><tr><td>Private-label cheese</td><td>Vegetarian label</td><td>Vegetarian household meal</td><td>Needs label check</td><td>Hold meal-plan writeback</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Diet guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Allergen lock</td><td>Blocked allergens outrank price savings and Deal Score.</td></tr><tr><td>Label confidence</td><td>Unverified nutrition labels cannot approve household-safe swaps.</td></tr><tr><td>Meal-plan writeback</td><td>Diet conflicts stop meal-plan and basket updates until reviewed.</td></tr></tbody></table></section>${nutritionValueLivePanel}`
  },
  {
    path: 'household/index.html',
    title: 'Household basket — GroceryView',
    description: 'Shared GroceryView household basket page scaffold with member attribution and shared budget signals.',
    body: `<section class="card" data-groceryview-flow="household"><div class="eyebrow">Household</div><h1>Shared household basket</h1><p class="lede">Coordinate a shared grocery basket with member attribution, merged quantities, and shared budget tracking.</p><div class="grid"><div class="metric"><strong>Member attribution</strong><span>who added each item</span></div><div class="metric"><strong>Shared budget</strong><span>household weekly plan</span></div><div class="metric"><strong>Roles</strong><span>owner and member controls</span></div></div><form class="flow-panel" aria-label="Household rule preview"><label>Approval limit SEK<input name="approvalLimit" type="number" min="0" step="50" value="400" /></label><label>Reviewer<select name="reviewer"><option>Mina</option><option>Alex</option><option>Sam</option></select></label><button type="submit">Preview household rule</button></form><p class="flow-result" data-flow-result="household" aria-live="polite">Current rule: owner approval over 400 SEK.</p></section><section class="card" style="margin-top:16px"><h2>Household rules</h2><table class="table"><thead><tr><th>Member</th><th>Budget</th><th>Approval rule</th><th>Diet</th></tr></thead><tbody><tr><td>Alex</td><td>50%</td><td>Owner approval over 400 SEK</td><td>Vegetarian, lactose ok</td></tr><tr><td>Mina</td><td>35%</td><td>Reviews low-confidence receipts</td><td>No pork, nut alert</td></tr><tr><td>Sam</td><td>15%</td><td>School lunch staples pinned</td><td>Child-friendly swaps</td></tr></tbody></table></section>`
  },
  {
    path: 'privacy/index.html',
    title: 'Privacy controls — GroceryView',
    description: 'GroceryView privacy controls for data export, account deletion, receipt redaction, and ad payload minimization.',
    body: `<section class="card" data-groceryview-flow="privacy"><div class="eyebrow">Privacy</div><h1>Export or delete your data</h1><p class="lede">Download personal data, plan account deletion, and verify advertiser payloads stay aggregated and receipt-safe.</p><div class="grid"><div class="metric"><strong>Export</strong><span>watchlists, budgets, and baskets</span></div><div class="metric"><strong>Delete</strong><span>sensitive rows removed by plan</span></div><div class="metric"><strong>Ads</strong><span>no raw receipt leakage</span></div></div><div class="flow-panel" aria-label="Privacy actions"><button type="button" data-flow-action="download-export">Download export</button><button type="button" data-flow-action="plan-deletion">Plan account deletion</button><button type="button" data-flow-action="check-fulfillment">Check request deadlines</button></div><p class="flow-result" data-flow-result="privacy" aria-live="polite">Privacy actions require re-authentication before live execution.</p></section><section class="card" style="margin-top:16px"><h2>Request fulfillment deadlines</h2><table class="table"><thead><tr><th>Request</th><th>Status</th><th>Deadline state</th></tr></thead><tbody><tr><td>Data export</td><td>In progress</td><td>Overdue review</td></tr><tr><td>Account deletion</td><td>Received</td><td>Due soon</td></tr><tr><td>Ad data opt-out</td><td>Received</td><td>On track</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Control states</h2><table class="table"><thead><tr><th>Setting</th><th>State</th><th>Detail</th></tr></thead><tbody><tr><td>Receipt images</td><td>Auto-delete after review</td><td>7 day retention window</td></tr><tr><td>Location precision</td><td>District only</td><td>Street address hidden from exports</td></tr><tr><td>Price contribution</td><td>Anonymous</td><td>No account identifier in catalog backfill</td></tr></tbody></table></section>`
  },
  {
    path: 'basket/index.html',
    title: 'Weekly basket — GroceryView',
    description: 'GroceryView basket page scaffold for favorite-store comparison, smart swaps, and budget review.',
    body: `<section class="card" data-groceryview-flow="basket"><div class="eyebrow">Basket</div><h1>Weekly basket planner</h1><p class="lede">Compare favorite-store totals, review smart swaps, and keep the weekly grocery plan under budget.</p><div class="grid"><div class="metric"><strong>742 SEK</strong><span>estimated basket total</span></div><div class="metric"><strong>58 SEK</strong><span>weekly budget left</span></div><div class="metric"><strong>3 swaps</strong><span>private-label opportunities</span></div></div><form class="flow-panel" aria-label="Basket quantity preview"><label>Coffee<input name="coffeeQuantity" type="number" min="0" value="1" /></label><label>Milk<input name="milkQuantity" type="number" min="0" value="2" /></label><label>Eggs<input name="eggsQuantity" type="number" min="0" value="1" /></label><button type="submit">Recalculate basket</button><button type="submit" data-flow-action="save-basket-api">Save basket to API</button></form><p class="flow-result" data-flow-result="basket" aria-live="polite">Basket preview uses current favorite-store prices before saving.</p></section><section class="card" style="margin-top:16px"><h2>Basket lines</h2><table class="table"><thead><tr><th>Product</th><th>Best store</th><th>Line total</th></tr></thead><tbody><tr><td>coffee</td><td>Willys Odenplan</td><td>49.90 SEK</td></tr><tr><td>milk</td><td>Lidl Sveavägen</td><td>27.80 SEK</td></tr><tr><td>eggs</td><td>Lidl Sveavägen</td><td>34.90 SEK</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Smart swaps</h2><table class="table"><thead><tr><th>Swap</th><th>Saves</th><th>Rule</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g → Garant Bryggkaffe 450g</td><td>12 SEK</td><td>Same category, verified shelf price</td></tr><tr><td>Arla Milk 1L → ICA Milk 1L</td><td>2 SEK</td><td>Household accepts private label dairy</td></tr></tbody></table></section>`
  },
  {
    path: 'budget/forecast/index.html',
    title: 'Grocery budget forecast — GroceryView',
    description: 'Forecast GroceryView household grocery spend with weekly basket totals, month-end projection, receipt actuals, and over-budget prevention actions.',
    body: `<section class="card"><div class="eyebrow">Budget forecast</div><h1>Grocery budget forecast</h1><p class="lede">Compare planned baskets with receipt actuals, project month-end spend, and choose corrective actions before the household goes over budget.</p><div class="grid"><div class="metric"><strong>742 SEK</strong><span>next basket forecast</span></div><div class="metric"><strong>501 SEK</strong><span>spent this week</span></div><div class="metric"><strong>3 084 SEK</strong><span>month-end projection</span></div></div></section><section class="card" style="margin-top:16px"><h2>Forecast ledger</h2><table class="table"><thead><tr><th>Period</th><th>Budget</th><th>Actual / forecast</th><th>Variance</th><th>Status</th></tr></thead><tbody><tr><td>This week actuals</td><td>800 SEK</td><td>501 SEK</td><td>+299 SEK</td><td>On track</td></tr><tr><td>Next planned basket</td><td>800 SEK</td><td>742 SEK</td><td>+58 SEK</td><td>Needs review</td></tr><tr><td>Month-end projection</td><td>3 200 SEK</td><td>3 084 SEK</td><td>+116 SEK</td><td>On track</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Correction plan</h2><table class="table"><thead><tr><th>Action</th><th>Impact</th><th>Guardrail</th></tr></thead><tbody><tr><td>Apply coffee private-label swap</td><td>Saves 12 SEK</td><td>Requires verified shelf price</td></tr><tr><td>Move eggs to Lidl split basket</td><td>Saves 4 SEK</td><td>Favorite-store only route</td></tr><tr><td>Hold estimated tomato price</td><td>Avoids false saving</td><td>Needs review before forecast credit</td></tr></tbody></table></section>${budgetSummaryLivePanel}`
  },
  {
    path: 'scanner/index.html',
    title: 'Barcode and receipt scanner — GroceryView',
    description: 'GroceryView scanner page scaffold for barcode lookup, receipt parsing, confidence, and manual review.',
    body: `<section class="card" data-groceryview-flow="scanner"><div class="eyebrow">Scanner</div><h1>Barcode and receipt scanner</h1><p class="lede">Scan products and receipts, surface confidence levels, and send uncertain matches to the manual review queue.</p><div class="grid"><div class="metric"><strong>Barcode</strong><span>product lookup and smart swaps</span></div><div class="metric"><strong>Receipt</strong><span>budget impact review</span></div><div class="metric"><strong>Confidence</strong><span>low-confidence review routing</span></div></div><form class="flow-panel" aria-label="Scanner upload preview"><label>Receipt or barcode image<input name="scanImage" type="file" accept="image/*" /></label><button type="submit">Preview upload</button></form><div class="flow-panel" aria-label="Scanner review actions"><button type="button" data-flow-action="check-storage-health">Check upload storage</button><button type="button" data-flow-action="route-review">Route to review</button><button type="button" data-flow-action="mark-matched">Mark matched</button></div><p class="flow-result" data-flow-result="scanner" aria-live="polite">Uploads remain local preview until OCR provider credentials are configured.</p></section><section class="card" style="margin-top:16px"><h2>Upload readiness</h2><table class="table"><thead><tr><th>Dependency</th><th>Ready state</th><th>Customer impact</th></tr></thead><tbody><tr><td>Private scan storage</td><td>Health endpoint confirms configuration</td><td>Receipts and barcodes upload before OCR processing</td></tr><tr><td>Receipt OCR</td><td>Provider checked during processing</td><td>Uncertain rows route to human review</td></tr><tr><td>Barcode lookup</td><td>Provider checked during processing</td><td>Matched products update basket prices</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Review queue</h2><table class="table"><thead><tr><th>Capture</th><th>Status</th><th>Next action</th></tr></thead><tbody><tr><td>Coop Farsta receipt</td><td>Needs human review</td><td>Confirm milk line item and loyalty discount</td></tr><tr><td>Arla Milk barcode</td><td>Matched</td><td>Ready for basket price update</td></tr><tr><td>Loose tomatoes label</td><td>Low confidence</td><td>Route to product matching queue</td></tr></tbody></table></section>`
  },
  {
    path: 'receipts/upload/index.html',
    title: 'Receipt upload intake — GroceryView',
    description: 'Upload receipt captures with storage readiness, OCR routing, privacy retention, and review guardrails before receipt data changes budgets or catalog prices.',
    body: `<section class="card"><div class="eyebrow">Receipt upload</div><h1>Receipt upload intake</h1><p class="lede">Stage receipt captures with storage, OCR, privacy, and review guardrails before line items update household actuals or price history.</p><div class="grid"><div class="metric"><strong>3</strong><span>uploads waiting</span></div><div class="metric"><strong>2</strong><span>OCR-ready captures</span></div><div class="metric"><strong>7 days</strong><span>image retention</span></div></div></section><section class="card" style="margin-top:16px"><h2>Upload intake queue</h2><table class="table"><thead><tr><th>Capture</th><th>Source</th><th>Readiness</th><th>Next step</th></tr></thead><tbody><tr><td>Willys Odenplan receipt</td><td>Mobile upload</td><td>Storage confirmed</td><td>Send to OCR</td></tr><tr><td>Coop Farsta receipt</td><td>Email forward</td><td>Needs crop review</td><td>Ask household to confirm image</td></tr><tr><td>Lidl Sveavägen receipt</td><td>Camera scan</td><td>OCR complete</td><td>Open receipt review desk</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Upload guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Private storage first</td><td>Receipt images are stored privately before OCR or human review starts.</td></tr><tr><td>No direct writeback</td><td>Uploaded captures cannot update budgets, catalog prices, or Deal Score until receipt review approves line matches.</td></tr><tr><td>Retention clock</td><td>Raw receipt images expire after review while structured line evidence remains auditable.</td></tr></tbody></table></section>`
  },
  {
    path: 'receipts/review/index.html',
    title: 'Receipt review desk — GroceryView',
    description: 'Review GroceryView receipt line items by confidence, product match, loyalty discount, budget writeback, and catalog update eligibility.',
    body: `<section class="card"><div class="eyebrow">Receipt review</div><h1>Receipt review desk</h1><p class="lede">Confirm line-item matches, loyalty discounts, and budget writebacks before receipt data updates household spend or catalog prices.</p><div class="grid"><div class="metric"><strong>3</strong><span>receipt lines</span></div><div class="metric"><strong>1</strong><span>needs moderator</span></div><div class="metric"><strong>501 SEK</strong><span>weekly actuals impact</span></div></div></section><section class="card" style="margin-top:16px"><h2>Line-item decisions</h2><table class="table"><thead><tr><th>Line</th><th>Match</th><th>Confidence</th><th>Budget action</th><th>Catalog action</th></tr></thead><tbody><tr><td>Arla Milk 1L</td><td>ARLA-MILK-1L</td><td>98%</td><td>Post to weekly actuals</td><td>Update verified price</td></tr><tr><td>Coop loyalty discount</td><td>receipt discount</td><td>84%</td><td>Apply receipt total only</td><td>No product price update</td></tr><tr><td>Loose tomatoes</td><td>unknown produce</td><td>54%</td><td>Hold from forecast</td><td>Route to human review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Writeback guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Decision</th></tr></thead><tbody><tr><td>Low confidence below 80%</td><td>Cannot update catalog or Deal Score.</td></tr><tr><td>Loyalty discount line</td><td>Impacts receipt total without changing shelf price.</td></tr><tr><td>Verified product match</td><td>Can update household spend and product price history.</td></tr></tbody></table></section>${receiptReviewLivePanel}`
  },
  {
    path: 'admin/human-review/index.html',
    title: 'Human review operations — GroceryView',
    description: 'GroceryView admin page scaffold for human-review assignments, SLA status, reviewer authorization, and decision writebacks.',
    body: `<section class="card"><div class="eyebrow">Operations</div><h1>Human review operations</h1><p class="lede">Review low-confidence product matches and community reports before they can update catalog data.</p><div class="grid"><div class="metric"><strong>breached</strong><span>SLA status</span></div><div class="metric"><strong>2</strong><span>open assignments</span></div><div class="metric"><strong>moderator-owned</strong><span>decision access</span></div></div></section><section class="card" style="margin-top:16px"><h2>Moderator assignments</h2><table class="table"><thead><tr><th>Review</th><th>Priority</th><th>Assignee</th><th>Due</th><th>Action</th></tr></thead><tbody><tr><td>review-match-1</td><td>high</td><td>moderator-1</td><td>SLA breached</td><td>Approve product match</td></tr><tr><td>review-report-1</td><td>medium</td><td>moderator-2</td><td>Due tomorrow</td><td>Keep in review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Decision writeback</h2><p class="lede">Approval writes <strong>approve_product_match</strong>; rejection writes <strong>reject_product_match</strong>; needs-more-info keeps the assignment in progress for a registered reviewer.</p></section>${humanReviewLivePanel}`
  },
  {
    path: 'market/index.html',
    title: 'Stockholm Grocery Market — GroceryView',
    description: 'Stockholm grocery market overview with indices, top movers, and true deals.',
    body: `<section class="card"><div class="eyebrow">Market</div><h1>Stockholm Grocery Market</h1><p class="lede">Top movers, best true deals, and grocery indices for Stockholm.</p><div class="grid"><div class="metric"><strong>101.6</strong><span>Stockholm Grocery Index</span></div><div class="metric"><strong>91.6</strong><span>Coffee Index</span></div><div class="metric"><strong>108.4</strong><span>Dairy Index</span></div></div></section><section class="card" style="margin-top:16px"><div class="eyebrow">Grocery mover board</div><h2>Biggest verified movers</h2><p class="lede">Seeking Alpha-style market tape for staples: current quote, 1M move, 52W position, same-product gap vs Stockholm median, and evidence volume before a shopper acts.</p><table class="table"><thead><tr><th>Product</th><th>Current price</th><th>1M move</th><th>52W position</th><th>Same-product read</th><th>Evidence</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>54.90 SEK verified shelf</td><td>-8.3%</td><td>near 52W low</td><td>5.00 SEK below vs Stockholm median</td><td>31/42 verified observations</td></tr><tr><td>Eggs 12-pack</td><td>34.90 SEK retailer page</td><td>-5.7%</td><td>bottom quartile</td><td>3.10 SEK below vs Stockholm median</td><td>18/23 verified observations</td></tr><tr><td>Butter 600g</td><td>54.90 SEK watchlist</td><td>+4.1%</td><td>middle of 52W range</td><td>2.40 SEK above vs Stockholm median</td><td>12/18 verified observations</td></tr></tbody></table><p class="footer-note">Estimated rows cannot top the mover board; low-confidence prices remain visible only in review surfaces.</p></section><section class="card terminal-live-panel" data-groceryview-flow="market-movers" style="margin-top:16px"><div class="eyebrow">Connected market movers API</div><h2>Pull live grocery mover tape</h2><p class="lede">Fetch <code>/api/market/overview</code> and refresh the market-board leader, 52W position, Stockholm median gap, and verified-history evidence from the live API response.</p><div class="grid" aria-label="Live market mover API metrics"><div class="metric"><strong data-market-movers-leader>Waiting for API pull</strong><span>leader, price, 1M move, median gap</span></div><div class="metric"><strong data-market-movers-range>Static 52W position preview</strong><span>52W range and position</span></div><div class="metric"><strong data-market-movers-evidence>Static evidence preview</strong><span>verified history evidence</span></div></div><div class="flow-panel" aria-label="Connected market mover actions"><button type="button" data-flow-action="load-market-movers">Load live market movers</button></div><p class="flow-result" data-flow-result="market-movers" aria-live="polite">Local preview mode: connect the API session bridge before loading live market movers.</p></section><section class="card" style="margin-top:16px"><h2>Brand-tier indices</h2><p class="lede">Private Label Index, Budget Private Label Index, Premium Brand Index, Organic Brand Index, and National Brand Index separate price pressure by brand tier.</p><div class="grid"><div class="metric"><strong>23.7%</strong><span>private-label savings vs national brands</span></div><div class="metric"><strong>58.8%</strong><span>premium gap vs private label</span></div><div class="metric"><strong>Cleaning</strong><span>highest private-label savings category</span></div></div></section>${marketIndicesLivePanel}`
  },
  {
    path: 'catalog/coverage/index.html',
    title: 'Catalog coverage dashboard — GroceryView',
    description: 'Track GroceryView catalog coverage by category, store, verified price freshness, low-confidence gaps, and backfill actions.',
    body: `<section class="card"><div class="eyebrow">Catalog coverage</div><h1>Catalog coverage dashboard</h1><p class="lede">Monitor which categories and stores have enough verified price evidence before they power deal boards, alerts, or basket forecasts.</p><div class="grid"><div class="metric"><strong>78%</strong><span>overall coverage</span></div><div class="metric"><strong>14</strong><span>verified gaps</span></div><div class="metric"><strong>6</strong><span>backfill actions</span></div></div></section><section class="card" style="margin-top:16px"><h2>Coverage by category</h2><table class="table"><thead><tr><th>Category</th><th>Products tracked</th><th>Verified coverage</th><th>Freshness</th><th>Gap action</th></tr></thead><tbody><tr><td>Coffee</td><td>18</td><td>89%</td><td>Fresh today</td><td>Keep monitoring</td></tr><tr><td>Dairy</td><td>24</td><td>81%</td><td>Fresh today</td><td>Backfill member prices</td></tr><tr><td>Produce</td><td>31</td><td>62%</td><td>Mixed</td><td>Route receipt photos to review</td></tr><tr><td>Pantry</td><td>42</td><td>74%</td><td>Fresh this week</td><td>Parse missing unit prices</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Backfill guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified freshness window</td><td>Stale rows can display but cannot trigger alerts.</td></tr><tr><td>Low-confidence produce</td><td>Receipt photos need human review before catalog writeback.</td></tr><tr><td>Unit-price completeness</td><td>Products without unit prices cannot rank category savings.</td></tr></tbody></table></section>${catalogCoverageLivePanel}`
  },
  {
    path: 'retailers/freshness/index.html',
    title: 'Retailer freshness monitor — GroceryView',
    description: 'Monitor GroceryView retailer scrape freshness, parser health, stale catalog rows, and alert eligibility by chain.',
    body: `<section class="card"><div class="eyebrow">Retailer freshness</div><h1>Retailer freshness monitor</h1><p class="lede">Review chain-level scrape freshness and parser health before retailer-page observations update deals, alerts, or basket totals.</p><div class="grid"><div class="metric"><strong>4</strong><span>chains monitored</span></div><div class="metric"><strong>1</strong><span>stale parser feed</span></div><div class="metric"><strong>93%</strong><span>fresh eligible rows</span></div></div></section><section class="card" style="margin-top:16px"><h2>Freshness by retailer</h2><table class="table"><thead><tr><th>Retailer</th><th>Last scrape</th><th>Parser health</th><th>Eligible rows</th><th>Action</th></tr></thead><tbody><tr><td>Willys</td><td>2026-05-20 07:45</td><td>Healthy</td><td>94%</td><td>Keep publishing</td></tr><tr><td>ICA</td><td>2026-05-20 07:30</td><td>Healthy</td><td>91%</td><td>Backfill loyalty labels</td></tr><tr><td>Coop</td><td>2026-05-19 18:20</td><td>Stale feed</td><td>73%</td><td>Pause new alerts</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Freshness guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Alert freshness</td><td>Stale retailer-page rows cannot trigger household notifications.</td></tr><tr><td>Parser health</td><td>Parser failures keep old prices visible but exclude them from Deal Score updates.</td></tr><tr><td>Chain labels</td><td>Member-only and promotion labels must survive parser backfills.</td></tr></tbody></table></section>${priceFreshnessLivePanel}`
  },
  {
    path: 'routes/shopping/index.html',
    title: 'Shopping route planner — GroceryView',
    description: 'Plan GroceryView shopping stops from favorite-store baskets, pickup windows, split-basket savings, and travel guardrails.',
    body: `<section class="card"><div class="eyebrow">Shopping route</div><h1>Shopping route planner</h1><p class="lede">Turn verified basket decisions into ordered store stops while keeping travel convenience separate from Deal Score and shelf-price evidence.</p><div class="grid"><div class="metric"><strong>3</strong><span>planned stops</span></div><div class="metric"><strong>44 SEK</strong><span>split-basket savings</span></div><div class="metric"><strong>28 min</strong><span>estimated route time</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ordered stops</h2><table class="table"><thead><tr><th>Stop</th><th>Store</th><th>Basket role</th><th>Pickup note</th><th>Action</th></tr></thead><tbody><tr><td>1</td><td>Willys Odenplan</td><td>Coffee and pantry</td><td>Primary weekly basket</td><td>Buy verified coffee promo</td></tr><tr><td>2</td><td>Lidl Sveavägen</td><td>Eggs and dairy</td><td>Split basket stop</td><td>Pick up eggs and milk</td></tr><tr><td>3</td><td>Hemköp T-Centralen</td><td>Convenience top-up</td><td>Small-basket only</td><td>Skip unless pantry rice is out</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Route guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>No travel penalty in Deal Score</td><td>Route time can reorder stops but cannot change product deal ranking.</td></tr><tr><td>Pickup windows</td><td>Closed or pickup-limited stores stay out of active checkout plans.</td></tr><tr><td>Low-confidence rows</td><td>Unverified prices cannot justify an extra route stop.</td></tr></tbody></table></section>${routePlanLivePanel}`
  },
  {
    path: 'prices/anomalies/index.html',
    title: 'Price anomaly review — GroceryView',
    description: 'Review GroceryView price spikes, drops, parser outliers, confidence holds, and anomaly decisions before they affect deals or alerts.',
    body: `<section class="card"><div class="eyebrow">Price anomalies</div><h1>Price anomaly review</h1><p class="lede">Inspect suspicious grocery price changes before spikes, drops, or parser outliers can influence deal boards, watchlists, or basket totals.</p><div class="grid"><div class="metric"><strong>4</strong><span>open anomalies</span></div><div class="metric"><strong>2</strong><span>held from alerts</span></div><div class="metric"><strong>1</strong><span>parser rollback</span></div></div></section><section class="card" style="margin-top:16px"><h2>Anomaly queue</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Signal</th><th>Evidence</th><th>Decision</th></tr></thead><tbody><tr><td>Butter 600g</td><td>Coop Farsta</td><td>42% overnight spike</td><td>Parser changed package size</td><td>Hold from Deal Score</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Sveavägen</td><td>18% price drop</td><td>Fresh retailer page</td><td>Allow alert</td></tr><tr><td>Tomatoes kg</td><td>Willys Odenplan</td><td>Missing unit price</td><td>Low-confidence OCR</td><td>Route to review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Anomaly guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Spike quarantine</td><td>Outlier spikes cannot update Deal Score until package size and unit price are verified.</td></tr><tr><td>Drop verification</td><td>Large price drops require fresh retailer-page or receipt evidence before alerts send.</td></tr><tr><td>Rollback visibility</td><td>Parser rollbacks keep prior verified shelf prices visible with an anomaly label.</td></tr></tbody></table></section>`
  },
  {
    path: 'prices/confidence/index.html',
    title: 'Price confidence guide — GroceryView',
    description: 'Explain GroceryView price confidence labels, source types, Deal Score eligibility, and user-facing trust decisions.',
    body: `<section class="card"><div class="eyebrow">Price confidence</div><h1>Price confidence guide</h1><p class="lede">Understand how verified shelf, retailer-page, member, estimated, and low-confidence prices appear across deal boards and basket decisions.</p><div class="grid"><div class="metric"><strong>Verified</strong><span>can affect Deal Score</span></div><div class="metric"><strong>Estimated</strong><span>display only</span></div><div class="metric"><strong>Low</strong><span>review required</span></div></div></section><section class="card" style="margin-top:16px"><h2>Confidence labels</h2><table class="table"><thead><tr><th>Label</th><th>Source</th><th>Deal Score</th><th>User copy</th></tr></thead><tbody><tr><td>Verified shelf</td><td>Shelf photo or audited retailer page</td><td>Eligible</td><td>Official shelf evidence</td></tr><tr><td>Retailer page</td><td>Parsed public retailer page</td><td>Eligible when fresh</td><td>Retailer-page confidence</td></tr><tr><td>Member-only</td><td>Loyalty price or coupon</td><td>Separated</td><td>Requires membership context</td></tr><tr><td>Estimated</td><td>Model or stale observation</td><td>Ineligible</td><td>Estimate, do not rank</td></tr><tr><td>Low confidence</td><td>OCR or match uncertainty</td><td>Ineligible</td><td>Needs review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Trust decisions</h2><table class="table"><thead><tr><th>Decision</th><th>Rule</th></tr></thead><tbody><tr><td>Show in product page</td><td>All labels can appear with source metadata.</td></tr><tr><td>Trigger household alert</td><td>Only verified or fresh retailer-page prices can alert.</td></tr><tr><td>Rank in deal board</td><td>Estimated and low-confidence rows are excluded.</td></tr></tbody></table></section>${priceConfidenceLivePanel}`
  },
  {
    path: 'deals/today/index.html',
    title: 'Today’s best grocery deals — GroceryView',
    description: 'Daily GroceryView deal board with Deal Score, source confidence, savings, and recommended shopper actions.',
    body: `<section class="card"><div class="eyebrow">Daily deal board</div><h1>Today’s best grocery deals</h1><p class="lede">Prioritize verified discounts with strong Deal Scores, clear source confidence, and practical shopping actions.</p><div class="grid"><div class="metric"><strong>82</strong><span>top Deal Score</span></div><div class="metric"><strong>3</strong><span>verified deal rows</span></div><div class="metric"><strong>44 SEK</strong><span>basket savings</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ranked deal actions</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Deal Score</th><th>Confidence</th><th>Action</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Willys Odenplan</td><td>82</td><td>Verified shelf</td><td>Buy two for this week</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Sveavägen</td><td>76</td><td>Retailer page</td><td>Add to split basket</td></tr><tr><td>Garant Bryggkaffe 450g</td><td>Willys Odenplan</td><td>73</td><td>Verified shelf</td><td>Use as private-label swap</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Deal guardrails</h2><table class="table"><thead><tr><th>Rule</th><th>Why it matters</th></tr></thead><tbody><tr><td>Ads excluded from ranking</td><td>Sponsored placements cannot increase Deal Score.</td></tr><tr><td>Estimated rows held back</td><td>Low-confidence prices must be reviewed before appearing as top deals.</td></tr><tr><td>Member prices labeled</td><td>Loyalty-only offers are separated from public shelf prices.</td></tr></tbody></table></section>${dailyDealsLivePanel}`
  },
  {
    path: 'savings/ledger/index.html',
    title: 'Savings ledger — GroceryView',
    description: 'Track GroceryView realized savings from verified receipts, pending forecasts, rejected estimates, and household budget impact.',
    body: `<section class="card"><div class="eyebrow">Savings ledger</div><h1>Savings ledger</h1><p class="lede">Separate receipt-confirmed savings from forecasted, loyalty-only, or low-confidence savings before they update household budget history.</p><div class="grid"><div class="metric"><strong>96 SEK</strong><span>confirmed this week</span></div><div class="metric"><strong>18 SEK</strong><span>forecast pending</span></div><div class="metric"><strong>12 SEK</strong><span>rejected estimate</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ledger entries</h2><table class="table"><thead><tr><th>Source</th><th>Savings</th><th>Evidence</th><th>Budget writeback</th><th>Status</th></tr></thead><tbody><tr><td>Willys coffee promo</td><td>24 SEK</td><td>Verified receipt</td><td>Post to weekly actuals</td><td>Confirmed</td></tr><tr><td>Lidl split basket eggs</td><td>16 SEK</td><td>Retailer page and receipt</td><td>Post to weekly actuals</td><td>Confirmed</td></tr><tr><td>Estimated tomato swap</td><td>12 SEK</td><td>Low-confidence estimate</td><td>No writeback</td><td>Rejected</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Savings guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Receipt confirmation</td><td>Only verified receipts can move forecast savings into realized savings.</td></tr><tr><td>Estimate rejection</td><td>Low-confidence prices cannot increase savings totals.</td></tr><tr><td>Loyalty separation</td><td>Member-only savings stay labeled until access is confirmed.</td></tr></tbody></table></section>${savingsLedgerLivePanel}`
  },
  {
    path: 'savings/smart-swaps/index.html',
    title: 'Smart grocery swaps — GroceryView',
    description: 'Compare GroceryView smart swaps by savings, equivalence rule, household fit, source confidence, and budget impact.',
    body: `<section class="card"><div class="eyebrow">Smart swaps</div><h1>Smart grocery swaps</h1><p class="lede">Review substitute recommendations that save money while respecting product equivalence, household constraints, and verified-price requirements.</p><div class="grid"><div class="metric"><strong>3</strong><span>swap candidates</span></div><div class="metric"><strong>18 SEK</strong><span>weekly savings</span></div><div class="metric"><strong>0</strong><span>diet conflicts</span></div></div></section><section class="card" style="margin-top:16px"><h2>Swap candidates</h2><table class="table"><thead><tr><th>Current item</th><th>Suggested swap</th><th>Saves</th><th>Equivalence</th><th>Decision</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Garant Bryggkaffe 450g</td><td>12 SEK</td><td>Same roast category and pack size</td><td>Recommend</td></tr><tr><td>Arla Milk 1L</td><td>ICA Milk 1L</td><td>2 SEK</td><td>Same fat level and chilled dairy</td><td>Recommend</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Eggs 12-pack</td><td>4 SEK</td><td>Same pack size</td><td>Recommend in split basket</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Swap guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified price required</td><td>Estimated swap prices cannot reduce forecast spend.</td></tr><tr><td>Household diet first</td><td>Dietary restrictions outrank savings.</td></tr><tr><td>No travel penalty</td><td>Distance is shown separately and does not hide cheapest valid swaps.</td></tr></tbody></table></section>${smartSwapsLivePanel}`
  },
  {
    path: 'products/coffee/index.html',
    title: 'ZOEGAS-COFFEE-450G price history — GroceryView',
    description: 'Zoégas Coffee 450g price ticker with current prices, price history, and Deal Score.',
    body: `${productTerminalSections}${productTerminalLivePanel}${productPriceTable}${productPriceGuardrails}`
  },
  {
    path: 'stores/willys-odenplan/index.html',
    title: 'Willys Odenplan store deals — GroceryView',
    description: 'Willys Odenplan profile with deal score, price level, and best categories.',
    body: `<section class="card"><div class="eyebrow">Store</div><h1>Willys Odenplan</h1><p class="lede">Favorite-store profile for Odenplan grocery deals.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score Today</span></div><div class="metric"><strong>-12%</strong><span>vs Stockholm average</span></div><div class="metric"><strong>Coffee</strong><span>Best category</span></div></div></section><section class="card" style="margin-top:16px"><h2>Store highlights</h2><table class="table"><thead><tr><th>Category</th><th>Signal</th><th>Confidence</th></tr></thead><tbody><tr><td>Coffee</td><td>-12% vs Stockholm average</td><td>Verified shelf</td></tr><tr><td>Milk</td><td>Competitive family basket line</td><td>Retailer page</td></tr><tr><td>Butter</td><td>Watchlist only, above usual price</td><td>Estimated</td></tr></tbody></table></section>${storeDealsLivePanel}`
  },
  {
    path: 'stores/compare/index.html',
    title: 'Compare Stockholm grocery stores — GroceryView',
    description: 'Compare Stockholm grocery stores by basket total, verified price coverage, confidence risk, best category, and weekly shopper fit.',
    body: `<section class="card"><div class="eyebrow">Store comparison</div><h1>Compare Stockholm stores</h1><p class="lede">Rank favorite stores by verified basket total, coverage, low-confidence risk, and category strengths before choosing a weekly shop.</p><div class="grid"><div class="metric"><strong>Willys</strong><span>best coffee coverage</span></div><div class="metric"><strong>Lidl</strong><span>lowest basket total</span></div><div class="metric"><strong>Coop</strong><span>review before checkout</span></div></div></section><section class="card" style="margin-top:16px"><h2>Favorite-store comparison</h2><table class="table"><thead><tr><th>Store</th><th>Basket total</th><th>Verified coverage</th><th>Low-confidence rows</th><th>Best category</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>742 SEK</td><td>82%</td><td>2</td><td>Coffee</td></tr><tr><td>Lidl Sveavägen</td><td>729 SEK</td><td>76%</td><td>3</td><td>Eggs and dairy</td></tr><tr><td>Coop Farsta</td><td>781 SEK</td><td>68%</td><td>5</td><td>Member promos</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Decision notes</h2><table class="table"><thead><tr><th>Store</th><th>Recommended use</th><th>Trust guardrail</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>Primary weekly basket when coffee is in stock</td><td>Verified shelf and retailer-page rows agree</td></tr><tr><td>Lidl Sveavägen</td><td>Cheapest split basket for dairy and eggs</td><td>Confirm flyer-only promotions before routing</td></tr><tr><td>Coop Farsta</td><td>Use for member promos after review</td><td>Low-confidence receipt rows stay out of Deal Score</td></tr></tbody></table></section>${storeComparisonLivePanel}`
  },
  {
    path: 'stores/map/index.html',
    title: 'Stockholm store map — GroceryView',
    description: 'Browse nearby Stockholm grocery stores by district, basket fit, verified coverage, confidence risk, and pickup notes.',
    body: `<section class="card"><div class="eyebrow">Store map</div><h1>Stockholm store map</h1><p class="lede">Choose nearby stores by district, verified price coverage, basket fit, and confidence risk before planning a shopping route.</p><div class="grid"><div class="metric"><strong>5</strong><span>mapped stores</span></div><div class="metric"><strong>82%</strong><span>best verified coverage</span></div><div class="metric"><strong>2</strong><span>pickup-ready baskets</span></div></div></section><section class="card" style="margin-top:16px"><h2>District store list</h2><table class="table"><thead><tr><th>Store</th><th>District</th><th>Basket fit</th><th>Coverage</th><th>Pickup note</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>Vasastan</td><td>Coffee and pantry</td><td>82%</td><td>Primary weekly basket</td></tr><tr><td>Lidl Sveavägen</td><td>Norrmalm</td><td>Eggs and dairy</td><td>76%</td><td>Split basket stop</td></tr><tr><td>ICA Kvantum Liljeholmen</td><td>Liljeholmen</td><td>Milk and produce</td><td>74%</td><td>Transit-friendly backup</td></tr><tr><td>Coop Farsta</td><td>Farsta</td><td>Member promos</td><td>68%</td><td>Review loyalty rows first</td></tr><tr><td>Hemköp T-Centralen</td><td>Norrmalm</td><td>Convenience top-up</td><td>71%</td><td>Small-basket only</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Map guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>No travel-time penalty in Deal Score</td><td>Map distance informs route planning but never changes product deal ranking.</td></tr><tr><td>Coverage shown beside fit</td><td>Low-coverage stores need review before becoming default basket routes.</td></tr><tr><td>Pickup notes separate from prices</td><td>Operational notes cannot overwrite verified shelf or retailer-page evidence.</td></tr></tbody></table></section>${storeMapLivePanel}`
  },
  {
    path: 'categories/coffee/index.html',
    title: 'Coffee deals in Stockholm — GroceryView',
    description: 'Coffee category page with price index, top deals, and percentile signals.',
    body: `<section class="card"><div class="eyebrow">Category</div><h1>Stockholm Coffee Deals</h1><p class="lede">Coffee Index is at 91.6 with strong current promotions.</p><div class="grid"><div class="metric"><strong>-8.4%</strong><span>1M move</span></div><div class="metric"><strong>12th</strong><span>Historical percentile</span></div><div class="metric"><strong>Zoégas</strong><span>Top deal</span></div></div></section><section class="card" style="margin-top:16px"><h2>Category signals</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Price</th><th>Signal</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Willys Odenplan</td><td>49.90 SEK</td><td>12th historical percentile</td></tr><tr><td>Garant Bryggkaffe 450g</td><td>Willys Odenplan</td><td>37.90 SEK</td><td>Private-label swap candidate</td></tr><tr><td>Arvid Nordquist 500g</td><td>Coop Farsta</td><td>59.90 SEK</td><td>Watchlist only</td></tr></tbody></table></section>${categoryMarketLivePanel}`
  }
];

export async function buildStaticPages(root) {
  const written = [];
  for (const page of pages) {
    const destination = join(root, page.path);
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, layout(page));
    written.push(page.path);
  }
  return written;
}
