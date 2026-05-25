import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchSkeljungurIsFuelPrices,
  parseSkeljungurIsFuelPriceData,
  SKELJUNGUR_IS_FUEL_PRICES_API_URL
} from '../skeljungur-is.js';

const CAPTURED_AT = '2026-05-25T15:05:21.000Z';
const FIXTURE = {
  executiontime: '2026-05-25 15:05:21',
  items: [
    { ItemName: 'Bensín 95 okt', Price: '231.30' },
    { ItemName: 'Bensín 98 okt', Price: '271.20' },
    { ItemName: 'Gasolía-Diesel', Price: '266.80' },
    { ItemName: 'Lífdiesel', Price: '348.23' },
    { ItemName: 'Skipagasolía', Price: '226.90' },
    { ItemName: 'JET A-1', Price: '321.53' }
  ]
};

describe('Skeljungur IS fuel connector', () => {
  it('parses fixture-backed consumer fuel rows from the public price list API', () => {
    const rows = parseSkeljungurIsFuelPriceData({
      body: FIXTURE,
      capturedAt: CAPTURED_AT,
      effectiveDate: '2026-05-25'
    });

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      domain: 'fuel',
      productId: 'fuel-95-e10',
      gradeLabel: 'Skeljungur Bensín 95 okt',
      pricePerLitre: 231.3,
      unit: 'l',
      currency: 'ISK',
      chainId: 'skeljungur-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'Skeljungur',
      sourceUrl: SKELJUNGUR_IS_FUEL_PRICES_API_URL,
      observedAt: CAPTURED_AT,
      effectiveFrom: '2026-05-25',
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.productId === 'fuel-98')?.pricePerLitre, 271.2);
    assert.equal(rows.find((row) => row.productId === 'fuel-diesel')?.pricePerLitre, 266.8);
    assert.equal(rows.some((row) => row.provenance.originalItemName === 'Skipagasolía'), false);
    assert.equal(rows.some((row) => row.provenance.originalItemName === 'JET A-1'), false);
    assert.equal(rows[0]?.provenance.sourceExecutionTime, '2026-05-25 15:05:21');
  });

  it('fails closed for non-Skeljungur sources and API errors', () => {
    assert.throws(
      () =>
        parseSkeljungurIsFuelPriceData({
          body: FIXTURE,
          capturedAt: CAPTURED_AT,
          sourceUrl: 'https://example.com/api/pricelistdata'
        }),
      /skeljungur\.is source URLs/
    );
    assert.throws(
      () => parseSkeljungurIsFuelPriceData({ body: { error: 'Date parameter is required' }, capturedAt: CAPTURED_AT }),
      /Date parameter is required/
    );
    assert.deepEqual(parseSkeljungurIsFuelPriceData({ body: { items: [] }, capturedAt: CAPTURED_AT }), []);
  });

  it('requests JSON with an ISO date and rejects blocked HTTP responses', async () => {
    const requestedUrls: string[] = [];
    const headers: HeadersInit[] = [];
    const rows = await fetchSkeljungurIsFuelPrices({
      capturedAt: CAPTURED_AT,
      effectiveDate: '2026-05-25',
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        headers.push(init?.headers ?? {});
        return new Response(JSON.stringify(FIXTURE), { status: 200 });
      }
    });

    assert.equal(rows.length, 3);
    assert.equal(requestedUrls[0], `${SKELJUNGUR_IS_FUEL_PRICES_API_URL}?date=2026-05-25`);
    assert.equal(JSON.stringify(headers[0]).includes('skeljungur-is-connector'), true);
    await assert.rejects(
      () => fetchSkeljungurIsFuelPrices({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
