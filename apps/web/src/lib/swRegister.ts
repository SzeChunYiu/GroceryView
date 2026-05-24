'use client';

import { useEffect } from 'react';

let registrationStarted = false;

export function registerOfflineItemPageServiceWorker() {
  if (registrationStarted) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!window.isSecureContext && window.location.hostname !== 'localhost') return;

  registrationStarted = true;
  const register = () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.warn('GroceryView offline item-page service worker registration failed', error);
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
