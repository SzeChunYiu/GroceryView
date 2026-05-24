'use client';

export const FLYER_PUSH_OPT_IN_STORAGE_KEY = 'groceryview:my-flyer-push-opt-in';
export const FLYER_PUSH_LAST_NOTIFIED_STORAGE_KEY = 'groceryview:my-flyer-last-notified';
export const FLYER_READY_MESSAGE_TYPE = 'groceryview:flyer-ready';

export type FlyerPushPermissionState = 'unsupported' | 'denied' | 'prompt' | 'granted';

export type FlyerReadyNotificationPayload = Readonly<{
  flyerVersion: string;
  dealCount: number;
  maxSavingsKr: number;
  url?: string;
}>;

type ServiceWorkerFlyerReadyMessage = Readonly<{
  type: typeof FLYER_READY_MESSAGE_TYPE;
  payload: {
    title: string;
    body: string;
    tag: string;
    url: string;
    flyerVersion: string;
  };
}>;

function browserSupportsPwaNotifications() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    (window.isSecureContext || window.location.hostname === 'localhost')
  );
}

function safeLocalStorageGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be disabled in private browsing. Notification permission still works.
  }
}

export function getFlyerPushPermissionState(): FlyerPushPermissionState {
  if (!browserSupportsPwaNotifications()) return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : Notification.permission;
}

export function hasFlyerPushOptIn() {
  if (typeof window === 'undefined') return false;
  return safeLocalStorageGet(FLYER_PUSH_OPT_IN_STORAGE_KEY) === 'granted';
}

export function formatFlyerReadySummary({ dealCount, maxSavingsKr }: Pick<FlyerReadyNotificationPayload, 'dealCount' | 'maxSavingsKr'>) {
  const roundedSavings = Math.max(0, Math.round(maxSavingsKr));
  if (roundedSavings <= 0) return `${dealCount} deals this week`;
  return `${dealCount} deals this week, save up to ${roundedSavings} kr`;
}

async function ensureServiceWorkerRegistration() {
  if (!browserSupportsPwaNotifications()) return null;

  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;

  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function enableFlyerPushNotifications(): Promise<FlyerPushPermissionState> {
  if (!browserSupportsPwaNotifications()) return 'unsupported';

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'default' ? 'prompt' : permission;

  await ensureServiceWorkerRegistration();
  safeLocalStorageSet(FLYER_PUSH_OPT_IN_STORAGE_KEY, 'granted');
  return 'granted';
}

export async function notifyFlyerReadyIfNeeded(payload: FlyerReadyNotificationPayload) {
  if (!browserSupportsPwaNotifications()) return false;
  if (!hasFlyerPushOptIn()) return false;
  if (Notification.permission !== 'granted') return false;
  if (safeLocalStorageGet(FLYER_PUSH_LAST_NOTIFIED_STORAGE_KEY) === payload.flyerVersion) return false;

  const registration = await ensureServiceWorkerRegistration();
  if (!registration) return false;

  const url = payload.url ?? `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const message: ServiceWorkerFlyerReadyMessage = {
    type: FLYER_READY_MESSAGE_TYPE,
    payload: {
      title: 'Your weekly MyFlyer is ready',
      body: formatFlyerReadySummary(payload),
      tag: `groceryview-my-flyer-${payload.flyerVersion}`,
      url,
      flyerVersion: payload.flyerVersion
    }
  };

  const activeWorker = registration.active ?? navigator.serviceWorker.controller;
  if (activeWorker) {
    activeWorker.postMessage(message);
  } else {
    await registration.showNotification(message.payload.title, {
      body: message.payload.body,
      tag: message.payload.tag,
      data: { url: message.payload.url, flyerVersion: message.payload.flyerVersion },
      icon: '/pwa-icon.svg',
      badge: '/pwa-maskable-icon.svg'
    });
  }

  safeLocalStorageSet(FLYER_PUSH_LAST_NOTIFIED_STORAGE_KEY, payload.flyerVersion);
  return true;
}
