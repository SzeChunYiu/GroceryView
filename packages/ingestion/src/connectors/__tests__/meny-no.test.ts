import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMenyNoSearchUrl,
  fetchMenyNoProducts,
  parseMenyNoProducts
} from '../meny-no.js';

const RETRIEVED_AT = '2026-05-25T09:15:00.000Z';

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

describe('Meny Norway connector fixture parsing', () => {
  it('builds query URLs against the public Meny search surface', () => {
    const url = new URL(buildMenyNoSearchUrl('kaffe filter'));

    assert.equal(url.origin + url.pathname, 'https://meny.no/sok');
    assert.equal(url.searchParams.get('query'), 'kaffe filter');
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
                        ean: '7038010012345',
                        name: 'Evergood Filtermalt Kaffe',
                        brand: { name: 'Evergood' },
                        category: { name: 'Kaffe' },
                        packageText: '250 g',
                        price: { amount: 54.9, formatted: '54,90 kr' },
                        unitPrice: { formatted: '219,60 kr/kg' },
                        unitPriceUnit: 'kg',
                        url: '/varer/drikke/kaffe/evergood-filtermalt-7038010012345',
                        images: [{ url: '/globalassets/produktbilder/7038010012345.jpg' }]
                      },
                      {
                        ean: '7038010012345',
                        name: 'Duplicate coffee',
                        price: { amount: 99.9 }
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

    const rows = await fetchMenyNoProducts({
      fetchImpl,
      queries: ['kaffe'],
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [buildMenyNoSearchUrl('kaffe')]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'meny-no',
      code: '7038010012345',
      name: 'Evergood Filtermalt Kaffe',
      brand: 'Evergood',
      category: 'Kaffe',
      packageText: '250 g',
      price: 54.9,
      priceText: '54,90 kr',
      unitPriceText: '219,60 kr/kg',
      unitPriceUnit: 'kg',
      productUrl: 'https://meny.no/varer/drikke/kaffe/evergood-filtermalt-7038010012345',
      imageUrl: 'https://meny.no/globalassets/produktbilder/7038010012345.jpg',
      sourceUrl: buildMenyNoSearchUrl('kaffe'),
      retrievedAt: RETRIEVED_AT
    });
  });

  it('parses JSON API-style fixtures with numeric and string price edge cases', () => {
    const rows = parseMenyNoProducts({
      results: [
        {
          id: 12345,
          title: 'Bananer løsvekt',
          brandName: 'Meny',
          categoryName: 'Frukt',
          size: 'ca 1 kg',
          currentPrice: '28,90 kr',
          comparePriceText: '28,90 kr/kg',
          href: '/varer/frukt/bananer-12345',
          imageUrl: 'https://images.meny.no/banan.jpg'
        },
        {
          id: 'no-name',
          currentPrice: 10
        }
      ]
    }, 'https://meny.no/sok?query=banan', RETRIEVED_AT);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.code, '12345');
    assert.equal(rows[0]?.price, 28.9);
    assert.equal(rows[0]?.unitPriceUnit, 'kg');
    assert.equal(rows[0]?.productUrl, 'https://meny.no/varer/frukt/bananer-12345');
  });

  it('propagates non-OK search responses with query context', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ message: 'blocked' }, 503);

    await assert.rejects(
      fetchMenyNoProducts({ fetchImpl, queries: ['melk'], retrievedAt: RETRIEVED_AT }),
      /Meny Norway search request failed for melk: 503/
    );
  });
});
