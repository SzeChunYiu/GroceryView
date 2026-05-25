export type BrowserAccountSession = {
  accessToken: string;
  userId: string;
};

export type NotificationPermissionState = 'default' | 'denied' | 'granted' | 'unsupported';

export type PushConsentPayload = {
  deliveryEnabled: boolean;
  permission: NotificationPermissionState;
  subscription: PushSubscriptionJSON | null;
};

export type SavePushConsentInput = {
  channels: string[];
  endpoint?: string;
  payload: PushConsentPayload;
  session: BrowserAccountSession;
};

const accessTokenStorageKey = 'groceryview:accessToken';
const userIdStorageKey = 'groceryview:userId';
export const myFlyerReadyPushChannel = 'my-flyer-ready';

export type StoredNotificationSubscription = {
  accountId: string;
  channels: string[];
  deliveryEnabled: boolean;
  permission: NotificationPermissionState;
  subscription: PushSubscriptionJSON | null;
  tokenId: string | null;
  updatedAt: string;
  userAgent: string | null;
};

export type MyFlyerReadyPushPayload = {
  generatedAt: string;
  rows: Array<{
    offer: {
      chain: string;
      productName: string;
      savings: number;
    };
  }>;
  userId: string;
};

export type MyFlyerReadyPushDeliveryResult = {
  delivered: number;
  failed: number;
  skipped: number;
};

declare global {
  var groceryViewNotificationSubscriptions: Map<string, StoredNotificationSubscription> | undefined;
}

function notificationSubscriptionStore() {
  const store = globalThis.groceryViewNotificationSubscriptions ?? new Map<string, StoredNotificationSubscription>();
  globalThis.groceryViewNotificationSubscriptions = store;
  return store;
}

export function listPushSubscriptionsForChannel(channel: string) {
  return [...notificationSubscriptionStore().values()].filter((record) => (
    record.deliveryEnabled &&
    record.permission === 'granted' &&
    record.channels.includes(channel) &&
    Boolean(record.subscription?.endpoint)
  ));
}

export function buildMyFlyerReadyPushSummary(payload: MyFlyerReadyPushPayload) {
  const topOffer = payload.rows[0]?.offer;
  const prefix = `${payload.rows.length} MyFlyer deal${payload.rows.length === 1 ? '' : 's'} ready`;
  if (!topOffer) return `${prefix} for your weekly flyer.`;
  return `${prefix}: ${topOffer.productName} at ${topOffer.chain} saves ${Math.round(topOffer.savings)} kr.`;
}

export async function deliverMyFlyerReadyPushes(payload: MyFlyerReadyPushPayload, fetcher: typeof fetch = fetch): Promise<MyFlyerReadyPushDeliveryResult> {
  const subscriptions = listPushSubscriptionsForChannel(myFlyerReadyPushChannel)
    .filter((record) => record.accountId === payload.userId);
  const summary = buildMyFlyerReadyPushSummary(payload);
  const notification = {
    body: summary,
    generatedAt: payload.generatedAt,
    tag: myFlyerReadyPushChannel,
    title: 'MyFlyer is ready',
    type: myFlyerReadyPushChannel,
    url: `/se/my-flyer?user_id=${encodeURIComponent(payload.userId)}`
  };
  let delivered = 0;
  let failed = 0;

  await Promise.all(subscriptions.map(async (record) => {
    try {
      const response = await fetcher(record.subscription!.endpoint!, {
        body: JSON.stringify(notification),
        headers: {
          'content-type': 'application/json',
          ttl: '3600',
          urgency: 'normal'
        },
        method: 'POST'
      });
      if (response.ok || response.status === 201 || response.status === 202) delivered += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }));

  return { delivered, failed, skipped: subscriptions.length === 0 ? 1 : 0 };
}

function browserSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function cleanSessionValue(value: string | null) {
  return (value || '').trim();
}

export function readBrowserAccountSession(storage = browserSessionStorage()): BrowserAccountSession | null {
  const accessToken = cleanSessionValue(storage?.getItem(accessTokenStorageKey) ?? null);
  const userId = cleanSessionValue(storage?.getItem(userIdStorageKey) ?? null);
  if (!accessToken || !userId) return null;
  return { accessToken, userId };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(Array.from(rawData).map((character) => character.charCodeAt(0)));
}

async function getExistingPushSubscription() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return registration ? registration.pushManager.getSubscription() : null;
}

async function getOrCreatePushSubscription(vapidPublicKey: string) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !vapidPublicKey) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) return null;

  return registration.pushManager.getSubscription() || registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    userVisibleOnly: true
  });
}

export async function requestPushConsentPayload(vapidPublicKey: string): Promise<PushConsentPayload> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { deliveryEnabled: false, permission: 'unsupported', subscription: null };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { deliveryEnabled: false, permission, subscription: null };
  }

  const subscription = await getOrCreatePushSubscription(vapidPublicKey);
  return {
    deliveryEnabled: Boolean(subscription),
    permission,
    subscription: subscription ? subscription.toJSON() : null
  };
}

export async function readPushConsentPayload(): Promise<PushConsentPayload> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { deliveryEnabled: false, permission: 'unsupported', subscription: null };
  }

  const subscription = await getExistingPushSubscription();
  return {
    deliveryEnabled: Notification.permission === 'granted' && Boolean(subscription),
    permission: Notification.permission,
    subscription: subscription ? subscription.toJSON() : null
  };
}

export async function savePushConsent({ channels, endpoint = '/api/notifications/subscription', payload, session }: SavePushConsentInput) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      accountId: session.userId,
      channels,
      ...payload
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Unable to save push notification consent.');
  }
  return body as { accountId: string; status: string; tokenId: string | null };
}

export function buildMyFlyerRefreshUrl({
  algorithm,
  country,
  limit,
  userId
}: {
  algorithm: string;
  country: string;
  limit: number;
  userId: string;
}) {
  const params = new URLSearchParams({
    algorithm,
    country,
    limit: String(limit),
    user_id: userId
  });
  return `/api/my-flyer?${params.toString()}`;
}
