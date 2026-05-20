import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groceryAlertChannelDefaults, planGroceryAlertChannelDefault, planNotifications } from '../index.js';

describe('planGroceryAlertChannelDefault', () => {
  it('defines every grocery alert type with a stable channel default and reason', () => {
    const expected = [
      'target_price',
      'new_low',
      'weekly_watchlist_digest',
      'back_in_stock',
      'member_only',
      'rss_feed',
      'basket_digest'
    ] as const;

    assert.deepEqual(groceryAlertChannelDefaults.map((plan) => plan.alertType), [...expected]);
    for (const alertType of expected) {
      const plan = planGroceryAlertChannelDefault(alertType);

      assert.equal(plan.alertType, alertType);
      assert.ok(plan.eligibleChannels.includes(plan.defaultChannel));
      assert.ok(plan.reason.length > 30);
      assert.ok(plan.dedupeWindowHours >= 0);
      assert.ok(['immediate_24h_dedupe', 'daily_digest', 'weekly_digest', 'pull_only'].includes(plan.maxFrequency));
    }
  });

  it('sets expected defaults for direct watches, grocery digests, and RSS feeds', () => {
    assert.deepEqual(planGroceryAlertChannelDefault('target_price'), {
      alertType: 'target_price',
      defaultChannel: 'email',
      eligibleChannels: ['email', 'push', 'in_app', 'rss'],
      requiresExplicitOptIn: true,
      isPromotionalEmail: false,
      requiresOneClickUnsubscribe: false,
      requiresPreferenceLink: true,
      maxFrequency: 'immediate_24h_dedupe',
      quietHoursRespect: true,
      dedupeWindowHours: 24,
      rssEligible: true,
      reason: 'A user-set threshold is expected to produce a direct alert, while push still requires explicit platform opt-in.'
    });
    assert.equal(planGroceryAlertChannelDefault('weekly_watchlist_digest').defaultChannel, 'in_app_digest');
    assert.equal(planGroceryAlertChannelDefault('weekly_watchlist_digest').maxFrequency, 'weekly_digest');
    assert.equal(planGroceryAlertChannelDefault('rss_feed').defaultChannel, 'rss');
    assert.equal(planGroceryAlertChannelDefault('rss_feed').requiresExplicitOptIn, false);
    assert.equal(planGroceryAlertChannelDefault('rss_feed').quietHoursRespect, false);
  });

  it('requires explicit opt-in for push-capable defaults', () => {
    for (const plan of groceryAlertChannelDefaults.filter((candidate) => candidate.eligibleChannels.includes('push'))) {
      assert.equal(plan.requiresExplicitOptIn, true, `${plan.alertType} push opt-in missing`);
      assert.equal(plan.quietHoursRespect, true, `${plan.alertType} should respect quiet hours`);
    }
  });

  it('marks promotional email defaults with unsubscribe posture', () => {
    for (const plan of groceryAlertChannelDefaults.filter((candidate) => candidate.isPromotionalEmail)) {
      assert.ok(plan.eligibleChannels.includes('email'));
      assert.equal(plan.requiresOneClickUnsubscribe, true, `${plan.alertType} one-click unsubscribe missing`);
      assert.equal(plan.requiresPreferenceLink, true, `${plan.alertType} preference link missing`);
    }
  });

  it('keeps member-only alerts out of push, email, and RSS defaults', () => {
    const plan = planGroceryAlertChannelDefault('member_only');

    assert.equal(plan.defaultChannel, 'in_app_digest');
    assert.deepEqual(plan.eligibleChannels, ['in_app_digest', 'in_app']);
    assert.equal(plan.rssEligible, false);
    assert.equal(plan.isPromotionalEmail, false);
  });
});

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
