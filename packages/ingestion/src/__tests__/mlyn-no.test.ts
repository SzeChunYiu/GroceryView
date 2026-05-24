import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMlynNoProducts, parseMlynNoProducts } from '../connectors/mlyn-no.js';

const productFixture = `
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"Product","name":"Pierogi ruskie","sku":"MLYN-PIEROGI","brand":{"name":"Mlyn"},"image":"/pierogi.jpg","offers":{"price":"59,90 kr","priceCurrency":"NOK","url":"/products/pierogi-ruskie"}}]}
</script>`;

describe('Mlyn Norway connector', () => {
  it('normalizes Eastern European grocery products for one Mlyn location', () => {
    const rows = parseMlynNoProducts(productFixture, { id: 'mlyn-oslo', name: 'Mlyn Oslo', url: 'https://mlyn.no/oslo' }, '2026-05-24T00:00:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.chain, 'mlyn-no');
    assert.equal(rows[0]?.country, 'NO');
    assert.equal(rows[0]?.category, 'ethnic_polish_eastern_european');
    assert.equal(rows[0]?.price, 59.9);
    assert.equal(rows[0]?.productUrl, 'https://mlyn.no/products/pierogi-ruskie');
  });

  it('keeps the same SKU separate across multiple configured locations', async () => {
    const rows = await fetchMlynNoProducts({
      fetchImpl: async () => new Response(productFixture, { status: 200 }),
      retrievedAt: '2026-05-24T00:00:00.000Z',
      stores: [
        { id: 'mlyn-oslo', name: 'Mlyn Oslo', url: 'https://mlyn.no/oslo' },
        { id: 'mlyn-nettbutikk', name: 'Mlyn nettbutikk', url: 'https://mlyn.no/collections/all' }
      ]
    });

    assert.deepEqual(rows.map((row) => row.storeId), ['mlyn-oslo', 'mlyn-nettbutikk']);
  });
});
