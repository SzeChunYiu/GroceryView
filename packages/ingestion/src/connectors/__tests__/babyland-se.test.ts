import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BABYLAND_SE_SOURCE_URL,
  fetchBabylandSeProducts,
  parseBabylandSeProducts
} from '../babyland-se.js';

const RETRIEVED_AT = '2026-05-25T13:05:00.000Z';
const HTML = `
<script type="application/ld+json">
{
  "@graph": [{
    "@type": "Product",
    "sku": "BL-NAN-1",
    "name": "NAN Pro 1 Modersmjölksersättning",
    "category": "Baby food",
    "image": ["https://www.babyland.se/images/nan.jpg"],
    "url": "/nan-pro-1",
    "offers": { "price": "129,90", "priceCurrency": "SEK", "availability": "https://schema.org/InStock" }
  }, {
    "@type": "Product",
    "mpn": "DIAPER-4",
    "name": "Pampers blöjor storlek 4",
    "offers": { "price": "99 kr", "availability": "https://schema.org/OutOfStock", "url": "/pampers-4" }
  }]
}
</script>`;

describe('Babyland SE connector', () => {
  it('parses Babyland JSON-LD grocery-adjacent baby products', () => {
    const rows = parseBabylandSeProducts(HTML, BABYLAND_SE_SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'babyland-se',
      retailerType: 'specialty_baby',
      code: 'BL-NAN-1',
      name: 'NAN Pro 1 Modersmjölksersättning',
      category: 'formula',
      price: 129.9,
      priceText: '129.90 SEK',
      available: true,
      productUrl: 'https://www.babyland.se/nan-pro-1',
      imageUrl: 'https://www.babyland.se/images/nan.jpg',
      sourceUrl: BABYLAND_SE_SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1].category, 'diapers');
    assert.equal(rows[1].available, false);
  });

  it('fetches with headers, maxRows, and blocked-source handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchBabylandSeProducts({
      fetchImpl: async (_url, init) => {
        headers.push(init?.headers ?? {});
        return new Response(HTML);
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('babyland-se-connector'), true);
    await assert.rejects(
      () => fetchBabylandSeProducts({ fetchImpl: async () => new Response('blocked', { status: 429 }) }),
      /blocked with HTTP 429/
    );
  });
});
