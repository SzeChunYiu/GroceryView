import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchMacSeProducts,
  normalizeMacSeCandidate,
  parseMacSeProducts,
  type MacSeProduct
} from '../mac-se.js';

const RETRIEVED_AT = '2026-05-25T09:15:00.000Z';
const SOURCE_URL = 'https://www.maccosmetics.se/products/13854/Products/Makeup/Lips/Lipstick';

const RECORDED_MAC_SE_FIXTURE = `<!doctype html>
<html lang="sv-SE">
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "M·A·C Lipstick Matte Ruby Woo",
        "sku": "S2KP01",
        "brand": { "@type": "Brand", "name": "MAC" },
        "image": ["https://sdcdn.io/mac/se/mac_sku_S2KP01_1x1_0.png"],
        "url": "/product/13854/310/products/makeup/lips/lipstick/mac-lipstick",
        "offers": {
          "@type": "Offer",
          "price": "270,00",
          "priceCurrency": "SEK",
          "availability": "https://schema.org/InStock"
        }
      }
    </script>
    <script>
      window.__MAC_PRODUCTS__ = {
        "products": [
          {
            "productId": "S2KP01",
            "productName": "M·A·C Lipstick Matte Ruby Woo",
            "price": { "amount": "270,00", "currency": "SEK" },
            "productUrl": "/product/13854/310/products/makeup/lips/lipstick/mac-lipstick"
          },
          {
            "productId": "S77Y01",
            "displayName": "Studio Fix Fluid SPF 15",
            "brandName": "MAC",
            "currentPrice": { "value": 455, "currency": "SEK" },
            "formattedPrice": "455 kr",
            "imageUrl": "/media/studio-fix.png",
            "stockStatus": "OutOfStock",
            "productUrl": "/product/13847/123/products/makeup/face/foundation/studio-fix-fluid-spf-15"
          },
          {
            "productId": "EUR01",
            "displayName": "Wrong currency row",
            "currentPrice": { "value": 20, "currency": "EUR" }
          },
          {
            "productId": "NOPRICE",
            "displayName": "Missing price row"
          }
        ]
      };
    </script>
  </head>
  <body>
    <article class="product-brief" data-product-id="SX8W01" data-product-name="Stack Mascara" data-currency="SEK" data-image-url="/media/stack.png">
      <a href="/product/13842/888/products/makeup/eyes/mascara/stack-mascara">Stack Mascara</a>
      <span class="product-brief__price">350 kr</span>
      <span>Slut i lager</span>
    </article>
  </body>
</html>`;

function response(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

describe('MAC Cosmetics Sweden connector fixture parsing', () => {
  it('parses recorded HTML fixtures into normalized beauty product rows', () => {
    const rows = parseMacSeProducts(RECORDED_MAC_SE_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'mac-se',
      code: 'S2KP01',
      name: 'M·A·C Lipstick Matte Ruby Woo',
      brand: 'MAC',
      category: 'beauty',
      price: 270,
      priceText: '270 kr',
      productUrl: 'https://www.maccosmetics.se/product/13854/310/products/makeup/lips/lipstick/mac-lipstick',
      imageUrl: 'https://sdcdn.io/mac/se/mac_sku_S2KP01_1x1_0.png',
      stockStatus: 'instock',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(
      rows.map((row) => ({ code: row.code, name: row.name, price: row.price, stock: row.stockStatus })),
      [
        { code: 'S2KP01', name: 'M·A·C Lipstick Matte Ruby Woo', price: 270, stock: 'instock' },
        { code: 'S77Y01', name: 'Studio Fix Fluid SPF 15', price: 455, stock: 'outofstock' },
        { code: 'SX8W01', name: 'Stack Mascara', price: 350, stock: 'out_of_stock' }
      ]
    );
  });

  it('normalizes candidate edge cases and filters unsafe rows', () => {
    assert.deepEqual(
      normalizeMacSeCandidate(
        {
          '@type': 'Product',
          name: 'Eye Shadow Pro Palette Refill',
          sku: 'ESPP01',
          offers: { price: '185,50', priceCurrency: 'SEK', availability: 'https://schema.org/InStock' },
          image: { url: '/media/eye-shadow.png' },
          url: '/product/13849/999/products/makeup/eyes/eyeshadow/pro-palette-refill'
        },
        SOURCE_URL,
        RETRIEVED_AT
      )?.price,
      185.5
    );
    assert.equal(
      normalizeMacSeCandidate({ '@type': 'Product', name: 'Euro product', offers: { price: 12, priceCurrency: 'EUR' } }, SOURCE_URL, RETRIEVED_AT),
      null
    );
    assert.equal(normalizeMacSeCandidate({ '@type': 'Product', name: 'Missing price' }, SOURCE_URL, RETRIEVED_AT), null);
    assert.equal(normalizeMacSeCandidate({ name: 'Not enough product metadata', price: 10 }, SOURCE_URL, RETRIEVED_AT), null);
  });

  it('mocks HTTP with fixture data, passes crawler headers, de-duplicates, and honors maxRows', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchMacSeProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_MAC_SE_FIXTURE);
      },
      sourceUrls: [SOURCE_URL, 'https://www.maccosmetics.se/products/13842/Products/Makeup/Eyes/Mascara'],
      maxRows: 2,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(
      rows.map((row) => row.code),
      ['S2KP01', 'S77Y01']
    );
    assert.equal(rows.every((row: MacSeProduct) => row.country === 'SE' && row.currency === 'SEK' && row.chain === 'mac-se'), true);
    assert.equal(rows.every((row) => row.retrievedAt === RETRIEVED_AT), true);
  });

  it('fails closed for HTTP errors, blocked pages, and malformed fixture pages', async () => {
    await assert.rejects(
      () =>
        fetchMacSeProducts({
          fetchImpl: async () => response('Forbidden', 403),
          sourceUrls: [SOURCE_URL],
          retrievedAt: RETRIEVED_AT
        }),
      /MAC SE request failed for https:\/\/www\.maccosmetics\.se\/products\/13854\/Products\/Makeup\/Lips\/Lipstick: 403/
    );

    assert.deepEqual(parseMacSeProducts('<html><body>No JSON product data</body></html>', SOURCE_URL, RETRIEVED_AT), []);
    assert.deepEqual(parseMacSeProducts('<html><body>Access Denied captcha</body></html>', SOURCE_URL, RETRIEVED_AT), []);
  });
});
