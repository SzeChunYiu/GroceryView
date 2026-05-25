import { verifyEmailUnsubscribeToken, type EmailUnsubscribeTokenClaims } from '../lib/email.js';

export const unsubscribeRoutes = {
  oneClickEmailAlerts: 'api/unsubscribe',
  tokenQueryParam: 'token',
  successDescription: 'Valid one-click unsubscribe tokens disable email alerts without requiring login.'
} as const;

export type DisableEmailAlertsMutation = (claims: EmailUnsubscribeTokenClaims) => Promise<void>;

export type HandleEmailUnsubscribeInput = {
  disableEmailAlerts: DisableEmailAlertsMutation;
  secret?: string;
  token: string;
};

export type HandleEmailUnsubscribeResult =
  | {
      ok: true;
      emailAlertsEnabled: false;
      recipientEmail: string;
      userId: string;
    }
  | {
      ok: false;
      reason: 'invalid_or_expired_token';
    };

export async function handleEmailUnsubscribeToken(input: HandleEmailUnsubscribeInput): Promise<HandleEmailUnsubscribeResult> {
  const claims = verifyEmailUnsubscribeToken(input.token, input.secret);
  if (!claims) return { ok: false, reason: 'invalid_or_expired_token' };

  await input.disableEmailAlerts(claims);
  return {
    ok: true,
    emailAlertsEnabled: false,
    recipientEmail: claims.email,
    userId: claims.userId
  };
}
