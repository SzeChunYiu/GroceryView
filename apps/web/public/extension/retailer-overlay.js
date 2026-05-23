(() => {
  const PRODUCT_ID_ATTRIBUTE = 'data-groceryview-product-id';
  const apiOrigin = window.GroceryViewOverlayApiOrigin || 'https://grocery-web-mu.vercel.app';

  async function fetchCheapestNow(productId) {
    const response = await fetch(`${apiOrigin}/api/products/${encodeURIComponent(productId)}/cheapest-now`, {
      method: 'GET',
      credentials: 'omit',
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return null;
    return response.json();
  }

  function confidence(report) {
    if (report.chainCount >= 3) return 'high confidence';
    if (report.chainCount >= 2) return 'medium confidence';
    return 'limited confidence';
  }

  function renderOverlay(target, report) {
    const cheapest = report.cheapest;
    if (!cheapest) return;
    const badge = document.createElement('aside');
    badge.setAttribute('data-groceryview-overlay', 'cheapest-now');
    badge.style.cssText = [
      'border:1px solid #0f766e',
      'border-radius:16px',
      'padding:12px',
      'margin:8px 0',
      'background:#ecfdf5',
      'color:#064e3b',
      'font:600 13px/1.4 system-ui,sans-serif'
    ].join(';');
    badge.textContent =
      `GroceryView: ${cheapest.chain} is cheapest now at ${cheapest.packagePrice} ${report.currency}. ` +
      `${confidence(report)} from ${report.chainCount} observed chains. No anonymous shopper profile created.`;
    target.prepend(badge);
  }

  async function hydrateTarget(target) {
    const productId = target.getAttribute(PRODUCT_ID_ATTRIBUTE);
    if (!productId || target.querySelector('[data-groceryview-overlay]')) return;
    try {
      const report = await fetchCheapestNow(productId);
      if (report) renderOverlay(target, report);
    } catch {
      // Retailer pages should remain untouched when the public API is unavailable.
    }
  }

  function hydrateAll() {
    document.querySelectorAll(`[${PRODUCT_ID_ATTRIBUTE}]`).forEach((target) => {
      hydrateTarget(target);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateAll, { once: true });
  } else {
    hydrateAll();
  }
})();
