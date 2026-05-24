import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseEuAgriFoodBenchmarkObservations } from '../connectors/benchmarks/eu-agri-food.js';

describe('EU agri-food benchmark connector', () => {
  it('normalizes Swedish upstream rows and skips missing or retail values', () => {
    const rows = parseEuAgriFoodBenchmarkObservations({ data: [
      { memberStateCode: 'SE', productStage: 'Farmgate', ecoicopCode: '01.1.6', beginDate: '2026-05-18', value: '123.45', unit: 'EUR/100kg' },
      { memberStateCode: 'SE', productStage: 'Retail', ecoicopCode: '01.1.6', beginDate: '2026-05-18', value: '999', unit: 'EUR/100kg' },
      { memberStateCode: 'DK', productStage: 'Farmgate', ecoicopCode: '01.1.6', beginDate: '2026-05-18', value: '111', unit: 'EUR/100kg' },
      { memberStateCode: 'SE', productStage: 'Farmgate', ecoicopCode: '01.1.6', beginDate: '2026-05-25', unit: 'EUR/100kg' }
    ] }, '2026-05-24T07:00:00.000Z');

    assert.deepEqual(rows, [{
      source_id: 'EU_AGRI_FOOD',
      country: 'SE',
      vertical: 'grocery',
      ecoicop_code: '01.1.6',
      period: '2026-05-18',
      value: 123.45,
      unit: 'EUR/100kg',
      observed_at: '2026-05-24T07:00:00.000Z'
    }]);
  });
});
