import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareBasketStrategies,
  planRecurringBasketDigest,
  summarizeLocalOfferBasket,
  summarizeStoreBasketCoverage,
  validateBasketComparisonLineFixtures
} from '../index.js';

describe('validateBasketComparisonLineFixtures', () => {
  it('accepts every basket comparison line status with explicit inclusion or exclusion fields', () => {
    const validation = validateBasketComparisonLineFixtures([
      {
        basketLineId: 'line:matched',
        requestedProductId: 'standardmjolk-1l',
        requestedQuantity: 2,
        requestedUnit: 'l',
        retailerChainId: 'ica',
        storeId: 'ica-nara-baronen-odenplan',
        status: 'matched',
        matchedProductId: 'ica-standardmjolk-1l',
        availabilitySource: 'retailer',
        priceSourceType: 'online',
        unitPrice: 14.9,
        lineTotal: 29.8,
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.9,
        disclosureCopy: 'Matched online price.'
      },
      {
        basketLineId: 'line:missing',
        requestedProductId: 'basmatiris-1kg',
        requestedQuantity: 1,
        requestedUnit: 'kg',
        retailerChainId: 'coop',
        storeId: 'coop-odenplan',
        status: 'missing_product_match',
        availabilitySource: 'unknown',
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.2,
        exclusionReason: 'No comparable product match for this retailer fixture.',
        disclosureCopy: 'No comparable product was matched.'
      },
      {
        basketLineId: 'line:unavailable',
        requestedProductId: 'agg-12-pack',
        requestedQuantity: 1,
        requestedUnit: 'pcs',
        retailerChainId: 'willys',
        storeId: 'willys-odenplan',
        status: 'unavailable',
        matchedProductId: 'willys-agg-12-pack',
        availabilitySource: 'retailer',
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.75,
        exclusionReason: 'Matched product was not available in this fixture.',
        disclosureCopy: 'Product matched but unavailable.'
      },
      {
        basketLineId: 'line:sub-offered',
        requestedProductId: 'hushallsost-1kg',
        requestedQuantity: 1,
        requestedUnit: 'kg',
        retailerChainId: 'hemkop',
        storeId: 'hemkop-torsplan',
        status: 'substitution_offered',
        matchedProductId: 'hemkop-hushallsost-1kg',
        replacementProductId: 'hemkop-prastost-700g',
        replacementAccepted: false,
        availabilitySource: 'retailer',
        priceSourceType: 'online',
        unitPrice: 89.9,
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.7,
        exclusionReason: 'Replacement not accepted in default public basket scenario.',
        disclosureCopy: 'Replacement offered but not accepted.'
      },
      {
        basketLineId: 'line:sub-accepted',
        requestedProductId: 'tomater-500g',
        requestedQuantity: 1,
        requestedUnit: 'pack',
        retailerChainId: 'lidl',
        storeId: 'lidl-sveavagen',
        status: 'substitution_accepted',
        matchedProductId: 'lidl-tomater-500g',
        replacementProductId: 'lidl-tomater-400g',
        replacementAccepted: true,
        availabilitySource: 'retailer',
        priceSourceType: 'shelf',
        unitPrice: 24.9,
        lineTotal: 24.9,
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.8,
        disclosureCopy: 'Accepted replacement included in substitution scenario.'
      },
      {
        basketLineId: 'line:member',
        requestedProductId: 'bryggkaffe-450g',
        requestedQuantity: 1,
        requestedUnit: 'pack',
        retailerChainId: 'coop',
        storeId: 'coop-odenplan',
        status: 'member_only',
        matchedProductId: 'coop-bryggkaffe-450g',
        availabilitySource: 'retailer',
        priceSourceType: 'member',
        unitPrice: 39.9,
        memberOnly: true,
        weightAdjusted: false,
        confidence: 0.8,
        exclusionReason: 'Member-only price excluded from default public basket.',
        disclosureCopy: 'Requires membership.'
      },
      {
        basketLineId: 'line:weight',
        requestedProductId: 'bananer-1kg',
        requestedQuantity: 1,
        requestedUnit: 'kg',
        retailerChainId: 'city_gross',
        storeId: 'city-gross-bromma',
        status: 'weight_adjusted',
        matchedProductId: 'citygross-bananer-losvikt',
        availabilitySource: 'retailer',
        priceSourceType: 'shelf',
        unitPrice: 21.9,
        lineTotal: 21.9,
        memberOnly: false,
        weightAdjusted: true,
        confidence: 0.85,
        disclosureCopy: 'Final total depends on picked weight.'
      }
    ]);

    assert.deepEqual(validation, {
      status: 'valid',
      basketLineIds: [
        'line:matched',
        'line:member',
        'line:missing',
        'line:sub-accepted',
        'line:sub-offered',
        'line:unavailable',
        'line:weight'
      ],
      issues: []
    });
  });

  it('rejects fixture states that would silently include excluded basket lines', () => {
    const validation = validateBasketComparisonLineFixtures([
      {
        basketLineId: 'line:bad-member',
        requestedProductId: 'coffee',
        requestedQuantity: 1,
        requestedUnit: 'pack',
        retailerChainId: 'coop',
        storeId: 'coop-odenplan',
        status: 'member_only',
        availabilitySource: 'retailer',
        priceSourceType: 'member',
        unitPrice: 39.9,
        lineTotal: 39.9,
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.8,
        disclosureCopy: 'Requires membership.'
      },
      {
        basketLineId: 'line:bad-sub',
        requestedProductId: 'milk',
        requestedQuantity: 1,
        requestedUnit: 'l',
        retailerChainId: 'ica',
        storeId: 'ica-nara-baronen-odenplan',
        status: 'substitution_offered',
        replacementProductId: 'ica-oat-drink-1l',
        replacementAccepted: true,
        availabilitySource: 'retailer',
        lineTotal: 15.9,
        memberOnly: false,
        weightAdjusted: false,
        confidence: 0.7,
        disclosureCopy: 'Replacement offered.'
      }
    ]);

    assert.equal(validation.status, 'invalid');
    assert.ok(validation.issues.includes('member_only_flag_required:line:bad-member'));
    assert.ok(validation.issues.includes('member_only_reason_required:line:bad-member'));
    assert.ok(validation.issues.includes('member_only_has_public_total:line:bad-member'));
    assert.ok(validation.issues.includes('substitution_offered_acceptance_required:line:bad-sub'));
    assert.ok(validation.issues.includes('substitution_offered_reason_required:line:bad-sub'));
    assert.ok(validation.issues.includes('substitution_offered_has_line_total:line:bad-sub'));
  });
});

