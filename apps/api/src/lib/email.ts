export {
  createTransactionalEmailClient,
  type CreateTransactionalEmailClientOptions,
  type TransactionalEmailClient,
  type TransactionalEmailFetch,
  type TransactionalEmailMessage,
  type TransactionalEmailProvider
} from '@groceryview/notifications';

import type { TransactionalEmailMessage } from '@groceryview/notifications';

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
    'You are receiving this because email digests are enabled in your GroceryView notification preferences.'
  ];

  return {
    to: input.recipientEmail,
    subject,
    text: lines.join('\n'),
    metadata: {
      type: 'weekly_cheapest_digest',
      userId: input.userId,
      sendAt: input.generatedAt
    }
  };
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
