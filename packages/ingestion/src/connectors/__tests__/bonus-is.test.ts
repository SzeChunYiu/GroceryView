import { describe, expect, it } from 'vitest';
import { fetchBonusIsRows, parseBonusIsRows } from '../bonus-is';

const recordedFixture = {
  products: [
    { id: '1001', name: 'Mjólk 1 l', brand: 'MS', category: 'dairy', price: '249', url: '/vara/1001' },
    { id: 'bad-price', name: 'Invalid', price: 'not-a-price' },
    { id: '', name: 'Missing id', price: 100 }
  ]
};

describe('bonus-is fixture connector', () => {
  it('parses the recorded fixture into Bonus IS row shape and skips malformed rows', () => {
    expect(parseBonusIsRows(recordedFixture)).toEqual([
      {
        brand: 'MS',
        category: 'dairy',
        currency: 'ISK',
        name: 'Mjólk 1 l',
        price: 249,
        productId: '1001',
        sourceUrl: 'https://bonus.is/api/products',
        url: 'https://bonus.is/vara/1001'
      }
    ]);
  });

  it('mocks HTTP with the recorded fixture', async () => {
    const rows = await fetchBonusIsRows(async () => new Response(JSON.stringify(recordedFixture), { status: 200 }) as Response);
    expect(rows).toHaveLength(1);
  });

  it('surfaces HTTP failures', async () => {
    await expect(fetchBonusIsRows(async () => new Response('nope', { status: 503 }) as Response)).rejects.toThrow('Bonus IS request failed: 503');
  });
});
