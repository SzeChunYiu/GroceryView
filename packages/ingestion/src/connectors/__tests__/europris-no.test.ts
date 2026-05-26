import { describe, expect, it } from 'vitest';
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

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ country: 'NO', currency: 'NOK', chain: 'europris', code: 'ep-1', price: 29.9, category: 'household' });
    expect(rows[0]?.productUrl).toBe('https://www.europris.no/p/rengjoring');
  });
});
