import { createHmac } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { listShareRoles, normalizePublicListShareItems, publicListSharePath, resolveListShareRole } from '@/lib/list-permissions';

type ShareLinkRequest = {
  collaboratorEmail?: string;
  expiresAt?: string | null;
  items?: unknown[];
  listId?: string;
  role?: string;
};

type ShareTokenPayload = {
  collaboratorEmail: string | null;
  createdAt: string;
  expiresAt: string | null;
  items: unknown[];
  listId: string;
  role: ReturnType<typeof resolveListShareRole>;
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
  const defaultExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const role = resolveListShareRole(body.role);
  const payload: ShareTokenPayload = {
    collaboratorEmail: body.collaboratorEmail?.trim() || null,
    createdAt: new Date().toISOString(),
    expiresAt: normalizedExpiry(body.expiresAt) ?? defaultExpiresAt,
    items: Array.isArray(body.items) ? normalizePublicListShareItems(body.items) : [],
    listId: body.listId?.trim() || 'local-shopping-list',
    role,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const token = `${encodedPayload}.${signPayload(encodedPayload)}`;
  const shareUrl = new URL(publicListSharePath(token), request.nextUrl.origin);

  return NextResponse.json({
    token,
    shareUrl: shareUrl.toString(),
    expiresAt: payload.expiresAt,
    invitation: {
      collaboratorEmail: payload.collaboratorEmail,
      role,
      roleLabel: listShareRoles[role].label,
      capabilities: listShareRoles[role].capabilities,
    },
    signature: 'hmac-sha256',
  });
}
