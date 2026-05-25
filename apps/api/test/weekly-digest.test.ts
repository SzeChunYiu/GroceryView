import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCheapestThisWeekDigestEmail, type TransactionalEmailMessage } from '../src/lib/email.js';
import { runWeeklyCheapestDigestJob } from '../src/jobs/weeklyDigest.js';

describe('weekly cheapest digest email job', () => {
  it('renders searched-or-listed cheapest deals into a transactional email', () => {
    const message = buildCheapestThisWeekDigestEmail({
      recipientEmail: 'shopper@example.com',
      userId: 'user-1',
      baseUrl: 'https://groceryview.se',
      weekStart: '2026-05-18T00:00:00.000Z',
      weekEnd: '2026-05-25T00:00:00.000Z',
      generatedAt: '2026-05-25T08:00:00.000Z',
      deals: [{
        productId: 'coffee',
        productSlug: 'zoegas-coffee',
        productName: 'Bryggkaffe',
        brand: 'Zoégas',
        chainName: 'Willys',
        storeName: 'Willys Odenplan',
        price: 39.9,
        regularPrice: 54.9,
        currency: 'SEK',
        observedAt: '2026-05-24T08:00:00.000Z',
        interestSources: ['search', 'watchlist']
      }]
    });

    assert.equal(message.to, 'shopper@example.com');
    assert.equal(message.subject, 'Cheapest this week: Bryggkaffe');
    assert.match(message.text, /searched or listed/);
    assert.match(message.text, /Zoégas Bryggkaffe — SEK 39\.90 at Willys Odenplan/);
    assert.match(message.text, /https:\/\/groceryview\.se\/product\/zoegas-coffee/);
    assert.match(message.text, /Unsubscribe from GroceryView email alerts: https:\/\/groceryview\.se\/api\/unsubscribe\?token=/);
    assert.equal(message.metadata?.type, 'weekly_cheapest_digest');
    assert.match(message.metadata?.unsubscribeUrl ?? '', /^https:\/\/groceryview\.se\/api\/unsubscribe\?token=/);
  });

  it('sends at most the ten personalized deal rows returned by the database query', async () => {
    const sentMessages: TransactionalEmailMessage[] = [];
    const result = await runWeeklyCheapestDigestJob({
      baseUrl: 'https://groceryview.se',
      now: new Date('2026-05-25T08:00:00.000Z'),
      executor: {
        async query<T>() {
          return [{
            user_id: 'user-1',
            recipient_email: 'shopper@example.com',
            product_id: 'coffee',
            product_slug: 'zoegas-coffee',
            product_name: 'Bryggkaffe',
            brand: 'Zoégas',
            chain_slug: 'willys',
            chain_name: 'Willys',
            store_slug: 'willys-odenplan',
            store_name: 'Willys Odenplan',
            price_type: 'promotion',
            price: '39.90',
            regular_price: '54.90',
            unit_price: '88.67',
            currency: 'SEK',
            observed_at: '2026-05-24T08:00:00.000Z',
            interest_sources: ['search']
          }] as T[];
        }
      },
      emailClient: {
        async send(message) {
          sentMessages.push(message);
          return 'digest-message-1';
        }
      }
    });

    assert.deepEqual(result, {
      sent: [{
        userId: 'user-1',
        recipientEmail: 'shopper@example.com',
        dealCount: 1,
        messageId: 'digest-message-1'
      }],
      skipped: []
    });
    assert.equal(sentMessages.length, 1);
    assert.match(sentMessages[0]?.text ?? '', /Based on: search/);
    assert.match(sentMessages[0]?.text ?? '', /\/api\/unsubscribe\?token=/);
  });
});
