'use client';

import { useEffect } from 'react';

let registrationStarted = false;
const SHOPPING_LIST_ROUTE_CACHE_NAME = 'groceryview-shopping-list-route-v1';

async function warmOfflineShoppingListRoute() {
  if (!('caches' in window)) return;
  if (!navigator.onLine) return;

  try {
    const cache = await caches.open(SHOPPING_LIST_ROUTE_CACHE_NAME);
    await cache.add('/list');
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
