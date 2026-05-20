import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPriceChartSeries, priceChartLineStyle, summarizePriceHistory } from '../index.js';

describe('summarizePriceHistory', () => {
  it('summarizes latest price movement and new-low status from unordered observations', () => {
    const summary = summarizePriceHistory([
      { observedAt: '2026-05-18T08:00:00.000Z', price: 52.9, storeId: 'willys-odenplan' },
      { observedAt: '2026-05-16T08:00:00.000Z', price: 59.9, storeId: 'willys-odenplan' },
      { observedAt: '2026-05-19T08:00:00.000Z', price: 49.9, storeId: 'willys-odenplan' }
    ]);

    assert.deepEqual(summary, {
      latestPrice: 49.9,
      previousPrice: 52.9,
      changeFromPrevious: -3,
      lowestPrice: 49.9,
      highestPrice: 59.9,
      isNewLow: true,
      observedCount: 3,
      latestObservedAt: '2026-05-19T08:00:00.000Z'
    });
  });

  it('requires at least one observation', () => {
    assert.throws(() => summarizePriceHistory([]), /At least one price history point is required/);
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
