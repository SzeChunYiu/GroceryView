import { createHmac, timingSafeEqual } from 'node:crypto';

type ConsentSource =
  | { consent?: boolean | string; consented?: boolean | string; granted?: boolean | string }
  | Record<string, unknown>;

const CONSENT_TOKEN_SECRET_FALLBACK = 'analytics-consent-secret-dev';

type ConsentValue = true | false | null;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signTokenPayload(payloadPart: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadPart).digest('base64url');
}

function parseBooleanLike(value: unknown): ConsentValue {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'granted', 'allow'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'declined', 'denied', 'disallow'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

export type AnalyticsConsentPayload = {
  consent?: boolean | string;
  consented?: boolean | string;
  granted?: boolean | string;
  [key: string]: unknown;
};

export function resolveAnalyticsConsentSecret(secret?: string): string {
  return secret?.trim() || CONSENT_TOKEN_SECRET_FALLBACK;
}

export function createAnalyticsConsentToken(payload: AnalyticsConsentPayload, secret = CONSENT_TOKEN_SECRET_FALLBACK): string {
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  return `${payloadPart}.${signTokenPayload(payloadPart, secret)}`;
}

export function parseAnalyticsConsentToken(token: string, secret = CONSENT_TOKEN_SECRET_FALLBACK): AnalyticsConsentPayload {
  const [payloadPart, signature, extra] = token.split('.');

  if (!payloadPart || !signature || extra !== undefined) {
    throw new Error('Malformed analytics consent token.');
  }

  const expectedSignature = signTokenPayload(payloadPart, secret);
  const actualSignature = Buffer.from(signature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (
    actualSignature.length !== expectedBytes.length ||
    !timingSafeEqual(actualSignature, expectedBytes)
  ) {
    throw new Error('Invalid analytics consent token signature.');
  }

  try {
    return JSON.parse(base64UrlDecode(payloadPart)) as AnalyticsConsentPayload;
  } catch {
    throw new Error('Malformed analytics consent token payload.');
  }
}

export function isConsentTokenGranted(payload: AnalyticsConsentPayload): boolean {
  const raw =
    parseBooleanLike((payload as ConsentSource).consent) ??
    parseBooleanLike((payload as ConsentSource).consented) ??
    parseBooleanLike((payload as ConsentSource).granted);

  if (raw === null) {
    throw new Error('Consent token missing consent status.');
  }

  return raw === true;
}
