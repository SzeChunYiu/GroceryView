import { describe, expect, it } from 'vitest';
import { planNotifications } from '../../index.js';

describe('planNotifications', () => {
  const now = '2026-05-19T20:30:00.000Z';

  it('plans enabled grocery alerts across the preferred channels', () => {
    const planned = planNotifications({
      now,
      preferences: {
        channels: ['push', 'email'],
        enabledTypes: ['target_price', 'weekly_report'],
        quietHours: { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' }
      },
      events: [
        { type: 'target_price', title: 'Coffee below 50 SEK', body: 'Zoégas is 49.90 SEK.', priority: 'high' },
        { type: 'receipt_summary', title: 'Receipt ready', body: 'Review your receipt.', priority: 'normal' }
      ]
    });

    expect(planned).toEqual([
      { type: 'target_price', title: 'Coffee below 50 SEK', body: 'Zoégas is 49.90 SEK.', priority: 'high', channel: 'push', sendAt: now },
      { type: 'target_price', title: 'Coffee below 50 SEK', body: 'Zoégas is 49.90 SEK.', priority: 'high', channel: 'email', sendAt: now }
    ]);
  });

  it('returns an empty plan when there are no events to evaluate', () => {
    const planned = planNotifications({
      now,
      preferences: {
        channels: ['push'],
        enabledTypes: ['target_price'],
        quietHours: { startHour: 22, endHour: 7, timezone: 'Europe/Stockholm' }
      },
      events: []
    });

    expect(planned).toEqual([]);
  });

  it('throws when required event input is missing', () => {
    const malformedInput = {
      now,
      preferences: {
        channels: ['email'],
        enabledTypes: ['weekly_report']
      }
    };

    expect(() => planNotifications(malformedInput as unknown as Parameters<typeof planNotifications>[0])).toThrow(TypeError);
  });
});
