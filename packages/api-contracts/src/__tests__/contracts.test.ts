import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PriceObservationSchema } from '../index.js';

describe('PriceObservationSchema', () => {
  const observedAt = '2026-05-19T10:00:00.000Z';

  it('requires confidence and provenance on prices', () => {
    const parsed = PriceObservationSchema.parse({
      id: 'price-1',
      productId: 'product-1',
      storeId: 'store-1',
      amount: 29.9,
      currency: 'SEK',
      unitPrice: 59.8,
      unit: 'kg',
      priceType: 'flyer',
      confidence: { score: 0.82, label: 'medium' },
      observedAt,
      sourceType: 'flyer',
      provenance: {
        sourceType: 'flyer',
        sourceUrl: 'https://example.com/flyer/1',
        observedAt,
        parserVersion: 'flyer-parser-v1',
        rawSnapshotRef: 's3://groceryview-raw/flyers/1.json'
      }
    });

    assert.equal(parsed.provenance.parserVersion, 'flyer-parser-v1');
  });

  it('rejects prices without provenance', () => {
    const result = PriceObservationSchema.safeParse({
      id: 'price-1',
      productId: 'product-1',
      storeId: 'store-1',
      amount: 29.9,
      currency: 'SEK',
      unitPrice: null,
      unit: 'each',
      priceType: 'estimated',
      confidence: { score: 0.2, label: 'unverified' },
      observedAt,
      sourceType: 'estimated'
    });

    assert.equal(result.success, false);
  });
});
