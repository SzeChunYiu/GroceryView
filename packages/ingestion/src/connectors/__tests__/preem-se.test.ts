import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchPreemSeBusinessFuelPrices,
  parsePreemSeBusinessFuelPricePage,
  PREEM_SE_BUSINESS_LIST_PRICE_URL
} from '../preem-se.js';

const preemFixture = `
  <main>
    <h1>Drivmedelspriser för företagskunder</h1>
    <section>
      <h2>Listpriser Företagskort och Transportkort</h2>
      <p>Listpriser gällande från 23 maj 2026</p>
      <table>
        <tr><td>Diesel</td><td>21,34 kr</td></tr>
        <tr><td>HVO100</td><td>29,89 kr</td></tr>
        <tr><td>Bensin 95</td><td>18,89 kr</td></tr>
        <tr><td>Bensin 98</td><td>20,19 kr</td></tr>
        <tr><td>E85</td><td>15,84 kr</td></tr>
      </table>
    </section>
    <section><h2>Listpriser Truckkort</h2><p>Diesel 21,07 kr</p></section>
  </main>`;

describe('Preem SE fuel connector', () => {
  it('parses recorded business-card fixture rows with source-backed provenance', () => {
    const rows = parsePreemSeBusinessFuelPricePage({
      html: preemFixture,
      capturedAt: '2026-05-24T10:15:00.000Z',
      rawSnapshotRef: 'raw://preem-se/fixture'
    });

    assert.deepEqual(rows.map((row) => [row.fuelGrade, row.pricePerLitre, row.currency, row.unit]), [
      ['diesel', 21.34, 'SEK', 'l'],
      ['hvo100', 29.89, 'SEK', 'l'],
      ['95', 18.89, 'SEK', 'l'],
      ['98', 20.19, 'SEK', 'l'],
      ['e85', 15.84, 'SEK', 'l']
    ]);
    assert.equal(rows[0].domain, 'fuel');
    assert.equal(rows[0].chainId, 'preem');
    assert.equal(rows[0].customerSegment, 'business_card');
    assert.equal(rows[0].sourceKind, 'operator_business_list_price_page');
    assert.equal(rows[0].observedAt, '2026-05-22T22:01:00.000Z');
    assert.equal(rows[0].provenance.originalPriceText, '21,34 kr');
    assert.equal(rows[0].provenance.originalValidFromText, '23 maj 2026');
  });

  it('fails closed when required price or date evidence is missing', () => {
    assert.throws(
      () => parsePreemSeBusinessFuelPricePage({
        html: preemFixture.replace('<tr><td>Bensin 98</td><td>20,19 kr</td></tr>', ''),
        capturedAt: '2026-05-24T10:15:00.000Z'
      }),
      /missing for Bensin 98/
    );
    assert.throws(
      () => parsePreemSeBusinessFuelPricePage({ html: '<main>No list date</main>', capturedAt: '2026-05-24T10:15:00.000Z' }),
      /valid-from date missing/
    );
  });

  it('fetches with mocked HTTP and rejects blocked responses', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchPreemSeBusinessFuelPrices({
      capturedAt: '2026-05-24T10:15:00.000Z',
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(preemFixture, { status: 200, headers: { 'content-type': 'text/html' } });
      }
    });

    assert.deepEqual(requestedUrls, [PREEM_SE_BUSINESS_LIST_PRICE_URL]);
    assert.equal(rows.length, 5);
    assert.equal(rows.find((row) => row.fuelGrade === '95')?.pricePerLitre, 18.89);

    await assert.rejects(
      () => fetchPreemSeBusinessFuelPrices({ fetchImpl: async () => new Response('Forbidden', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
