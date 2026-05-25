'use client';

import { useEffect } from 'react';

let registrationStarted = false;
const SHOPPING_LIST_ROUTE_CACHE_NAME = 'groceryview-shopping-list-route-v1';
const OFFLINE_SAVED_LIST_STORAGE_KEY = 'groceryview:offline-saved-list:v1';
const OFFLINE_SAVED_LIST_UPDATED_EVENT = 'groceryview:offline-saved-list-updated';
const OFFLINE_SAVED_LIST_BASE_ROUTES = ['/list', '/favourites'];
const FAVOURITES_STORAGE_KEY = 'groceryview:favourite-products';
const FAVOURITES_UPDATED_EVENT = 'groceryview:favourite-products-updated';

function productRouteForOffline(slug: string) {
  const trimmedSlug = slug.trim();
  return trimmedSlug ? `/products/${encodeURIComponent(trimmedSlug)}` : null;
}

function offlineSavedListWarmRoutes() {
  const routes = new Set(OFFLINE_SAVED_LIST_BASE_ROUTES);

  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_SAVED_LIST_STORAGE_KEY) || 'null') as { routes?: unknown } | null;
    if (parsed && Array.isArray(parsed.routes)) {
      for (const route of parsed.routes) {
        if (typeof route === 'string' && route.startsWith('/')) routes.add(route);
      }
    }
  } catch {
    // Local offline route discovery is best-effort only.
  }

  try {
    const parsedFavourites = JSON.parse(localStorage.getItem(FAVOURITES_STORAGE_KEY) || '[]') as unknown;
    if (Array.isArray(parsedFavourites)) {
      for (const entry of parsedFavourites) {
        const slug = typeof entry === 'string'
          ? entry
          : (entry && typeof entry === 'object' && 'slug' in entry && typeof entry.slug === 'string' ? entry.slug : '');
        const route = productRouteForOffline(slug);
        if (route) routes.add(route);
      }
    }
  } catch {
    // Favourite product price routes are optional offline companions.
  }

  return [...routes].slice(0, 12);
}

async function warmOfflineShoppingListRoute() {
  if (!('caches' in window)) return;
  if (!navigator.onLine) return;

  try {
    const cache = await caches.open(SHOPPING_LIST_ROUTE_CACHE_NAME);
    await Promise.allSettled(offlineSavedListWarmRoutes().map((route) => cache.add(route)));
  } catch {
    // Offline route warming is opportunistic; registration should remain silent.
  }
}

export function registerOfflineItemPageServiceWorker() {
  if (registrationStarted) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!window.isSecureContext && window.location.hostname !== 'localhost') return;

  registrationStarted = true;
  window.addEventListener(OFFLINE_SAVED_LIST_UPDATED_EVENT, () => {
    void warmOfflineShoppingListRoute();
  });
  window.addEventListener(FAVOURITES_UPDATED_EVENT, () => {
    void warmOfflineShoppingListRoute();
  });

  const register = () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => warmOfflineShoppingListRoute())
      .catch(() => {
        registrationStarted = false;
      });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerOfflineItemPageServiceWorker();
  }, []);

  return null;
}
