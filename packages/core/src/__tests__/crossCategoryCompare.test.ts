import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareCrossCategoryPrices, type CrossCategoryPriceSource } from '../index.js';

const sources: CrossCategoryPriceSource[] = [
  { canonicalProductId: 'toothpaste-75ml', retailerId: 'ica', retailerName: 'ICA', retailerType: 'grocery', price: 29.9, currency: 'SEK', observedAt: '2026-05-23T10:00:00.000Z' },
  { canonicalProductId: 'toothpaste-75ml', retailerId: 'oob', retailerName: 'ÖoB', retailerType: 'variety', price: 19.9, currency: 'SEK', observedAt: '2026-05-23T12:00:00.000Z' },
  { canonicalProductId: 'diapers-size-4', retailerId: 'willys', retailerName: 'Willys', retailerType: 'grocery', price: 119, currency: 'SEK', observedAt: '2026-05-23T12:00:00.000Z' },
  { canonicalProductId: 'toothpaste-75ml', retailerId: 'old', retailerName: 'Old Store', retailerType: 'specialty', price: 9.9, currency: 'SEK', observedAt: '2026-04-01T12:00:00.000Z' }
];

describe('compareCrossCategoryPrices', () => {
  it('returns the cheapest source across grocery and variety retailer types for one canonical product', () => {
    const result = compareCrossCategoryPrices({
      canonicalProductId: 'toothpaste-75ml',
      sources,
      currency: 'SEK',
      now: '2026-05-24T12:00:00.000Z'
    });

    assert.equal(result.cheapest?.retailerId, 'oob');
    assert.equal(result.cheapest?.retailerType, 'variety');
    assert.deepEqual(result.retailerTypes, ['grocery', 'variety']);
    assert.deepEqual(result.sources.map((source) => source.retailerId), ['oob', 'ica']);
  });

  it('returns null when no current source carries the canonical product', () => {
    const result = compareCrossCategoryPrices({
      canonicalProductId: 'missing',
      sources,
      now: '2026-05-24T12:00:00.000Z'
    });

    assert.equal(result.cheapest, null);
    assert.deepEqual(result.sources, []);
  });
});
