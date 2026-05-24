import { createHmac, timingSafeEqual } from 'node:crypto';

type SharePayload = {
  expiresAt: string;
  items: unknown[];
};

const DEFAULT_EXPIRES_IN_HOURS = 24;
const MAX_EXPIRES_IN_HOURS = 24 * 7;
const secret = process.env.LIST_SHARE_SECRET ?? 'groceryview-local-share-secret';

function base64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function createToken(payload: SharePayload) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function readToken(token: string): SharePayload | null {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return JSON.parse(fromBase64Url(encodedPayload));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : null;

  if (!items) {
    return Response.json({ error: 'Shopping list items are required.' }, { status: 400 });
  }

  const requestedHours = Number(body?.expiresInHours ?? DEFAULT_EXPIRES_IN_HOURS);
  const expiresInHours = Number.isFinite(requestedHours)
    ? Math.min(Math.max(requestedHours, 1), MAX_EXPIRES_IN_HOURS)
    : DEFAULT_EXPIRES_IN_HOURS;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  const token = createToken({ expiresAt, items });
  const shareUrl = new URL(`/api/list/share?token=${encodeURIComponent(token)}`, request.url);

  return Response.json({ expiresAt, shareUrl: shareUrl.toString() });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  const payload = token ? readToken(token) : null;

  if (!payload) {
    return Response.json({ error: 'Share link is invalid.' }, { status: 400 });
  }

  if (Date.parse(payload.expiresAt) <= Date.now()) {
    return Response.json({ error: 'Share link has expired.' }, { status: 410 });
  }

  return Response.json(payload);
}
