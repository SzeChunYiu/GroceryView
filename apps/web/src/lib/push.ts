'use client';

export const MY_FLYER_READY_PUSH_CHANNEL = 'my-flyer-ready';
export const MY_FLYER_READY_OPT_IN_KEY = 'groceryview:push:my-flyer-ready';

type PushPermissionState = 'default' | 'denied' | 'granted' | 'unsupported';

type PushSubscriptionJson = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    auth?: string;
    p256dh?: string;
  };
};

export type MyFlyerReadyNotification = {
  dealCount: number;
  saveUpToKr: number;
  generatedAt: string;
  url: string;
};

type MyFlyerApiRow = {
  scoreBreakdown?: {
    savings?: number;
  };
};

type MyFlyerApiPayload = {
  generatedAt?: string;
  rows?: MyFlyerApiRow[];
};

type MyFlyerRefreshQuery = {
  userId: string;
  algorithm?: string;
  country?: string;
  limit?: number;
  url?: string;
};

type EnableMyFlyerPushOptions = {
  accountId: string;
  vapidPublicKey?: string;
  subscriptionEndpoint?: string;
};

function notificationPermission(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function canUsePushManager() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(Array.from(rawData).map((character) => character.charCodeAt(0)));
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function safeLocalStorageGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function normalizeSavings(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

export function buildMyFlyerReadySummary(notification: Pick<MyFlyerReadyNotification, 'dealCount' | 'saveUpToKr'>) {
  const dealCount = Math.max(0, Math.floor(notification.dealCount));
  const dealLabel = dealCount === 1 ? 'deal' : 'deals';
  return `${dealCount} ${dealLabel} this week, save up to ${normalizeSavings(notification.saveUpToKr)} kr`;
}

export function myFlyerReadyNotificationFromPayload(
  payload: MyFlyerApiPayload,
  fallback: MyFlyerReadyNotification
): MyFlyerReadyNotification {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const saveUpToKr = rows.reduce((max, row) => Math.max(max, row.scoreBreakdown?.savings ?? 0), 0);

  return {
    dealCount: rows.length || fallback.dealCount,
    saveUpToKr: saveUpToKr || fallback.saveUpToKr,
    generatedAt: payload.generatedAt || fallback.generatedAt,
    url: fallback.url
  };
}

async function savePushConsent(options: EnableMyFlyerPushOptions, permission: PushPermissionState, subscription: PushSubscriptionJson | null) {
  const response = await fetch(options.subscriptionEndpoint ?? '/api/notifications/subscription', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      accountId: options.accountId,
      channels: [MY_FLYER_READY_PUSH_CHANNEL],
      deliveryEnabled: permission === 'granted' && Boolean(subscription),
      permission,
      subscription
    })
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Unable to save MyFlyer push consent.');
  return body as { deliveryEnabled: boolean; tokenId: string | null };
}

export async function enableMyFlyerReadyPush(options: EnableMyFlyerPushOptions) {
  if (typeof window === 'undefined') return { enabled: false, permission: 'unsupported' as PushPermissionState };

  let permission = notificationPermission();
  if (permission === 'default') permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    await savePushConsent(options, permission, null);
    return { enabled: false, permission };
  }

  let subscription: PushSubscriptionJson | null = null;
  if (canUsePushManager() && options.vapidPublicKey) {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const activeSubscription = existing ?? await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(options.vapidPublicKey),
      userVisibleOnly: true
    });
    subscription = activeSubscription.toJSON() as PushSubscriptionJson;
  }

  const saved = await savePushConsent(options, permission, subscription);
  safeLocalStorageSet(MY_FLYER_READY_OPT_IN_KEY, 'granted');

  return {
    deliveryEnabled: saved.deliveryEnabled,
    enabled: true,
    permission,
    tokenId: saved.tokenId
  };
}

export function hasMyFlyerReadyPushOptIn() {
  return safeLocalStorageGet(MY_FLYER_READY_OPT_IN_KEY) === 'granted' && notificationPermission() === 'granted';
}

export async function notifyMyFlyerReady(notification: MyFlyerReadyNotification) {
  if (!hasMyFlyerReadyPushOptIn()) return { delivered: false, reason: 'not_opted_in' as const };

  const title = 'Your MyFlyer is ready';
  const body = buildMyFlyerReadySummary(notification);
  const data = {
    ...notification,
    channel: MY_FLYER_READY_PUSH_CHANNEL,
    summary: body,
    type: 'MY_FLYER_READY_NOTIFICATION'
  };

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      data,
      icon: '/pwa-icon.svg',
      badge: '/pwa-maskable-icon.svg',
      renotify: true,
      tag: 'groceryview-my-flyer-ready'
    });
    return { delivered: true, reason: 'service_worker' as const };
  }

  new Notification(title, { body, data });
  return { delivered: true, reason: 'window_notification' as const };
}

export async function refreshMyFlyerAndNotify(query: MyFlyerRefreshQuery, fallback: MyFlyerReadyNotification) {
  const params = new URLSearchParams({
    user_id: query.userId,
    algorithm: query.algorithm ?? 'watchlist_first',
    country: query.country ?? 'se',
    limit: String(query.limit ?? fallback.dealCount)
  });
  const response = await fetch(`/api/my-flyer?${params.toString()}`, { cache: 'no-store' });
  const payload = (await response.json()) as MyFlyerApiPayload;
  if (!response.ok) throw new Error('Unable to refresh MyFlyer.');

  const cacheStatus = response.headers.get('X-MyFlyer-Cache');
  const notification = myFlyerReadyNotificationFromPayload(payload, { ...fallback, url: query.url ?? fallback.url });
  if (cacheStatus === 'MISS') await notifyMyFlyerReady(notification);

  return { cacheStatus, notification };
}
