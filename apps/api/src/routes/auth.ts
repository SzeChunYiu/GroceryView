import { randomBytes } from 'node:crypto';

import {
  buildPasswordResetEmail,
  sendPasswordResetEmail,
  type PasswordResetEmailInput
} from '../lib/email.js';

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetResult = {
  token: string;
  expiresAt: string;
  resetUrl: string;
};

export type PasswordResetConfirm = {
  token: string;
  password: string;
};

export type PasswordResetFailure = {
  code: 'invalid_token' | 'expired_token' | 'missing_token' | 'weak_password';
  message: string;
};

type ResetTokenRecord = {
  email: string;
  expiresAt: string;
  usedAt?: string;
};

const DEFAULT_TTL_MINUTES = 15;
const activeResetTokens = new Map<string, ResetTokenRecord>();

function normalizeEmail(rawEmail: string): string {
  return (rawEmail ?? '').trim().toLowerCase();
}

function parseTtlMinutes(value: string | undefined): number {
  if (!value) return DEFAULT_TTL_MINUTES;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : DEFAULT_TTL_MINUTES;
}

function toResetUrl(token: string, expiresAt: string): string {
  const base =
    process.env.WEB_BASE_URL?.trim() || process.env.NEXT_PUBLIC_WEB_BASE_URL?.trim() || 'http://localhost:3000';

  return `${base.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}&expires=${encodeURIComponent(expiresAt)}`;
}

function isTokenExpired(record: ResetTokenRecord, now: Date): boolean {
  return new Date(record.expiresAt).getTime() <= now.getTime();
}

export function issuePasswordResetRequest(input: PasswordResetRequest): PasswordResetResult {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error('Email is required.');
  }

  const now = new Date();
  const ttlMinutes = parseTtlMinutes(process.env.PASSWORD_RESET_TTL_MINUTES);
  const expiresAtDate = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const token = randomBytes(24).toString('hex');
  const resetUrl = toResetUrl(token, expiresAtDate.toISOString());

  activeResetTokens.set(token, {
    email,
    expiresAt: new Date(expiresAtDate).toISOString()
  });

  const emailPayload = buildPasswordResetEmail({
    email,
    resetUrl,
    expiresAt: expiresAtDate.toISOString()
  } satisfies PasswordResetEmailInput);

  void sendPasswordResetEmail(emailPayload);

  return {
    token,
    expiresAt: expiresAtDate.toISOString(),
    resetUrl
  };
}

export function resolvePasswordResetToken(token: string, now = new Date()): ResetTokenRecord | PasswordResetFailure {
  if (!token) {
    return { code: 'missing_token', message: 'Reset token is required.' };
  }

  const found = activeResetTokens.get(token);
  if (!found) {
    return { code: 'invalid_token', message: 'Reset token is invalid.' };
  }

  if (found.usedAt) {
    return { code: 'invalid_token', message: 'Reset token has already been used.' };
  }

  if (isTokenExpired(found, now)) {
    activeResetTokens.delete(token);
    return { code: 'expired_token', message: 'Reset token has expired.' };
  }

  return { ...found };
}

export function confirmPasswordReset(input: PasswordResetConfirm): { email: string } {
  const { token, password } = input;
  const resolved = resolvePasswordResetToken(token);

  if ('code' in resolved) {
    throw new Error(resolved.message);
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const record = activeResetTokens.get(token);
  if (!record) {
    throw new Error('Reset token is invalid.');
  }

  record.usedAt = new Date().toISOString();
  return { email: record.email };
}

export function listActiveTokensForTesting(): number {
  const now = new Date();
  for (const [token, record] of activeResetTokens.entries()) {
    if (isTokenExpired(record, now)) activeResetTokens.delete(token);
  }
  return activeResetTokens.size;
}
