import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchNormalNoProducts,
  NORMAL_NO_PRODUCTS_URL,
  parseNormalNoProducts
} from '../normal-no.js';

const RETRIEVED_AT = '2026-05-25T13:20:00.000Z';

type MockResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as MockResponse as Response;
}

const SHOPIFY_FIXTURE = {
  products: [
    {
      id: 1001,
      handle: 'hyaluronic-serum',
      title: 'Hyaluronic Serum 30 ml',
      vendor: 'Normal Beauty',
      product_type: 'Hudpleie',
      tags: ['serum', '', 42],
      images: [{ src: 'https://cdn.normal.no/serum.jpg' }],
      variants: [{ id: 2001, sku: 'NO-SERUM-30', price: '49.90', compare_at_price: '59.90', available: true }]
    },
    {
      id: 1002,
      handle: 'duplicate-serum',
      title: 'Duplicate Serum',
      variants: [{ id: 2002, sku: 'NO-SERUM-30', price: '99.90', available: true }]
    },
    {
      id: 1003,
      title: 'Missing price',
      variants: [{ id: 2003, sku: 'NO-MISSING' }]
    }
  ]
};

describe('Normal NO connector', () => {
  it('parses Shopify product fixtures into cosmetics rows', () => {
    const rows = parseNormalNoProducts(SHOPIFY_FIXTURE, NORMAL_NO_PRODUCTS_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'normal-no',
      retailerType: 'cosmetics',
      code: 'NO-SERUM-30',
      name: 'Hyaluronic Serum 30 ml',
      brand: 'Normal Beauty',
      category: 'Hudpleie',
      tags: ['serum'],
      price: 49.9,
      priceText: '49.90 kr',
      compareAtPrice: 59.9,
      available: true,
      productUrl: 'https://www.normal.no/products/hyaluronic-serum',
      imageUrl: 'https://cdn.normal.no/serum.jpg',
      sourceUrl: NORMAL_NO_PRODUCTS_URL,
      retrievedAt: RETRIEVED_AT
    });
  });

  it('fetches, de-duplicates, caps rows, and propagates HTTP failures', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrls.push(String(input));
      return jsonResponse(SHOPIFY_FIXTURE);
    };

    const rows = await fetchNormalNoProducts({ fetchImpl, maxRows: 1, retrievedAt: RETRIEVED_AT });

    assert.deepEqual(requestedUrls, [NORMAL_NO_PRODUCTS_URL]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.code, 'NO-SERUM-30');

    await assert.rejects(
      fetchNormalNoProducts({ fetchImpl: async () => jsonResponse({ error: 'blocked' }, 503) }),
      /Normal NO source failed with HTTP 503\./
    );
  });
});
