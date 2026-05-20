import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deliverDueNotifications, runScheduledNotificationDelivery } from '../index.js';

describe('deliverDueNotifications', () => {
  it('sends due push and email notifications through provider adapters and records results', async () => {
    const sent: string[] = [];
    const results = await deliverDueNotifications({
      now: '2026-05-19T10:00:00.000Z',
      notifications: [
        { channel: 'push', type: 'target_price', title: 'Coffee deal', body: 'Zoegas below 50 SEK', priority: 'high', sendAt: '2026-05-19T09:59:00.000Z', recipient: 'device-1' },
        { channel: 'email', type: 'weekly_report', title: 'Weekly report', body: 'You saved 58 SEK', priority: 'normal', sendAt: '2026-05-19T10:00:00.000Z', recipient: 'user@example.com' },
        { channel: 'push', type: 'budget_alert', title: 'Later budget alert', body: 'Review basket', priority: 'normal', sendAt: '2026-05-19T11:00:00.000Z', recipient: 'device-2' }
      ],
      providers: {
        push: { send: async (message) => { sent.push(`push:${message.recipient}:${message.title}`); return 'push-provider-id'; } },
        email: { send: async (message) => { sent.push(`email:${message.recipient}:${message.title}`); return 'email-provider-id'; } }
      }
    });

    assert.deepEqual(sent, ['push:device-1:Coffee deal', 'email:user@example.com:Weekly report']);
    assert.deepEqual(results, [
      { status: 'sent', channel: 'push', recipient: 'device-1', providerMessageId: 'push-provider-id' },
      { status: 'sent', channel: 'email', recipient: 'user@example.com', providerMessageId: 'email-provider-id' },
      { status: 'skipped_not_due', channel: 'push', recipient: 'device-2' }
    ]);
  });

  it('fails closed when a due notification has no configured provider', async () => {
    const results = await deliverDueNotifications({
      now: '2026-05-19T10:00:00.000Z',
      notifications: [
        { channel: 'email', type: 'budget_alert', title: 'Budget', body: 'Over budget', priority: 'high', sendAt: '2026-05-19T09:00:00.000Z', recipient: 'user@example.com' }
      ],
      providers: {}
    });

    assert.deepEqual(results, [
      { status: 'failed_no_provider', channel: 'email', recipient: 'user@example.com', reason: 'No email provider configured.' }
    ]);
  });
});

describe('runScheduledNotificationDelivery', () => {
  it('loads a due batch, sends through providers, and records every delivery result', async () => {
    const recorded: Array<{ notificationId: string; status: string }> = [];
    const report = await runScheduledNotificationDelivery({
      now: '2026-05-19T10:00:00.000Z',
      batchSize: 2,
      providers: {
        push: { send: async () => 'push-message-id' }
      },
      store: {
        loadDueNotifications: async (input) => {
          assert.deepEqual(input, { now: '2026-05-19T10:00:00.000Z', limit: 2 });
          return [
            { id: 'notification-1', channel: 'push', type: 'target_price', title: 'Coffee deal', body: 'Zoegas below 50 SEK', priority: 'high', sendAt: '2026-05-19T09:59:00.000Z', recipient: 'device-1' },
            { id: 'notification-2', channel: 'email', type: 'weekly_report', title: 'Weekly report', body: 'You saved 58 SEK', priority: 'normal', sendAt: '2026-05-19T09:59:00.000Z', recipient: 'user@example.com' }
          ];
        },
        recordDeliveryResult: async (notificationId, result) => {
          recorded.push({ notificationId, status: result.status });
        }
      }
    });

    assert.deepEqual(recorded, [
      { notificationId: 'notification-1', status: 'sent' },
      { notificationId: 'notification-2', status: 'failed_no_provider' }
    ]);
    assert.equal(report.status, 'processed');
    assert.equal(report.processed, 2);
    assert.equal(report.sent, 1);
    assert.equal(report.failed, 1);
    assert.deepEqual(report.results.map((result) => result.notificationId), ['notification-1', 'notification-2']);
  });

  it('fails fast when delivery result persistence fails', async () => {
    await assert.rejects(
      runScheduledNotificationDelivery({
        now: '2026-05-19T10:00:00.000Z',
        providers: {
          push: { send: async () => 'push-message-id' }
        },
        store: {
          loadDueNotifications: async () => [
            { id: 'notification-1', channel: 'push', type: 'target_price', title: 'Coffee deal', body: 'Zoegas below 50 SEK', priority: 'high', sendAt: '2026-05-19T09:59:00.000Z', recipient: 'device-1' }
          ],
          recordDeliveryResult: async () => {
            throw new Error('database unavailable');
          }
        }
      }),
      /database unavailable/
    );
  });
});
