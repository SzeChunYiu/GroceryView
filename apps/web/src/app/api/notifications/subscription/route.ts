import { NextRequest, NextResponse } from 'next/server';

import type { StoredNotificationSubscription } from '@/lib/push';

type NotificationPermissionState = 'default' | 'denied' | 'granted' | 'unsupported';

declare global {
  var groceryViewNotificationSubscriptions: Map<string, StoredNotificationSubscription> | undefined;
}

export const dynamic = 'force-dynamic';

const subscriptions = globalThis.groceryViewNotificationSubscriptions ?? new Map<string, StoredNotificationSubscription>();
globalThis.groceryViewNotificationSubscriptions = subscriptions;

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeChannels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean).slice(0, 8);
}

function normalizePermission(value: unknown): NotificationPermissionState | null {
  return value === 'default' || value === 'denied' || value === 'granted' || value === 'unsupported' ? value : null;
}

function normalizeSubscription(value: unknown): PushSubscriptionJSON | null {
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
  const deliveryEnabled = Boolean(body.deliveryEnabled && permission === 'granted' && subscription);

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required to save push notification consent.' }, { status: 400 });
  }

  if (!permission) {
    return NextResponse.json({ error: 'A valid notification permission state is required.' }, { status: 400 });
  }

  const tokenId = subscription ? makeTokenId(subscription.endpoint) : null;
  const record: StoredNotificationSubscription = {
    accountId,
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
