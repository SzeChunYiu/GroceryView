import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatUnitPriceCopy } from '../product-row';

describe('formatUnitPriceCopy', () => {
  it('matches the kilogram unit-price copy snapshot', () => {
    assert.equal(formatUnitPriceCopy(59.9), '59,90 kr / 1 kg');
  });
});
