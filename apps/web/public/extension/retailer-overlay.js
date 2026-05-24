(() => {
  const PRODUCT_ID_ATTRIBUTE = 'data-groceryview-product-id';
  const OVERLAY_ATTRIBUTE = 'data-groceryview-overlay';
  const apiOrigin = window.GroceryViewOverlayApiOrigin || 'https://grocery-web-mu.vercel.app';
  const supportedRetailers = [
    { chain: 'ICA', hostPattern: /(^|\.)ica\.se$/i },
    { chain: 'Coop', hostPattern: /(^|\.)coop\.se$/i },
    { chain: 'Willys', hostPattern: /(^|\.)willys\.se$/i }
  ];
  const commodityAliases = [
    { commodity: 'coffee', terms: ['kaffe', 'coffee', 'bryggkaffe'] },
    { commodity: 'milk', terms: ['mjölk', 'milk', 'standardmjölk', 'mellanmjölk'] },
    { commodity: 'banana', terms: ['banan', 'banana', 'bananer'] },
    { commodity: 'tomato', terms: ['tomat', 'tomato', 'tomater'] },
    { commodity: 'potato', terms: ['potatis', 'potato'] }
  ];

  function retailerForLocation(location) {
    return supportedRetailers.find((retailer) => retailer.hostPattern.test(location.hostname));
  }

  function normalizeIdentifier(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function uniqueIdentifiers(candidates) {
    const seen = new Set();
    return candidates
      .map((candidate) => ({ ...candidate, value: normalizeIdentifier(candidate.value) }))
      .filter((candidate) => {
        if (!candidate.value || seen.has(candidate.value)) return false;
        seen.add(candidate.value);
        return true;
      });
  }

  function readJsonLdProducts() {
    return [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((script) => {
        try {
          const parsed = JSON.parse(script.textContent || 'null');
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      })
      .flatMap((node) => Array.isArray(node?.['@graph']) ? node['@graph'] : [node])
      .filter((node) => String(node?.['@type'] || '').toLowerCase().includes('product'));
  }

  function productNameFromPage(target) {
    const jsonLdName = readJsonLdProducts().map((product) => normalizeIdentifier(product.name)).find(Boolean);
    const targetName = normalizeIdentifier(target?.getAttribute('aria-label') || target?.querySelector('h1,h2,[itemprop="name"]')?.textContent);
    const heading = normalizeIdentifier(document.querySelector('h1,[data-testid*="product-title"],[class*="product"][class*="title"]')?.textContent);
    const ogTitle = normalizeIdentifier(document.querySelector('meta[property="og:title"]')?.getAttribute('content'));
    return jsonLdName || targetName || heading || ogTitle || document.title;
  }

  function commodityIdentifier(name) {
    const normalized = name.toLocaleLowerCase('sv-SE');
    const match = commodityAliases.find((entry) => entry.terms.some((term) => normalized.includes(term)));
    return match ? { value: match.commodity, kind: 'commodity', confidence: 'limited' } : null;
  }

  function identifiersFromPage(target) {
    const jsonLdProducts = readJsonLdProducts();
    const jsonLdIdentifiers = jsonLdProducts.flatMap((product) => [
      { value: product.gtin13 || product.gtin14 || product.gtin12 || product.gtin8 || product.gtin, kind: 'ean', confidence: 'high' },
      { value: product.sku || product.productID, kind: 'retailer_sku', confidence: 'medium' }
    ]);
    const productName = productNameFromPage(target);
    const commodity = commodityIdentifier(productName);

    return uniqueIdentifiers([
      { value: target?.getAttribute(PRODUCT_ID_ATTRIBUTE), kind: 'groceryview_product_id', confidence: 'high' },
      { value: target?.getAttribute('data-ean') || target?.getAttribute('data-gtin'), kind: 'ean', confidence: 'high' },
      { value: target?.getAttribute('data-product-id') || target?.getAttribute('data-sku'), kind: 'retailer_sku', confidence: 'medium' },
      ...jsonLdIdentifiers,
      ...(commodity ? [commodity] : [])
    ]);
  }

  async function getJson(path) {
    const response = await fetch(`${apiOrigin}${path}`, {
      method: 'GET',
      credentials: 'omit',
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return null;
    return response.json();
  }

  async function fetchCheapestNow(productId) {
    return getJson(`/api/products/${encodeURIComponent(productId)}/cheapest-now`);
  }

  function searchResults(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.products)) return payload.products;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  async function resolveViaSearch(identifier) {
    const search = await getJson(`/api/products/search?q=${encodeURIComponent(identifier.value)}`);
    const result = searchResults(search)[0];
    const productId = result?.id || result?.productId || result?.slug;
    return productId ? { productId, matchKind: identifier.kind, matchConfidence: identifier.confidence } : null;
  }

  async function resolveCheapestReport(identifiers) {
    for (const identifier of identifiers) {
      const direct = await fetchCheapestNow(identifier.value);
      if (direct?.cheapest) return { report: direct, matchKind: identifier.kind, matchConfidence: identifier.confidence };
      const resolved = await resolveViaSearch(identifier);
      if (!resolved) continue;
      const searched = await fetchCheapestNow(resolved.productId);
      if (searched?.cheapest) return { report: searched, matchKind: resolved.matchKind, matchConfidence: resolved.matchConfidence };
    }
    return null;
  }

  function confidence(report, matchConfidence) {
    if (matchConfidence === 'limited') return 'limited confidence';
    if (report.chainCount >= 3) return 'high confidence';
    if (report.chainCount >= 2) return 'medium confidence';
    return 'limited confidence';
  }

  function formatDate(value) {
    if (!value) return 'freshness unavailable';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return 'freshness unavailable';
    return `observed ${parsed.toLocaleDateString('sv-SE')}`;
  }

  function link(path, label) {
    const anchor = document.createElement('a');
    anchor.href = `${apiOrigin}${path}`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = label;
    anchor.style.cssText = 'color:#075985;font-weight:800;text-decoration:underline;text-underline-offset:3px';
    return anchor;
  }

  function renderOverlay(target, match) {
    const { report, matchKind, matchConfidence } = match;
    const cheapest = report.cheapest;
    if (!cheapest || target.querySelector(`[${OVERLAY_ATTRIBUTE}]`)) return;

    const badge = document.createElement('aside');
    badge.setAttribute(OVERLAY_ATTRIBUTE, 'cheapest-now');
    badge.style.cssText = [
      'border:1px solid #0f766e',
      'border-radius:16px',
      'box-shadow:0 8px 24px rgba(15,118,110,.18)',
      'padding:12px',
      'margin:8px 0',
      'background:#ecfdf5',
      'color:#064e3b',
      'font:600 13px/1.4 system-ui,sans-serif',
      'max-width:420px',
      'z-index:2147483647'
    ].join(';');

    const title = document.createElement('strong');
    title.textContent = 'GroceryView observed cheaper-chain check';
    title.style.display = 'block';

    const summary = document.createElement('p');
    summary.textContent =
      `${cheapest.chain} has the lowest observed row for ${report.productName} at ${cheapest.packagePrice} ${report.currency}. ` +
      `${confidence(report, matchConfidence)} from ${report.chainCount} observed chains; ${formatDate(report.lastObservedAt)}.`;

    const guardrail = document.createElement('p');
    guardrail.textContent =
      `Match: ${matchKind}. This is not a guaranteed savings claim; missing chains stay absent and no retailer account or anonymous shopper profile is stored.`;
    guardrail.style.cssText = 'margin:8px 0 0;color:#065f46;font-size:12px';

    const actions = document.createElement('p');
    actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 0';
    actions.append(
      link(`/products/${encodeURIComponent(report.productId)}`, 'Open GroceryView product'),
      link('/compare', 'Compare chains')
    );

    badge.append(title, summary, guardrail, actions);
    target.prepend(badge);
  }

  function fallbackTarget() {
    return document.querySelector('main,[role="main"],article') || document.body;
  }

  async function hydrateTarget(target) {
    if (!target || target.querySelector(`[${OVERLAY_ATTRIBUTE}]`)) return;
    const identifiers = identifiersFromPage(target);
    if (identifiers.length === 0) return;
    try {
      const match = await resolveCheapestReport(identifiers);
      if (match) renderOverlay(target, match);
    } catch {
      // Retailer pages should remain untouched when the public API is unavailable.
    }
  }

  function hydrateAll() {
    const mappedTargets = [...document.querySelectorAll(`[${PRODUCT_ID_ATTRIBUTE}], [data-ean], [data-gtin], [data-product-id], [data-sku]`)];
    if (!retailerForLocation(window.location) && mappedTargets.length === 0) return;
    const targets = mappedTargets.length ? mappedTargets : [fallbackTarget()];
    targets.forEach((target) => {
      hydrateTarget(target);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateAll, { once: true });
  } else {
    hydrateAll();
  }

  new MutationObserver(() => hydrateAll()).observe(document.documentElement, { childList: true, subtree: true });
})();
