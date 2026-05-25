import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEuroprisNoProducts } from '../europris-no.js';

describe('Europris NO connector', () => {
  it('parses NOK variety discount rows from europris.no markup', () => {
    const rows = parseEuroprisNoProducts(`
      <article class="product-card" data-sku="ep-1" data-category="household">
        <a href="/p/rengjoring"><img src="/img/rengjoring.jpg" /></a>
        <h2>Rengjøringsspray</h2><span class="pris">29,90</span>
      </article>
      <article class="produkt tilbud" data-sku="ep-2" data-category="snacks">
        <a href="/p/sjokolade"><h3>Sjokoladepose</h3></a><span class="price">45 kr</span>
      </article>
    `, 'https://www.europris.no/kampanje', '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 2);
    assert.deepEqual({
      country: rows[0]?.country,
      currency: rows[0]?.currency,
      chain: rows[0]?.chain,
      code: rows[0]?.code,
      price: rows[0]?.price,
      category: rows[0]?.category
    }, { country: 'NO', currency: 'NOK', chain: 'europris', code: 'ep-1', price: 29.9, category: 'household' });
    assert.equal(rows[0]?.productUrl, 'https://www.europris.no/p/rengjoring');
  });
});
