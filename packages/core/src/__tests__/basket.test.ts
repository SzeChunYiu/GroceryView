import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareBasketStrategies,
  planBasketFulfillmentSlots,
  planBasketImportExport,
  planBasketTripCost,
  planRetailerBasketTransferSession,
  scoreRetailerDeepLinkQuality,
  planRetailerHandoff,
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



describe('planBasketFulfillmentSlots', () => {
  it('plans delivery and pickup slot evidence without claiming retailer reservations', () => {
    const plan = planBasketFulfillmentSlots({
      retailerId: 'willys',
      retailerName: 'Willys',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      asOf: '2026-05-22T09:45:00.000Z',
      basketProductIds: ['coffee', 'milk'],
      source: {
        access: 'manual_evidence',
        evidenceUrl: 'https://www.willys.se/checkout/slots',
        capturedAt: '2026-05-22T09:40:00.000Z',
        shopperConsent: true
      },
      slots: [
        { slotId: 'pickup-0900', mode: 'pickup', startsAt: '2026-05-23T09:00:00.000Z', endsAt: '2026-05-23T10:00:00.000Z', fee: 0, currency: 'SEK', available: true },
        { slotId: 'delivery-1800', mode: 'delivery', startsAt: '2026-05-23T18:00:00.000Z', endsAt: '2026-05-23T20:00:00.000Z', fee: 59, currency: 'SEK', available: false }
      ]
    });

    assert.equal(plan.status, 'evidence_available');
    assert.equal(plan.availableSlotCount, 1);
    assert.deepEqual(plan.availableSlots.map((slot) => [slot.slotId, slot.mode, slot.fee]), [['pickup-0900', 'pickup', 0]]);
    assert.deepEqual(plan.blockedReasons, ['delivery-1800 is currently unavailable.']);
    assert.deepEqual(plan.guardrails, [
      'Fulfillment slots are evidence snapshots, not retailer reservations.',
      'Delivery or pickup availability must be re-confirmed inside the retailer checkout.',
      'GroceryView cannot claim checkout completion, delivery booking, or inventory reservation from slot evidence.'
    ]);
  });
});



describe('planBasketImportExport', () => {
  it('plans consent-gated bookmarklet imports while keeping unmatched retailer rows in review', () => {
    const plan = planBasketImportExport({
      source: {
        sourceKind: 'bookmarklet',
        retailerId: 'willys',
        origin: 'https://www.willys.se',
        capturedAt: '2026-05-22T09:30:00.000Z',
        consentGranted: true
      },
      capturedLines: [
        { rawName: 'Zoégas Coffee 450g', productId: 'coffee', quantity: 1, productUrl: 'https://www.willys.se/produkt/coffee' },
        { rawName: 'Standardmjölk 1L', quantity: 2 },
        { rawName: 'Retailer-only bakery bun', quantity: 3 }
      ],
      knownProducts: [
        { productId: 'coffee', productName: 'Zoégas Coffee 450g', aliases: ['zoegas coffee 450g'] },
        { productId: 'milk', productName: 'Milk 1L', aliases: ['standardmjölk 1l'] }
      ]
    });

    assert.equal(plan.status, 'needs_review');
    assert.deepEqual(plan.acceptedItems, [
      { productId: 'coffee', productName: 'Zoégas Coffee 450g', quantity: 1, matchSource: 'product_id', productUrl: 'https://www.willys.se/produkt/coffee' },
      { productId: 'milk', productName: 'Milk 1L', quantity: 2, matchSource: 'alias' }
    ]);
    assert.deepEqual(plan.reviewItems, [
      { rawName: 'Retailer-only bakery bun', quantity: 3, reason: 'No verified GroceryView product match for retailer row.' }
    ]);
    assert.match(plan.exportText, /1 × Zoégas Coffee 450g/);
    assert.match(plan.exportText, /2 × Milk 1L/);
    assert.deepEqual(plan.guardrails, [
      'Bookmarklet and extension imports require explicit shopper consent before reading retailer page content.',
      'Only matched GroceryView product ids can update the account basket automatically.',
      'Unmatched retailer rows stay in review and are never silently added as verified products.'
    ]);
  });
});




