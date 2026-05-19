import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionPayload = {
  userId: string;
  email?: string;
  expiresAt: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payloadPart: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadPart).digest('base64url');
}

export async function createSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  if (!payload.userId) throw new Error('userId is required.');
  if (!payload.expiresAt) throw new Error('expiresAt is required.');
  if (!secret) throw new Error('secret is required.');
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  return `${payloadPart}.${sign(payloadPart, secret)}`;
}

export async function verifySessionToken(token: string, secret: string, now = new Date()): Promise<SessionPayload> {
  const [payloadPart, signature, extra] = token.split('.');
  if (!payloadPart || !signature || extra !== undefined) throw new Error('Malformed session token.');
  const expected = sign(payloadPart, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error('Invalid session signature.');
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart)) as Partial<SessionPayload>;
  if (!payload.userId || !payload.expiresAt) throw new Error('Malformed session payload.');
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) throw new Error('Session expired.');
  return { userId: payload.userId, email: payload.email, expiresAt: payload.expiresAt };
}

export function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
