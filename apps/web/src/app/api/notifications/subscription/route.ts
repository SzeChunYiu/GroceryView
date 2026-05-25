import { NextRequest, NextResponse } from 'next/server';

type NotificationPermissionState = 'default' | 'denied' | 'granted' | 'unsupported';
type PushPreferenceChannel = 'price-drops' | 'list-changes' | 'expiring-deals' | 'pantry-reminders';
type PushPreferenceMap = Record<PushPreferenceChannel, boolean>;

type NotificationSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
};

type StoredNotificationSubscription = {
  accountId: string;
  channelPreferences: PushPreferenceMap;
  channels: string[];
  deliveryEnabled: boolean;
  permission: NotificationPermissionState;
  subscription: NotificationSubscription | null;
  tokenId: string | null;
  updatedAt: string;
  userAgent: string | null;
};

declare global {
  var groceryViewNotificationSubscriptions: Map<string, StoredNotificationSubscription> | undefined;
}

export const dynamic = 'force-dynamic';

const subscriptions = globalThis.groceryViewNotificationSubscriptions ?? new Map<string, StoredNotificationSubscription>();
globalThis.groceryViewNotificationSubscriptions = subscriptions;

const pushPreferenceChannels: PushPreferenceChannel[] = ['price-drops', 'list-changes', 'expiring-deals', 'pantry-reminders'];

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeChannels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean).slice(0, 8);
}

function emptyPushPreferenceMap(): PushPreferenceMap {
  return {
    'price-drops': false,
    'list-changes': false,
    'expiring-deals': false,
    'pantry-reminders': false
  };
}

function normalizeChannelPreferences(value: unknown, enabledChannels: string[]) {
  const preferences = emptyPushPreferenceMap();
  if (value && typeof value === 'object') {
    const candidate = value as Partial<Record<PushPreferenceChannel, unknown>>;
    for (const channel of pushPreferenceChannels) {
      preferences[channel] = candidate[channel] === true;
    }
  }

  for (const channel of enabledChannels) {
    if (pushPreferenceChannels.includes(channel as PushPreferenceChannel)) {
      preferences[channel as PushPreferenceChannel] = true;
    }
  }

  return preferences;
}

function normalizePermission(value: unknown): NotificationPermissionState | null {
  return value === 'default' || value === 'denied' || value === 'granted' || value === 'unsupported' ? value : null;
}

function normalizeSubscription(value: unknown): NotificationSubscription | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as { endpoint?: unknown; expirationTime?: unknown; keys?: { auth?: unknown; p256dh?: unknown } };
  const endpoint = cleanString(candidate.endpoint);
  const auth = cleanString(candidate.keys?.auth);
  const p256dh = cleanString(candidate.keys?.p256dh);

  if (!endpoint || !auth || !p256dh) return null;

  return {
    endpoint,
    expirationTime: typeof candidate.expirationTime === 'number' ? candidate.expirationTime : null,
    keys: { auth, p256dh }
  };
}

function makeTokenId(endpoint: string) {
  let hash = 0;
  for (let index = 0; index < endpoint.length; index += 1) {
    hash = (hash * 31 + endpoint.charCodeAt(index)) | 0;
  }
  return `push_${Math.abs(hash).toString(36)}`;
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const accountId = cleanString(body.accountId);
  const permission = normalizePermission(body.permission);
  const subscription = normalizeSubscription(body.subscription);
  const channels = normalizeChannels(body.channels);
  const channelPreferences = normalizeChannelPreferences(body.channelPreferences, channels);
  const deliveryEnabled = Boolean(body.deliveryEnabled && permission === 'granted' && subscription && channels.length > 0);

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required to save push notification consent.' }, { status: 400 });
  }

  if (!permission) {
    return NextResponse.json({ error: 'A valid notification permission state is required.' }, { status: 400 });
  }

  const tokenId = subscription ? makeTokenId(subscription.endpoint) : null;
  const record: StoredNotificationSubscription = {
    accountId,
    channelPreferences,
    channels,
    deliveryEnabled,
    permission,
    subscription,
    tokenId,
    updatedAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent')
  };

  subscriptions.set(accountId, record);

  return NextResponse.json({
    accountId,
    channelPreferences,
    channels,
    deliveryEnabled,
    permission,
    status: 'saved',
    tokenId,
    updatedAt: record.updatedAt
  });
}

export async function DELETE(request: NextRequest) {
  const body = await readJson(request);
  const accountId = cleanString(body.accountId) || cleanString(request.nextUrl.searchParams.get('accountId'));
  const endpoint = cleanString(body.endpoint) || cleanString(request.nextUrl.searchParams.get('endpoint'));

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required to remove a push notification token.' }, { status: 400 });
  }

  const existing = subscriptions.get(accountId);
  if (existing && (!endpoint || existing.subscription?.endpoint === endpoint)) {
    subscriptions.delete(accountId);
  }

  return NextResponse.json({ accountId, removed: true, status: 'deleted' });
}
