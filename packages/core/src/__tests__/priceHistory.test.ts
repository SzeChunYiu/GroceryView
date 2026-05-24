import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPriceChartSeries, planMultiWeekStockUpList, priceChartLineStyle, summarizePriceHistory, summarizePriceHistoryConfidence } from '../index.js';

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

describe('summarizePriceHistoryConfidence', () => {
  it('labels complete single-source history as high confidence', () => {
    const disclosure = summarizePriceHistoryConfidence({
      rangeDays: 30,
      firstObservedAt: '2026-04-20T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 8,
      sourceTypesIncluded: ['shelf'],
      expectedSourceTypes: ['shelf']
    });

    assert.equal(disclosure.confidenceState, 'high_confidence_history');
    assert.equal(disclosure.headlineCopy, 'High confidence history');
    assert.equal(disclosure.canClaimLowestInWindow, true);
    assert.equal(disclosure.legalCopyMode, 'lowest_in_window');
  });

  it('discloses limited history and avoids lowest-in-window copy', () => {
    const disclosure = summarizePriceHistoryConfidence({
      rangeDays: 30,
      firstObservedAt: '2026-05-02T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 5,
      sourceTypesIncluded: ['online'],
      expectedSourceTypes: ['online']
    });

    assert.equal(disclosure.confidenceState, 'limited_history');
    assert.equal(disclosure.detailCopy, 'We have observed this item for 19 days, so older lows may be missing.');
    assert.equal(disclosure.canClaimLowestInWindow, false);
    assert.equal(disclosure.legalCopyMode, 'observed_low_only');
  });

  it('discloses sparse observations', () => {
    const disclosure = summarizePriceHistoryConfidence({
      rangeDays: 30,
      firstObservedAt: '2026-04-20T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 2,
      sourceTypesIncluded: ['receipt'],
      expectedSourceTypes: ['receipt']
    });

    assert.equal(disclosure.confidenceState, 'sparse_observations');
    assert.equal(disclosure.detailCopy, 'Only 2 price observations are available in this range.');
    assert.equal(disclosure.canClaimLowestInWindow, false);
  });

  it('discloses missing shelf evidence', () => {
    const disclosure = summarizePriceHistoryConfidence({
      rangeDays: 90,
      firstObservedAt: '2026-02-20T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 12,
      sourceTypesIncluded: ['flyer', 'online'],
      expectedSourceTypes: ['shelf', 'online', 'flyer']
    });

    assert.equal(disclosure.confidenceState, 'missing_source_evidence');
    assert.equal(disclosure.headlineCopy, 'No shelf-price evidence');
    assert.deepEqual(disclosure.sourceTypesMissing, ['shelf']);
    assert.equal(disclosure.canClaimLowestInWindow, false);
  });

  it('discloses no observed offer and confirmed out-of-stock gaps', () => {
    const noOffer = summarizePriceHistoryConfidence({
      rangeDays: 30,
      observationCount: 0,
      sourceTypesIncluded: [],
      expectedSourceTypes: ['online']
    });
    const outOfStock = summarizePriceHistoryConfidence({
      rangeDays: 30,
      firstObservedAt: '2026-04-20T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 6,
      sourceTypesIncluded: ['online'],
      availabilityGapCount: 1,
      hasConfirmedOutOfStock: true
    });

    assert.equal(noOffer.confidenceState, 'no_observed_offer');
    assert.equal(noOffer.detailCopy, 'We did not observe an available offer for this source during this period.');
    assert.equal(outOfStock.headlineCopy, 'Confirmed out of stock');
    assert.equal(outOfStock.availabilityGapCount, 1);
    assert.equal(outOfStock.canClaimLowestInWindow, false);
  });

  it('discloses estimated points and member-only exclusions', () => {
    const estimated = summarizePriceHistoryConfidence({
      rangeDays: 30,
      firstObservedAt: '2026-04-20T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 4,
      sourceTypesIncluded: ['estimated']
    });
    const memberExcluded = summarizePriceHistoryConfidence({
      rangeDays: 30,
      firstObservedAt: '2026-04-20T00:00:00.000Z',
      lastObservedAt: '2026-05-20T00:00:00.000Z',
      observationCount: 4,
      sourceTypesIncluded: ['online'],
      hasMemberOnlyExcluded: true
    });

    assert.equal(estimated.confidenceState, 'estimated_price');
    assert.equal(estimated.canClaimLowestInWindow, false);
    assert.equal(memberExcluded.confidenceState, 'member_price_excluded');
    assert.equal(memberExcluded.detailCopy, 'Personalized or login-only offers are not included in this default history.');
    assert.equal(memberExcluded.canClaimLowestInWindow, false);
  });
});

