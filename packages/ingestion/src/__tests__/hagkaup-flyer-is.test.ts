import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHagkaupFlyerOffers } from '../connectors/hagkaup-flyer-is.js';

describe('Hagkaup Iceland flyer connector', () => {
  it('normalizes premium-format ISK flyer pricing from structured product data', () => {
    const rows = parseHagkaupFlyerOffers(
      `<script type="application/ld+json">{
        "@context":"https://schema.org",
        "@type":"ItemList",
        "itemListElement":[{
          "@type":"Product",
          "sku":"hagkaup-001",
          "name":"Premium kaffi 500 g",
          "brand":"Hagkaup",
          "category":"Tilboð",
          "image":"https://www.hagkaup.is/kaffi.jpg",
          "offers":{"@type":"Offer","price":"1.299 kr.","priceCurrency":"ISK","priceValidUntil":"2026-05-31"}
        }]
      }</script>`,
      { retrievedAt: '2026-05-24T00:00:00.000Z', sourceUrl: 'https://www.hagkaup.is/tilbod' }
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.code, 'hagkaup-001');
    assert.equal(rows[0]?.country, 'IS');
    assert.equal(rows[0]?.currency, 'ISK');
    assert.equal(rows[0]?.price, 1299);
    assert.equal(rows[0]?.priceText, '1.299 kr.');
    assert.equal(rows[0]?.pricingFormat, 'premium_flyer');
    assert.equal(rows[0]?.validTo, '2026-05-31');
  });
});
