import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import {
  buildVerificationEmailMessage,
  createResendVerificationEmailClient,
  type TransactionalEmailClient,
  type TransactionalEmailFetch
} from '../lib/email.js';

const scrypt = promisify(scryptCallback);
const passwordHashPrefix = 'scrypt:v1';
const minimumPasswordLength = 8;
const verificationTokenTtlHours = 24;

export const authRoutes = {
  controllerPath: 'auth',
  signUp: 'auth/sign-up',
  verifyEmail: 'auth/verify-email',
  resendVerification: 'auth/resend-verification',
  blockedMutationCode: 'email_not_verified',
  guardedUserContent: ['alerts', 'lists'],
  verificationTtlHours: verificationTokenTtlHours
} as const;

export type AuthQueryExecutor = {
  query<T = unknown>(sql: string, values?: unknown[]): Promise<T[]>;
};

export type SignUpInput = {
  email: string;
  password: string;
  appUrl: string;
  now?: Date;
  userId?: string;
};

export type SignUpResult = {
  userId: string;
  email: string;
  emailVerified: boolean;
  verificationEmailId: string;
  verificationExpiresAt: string;
};

type UserRow = {
  id: string;
  email: string;
  email_verified_at: string | Date | null;
};

export function normalizeAuthEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('A valid email address is required.');
  return normalized;
}

export async function hashPassword(password: string, salt = randomBytes(16).toString('base64url')): Promise<string> {
  if (password.length < minimumPasswordLength) {
    throw new Error(`Password must be at least ${minimumPasswordLength} characters.`);
  }
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${passwordHashPrefix}:${salt}:${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [scheme, version, salt, expectedHash, extra] = passwordHash.split(':');
  if (`${scheme}:${version}` !== passwordHashPrefix || !salt || !expectedHash || extra !== undefined) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHash, 'base64url');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verificationTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildVerificationUrl(appUrl: string, token: string): string {
  const url = new URL('/verify-email', appUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export async function signUpWithEmailVerification(input: {
  executor: AuthQueryExecutor;
  emailClient: TransactionalEmailClient;
  signUp: SignUpInput;
}): Promise<SignUpResult> {
  const now = input.signUp.now ?? new Date();
  const email = normalizeAuthEmail(input.signUp.email);
  const userId = input.signUp.userId ?? `usr_${randomUUID()}`;
  const passwordHash = await hashPassword(input.signUp.password);
  const token = randomBytes(32).toString('base64url');
  const tokenHash = verificationTokenHash(token);
  const expiresAt = new Date(now.getTime() + verificationTokenTtlHours * 60 * 60 * 1000);

  const rows = await input.executor.query<UserRow>(
    `insert into app_users(id, email, password_hash, email_verified_at, created_at, updated_at)
     values ($1, $2, $3, null, $4, $4)
     on conflict (email) do update
       set password_hash = excluded.password_hash,
           updated_at = excluded.updated_at
     returning id, email, email_verified_at`,
    [userId, email, passwordHash, now.toISOString()]
  );
  const user = rows[0];
  if (!user) throw new Error('Unable to create user account.');

  await input.executor.query(
    `delete from email_verification_tokens
      where user_id = $1
        and used_at is null`,
    [user.id]
  );
  await input.executor.query(
    `insert into email_verification_tokens(user_id, token_hash, expires_at, created_at)
     values ($1, $2, $3, $4)`,
    [user.id, tokenHash, expiresAt.toISOString(), now.toISOString()]
  );

  const verificationEmailId = await input.emailClient.send(buildVerificationEmailMessage({
    to: email,
    verificationUrl: buildVerificationUrl(input.signUp.appUrl, token)
  }));

  return {
    userId: user.id,
    email,
    emailVerified: user.email_verified_at !== null,
    verificationEmailId,
    verificationExpiresAt: expiresAt.toISOString()
  };
}

export async function signUpWithResendEmailVerification(input: {
  executor: AuthQueryExecutor;
  signUp: SignUpInput;
  env?: NodeJS.ProcessEnv;
  fetch?: TransactionalEmailFetch;
}): Promise<SignUpResult> {
  return signUpWithEmailVerification({
    executor: input.executor,
    emailClient: createResendVerificationEmailClient({ env: input.env, fetch: input.fetch }),
    signUp: input.signUp
  });
}

export async function verifyEmailToken(input: {
  executor: AuthQueryExecutor;
  token: string;
  now?: Date;
}): Promise<{ userId: string; email: string; emailVerifiedAt: string }> {
  const now = input.now ?? new Date();
  const rows = await input.executor.query<UserRow>(
    `with consumed_token as (
       update email_verification_tokens
          set used_at = $2
        where token_hash = $1
          and used_at is null
          and expires_at > $2
        returning user_id
     )
     update app_users
        set email_verified_at = coalesce(email_verified_at, $2),
            updated_at = $2
       from consumed_token
      where app_users.id = consumed_token.user_id
      returning app_users.id, app_users.email, app_users.email_verified_at`,
    [verificationTokenHash(input.token), now.toISOString()]
  );
  const user = rows[0];
  if (!user?.email_verified_at) throw new Error('Verification token is invalid or expired.');
  return { userId: user.id, email: user.email, emailVerifiedAt: new Date(user.email_verified_at).toISOString() };
}

export async function assertVerifiedUserCanCreateUserContent(input: {
  executor: AuthQueryExecutor;
  userId: string;
  contentType: 'alerts' | 'lists';
}): Promise<void> {
  const rows = await input.executor.query<{ email_verified_at: string | Date | null }>(
    'select email_verified_at from app_users where id = $1 limit 1',
    [input.userId]
  );
  if (!rows[0]?.email_verified_at) {
    throw new Error(`${authRoutes.blockedMutationCode}:${input.contentType}`);
  }
}