describe('planRetailerBasketTransferSession', () => {
  it('gates secure retailer basket transfer to verified supported capabilities', () => {
    const blocked = planRetailerBasketTransferSession({
      retailerId: 'willys',
      retailerName: 'Willys',
      basketId: 'user-1:current-basket',
      lines: [{ productId: 'coffee', productName: 'Zoégas Coffee 450g', quantity: 1, productUrl: 'https://www.willys.se/produkt/coffee', matched: true }],
      support: {
        productDeepLinks: 'supported',
        basketTransfer: 'unsupported',
        copyList: 'supported',
        retailerAppSearch: 'manual',
        checkoutConfirmation: 'unsupported'
      },
      transferEndpoint: 'https://www.willys.se/api/basket/import',
      signedPayload: 'signed.payload',
      shopperSessionPresent: true
    });
    assert.equal(blocked.status, 'blocked');
    assert.equal(blocked.canAttemptTransfer, false);
    assert.match(blocked.blockedReasons[0] ?? '', /not verified/);

    const ready = planRetailerBasketTransferSession({
      retailerId: 'verified-retailer',
      retailerName: 'Verified Retailer',
      basketId: 'user-1:current-basket',
      lines: [
        { productId: 'coffee', productName: 'Zoégas Coffee 450g', quantity: 1, productUrl: 'https://verified-retailer.example/coffee', matched: true },
        { productId: 'milk', productName: 'Arla Milk 1L', quantity: 2, productUrl: 'https://verified-retailer.example/milk', matched: true }
      ],
      support: {
        productDeepLinks: 'supported',
        basketTransfer: 'supported',
        copyList: 'supported',
        retailerAppSearch: 'supported',
        checkoutConfirmation: 'unsupported'
      },
      transferEndpoint: 'https://transfer.verified-retailer.example/baskets',
      signedPayload: 'signed.payload',
      shopperSessionPresent: true
    });

    assert.equal(ready.status, 'ready');
    assert.equal(ready.canAttemptTransfer, true);
    assert.equal(ready.transferLineCount, 2);
    assert.equal(ready.requiresRetailerConfirmation, true);
    assert.match(ready.guardrails[0], /verified retailer capability/);
    assert.match(ready.guardrails[2], /not checkout confirmation/);
  });
});

describe('planRetailerHandoff', () => {
  it('plans deep-link and basket-transfer actions with explicit unsupported and confirmation states', () => {
    const plan = planRetailerHandoff({
      retailerId: 'willys',
      retailerName: 'Willys',
      basketId: 'weekly-basics',
      lines: [
        { productId: 'coffee', productName: 'Coffee', quantity: 1, productUrl: 'https://www.willys.se/coffee', matched: true },
        { productId: 'milk', productName: 'Milk', quantity: 2, productUrl: 'https://www.willys.se/milk', matched: true },
        { productId: 'butter', productName: 'Butter', quantity: 1, matched: false }
      ],
      support: {
        productDeepLinks: 'supported',
        basketTransfer: 'unsupported',
        copyList: 'supported',
        retailerAppSearch: 'manual',
        checkoutConfirmation: 'unsupported'
      }
    });

    assert.equal(plan.primaryAction.actionType, 'copy_list');
    assert.equal(plan.primaryAction.status, 'ready');
    assert.deepEqual(plan.actions.map((action) => ({ actionType: action.actionType, status: action.status, lineCount: action.lineCount })), [
      { actionType: 'copy_list', status: 'ready', lineCount: 3 },
      { actionType: 'product_deep_links', status: 'partial', lineCount: 2 },
      { actionType: 'retailer_app_search', status: 'manual_review', lineCount: 3 },
      { actionType: 'basket_transfer', status: 'unsupported', lineCount: 0 }
    ]);
    assert.deepEqual(plan.unsupportedReasons, [
      'Willys does not currently support verified basket transfer.',
      'Checkout confirmation is not available, so GroceryView cannot claim purchase completion.'
    ]);
    assert.deepEqual(plan.guardrails, [
      'Retailer handoff is an action aid, not checkout confirmation.',
      'Unsupported basket transfer falls back to copyable lists and product deep links.',
      'Missing product links remain visible and require shopper review before retailer handoff.'
    ]);
  });
});

