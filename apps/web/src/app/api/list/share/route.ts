import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SHARE_SECRET = process.env.LIST_SHARE_SECRET ?? 'groceryview-static-share-secret';
const SHARE_SIGNATURE_VERSION = 'v1';

type ShareItem = { checked?: boolean; detail?: string; id?: string; name?: string; quantity?: string };

type ShareRequestBody = { items?: ShareItem[]; origin?: string };

function base64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function signPayload(payload: string) {
  return createHmac('sha256', SHARE_SECRET).update(payload).digest('base64url');
}

function sanitizeItems(items: ShareItem[]) {
  return items
    .filter((item) => typeof item.id === 'string' && typeof item.name === 'string' && typeof item.quantity === 'string' && typeof item.detail === 'string')
    .slice(0, 80)
    .map((item) => ({
      checked: item.checked === true,
      detail: item.detail,
      id: item.id,
      name: item.name,
      quantity: item.quantity
    }));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as ShareRequestBody | null;
  const items = sanitizeItems(Array.isArray(body?.items) ? body.items : []);
  const payload = base64url(JSON.stringify({ createdAt: new Date().toISOString(), items, version: SHARE_SIGNATURE_VERSION }));
  const signature = signPayload(payload);
  const origin = typeof body?.origin === 'string' && body.origin.startsWith('http') ? body.origin : new URL(request.url).origin;
  const shareUrl = `${origin}/list?share=${payload}.${signature}`;

  return NextResponse.json({
    itemCount: items.length,
    readOnly: true,
    shareUrl,
    token: `${payload}.${signature}`,
    version: SHARE_SIGNATURE_VERSION
  });
}
