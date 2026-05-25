import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRema1000NoSearchUrl,
  fetchRema1000NoProducts,
  parseRema1000NoProducts
} from '../rema-1000-no.js';

const RETRIEVED_AT = '2026-05-25T12:30:00.000Z';

type MockResponse = {
  ok: boolean;
  status: number;
  headers?: { get: (name: string) => string | null };
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  } as MockResponse as Response;
}

function htmlResponse(html: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'text/html' },
    json: async () => JSON.parse(html),
    text: async () => html
  } as MockResponse as Response;
}

describe('REMA 1000 Norway connector fixture parsing', () => {
  it('builds query URLs against the public REMA search surface', () => {
    const url = new URL(buildRema1000NoSearchUrl('kaffe filter'));

    assert.equal(url.origin + url.pathname, 'https://www.rema.no/search');
    assert.equal(url.searchParams.get('search'), 'kaffe filter');
  });

  it('parses recorded Next-data product rows, skips malformed rows, and de-duplicates by code', async () => {
    const requestedUrls: string[] = [];
    const fixture = {
      props: {
        pageProps: {
          dehydratedState: {
            queries: [
              {
                state: {
                  data: {
                    products: [
                      {
                        ean: '7035620056789',
                        name: 'Kjeldsberg Filtermalt Kaffe',
                        brand: { name: 'Kjeldsberg' },
                        category: { name: 'Kaffe' },
                        packageText: '250 g',
                        price: { amount: 48.9, formatted: '48,90 kr' },
                        unitPrice: { formatted: '195,60 kr/kg' },
                        unitPriceUnit: 'kg',
                        url: '/produkter/drikke/kaffe/kjeldsberg-filtermalt-7035620056789',
                        images: [{ url: '/globalassets/produktbilder/7035620056789.jpg' }]
                      },
                      {
                        ean: '7035620056789',
                        name: 'Duplicate coffee',
                        price: { amount: 59.9 }
                      },
                      {
                        ean: 'missing-price',
                        name: 'Malformed without price'
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    };
    const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(fixture)}</script></body></html>`;
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrls.push(String(input));
      return htmlResponse(html);
    };

    const rows = await fetchRema1000NoProducts({
      fetchImpl,
      queries: ['kaffe'],
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [buildRema1000NoSearchUrl('kaffe')]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'rema-1000-no',
      code: '7035620056789',
      name: 'Kjeldsberg Filtermalt Kaffe',
      brand: 'Kjeldsberg',
      category: 'Kaffe',
      packageText: '250 g',
      price: 48.9,
      priceText: '48,90 kr',
      unitPriceText: '195,60 kr/kg',
      unitPriceUnit: 'kg',
      productUrl: 'https://www.rema.no/produkter/drikke/kaffe/kjeldsberg-filtermalt-7035620056789',
      imageUrl: 'https://www.rema.no/globalassets/produktbilder/7035620056789.jpg',
      sourceUrl: buildRema1000NoSearchUrl('kaffe'),
      retrievedAt: RETRIEVED_AT
    });
  });

  it('parses JSON API-style fixtures with numeric and string price edge cases', () => {
    const rows = parseRema1000NoProducts({
      hits: [
        {
          id: 98765,
          title: 'Bananer løsvekt',
          brandName: 'REMA 1000',
          categoryName: 'Frukt og grønt',
          size: 'ca 1 kg',
          currentPrice: '24,90 kr',
          comparePriceText: '24,90 kr/kg',
          href: '/produkter/frukt-og-gront/bananer-98765',
          imageUrl: 'https://images.rema.no/banan.jpg'
        },
        {
          id: 'missing-name',
          currentPrice: 10
        },
        {
          id: 'numeric-price',
          title: 'Gulrøtter 1 kg',
          price: 19.5,
          unitPriceText: '19,50 kr/kg'
        }
      ]
    }, 'https://www.rema.no/search?search=banan', RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.code, '98765');
    assert.equal(rows[0]?.price, 24.9);
    assert.equal(rows[0]?.unitPriceUnit, 'kg');
    assert.equal(rows[0]?.productUrl, 'https://www.rema.no/produkter/frukt-og-gront/bananer-98765');
    assert.equal(rows[1]?.priceText, '19.50 kr');
  });

  it('propagates non-OK search responses with query context', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ message: 'blocked' }, 503);

    await assert.rejects(
      fetchRema1000NoProducts({ fetchImpl, queries: ['melk'], retrievedAt: RETRIEVED_AT }),
      /REMA 1000 Norway search request failed for melk: 503/
    );
  });
});
