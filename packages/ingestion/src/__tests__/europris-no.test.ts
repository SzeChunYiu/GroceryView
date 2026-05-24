import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEuroprisNoProducts } from '../connectors/europris-no.js';

test('parses Europris NO JSON-LD rows as NOK variety products', () => {
  const html = `<script type="application/ld+json">{
    "@type":"Product",
    "sku":"ep-1",
    "name":"Shampoo 250 ml",
    "brand":{"name":"Neutral"},
    "image":"/img/shampoo.png",
    "url":"/p/shampoo",
    "offers":{"price":29.9,"priceCurrency":"NOK"}
  }</script>`;
  const rows = parseEuroprisNoProducts(html, 'https://www.europris.no/search?text=shampoo', '2026-05-24T00:00:00.000Z');

  assert.equal(rows.length, 1);
  assert.deepEqual({ chain: rows[0].chain, country: rows[0].country, currency: rows[0].currency, category: rows[0].category }, {
    chain: 'europris',
    country: 'NO',
    currency: 'NOK',
    category: 'personal_care'
  });
});
