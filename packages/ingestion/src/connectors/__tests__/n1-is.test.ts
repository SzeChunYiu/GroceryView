import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchN1IsProducts,
  N1_IS_STORE_BASE_URL,
  parseN1IsProducts
} from '../n1-is.js';

const RETRIEVED_AT = '2026-05-25T11:55:00.000Z';
const SOURCE_URL = `${N1_IS_STORE_BASE_URL}/verslun/`;

const RECORDED_N1_FIXTURE = JSON.stringify({
  products: [
    {
      id: 'n1-100',
      name: 'N1 Kaffi 250g',
      price: '1.299 kr.',
      category: 'Matvara',
      url: '/vara/n1-kaffi-250g',
      image: '/media/kaffi.jpg',
      inStock: true
    },
    {
      id: 'n1-101',
      title: 'Samloka með osti',
      price: '899 kr.',
      category: 'Nesti',
      productUrl: 'https://www.n1.is/vara/samloka-med-osti',
      image: 'https://www.n1.is/media/samloka.jpg',
      inStock: false
    },
    { id: 'missing-price', name: 'Broken row' },
    { id: 'n1-100', name: 'Duplicate row', price: '9.999 kr.' }
  ]
});

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

describe('N1 IS connector fixture parsing', () => {
  it('parses recorded fixture rows into normalized N1 products', () => {
    const rows = parseN1IsProducts(RECORDED_N1_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      chain: 'n1-is',
      code: 'n1-100',
      name: 'N1 Kaffi 250g',
      price: 1299,
      priceText: '1.299 kr.',
      category: 'Matvara',
      productUrl: 'https://www.n1.is/vara/n1-kaffi-250g',
      imageUrl: 'https://www.n1.is/media/kaffi.jpg',
      inStock: true,
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(
      { code: rows[1]?.code, name: rows[1]?.name, price: rows[1]?.price, productUrl: rows[1]?.productUrl, imageUrl: rows[1]?.imageUrl, inStock: rows[1]?.inStock },
      { code: 'n1-101', name: 'Samloka með osti', price: 899, productUrl: 'https://www.n1.is/vara/samloka-med-osti', imageUrl: 'https://www.n1.is/media/samloka.jpg', inStock: false }
    );
  });

  it('mocks HTTP with the fixture, skips malformed rows, de-duplicates codes, and preserves request metadata', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchN1IsProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_N1_FIXTURE);
      },
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(rows.map((row) => row.code), ['n1-100', 'n1-101']);
    assert.equal(rows.every((row) => row.sourceUrl === SOURCE_URL), true);
    assert.equal(rows.every((row) => row.retrievedAt === RETRIEVED_AT), true);
  });

  it('honours maxRows and propagates non-OK fixture responses', async () => {
    const rows = await fetchN1IsProducts({
      fetchImpl: async () => response(RECORDED_N1_FIXTURE),
      sourceUrls: [SOURCE_URL, `${N1_IS_STORE_BASE_URL}/api/products`],
      maxRows: 1,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(rows.map((row) => row.code), ['n1-100']);

    await assert.rejects(
      fetchN1IsProducts({ fetchImpl: async () => response('blocked', 503), sourceUrls: [SOURCE_URL] }),
      /N1 request failed for https:\/\/www\.n1\.is\/verslun\/: 503/
    );
  });
});
