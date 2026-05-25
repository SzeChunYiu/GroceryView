import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_KRONAN_IS_SOURCE_URLS,
  fetchKronanIsProducts,
  KRONAN_IS_BASE_URL,
  parseKronanIsProducts
} from '../kronan-is.js';

const RETRIEVED_AT = '2026-05-25T11:15:00.000Z';
const SOURCE_URL = `${KRONAN_IS_BASE_URL}/collections/oll-vara`;

const RECORDED_KRONAN_FIXTURE = `<!doctype html>
<html lang="is">
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "item": {
              "@type": "Product",
              "sku": "100244878",
              "name": "Ódýrt kjúklingabringur",
              "url": "/vara/100244878-odyrt-kjuklingabringur",
              "image": "https://kronan.is/cdn/shop/files/odyrt-kjuklingabringur.jpg",
              "category": "Kjöt og fiskur",
              "offers": {
                "@type": "Offer",
                "price": "2.798",
                "priceCurrency": "ISK",
                "availability": "https://schema.org/InStock"
              }
            }
          },
          {
            "@type": "ListItem",
            "item": {
              "@type": "Product",
              "sku": "100267330",
              "name": "Tokyo Sushi kóreskir kjúklingavængir",
              "url": "https://kronan.is/vara/100267330-tokyo-sushi-koreskir-kjuklingavaengir",
              "image": ["/cdn/shop/files/kjuklingavaengir.jpg"],
              "category": "Tilbúinn matur",
              "offers": {
                "@type": "Offer",
                "price": "1.599 kr.",
                "priceCurrency": "ISK",
                "availability": "https://schema.org/OutOfStock"
              }
            }
          },
          {
            "@type": "ListItem",
            "item": {
              "@type": "Product",
              "sku": "missing-price",
              "name": "Broken row without price",
              "url": "/vara/missing-price"
            }
          }
        ]
      }
    </script>
  </head>
  <body>
    <article data-product-id="100181650" data-category="Kjöt og fiskur">
      <a href="/vara/100181650-matfugl-kjuklingabringur">
        <h3 class="product-card__title">Matfugl kjúklingabringur</h3>
      </a>
      <span class="price">2.999&nbsp;kr.</span>
      <img src="/cdn/shop/files/matfugl-bringur.jpg" />
    </article>
    <article data-product-id="100181650" data-category="Kjöt og fiskur">
      <a href="/vara/100181650-matfugl-kjuklingabringur">
        <h3 class="product-card__title">Duplicate Matfugl kjúklingabringur</h3>
      </a>
      <span class="price">9.999 kr.</span>
    </article>
    <article data-product-id="100000000" data-category="Matvara">
      <a href="/vara/brotin-vara"><h3 class="product-card__title">Brotin vara</h3></a>
    </article>
    <article data-product-id="100999999" data-category="Matvara" class="out-of-stock">
      <a href="/vara/100999999-lagerlaus-vara"><h3 class="product-card__title">Lagerlaus vara</h3></a>
      <span class="price">499 kr.</span>
    </article>
  </body>
</html>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Krónan IS connector fixture parsing', () => {
  it('parses recorded fixture rows into normalized Krónan products', () => {
    const rows = parseKronanIsProducts(RECORDED_KRONAN_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 5);
    assert.deepEqual(rows[0], {
      chain: 'kronan-is',
      code: '100244878',
      name: 'Ódýrt kjúklingabringur',
      price: 2798,
      priceText: '2.798 kr.',
      currency: 'ISK',
      productUrl: 'https://kronan.is/vara/100244878-odyrt-kjuklingabringur',
      imageUrl: 'https://kronan.is/cdn/shop/files/odyrt-kjuklingabringur.jpg',
      category: 'Kjöt og fiskur',
      inStock: true,
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(
      { code: rows[1]?.code, name: rows[1]?.name, price: rows[1]?.price, inStock: rows[1]?.inStock, imageUrl: rows[1]?.imageUrl },
      { code: '100267330', name: 'Tokyo Sushi kóreskir kjúklingavængir', price: 1599, inStock: false, imageUrl: 'https://kronan.is/cdn/shop/files/kjuklingavaengir.jpg' }
    );
    assert.deepEqual(
      { code: rows[2]?.code, name: rows[2]?.name, price: rows[2]?.price, category: rows[2]?.category },
      { code: '100181650', name: 'Matfugl kjúklingabringur', price: 2999, category: 'Kjöt og fiskur' }
    );
  });

  it('mocks HTTP with the fixture, skips malformed rows, de-duplicates codes, and preserves metadata', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchKronanIsProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_KRONAN_FIXTURE);
      },
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(rows.map((row) => row.code), ['100244878', '100267330', '100181650', '100999999']);
    assert.equal(rows.every((row) => row.sourceUrl === SOURCE_URL), true);
    assert.equal(rows.every((row) => row.retrievedAt === RETRIEVED_AT), true);
  });

  it('honours maxRows and the default source URL contract', async () => {
    const rows = await fetchKronanIsProducts({
      fetchImpl: async () => response(RECORDED_KRONAN_FIXTURE),
      maxRows: 2,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(DEFAULT_KRONAN_IS_SOURCE_URLS, [`${KRONAN_IS_BASE_URL}/collections/oll-vara`]);
    assert.deepEqual(rows.map((row) => row.code), ['100244878', '100267330']);
  });

  it('propagates non-OK responses and blocked fixture pages', async () => {
    await assert.rejects(
      fetchKronanIsProducts({ fetchImpl: async () => response('blocked', 503), sourceUrls: [SOURCE_URL] }),
      /Krónan request failed for https:\/\/kronan\.is\/collections\/oll-vara: 503/
    );
    await assert.rejects(
      fetchKronanIsProducts({ fetchImpl: async () => response('Access denied captcha'), sourceUrls: [SOURCE_URL] }),
      /Krónan request blocked/
    );
  });
});
