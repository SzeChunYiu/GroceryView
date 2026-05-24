import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { notificationPreferenceBodySchema, notificationQuerySchema, formatZodIssues } from '../src/app/api/notifications/validation.mjs';

describe('notifications API route validation schema', () => {
  it('accepts a valid notification request and rejects malformed params with structured issues', () => {
    const happyQuery = notificationQuerySchema.safeParse({ userId: ' household-42 ', includeMuted: 'false' });
    assert.equal(happyQuery.success, true);
    assert.deepEqual(happyQuery.data, { userId: 'household-42', includeMuted: false });

    const happyBody = notificationPreferenceBodySchema.safeParse({
      userId: 'household-42',
      channel: 'push',
      enabled: true,
      topics: ['price_drop', 'watchlist_alert'],
      quietHours: { start: '21:00', end: '07:00', timezone: 'Europe/Stockholm' }
    });
    assert.equal(happyBody.success, true);
    assert.equal(happyBody.data.channel, 'push');

    const rejectedBody = notificationPreferenceBodySchema.safeParse({
      userId: '',
      channel: 'sms',
      enabled: 'yes',
      topics: [],
      quietHours: { start: '25:00', end: '07:00' }
    });
    assert.equal(rejectedBody.success, false);
    const issues = formatZodIssues(rejectedBody.error.issues);
    assert.ok(issues.length >= 4);
    assert.ok(issues.some((issue) => issue.path === 'userId' && /required/i.test(issue.message)));
    assert.ok(issues.some((issue) => issue.path === 'channel'));
    assert.ok(issues.some((issue) => issue.path === 'enabled'));
    assert.ok(issues.some((issue) => issue.path === 'topics'));
    assert.ok(issues.some((issue) => issue.path === 'quietHours.start'));
  });
});