describe('scoreRetailerDeepLinkQuality', () => {
  it('scores retailer deep links by verified URL, HTTP, and canonical product evidence', () => {
    const report = scoreRetailerDeepLinkQuality({
      retailerId: 'willys',
      retailerName: 'Willys',
      asOf: '2026-05-22T09:00:00.000Z',
      links: [
        {
          productId: 'coffee',
          productName: 'Coffee',
          productUrl: 'https://www.willys.se/coffee',
          matched: true,
          httpStatus: 200,
          canonicalProductId: 'coffee',
          lastCheckedAt: '2026-05-22T08:50:00.000Z'
        },
        {
          productId: 'milk',
          productName: 'Milk',
          productUrl: 'https://www.willys.se/milk',
          matched: true,
          httpStatus: 404,
          canonicalProductId: 'milk',
          lastCheckedAt: '2026-05-22T08:50:00.000Z'
        },
        {
          productId: 'butter',
          productName: 'Butter',
          matched: false
        }
      ]
    });

    assert.equal(report.status, 'limited');
    assert.equal(report.readyLinkCount, 1);
    assert.equal(report.brokenLinkCount, 1);
    assert.equal(report.unmatchedLineCount, 1);
    assert.equal(report.rows[0]?.quality, 'verified');
    assert.equal(report.rows[1]?.quality, 'broken');
    assert.equal(report.rows[2]?.quality, 'missing');
    assert.match(report.guardrails.join(' '), /not checkout confirmation/i);
  });

  it('requires canonical product agreement before calling a link verified', () => {
    const report = scoreRetailerDeepLinkQuality({
      retailerId: 'coop',
      retailerName: 'Coop',
      asOf: '2026-05-22T09:00:00.000Z',
      links: [
        {
          productId: 'coffee',
          productName: 'Coffee',
          productUrl: 'https://www.coop.se/tea',
          matched: true,
          httpStatus: 200,
          canonicalProductId: 'tea',
          lastCheckedAt: '2026-05-22T08:50:00.000Z'
        }
      ]
    });

    assert.equal(report.status, 'blocked');
    assert.equal(report.rows[0]?.quality, 'mismatch');
    assert.equal(report.rows[0]?.reason, 'Retailer canonical product id does not match the GroceryView product id.');
  });
});

describe('planBasketTripCost', () => {
  it('ranks basket options by basket plus travel cost while keeping missing-price blockers explicit', () => {
    const plan = planBasketTripCost({
      currency: 'SEK',
      travelMode: 'car',
      valueOfTimePerHour: 120,
      carCostPerKm: 3.5,
      splitTripPenalty: 15,
      options: [
        {
          strategyId: 'cheap-far-split',
          label: 'Cheapest shelf prices across Willys and Lidl',
          basketTotal: 150,
          storeIds: ['willys-odenplan', 'lidl-sveavagen'],
          distanceKm: 8,
          durationMinutes: 28,
          missingProductIds: []
        },
        {
          strategyId: 'near-one-store',
          label: 'Nearby Coop one-stop shop',
          basketTotal: 164,
          storeIds: ['coop-odenplan'],
          distanceKm: 1.2,
          durationMinutes: 8,
          missingProductIds: []
        },
        {
          strategyId: 'missing-price',
          label: 'Incomplete store quote',
          basketTotal: 130,
          storeIds: ['ica-unknown'],
          distanceKm: 0.6,
          durationMinutes: 6,
          missingProductIds: ['butter']
        }
      ]
    });

    assert.equal(plan.bestOption?.strategyId, 'near-one-store');
    assert.deepEqual(plan.options.map((option) => ({
      strategyId: option.strategyId,
      travelCost: option.travelCost,
      effectiveTotal: option.effectiveTotal,
      missingProductIds: option.missingProductIds,
      warnings: option.warnings
    })), [
      {
        strategyId: 'near-one-store',
        travelCost: 20.2,
        effectiveTotal: 184.2,
        missingProductIds: [],
        warnings: []
      },
      {
        strategyId: 'cheap-far-split',
        travelCost: 99,
        effectiveTotal: 249,
        missingProductIds: [],
        warnings: ['Split shop adds 15.00 SEK handling/time penalty.']
      },
      {
        strategyId: 'missing-price',
        travelCost: 14.1,
        effectiveTotal: null,
        missingProductIds: ['butter'],
        warnings: ['Missing verified prices for: butter.']
      }
    ]);
    assert.deepEqual(plan.guardrails, [
      'Trip cost is shown separately from verified shelf totals.',
      'Options with missing product prices are not ranked as complete even when travel looks cheap.',
      'Travel estimates are planning aids, not retailer checkout or delivery confirmations.'
    ]);
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
