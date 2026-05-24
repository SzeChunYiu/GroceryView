import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterActivePromotions, isPromotionActive } from '../index.js';

describe('active promotion freshness filtering', () => {
  const now = '2026-05-24T12:00:00.000Z';

  it('keeps only promotions whose start/end bounds include now', () => {
    const rows = [
      { id: 'active-window', starts_at: '2026-05-24T00:00:00.000Z', ends_at: '2026-05-25T00:00:00.000Z' },
      { id: 'null-start', starts_at: null, ends_at: '2026-05-24T12:00:00.000Z' },
      { id: 'null-end', starts_at: '2026-05-24T12:00:00.000Z', ends_at: null },
      { id: 'future', starts_at: '2026-05-24T12:00:01.000Z', ends_at: null },
      { id: 'expired', starts_at: null, ends_at: '2026-05-24T11:59:59.999Z' }
    ];

    assert.deepEqual(filterActivePromotions(rows, now).map((row) => row.id), ['active-window', 'null-start', 'null-end']);
  });

  it('treats exact boundaries as active and invalid dates as inactive', () => {
    assert.equal(isPromotionActive({ starts_at: now, ends_at: now }, now), true);
    assert.equal(isPromotionActive({ starts_at: 'not-a-date', ends_at: null }, now), false);
    assert.equal(isPromotionActive({ starts_at: null, ends_at: 'not-a-date' }, now), false);
  });
});
