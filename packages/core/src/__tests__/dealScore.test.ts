import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDealScore, calculateHistoricalDealScore, rankDealOpportunities, scoreBand, suggestFriendSharedDeals } from '../index.js';

describe('calculateDealScore', () => {
  it('uses the MVP weighted formula and never accepts sponsored boosts', () => {
    const score = calculateDealScore({
      currentCityPercentile: 8,
      knownPromoHistoryPercentile: 12,
      equivalentUnitPricePercentile: 18,
      discountDepthPercent: 25,
      sourceConfidence: 0.9,
      sponsoredPlacement: true
    });

    assert.equal(score, 82);
    assert.deepEqual(scoreBand(score), { label: 'Good deal', verdict: 'Buy' });
  });

  it('classifies normal prices as not a real deal', () => {
    const score = calculateDealScore({
      currentCityPercentile: 82,
      knownPromoHistoryPercentile: 76,
      equivalentUnitPricePercentile: 68,
      discountDepthPercent: 3,
      sourceConfidence: 0.5
    });

    assert.equal(score, 22);
    assert.deepEqual(scoreBand(score), { label: 'Not a real deal', verdict: 'Wait' });
  });
});

describe('rankDealOpportunities', () => {
  it('ranks organic deal opportunities and excludes sponsored placements', () => {
    const opportunities = rankDealOpportunities({
      deals: [
        {
          productId: 'coffee',
          productName: 'Zoégas Coffee 450g',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 49.9,
          regularPrice: 69.9,
          dealScore: 86,
          sourceConfidence: 0.91
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          currentPrice: 42.9,
          regularPrice: 59.9,
          dealScore: 86,
          sourceConfidence: 0.88
        },
        {
          productId: 'soda',
          productName: 'Sponsored Soda 1.5L',
          storeId: 'ica-city',
          storeName: 'ICA City',
          currentPrice: 14.9,
          regularPrice: 24.9,
          dealScore: 95,
          sourceConfidence: 0.99,
          sponsoredPlacement: true
        },
        {
          productId: 'rice',
          productName: 'Rice 1kg',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          currentPrice: 18.9,
          regularPrice: 19.9,
          dealScore: 58,
          sourceConfidence: 0.9
        }
      ]
    });

    assert.deepEqual(opportunities.map((deal) => deal.productId), ['coffee', 'butter']);
    assert.deepEqual(opportunities[0], {
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      currentPrice: 49.9,
      regularPrice: 69.9,
      dealScore: 86,
      sourceConfidence: 0.91,
      band: { label: 'Good deal', verdict: 'Buy' },
      priceDrop: 20,
      discountPercent: 28.61,
      reason: 'Zoégas Coffee 450g is 28.61% below regular price at Willys Odenplan with Deal Score 86.'
    });
  });

  it('honors caller thresholds for score and source confidence', () => {
    const opportunities = rankDealOpportunities({
      minimumDealScore: 80,
      minimumSourceConfidence: 0.9,
      deals: [
        {
          productId: 'coffee',
          productName: 'Zoégas Coffee 450g',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 49.9,
          regularPrice: 69.9,
          dealScore: 79,
          sourceConfidence: 0.95
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          currentPrice: 42.9,
          regularPrice: 59.9,
          dealScore: 84,
          sourceConfidence: 0.89
        },
        {
          productId: 'milk',
          productName: 'Milk 1L',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          currentPrice: 11.9,
          regularPrice: 16.9,
          dealScore: 81,
          sourceConfidence: 0.91
        }
      ]
    });

    assert.deepEqual(opportunities.map((deal) => deal.productId), ['milk']);
  });

  it('boosts essential categories around Swedish payday without changing organic deal scores', () => {
    const opportunities = rankDealOpportunities({
      countryCode: 'SE',
      rankedAt: '2026-05-25T10:00:00.000Z',
      deals: [
        {
          productId: 'chips',
          productName: 'Potato Chips',
          storeId: 'ica-city',
          storeName: 'ICA City',
          currentPrice: 19.9,
          regularPrice: 29.9,
          dealScore: 83,
          sourceConfidence: 0.9,
          productCategory: 'snacks'
        },
        {
          productId: 'milk',
          productName: 'Milk 1L',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 11.9,
          regularPrice: 16.9,
          dealScore: 78,
          sourceConfidence: 0.9,
          productCategory: 'dairy'
        },
        {
          productId: 'bread',
          productName: 'Sourdough Bread',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          currentPrice: 24.9,
          regularPrice: 34.9,
          dealScore: 76,
          sourceConfidence: 0.9,
          productCategory: 'bread'
        }
      ]
    });

    assert.deepEqual(opportunities.map((deal) => deal.productId), ['milk', 'bread', 'chips']);
    assert.equal(opportunities[0]!.dealScore, 78);
  });

  it('does not boost Swedish essentials outside the payday window', () => {
    const opportunities = rankDealOpportunities({
      countryCode: 'SE',
      rankedAt: '2026-05-15T10:00:00.000Z',
      deals: [
        {
          productId: 'chips',
          productName: 'Potato Chips',
          storeId: 'ica-city',
          storeName: 'ICA City',
          currentPrice: 19.9,
          regularPrice: 29.9,
          dealScore: 83,
          sourceConfidence: 0.9,
          productCategory: 'snacks'
        },
        {
          productId: 'milk',
          productName: 'Milk 1L',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 11.9,
          regularPrice: 16.9,
          dealScore: 78,
          sourceConfidence: 0.9,
          productCategory: 'dairy'
        }
      ]
    });

    assert.deepEqual(opportunities.map((deal) => deal.productId), ['chips', 'milk']);
  });

});

