import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planNotifications } from '../index.js';

describe('planNotifications', () => {
  it('filters alert events through notification preferences and quiet hours', () => {
    const planned = planNotifications({
      now: '2026-05-19T20:30:00.000Z',
      preferences: {
        channels: ['push', 'email'],
        enabledTypes: ['target_price', 'favorite_store_deal', 'budget_alert', 'weekly_report'],
        quietHours: { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' }
      },
      events: [
        { type: 'target_price', title: 'Coffee below 50 SEK', body: 'Zoégas is 49.90 SEK.', priority: 'high' },
        { type: 'receipt_summary', title: 'Receipt ready', body: 'Review your receipt.', priority: 'normal' }
      ]
    });

    assert.deepEqual(planned.map((item) => ({ type: item.type, channel: item.channel, sendAt: item.sendAt })), [
      { type: 'target_price', channel: 'push', sendAt: '2026-05-19T20:30:00.000Z' },
      { type: 'target_price', channel: 'email', sendAt: '2026-05-19T20:30:00.000Z' }
    ]);
  });

  it('defers non-urgent notifications during quiet hours but allows high priority budget alerts', () => {
    const planned = planNotifications({
      now: '2026-05-19T22:30:00.000Z',
      preferences: {
        channels: ['push'],
        enabledTypes: ['budget_alert', 'weekly_report'],
        quietHours: { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' }
      },
      events: [
        { type: 'weekly_report', title: 'Weekly report', body: 'Coffee index down.', priority: 'normal' },
        { type: 'budget_alert', title: 'Budget exceeded', body: 'Trip is 12 SEK over budget.', priority: 'high' }
      ]
    });

    assert.deepEqual(planned.map((item) => ({ type: item.type, sendAt: item.sendAt })), [
      { type: 'weekly_report', sendAt: '2026-05-20T07:00:00.000Z' },
      { type: 'budget_alert', sendAt: '2026-05-19T22:30:00.000Z' }
    ]);
  });
});
