const ITEM_PAGE_CACHE_NAME = 'groceryview-item-pages-v1';
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
const MY_FLYER_READY_TYPE = 'MY_FLYER_READY_NOTIFICATION';
const MY_FLYER_READY_TAG = 'groceryview-my-flyer-ready';

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

function normalizeNotificationNumber(value) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function flyerReadySummary(payload) {
  const dealCount = normalizeNotificationNumber(payload.dealCount);
  const savings = normalizeNotificationNumber(payload.saveUpToKr);
  return `${dealCount} ${dealCount === 1 ? 'deal' : 'deals'} this week, save up to ${savings} kr`;
}

function parseFlyerReadyPayload(eventData) {
  if (!eventData) return null;

  try {
    const payload = eventData.json();
    return payload && payload.type === MY_FLYER_READY_TYPE ? payload : null;
  } catch {
    return null;
  }
}

function showFlyerReadyNotification(payload) {
  const body = payload.summary || flyerReadySummary(payload);
  return self.registration.showNotification('Your MyFlyer is ready', {
    body,
    badge: '/pwa-maskable-icon.svg',
    data: {
      ...payload,
      summary: body,
      type: MY_FLYER_READY_TYPE,
      url: payload.url || '/se/my-flyer'
    },
    icon: '/pwa-icon.svg',
    renotify: true,
    tag: MY_FLYER_READY_TAG
  });
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('groceryview-item-pages-') && cacheName !== ITEM_PAGE_CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!isItemPageRequest(event.request)) return;

  event.respondWith(itemPageNetworkFirst(event.request));
});

self.addEventListener('push', (event) => {
  const payload = parseFlyerReadyPayload(event.data);
  if (!payload) return;

  event.waitUntil(showFlyerReadyNotification(payload));
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== MY_FLYER_READY_TYPE) return;

  event.waitUntil(showFlyerReadyNotification(event.data));
});

self.addEventListener('notificationclick', (event) => {
  if (event.notification.tag !== MY_FLYER_READY_TAG) return;

  event.notification.close();
  const targetUrl = event.notification.data?.url || '/se/my-flyer';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url === new URL(targetUrl, self.location.origin).toString()) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
