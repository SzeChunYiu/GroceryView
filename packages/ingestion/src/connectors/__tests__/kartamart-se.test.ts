import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseKartaMartSeProducts } from '../kartamart-se.js';

describe('Karta Mart SE connector', () => {
  it('parses Asian grocery Shopify fixture rows with overlap category whitelist', () => {
    const rows = parseKartaMartSeProducts({ products: [{
      id: 1,
      handle: 'jasmine-rice',
      title: 'Jasmine Rice 5kg',
      vendor: 'Karta Mart',
      product_type: 'rice',
      tags: ['asian pantry'],
      variants: [{ id: 11, sku: 'KM-RICE-5KG', price: '129.00', available: true }]
    }] }, 'fixture', '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0].country, 'SE');
    assert.equal(rows[0].currency, 'SEK');
    assert.equal(rows[0].chain, 'kartamart');
    assert.equal(rows[0].retailer_type, 'ethnic_asian');
    assert.equal(rows[0].category, 'rice');
    assert.equal(rows[0].price, 129);
  });
});
