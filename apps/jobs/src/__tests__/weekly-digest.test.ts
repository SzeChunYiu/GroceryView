import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { QueryExecutor } from '@groceryview/db';
import {
  buildWeeklyDigestEmail,
  createWeeklyDigestResendClient,
  runWeeklyDigestJob,
  weeklyDigestWindow
} from '../weekly-digest.js';
import type { TransactionalEmailMessage } from '@groceryview/notifications';

type ExecutorCall = { sql: string; params: unknown[] };

type SubscriptionRow = {
  user_id: string;
  recipient_email: string;
};

type PriceChangeRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  store_slug: string | null;
  store_name: string | null;
  price_type: string;
  current_price: string;
  previous_price: string;
  change_amount: string;
  change_percent: string;
  currency: string;
  observed_at: string;
  confidence: string;
};

type DealRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  store_slug: string | null;
  store_name: string | null;
  price_type: string;
  current_price: string;
  regular_price: string | null;
  savings_amount: string | null;
  savings_percent: string | null;
  currency: string;
  observed_at: string;
  confidence: string;
  reason: string;
};

type BasketChangeRow = PriceChangeRow & {
  quantity: string;
  basket_week_start: string;
};

class WeeklyDigestExecutor implements QueryExecutor {
  readonly calls: ExecutorCall[] = [];

  constructor(
    private readonly fixtures: {
      subscriptions: SubscriptionRow[];
      changesByUser: Record<string, PriceChangeRow[]>;
      bestDealsByUser?: Record<string, DealRow[]>;
      basketChangesByUser?: Record<string, BasketChangeRow[]>;
      preferredStoreDealsByUser?: Record<string, DealRow[]>;
    }
  ) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.calls.push({ sql, params });

    if (sql.includes('weekly_digest_subscriptions')) {
      return this.fixtures.subscriptions as T[];
    }

    if (sql.includes('weekly_watchlist_price_changes')) {
      const userId = String(params[0]);
      return (this.fixtures.changesByUser[userId] ?? []) as T[];
    }

    if (sql.includes('weekly_best_deals')) {
      const userId = String(params[0]);
      return (this.fixtures.bestDealsByUser?.[userId] ?? []) as T[];
    }

    if (sql.includes('weekly_basket_price_changes')) {
      const userId = String(params[0]);
      return (this.fixtures.basketChangesByUser?.[userId] ?? []) as T[];
    }

    if (sql.includes('weekly_preferred_store_deals')) {
      const userId = String(params[0]);
      return (this.fixtures.preferredStoreDealsByUser?.[userId] ?? []) as T[];
    }

    throw new Error(`Unexpected SQL in weekly digest test: ${sql}`);
  }
}

