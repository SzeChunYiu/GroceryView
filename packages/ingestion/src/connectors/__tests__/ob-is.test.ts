import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchObIsFuelPrices, OB_IS_FUEL_PRICES_URL, parseObIsFuelPricePage } from '../ob-is.js';

const CAPTURED_AT = '2026-05-25T12:00:00.000Z';
const FIXTURE = `<!doctype html><main>
<h1>Eldsneytisverð ÓB</h1>
<table id="gas-prices">
<tr><th>Nafn st&ouml;&eth;var</th><th>Bensín</th><th>D&iacute;sel</th><th>D&iacute;sel lituð</th></tr>
<tr><td>Ketilás</td><td></td><td>266,10</td><td></td></tr>
<tr><td>Akureyri Hlíðarbraut (lægsta verð ÓB, engir afslættir gilda)</td><td>205,50</td><td>246,70</td><td></td></tr>
<tr><td>Selfoss</td><td>231,00</td><td>265,20</td><td>269,20</td></tr>
</table>
</main>`;

describe('OB IS fuel connector', () => {
  it('parses fixture-backed OB station prices with cheapest observed station evidence', () => {
    const rows = parseObIsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      domain: 'fuel',
      productId: 'fuel-95-e10',
      gradeLabel: 'ÓB Bensín',
      pricePerLitre: 205.5,
      unit: 'l',
      currency: 'ISK',
      chainId: 'ob-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'ÓB',
      sourceUrl: OB_IS_FUEL_PRICES_URL,
      observedAt: CAPTURED_AT,
      effectiveFrom: '2026-05-25',
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.productId === 'fuel-diesel')?.pricePerLitre, 246.7);
    assert.equal(rows.some((row) => row.provenance.originalStationName?.includes('Akureyri Hlíðarbraut')), true);
  });

  it('fails closed for non-OB sources, blocked pages, and missing fuel tables', () => {
    assert.throws(
      () => parseObIsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT, sourceUrl: 'https://example.com/fuel' }),
      /ob\.is source URLs/
    );
    assert.throws(
      () => parseObIsFuelPricePage({ body: 'captcha access denied', capturedAt: CAPTURED_AT }),
      /blocked\/login/
    );
    assert.deepEqual(parseObIsFuelPricePage({ body: '<table><tr><td>No prices</td></tr></table>', capturedAt: CAPTURED_AT }), []);
  });

  it('uses crawler headers and rejects blocked HTTP responses', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchObIsFuelPrices({
      capturedAt: CAPTURED_AT,
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('ob-is-connector'), true);
    await assert.rejects(
      () => fetchObIsFuelPrices({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
