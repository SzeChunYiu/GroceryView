const app = document.querySelector<HTMLDivElement>('#app');

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function ensurePwaMetadata() {
  const head = document.head;
  const linksAndMeta: Array<[string, Record<string, string>]> = [
    ['link', { rel: 'manifest', href: '/manifest.webmanifest' }],
    ['link', { rel: 'apple-touch-icon', href: '/pwa-maskable-icon.svg' }],
    ['meta', { name: 'theme-color', content: '#064e3b' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'GroceryView' }]
  ];

  for (const [tagName, attrs] of linksAndMeta) {
    const selector = attrs.rel ? `${tagName}[rel="${attrs.rel}"]` : `${tagName}[name="${attrs.name}"]`;
    if (head.querySelector(selector)) continue;
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    head.appendChild(element);
  }
}

function renderInstallBanner() {
  const banner = document.querySelector<HTMLDivElement>('[data-install-banner]');
  if (!banner) return;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isStandalone || window.localStorage.getItem('groceryview:legacy-install-dismissed') === 'true') {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
}

if (app) {
  ensurePwaMetadata();
  app.innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="eyebrow">Verified-data fallback</div>
        <h1>GroceryView uses the Next.js interface now.</h1>
        <p class="lede">This legacy static entry contains no sample baskets, fake accounts, or invented prices. Open the Next.js app to view Axfood, OpenPrices, and OpenStreetMap-backed data.</p>
        <p><a class="button" href="/">Open GroceryView</a></p>
      </section>
    </main>
    <aside class="install-banner" data-install-banner hidden>
      <img alt="" src="/pwa-maskable-icon.svg" />
      <p><strong>Install GroceryView</strong><span>Open price checks from your phone home screen.</span></p>
      <button class="install-action" type="button">Install</button>
      <button class="install-dismiss" aria-label="Dismiss install banner" type="button">×</button>
    </aside>
  `;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    renderInstallBanner();
  });
  document.querySelector('.install-action')?.addEventListener('click', async () => {
    await deferredInstallPrompt?.prompt();
    deferredInstallPrompt = null;
    renderInstallBanner();
  });
  document.querySelector('.install-dismiss')?.addEventListener('click', () => {
    window.localStorage.setItem('groceryview:legacy-install-dismissed', 'true');
    renderInstallBanner();
  });
  renderInstallBanner();
}
