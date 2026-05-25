import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { parseBearerToken, verifySessionToken, type SessionPayload } from '@groceryview/auth';

type JwtClaims = {
  email?: unknown;
  exp?: unknown;
  expiresAt?: unknown;
  sub?: unknown;
  userId?: unknown;
};

function base64UrlJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function verifyHs256Jwt(token: string, secret: string, now: Date): SessionPayload | null {
  const [headerPart, payloadPart, signature, extra] = token.split('.');
  if (!headerPart || !payloadPart || !signature || extra !== undefined) return null;

  const header = base64UrlJson<{ alg?: unknown; typ?: unknown }>(headerPart);
  if (header.alg !== 'HS256') throw new Error('Unsupported JWT algorithm.');

  const expectedSignature = createHmac('sha256', secret).update(`${headerPart}.${payloadPart}`).digest('base64url');
  if (!signaturesMatch(signature, expectedSignature)) throw new Error('Invalid JWT signature.');

  const claims = base64UrlJson<JwtClaims>(payloadPart);
  const userId = typeof claims.sub === 'string' && claims.sub ? claims.sub : typeof claims.userId === 'string' ? claims.userId : '';
  if (!userId) throw new Error('JWT subject is required.');

  const expiresAt = typeof claims.exp === 'number'
    ? new Date(claims.exp * 1000).toISOString()
    : typeof claims.expiresAt === 'string' ? claims.expiresAt : '';
  if (!expiresAt) throw new Error('JWT expiry is required.');
  if (new Date(expiresAt).getTime() <= now.getTime()) throw new Error('JWT expired.');

  return {
    userId,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    expiresAt
  };
}

export function authSecretFromEnv(env: NodeJS.ProcessEnv = process.env): string | null {
  const secret = env.AUTH_SECRET?.trim();
  return secret ? secret : null;
}

export async function verifyApiJwtToken(token: string, secret: string, now = new Date()): Promise<SessionPayload> {
  const jwtPayload = verifyHs256Jwt(token, secret, now);
  if (jwtPayload) return jwtPayload;
  return verifySessionToken(token, secret, now);
}

export async function authenticateBearerHeader(authorizationHeader: string | null | undefined, secret = authSecretFromEnv()): Promise<SessionPayload | null> {
  const token = parseBearerToken(authorizationHeader ?? null);
  if (!token || !secret) return null;

  try {
    return await verifyApiJwtToken(token, secret);
  } catch {
    return null;
  }
}

export { parseBearerToken, type SessionPayload };
