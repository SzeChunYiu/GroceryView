import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionPayload = {
  userId: string;
  email?: string;
  scope?: string[];
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
};

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64');
}

function readJsonPart<T>(value: string): T {
  return JSON.parse(base64UrlDecode(value).toString('utf8')) as T;
}

function sign(header: string, payload: string, secret: string) {
  return createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
}

function assertValidSignature(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error('Invalid JWT signature');
  }
}

export function parseBearerToken(authorization: string | null | undefined) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload> {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) throw new Error('Malformed JWT');

  const header = readJsonPart<{ alg?: string; typ?: string }>(encodedHeader);
  if (header.alg !== 'HS256') throw new Error('Unsupported JWT algorithm');

  assertValidSignature(signature, sign(encodedHeader, encodedPayload, secret));

  const payload = readJsonPart<SessionPayload>(encodedPayload);
  if (typeof payload.userId !== 'string' || payload.userId.length === 0) throw new Error('JWT missing userId');
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) throw new Error('JWT expired');

  return payload;
}
