import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchKronanIsProducts, parseKronanIsProducts } from '../kronan-is.js';

const fixture = {
  products: [
    {
      id: 'is-100',
      name: 'Mjólk 1L',
      brand: 'MS',
      category: 'dairy',
      price: 289,
      unitPrice: 289,
      unitPriceUnit: 'L',
      imageUrl: 'https://cdn.kronan.is/mjolk.jpg'
    },
    { id: 'missing-price', name: 'Invalid row' },
    { id: 'negative', name: 'Bad price', price: -10 }
  ]
};

describe('kronan-is connector', () => {
  it('parses recorded fixture rows into Icelandic price rows and drops invalid products', () => {
    const rows = parseKronanIsProducts(fixture, 'https://fixture.kronan.is/products', '2026-05-24T00:00:00.000Z');

    assert.deepEqual(rows, [{
      id: 'is-100',
      name: 'Mjólk 1L',
      brand: 'MS',
      category: 'dairy',
      price: 289,
      currency: 'ISK',
      country: 'IS',
      unitPrice: 289,
      unitPriceUnit: 'L',
      imageUrl: 'https://cdn.kronan.is/mjolk.jpg',
      sourceUrl: 'https://fixture.kronan.is/products',
      retrievedAt: '2026-05-24T00:00:00.000Z'
    }]);
  });

  it('fetches through mocked HTTP and reports upstream errors', async () => {
    const okFetch = async () => new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } });
    const rows = await fetchKronanIsProducts({ fetchImpl: okFetch, retrievedAt: '2026-05-24T00:00:00.000Z' });
    assert.equal(rows.length, 1);

    const failingFetch = async () => new Response('{}', { status: 503 });
    await assert.rejects(() => fetchKronanIsProducts({ fetchImpl: failingFetch }), /503/);
  });
});
