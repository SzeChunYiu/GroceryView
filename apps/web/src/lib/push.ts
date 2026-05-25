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
