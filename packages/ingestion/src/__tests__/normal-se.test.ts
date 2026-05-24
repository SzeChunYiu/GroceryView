import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NORMAL_SE_FIXTURE, parseNormalSeProducts } from '../connectors/normal-se.js';

describe('Normal SE connector', () => {
  it('normalizes cosmetics product rows with retailer_type badge', () => {
    const [row] = parseNormalSeProducts(NORMAL_SE_FIXTURE, { retrievedAt: '2026-05-24T00:00:00.000Z' });
    assert.ok(row);

    assert.equal(row.retailerId, 'normal-se');
    assert.equal(row.countryCode, 'SE');
    assert.equal(row.retailer_type, 'cosmetics');
    assert.equal(row.productId, 'normal-shampoo-250ml');
    assert.equal(row.price, 24.9);
    assert.equal(row.currency, 'SEK');
  });
});