describe('compareBasketStrategies', () => {
  it('compares favorite-store baskets without penalizing distance', () => {
    const result = compareBasketStrategies({
      favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen'],
      items: [
        {
          productId: 'coffee',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9, distanceKm: 5.2 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9, distanceKm: 0.4 }
          ]
        },
        {
          productId: 'milk',
          quantity: 2,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9, distanceKm: 5.2 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9, distanceKm: 0.4 }
          ]
        }
      ]
    });

    assert.equal(result.cheapestByProduct.total, 77.7);
    assert.deepEqual(result.cheapestByProduct.assignments.map((item) => item.storeId), [
      'willys-odenplan',
      'lidl-sveavagen'
    ]);
    assert.deepEqual(result.singleStoreOptions[0], {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      total: 79.7,
      itemCount: 2
    });
    assert.deepEqual(result.bestSingleStore, {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      total: 79.7,
      itemCount: 2
    });
    assert.equal(result.savingsVsBestSingleStore, 2);
    assert.equal(result.splitStoreCount, 2);
  });
});

describe('summarizeStoreBasketCoverage', () => {
  it('compares favorite stores by basket coverage and known total', () => {
    const summary = summarizeStoreBasketCoverage({
      favoriteStoreIds: ['willys-odenplan', 'lidl-sveavagen', 'coop-odenplan'],
      items: [
        {
          productId: 'coffee',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 49.9 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 59.9 }
          ]
        },
        {
          productId: 'milk',
          quantity: 2,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 14.9 },
            { storeId: 'lidl-sveavagen', storeName: 'Lidl Sveavägen', price: 13.9 },
            { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 15.9 }
          ]
        },
        {
          productId: 'butter',
          quantity: 1,
          prices: [
            { storeId: 'willys-odenplan', storeName: 'Willys Odenplan', price: 42.9 },
            { storeId: 'coop-odenplan', storeName: 'Coop Odenplan', price: 39.9 }
          ]
        }
      ]
    });

    assert.deepEqual(summary.fullCoverageStoreIds, ['willys-odenplan']);
    assert.deepEqual(summary.stores.map((store) => store.storeId), [
      'willys-odenplan',
      'coop-odenplan',
      'lidl-sveavagen'
    ]);
    assert.deepEqual(summary.bestCoverage, {
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      knownTotal: 122.6,
      availableProductIds: ['coffee', 'milk', 'butter'],
      missingProductIds: [],
      coveragePercent: 100
    });
    assert.deepEqual(summary.stores[1], {
      storeId: 'coop-odenplan',
      storeName: 'Coop Odenplan',
      knownTotal: 71.7,
      availableProductIds: ['milk', 'butter'],
      missingProductIds: ['coffee'],
      coveragePercent: 66.67
    });
  });

  it('handles an empty basket as full coverage for favorite stores', () => {
    assert.deepEqual(summarizeStoreBasketCoverage({
      favoriteStoreIds: ['willys-odenplan'],
      items: []
    }), {
      stores: [{
        storeId: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        knownTotal: 0,
        availableProductIds: [],
        missingProductIds: [],
        coveragePercent: 100
      }],
      bestCoverage: {
        storeId: 'willys-odenplan',
        storeName: 'Willys Odenplan',
        knownTotal: 0,
        availableProductIds: [],
        missingProductIds: [],
        coveragePercent: 100
      },
      fullCoverageStoreIds: ['willys-odenplan']
    });
  });
});

