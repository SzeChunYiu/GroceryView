import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseStaticeCpiResponse } from './statice-cpi.js';

describe('STATICE_CPI benchmark connector', () => {
  it('emits only published fixture values without interpolation', () => {
    const rows = parseStaticeCpiResponse({
      dimension: {
        period: { category: { index: { '2026-01': 0, '2026-02': 1 } } },
        ecoicop: { category: { index: { CP00: 0 } } }
      },
      size: [2, 1],
      value: [612.3, null]
    }, '2026-05-24T00:00:00.000Z');

    assert.deepEqual(rows, [{
      source_id: 'STATICE_CPI',
      country: 'IS',
      vertical: 'cpi',
      ecoicop_code: 'CP00',
      period: '2026-01',
      value: 612.3,
      unit: 'index',
      observed_at: '2026-05-24T00:00:00.000Z'
    }]);
  });
});
