import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { QueryExecutor } from '@groceryview/db';
import {
  buildWeeklyDigestEmail,
  createWeeklyDigestResendClient,
  runMyFlyerDigestJob,
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

type MyFlyerSubscriptionRow = {
  country: string;
  user_id: string;
  recipient_email: string;
};

type MyFlyerOfferRow = {
  product_id: string;
  product_name: string;
  brand: string | null;
  chain_name: string;
  store_name: string | null;
  offer_price: string;
  regular_price: string | null;
  unit_price: string | null;
  currency: string;
  valid_until: string | null;
  image_url: string | null;
  source_url: string | null;
  confidence: string;
};

class WeeklyDigestExecutor implements QueryExecutor {
  readonly calls: ExecutorCall[] = [];

  constructor(
    private readonly fixtures: {
      subscriptions: SubscriptionRow[];
      changesByUser: Record<string, PriceChangeRow[]>;
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

    throw new Error(`Unexpected SQL in weekly digest test: ${sql}`);
  }
}

class MyFlyerDigestExecutor implements QueryExecutor {
  readonly calls: ExecutorCall[] = [];

  constructor(
    private readonly fixtures: {
      subscriptions: MyFlyerSubscriptionRow[];
      offersByUser: Record<string, MyFlyerOfferRow[]>;
    }
  ) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.calls.push({ sql, params });

    if (sql.includes('my_flyer_digest_subscriptions')) {
      return this.fixtures.subscriptions as T[];
    }

    if (sql.includes('my_flyer_email_offers')) {
      const userId = String(params[0]);
      return (this.fixtures.offersByUser[userId] ?? []) as T[];
    }

    throw new Error(`Unexpected SQL in MyFlyer digest test: ${sql}`);
  }
}

describe('weekly digest job', () => {
  it('calculates the prior 7-day UTC window from the cron run time', () => {
    assert.deepEqual(weeklyDigestWindow('2026-05-24T08:00:00.000Z'), {
      since: '2026-05-17T08:00:00.000Z',
      until: '2026-05-24T08:00:00.000Z'
    });
  });

  it('sends one Resend-compatible weekly watchlist summary per active email subscription user', async () => {
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
        itemCount: 2
      }
    ]);
    assert.deepEqual(result.skipped, [
      {
        userId: 'user-2',
        recipientEmail: 'empty@example.com',
        reason: 'no_watchlist_price_changes'
      }
    ]);

    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0]?.to, 'shopper@example.com');
    assert.equal(sentMessages[0]?.subject, 'Your GroceryView weekly watchlist summary');
    assert.match(sentMessages[0]?.text ?? '', /7-day watchlist summary/i);
    assert.match(sentMessages[0]?.text ?? '', /Zoégas Coffee 450g/);
    assert.match(sentMessages[0]?.text ?? '', /55\.00 SEK → 49\.90 SEK/);
    assert.match(sentMessages[0]?.text ?? '', /-9\.27%/);
    assert.match(sentMessages[0]?.text ?? '', /https:\/\/groceryview\.se\/product\/coffee-450g/);
    assert.deepEqual(sentMessages[0]?.metadata, {
      type: 'weekly_watchlist_digest',
      userId: 'user-1',
      itemCount: '2',
      sendAt: '2026-05-24T08:00:00.000Z'
    });

    const subscriptionCall = executor.calls.find((call) => call.sql.includes('weekly_digest_subscriptions'));
    assert.ok(subscriptionCall, 'expected the job to read active subscriptions');
    assert.match(subscriptionCall.sql, /from notification_subscriptions/);
    assert.match(subscriptionCall.sql, /notification_subscriptions\.channel = 'email'/);
    assert.match(subscriptionCall.sql, /notification_subscriptions\.active = true/);

    const changeCalls = executor.calls.filter((call) => call.sql.includes('weekly_watchlist_price_changes'));
    assert.equal(changeCalls.length, 2);
    assert.match(changeCalls[0]!.sql, /from watchlist_items/);
    assert.match(changeCalls[0]!.sql, /join products/);
    assert.match(changeCalls[0]!.sql, /from observations/);
    assert.match(changeCalls[0]!.sql, /lag\(observations\.price\)/);
    assert.deepEqual(changeCalls[0]!.params, ['user-1', '2026-05-17T08:00:00.000Z', '2026-05-24T08:00:00.000Z', 5]);
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
    assert.equal(message.subject, 'Your GroceryView weekly watchlist summary');
    assert.match(message.text, /Watchlist price changes from 2026-05-17 to 2026-05-24/);
    assert.match(message.text, /No synthetic or estimated rows are included/);
    assert.match(message.text, /Manage notification preferences:/);
  });

  it('wires the weekly digest job into a scheduled GitHub Actions cron', () => {
    const workflow = readFileSync('../../.github/workflows/weekly-digest.yml', 'utf8');

    assert.match(workflow, /cron: '0 6 \* \* 1'/);
    assert.match(workflow, /npm run build -w @groceryview\/jobs/);
    assert.match(workflow, /node apps\/jobs\/dist\/weekly-digest\.js/);
    assert.match(workflow, /RESEND_API_KEY/);
    assert.match(workflow, /WEEKLY_DIGEST_FROM_EMAIL/);
    assert.match(workflow, /DATABASE_URL/);
    assert.match(workflow, /MY_FLYER_DIGEST_COUNTRIES/);
  });

  it('sends MyFlyer HTML only to explicit weekly email opt-ins by country', async () => {
    const sentMessages: TransactionalEmailMessage[] = [];
    const executor = new MyFlyerDigestExecutor({
      subscriptions: [
        { country: 'se', user_id: 'user-1', recipient_email: 'flyer@example.com' },
        { country: 'no', user_id: 'user-2', recipient_email: 'empty@example.com' }
      ],
      offersByUser: {
        'user-1': [
          {
            product_id: 'coffee',
            product_name: 'Zoégas Coffee 450g',
            brand: 'Zoégas',
            chain_name: 'Willys',
            store_name: 'Willys Odenplan',
            offer_price: '49.90',
            regular_price: '59.90',
            unit_price: '110.89',
            currency: 'SEK',
            valid_until: '2026-05-25T21:59:59.000Z',
            image_url: 'https://example.com/coffee.png',
            source_url: 'https://example.com/source',
            confidence: '0.96'
          }
        ]
      }
    });

    const result = await runMyFlyerDigestJob({
      baseUrl: 'https://groceryview.se',
      countries: ['se', 'no'],
      emailClient: {
        send: async (message) => {
          sentMessages.push(message);
          return `resend-${sentMessages.length}`;
        }
      },
      executor,
      maxOffersPerUser: 8,
      now: '2026-05-25T06:00:00.000Z'
    });

    assert.deepEqual(result.countries, ['se', 'no']);
    assert.equal(result.subscriptionCount, 2);
    assert.deepEqual(result.sent, [
      {
        country: 'se',
        userId: 'user-1',
        recipientEmail: 'flyer@example.com',
        messageId: 'resend-1',
        itemCount: 1
      }
    ]);
    assert.deepEqual(result.skipped, [
      {
        country: 'no',
        userId: 'user-2',
        recipientEmail: 'empty@example.com',
        reason: 'no_my_flyer_offers'
      }
    ]);

    assert.equal(sentMessages[0]?.subject, 'Your GroceryView MyFlyer for 2026-05-18');
    assert.match(sentMessages[0]?.text ?? '', /Open the flyer: https:\/\/groceryview\.se\/se\/my-flyer/);
    assert.match(sentMessages[0]?.html ?? '', /Zoégas Coffee 450g/);
    assert.match(sentMessages[0]?.html ?? '', /Open MyFlyer/);
    assert.deepEqual(sentMessages[0]?.metadata, {
      type: 'my_flyer_weekly_digest',
      userId: 'user-1',
      country: 'se',
      itemCount: '1',
      sendAt: '2026-05-25T06:00:00.000Z'
    });

    const subscriptionCall = executor.calls.find((call) => call.sql.includes('my_flyer_digest_subscriptions'));
    assert.ok(subscriptionCall, 'expected explicit MyFlyer opt-in subscriptions query');
    assert.match(subscriptionCall.sql, /notification_preferences ->> 'myFlyerWeeklyEmail' = 'true'/);
    assert.match(subscriptionCall.sql, /notification_subscriptions\.channel = 'email'/);
    assert.deepEqual(subscriptionCall.params, [['se', 'no']]);

    const offerCall = executor.calls.find((call) => call.sql.includes('my_flyer_email_offers'));
    assert.ok(offerCall, 'expected source-backed MyFlyer offer query');
    assert.match(offerCall.sql, /observations\.price_type in \('promotion', 'member'\)/);
    assert.match(offerCall.sql, /chains\.country_code = upper\(\$2\)/);
    assert.match(offerCall.sql, /left join watched_products/);
    assert.deepEqual(offerCall.params, ['user-1', 'se', '2026-05-18T06:00:00.000Z', '2026-05-25T06:00:00.000Z', 8]);
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
      subject: 'Your GroceryView weekly watchlist summary',
      text: 'Digest body',
      metadata: {
        type: 'weekly_watchlist_digest',
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
      subject: 'Your GroceryView weekly watchlist summary',
      text: 'Digest body',
      tags: [
        { name: 'type', value: 'weekly_watchlist_digest' },
        { name: 'userId', value: 'user-1' },
        { name: 'itemCount', value: '2' },
        { name: 'sendAt', value: '2026-05-24T08:00:00.000Z' }
      ]
    });
    assert.doesNotMatch(String(calls[0]?.init.body), /resend-key/);
  });
});
