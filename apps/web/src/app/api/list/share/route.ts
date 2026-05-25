import { createHmac } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

type ShareLinkRequest = {
  expiresAt?: string | null;
  items?: unknown[];
  listId?: string;
};

type ShareTokenPayload = {
  createdAt: string;
  expiresAt: string | null;
  items: unknown[];
  listId: string;
};

function shareSecret() {
  return process.env.LIST_SHARE_SECRET || process.env.NEXT_PUBLIC_LIST_SHARE_SECRET || 'local-list-share-development-secret';
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', shareSecret()).update(encodedPayload).digest('base64url');
}

function normalizedExpiry(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as ShareLinkRequest;
  const payload: ShareTokenPayload = {
    createdAt: new Date().toISOString(),
    expiresAt: normalizedExpiry(body.expiresAt),
    items: Array.isArray(body.items) ? body.items.slice(0, 50) : [],
    listId: body.listId?.trim() || 'local-shopping-list',
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const token = `${encodedPayload}.${signPayload(encodedPayload)}`;
  const shareUrl = new URL('/list', request.nextUrl.origin);
  shareUrl.searchParams.set('share', token);

  return NextResponse.json({
    token,
    shareUrl: shareUrl.toString(),
    expiresAt: payload.expiresAt,
    signature: 'hmac-sha256',
  });
}
