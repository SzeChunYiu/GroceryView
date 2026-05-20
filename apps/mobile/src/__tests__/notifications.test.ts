import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMobileNotificationPreferencePlan, summarizeMobileNotificationTopics } from '../notifications.js';

describe('mobile notification preference plan', () => {
  it('plans a ready notification preferences save when permission and device token are available', () => {
    const plan = buildMobileNotificationPreferencePlan({
      userId: ' Shopper-1 ',
      permission: 'granted',
      pushEnabled: true,
      deviceTokenRegistered: true,
      networkOnline: true,
      topics: ['target_price', 'deal_score', 'target_price', 'receipt_review'],
      favoriteStoresOnly: false,
      quietHours: { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' }
    });

    assert.equal(plan.route, '/profile/notifications-placeholder');
    assert.equal(plan.status, 'ready');
    assert.equal(plan.userId, 'Shopper-1');
    assert.deepEqual(plan.enabledTopics, ['target_price', 'deal_score', 'receipt_review']);
    assert.equal(plan.favoriteStoresOnly, false);
    assert.deepEqual(plan.quietHours, { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' });
    assert.deepEqual(plan.blockers, []);
    assert.deepEqual(plan.actions, ['save_notification_preferences']);
    assert.deepEqual(summarizeMobileNotificationTopics(plan), {
      target_price: true,
      deal_score: true,
      new_52_week_low: false,
      back_in_stock: false,
      budget_weekly_summary: false,
      receipt_review: true
    });
  });

  it('uses default price alert topics and asks for notification permission before saving', () => {
    const plan = buildMobileNotificationPreferencePlan({
      userId: 'shopper-1',
      permission: 'not_determined',
      pushEnabled: true,
      deviceTokenRegistered: false,
      networkOnline: true
    });

    assert.equal(plan.status, 'needs_permission');
    assert.deepEqual(plan.enabledTopics, ['target_price', 'deal_score', 'new_52_week_low']);
    assert.deepEqual(plan.blockers, ['notifications_permission_required']);
    assert.deepEqual(plan.actions, ['request_notifications_permission']);
  });

  it('blocks preference updates when system settings or network connectivity are required', () => {
    const denied = buildMobileNotificationPreferencePlan({
      userId: 'shopper-1',
      permission: 'blocked',
      pushEnabled: true,
      deviceTokenRegistered: false,
      networkOnline: false,
      topics: ['budget_weekly_summary']
    });

    assert.equal(denied.status, 'blocked');
    assert.deepEqual(denied.blockers, ['notifications_permission_blocked', 'network_required_to_update_notifications']);
    assert.deepEqual(denied.actions, ['open_system_notification_settings', 'retry_online']);

    const missingToken = buildMobileNotificationPreferencePlan({
      userId: 'shopper-1',
      permission: 'granted',
      pushEnabled: true,
      deviceTokenRegistered: false,
      networkOnline: true
    });

    assert.equal(missingToken.status, 'needs_device_token');
    assert.deepEqual(missingToken.blockers, ['push_token_not_registered']);
    assert.deepEqual(missingToken.actions, ['register_push_token']);
  });

  it('keeps disabled push preferences local and validates required fields', () => {
    const disabled = buildMobileNotificationPreferencePlan({
      userId: 'shopper-1',
      permission: 'unavailable',
      pushEnabled: false,
      deviceTokenRegistered: false,
      networkOnline: false,
      quietHours: { startHour: 8, endHour: 17, timezone: ' Europe/Stockholm ' }
    });

    assert.equal(disabled.status, 'disabled');
    assert.deepEqual(disabled.enabledTopics, []);
    assert.deepEqual(disabled.actions, ['enable_push_notifications']);
    assert.deepEqual(disabled.blockers, ['notifications_unavailable']);
    assert.deepEqual(disabled.quietHours, { startHour: 8, endHour: 17, timezone: 'Europe/Stockholm' });

    assert.throws(
      () => buildMobileNotificationPreferencePlan({ userId: ' ', permission: 'granted', pushEnabled: true, deviceTokenRegistered: true, networkOnline: true }),
      /userId is required/
    );
    assert.throws(
      () =>
        buildMobileNotificationPreferencePlan({
          userId: 'shopper-1',
          permission: 'granted',
          pushEnabled: true,
          deviceTokenRegistered: true,
          networkOnline: true,
          quietHours: { startHour: 25, endHour: 7, timezone: 'Europe/Stockholm' }
        }),
      /quietHours.startHour/
    );
    assert.throws(
      () =>
        buildMobileNotificationPreferencePlan({
          userId: 'shopper-1',
          permission: 'granted',
          pushEnabled: true,
          deviceTokenRegistered: true,
          networkOnline: true,
          quietHours: { startHour: 7, endHour: 7, timezone: 'Europe/Stockholm' }
        }),
      /non-empty window/
    );
  });
});
