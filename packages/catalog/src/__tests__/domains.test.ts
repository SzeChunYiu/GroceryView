import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findPriceDomain, SUPPORTED_PRICE_DOMAINS } from '../index.js';

describe('SUPPORTED_PRICE_DOMAINS', () => {
  it('declares grocery and fuel as active while keeping pharmacy as a no-price foundation', () => {
    assert.deepEqual(SUPPORTED_PRICE_DOMAINS.map((domain) => domain.slug), ['grocery', 'fuel', 'pharmacy']);
    assert.equal(findPriceDomain('grocery')?.status, 'active');

    const fuel = findPriceDomain('fuel');
    const pharmacy = findPriceDomain('pharmacy');

    assert.equal(fuel?.status, 'active');
    assert.equal(pharmacy?.status, 'foundation');
    assert.ok(fuel?.seedItems.some((item) => item.id === 'fuel-95-e10' && item.matchKey === 'fuel_grade'));
    assert.ok(fuel?.seedItems.some((item) => item.id === 'fuel-adblue' && item.matchKey === 'fuel_grade'));
    assert.ok(pharmacy?.seedItems.some((item) => item.id === 'otc-pharmacy' && item.matchKey === 'ean'));
    assert.match(fuel?.priceClaimBoundary ?? '', /operator public price pages/);
    assert.match(pharmacy?.priceClaimBoundary ?? '', /No pharmacy price/);
  });
});
