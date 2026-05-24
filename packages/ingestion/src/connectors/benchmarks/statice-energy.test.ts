import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseStaticeEnergyResponse } from './statice-energy.js';

describe('STATICE_ENERGY benchmark connector', () => {
  it('emits only numeric published fixture values', () => {
    const rows = parseStaticeEnergyResponse({
      dimension: {
        period: { category: { index: { '2026-01': 0, '2026-02': 1 } } },
        product: { category: { index: { FUEL: 0 } } }
      },
      value: [101.2, null]
    }, '2026-05-24T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.source_id, 'STATICE_ENERGY');
    assert.equal(rows[0]?.country, 'IS');
    assert.equal(rows[0]?.vertical, 'fuel');
    assert.equal(rows[0]?.period, '2026-01');
    assert.equal(rows[0]?.value, 101.2);
  });
});
