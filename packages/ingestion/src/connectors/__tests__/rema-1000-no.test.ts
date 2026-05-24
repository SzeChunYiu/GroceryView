import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchRema1000NoProducts,
  parseRema1000NoProducts,
  REMA_1000_NO_PRODUCTS_URL
} from '../rema-1000-no.js';

const fixture = {
  products: [
    { id: '703562000001', name: 'Norvegia 1 kg', brand: 'Tine', category: 'ost', price: 109.9, unitPrice: 109.9, unit: 'kg' },
    { id: 'missing-price', name: 'Incomplete row', category: 'test' },
    { id: 'negative-price', name: 'Bad row', price: -1 }
  ]
};

describe('rema-1000-no connector', () => {
  it('parses recorded fixture rows into the normalized Norway shape and drops edge cases', () => {
    const rows = parseRema1000NoProducts(fixture, 'fixture://rema', '2026-05-24T12:00:00.000Z');

    assert.deepEqual(rows, [{
      country: 'NO',
      currency: 'NOK',
      chain: 'rema-1000-no',
      code: '703562000001',
      name: 'Norvegia 1 kg',
      brand: 'Tine',
      category: 'ost',
      price: 109.9,
      unitPrice: 109.9,
      unit: 'kg',
      sourceUrl: 'fixture://rema',
      retrievedAt: '2026-05-24T12:00:00.000Z'
    }]);
  });

  it('mocks HTTP fetches and fails closed on upstream errors', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchRema1000NoProducts({
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } });
      },
      retrievedAt: '2026-05-24T12:00:00.000Z'
    });

    assert.deepEqual(requestedUrls, [REMA_1000_NO_PRODUCTS_URL]);
    assert.equal(rows.length, 1);

    await assert.rejects(
      () => fetchRema1000NoProducts({ fetchImpl: async () => new Response('Nope', { status: 503 }) }),
      /Rema 1000 Norway request failed: 503/
    );
  });
});
