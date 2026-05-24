// @ts-ignore GroceryView CI does not currently install Vitest types for package-local compile checks.
import { describe, expect, it } from 'vitest';
import { validateBasketComparisonLineFixtures, type BasketComparisonLineFixture } from '../../index.js';

const verifiedMatchedLine: BasketComparisonLineFixture = {
  basketLineId: 'line:standardmjolk-1l',
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
  disclosureCopy: 'Matched online price from verified ICA fixture.'
};

describe('validateBasketComparisonLineFixtures verified data coverage', () => {
  it('accepts a verified matched fixture with complete price evidence', () => {
    const validation = validateBasketComparisonLineFixtures([verifiedMatchedLine]);

    expect(validation).toEqual({
      status: 'valid',
      basketLineIds: ['line:standardmjolk-1l'],
      issues: []
    });
  });

  it('treats an empty verified-data input as a valid empty ledger', () => {
    const validation = validateBasketComparisonLineFixtures([]);

    expect(validation).toEqual({
      status: 'valid',
      basketLineIds: [],
      issues: []
    });
  });

  it('reports malformed fixture rows with missing required fields', () => {
    const malformedLine: BasketComparisonLineFixture = {
      ...verifiedMatchedLine,
      basketLineId: 'line:missing-fields',
      requestedProductId: '',
      requestedQuantity: 0,
      matchedProductId: undefined,
      disclosureCopy: ''
    };

    const validation = validateBasketComparisonLineFixtures([malformedLine]);

    expect(validation.status).toBe('invalid');
    expect(validation.basketLineIds).toEqual(['line:missing-fields']);
    expect(validation.issues).toEqual([
      'missing_requested_product:line:missing-fields',
      'invalid_quantity:line:missing-fields',
      'missing_disclosure:line:missing-fields',
      'matched_product_required:line:missing-fields'
    ]);
  });
});
