export {
  createTransactionalEmailClient,
  type CreateTransactionalEmailClientOptions,
  type TransactionalEmailClient,
  type TransactionalEmailFetch,
  type TransactionalEmailMessage,
  type TransactionalEmailProvider
} from '@groceryview/notifications';

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { TransactionalEmailMessage } from '@groceryview/notifications';

const DEFAULT_UNSUBSCRIBE_TOKEN_SECRET = 'groceryview-local-unsubscribe-token-secret';

export type EmailUnsubscribeTokenClaims = {
  action: 'disable_email_alerts';
  channel: 'email';
  email: string;
  userId: string;
  version: 1;
};

export type CheapestThisWeekDigestDeal = {
  productId: string;
  productSlug: string;
  productName: string;
  brand: string | null;
  chainName: string;
  storeName: string | null;
  price: number;
  regularPrice: number | null;
  currency: string;
  observedAt: string;
  interestSources: string[];
};

export type CheapestThisWeekDigestEmailInput = {
  recipientEmail: string;
  userId: string;
  deals: CheapestThisWeekDigestDeal[];
  baseUrl: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  unsubscribeTokenSecret?: string;
};

export function buildCheapestThisWeekDigestEmail(input: CheapestThisWeekDigestEmailInput): TransactionalEmailMessage {
  const topDeals = input.deals.slice(0, 10);
  const subject = topDeals.length === 0
    ? 'Cheapest this week in your GroceryView list'
    : `Cheapest this week: ${topDeals[0]!.productName}${topDeals.length > 1 ? ` and ${topDeals.length - 1} more` : ''}`;
  const lines = [
    'Here are the cheapest current prices GroceryView found this week for products you have searched or listed.',
    '',
    ...topDeals.flatMap((deal, index) => [
      `${index + 1}. ${formatDigestProductName(deal)} — ${formatMoney(deal.currency, deal.price)} at ${deal.storeName ?? deal.chainName}`,
      deal.regularPrice === null ? undefined : `   Regular price: ${formatMoney(deal.currency, deal.regularPrice)}`,
      `   Open: ${buildProductUrl(input.baseUrl, deal.productSlug)}`,
      `   Based on: ${deal.interestSources.join(', ')}`
    ]).filter((line): line is string => typeof line === 'string'),
    '',
    `Digest window: ${input.weekStart} to ${input.weekEnd}`,
    `Generated at: ${input.generatedAt}`,
    'You are receiving this because email digests are enabled in your GroceryView notification preferences.',
    '',
    `Unsubscribe from GroceryView email alerts: ${buildEmailUnsubscribeUrl(input.baseUrl, {
      recipientEmail: input.recipientEmail,
      userId: input.userId,
      secret: input.unsubscribeTokenSecret
    })}`
  ];

  return {
    to: input.recipientEmail,
    subject,
    text: lines.join('\n'),
    metadata: {
      type: 'weekly_cheapest_digest',
      userId: input.userId,
      sendAt: input.generatedAt,
      unsubscribeUrl: buildEmailUnsubscribeUrl(input.baseUrl, {
        recipientEmail: input.recipientEmail,
        userId: input.userId,
        secret: input.unsubscribeTokenSecret
      })
    }
  };
}

export function buildEmailUnsubscribeUrl(
  baseUrl: string,
  input: { recipientEmail: string; secret?: string; userId: string }
): string {
  const token = buildEmailUnsubscribeToken({
    email: input.recipientEmail,
    secret: input.secret,
    userId: input.userId
  });
  return `${baseUrl.replace(/\/+$/, '')}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function buildEmailUnsubscribeToken(
  input: { email: string; secret?: string; userId: string }
): string {
  const claims: EmailUnsubscribeTokenClaims = {
    action: 'disable_email_alerts',
    channel: 'email',
    email: input.email.trim().toLowerCase(),
    userId: input.userId,
    version: 1
  };
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = signPayload(payload, resolveUnsubscribeSecret(input.secret));
  return `${payload}.${signature}`;
}

export function verifyEmailUnsubscribeToken(token: string, secret?: string): EmailUnsubscribeTokenClaims | null {
  const [payload, signature, ...extra] = token.split('.');
  if (!payload || !signature || extra.length > 0) return null;
  const expected = signPayload(payload, resolveUnsubscribeSecret(secret));
  if (!constantTimeEqual(signature, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<EmailUnsubscribeTokenClaims>;
    if (
      claims.version !== 1 ||
      claims.action !== 'disable_email_alerts' ||
      claims.channel !== 'email' ||
      typeof claims.email !== 'string' ||
      !claims.email.includes('@') ||
      typeof claims.userId !== 'string' ||
      claims.userId.length === 0
    ) {
      return null;
    }

    return {
      action: claims.action,
      channel: claims.channel,
      email: claims.email,
      userId: claims.userId,
      version: claims.version
    };
  } catch {
    return null;
  }
}

function buildProductUrl(baseUrl: string, productSlug: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/product/${encodeURIComponent(productSlug)}`;
}

function formatDigestProductName(deal: CheapestThisWeekDigestDeal): string {
  return deal.brand ? `${deal.brand} ${deal.productName}` : deal.productName;
}

function formatMoney(currency: string, value: number): string {
  return `${currency} ${value.toFixed(2)}`;
}

function resolveUnsubscribeSecret(secret?: string): string {
  return secret && secret.length > 0 ? secret : DEFAULT_UNSUBSCRIBE_TOKEN_SECRET;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