describe('weekly digest job', () => {
  it('calculates the prior 7-day UTC window from the cron run time', () => {
    assert.deepEqual(weeklyDigestWindow('2026-05-24T08:00:00.000Z'), {
      since: '2026-05-17T08:00:00.000Z',
      until: '2026-05-24T08:00:00.000Z'
    });
  });

  it('sends one Resend-compatible weekly personalized savings digest per active email subscription user', async () => {
    const sentMessages: TransactionalEmailMessage[] = [];
    const executor = new WeeklyDigestExecutor({
      subscriptions: [
        { user_id: 'user-1', recipient_email: 'shopper@example.com' },
        { user_id: 'user-2', recipient_email: 'empty@example.com' }
      ],
      changesByUser: {
        'user-1': [
          {
            product_id: 'product-1',
            product_slug: 'coffee-450g',
            product_name: 'Zoégas Coffee 450g',
            brand: 'Zoégas',
            chain_slug: 'willys',
            chain_name: 'Willys',
            store_slug: 'willys-odenplan',
            store_name: 'Willys Odenplan',
            price_type: 'shelf',
            current_price: '49.90',
            previous_price: '55.00',
            change_amount: '-5.10',
            change_percent: '-9.27',
            currency: 'SEK',
            observed_at: '2026-05-23T09:00:00.000Z',
            confidence: '0.93'
          },
          {
            product_id: 'product-2',
            product_slug: 'oat-milk-1l',
            product_name: 'Oat Milk 1l',
            brand: null,
            chain_slug: 'ica',
            chain_name: 'ICA',
            store_slug: null,
            store_name: null,
            price_type: 'promotion',
            current_price: '18.50',
            previous_price: '16.00',
            change_amount: '2.50',
            change_percent: '15.63',
            currency: 'SEK',
            observed_at: '2026-05-22T10:00:00.000Z',
            confidence: '0.88'
          }
        ]
      },
      bestDealsByUser: {
        'user-1': [
          {
            product_id: 'product-3',
            product_slug: 'pasta-500g',
            product_name: 'Pasta 500g',
            brand: 'Garant',
            chain_slug: 'willys',
            chain_name: 'Willys',
            store_slug: 'willys-odenplan',
            store_name: 'Willys Odenplan',
            price_type: 'promotion',
            current_price: '12.00',
            regular_price: '18.00',
            savings_amount: '6.00',
            savings_percent: '33.33',
            currency: 'SEK',
            observed_at: '2026-05-23T07:00:00.000Z',
            confidence: '0.91',
            reason: 'saved basket, watchlist'
          }
        ]
      },
      basketChangesByUser: {
        'user-1': [
          {
            product_id: 'product-4',
            product_slug: 'bananas',
            product_name: 'Bananas',
            brand: null,
            chain_slug: 'coop',
            chain_name: 'Coop',
            store_slug: 'coop-city',
            store_name: 'Coop City',
            price_type: 'shelf',
            current_price: '22.90',
            previous_price: '25.90',
            change_amount: '-3.00',
            change_percent: '-11.58',
            currency: 'SEK',
            observed_at: '2026-05-21T08:00:00.000Z',
            confidence: '0.87',
            quantity: '2',
            basket_week_start: '2026-05-18'
          }
        ]
      },
      preferredStoreDealsByUser: {
        'user-1': [
          {
            product_id: 'product-5',
            product_slug: 'yoghurt-1kg',
            product_name: 'Yoghurt 1kg',
            brand: 'Arla',
            chain_slug: 'ica',
            chain_name: 'ICA',
            store_slug: 'ica-nara',
            store_name: 'ICA Nära',
            price_type: 'member',
            current_price: '24.90',
            regular_price: '31.90',
            savings_amount: '7.00',
            savings_percent: '21.94',
            currency: 'SEK',
            observed_at: '2026-05-23T12:00:00.000Z',
            confidence: '0.95',
            reason: 'preferred store'
          }
        ]
      }
    });

    const result = await runWeeklyDigestJob({
      baseUrl: 'https://groceryview.se',
      emailClient: {
        send: async (message) => {
          sentMessages.push(message);
          return `resend-${sentMessages.length}`;
        }
      },
      executor,
      maxChangesPerUser: 5,
      now: '2026-05-24T08:00:00.000Z'
    });

    assert.equal(result.subscriptionCount, 2);
    assert.deepEqual(result.sent, [
      {
        userId: 'user-1',
        recipientEmail: 'shopper@example.com',
        messageId: 'resend-1',
        itemCount: 5
      }
    ]);
    assert.deepEqual(result.skipped, [
      {
        userId: 'user-2',
        recipientEmail: 'empty@example.com',
        reason: 'no_personalized_digest_items'
      }
    ]);

    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0]?.to, 'shopper@example.com');
    assert.equal(sentMessages[0]?.subject, 'Your GroceryView weekly savings digest');
    assert.match(sentMessages[0]?.text ?? '', /weekly personalized savings digest/i);
    assert.match(sentMessages[0]?.text ?? '', /Zoégas Coffee 450g/);
    assert.match(sentMessages[0]?.text ?? '', /55\.00 SEK -> 49\.90 SEK/);
    assert.match(sentMessages[0]?.text ?? '', /-9\.27%/);
    assert.match(sentMessages[0]?.text ?? '', /Best deals from your saved items/);
    assert.match(sentMessages[0]?.text ?? '', /Pasta 500g/);
    assert.match(sentMessages[0]?.text ?? '', /Basket changes since your last planning window/);
    assert.match(sentMessages[0]?.text ?? '', /Bananas/);
    assert.match(sentMessages[0]?.text ?? '', /Preferred-store deals/);
    assert.match(sentMessages[0]?.text ?? '', /Yoghurt 1kg/);
    assert.match(sentMessages[0]?.text ?? '', /freshness/);
    assert.match(sentMessages[0]?.text ?? '', /Unsubscribe from weekly email digests:/);
    assert.match(sentMessages[0]?.text ?? '', /https:\/\/groceryview\.se\/product\/coffee-450g/);
    assert.deepEqual(sentMessages[0]?.metadata, {
      type: 'weekly_personalized_digest',
      userId: 'user-1',
      itemCount: '5',
      sendAt: '2026-05-24T08:00:00.000Z'
    });

    const subscriptionCall = executor.calls.find((call) => call.sql.includes('weekly_digest_subscriptions'));
    assert.ok(subscriptionCall, 'expected the job to read active subscriptions');
    assert.match(subscriptionCall.sql, /from notification_subscriptions/);
    assert.match(subscriptionCall.sql, /notification_subscriptions\.channel = 'email'/);
    assert.match(subscriptionCall.sql, /notification_subscriptions\.active = true/);
    assert.match(subscriptionCall.sql, /notification_subscriptions\.product_id is null/);
    assert.match(subscriptionCall.sql, /user_preferences\.notification_preferences/);
    assert.match(subscriptionCall.sql, /from notification_suppressions/);

    const changeCalls = executor.calls.filter((call) => call.sql.includes('weekly_watchlist_price_changes'));
    assert.equal(changeCalls.length, 2);
    assert.match(changeCalls[0]!.sql, /from watchlist_items/);
    assert.match(changeCalls[0]!.sql, /join products/);
    assert.match(changeCalls[0]!.sql, /from observations/);
    assert.match(changeCalls[0]!.sql, /lag\(observations\.price\)/);
    assert.deepEqual(changeCalls[0]!.params, ['user-1', '2026-05-17T08:00:00.000Z', '2026-05-24T08:00:00.000Z', 5]);

    const bestDealCalls = executor.calls.filter((call) => call.sql.includes('weekly_best_deals'));
    assert.equal(bestDealCalls.length, 2);
    assert.match(bestDealCalls[0]!.sql, /from watchlist_items/);
    assert.match(bestDealCalls[0]!.sql, /from weekly_baskets\s+join basket_items on basket_items\.basket_id = weekly_baskets\.id/);
    assert.match(bestDealCalls[0]!.sql, /join latest_prices/);
    assert.match(bestDealCalls[0]!.sql, /latest_prices\.confidence >= 0\.6/);

    const basketCalls = executor.calls.filter((call) => call.sql.includes('weekly_basket_price_changes'));
    assert.equal(basketCalls.length, 2);
    assert.match(basketCalls[0]!.sql, /from weekly_baskets/);
    assert.match(basketCalls[0]!.sql, /join basket_items/);
    assert.match(basketCalls[0]!.sql, /lag\(observations\.price\)/);

    const preferredStoreCalls = executor.calls.filter((call) => call.sql.includes('weekly_preferred_store_deals'));
    assert.equal(preferredStoreCalls.length, 2);
    assert.match(preferredStoreCalls[0]!.sql, /from favorite_stores/);
    assert.match(preferredStoreCalls[0]!.sql, /user_preferences\.favorite_stores/);
    assert.match(preferredStoreCalls[0]!.sql, /join latest_prices/);
  });

  it('builds the digest with existing transactional-email message shape', () => {
    const message = buildWeeklyDigestEmail({
      baseUrl: 'https://groceryview.se/',
      items: [
        {
          productId: 'product-1',
          productSlug: 'coffee-450g',
          productName: 'Zoégas Coffee 450g',
          brand: 'Zoégas',
          chainSlug: 'willys',
          chainName: 'Willys',
          storeSlug: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          priceType: 'shelf',
          currentPrice: 49.9,
          previousPrice: 55,
          changeAmount: -5.1,
          changePercent: -9.27,
          currency: 'SEK',
          observedAt: '2026-05-23T09:00:00.000Z',
          confidence: 0.93
        }
      ],
      now: '2026-05-24T08:00:00.000Z',
      recipientEmail: 'shopper@example.com',
      userId: 'user-1',
      window: { since: '2026-05-17T08:00:00.000Z', until: '2026-05-24T08:00:00.000Z' }
    });

    assert.equal(message.to, 'shopper@example.com');
    assert.equal(message.subject, 'Your GroceryView weekly savings digest');
    assert.match(message.text, /Digest window: 2026-05-17 to 2026-05-24/);
    assert.match(message.text, /Watchlist price changes:/);
    assert.match(message.text, /Every item above comes from persisted GroceryView price observations or latest-price rows/);
    assert.match(message.text, /Manage notification preferences:/);
    assert.match(message.text, /Unsubscribe from weekly email digests:/);
  });

  it('wires the weekly digest job into a scheduled GitHub Actions cron', () => {
    const workflow = readFileSync('../../.github/workflows/weekly-digest.yml', 'utf8');

    assert.match(workflow, /cron: '15 6 \* \* 1'/);
    assert.match(workflow, /npm run build -w @groceryview\/jobs/);
    assert.match(workflow, /node apps\/jobs\/dist\/weekly-digest\.js/);
    assert.match(workflow, /RESEND_API_KEY/);
    assert.match(workflow, /WEEKLY_DIGEST_FROM_EMAIL/);
    assert.match(workflow, /DATABASE_URL/);
  });

  it('creates a Resend client for the weekly digest cron job', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = createWeeklyDigestResendClient({
      apiKey: 'resend-key',
      fromEmail: 'weekly@groceryview.se',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({ id: 'resend-digest-1' });
      }
    });

    const messageId = await client.send({
      to: 'shopper@example.com',
      subject: 'Your GroceryView weekly savings digest',
      text: 'Digest body',
      metadata: {
        type: 'weekly_personalized_digest',
        userId: 'user-1',
        itemCount: '2',
        sendAt: '2026-05-24T08:00:00.000Z'
      }
    });

    assert.equal(messageId, 'resend-digest-1');
    assert.equal(calls[0]?.url, 'https://api.resend.com/emails');
    assert.equal((calls[0]?.init.headers as Record<string, string>).authorization, 'Bearer resend-key');
    assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
      from: 'weekly@groceryview.se',
      to: ['shopper@example.com'],
      subject: 'Your GroceryView weekly savings digest',
      text: 'Digest body',
      tags: [
        { name: 'type', value: 'weekly_personalized_digest' },
        { name: 'userId', value: 'user-1' },
        { name: 'itemCount', value: '2' },
        { name: 'sendAt', value: '2026-05-24T08:00:00.000Z' }
      ]
    });
    assert.doesNotMatch(String(calls[0]?.init.body), /resend-key/);
  });
});
