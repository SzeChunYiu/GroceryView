import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isRetailerType,
  isSpecialtyRetailerType,
  retailerTypeDescriptions,
  retailerTypeLabels,
  retailerTypes,
  specialtyRetailerTypes
} from '../types/chain.js';

const REQUIRED_SPECIALTY_TYPES = [
  'ethnic_asian',
  'ethnic_polish_eastern_european',
  'ethnic_middle_eastern',
  'ethnic_indian_south_asian',
  'ethnic_latin',
  'ethnic_african',
  'health_food',
  'kosher_halal'
] as const;

describe('chain retailer type vocabulary', () => {
  it('includes the specialty and health-food retailer_type variants used by comparison rows', () => {
    for (const retailerType of REQUIRED_SPECIALTY_TYPES) {
      assert.equal(isRetailerType(retailerType), true, `${retailerType} missing from retailerTypes`);
      assert.equal(isSpecialtyRetailerType(retailerType), true, `${retailerType} missing from specialtyRetailerTypes`);
    }

    assert.deepEqual([...specialtyRetailerTypes], [...REQUIRED_SPECIALTY_TYPES]);
  });

  it('keeps every retailer type documented with a badge label and description', () => {
    for (const retailerType of retailerTypes) {
      assert.match(retailerTypeLabels[retailerType], /\S/);
      assert.match(retailerTypeDescriptions[retailerType], /\S/);
    }
  });

  it('rejects unknown badge values without widening the canonical enum', () => {
    assert.equal(isRetailerType('ethnic_made_up'), false);
    assert.equal(isSpecialtyRetailerType('grocery'), false);
  });
});
