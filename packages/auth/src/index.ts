import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionPayload = {
  userId: string;
  email?: string;
  expiresAt: string;
};

export type MobileSessionPolicyInput = {
  userId: string;
  deviceId?: string;
  platform: 'ios' | 'android' | 'web';
  secureStorageAvailable: boolean;
  issuedAt: string;
  expiresAt: string;
  now: string;
};

export type MobileSessionPolicy = {
  userId: string;
  platform: MobileSessionPolicyInput['platform'];
  deviceBound: boolean;
  secureStorageRequired: boolean;
  refreshRecommended: boolean;
  expired: boolean;
  blockers: string[];
  actions: Array<'store_in_secure_storage' | 'refresh_session' | 'reauthenticate' | 'bind_device'>;
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

export function planMobileSessionPolicy(input: MobileSessionPolicyInput): MobileSessionPolicy {
  if (!input.userId) throw new Error('userId is required.');
  const issuedAtMs = Date.parse(input.issuedAt);
  const expiresAtMs = Date.parse(input.expiresAt);
  const nowMs = Date.parse(input.now);
  if (Number.isNaN(issuedAtMs)) throw new Error('issuedAt must be an ISO date.');
  if (Number.isNaN(expiresAtMs)) throw new Error('expiresAt must be an ISO date.');
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  if (expiresAtMs <= issuedAtMs) throw new Error('expiresAt must be after issuedAt.');

  const nativeClient = input.platform === 'ios' || input.platform === 'android';
  const blockers: string[] = [];
  const actions: MobileSessionPolicy['actions'] = [];
  const expired = expiresAtMs <= nowMs;
  const lifetimeMs = expiresAtMs - issuedAtMs;
  const remainingMs = expiresAtMs - nowMs;
  const refreshRecommended = !expired && remainingMs <= lifetimeMs * 0.25;

  if (nativeClient && !input.secureStorageAvailable) {
    blockers.push('Native mobile sessions require secure storage.');
  }
  if (nativeClient && !input.deviceId) {
    blockers.push('Native mobile sessions require a bound device id.');
    actions.push('bind_device');
  }
  if (input.secureStorageAvailable) actions.push('store_in_secure_storage');
  if (refreshRecommended) actions.push('refresh_session');
  if (expired) actions.push('reauthenticate');

  return {
    userId: input.userId,
    platform: input.platform,
    deviceBound: Boolean(input.deviceId),
    secureStorageRequired: nativeClient,
    refreshRecommended,
    expired,
    blockers,
    actions
  };
}
