import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const flowScript = `<script>
window.GroceryViewFlowActions = (() => {
  const formatSek = (value) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
  const formatPreciseSek = (value) => Number.isFinite(Number(value))
    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))
    : 'unknown price';
  const setResult = (flow, message) => {
    const target = document.querySelector('[data-flow-result="' + flow + '"]');
    if (target) target.textContent = message;
  };
  const setProductTerminalMetric = (metric, message) => {
    const target = document.querySelector('[data-product-terminal-' + metric + ']');
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
      const historyMessage = payload.historySummary?.isNewLow ? 'new 52-week low signal' : 'history loaded';

      setProductTerminalMetric('quote', bestPrice + ' at ' + bestStore);
      if (stockholm) {
        setProductTerminalMetric('stockholm', stockholm.label + ': median ' + formatPreciseSek(stockholm.median) + ', current percentile ' + stockholm.currentPercentile + ', sample ' + stockholm.sampleSize + '.');
      }
      if (local) {
        setProductTerminalMetric('local', local.label + ': median ' + formatPreciseSek(local.median) + ', ' + (local.customerRead || 'local distribution loaded') + '.');
      }
      setProductTerminalMetric('chart', chartSeriesCount + ' chart series · ' + historyPointCount + ' history points · ' + historyMessage + '.');
      const stockholmSummary = stockholm ? stockholm.label + ' median ' + formatPreciseSek(stockholm.median) : 'distribution unavailable';
      setResult('product-terminal', 'Connected product terminal loaded: ' + bestPrice + ' at ' + bestStore + ' · ' + stockholmSummary + ' · ' + chartSeriesCount + ' chart series.');
    } catch (error) {
      setResult('product-terminal', 'Product terminal API load failed: ' + error.message + '. Static evidence remains visible.');
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
      if (flow === 'privacy' && action === 'download-export') {
        await loadPrivacyExportFromApi();
        return;
      }
      if (flow === 'privacy' && action === 'plan-deletion') {
        await loadDeletionPlanFromApi();
        return;
      }
      if (flow === 'product-terminal' && action === 'load-product-terminal') {
        await loadProductTerminalFromApi(button);
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
  <section class="card terminal-live-panel" data-groceryview-flow="product-terminal" data-product-id="coffee" style="margin-top:16px"><div class="eyebrow">Connected product terminal API</div><h2>Pull current API terminal numbers</h2><p class="lede">Use the API session bridge to fetch <code>/api/products/coffee/terminal</code> and refresh the customer-facing quote, Stockholm/local distribution, history evidence, and chart-series counts from the live API response.</p><div class="grid" aria-label="Live product terminal API metrics"><div class="metric"><strong data-product-terminal-quote>Waiting for API pull</strong><span>best API quote</span></div><div class="metric"><strong data-product-terminal-stockholm>Static Stockholm preview</strong><span>whole-city distribution</span></div><div class="metric"><strong data-product-terminal-chart>Static chart preview</strong><span>chart series and history</span></div></div><p class="footer-note" data-product-terminal-local>Local area distribution updates after the API pull.</p><div class="flow-panel" aria-label="Connected product terminal actions"><button type="button" data-flow-action="load-product-terminal">Load live terminal numbers</button></div><p class="flow-result" data-flow-result="product-terminal" aria-live="polite">Local preview mode: connect the API session bridge before loading live product terminal numbers.</p></section>`;

