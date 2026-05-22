// GroceryView basket import bookmarklet helper.
// Save as a bookmarklet after prefixing with `javascript:` or host it as a static helper.
(() => {
  const consentGranted = window.confirm('GroceryView basket import: read visible retailer basket rows on this page?');
  if (!consentGranted) return;
  const capturedLines = Array.from(document.querySelectorAll('[data-groceryview-basket-line], [data-testid*=basket], [class*=basket] li'))
    .map((node) => ({ rawName: (node.textContent || '').trim(), quantity: 1 }))
    .filter((line) => line.rawName.length > 0)
    .slice(0, 99);
  const payload = {
    source: {
      sourceKind: 'bookmarklet',
      retailerId: location.hostname.replace(/^www\./, '').split('.')[0] || 'unknown',
      origin: location.origin,
      capturedAt: new Date().toISOString(),
      consentGranted
    },
    capturedLines
  };
  navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  window.alert(`GroceryView basket import copied ${capturedLines.length} capturedLines. Paste into GroceryView to review before import.`);
})();
