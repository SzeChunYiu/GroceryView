const CORE_SHELL_CACHE_NAME = 'groceryview-core-shell-v1';
const PAGE_CACHE_NAME = 'groceryview-offline-pages-v1';
const PRODUCT_DATA_CACHE_NAME = 'groceryview-product-data-v1';
const RUNTIME_ASSET_CACHE_NAME = 'groceryview-runtime-assets-v1';
const MAX_PAGE_CACHE_ENTRIES = 80;
const MAX_PRODUCT_DATA_CACHE_ENTRIES = 80;
const MAX_RUNTIME_ASSET_CACHE_ENTRIES = 120;

const CORE_SHELL_URLS = [
  '/',
  '/list',
  '/products',
  '/items',
  '/manifest.webmanifest',
  '/pwa-icon.svg',
  '/pwa-maskable-icon.svg'
];

const LIST_PAGE_PATTERNS = [
  /^\/list\/?$/,
  /^\/basket\/?$/,
  /^\/weekly-basket\/?$/,
  /^\/meal-planner\/?$/,
  /^\/pantry-planner\/?$/,
  /^\/shopping-trips\/?$/
];

const ITEM_PAGE_PATTERNS = [
  /^\/items\/[^/]+\/?$/,
  /^\/item\/[^/]+\/?$/,
  /^\/products\/[^/]+\/?$/,
  /^\/product\/[^/]+\/?$/,
  /^\/billigaste\/[^/]+\/?$/,
  /^\/prisjamforelse\/[^/]+\/?$/,
  /^\/[^/]+\/billigaste\/[^/]+\/?$/
];

const PRODUCT_DATA_PATTERNS = [
  /^\/api\/products\/?$/,
  /^\/api\/products\/[^/]+\/?$/,
  /^\/api\/items\/?$/,
  /^\/api\/items\/[^/]+\/?$/
];

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isNavigationRequest(request) {
  if (request.method !== 'GET') return false;
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  return request.mode === 'navigate' || Boolean(acceptsHtml);
}

function isCoreShellRequest(request) {
  if (!isSameOrigin(request) || !isNavigationRequest(request)) return false;

  const url = new URL(request.url);
  return url.pathname === '/' || url.pathname === '/index.html';
}

function isListPageRequest(request) {
  if (!isSameOrigin(request) || !isNavigationRequest(request)) return false;

  const url = new URL(request.url);
  return LIST_PAGE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isItemPageRequest(request) {
  if (!isSameOrigin(request) || !isNavigationRequest(request)) return false;

  const url = new URL(request.url);
  return ITEM_PAGE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isProductDataRequest(request) {
  if (request.method !== 'GET' || !isSameOrigin(request)) return false;

  const url = new URL(request.url);
  if (!PRODUCT_DATA_PATTERNS.some((pattern) => pattern.test(url.pathname))) return false;

  const acceptsJson = request.headers.get('accept')?.includes('application/json');
  return acceptsJson || url.pathname.startsWith('/api/');
}

function isRuntimeAssetRequest(request) {
  if (request.method !== 'GET' || !isSameOrigin(request)) return false;

  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest');
}

function cacheKey(request) {
  const url = new URL(request.url);
  url.hash = '';
  if (isNavigationRequest(request)) {
    url.search = '';
  }

  return new Request(url.toString(), {
    credentials: request.credentials,
    headers: request.headers,
    method: 'GET',
    mode: 'same-origin',
    redirect: 'follow'
  });
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;
  if (overflow <= 0) return;

  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function putResponse(cacheName, request, response, maxEntries) {
  if (!response || !response.ok || response.type === 'opaque') return response;

  const cache = await caches.open(cacheName);
  const key = cacheKey(request);
  await cache.delete(key);
  await cache.put(key, response.clone());
  await trimCache(cache, maxEntries);
  return response;
}

async function networkFirst(request, cacheName, maxEntries, fallbackUrls = [], ignoreSearch = true) {
  const cache = await caches.open(cacheName);
  const key = cacheKey(request);

  try {
    const response = await fetch(request);
    return await putResponse(cacheName, request, response, maxEntries);
  } catch (error) {
    const cached = await cache.match(key, { ignoreSearch });
    if (cached) return cached;

    for (const fallbackUrl of fallbackUrls) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true }) ||
        await caches.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }

    return new Response('Offline: this GroceryView page has not been cached yet.', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      status: 503,
      statusText: 'Offline'
    });
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const key = cacheKey(request);
  const cached = await cache.match(key, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  return putResponse(cacheName, request, response, maxEntries);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE_SHELL_CACHE_NAME)
      .then((cache) => cache.addAll(CORE_SHELL_URLS))
      .catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([
    CORE_SHELL_CACHE_NAME,
    PAGE_CACHE_NAME,
    PRODUCT_DATA_CACHE_NAME,
    RUNTIME_ASSET_CACHE_NAME
  ]);

  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('groceryview-') && !currentCaches.has(cacheName))
        .map((cacheName) => caches.delete(cacheName))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (isCoreShellRequest(request)) {
    event.respondWith(networkFirst(request, CORE_SHELL_CACHE_NAME, CORE_SHELL_URLS.length, ['/']));
    return;
  }

  if (isListPageRequest(request)) {
    event.respondWith(networkFirst(request, PAGE_CACHE_NAME, MAX_PAGE_CACHE_ENTRIES, ['/list', '/']));
    return;
  }

  if (isItemPageRequest(request)) {
    event.respondWith(networkFirst(request, PAGE_CACHE_NAME, MAX_PAGE_CACHE_ENTRIES, ['/products', '/items', '/']));
    return;
  }

  if (isProductDataRequest(request)) {
    event.respondWith(networkFirst(request, PRODUCT_DATA_CACHE_NAME, MAX_PRODUCT_DATA_CACHE_ENTRIES, [], false));
    return;
  }

  if (isRuntimeAssetRequest(request)) {
    event.respondWith(cacheFirst(request, RUNTIME_ASSET_CACHE_NAME, MAX_RUNTIME_ASSET_CACHE_ENTRIES));
  }
});
