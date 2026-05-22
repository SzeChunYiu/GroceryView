import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findPriceDomain, SUPPORTED_PRICE_DOMAINS } from '../index.js';

describe('SUPPORTED_PRICE_DOMAINS', () => {
  it('declares grocery as active and keeps fuel/pharmacy as no-price foundations', () => {
    assert.deepEqual(SUPPORTED_PRICE_DOMAINS.map((domain) => domain.slug), ['grocery', 'fuel', 'pharmacy']);
    assert.equal(findPriceDomain('grocery')?.status, 'active');

    const fuel = findPriceDomain('fuel');
    const pharmacy = findPriceDomain('pharmacy');

    assert.equal(fuel?.status, 'foundation');
    assert.equal(pharmacy?.status, 'foundation');
    assert.ok(fuel?.seedItems.some((item) => item.id === 'fuel-95-e10' && item.matchKey === 'fuel_grade'));
    assert.ok(pharmacy?.seedItems.some((item) => item.id === 'otc-pharmacy' && item.matchKey === 'ean'));
    assert.match(fuel?.priceClaimBoundary ?? '', /No fuel price/);
    assert.match(pharmacy?.priceClaimBoundary ?? '', /No pharmacy price/);
  });
});