describe('summarizeLocalOfferBasket', () => {
  it('summarizes complete local offer baskets with confidence, freshness, and savings labels', () => {
    const summary = summarizeLocalOfferBasket({
      asOf: '2026-05-20T12:00:00.000Z',
      staleAfterHours: 48,
      storeIds: ['willys-odenplan', 'coop-odenplan'],
      items: [
        { productId: 'coffee', quantity: 1, baselineUnitPrice: 59.9 },
        { productId: 'milk', quantity: 2, baselineUnitPrice: 15.9 }
      ],
      offers: [
        {
          productId: 'coffee',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          unitPrice: 45.9,
          observedAt: '2026-05-20T08:00:00.000Z',
          sourceType: 'flyer',
          confidence: 0.9,
          distanceKm: 8.2
        },
        {
          productId: 'milk',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          unitPrice: 13.9,
          observedAt: '2026-05-20T08:00:00.000Z',
          sourceType: 'online',
          confidence: 0.85
        },
        {
          productId: 'coffee',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          unitPrice: 47.9,
          observedAt: '2026-05-20T09:00:00.000Z',
          sourceType: 'member',
          confidence: 0.75
        },
        {
          productId: 'milk',
          storeId: 'coop-odenplan',
          storeName: 'Coop Odenplan',
          unitPrice: 15.5,
          observedAt: '2026-05-20T09:00:00.000Z',
          sourceType: 'online',
          confidence: 0.7
        }
      ]
    });

    assert.equal(summary.baselineTotal, 91.7);
    assert.equal(summary.bestStore?.storeId, 'willys-odenplan');
    assert.equal(summary.bestStore?.subtotal, 73.7);
    assert.equal(summary.bestStore?.coveragePercent, 100);
    assert.equal(summary.bestStore?.averageConfidence, 0.88);
    assert.equal(summary.bestStore?.confidenceLabel, 'high');
    assert.equal(summary.bestStore?.freshnessLabel, 'fresh');
    assert.deepEqual(summary.bestStore?.sourceTypes, ['flyer', 'online']);
    assert.equal(summary.bestStore?.savingsVsBaseline, 18);
  });

  it('separates missing, unavailable, and stale local offers', () => {
    const summary = summarizeLocalOfferBasket({
      asOf: '2026-05-20T12:00:00.000Z',
      staleAfterHours: 24,
      storeIds: ['willys-odenplan'],
      items: [
        { productId: 'coffee', quantity: 1 },
        { productId: 'milk', quantity: 2 },
        { productId: 'butter', quantity: 1 }
      ],
      offers: [
        {
          productId: 'coffee',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          unitPrice: 44.9,
          observedAt: '2026-05-18T08:00:00.000Z',
          sourceType: 'flyer',
          confidence: 0.55
        },
        {
          productId: 'milk',
          storeId: 'willys-odenplan',
          storeName: 'Willys Odenplan',
          unitPrice: 13.9,
          observedAt: '2026-05-20T08:00:00.000Z',
          sourceType: 'online',
          confidence: 0.8,
          available: false
        }
      ]
    });

    assert.deepEqual(summary.bestStore?.matchedProductIds, ['coffee']);
    assert.deepEqual(summary.bestStore?.unavailableProductIds, ['milk']);
    assert.deepEqual(summary.bestStore?.missingProductIds, ['butter']);
    assert.deepEqual(summary.bestStore?.staleProductIds, ['coffee']);
    assert.equal(summary.bestStore?.coveragePercent, 33.33);
    assert.equal(summary.bestStore?.confidenceLabel, 'medium');
    assert.equal(summary.bestStore?.freshnessLabel, 'stale');
  });

  it('ranks by coverage, subtotal, and confidence without using distance', () => {
    const summary = summarizeLocalOfferBasket({
      asOf: '2026-05-20T12:00:00.000Z',
      storeIds: ['far-cheap-store', 'near-expensive-store'],
      items: [{ productId: 'coffee', quantity: 1 }],
      offers: [
        {
          productId: 'coffee',
          storeId: 'far-cheap-store',
          storeName: 'Far Cheap Store',
          unitPrice: 39.9,
          observedAt: '2026-05-20T08:00:00.000Z',
          sourceType: 'online',
          confidence: 0.8,
          distanceKm: 12
        },
        {
          productId: 'coffee',
          storeId: 'near-expensive-store',
          storeName: 'Near Expensive Store',
          unitPrice: 49.9,
          observedAt: '2026-05-20T08:00:00.000Z',
          sourceType: 'online',
          confidence: 0.95,
          distanceKm: 0.2
        }
      ]
    });

    assert.equal(summary.bestStore?.storeId, 'far-cheap-store');
  });
});

