import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type ParsedCitygrossRow = {
  chain: 'citygross';
  sku: string;
  name: string;
  price: number;
  currency: 'SEK';
  inStock: boolean;
};

const recordedFixture = {
  id: 'cg-123',
  name: 'Mjölk 1,5% 1l',
  price: { amount: 14.95, currency: 'SEK' },
  availability: { inStock: true }
};

function parseRecordedCitygrossFixture(product: typeof recordedFixture): ParsedCitygrossRow {
  if (!product.id) throw new Error('City Gross product is missing id');
  if (!product.name) throw new Error('City Gross product is missing name');
  if (product.price.currency !== 'SEK') throw new Error('City Gross fixture must be SEK');

  return {
    chain: 'citygross',
    sku: product.id,
    name: product.name,
    price: product.price.amount,
    currency: product.price.currency,
    inStock: product.availability.inStock
  };
}

describe('citygross connector fixture shape', () => {
  it('parses a recorded fixture into the expected row shape', () => {
    assert.deepEqual(parseRecordedCitygrossFixture(recordedFixture), {
      chain: 'citygross',
      sku: 'cg-123',
      name: 'Mjölk 1,5% 1l',
      price: 14.95,
      currency: 'SEK',
      inStock: true
    });
  });

  it('keeps the out-of-stock edge case explicit', () => {
    const row = parseRecordedCitygrossFixture({ ...recordedFixture, availability: { inStock: false } });
    assert.equal(row.inStock, false);
  });

  it('surfaces fixture contract errors', () => {
    assert.throws(() => parseRecordedCitygrossFixture({ ...recordedFixture, id: '' }), /missing id/);
  });
});
