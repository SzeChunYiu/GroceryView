import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPriceChartSeries, priceChartLineStyle, summarizePriceHistory } from '../index.js';

describe('summarizePriceHistory', () => {
  it('summarizes 30-day price history with low, high, average, and current percentile', () => {
    const summary = summarizePriceHistory({
      asOf: '2026-05-20T00:00:00.000Z',
      rangeDays: 30,
      sourceType: 'shelf',
      points: [
        { observedAt: '2026-04-20T00:00:00.000Z', price: 65, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-05-01T00:00:00.000Z', price: 55, sourceType: 'shelf', confidence: 0.8 },
        { observedAt: '2026-05-20T00:00:00.000Z', price: 45, sourceType: 'shelf', confidence: 1 }
      ]
    });

    assert.deepEqual({
      rangeDays: summary.rangeDays,
      sourceType: summary.sourceType,
      pointCount: summary.pointCount,
      low: summary.low,
      high: summary.high,
      average: summary.average,
      currentPrice: summary.currentPrice,
      currentPercentile: summary.currentPercentile,
      averageConfidence: summary.averageConfidence,
      limitedHistory: summary.limitedHistory
    }, {
      rangeDays: 30,
      sourceType: 'shelf',
      pointCount: 3,
      low: 45,
      high: 65,
      average: 55,
      currentPrice: 45,
      currentPercentile: 0,
      averageConfidence: 0.9,
      limitedHistory: false
    });
  });

  it('keeps source types separate so flyer prices do not change shelf history', () => {
    const summary = summarizePriceHistory({
      asOf: '2026-05-20T00:00:00.000Z',
      rangeDays: 90,
      sourceType: 'shelf',
      points: [
        { observedAt: '2026-03-01T00:00:00.000Z', price: 70, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-05-01T00:00:00.000Z', price: 60, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-05-10T00:00:00.000Z', price: 35, sourceType: 'flyer', confidence: 0.7 }
      ]
    });

    assert.equal(summary.low, 60);
    assert.equal(summary.high, 70);
    assert.equal(summary.currentPrice, 60);
    assert.equal(summary.currentPercentile, 0);
  });

  it('flags limited history when a 365-day window has sparse observations', () => {
    const summary = summarizePriceHistory({
      asOf: '2026-05-20T00:00:00.000Z',
      rangeDays: 365,
      sourceType: 'online',
      points: [
        { observedAt: '2026-05-19T00:00:00.000Z', price: 49.9, sourceType: 'online', confidence: 0.85 }
      ]
    });

    assert.equal(summary.limitedHistory, true);
    assert.equal(summary.pointCount, 1);
    assert.equal(summary.currentPercentile, 0);
  });

  it('rejects empty selected source/range windows', () => {
    assert.throws(() => summarizePriceHistory({
      asOf: '2026-05-20T00:00:00.000Z',
      rangeDays: 30,
      sourceType: 'member',
      points: [
        { observedAt: '2026-05-19T00:00:00.000Z', price: 49.9, sourceType: 'online', confidence: 0.85 }
      ]
    }), /At least one price history point/);
  });
});

describe('buildPriceChartSeries', () => {
  it('keeps store and source type series separate with confidence-based line styles', () => {
    const result = buildPriceChartSeries({
      asOf: '2026-05-20T00:00:00.000Z',
      rangeDays: 30,
      observations: [
        {
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          observedAt: '2026-05-01T00:00:00.000Z',
          price: 59.9,
          sourceType: 'shelf',
          confidence: 0.95,
          provenanceLabel: 'Shelf audit'
        },
        {
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          observedAt: '2026-05-08T00:00:00.000Z',
          price: 44.9,
          sourceType: 'flyer',
          confidence: 0.7,
          provenanceLabel: 'Weekly flyer'
        },
        {
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          observedAt: '2026-05-08T00:00:00.000Z',
          price: 55.9,
          sourceType: 'estimated',
          confidence: 0.35,
          provenanceLabel: 'Estimated observation'
        }
      ]
    });

    assert.deepEqual(result.series.map((series) => series.id), [
      'coop-odenplan:estimated',
      'willys-odenplan:flyer',
      'willys-odenplan:shelf'
    ]);
    assert.deepEqual(result.series.map((series) => series.lineStyle), ['dotted', 'dashed', 'solid']);
    assert.equal(result.series[1].markers[0].type, 'promotion');
    assert.equal(result.series[1].markers[0].provenanceLabel, 'Weekly flyer');
    assert.equal(result.windowStart, '2026-04-20T00:00:00.000Z');
  });

  it('emits compact chart markers and preserves source labels', () => {
    const result = buildPriceChartSeries({
      markerLimitPerSeries: 3,
      observations: [
        {
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          observedAt: '2026-05-01T00:00:00.000Z',
          price: 60,
          sourceType: 'receipt',
          confidence: 0.95,
          provenanceLabel: 'Receipt scan'
        },
        {
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          observedAt: '2026-05-02T00:00:00.000Z',
          price: 58,
          sourceType: 'receipt',
          confidence: 0.45,
          provenanceLabel: 'Low-trust receipt'
        },
        {
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          observedAt: '2026-05-03T00:00:00.000Z',
          price: 55,
          sourceType: 'receipt',
          confidence: 0.9,
          markerType: 'promotion',
          markerLabel: 'Promo',
          provenanceLabel: 'Receipt plus flyer'
        }
      ]
    });

    assert.deepEqual(result.series[0].markers.map((marker) => marker.type), [
      'source_warning',
      'new_low',
      'promotion'
    ]);
    assert.deepEqual(result.series[0].markers.map((marker) => marker.text), [
      'Low confidence',
      'New low',
      'Promo'
    ]);
    assert.equal(result.series[0].markers[0].sourceType, 'receipt');
  });
});

describe('priceChartLineStyle', () => {
  it('maps confidence and source type to renderer-neutral line styles', () => {
    assert.equal(priceChartLineStyle({ sourceType: 'shelf', confidence: 0.95 }), 'solid');
    assert.equal(priceChartLineStyle({ sourceType: 'online', confidence: 0.65 }), 'dashed');
    assert.equal(priceChartLineStyle({ sourceType: 'estimated', confidence: 0.9 }), 'dotted');
    assert.equal(priceChartLineStyle({ sourceType: 'manual', confidence: 0.2 }), 'dotted');
  });
});
