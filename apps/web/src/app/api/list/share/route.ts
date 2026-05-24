import { NextResponse, type NextRequest } from 'next/server';

type ShareLinkRequest = {
  listId?: string;
  expiresAt?: string | null;
};

type ShareTokenPayload = {
  listId: string;
  createdAt: string;
  expiresAt: string | null;
};

function encodeShareToken(payload: ShareTokenPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function normalizedExpiry(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as ShareLinkRequest;
  const createdAt = new Date().toISOString();
  const payload: ShareTokenPayload = {
    listId: body.listId?.trim() || 'local-shopping-list',
    createdAt,
    expiresAt: normalizedExpiry(body.expiresAt),
  };
  const token = encodeShareToken(payload);
  const shareUrl = new URL('/list', request.nextUrl.origin);
  shareUrl.searchParams.set('share', token);

  return NextResponse.json({
    token,
    shareUrl: shareUrl.toString(),
    createdAt,
    expiresAt: payload.expiresAt,
    expires: payload.expiresAt !== null,
  });
}
