import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSeasonalSalePattern, midsommarSeasonalHoliday } from '../seasonality.js';

test('detects repeated discounts in the Midsommar pre-holiday window', () => {
  const report = detectSeasonalSalePattern({
    productId: 'jordgubbar-500g',
    productName: 'Jordgubbar 500 g',
    holiday: midsommarSeasonalHoliday,
    observations: [
      { observedAt: '2023-04-10', price: 48.9 },
      { observedAt: '2023-06-12', price: 34.9 },
      { observedAt: '2023-09-02', price: 51.9 },
      { observedAt: '2024-03-20', price: 52.9 },
      { observedAt: '2024-06-10', price: 36.9 },
      { observedAt: '2024-10-01', price: 55.9 }
    ]
  });

  assert.equal(report.available, true);
  assert.equal(report.holiday.id, 'midsommar');
  assert.equal(report.hint, 'Likely on sale before Midsommar');
  assert.equal(report.qualifiedSeasonCount, 2);
  assert.equal(report.observedSeasonCount, 2);
  assert.match(report.evidenceLabel, /2 historical Midsommar windows/);
  assert.match(report.guardrail, /explicit historical holiday-window price evidence/);
  assert.ok(report.averageDiscountPercent >= 20);
});

test('fails closed when there are not enough discounted holiday windows', () => {
  const report = detectSeasonalSalePattern({
    productId: 'kaffe-500g',
    holiday: midsommarSeasonalHoliday,
    observations: [
      { observedAt: '2024-03-20', price: 50 },
      { observedAt: '2024-06-15', price: 49 },
      { observedAt: '2024-10-01', price: 48 }
    ]
  });

  assert.equal(report.available, false);
  assert.equal(report.qualifiedSeasonCount, 0);
  assert.match(report.detail, /withholds the seasonal sale hint/);
});
