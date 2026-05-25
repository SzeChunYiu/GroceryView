import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchN1IsConvenienceProducts,
  fetchN1IsFuelPrices,
  fetchN1IsProducts,
  N1_IS_ALGOLIA_APP_ID,
  N1_IS_ALGOLIA_PRODUCTS_INDEX,
  N1_IS_ALGOLIA_PRODUCTS_QUERY_URL,
  N1_IS_FUEL_PRICES_URL,
  N1_IS_WEBSTORE_URL,
  parseN1IsConvenienceProducts,
  parseN1IsFuelPricePage
} from '../n1-is.js';

const CAPTURED_AT = '2026-05-25T11:00:00.000Z';
const FIXTURE = `<!doctype html><main>
<h1>Eldsneytisverð N1</h1>
<table>
<tr><th>Stöð</th><th>Bensín 95</th><th>Dísel</th><th>Lituð dísel</th></tr>
<tr><td>Reykjavík</td><td>312,7 kr./l</td><td>315,4 kr./l</td><td>198,0 kr./l</td></tr>
<tr><td>Akureyri</td><td>311,2 kr./l</td><td>314,9 kr./l</td><td>197,5 kr./l</td></tr>
</table>
</main>`;

const NEXT_FUEL_FIXTURE = `<script>self.__next_f.push([1,"{\\"items\\":[{\\"title\\":\\"Bensín 95 okt\\",\\"shortTitle\\":\\"95\\",\\"price\\":207.9},{\\"title\\":\\"Dísel\\",\\"shortTitle\\":\\"D\\",\\"price\\":246.9}],\\"header\\":{\\"title\\":\\"Lægsta verð í gangi\\"}}"])</script>`;

const ALGOLIA_FIXTURE = {
  hits: [
    {
      objectID: '996',
      sku: 'A584 83629960',
      name: 'Tesa límband 15mm x 33m glært',
      description: 'Límband innpakkað glært',
      categories: ['Rekstrarvörur', 'Rekstrarvörur > Límbönd'],
      hierarchical_categories: {
        lvl0: 'Rekstrarvörur',
        lvl1: 'Rekstrarvörur > Límbönd'
      },
      variants: [{ sku: 'a584-83629960-1' }],
      attributes: {
        units: { unit: 'stk' }
      },
      media: [{ product_list: 'https://cdn.n1.is/tesa.jpg' }],
      price: 175,
      stock_level: 'in stock',
      stock_level_stores: 'in stock'
    },
    {
      objectID: '997',
      sku: 'NO_PRICE',
      name: 'No price',
      categories: ['Rekstrarvörur']
    }
  ]
};

describe('N1 IS connector', () => {
  it('parses fixture-backed unleaded and diesel rows with cheapest observed station evidence', () => {
    const rows = parseN1IsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      domain: 'fuel',
      productId: 'fuel-95-e10',
      gradeLabel: 'N1 Bensín',
      pricePerLitre: 311.2,
      unit: 'l',
      currency: 'ISK',
      chainId: 'n1-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'N1',
      sourceUrl: N1_IS_FUEL_PRICES_URL,
      observedAt: CAPTURED_AT,
      effectiveFrom: '2026-05-25',
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.productId === 'fuel-diesel')?.pricePerLitre, 314.9);
    assert.equal(rows.some((row) => row.provenance.originalStationName === 'Akureyri'), true);
  });

  it('fails closed for non-N1 sources, blocked pages, and missing fuel tables', () => {
    assert.throws(
      () => parseN1IsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT, sourceUrl: 'https://example.com/fuel' }),
      /n1\.is source URLs/
    );
    assert.throws(
      () => parseN1IsFuelPricePage({ body: 'captcha access denied', capturedAt: CAPTURED_AT }),
      /blocked\/login/
    );
    assert.deepEqual(parseN1IsFuelPricePage({ body: '<table><tr><td>No prices</td></tr></table>', capturedAt: CAPTURED_AT }), []);
  });

  it('parses current Next.js fuel price cards when no table is rendered', () => {
    const rows = parseN1IsFuelPricePage({ body: NEXT_FUEL_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 2);
    assert.equal(rows.find((row) => row.productId === 'fuel-95-e10')?.pricePerLitre, 207.9);
    assert.equal(rows.find((row) => row.productId === 'fuel-diesel')?.pricePerLitre, 246.9);
    assert.equal(rows[0]?.provenance.originalStationName, 'Lægsta verð í gangi');
  });

  it('uses crawler headers and rejects blocked HTTP responses', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchN1IsFuelPrices({
      capturedAt: CAPTURED_AT,
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('Chrome/125'), true);
    await assert.rejects(
      () => fetchN1IsFuelPrices({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('parses Algolia convenience SKU rows with category and stock evidence', () => {
    const rows = parseN1IsConvenienceProducts({
      body: ALGOLIA_FIXTURE,
      retrievedAt: CAPTURED_AT,
      sourceUrl: N1_IS_ALGOLIA_PRODUCTS_QUERY_URL
    });

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      domain: 'convenience',
      chainId: 'n1-is',
      productId: 'n1-is-a584-83629960-1',
      sku: 'A584 83629960',
      variantSku: 'a584-83629960-1',
      name: 'Tesa límband 15mm x 33m glært',
      description: 'Límband innpakkað glært',
      categoryPath: ['Rekstrarvörur', 'Límbönd'],
      categorySlug: 'limbond',
      price: 175,
      priceText: '175 kr.',
      currency: 'ISK',
      unit: 'stk',
      imageUrl: 'https://cdn.n1.is/tesa.jpg',
      productUrl: `${N1_IS_WEBSTORE_URL}?${encodeURIComponent(`${N1_IS_ALGOLIA_PRODUCTS_INDEX}[query]`)}=A584+83629960`,
      inStock: true,
      sourceUrl: N1_IS_ALGOLIA_PRODUCTS_QUERY_URL,
      retrievedAt: CAPTURED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[0]?.provenance.objectID, '996');
    assert.equal(rows[0]?.provenance.indexName, N1_IS_ALGOLIA_PRODUCTS_INDEX);
  });

  it('uses Algolia search credentials and rejects blocked convenience responses', async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const rows = await fetchN1IsConvenienceProducts({
      maxRows: 2,
      retrievedAt: CAPTURED_AT,
      fetchImpl: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify(ALGOLIA_FIXTURE), { status: 200 });
      }
    });

    assert.equal(rows.length, 1);
    assert.equal(requests[0]?.input, N1_IS_ALGOLIA_PRODUCTS_QUERY_URL);
    assert.equal(requests[0]?.init?.method, 'POST');
    assert.equal(JSON.stringify(requests[0]?.init?.headers).includes(N1_IS_ALGOLIA_APP_ID), true);
    assert.equal(String(requests[0]?.init?.body).includes('hitsPerPage=2'), true);
    await assert.rejects(
      () => fetchN1IsConvenienceProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('combines fuel and convenience observations for the N1 chain', async () => {
    const rows = await fetchN1IsProducts({
      capturedAt: CAPTURED_AT,
      maxConvenienceRows: 2,
      fetchImpl: async (input) => {
        if (String(input).includes('algolia.net')) return new Response(JSON.stringify(ALGOLIA_FIXTURE), { status: 200 });
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 3);
    assert.equal(rows.filter((row) => row.domain === 'fuel').length, 2);
    assert.equal(rows.filter((row) => row.domain === 'convenience').length, 1);
  });
});