const productPriceGuardrails = `
  <section class="card" style="margin-top:16px"><h2>Price evidence guardrails</h2><table class="table"><thead><tr><th>Signal</th><th>Displayed behavior</th></tr></thead><tbody><tr><td>Verified shelf or retailer page</td><td>Can contribute to current price, Deal Score, and basket totals.</td></tr><tr><td>Member or promotion price</td><td>Shown with explicit loyalty or campaign label before shoppers act.</td></tr><tr><td>Estimated or low-confidence row</td><td>Marked unverified and excluded from official shelf-price claims.</td></tr></tbody></table></section>`;

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
    path: 'billing/status/index.html',
    title: 'Billing status — GroceryView',
    description: 'Review GroceryView subscription entitlement, checkout requirement, ad removal state, billing issue actions, and provider webhook status.',
    body: `<section class="card"><div class="eyebrow">Billing</div><h1>Billing status</h1><p class="lede">Audit subscription entitlement, checkout enforcement, ad removal, and provider webhook state before premium features are shown.</p><div class="grid"><div class="metric"><strong>Premium</strong><span>active entitlement</span></div><div class="metric"><strong>Ads off</strong><span>non-critical slots removed</span></div><div class="metric"><strong>0</strong><span>billing blockers</span></div></div></section><section class="card" style="margin-top:16px"><h2>Entitlement state</h2><table class="table"><thead><tr><th>Account</th><th>Plan</th><th>Status</th><th>Checkout</th><th>Action</th></tr></thead><tbody><tr><td>Household workspace</td><td>premium_monthly</td><td>Active</td><td>Not required</td><td>Show manage subscription</td></tr><tr><td>Solo price watch</td><td>free</td><td>No entitlement</td><td>Required</td><td>Show upgrade</td></tr><tr><td>Reviewer desk</td><td>premium_yearly</td><td>Past due</td><td>Required</td><td>Show billing issue</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Billing guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Fail closed</td><td>Missing or past-due entitlements keep checkout required.</td></tr><tr><td>Ads removed only for premium</td><td>Free and past-due accounts keep non-critical ad slots eligible.</td></tr><tr><td>Webhook freshness</td><td>Provider updates must be newer than stored entitlement state.</td></tr></tbody></table></section>`
  },
  {
    path: 'loyalty/offers/index.html',
    title: 'Loyalty offer tracker — GroceryView',
    description: 'Track GroceryView member-only offers, coupon eligibility, membership requirements, basket impact, and loyalty-price guardrails.',
    body: `<section class="card"><div class="eyebrow">Loyalty</div><h1>Loyalty offer tracker</h1><p class="lede">Review member-only prices, coupon eligibility, and basket impact before loyalty offers affect household savings decisions.</p><div class="grid"><div class="metric"><strong>3</strong><span>active member offers</span></div><div class="metric"><strong>38 SEK</strong><span>eligible savings</span></div><div class="metric"><strong>1</strong><span>needs membership confirmation</span></div></div></section><section class="card" style="margin-top:16px"><h2>Member offer queue</h2><table class="table"><thead><tr><th>Offer</th><th>Chain</th><th>Requirement</th><th>Savings</th><th>Status</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g Stammis price</td><td>ICA</td><td>ICA Stammis linked</td><td>7 SEK</td><td>Eligible</td></tr><tr><td>Coop Medmera dairy coupon</td><td>Coop</td><td>Clip coupon before checkout</td><td>12 SEK</td><td>Needs action</td></tr><tr><td>Willys Plus pantry bundle</td><td>Willys</td><td>Member account verified</td><td>19 SEK</td><td>Ready for basket</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Loyalty guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Separate public shelf price</td><td>Member-only savings never overwrite verified public shelf evidence.</td></tr><tr><td>Confirm membership</td><td>Unlinked programs stay out of basket savings until the household confirms access.</td></tr><tr><td>Coupon action required</td><td>Clip-required offers show an action before checkout routing.</td></tr></tbody></table></section>`
  },
  {
    path: 'meal-plans/index.html',
    title: 'Meal plan builder — GroceryView',
    description: 'Plan GroceryView weekly meals from verified basket prices, household dietary constraints, prep windows, and budget guardrails.',
    body: `<section class="card"><div class="eyebrow">Meal planning</div><h1>Meal plan builder</h1><p class="lede">Turn a weekly grocery basket into planned meals while preserving verified-price budgets, household diet rules, and prep constraints.</p><div class="grid"><div class="metric"><strong>4</strong><span>planned dinners</span></div><div class="metric"><strong>684 SEK</strong><span>verified ingredient spend</span></div><div class="metric"><strong>116 SEK</strong><span>budget buffer</span></div></div></section><section class="card" style="margin-top:16px"><h2>Weekly meal plan</h2><table class="table"><thead><tr><th>Meal</th><th>Key basket items</th><th>Cost</th><th>Household fit</th><th>Status</th></tr></thead><tbody><tr><td>Tuesday pasta bake</td><td>Tomatoes, milk, private-label cheese</td><td>142 SEK</td><td>Vegetarian</td><td>Ready</td></tr><tr><td>Thursday egg bowls</td><td>Eggs, rice, frozen vegetables</td><td>118 SEK</td><td>School lunch staples</td><td>Ready</td></tr><tr><td>Saturday coffee brunch</td><td>Zoégas Coffee 450g, eggs, bread</td><td>176 SEK</td><td>Favorite-store pickup</td><td>Needs coffee promo confirmation</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Planning guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified ingredient costs</td><td>Estimated produce prices cannot reduce the weekly meal budget.</td></tr><tr><td>Diet rules first</td><td>Household restrictions block incompatible recipe swaps before savings are considered.</td></tr><tr><td>Prep window</td><td>Meals requiring long prep stay out of weekday recommendations.</td></tr></tbody></table></section>`
  },
  {
    path: 'pantry/index.html',
    title: 'Pantry inventory — GroceryView',
    description: 'Track GroceryView pantry stock, expiry risk, reorder thresholds, substitution candidates, and budget-safe replenishment actions.',
    body: `<section class="card"><div class="eyebrow">Pantry</div><h1>Pantry inventory</h1><p class="lede">Track household staples already on hand before GroceryView recommends basket additions, swaps, or meal-plan ingredients.</p><div class="grid"><div class="metric"><strong>18</strong><span>tracked pantry items</span></div><div class="metric"><strong>4</strong><span>low-stock staples</span></div><div class="metric"><strong>2</strong><span>expiry risks</span></div></div></section><section class="card" style="margin-top:16px"><h2>Inventory signals</h2><table class="table"><thead><tr><th>Item</th><th>On hand</th><th>Reorder rule</th><th>Basket action</th><th>Status</th></tr></thead><tbody><tr><td>Rice 1kg</td><td>0.3 kg</td><td>Reorder below 0.5 kg</td><td>Add Lidl private-label rice</td><td>Low stock</td></tr><tr><td>Eggs</td><td>4 left</td><td>Needed for meal plan</td><td>Add verified 12-pack deal</td><td>Reorder</td></tr><tr><td>Tomatoes</td><td>2 days fresh</td><td>Use before expiry</td><td>Hold new produce line</td><td>Use first</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Pantry guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Use-on-hand first</td><td>Meal plans consume expiring pantry items before adding duplicate basket lines.</td></tr><tr><td>Verified reorder cost</td><td>Only verified shelf or fresh retailer-page prices can update replenishment budgets.</td></tr><tr><td>Allergen lock</td><td>Substitutions cannot bypass household dietary restrictions.</td></tr></tbody></table></section>`
  },
  {
    path: 'watchlist/index.html',
    title: 'Price watchlist workbench — GroceryView',
    description: 'GroceryView watchlist workbench for target prices, Deal Score triggers, notification channels, and confidence-safe alert status.',
    body: `<section class="card"><div class="eyebrow">Watchlist</div><h1>Price watchlist workbench</h1><p class="lede">Review target prices, Deal Score triggers, source confidence, and notification readiness before alerts reach a household.</p><div class="grid"><div class="metric"><strong>4</strong><span>tracked staples</span></div><div class="metric"><strong>2</strong><span>alerts ready</span></div><div class="metric"><strong>1</strong><span>held for review</span></div></div></section><section class="card" style="margin-top:16px"><h2>Tracked items</h2><table class="table"><thead><tr><th>Product</th><th>Target</th><th>Current</th><th>Trigger</th><th>Status</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>50 SEK</td><td>49.90 SEK</td><td>Deal Score ≥ 80</td><td>Ready for push</td></tr><tr><td>Butter 600g</td><td>45 SEK</td><td>54.90 SEK</td><td>52-week low</td><td>Watching</td></tr><tr><td>Eggs 12-pack</td><td>35 SEK</td><td>34.90 SEK</td><td>Favorite stores only</td><td>Ready for email</td></tr><tr><td>Loose tomatoes</td><td>29 SEK/kg</td><td>Estimated</td><td>Confidence ≥ 80%</td><td>Held for review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Notification guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied behavior</th></tr></thead><tbody><tr><td>Quiet hours</td><td>Push alerts pause from 21:00 to 07:00.</td></tr><tr><td>Confidence floor</td><td>Estimated prices cannot trigger household notifications.</td></tr><tr><td>Favorite-store scope</td><td>Scoped rules ignore stores outside the household basket set.</td></tr></tbody></table></section>`
  },
  {
    path: 'notifications/inbox/index.html',
    title: 'Grocery alert inbox — GroceryView',
    description: 'Review GroceryView alert delivery status, quiet-hours holds, suppressions, dead-letter candidates, and household notification actions.',
    body: `<section class="card"><div class="eyebrow">Notification inbox</div><h1>Grocery alert inbox</h1><p class="lede">Audit delivered, held, and suppressed grocery alerts before households miss price drops or receive noisy notifications.</p><div class="grid"><div class="metric"><strong>2</strong><span>delivered alerts</span></div><div class="metric"><strong>1</strong><span>quiet-hours hold</span></div><div class="metric"><strong>1</strong><span>suppressed provider token</span></div></div></section><section class="card" style="margin-top:16px"><h2>Alert delivery queue</h2><table class="table"><thead><tr><th>Alert</th><th>Channel</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead><tbody><tr><td>Coffee below 50 SEK</td><td>Push</td><td>Delivered</td><td>Verified shelf price</td><td>Open deal</td></tr><tr><td>Eggs favorite-store drop</td><td>Email</td><td>Delivered</td><td>Retailer page confidence</td><td>Open basket</td></tr><tr><td>Receipt review reminder</td><td>Push</td><td>Held</td><td>Quiet hours 21:00-07:00</td><td>Send in digest</td></tr><tr><td>Butter target price</td><td>Push</td><td>Suppressed</td><td>Provider token invalid</td><td>Request device refresh</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Delivery guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Quiet-hours respect</td><td>Non-critical push alerts wait for the morning digest.</td></tr><tr><td>Provider suppression</td><td>Invalid tokens stop future sends until the device refreshes.</td></tr><tr><td>Confidence floor</td><td>Estimated prices never generate household alerts.</td></tr></tbody></table></section>`
  },
  {
    path: 'nutrition/allergens/index.html',
    title: 'Nutrition and allergen review — GroceryView',
    description: 'Review GroceryView nutrition labels, allergen conflicts, household diet rules, and safe substitution decisions before items enter baskets.',
    body: `<section class="card"><div class="eyebrow">Nutrition</div><h1>Nutrition and allergen review</h1><p class="lede">Check grocery items against household allergen locks, dietary goals, and substitution rules before recommendations reach a basket or meal plan.</p><div class="grid"><div class="metric"><strong>3</strong><span>diet rules active</span></div><div class="metric"><strong>1</strong><span>blocked allergen</span></div><div class="metric"><strong>2</strong><span>safe swaps ready</span></div></div></section><section class="card" style="margin-top:16px"><h2>Diet review queue</h2><table class="table"><thead><tr><th>Item</th><th>Signal</th><th>Household rule</th><th>Decision</th><th>Action</th></tr></thead><tbody><tr><td>Peanut granola</td><td>Contains peanuts</td><td>Nut alert</td><td>Blocked</td><td>Suggest oat granola</td></tr><tr><td>ICA Milk 1L</td><td>Lactose</td><td>Lactose ok</td><td>Allowed</td><td>Keep dairy swap</td></tr><tr><td>Private-label cheese</td><td>Vegetarian label</td><td>Vegetarian household meal</td><td>Needs label check</td><td>Hold meal-plan writeback</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Diet guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Allergen lock</td><td>Blocked allergens outrank price savings and Deal Score.</td></tr><tr><td>Label confidence</td><td>Unverified nutrition labels cannot approve household-safe swaps.</td></tr><tr><td>Meal-plan writeback</td><td>Diet conflicts stop meal-plan and basket updates until reviewed.</td></tr></tbody></table></section>`
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
    body: `<section class="card" data-groceryview-flow="privacy"><div class="eyebrow">Privacy</div><h1>Export or delete your data</h1><p class="lede">Download personal data, plan account deletion, and verify advertiser payloads stay aggregated and receipt-safe.</p><div class="grid"><div class="metric"><strong>Export</strong><span>watchlists, budgets, and baskets</span></div><div class="metric"><strong>Delete</strong><span>sensitive rows removed by plan</span></div><div class="metric"><strong>Ads</strong><span>no raw receipt leakage</span></div></div><div class="flow-panel" aria-label="Privacy actions"><button type="button" data-flow-action="download-export">Download export</button><button type="button" data-flow-action="plan-deletion">Plan account deletion</button></div><p class="flow-result" data-flow-result="privacy" aria-live="polite">Privacy actions require re-authentication before live execution.</p></section><section class="card" style="margin-top:16px"><h2>Control states</h2><table class="table"><thead><tr><th>Setting</th><th>State</th><th>Detail</th></tr></thead><tbody><tr><td>Receipt images</td><td>Auto-delete after review</td><td>7 day retention window</td></tr><tr><td>Location precision</td><td>District only</td><td>Street address hidden from exports</td></tr><tr><td>Price contribution</td><td>Anonymous</td><td>No account identifier in catalog backfill</td></tr></tbody></table></section>`
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
    body: `<section class="card"><div class="eyebrow">Budget forecast</div><h1>Grocery budget forecast</h1><p class="lede">Compare planned baskets with receipt actuals, project month-end spend, and choose corrective actions before the household goes over budget.</p><div class="grid"><div class="metric"><strong>742 SEK</strong><span>next basket forecast</span></div><div class="metric"><strong>501 SEK</strong><span>spent this week</span></div><div class="metric"><strong>3 084 SEK</strong><span>month-end projection</span></div></div></section><section class="card" style="margin-top:16px"><h2>Forecast ledger</h2><table class="table"><thead><tr><th>Period</th><th>Budget</th><th>Actual / forecast</th><th>Variance</th><th>Status</th></tr></thead><tbody><tr><td>This week actuals</td><td>800 SEK</td><td>501 SEK</td><td>+299 SEK</td><td>On track</td></tr><tr><td>Next planned basket</td><td>800 SEK</td><td>742 SEK</td><td>+58 SEK</td><td>Needs review</td></tr><tr><td>Month-end projection</td><td>3 200 SEK</td><td>3 084 SEK</td><td>+116 SEK</td><td>On track</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Correction plan</h2><table class="table"><thead><tr><th>Action</th><th>Impact</th><th>Guardrail</th></tr></thead><tbody><tr><td>Apply coffee private-label swap</td><td>Saves 12 SEK</td><td>Requires verified shelf price</td></tr><tr><td>Move eggs to Lidl split basket</td><td>Saves 4 SEK</td><td>Favorite-store only route</td></tr><tr><td>Hold estimated tomato price</td><td>Avoids false saving</td><td>Needs review before forecast credit</td></tr></tbody></table></section>`
  },
  {
    path: 'scanner/index.html',
    title: 'Barcode and receipt scanner — GroceryView',
    description: 'GroceryView scanner page scaffold for barcode lookup, receipt parsing, confidence, and manual review.',
    body: `<section class="card" data-groceryview-flow="scanner"><div class="eyebrow">Scanner</div><h1>Barcode and receipt scanner</h1><p class="lede">Scan products and receipts, surface confidence levels, and send uncertain matches to the manual review queue.</p><div class="grid"><div class="metric"><strong>Barcode</strong><span>product lookup and smart swaps</span></div><div class="metric"><strong>Receipt</strong><span>budget impact review</span></div><div class="metric"><strong>Confidence</strong><span>low-confidence review routing</span></div></div><form class="flow-panel" aria-label="Scanner upload preview"><label>Receipt or barcode image<input name="scanImage" type="file" accept="image/*" /></label><button type="submit">Preview upload</button></form><div class="flow-panel" aria-label="Scanner review actions"><button type="button" data-flow-action="route-review">Route to review</button><button type="button" data-flow-action="mark-matched">Mark matched</button></div><p class="flow-result" data-flow-result="scanner" aria-live="polite">Uploads remain local preview until OCR provider credentials are configured.</p></section><section class="card" style="margin-top:16px"><h2>Review queue</h2><table class="table"><thead><tr><th>Capture</th><th>Status</th><th>Next action</th></tr></thead><tbody><tr><td>Coop Farsta receipt</td><td>Needs human review</td><td>Confirm milk line item and loyalty discount</td></tr><tr><td>Arla Milk barcode</td><td>Matched</td><td>Ready for basket price update</td></tr><tr><td>Loose tomatoes label</td><td>Low confidence</td><td>Route to product matching queue</td></tr></tbody></table></section>`
  },
  {
    path: 'receipts/review/index.html',
    title: 'Receipt review desk — GroceryView',
    description: 'Review GroceryView receipt line items by confidence, product match, loyalty discount, budget writeback, and catalog update eligibility.',
    body: `<section class="card"><div class="eyebrow">Receipt review</div><h1>Receipt review desk</h1><p class="lede">Confirm line-item matches, loyalty discounts, and budget writebacks before receipt data updates household spend or catalog prices.</p><div class="grid"><div class="metric"><strong>3</strong><span>receipt lines</span></div><div class="metric"><strong>1</strong><span>needs moderator</span></div><div class="metric"><strong>501 SEK</strong><span>weekly actuals impact</span></div></div></section><section class="card" style="margin-top:16px"><h2>Line-item decisions</h2><table class="table"><thead><tr><th>Line</th><th>Match</th><th>Confidence</th><th>Budget action</th><th>Catalog action</th></tr></thead><tbody><tr><td>Arla Milk 1L</td><td>ARLA-MILK-1L</td><td>98%</td><td>Post to weekly actuals</td><td>Update verified price</td></tr><tr><td>Coop loyalty discount</td><td>receipt discount</td><td>84%</td><td>Apply receipt total only</td><td>No product price update</td></tr><tr><td>Loose tomatoes</td><td>unknown produce</td><td>54%</td><td>Hold from forecast</td><td>Route to human review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Writeback guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Decision</th></tr></thead><tbody><tr><td>Low confidence below 80%</td><td>Cannot update catalog or Deal Score.</td></tr><tr><td>Loyalty discount line</td><td>Impacts receipt total without changing shelf price.</td></tr><tr><td>Verified product match</td><td>Can update household spend and product price history.</td></tr></tbody></table></section>`
  },
  {
    path: 'admin/human-review/index.html',
    title: 'Human review operations — GroceryView',
    description: 'GroceryView admin page scaffold for human-review assignments, SLA status, reviewer authorization, and decision writebacks.',
    body: `<section class="card"><div class="eyebrow">Operations</div><h1>Human review operations</h1><p class="lede">Review low-confidence product matches and community reports before they can update catalog data.</p><div class="grid"><div class="metric"><strong>breached</strong><span>SLA status</span></div><div class="metric"><strong>2</strong><span>open assignments</span></div><div class="metric"><strong>moderator-owned</strong><span>decision access</span></div></div></section><section class="card" style="margin-top:16px"><h2>Moderator assignments</h2><table class="table"><thead><tr><th>Review</th><th>Priority</th><th>Assignee</th><th>Due</th><th>Action</th></tr></thead><tbody><tr><td>review-match-1</td><td>high</td><td>moderator-1</td><td>SLA breached</td><td>Approve product match</td></tr><tr><td>review-report-1</td><td>medium</td><td>moderator-2</td><td>Due tomorrow</td><td>Keep in review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Decision writeback</h2><p class="lede">Approval writes <strong>approve_product_match</strong>; rejection writes <strong>reject_product_match</strong>; needs-more-info keeps the assignment in progress for a registered reviewer.</p></section>`
  },
  {
    path: 'market/index.html',
    title: 'Stockholm Grocery Market — GroceryView',
    description: 'Stockholm grocery market overview with indices, top movers, and true deals.',
    body: `<section class="card"><div class="eyebrow">Market</div><h1>Stockholm Grocery Market</h1><p class="lede">Top movers, best true deals, and grocery indices for Stockholm.</p><div class="grid"><div class="metric"><strong>101.6</strong><span>Stockholm Grocery Index</span></div><div class="metric"><strong>91.6</strong><span>Coffee Index</span></div><div class="metric"><strong>108.4</strong><span>Dairy Index</span></div></div></section><section class="card" style="margin-top:16px"><h2>Brand-tier indices</h2><p class="lede">Private Label Index, Budget Private Label Index, Premium Brand Index, Organic Brand Index, and National Brand Index separate price pressure by brand tier.</p><div class="grid"><div class="metric"><strong>23.7%</strong><span>private-label savings vs national brands</span></div><div class="metric"><strong>58.8%</strong><span>premium gap vs private label</span></div><div class="metric"><strong>Cleaning</strong><span>highest private-label savings category</span></div></div></section>`
  },
  {
    path: 'catalog/coverage/index.html',
    title: 'Catalog coverage dashboard — GroceryView',
    description: 'Track GroceryView catalog coverage by category, store, verified price freshness, low-confidence gaps, and backfill actions.',
    body: `<section class="card"><div class="eyebrow">Catalog coverage</div><h1>Catalog coverage dashboard</h1><p class="lede">Monitor which categories and stores have enough verified price evidence before they power deal boards, alerts, or basket forecasts.</p><div class="grid"><div class="metric"><strong>78%</strong><span>overall coverage</span></div><div class="metric"><strong>14</strong><span>verified gaps</span></div><div class="metric"><strong>6</strong><span>backfill actions</span></div></div></section><section class="card" style="margin-top:16px"><h2>Coverage by category</h2><table class="table"><thead><tr><th>Category</th><th>Products tracked</th><th>Verified coverage</th><th>Freshness</th><th>Gap action</th></tr></thead><tbody><tr><td>Coffee</td><td>18</td><td>89%</td><td>Fresh today</td><td>Keep monitoring</td></tr><tr><td>Dairy</td><td>24</td><td>81%</td><td>Fresh today</td><td>Backfill member prices</td></tr><tr><td>Produce</td><td>31</td><td>62%</td><td>Mixed</td><td>Route receipt photos to review</td></tr><tr><td>Pantry</td><td>42</td><td>74%</td><td>Fresh this week</td><td>Parse missing unit prices</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Backfill guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified freshness window</td><td>Stale rows can display but cannot trigger alerts.</td></tr><tr><td>Low-confidence produce</td><td>Receipt photos need human review before catalog writeback.</td></tr><tr><td>Unit-price completeness</td><td>Products without unit prices cannot rank category savings.</td></tr></tbody></table></section>`
  },
  {
    path: 'retailers/freshness/index.html',
    title: 'Retailer freshness monitor — GroceryView',
    description: 'Monitor GroceryView retailer scrape freshness, parser health, stale catalog rows, and alert eligibility by chain.',
    body: `<section class="card"><div class="eyebrow">Retailer freshness</div><h1>Retailer freshness monitor</h1><p class="lede">Review chain-level scrape freshness and parser health before retailer-page observations update deals, alerts, or basket totals.</p><div class="grid"><div class="metric"><strong>4</strong><span>chains monitored</span></div><div class="metric"><strong>1</strong><span>stale parser feed</span></div><div class="metric"><strong>93%</strong><span>fresh eligible rows</span></div></div></section><section class="card" style="margin-top:16px"><h2>Freshness by retailer</h2><table class="table"><thead><tr><th>Retailer</th><th>Last scrape</th><th>Parser health</th><th>Eligible rows</th><th>Action</th></tr></thead><tbody><tr><td>Willys</td><td>2026-05-20 07:45</td><td>Healthy</td><td>94%</td><td>Keep publishing</td></tr><tr><td>ICA</td><td>2026-05-20 07:30</td><td>Healthy</td><td>91%</td><td>Backfill loyalty labels</td></tr><tr><td>Coop</td><td>2026-05-19 18:20</td><td>Stale feed</td><td>73%</td><td>Pause new alerts</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Freshness guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Alert freshness</td><td>Stale retailer-page rows cannot trigger household notifications.</td></tr><tr><td>Parser health</td><td>Parser failures keep old prices visible but exclude them from Deal Score updates.</td></tr><tr><td>Chain labels</td><td>Member-only and promotion labels must survive parser backfills.</td></tr></tbody></table></section>`
  },
  {
    path: 'routes/shopping/index.html',
    title: 'Shopping route planner — GroceryView',
    description: 'Plan GroceryView shopping stops from favorite-store baskets, pickup windows, split-basket savings, and travel guardrails.',
    body: `<section class="card"><div class="eyebrow">Shopping route</div><h1>Shopping route planner</h1><p class="lede">Turn verified basket decisions into ordered store stops while keeping travel convenience separate from Deal Score and shelf-price evidence.</p><div class="grid"><div class="metric"><strong>3</strong><span>planned stops</span></div><div class="metric"><strong>44 SEK</strong><span>split-basket savings</span></div><div class="metric"><strong>28 min</strong><span>estimated route time</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ordered stops</h2><table class="table"><thead><tr><th>Stop</th><th>Store</th><th>Basket role</th><th>Pickup note</th><th>Action</th></tr></thead><tbody><tr><td>1</td><td>Willys Odenplan</td><td>Coffee and pantry</td><td>Primary weekly basket</td><td>Buy verified coffee promo</td></tr><tr><td>2</td><td>Lidl Sveavägen</td><td>Eggs and dairy</td><td>Split basket stop</td><td>Pick up eggs and milk</td></tr><tr><td>3</td><td>Hemköp T-Centralen</td><td>Convenience top-up</td><td>Small-basket only</td><td>Skip unless pantry rice is out</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Route guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>No travel penalty in Deal Score</td><td>Route time can reorder stops but cannot change product deal ranking.</td></tr><tr><td>Pickup windows</td><td>Closed or pickup-limited stores stay out of active checkout plans.</td></tr><tr><td>Low-confidence rows</td><td>Unverified prices cannot justify an extra route stop.</td></tr></tbody></table></section>`
  },
  {
    path: 'community/reports/index.html',
    title: 'Community price reports — GroceryView',
    description: 'Track GroceryView community-submitted price reports, confidence checks, review status, and catalog writeback eligibility.',
    body: `<section class="card"><div class="eyebrow">Community reports</div><h1>Community price reports</h1><p class="lede">Follow shopper-submitted price corrections from upload through confidence checks, moderator review, and safe catalog writeback.</p><div class="grid"><div class="metric"><strong>5</strong><span>open reports</span></div><div class="metric"><strong>2</strong><span>ready for review</span></div><div class="metric"><strong>0</strong><span>auto-writebacks</span></div></div></section><section class="card" style="margin-top:16px"><h2>Report queue</h2><table class="table"><thead><tr><th>Report</th><th>Store</th><th>Claim</th><th>Evidence</th><th>Status</th></tr></thead><tbody><tr><td>report-coffee-1</td><td>Willys Odenplan</td><td>49.90 SEK coffee promo</td><td>Shelf photo</td><td>Ready for moderator</td></tr><tr><td>report-eggs-2</td><td>Lidl Sveavägen</td><td>34.90 SEK eggs</td><td>Receipt line</td><td>Needs match check</td></tr><tr><td>report-tomatoes-3</td><td>Coop Farsta</td><td>29 SEK/kg tomatoes</td><td>Blurry shelf photo</td><td>Low confidence</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Report guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>No direct catalog writes</td><td>Community reports require moderator approval before changing product prices.</td></tr><tr><td>Evidence confidence</td><td>Blurry or partial photos stay visible but cannot trigger alerts.</td></tr><tr><td>Reporter privacy</td><td>Public report status hides account and location precision.</td></tr></tbody></table></section>`
  },
  {
    path: 'prices/confidence/index.html',
    title: 'Price confidence guide — GroceryView',
    description: 'Explain GroceryView price confidence labels, source types, Deal Score eligibility, and user-facing trust decisions.',
    body: `<section class="card"><div class="eyebrow">Price confidence</div><h1>Price confidence guide</h1><p class="lede">Understand how verified shelf, retailer-page, member, estimated, and low-confidence prices appear across deal boards and basket decisions.</p><div class="grid"><div class="metric"><strong>Verified</strong><span>can affect Deal Score</span></div><div class="metric"><strong>Estimated</strong><span>display only</span></div><div class="metric"><strong>Low</strong><span>review required</span></div></div></section><section class="card" style="margin-top:16px"><h2>Confidence labels</h2><table class="table"><thead><tr><th>Label</th><th>Source</th><th>Deal Score</th><th>User copy</th></tr></thead><tbody><tr><td>Verified shelf</td><td>Shelf photo or audited retailer page</td><td>Eligible</td><td>Official shelf evidence</td></tr><tr><td>Retailer page</td><td>Parsed public retailer page</td><td>Eligible when fresh</td><td>Retailer-page confidence</td></tr><tr><td>Member-only</td><td>Loyalty price or coupon</td><td>Separated</td><td>Requires membership context</td></tr><tr><td>Estimated</td><td>Model or stale observation</td><td>Ineligible</td><td>Estimate, do not rank</td></tr><tr><td>Low confidence</td><td>OCR or match uncertainty</td><td>Ineligible</td><td>Needs review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Trust decisions</h2><table class="table"><thead><tr><th>Decision</th><th>Rule</th></tr></thead><tbody><tr><td>Show in product page</td><td>All labels can appear with source metadata.</td></tr><tr><td>Trigger household alert</td><td>Only verified or fresh retailer-page prices can alert.</td></tr><tr><td>Rank in deal board</td><td>Estimated and low-confidence rows are excluded.</td></tr></tbody></table></section>`
  },
  {
    path: 'deals/today/index.html',
    title: 'Today’s best grocery deals — GroceryView',
    description: 'Daily GroceryView deal board with Deal Score, source confidence, savings, and recommended shopper actions.',
    body: `<section class="card"><div class="eyebrow">Daily deal board</div><h1>Today’s best grocery deals</h1><p class="lede">Prioritize verified discounts with strong Deal Scores, clear source confidence, and practical shopping actions.</p><div class="grid"><div class="metric"><strong>82</strong><span>top Deal Score</span></div><div class="metric"><strong>3</strong><span>verified deal rows</span></div><div class="metric"><strong>44 SEK</strong><span>basket savings</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ranked deal actions</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Deal Score</th><th>Confidence</th><th>Action</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Willys Odenplan</td><td>82</td><td>Verified shelf</td><td>Buy two for this week</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Sveavägen</td><td>76</td><td>Retailer page</td><td>Add to split basket</td></tr><tr><td>Garant Bryggkaffe 450g</td><td>Willys Odenplan</td><td>73</td><td>Verified shelf</td><td>Use as private-label swap</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Deal guardrails</h2><table class="table"><thead><tr><th>Rule</th><th>Why it matters</th></tr></thead><tbody><tr><td>Ads excluded from ranking</td><td>Sponsored placements cannot increase Deal Score.</td></tr><tr><td>Estimated rows held back</td><td>Low-confidence prices must be reviewed before appearing as top deals.</td></tr><tr><td>Member prices labeled</td><td>Loyalty-only offers are separated from public shelf prices.</td></tr></tbody></table></section>`
  },
  {
    path: 'savings/ledger/index.html',
    title: 'Savings ledger — GroceryView',
    description: 'Track GroceryView realized savings from verified receipts, pending forecasts, rejected estimates, and household budget impact.',
    body: `<section class="card"><div class="eyebrow">Savings ledger</div><h1>Savings ledger</h1><p class="lede">Separate receipt-confirmed savings from forecasted, loyalty-only, or low-confidence savings before they update household budget history.</p><div class="grid"><div class="metric"><strong>96 SEK</strong><span>confirmed this week</span></div><div class="metric"><strong>18 SEK</strong><span>forecast pending</span></div><div class="metric"><strong>12 SEK</strong><span>rejected estimate</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ledger entries</h2><table class="table"><thead><tr><th>Source</th><th>Savings</th><th>Evidence</th><th>Budget writeback</th><th>Status</th></tr></thead><tbody><tr><td>Willys coffee promo</td><td>24 SEK</td><td>Verified receipt</td><td>Post to weekly actuals</td><td>Confirmed</td></tr><tr><td>Lidl split basket eggs</td><td>16 SEK</td><td>Retailer page and receipt</td><td>Post to weekly actuals</td><td>Confirmed</td></tr><tr><td>Estimated tomato swap</td><td>12 SEK</td><td>Low-confidence estimate</td><td>No writeback</td><td>Rejected</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Savings guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Receipt confirmation</td><td>Only verified receipts can move forecast savings into realized savings.</td></tr><tr><td>Estimate rejection</td><td>Low-confidence prices cannot increase savings totals.</td></tr><tr><td>Loyalty separation</td><td>Member-only savings stay labeled until access is confirmed.</td></tr></tbody></table></section>`
  },
  {
    path: 'savings/smart-swaps/index.html',
    title: 'Smart grocery swaps — GroceryView',
    description: 'Compare GroceryView smart swaps by savings, equivalence rule, household fit, source confidence, and budget impact.',
    body: `<section class="card"><div class="eyebrow">Smart swaps</div><h1>Smart grocery swaps</h1><p class="lede">Review substitute recommendations that save money while respecting product equivalence, household constraints, and verified-price requirements.</p><div class="grid"><div class="metric"><strong>3</strong><span>swap candidates</span></div><div class="metric"><strong>18 SEK</strong><span>weekly savings</span></div><div class="metric"><strong>0</strong><span>diet conflicts</span></div></div></section><section class="card" style="margin-top:16px"><h2>Swap candidates</h2><table class="table"><thead><tr><th>Current item</th><th>Suggested swap</th><th>Saves</th><th>Equivalence</th><th>Decision</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Garant Bryggkaffe 450g</td><td>12 SEK</td><td>Same roast category and pack size</td><td>Recommend</td></tr><tr><td>Arla Milk 1L</td><td>ICA Milk 1L</td><td>2 SEK</td><td>Same fat level and chilled dairy</td><td>Recommend</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Eggs 12-pack</td><td>4 SEK</td><td>Same pack size</td><td>Recommend in split basket</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Swap guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified price required</td><td>Estimated swap prices cannot reduce forecast spend.</td></tr><tr><td>Household diet first</td><td>Dietary restrictions outrank savings.</td></tr><tr><td>No travel penalty</td><td>Distance is shown separately and does not hide cheapest valid swaps.</td></tr></tbody></table></section>`
  },
  {
    path: 'movers/index.html',
    title: 'Market movers — GroceryView',
    description: 'Stockholm grocery market movers with top price drops, increases, 52-week lows, and true deals.',
    body: `<section class="card"><div class="eyebrow">Market movers</div><h1>Top grocery movers</h1><p class="lede">Track biggest price drops, price increases, 52-week lows, and true deals across Stockholm grocery instruments.</p><div class="grid"><div class="metric"><strong>-18.0%</strong><span>largest 7D drop</span></div><div class="metric"><strong>4</strong><span>52-week lows</span></div><div class="metric"><strong>94</strong><span>best true deal score</span></div></div></section><section class="card" style="margin-top:16px"><h2>Movers board</h2><table class="table"><thead><tr><th>List</th><th>Product</th><th>Best price</th><th>7D</th><th>30D</th><th>52-week signal</th><th>Deal Score</th><th>Verdict</th></tr></thead><tbody><tr><td>Top drops</td><td>TOILET-PAPER-8P</td><td>69.90 SEK</td><td class="negative">-18.0%</td><td class="negative">-14.5%</td><td>52-week low</td><td>88</td><td>Stock up</td></tr><tr><td>True deals</td><td>ZOEGAS-COFFEE-450G</td><td>49.90 SEK</td><td class="negative">-12.4%</td><td class="negative">-8.1%</td><td>Near yearly low</td><td>94</td><td>Buy now</td></tr><tr><td>Top increases</td><td>BUTTER-600G</td><td>54.90 SEK</td><td class="positive">+2.1%</td><td class="positive">+3.4%</td><td>Above median</td><td>42</td><td>Wait</td></tr></tbody></table></section>`
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
    body: `<section class="card"><div class="eyebrow">Store</div><h1>Willys Odenplan</h1><p class="lede">Favorite-store profile for Odenplan grocery deals.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score Today</span></div><div class="metric"><strong>-12%</strong><span>vs Stockholm average</span></div><div class="metric"><strong>Coffee</strong><span>Best category</span></div></div></section><section class="card" style="margin-top:16px"><h2>Store highlights</h2><table class="table"><thead><tr><th>Category</th><th>Signal</th><th>Confidence</th></tr></thead><tbody><tr><td>Coffee</td><td>-12% vs Stockholm average</td><td>Verified shelf</td></tr><tr><td>Milk</td><td>Competitive family basket line</td><td>Retailer page</td></tr><tr><td>Butter</td><td>Watchlist only, above usual price</td><td>Estimated</td></tr></tbody></table></section>`
  },
  {
    path: 'stores/compare/index.html',
    title: 'Compare Stockholm grocery stores — GroceryView',
    description: 'Compare Stockholm grocery stores by basket total, verified price coverage, confidence risk, best category, and weekly shopper fit.',
    body: `<section class="card"><div class="eyebrow">Store comparison</div><h1>Compare Stockholm stores</h1><p class="lede">Rank favorite stores by verified basket total, coverage, low-confidence risk, and category strengths before choosing a weekly shop.</p><div class="grid"><div class="metric"><strong>Willys</strong><span>best coffee coverage</span></div><div class="metric"><strong>Lidl</strong><span>lowest basket total</span></div><div class="metric"><strong>Coop</strong><span>review before checkout</span></div></div></section><section class="card" style="margin-top:16px"><h2>Favorite-store comparison</h2><table class="table"><thead><tr><th>Store</th><th>Basket total</th><th>Verified coverage</th><th>Low-confidence rows</th><th>Best category</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>742 SEK</td><td>82%</td><td>2</td><td>Coffee</td></tr><tr><td>Lidl Sveavägen</td><td>729 SEK</td><td>76%</td><td>3</td><td>Eggs and dairy</td></tr><tr><td>Coop Farsta</td><td>781 SEK</td><td>68%</td><td>5</td><td>Member promos</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Decision notes</h2><table class="table"><thead><tr><th>Store</th><th>Recommended use</th><th>Trust guardrail</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>Primary weekly basket when coffee is in stock</td><td>Verified shelf and retailer-page rows agree</td></tr><tr><td>Lidl Sveavägen</td><td>Cheapest split basket for dairy and eggs</td><td>Confirm flyer-only promotions before routing</td></tr><tr><td>Coop Farsta</td><td>Use for member promos after review</td><td>Low-confidence receipt rows stay out of Deal Score</td></tr></tbody></table></section>`
  },
  {
    path: 'stores/map/index.html',
    title: 'Stockholm store map — GroceryView',
    description: 'Browse nearby Stockholm grocery stores by district, basket fit, verified coverage, confidence risk, and pickup notes.',
    body: `<section class="card"><div class="eyebrow">Store map</div><h1>Stockholm store map</h1><p class="lede">Choose nearby stores by district, verified price coverage, basket fit, and confidence risk before planning a shopping route.</p><div class="grid"><div class="metric"><strong>5</strong><span>mapped stores</span></div><div class="metric"><strong>82%</strong><span>best verified coverage</span></div><div class="metric"><strong>2</strong><span>pickup-ready baskets</span></div></div></section><section class="card" style="margin-top:16px"><h2>District store list</h2><table class="table"><thead><tr><th>Store</th><th>District</th><th>Basket fit</th><th>Coverage</th><th>Pickup note</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>Vasastan</td><td>Coffee and pantry</td><td>82%</td><td>Primary weekly basket</td></tr><tr><td>Lidl Sveavägen</td><td>Norrmalm</td><td>Eggs and dairy</td><td>76%</td><td>Split basket stop</td></tr><tr><td>ICA Kvantum Liljeholmen</td><td>Liljeholmen</td><td>Milk and produce</td><td>74%</td><td>Transit-friendly backup</td></tr><tr><td>Coop Farsta</td><td>Farsta</td><td>Member promos</td><td>68%</td><td>Review loyalty rows first</td></tr><tr><td>Hemköp T-Centralen</td><td>Norrmalm</td><td>Convenience top-up</td><td>71%</td><td>Small-basket only</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Map guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>No travel-time penalty in Deal Score</td><td>Map distance informs route planning but never changes product deal ranking.</td></tr><tr><td>Coverage shown beside fit</td><td>Low-coverage stores need review before becoming default basket routes.</td></tr><tr><td>Pickup notes separate from prices</td><td>Operational notes cannot overwrite verified shelf or retailer-page evidence.</td></tr></tbody></table></section>`
  },
  {
    path: 'categories/coffee/index.html',
    title: 'Coffee deals in Stockholm — GroceryView',
    description: 'Coffee category page with price index, top deals, and percentile signals.',
    body: `<section class="card"><div class="eyebrow">Category</div><h1>Stockholm Coffee Deals</h1><p class="lede">Coffee Index is at 91.6 with strong current promotions.</p><div class="grid"><div class="metric"><strong>-8.4%</strong><span>1M move</span></div><div class="metric"><strong>12th</strong><span>Historical percentile</span></div><div class="metric"><strong>Zoégas</strong><span>Top deal</span></div></div></section><section class="card" style="margin-top:16px"><h2>Category signals</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Price</th><th>Signal</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Willys Odenplan</td><td>49.90 SEK</td><td>12th historical percentile</td></tr><tr><td>Garant Bryggkaffe 450g</td><td>Willys Odenplan</td><td>37.90 SEK</td><td>Private-label swap candidate</td></tr><tr><td>Arvid Nordquist 500g</td><td>Coop Farsta</td><td>59.90 SEK</td><td>Watchlist only</td></tr></tbody></table></section>`
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
