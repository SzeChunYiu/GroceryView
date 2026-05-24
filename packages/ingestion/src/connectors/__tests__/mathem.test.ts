import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMathemSearchUrl, fetchMathemProducts, normalizeMathemProduct, parseMathemSearchProducts } from '../mathem.js';

const recordedFixture = `<!doctype html>
<html>
  <body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          dehydratedState: {
            queries: [
              {
                state: {
                  data: {
                    products: [
                      {
                        id: 'm-1001',
                        type: 'product',
                        attributes: {
                          id: 'm-1001',
                          fullName: 'Arla Ko Mellanmjölk 1,5% 1l',
                          brand: 'Arla Ko',
                          nameExtra: '1l',
                          frontUrl: '/se/products/1001-arla-ko-mellanmjolk-1l/',
                          grossPrice: '17.90',
                          grossUnitPrice: '17.90',
                          unitPriceQuantityAbbreviation: 'l',
                          currency: 'SEK',
                          availability: { isAvailable: true },
                          images: [{ thumbnail: { url: 'https://images.mathem.se/milk-thumb.jpg' } }]
                        }
                      },
                      {
                        id: 'm-1002',
                        type: 'product',
                        attributes: {
                          id: 'm-1002',
                          name: 'Mathem Bananer Eko',
                          brand: 'Mathem',
                          nameExtra: 'ca 1kg',
                          absoluteUrl: 'https://www.mathem.se/se/products/1002-bananer-eko/',
                          grossPrice: 29.95,
                          grossUnitPrice: 29.95,
                          unitPriceQuantityAbbreviation: 'kg',
                          currency: 'SEK',
                          availability: { isAvailable: false },
                          images: [{ large: { url: 'https://images.mathem.se/banana-large.jpg' } }]
                        }
                      },
                      {
                        id: 'm-1001',
                        type: 'product',
                        attributes: {
                          id: 'm-1001',
                          fullName: 'Duplicate milk row',
                          grossPrice: '99.00'
                        }
                      },
                      {
                        id: 'missing-price',
                        type: 'product',
                        attributes: { id: 'missing-price', fullName: 'Missing price' }
                      },
                      {
                        id: 'not-a-product',
                        type: 'banner',
                        attributes: { id: 'banner-1', fullName: 'Campaign banner', grossPrice: '1.00' }
                      }
                    ]
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

describe('Mathem connector fixture tests', () => {
  it('parses a recorded Next.js fixture and normalizes product rows', () => {
    const products = parseMathemSearchProducts(recordedFixture);
    assert.equal(products.length, 4);

    const rows = products
      .map((product) => normalizeMathemProduct(product, 'https://www.mathem.se/se/search/products/?q=mjolk', '2026-05-24T09:00:00.000Z'))
      .filter((row): row is NonNullable<typeof row> => row !== null);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      code: 'm-1001',
      name: 'Arla Ko Mellanmjölk 1,5% 1l',
      brand: 'Arla Ko',
      packageText: '1l',
      price: 17.9,
      priceText: '17.90 SEK',
      unitPrice: 17.9,
      unitPriceText: '17.90 SEK',
      unitPriceUnit: 'l',
      imageUrl: 'https://images.mathem.se/milk-thumb.jpg',
      productUrl: 'https://www.mathem.se/se/products/1001-arla-ko-mellanmjolk-1l/',
      available: true,
      sourceUrl: 'https://www.mathem.se/se/search/products/?q=mjolk',
      retrievedAt: '2026-05-24T09:00:00.000Z'
    });
    assert.equal(rows[1]?.available, false);
    assert.equal(rows[1]?.unitPriceUnit, 'kg');
  });

  it('fetches through injected HTTP, dedupes codes, and honours maxRows', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchMathemProducts({
      queries: ['mjolk'],
      pages: [1],
      maxRows: 2,
      retrievedAt: '2026-05-24T09:00:00.000Z',
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(recordedFixture, { status: 200, headers: { 'content-type': 'text/html' } });
      }
    });

    assert.deepEqual(requestedUrls, [buildMathemSearchUrl('mjolk', 1)]);
    assert.deepEqual(rows.map((row) => row.code), ['m-1001', 'm-1002']);
  });

  it('fails closed for HTTP errors and malformed fixtures', async () => {
    await assert.rejects(
      () => fetchMathemProducts({ queries: ['mjolk'], pages: [1], fetchImpl: async () => new Response('Forbidden', { status: 403 }) }),
      /Mathem search request failed for mjolk page 1: 403/
    );
    assert.throws(() => parseMathemSearchProducts('<html>No data</html>'), /Mathem search page did not include __NEXT_DATA__/);
  });
});
