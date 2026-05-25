export const authRoutes = {
  signup: 'api/auth/signup',
  verifyEmail: 'api/auth/verify-email',
  resendVerificationEmail: 'api/auth/verification-email',
  session: 'api/auth/session',
  emailPasswordSignupDescription: 'Create an email/password account and send a Resend verification email before private writes are enabled.',
  verifyEmailDescription: 'Verify the email verification token and mark the account as eligible for alert and list creation.',
  resendVerificationEmailDescription: 'Send a fresh verification email for an existing unverified account.',
  verifiedEmailRequiredMessage: 'Verify your email before creating alerts or lists.'
} as const;

export const verifiedEmailMutationRoutes = [
  'users/demo/watchlist/price-alerts',
  'users/:userId/basket/stock-up-list/rows'
] as const;

export type SignupRequestBody = {
  email: string;
  password: string;
};

export type SignupRoutePlan = {
  email: string;
  passwordHashRequired: true;
  verificationEmailRequired: true;
  emailProvider: 'resend';
  verificationTokenExpiresAt: string;
  blockedUntilVerifiedRoutes: typeof verifiedEmailMutationRoutes;
};

export type EmailVerificationAccount = {
  id: string;
  emailVerifiedAt?: string | Date | null;
};

export function normalizeSignupEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('A valid email address is required.');
  }
  return normalized;
}

export function buildSignupRoutePlan(input: SignupRequestBody, now = new Date()): SignupRoutePlan {
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  return {
    email: normalizeSignupEmail(input.email),
    passwordHashRequired: true,
    verificationEmailRequired: true,
    emailProvider: 'resend',
    verificationTokenExpiresAt: expiresAt.toISOString(),
    blockedUntilVerifiedRoutes: verifiedEmailMutationRoutes
  };
}

export function isEmailVerified(account: EmailVerificationAccount | null | undefined): boolean {
  return Boolean(account?.emailVerifiedAt);
}

export function assertEmailVerifiedForPrivateMutation(account: EmailVerificationAccount | null | undefined): void {
  if (!isEmailVerified(account)) {
    throw new Error(authRoutes.verifiedEmailRequiredMessage);
  }
}
