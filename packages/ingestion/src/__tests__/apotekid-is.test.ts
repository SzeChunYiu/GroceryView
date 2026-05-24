import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchApotekidProducts, parseApotekidProducts } from '../connectors/apotekid-is.js';

const fixtureHtml = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [{
    "@type": "Product",
    "name": "D-vítamín Apótekið",
    "sku": "APO-123",
    "brand": { "name": "Apótekið" },
    "category": "Vítamín og bætiefni",
    "image": "/media/d-vitamin.jpg",
    "offers": { "price": "1.990 kr.", "priceCurrency": "ISK", "availability": "https://schema.org/InStock", "url": "/vara/d-vitamin" }
  }]
}
</script>`;

describe('Apótekið Iceland connector', () => {
  it('normalizes ISK product JSON-LD into pharmacy rows', () => {
    const rows = parseApotekidProducts(fixtureHtml, 'https://www.apotekid.is/search?query=vitamin', '2026-05-24T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.chain, 'apotekid-is');
    assert.equal(rows[0]?.code, 'APO-123');
    assert.equal(rows[0]?.price, 1990);
    assert.equal(rows[0]?.priceText, '1990 ISK');
    assert.equal(rows[0]?.category, 'supplement');
    assert.equal(rows[0]?.productUrl, 'https://www.apotekid.is/vara/d-vitamin');
  });

  it('fetches configured Apótekið source URLs with the provided fetch implementation', async () => {
    const rows = await fetchApotekidProducts({
      fetchImpl: async () => new Response(fixtureHtml, { status: 200 }),
      retrievedAt: '2026-05-24T00:00:00.000Z',
      sourceUrls: ['https://www.apotekid.is/search?query=vitamin']
    });

    assert.equal(rows[0]?.name, 'D-vítamín Apótekið');
  });
});
