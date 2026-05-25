import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { forecastGrocerySpend } from '../index.js';

describe('forecastGrocerySpend', () => {
  it('forecasts next-month spend from purchase_history month totals', () => {
    const forecast = forecastGrocerySpend({
      asOf: '2026-05-24T12:00:00.000Z',
      purchase_history: [
        { purchasedAt: '2026-02-03T17:10:00.000Z', totalSpend: 500, receiptId: 'feb-1' },
        { purchasedAt: '2026-02-17T16:30:00.000Z', totalSpend: 400, receiptId: 'feb-2' },
        { purchasedAt: '2026-03-04T18:20:00.000Z', totalSpend: 520, receiptId: 'mar-1' },
        { purchasedAt: '2026-03-18T16:45:00.000Z', totalSpend: 460, receiptId: 'mar-2' },
        { purchasedAt: '2026-04-02T17:35:00.000Z', totalSpend: 540, receiptId: 'apr-1' },
        { purchasedAt: '2026-04-16T18:05:00.000Z', totalSpend: 500, receiptId: 'apr-2' },
        { purchasedAt: '2026-05-07T17:50:00.000Z', totalSpend: 570, receiptId: 'may-1' },
        { purchasedAt: '2026-05-21T18:15:00.000Z', totalSpend: 600, receiptId: 'may-2' }
      ]
    });

    assert.equal(forecast.forecastMonth, '2026-06');
    assert.equal(forecast.observedMonths, 4);
    assert.equal(forecast.observedSpend, 4090);
    assert.deepEqual(forecast.monthSummaries, [
      { month: '2026-02', spend: 900, receiptCount: 2 },
      { month: '2026-03', spend: 980, receiptCount: 2 },
      { month: '2026-04', spend: 1040, receiptCount: 2 },
      { month: '2026-05', spend: 1170, receiptCount: 2 }
    ]);
    assert.equal(forecast.baselineMonthlySpend, 1063.33);
    assert.equal(forecast.predictedSpend, 1131.12);
    assert.equal(forecast.trendPercent, 6.4);
    assert.equal(forecast.confidence, 'high');
    assert.deepEqual(forecast.confidenceDrivers, {
      observedMonths: 4,
      receiptCount: 8,
      highThresholdMonths: 4,
      highThresholdReceipts: 8,
      mediumThresholdMonths: 2,
      mediumThresholdReceipts: 3
    });
    assert.deepEqual(forecast.skippedRows, []);
    assert.deepEqual(forecast.warnings, []);
  });

  it('skips invalid and future purchases while preserving low-confidence warnings', () => {
    const forecast = forecastGrocerySpend({
      asOf: '2026-05-24T12:00:00.000Z',
      forecastMonth: '2026-07',
      purchase_history: [
        { purchasedAt: '2026-05-10T12:00:00.000Z', totalSpend: 250, receiptId: 'valid' },
        { purchasedAt: 'bad-date', totalSpend: 100, receiptId: 'bad-date' },
        { purchasedAt: '2026-05-11T12:00:00.000Z', totalSpend: -5, receiptId: 'negative' },
        { purchasedAt: '2026-06-01T12:00:00.000Z', totalSpend: 900, receiptId: 'future' }
      ]
    });

    assert.equal(forecast.forecastMonth, '2026-07');
    assert.equal(forecast.predictedSpend, 250);
    assert.equal(forecast.baselineMonthlySpend, 250);
    assert.equal(forecast.confidence, 'low');
    assert.deepEqual(forecast.monthSummaries, [{ month: '2026-05', spend: 250, receiptCount: 1 }]);
    assert.deepEqual(forecast.skippedRows.map((row) => row.reason), ['invalid-date', 'invalid-total-spend', 'future-purchase']);
    assert.equal(forecast.skippedRows.some((row) => row.detail.includes('future')), true);
    assert.equal(forecast.warnings.some((warning) => warning.includes('bad-date')), true);
    assert.equal(forecast.warnings.some((warning) => warning.includes('negative')), true);
    assert.equal(forecast.warnings.some((warning) => warning.includes('less than two calendar months')), true);
  });
});
