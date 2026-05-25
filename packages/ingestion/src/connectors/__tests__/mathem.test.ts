import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMathemSearchUrl,
  fetchMathemProducts,
  normalizeMathemProduct,
  parseMathemSearchProducts,
  type MathemProduct
} from '../mathem.js';

const RETRIEVED_AT = '2026-05-25T09:15:00.000Z';

function nextDataFixture(products: unknown[]): string {
  return `<!doctype html>
<html lang="sv">
  <head><title>Mathem search fixture</title></head>
  <body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          dehydratedState: {
            queries: [
              {
                state: {
                  data: {
                    search: {
                      productGroups: [
                        {
                          name: 'Recorded Mathem search results',
                          items: products
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      }
    })}</script>
  </body>
</html>`;
}

const RECORDED_SEARCH_FIXTURE = nextDataFixture([
  {
    id: 'm-1001',
    type: 'product',
    attributes: {
      id: 'm-1001',
      fullName: 'Arla Ko Mellanmjölk 1,5% 1 l',
      brand: 'Arla Ko',
      nameExtra: '1 l',
      frontUrl: '/se/products/1001-arla-ko-mellanmjolk-1l/',
      grossPrice: '17.90',
      grossUnitPrice: '17.90',
      unitPriceQuantityAbbreviation: 'l',
      currency: 'SEK',
      availability: { isAvailable: true },
      images: [{ thumbnail: { url: 'https://assets.mathem.se/products/mellanmjolk-thumb.jpg' } }]
    }
  },
  {
    id: 'm-1002',
    type: 'product',
    attributes: {
      id: 'm-1002',
      name: 'Änglamark Bananer Eko',
      brand: 'Änglamark',
      nameExtra: 'ca 1 kg',
      absoluteUrl: 'https://www.mathem.se/se/products/1002-anglamark-bananer-eko/',
      grossPrice: 29.95,
      grossUnitPrice: 29.95,
      unitPriceQuantityAbbreviation: 'kg',
      currency: 'SEK',
      availability: { isAvailable: false },
      images: [{ large: { url: 'https://assets.mathem.se/products/bananer-large.jpg' } }]
    }
  },
  {
    id: 'm-1003',
    type: 'product',
    attributes: {
      id: 'm-1003',
      fullName: 'Garant Havregryn',
      brand: 'Garant',
      nameExtra: '1,5 kg',
      frontUrl: '/se/products/1003-garant-havregryn/',
      grossPrice: '23.50',
      currency: 'SEK',
      availability: {}
    }
  },
  {
    id: 'm-1001',
    type: 'product',
    attributes: {
      id: 'm-1001',
      fullName: 'Duplicate milk row from another shelf',
      brand: 'Arla Ko',
      nameExtra: '1 l',
      grossPrice: '99.00'
    }
  },
  {
    id: 'missing-price',
    type: 'product',
    attributes: {
      id: 'missing-price',
      fullName: 'Malformed row without a price',
      brand: 'Fixture'
    }
  },
  {
    id: 'banner-1',
    type: 'banner',
    attributes: {
      id: 'banner-1',
      fullName: 'Campaign banner that is not a product',
      grossPrice: '1.00'
    }
  }
]);

function response(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

describe('Mathem connector fixture parsing', () => {
  it('builds deterministic search URLs with optional pagination', () => {
    assert.equal(buildMathemSearchUrl('mjölk mellan'), 'https://www.mathem.se/se/search/products/?q=mj%C3%B6lk+mellan');
    assert.equal(
      buildMathemSearchUrl('mjölk mellan', 3),
      'https://www.mathem.se/se/search/products/?q=mj%C3%B6lk+mellan&page=3'
    );
  });

  it('parses recorded Next.js fixture rows and normalizes the Mathem product shape', () => {
    const products = parseMathemSearchProducts(RECORDED_SEARCH_FIXTURE);

    assert.equal(products.length, 5);

    const sourceUrl = buildMathemSearchUrl('mjölk mellan');
    const rows = products
      .map((product) => normalizeMathemProduct(product, sourceUrl, RETRIEVED_AT))
      .filter((row): row is MathemProduct => row !== null);

    assert.equal(rows.length, 4);
    assert.deepEqual(rows[0], {
      code: 'm-1001',
      name: 'Arla Ko Mellanmjölk 1,5% 1 l',
      brand: 'Arla Ko',
      packageText: '1 l',
      price: 17.9,
      priceText: '17.90 SEK',
      unitPrice: 17.9,
      unitPriceText: '17.90 SEK',
      unitPriceUnit: 'l',
      imageUrl: 'https://assets.mathem.se/products/mellanmjolk-thumb.jpg',
      productUrl: 'https://www.mathem.se/se/products/1001-arla-ko-mellanmjolk-1l/',
      available: true,
      sourceUrl,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(
      {
        code: rows[1]?.code,
        name: rows[1]?.name,
        imageUrl: rows[1]?.imageUrl,
        productUrl: rows[1]?.productUrl,
        available: rows[1]?.available,
        unitPriceUnit: rows[1]?.unitPriceUnit
      },
      {
        code: 'm-1002',
        name: 'Änglamark Bananer Eko',
        imageUrl: 'https://assets.mathem.se/products/bananer-large.jpg',
        productUrl: 'https://www.mathem.se/se/products/1002-anglamark-bananer-eko/',
        available: false,
        unitPriceUnit: 'kg'
      }
    );
    assert.equal(rows[2]?.unitPrice, null);
    assert.equal(rows[2]?.unitPriceText, '');
    assert.equal(rows[2]?.available, false);
  });

  it('mocks HTTP with the fixture, skips malformed rows, de-duplicates codes, and preserves row metadata', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchMathemProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_SEARCH_FIXTURE);
      },
      queries: ['mjölk mellan'],
      pages: [1],
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [buildMathemSearchUrl('mjölk mellan')]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(
      rows.map((row) => row.code),
      ['m-1001', 'm-1002', 'm-1003']
    );
    assert.equal(rows.every((row) => row.sourceUrl === requestedUrls[0]), true);
    assert.equal(rows.every((row) => row.retrievedAt === RETRIEVED_AT), true);
  });

  it('honours maxRows across paginated fixture responses', async () => {
    const requestedUrls: string[] = [];

    const rows = await fetchMathemProducts({
      fetchImpl: async (input) => {
        requestedUrls.push(String(input));
        return response(RECORDED_SEARCH_FIXTURE);
      },
      queries: ['mjölk mellan'],
      pages: [1, 2],
      maxRows: 2,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [buildMathemSearchUrl('mjölk mellan')]);
    assert.deepEqual(
      rows.map((row) => row.code),
      ['m-1001', 'm-1002']
    );
  });

  it('fails closed for HTTP errors and malformed fixtures', async () => {
    await assert.rejects(
      () =>
        fetchMathemProducts({
          fetchImpl: async () => response('Forbidden', 403),
          queries: ['mjölk mellan'],
          pages: [2],
          retrievedAt: RETRIEVED_AT
        }),
      /Mathem search request failed for mjölk mellan page 2: 403/
    );

    assert.throws(
      () => parseMathemSearchProducts('<html><body>No Next.js data</body></html>'),
      /Mathem search page did not include __NEXT_DATA__/
    );
  });
});
