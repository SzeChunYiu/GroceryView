import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchKronanIsProducts, parseKronanIsProducts } from '../kronan-is.js';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'kronan-is-products.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

const retrievedAt = '2026-05-24T20:15:01.000Z';
const sourceUrl = 'https://www.kronan.is/snjallverslun/voruflokkar';

describe('kronan-is connector', () => {
  it('parses recorded fixture rows into Icelandic price rows and drops invalid products', () => {
    const rows = parseKronanIsProducts({
      products: [
        ...fixture.products,
        { id: 'missing-price', name: 'Invalid row' },
        { id: 'negative', name: 'Bad price', price: -10 }
      ]
    }, sourceUrl, retrievedAt);

    assert.equal(rows.length, fixture.products.length);
    assert.deepEqual(rows[0], {
      id: '100259138',
      sku: '100251658',
      name: 'Grön Balance sólarvörn barna sprey spf30',
      brand: '',
      category: 'Sólarvörur',
      price: 1199,
      currency: 'ISK',
      country: 'IS',
      unitPrice: 7993,
      unitPriceUnit: 'LTR',
      priceInfo: '150 ml. - 7993 kr. / ltr',
      imageUrl: 'https://media.kronan.is/products/84618-thumbnail-255x255-70.jpg',
      productUrl: 'https://www.kronan.is/snjallverslun/vara/100251658-gron-balance-solarvorn-barna-sprey-spf30',
      sourceUrl,
      retrievedAt
    });
  });

  it('fetches through mocked HTTP and reports upstream errors', async () => {
    const okFetch = async () => new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } });
    const rows = await fetchKronanIsProducts({ fetchImpl: okFetch, retrievedAt });
    assert.equal(rows.length, fixture.products.length);

    const htmlFlight = `1:["$","$L",null,{"marketingCollection":{"products":${JSON.stringify(fixture.products.slice(0, 1))}}}]`;
    const htmlFetch = async () => new Response(`<script>self.__next_f=self.__next_f||[]</script><script>self.__next_f.push([1,${JSON.stringify(htmlFlight)}])</script>`, { status: 200, headers: { 'content-type': 'text/html' } });
    const htmlRows = await fetchKronanIsProducts({ fetchImpl: htmlFetch, sourceUrl, retrievedAt });
    assert.equal(htmlRows.length, 1);

    const failingFetch = async () => new Response('{}', { status: 503 });
    await assert.rejects(() => fetchKronanIsProducts({ fetchImpl: failingFetch }), /503/);
  });
});