describe('planRecurringBasketDigest', () => {
  it('summarizes weekly basket changes against the previous shop with explicit missing-price blockers', () => {
    const digest = planRecurringBasketDigest({
      templateId: 'weekly-basics',
      templateName: 'Weekly basics',
      cadence: 'weekly',
      asOf: '2026-05-22T08:00:00.000Z',
      lastPurchasedAt: '2026-05-15T08:00:00.000Z',
      lines: [
        {
          productId: 'coffee',
          productName: 'Zoégas Coffee 450g',
          quantity: 1,
          currentUnitPrice: 49.9,
          previousUnitPrice: 59.9,
          currentStoreName: 'Willys Odenplan',
          confidence: 0.92
        },
        {
          productId: 'milk',
          productName: 'Arla Milk 1L',
          quantity: 2,
          currentUnitPrice: 16.9,
          previousUnitPrice: 13.9,
          currentStoreName: 'Coop Odenplan',
          substituteProductName: 'Willys private-label milk',
          confidence: 0.88
        },
        {
          productId: 'butter',
          productName: 'Butter 500g',
          quantity: 1,
          currentUnitPrice: null,
          previousUnitPrice: 39.9,
          confidence: 0.2
        }
      ]
    });

    assert.equal(digest.templateId, 'weekly-basics');
    assert.equal(digest.cadence, 'weekly');
    assert.equal(digest.lineCount, 3);
    assert.equal(digest.comparableCurrentTotal, 83.7);
    assert.equal(digest.comparablePreviousTotal, 87.7);
    assert.equal(digest.comparableDelta, -4);
    assert.equal(digest.comparableDeltaPercent, -4.56);
    assert.deepEqual(digest.missingCurrentPriceProductIds, ['butter']);
    assert.deepEqual(digest.changeSummary, {
      priceUp: 1,
      priceDown: 1,
      newItem: 0,
      missingCurrentPrice: 1,
      substituteAvailable: 1,
      unchanged: 0
    });
    assert.deepEqual(digest.lines.map((line) => ({
      productId: line.productId,
      changeType: line.changeType,
      lineDelta: line.lineDelta,
      action: line.recommendedAction
    })), [
      {
        productId: 'coffee',
        changeType: 'price_down',
        lineDelta: -10,
        action: 'Keep in recurring basket; current verified price is lower than the previous shop.'
      },
      {
        productId: 'milk',
        changeType: 'substitute_available',
        lineDelta: 6,
        action: 'Review suggested substitute before checkout: Willys private-label milk.'
      },
      {
        productId: 'butter',
        changeType: 'missing_current_price',
        lineDelta: null,
        action: 'Do not auto-buy; current verified price is missing.'
      }
    ]);
    assert.match(digest.headline, /4.56% lower than the previous shop/);
    assert.match(digest.guardrails[0], /Only lines with both current and previous verified prices/);
  });
});
