import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchN1IsFuelPrices, N1_IS_FUEL_PRICES_URL, parseN1IsFuelPricePage } from '../n1-is.js';

const CAPTURED_AT = '2026-05-25T11:00:00.000Z';
const FIXTURE = `<!doctype html><main>
<h1>Eldsneytisverð N1</h1>
<table>
<tr><th>Stöð</th><th>Bensín 95</th><th>Dísel</th><th>Lituð dísel</th></tr>
<tr><td>Reykjavík</td><td>312,7 kr./l</td><td>315,4 kr./l</td><td>198,0 kr./l</td></tr>
<tr><td>Akureyri</td><td>311,2 kr./l</td><td>314,9 kr./l</td><td>197,5 kr./l</td></tr>
</table>
</main>`;

describe('N1 IS fuel connector', () => {
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
    assert.equal(JSON.stringify(headers[0]).includes('n1-is-connector'), true);
    await assert.rejects(
      () => fetchN1IsFuelPrices({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
