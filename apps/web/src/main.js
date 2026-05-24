const app = document.querySelector('#app');
let deferredInstallPrompt = null;
function ensurePwaMetadata() {
  const entries = [
    ['link', { rel: 'manifest', href: '/manifest.webmanifest' }],
    ['link', { rel: 'apple-touch-icon', href: '/pwa-maskable-icon.svg' }],
    ['meta', { name: 'theme-color', content: '#064e3b' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'GroceryView' }]
  ];
  for (const [tagName, attrs] of entries) {
    const selector = attrs.rel ? `${tagName}[rel="${attrs.rel}"]` : `${tagName}[name="${attrs.name}"]`;
    if (document.head.querySelector(selector)) continue;
    const element = document.createElement(tagName);
    Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
    document.head.appendChild(element);
  }
}
function renderInstallBanner() {
  const banner = document.querySelector('[data-install-banner]');
  if (!banner) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  banner.hidden = standalone || window.localStorage.getItem('groceryview:legacy-install-dismissed') === 'true';
}
if (app) {
  ensurePwaMetadata();
  app.innerHTML = '<main class="app-shell"><section class="card"><div class="eyebrow">Verified-data fallback</div><h1>GroceryView uses the Next.js interface now.</h1><p class="lede">This legacy static entry contains no sample baskets, fake accounts, or invented prices. Open the Next.js app to view Axfood, OpenPrices, and OpenStreetMap-backed data.</p><p><a class="button" href="/">Open GroceryView</a></p></section></main><aside class="install-banner" data-install-banner hidden><img alt="" src="/pwa-maskable-icon.svg" /><p><strong>Install GroceryView</strong><span>Open price checks from your phone home screen.</span></p><button class="install-action" type="button">Install</button><button class="install-dismiss" aria-label="Dismiss install banner" type="button">×</button></aside>';
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstallPrompt = event; renderInstallBanner(); });
  document.querySelector('.install-action')?.addEventListener('click', async () => { await deferredInstallPrompt?.prompt(); deferredInstallPrompt = null; renderInstallBanner(); });
  document.querySelector('.install-dismiss')?.addEventListener('click', () => { window.localStorage.setItem('groceryview:legacy-install-dismissed', 'true'); renderInstallBanner(); });
  renderInstallBanner();
}
