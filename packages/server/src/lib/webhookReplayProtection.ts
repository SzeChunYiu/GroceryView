import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const webhookReplayProtectionHeaders = {
  signature: 'x-groceryview-signature',
  billingSignature: 'x-groceryview-billing-signature',
  timestamp: 'x-groceryview-timestamp',
  idempotencyKey: 'x-groceryview-idempotency-key'
} as const;

export const webhookReplayToleranceSeconds = 300;

export type WebhookReplayStore = {
  has(key: string): boolean;
  add(key: string, expiresAtMs: number): void;
};

export type WebhookVerificationInput = {
  body: string;
  idempotencyScope: 'billing' | 'notifications' | 'ingestion' | 'partner';
  now?: Date;
  request: Request;
  secret: string;
  signatureHeader?: string;
  store: WebhookReplayStore;
  toleranceSeconds?: number;
};

export type WebhookVerificationResult =
  | { ok: true; idempotencyKey: string; signedAt: string }
  | { ok: false; reason: 'missing_signature' | 'bad_signature' | 'missing_timestamp' | 'old_timestamp' | 'missing_idempotency_key' | 'duplicate_event' };

export class MemoryWebhookReplayStore implements WebhookReplayStore {
  private readonly seen = new Map<string, number>();

  has(key: string) {
    this.prune();
    return this.seen.has(key);
  }

  add(key: string, expiresAtMs: number) {
    this.prune();
    this.seen.set(key, expiresAtMs);
  }

  private prune(nowMs = Date.now()) {
    for (const [key, expiresAtMs] of this.seen) {
      if (expiresAtMs <= nowMs) this.seen.delete(key);
    }
  }
}

export function signWebhookBody(body: string, secret: string, timestamp: string) {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

export function verifySignedWebhookWithReplayProtection(input: WebhookVerificationInput): WebhookVerificationResult {
  const signatureHeader = input.signatureHeader ?? webhookReplayProtectionHeaders.signature;
  const signature = input.request.headers.get(signatureHeader);
  if (!signature) return { ok: false, reason: 'missing_signature' };

  const timestamp = input.request.headers.get(webhookReplayProtectionHeaders.timestamp);
  if (!timestamp) return { ok: false, reason: 'missing_timestamp' };
  const signedAtMs = Date.parse(timestamp);
  const now = input.now ?? new Date();
  const toleranceSeconds = input.toleranceSeconds ?? webhookReplayToleranceSeconds;
  if (Number.isNaN(signedAtMs) || Math.abs(now.getTime() - signedAtMs) > toleranceSeconds * 1000) {
    return { ok: false, reason: 'old_timestamp' };
  }

  const expected = signWebhookBody(input.body, input.secret, timestamp);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { ok: false, reason: 'bad_signature' };
  }

  const rawIdempotencyKey = input.request.headers.get(webhookReplayProtectionHeaders.idempotencyKey)?.trim();
  if (!rawIdempotencyKey) return { ok: false, reason: 'missing_idempotency_key' };
  const idempotencyKey = `${input.idempotencyScope}:${rawIdempotencyKey}`;
  if (input.store.has(idempotencyKey)) return { ok: false, reason: 'duplicate_event' };

  input.store.add(idempotencyKey, now.getTime() + toleranceSeconds * 1000);
  return { ok: true, idempotencyKey, signedAt: new Date(signedAtMs).toISOString() };
}
