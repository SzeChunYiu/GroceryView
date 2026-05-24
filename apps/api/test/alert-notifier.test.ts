import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { WatchlistAlert } from '@groceryview/core';
import { notifyTriggeredPriceAlerts } from '../src/jobs/alertNotifier.js';
import { createTransactionalEmailClient } from '../src/lib/email.js';
import type { TransactionalEmailMessage } from '../src/lib/email.js';
import { alertsRoutes } from '../src/routes/alerts.js';

const targetPriceAlert: WatchlistAlert = {
  productId: 'coffee-450g',
  productName: 'Zoégas Coffee 450g',
  type: 'target_price',
  severity: 'urgent',
  trigger: {
    metric: 'price',
    value: 49.9,
    threshold: 55,
    storeName: 'Willys'
  },
  message: 'Zoégas Coffee 450g is 49.90 SEK at Willys, below your 55.00 SEK target.'
};

describe('transactional price alert email notifier', () => {
  it('sends triggered price alerts with a product link through the configured email client', async () => {
    const sentMessages: TransactionalEmailMessage[] = [];

    const result = await notifyTriggeredPriceAlerts({
      baseUrl: 'https://groceryview.se',
      emailClient: {
        send: async (message) => {
          sentMessages.push(message);
          return 'message-1';
        }
      },
      notifications: [
        { recipientEmail: 'shopper@example.com', alert: targetPriceAlert },
        {
          recipientEmail: 'shopper@example.com',
          alert: {
            ...targetPriceAlert,
            type: 'deal_score',
            trigger: { metric: 'deal_score', value: 85, threshold: 80 }
          }
        }
      ],
      now: '2026-05-24T02:00:00.000Z'
    });

    assert.equal(result.sent.length, 1);
    assert.equal(result.skipped.length, 1);
    assert.equal(sentMessages[0]?.to, 'shopper@example.com');
    assert.equal(sentMessages[0]?.subject, 'Zoégas Coffee 450g price drop alert');
    assert.match(sentMessages[0]?.text ?? '', /https:\/\/groceryview\.se\/product\/coffee-450g/);
    assert.match(sentMessages[0]?.text ?? '', /49\.90 SEK at Willys/);
    assert.match(sentMessages[0]?.text ?? '', /threshold: 55\.00 SEK/);
    assert.equal(alertsRoutes.priceAlertEmailNotifierJob, 'jobs/alerts/price-email-notifier');
  });

  it('suppresses one-off outlier price updates before sending alert emails', async () => {
    const sentMessages: TransactionalEmailMessage[] = [];

    const result = await notifyTriggeredPriceAlerts({
      baseUrl: 'https://groceryview.se',
      emailClient: {
        send: async (message) => {
          sentMessages.push(message);
          return 'message-1';
        }
      },
      notifications: [
        {
          recipientEmail: 'shopper@example.com',
          alert: {
            ...targetPriceAlert,
            trigger: {
              ...targetPriceAlert.trigger,
              value: 9.9,
              confidenceLow: 42,
              confidenceHigh: 68,
              outlierStreak: 1
            } as WatchlistAlert['trigger']
          }
        },
        {
          recipientEmail: 'shopper@example.com',
          alert: {
            ...targetPriceAlert,
            productId: 'coffee-450g-repeat',
            trigger: {
              ...targetPriceAlert.trigger,
              value: 9.9,
              confidenceLow: 42,
              confidenceHigh: 68,
              outlierStreak: 2
            } as WatchlistAlert['trigger']
          }
        }
      ],
      now: '2026-05-24T02:00:00.000Z'
    });

    assert.equal(result.sent.length, 1);
    assert.equal(result.skipped.length, 1);
    assert.equal(result.skipped[0]?.reason, 'one_off_outlier');
    assert.equal(result.skipped[0]?.productId, 'coffee-450g');
    assert.equal(sentMessages[0]?.metadata?.productId, 'coffee-450g-repeat');
  });

  it('formats Resend and Postmark transactional email requests without leaking API keys', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];

    const resend = createTransactionalEmailClient({
      provider: 'resend',
      apiKey: 'resend-key',
      fromEmail: 'alerts@groceryview.se',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({ id: 'resend-message-1' });
      }
    });

    const resendId = await resend.send({
      to: 'shopper@example.com',
      subject: 'Coffee price drop',
      text: 'Open https://groceryview.se/product/coffee-450g',
      metadata: { type: 'target_price', productId: 'coffee-450g', sendAt: '2026-05-24T02:00:00.000Z' }
    });

    const postmark = createTransactionalEmailClient({
      provider: 'postmark',
      apiKey: 'postmark-token',
      fromEmail: 'alerts@groceryview.se',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({ MessageID: 'postmark-message-1' });
      }
    });

    const postmarkId = await postmark.send({
      to: 'shopper@example.com',
      subject: 'Coffee price drop',
      text: 'Open https://groceryview.se/product/coffee-450g',
      metadata: { type: 'target_price', productId: 'coffee-450g', sendAt: '2026-05-24T02:00:00.000Z' }
    });

    assert.equal(resendId, 'resend-message-1');
    assert.equal(postmarkId, 'postmark-message-1');
    assert.equal(calls[0]?.url, 'https://api.resend.com/emails');
    assert.equal((calls[0]?.init.headers as Record<string, string>).authorization, 'Bearer resend-key');
    assert.equal(calls[1]?.url, 'https://api.postmarkapp.com/email');
    assert.equal((calls[1]?.init.headers as Record<string, string>)['x-postmark-server-token'], 'postmark-token');
    assert.doesNotMatch(String(calls[0]?.init.body), /resend-key/);
    assert.doesNotMatch(String(calls[1]?.init.body), /postmark-token/);
  });
});
