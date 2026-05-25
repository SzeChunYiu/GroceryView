const ITEM_PAGE_CACHE_NAME = 'groceryview-item-pages-v1';
const SHOPPING_LIST_CACHE_NAME = 'groceryview-shopping-list-route-v1';
const MAX_ITEM_PAGE_CACHE_ENTRIES = 50;
const ITEM_PAGE_PATTERNS = [
  /^\/items\/[^/]+\/?$/,
  /^\/item\/[^/]+\/?$/,
  /^\/products\/[^/]+\/?$/,
  /^\/product\/[^/]+\/?$/,
  /^\/billigaste\/[^/]+\/?$/,
  /^\/prisjamforelse\/[^/]+\/?$/,
  /^\/[^/]+\/billigaste\/[^/]+\/?$/
];

function isShoppingListRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (!/^\/list\/?$/.test(url.pathname) && !/^\/favou?rites\/?$/.test(url.pathname)) return false;

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  return request.mode === 'navigate' || acceptsHtml;
}

function isItemPageRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (request.mode !== 'navigate' && !acceptsHtml) return false;

  return ITEM_PAGE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function itemPageCacheRequest(request) {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return new Request(url.toString(), {
    credentials: request.credentials,
    headers: request.headers,
    method: 'GET',
    mode: 'same-origin',
    redirect: 'follow'
  });
}

function shoppingListCacheRequest(request) {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return new Request(url.toString(), {
    credentials: request.credentials,
    headers: request.headers,
    method: 'GET',
    mode: 'same-origin',
    redirect: 'follow'
  });
}

async function cacheShoppingListRoute(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return response;

  const cache = await caches.open(SHOPPING_LIST_CACHE_NAME);
  await cache.put(shoppingListCacheRequest(request), response.clone());
  return response;
}

async function shoppingListNetworkFirst(request) {
  const cache = await caches.open(SHOPPING_LIST_CACHE_NAME);

  try {
    const response = await fetch(request);
    return await cacheShoppingListRoute(request, response);
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    return new Response('Offline: the saved-list app shell has not been cached yet.', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      status: 503,
      statusText: 'Offline'
    });
  }
}

async function trimItemPageCache(cache) {
  const keys = await cache.keys();
  const overflow = keys.length - MAX_ITEM_PAGE_CACHE_ENTRIES;
  if (overflow <= 0) return;

  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function cacheItemPage(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return response;

  const cache = await caches.open(ITEM_PAGE_CACHE_NAME);
  const cacheRequest = itemPageCacheRequest(request);
  await cache.delete(cacheRequest);
  await cache.put(cacheRequest, response.clone());
  await trimItemPageCache(cache);
  return response;
}

async function itemPageNetworkFirst(request) {
  const cache = await caches.open(ITEM_PAGE_CACHE_NAME);

  try {
    const response = await fetch(request);
    return await cacheItemPage(request, response);
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    return new Response('Offline: this item page has not been cached yet.', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      status: 503,
      statusText: 'Offline'
    });
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => (
          (cacheName.startsWith('groceryview-item-pages-') && cacheName !== ITEM_PAGE_CACHE_NAME)
          || (cacheName.startsWith('groceryview-shopping-list-route-') && cacheName !== SHOPPING_LIST_CACHE_NAME)
        ))
        .map((cacheName) => caches.delete(cacheName))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (isShoppingListRequest(event.request)) {
    event.respondWith(shoppingListNetworkFirst(event.request));
    return;
  }

  if (!isItemPageRequest(event.request)) return;

  event.respondWith(itemPageNetworkFirst(event.request));
});
