import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EU_AGRI_FOOD_CRON, EU_AGRI_FOOD_REGISTRY_STATUS, parseEuAgriFoodRows } from '../connectors/benchmarks/eu-agri-food.js';
import { benchmarkSourceRegistry } from '../connectors/benchmarks/registry.js';

describe('EU agri-food benchmark connector', () => {
  it('parses Swedish upstream agriculture prices without fabricating missing values', () => {
    const rows = parseEuAgriFoodRows([
      {
        memberStateCode: 'SE',
        beginDate: '06/01/2026',
        endDate: '12/01/2026',
        price: '12,34',
        unit: 'EUR/100 kg',
        periodType: 'Week',
        period: 2,
        year: 2026,
        variety: 'Apples',
        productStage: 'Farmgate'
      },
      { memberStateCode: 'SE', beginDate: '13/01/2026', price: '', unit: 'EUR/100 kg', productStage: 'Farmgate' },
      { memberStateCode: 'DK', beginDate: '06/01/2026', price: '99', unit: 'EUR/100 kg', productStage: 'Farmgate' }
    ], '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      sourceId: 'EU_AGRI_FOOD',
      country: 'SE',
      vertical: 'grocery',
      ecoicopCode: '01.1',
      period: '2026-01-06',
      value: 12.34,
      unit: 'EUR/100 kg upstream_agriculture farmgate',
      observedAt: '2026-05-25T00:00:00.000Z'
    });
    assert.equal(EU_AGRI_FOOD_CRON, '17 5 * * 2');
    assert.equal(EU_AGRI_FOOD_REGISTRY_STATUS, 'ingestion_ready');
    assert.equal(benchmarkSourceRegistry.find((entry) => entry.sourceId === 'EU_AGRI_FOOD')?.status, 'ingestion_ready');
  });
});