describe('suggestFriendSharedDeals', () => {
  it('promotes opted-in household and friend shares without accepting stale or private signals', () => {
    const suggestions = suggestFriendSharedDeals({
      asOf: '2026-05-24T12:00:00.000Z',
      deals: [
        {
          productId: 'coffee',
          productName: 'Zoegas Coffee 450g',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          currentPrice: 49.9,
          regularPrice: 69.9,
          dealScore: 84,
          sourceConfidence: 0.94
        },
        {
          productId: 'butter',
          productName: 'Butter 600g',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          currentPrice: 42.9,
          regularPrice: 59.9,
          dealScore: 88,
          sourceConfidence: 0.93
        },
        {
          productId: 'rice',
          productName: 'Rice 1kg',
          storeId: 'lidl-sveavagen',
          storeName: 'Lidl Sveavägen',
          currentPrice: 18.9,
          regularPrice: 24.9,
          dealScore: 86,
          sourceConfidence: 0.92
        }
      ],
      shares: [
        {
          productId: 'coffee',
          sharedByDisplayName: 'Alex',
          relationship: 'household',
          sharedAt: '2026-05-24T08:00:00.000Z',
          sourceConfidence: 0.99,
          optedIn: true
        },
        {
          productId: 'coffee',
          sharedByDisplayName: 'Sam',
          relationship: 'friend',
          sharedAt: '2026-05-23T18:00:00.000Z',
          sourceConfidence: 0.9,
          optedIn: true
        },
        {
          productId: 'butter',
          sharedByDisplayName: 'No consent',
          relationship: 'friend',
          sharedAt: '2026-05-24T08:00:00.000Z',
          sourceConfidence: 0.95,
          optedIn: false
        },
        {
          productId: 'rice',
          sharedByDisplayName: 'Old share',
          relationship: 'household',
          sharedAt: '2026-04-01T08:00:00.000Z',
          sourceConfidence: 0.95,
          optedIn: true
        }
      ]
    });

    assert.deepEqual(suggestions.map((suggestion) => suggestion.productId), ['coffee']);
    assert.equal(suggestions[0]?.socialSignals.length, 2);
    assert.equal(suggestions[0]?.socialProofScore, 100);
    assert.match(suggestions[0]?.suggestedReason ?? '', /Alex shared this household deal/);
  });
});

