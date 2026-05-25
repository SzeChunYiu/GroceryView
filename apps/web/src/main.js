const app = document.querySelector('#app');
const installDismissedKey = 'groceryview:legacy-pwa-install-dismissed';
let deferredInstallPrompt = null;
function isStandaloneDisplay() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function renderInstallBanner(canInstall) {
  const existing = document.querySelector('[data-groceryview-install-banner]');
  if (isStandaloneDisplay() || localStorage.getItem(installDismissedKey) === 'true') {
    existing?.remove();
    return;
  }
  const banner = existing ?? document.createElement('div');
  banner.dataset.groceryviewInstallBanner = 'true';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Install GroceryView');
  banner.setAttribute('style', 'position:fixed;left:16px;right:16px;bottom:16px;z-index:50;margin:0 auto;max-width:640px;border:1px solid rgba(15,23,42,.14);border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 20px 48px rgba(15,23,42,.18);color:#0f172a;display:flex;gap:16px;align-items:center;justify-content:space-between;padding:16px;backdrop-filter:blur(16px)');
  banner.innerHTML = `<div class="install-banner__copy"><p class="install-banner__eyebrow">Mobile app shortcut</p><strong>Add GroceryView to your home screen</strong><span>${canInstall ? 'Tap Install for a native-like grocery price app that reopens quickly on shopping trips.' : 'Use your browser menu or Share sheet, then choose Add to Home Screen for repeat visits.'}</span></div><div class="install-banner__actions">${canInstall ? '<button class="install-banner__button" type="button">Install</button>' : '<a class="install-banner__button" href="/manifest.webmanifest">Manifest</a>'}<button aria-label="Dismiss install banner" class="install-banner__dismiss" type="button">×</button></div>`;
  banner.querySelector('.install-banner__dismiss')?.addEventListener('click', () => {
    localStorage.setItem(installDismissedKey, 'true');
    banner.remove();
  });
  banner.querySelector('.install-banner__button')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice.outcome === 'accepted') localStorage.setItem(installDismissedKey, 'true');
    banner.remove();
  });
  if (!existing) document.body.appendChild(banner);
}
if (app) {
  app.innerHTML = '<main class="app-shell"><section class="card"><div class="eyebrow">Verified-data fallback</div><h1>GroceryView uses the Next.js interface now.</h1><p class="lede">This legacy static entry contains no sample baskets, fake accounts, or invented prices. Open the Next.js app to view Axfood, OpenPrices, and OpenStreetMap-backed data.</p><p><a class="button" href="/">Open GroceryView</a></p></section></main>';
  renderInstallBanner(false);
}
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderInstallBanner(true);
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  localStorage.setItem(installDismissedKey, 'true');
  document.querySelector('[data-groceryview-install-banner]')?.remove();
});
