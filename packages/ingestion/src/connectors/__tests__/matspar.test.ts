import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchMatsparProducts, parseMatsparPageProducts } from '../matspar.js';

function matsparFixture(products: unknown[]) {
  return `<html><script>window.__PAGEDATA__ = JSON.parse(${JSON.stringify(JSON.stringify({ payload: { products } }))});</script></html>`;
}

function okFetch(html: string): typeof fetch {
  return (async () => ({ ok: true, text: async () => html }) as Response) as typeof fetch;
}

describe('matspar connector fixture', () => {
  it('parses recorded page data into normalized row shape and skips incomplete rows', async () => {
    const html = matsparFixture([
      {
        productid: 123,
        name: 'Kaffe Mellanrost 450g',
        brand: 'Zoegas',
        weight_pretty: '450 g',
        country_from: 'SE',
        slug: 'produkt/kaffe-mellanrost',
        image: 'abc123',
        price: 5495,
        median_price: 5995,
        w_prices: { willys: 5495, hemkop: 5995 }
      },
      { productid: 456, price: 1000 }
    ]);

    const rows = await fetchMatsparProducts({
      fetchImpl: okFetch(html),
      queries: ['kaffe'],
      pages: [1],
      retrievedAt: '2026-05-24T00:00:00.000Z'
    });

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      code: '123',
      name: 'Kaffe Mellanrost 450g',
      brand: 'Zoegas',
      packageText: '450 g',
      countryFrom: 'SE',
      price: 54.95,
      priceText: '54.95 SEK',
      medianPrice: 59.95,
      warehousePriceCount: 2,
      sourceUrl: 'https://www.matspar.se/kategori?q=kaffe',
      productUrl: 'https://www.matspar.se/produkt/kaffe-mellanrost',
      imageHash: 'abc123',
      retrievedAt: '2026-05-24T00:00:00.000Z'
    });
  });

  it('throws when the recorded fixture lacks Matspar page data', () => {
    assert.throws(() => parseMatsparPageProducts('<html></html>'), /__PAGEDATA__/);
  });

  it('surfaces HTTP failures from the mocked search request', async () => {
    await assert.rejects(
      fetchMatsparProducts({
        fetchImpl: (async () => ({ ok: false, status: 503, text: async () => '' }) as Response) as typeof fetch,
        queries: ['kaffe'],
        pages: [1]
      }),
      /Matspar search request failed.*503/
    );
  });
});