describe('planMultiWeekStockUpList', () => {
  it('uses historical low and typical price context without forecasting', () => {
    const plan = planMultiWeekStockUpList({
      asOf: '2026-05-21T00:00:00.000Z',
      planningWeeks: 3,
      weeklyBudget: 900,
      items: [
        {
          productId: 'zoegas-coffee-450g',
          productName: 'Zoegas Coffee 450g',
          storeName: 'Willys Odenplan',
          weeklyNeedUnits: 0.45,
          packageUnits: 0.45,
          comparableUnit: 'kg',
          currentUnitPrice: 110.89,
          history: [
            { observedAt: '2026-03-05T09:00:00.000Z', unitPrice: 139.78, sourceType: 'shelf', confidence: 0.9 },
            { observedAt: '2026-03-28T09:00:00.000Z', unitPrice: 133.11, sourceType: 'shelf', confidence: 0.9 },
            { observedAt: '2026-04-20T09:00:00.000Z', unitPrice: 122, sourceType: 'member', confidence: 0.86 },
            { observedAt: '2026-05-20T09:00:00.000Z', unitPrice: 110.89, sourceType: 'member', confidence: 0.86 }
          ],
          seasonalityNote: 'Observed spring campaign rows only; no summer price projection.'
        }
      ]
    });

    assert.equal(plan.rows[0].typicalUnitPrice, 127.56);
    assert.equal(plan.rows[0].historicalLowUnitPrice, 110.89);
    assert.equal(plan.rows[0].currentVsTypicalPercent, -13.07);
    assert.equal(plan.rows[0].currentVsHistoricalLowPercent, 0);
    assert.equal(plan.rows[0].packagesNeeded, 3);
    assert.equal(plan.rows[0].upfrontCost, 149.7);
    assert.equal(plan.rows[0].weeklyBudgetSharePercent, 5.54);
    assert.equal(plan.coverage.confidence, 'medium');
    assert.ok(plan.guardrails.includes('No price forecast is produced or implied.'));
    assert.match(plan.rows[0].contextLabel, /not a forecast/);
  });

  it('caps a row to storage limits and lowers confidence for sparse history', () => {
    const plan = planMultiWeekStockUpList({
      asOf: '2026-05-20T00:00:00.000Z',
      planningWeeks: 4,
      weeklyBudget: 800,
      items: [
        {
          productId: 'garant-ekologisk-tofu-270g',
          productName: 'Garant Ekologisk Tofu',
          storeName: 'Willys Odenplan',
          weeklyNeedUnits: 0.54,
          packageUnits: 0.27,
          comparableUnit: 'kg',
          currentUnitPrice: 81.11,
          storageLimitWeeks: 2,
          history: [
            { observedAt: '2026-05-01T09:00:00.000Z', unitPrice: 92.22, sourceType: 'shelf', confidence: 0.7 },
            { observedAt: '2026-05-20T09:00:00.000Z', unitPrice: 81.11, sourceType: 'shelf', confidence: 0.7 }
          ]
        }
      ]
    });

    assert.equal(plan.rows[0].planningWeeks, 2);
    assert.equal(plan.rows[0].packagesNeeded, 4);
    assert.equal(plan.rows[0].confidence, 'low');
    assert.match(plan.rows[0].reviewTrigger, /Storage limit caps this at 2 weeks/);
    assert.equal(plan.weeklyEquivalentCost, 21.9);
  });
});