describe('calculateHistoricalDealScore', () => {
  it('scores strong unit-price history with percentile, median, and 30-day-low reasons', () => {
    const result = calculateHistoricalDealScore({
      currentUnitPrice: 42,
      asOf: '2026-05-20T00:00:00.000Z',
      sourceType: 'shelf',
      sourceConfidence: 0.92,
      history: [
        { observedAt: '2026-04-01T00:00:00.000Z', unitPrice: 58, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-04-12T00:00:00.000Z', unitPrice: 55, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-05-01T00:00:00.000Z', unitPrice: 52, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-05-12T00:00:00.000Z', unitPrice: 48, sourceType: 'shelf', confidence: 0.9 },
        { observedAt: '2026-05-18T00:00:00.000Z', unitPrice: 46, sourceType: 'shelf', confidence: 0.9 }
      ]
    });

    assert.equal(result.score, 88);
    assert.deepEqual(result.band, { label: 'Good deal', verdict: 'Buy' });
    assert.equal(result.currentPercentile, 0);
    assert.equal(result.medianUnitPrice, 52);
    assert.equal(result.observedThirtyDayLow, 46);
    assert.deepEqual(result.reasons, ['low_percentile', 'below_median', 'below_30_day_low']);
    assert.deepEqual(result.warnings, []);
  });

  it('caps raised-then-discounted retailer claims against the observed 30-day low', () => {
    const result = calculateHistoricalDealScore({
      currentUnitPrice: 20,
      claimedRegularUnitPrice: 30,
      asOf: '2026-05-20T00:00:00.000Z',
      sourceType: 'flyer',
      sourceConfidence: 0.9,
      history: [
        { observedAt: '2026-04-23T00:00:00.000Z', unitPrice: 20, sourceType: 'flyer', confidence: 0.8 },
        { observedAt: '2026-05-05T00:00:00.000Z', unitPrice: 30, sourceType: 'flyer', confidence: 0.8 },
        { observedAt: '2026-05-12T00:00:00.000Z', unitPrice: 30, sourceType: 'flyer', confidence: 0.8 }
      ]
    });

    assert.equal(result.observedThirtyDayLow, 20);
    assert.equal(result.cappedAt, 70);
    assert.equal(result.score, 70);
    assert.deepEqual(result.warnings, ['claimed_regular_price_unverified']);
  });

  it('caps sparse and mixed-source history instead of overclaiming a deal', () => {
    const result = calculateHistoricalDealScore({
      currentUnitPrice: 19,
      asOf: '2026-05-20T00:00:00.000Z',
      sourceType: 'estimated',
      sourceConfidence: 0.45,
      history: [
        { observedAt: '2026-05-10T00:00:00.000Z', unitPrice: 25, sourceType: 'shelf', confidence: 0.8 },
        { observedAt: '2026-05-12T00:00:00.000Z', unitPrice: 24, sourceType: 'estimated', confidence: 0.4 }
      ]
    });

    assert.equal(result.score, 50);
    assert.equal(result.cappedAt, 50);
    assert.deepEqual(result.warnings, ['limited_history', 'low_confidence', 'mixed_source_types', 'source_type_cap']);
  });

  it('excludes distance from score and only reports it as a reason code', () => {
    const input = {
      currentUnitPrice: 32,
      asOf: '2026-05-20T00:00:00.000Z',
      sourceType: 'online' as const,
      sourceConfidence: 0.85,
      history: [
        { observedAt: '2026-04-01T00:00:00.000Z', unitPrice: 40, sourceType: 'online' as const, confidence: 0.8 },
        { observedAt: '2026-04-12T00:00:00.000Z', unitPrice: 39, sourceType: 'online' as const, confidence: 0.8 },
        { observedAt: '2026-05-01T00:00:00.000Z', unitPrice: 38, sourceType: 'online' as const, confidence: 0.8 }
      ]
    };

    const near = calculateHistoricalDealScore({ ...input, distanceKm: 0.2 });
    const far = calculateHistoricalDealScore({ ...input, distanceKm: 12 });

    assert.equal(near.score, far.score);
    assert.deepEqual(near.reasons, far.reasons);
    assert.ok(near.reasons.includes('distance_excluded'));
  });

  it('allows perishable short-history cases but labels the exception', () => {
    const result = calculateHistoricalDealScore({
      currentUnitPrice: 8,
      asOf: '2026-05-20T00:00:00.000Z',
      sourceType: 'shelf',
      sourceConfidence: 0.82,
      perishableShortLife: true,
      history: [
        { observedAt: '2026-05-19T00:00:00.000Z', unitPrice: 12, sourceType: 'shelf', confidence: 0.8 }
      ]
    });

    assert.ok(result.reasons.includes('perishable_short_history'));
    assert.deepEqual(result.warnings, []);
  });
});
