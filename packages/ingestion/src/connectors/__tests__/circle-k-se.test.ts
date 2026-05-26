import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL,
  CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL,
  fetchCircleKSeFuelPrices,
  parseCircleKSeFuelPrices
} from '../circle-k-se.js';

const OBSERVED_AT = '2026-05-25T10:00:00.000Z';

const BUSINESS_FIXTURE = `<!doctype html><main>
<h1>Drivmedelspriser</h1>
<h3>Aktuella listpriser företagskund</h3>
<table>
<tr><th>Produkt</th><th>Produktnamn</th><th>Pris</th><th>Ändringsdatum</th><th>Enhet</th><th>Ändring</th></tr>
<tr><td>Image: Miles 95</td><td>Produktnamn: miles 95</td><td>Pris: 18,89</td><td>Ändringsdatum: 2026-05-22</td><td>Enhet: kr/l</td><td>Ändring: -0,40</td></tr>
<tr><td>Image: Miles 98</td><td>Produktnamn: miles 98</td><td>Pris: 20,19</td><td>Ändringsdatum: 2026-05-22</td><td>Enhet: kr/l</td><td>Ändring: -0,40</td></tr>
<tr><td>Image: Diesel</td><td>Produktnamn: miles diesel</td><td>Pris: 21,34</td><td>Ändringsdatum: 2026-05-21</td><td>Enhet: kr/l</td><td>Ändring: -0,40</td></tr>
<tr><td>Image: HVO 100</td><td>Produktnamn: HVO100</td><td>Pris: 29,89</td><td>Ändringsdatum: 2026-05-21</td><td>Enhet: kr/l</td><td>Ändring: -0,40</td></tr>
<tr><td>Image: CNG</td><td>Produktnamn: Fordonsgas</td><td>Pris: 30,19</td><td>Ändringsdatum: 2026-03-11</td><td>Enhet: kr/kg</td><td>Ändring: +0,51</td></tr>
<tr><td>Image: Ethanol E85</td><td>Produktnamn: E85</td><td>Pris: 15,84</td><td>Ändringsdatum: 2026-05-22</td><td>Enhet: kr/l</td><td>Ändring: -0,50</td></tr>
</table>
<p>För drivmedel som betalas med företagskort gäller vårt listpris för företag.</p>
</main>`;

const TRUCK_FIXTURE = `<!doctype html><main>
<h1>Drivmedelspriser</h1>
<h3>Aktuella priser truck</h3>
<table>
<tr><td>Image: Diesel</td><td>Produktnamn: miles diesel</td><td>Pris: 21,07</td><td>Ändringsdatum: 2026-05-18</td><td>Enhet: kr/l</td></tr>
<tr><td>Image: HVO 100</td><td>Produktnamn: HVO100**</td><td>Pris: 29,42</td><td>Ändringsdatum: 2026-05-18</td><td>Enhet: kr/l</td></tr>
<tr><td>Image: B100</td><td>Produktnamn: B100</td><td>Pris: 19,73</td><td>Ändringsdatum: 2026-05-11</td><td>Enhet: kr/l</td></tr>
<tr><td>Image: Ad Blue</td><td>Produktnamn: AdBlue</td><td>Pris: 9,89</td><td>Ändringsdatum: 2026-05-11</td><td>Enhet: kr/l</td></tr>
</table>
<p>Ovanstående priser är veckopriser och gäller måndag - söndag. Priserna är inkl. moms.</p>
</main>`;

describe('Circle K SE fuel connector', () => {
  it('parses the business fuel price fixture with row shape, units, dates, and provenance', () => {
    const rows = parseCircleKSeFuelPrices({ html: BUSINESS_FIXTURE, observedAt: OBSERVED_AT });

    assert.equal(rows.length, 6);
    assert.deepEqual(rows[0], {
      id: 'circle-k-se-business_card-miles-95-2026-05-22',
      domain: 'fuel',
      chainId: 'circle-k-se',
      operatorName: 'Circle K Sverige',
      customerSegment: 'business',
      listPriceKind: 'business_card',
      productName: 'miles 95',
      fuelGrade: '95',
      price: 18.89,
      currency: 'SEK',
      unit: 'l',
      includesVat: true,
      effectiveFrom: '2026-05-22',
      observedAt: OBSERVED_AT,
      sourceUrl: CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.productName === 'Fordonsgas')?.unit, 'kg');
    assert.equal(rows.find((row) => row.productName === 'Fordonsgas')?.fuelGrade, 'cng');
    assert.equal(rows[0]?.provenance.originalChangeText, '-0,40');
  });

  it('parses truck-card rows and normalizes footnoted product names', () => {
    const rows = parseCircleKSeFuelPrices({
      html: TRUCK_FIXTURE,
      observedAt: OBSERVED_AT,
      sourceUrl: CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL
    });

    assert.equal(rows.length, 4);
    assert.equal(rows[0]?.listPriceKind, 'truck_card');
    assert.equal(rows.find((row) => row.productName === 'HVO100')?.price, 29.42);
    assert.equal(rows.find((row) => row.productName === 'AdBlue')?.fuelGrade, 'adblue');
  });

  it('fails closed for non-price pages, blocked pages, and empty fixtures', () => {
    assert.throws(
      () => parseCircleKSeFuelPrices({ html: BUSINESS_FIXTURE, observedAt: OBSERVED_AT, sourceUrl: 'https://www.circlek.se/drivmedel' }),
      /business fuel price pages/
    );
    assert.throws(
      () => parseCircleKSeFuelPrices({ html: 'Access denied captcha', observedAt: OBSERVED_AT }),
      /blocked\/login/
    );
    assert.throws(
      () => parseCircleKSeFuelPrices({ html: '<h3>Aktuella listpriser företagskund</h3><p>Produktnamn: miles 95 Pris: saknas</p>', observedAt: OBSERVED_AT }),
      /No Circle K SE fuel prices parsed/
    );
  });

  it('uses crawler headers and fails closed on blocked HTTP responses', async () => {
    const requested: Array<{ input: RequestInfo | URL; headers: HeadersInit | undefined }> = [];
    const rows = await fetchCircleKSeFuelPrices({
      observedAt: OBSERVED_AT,
      sourceUrls: [CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL, CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL],
      fetchImpl: async (input, init) => {
        requested.push({ input, headers: init?.headers });
        return new Response(input.toString().includes('/truck/') ? TRUCK_FIXTURE : BUSINESS_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 10);
    assert.equal(requested.length, 2);
    assert.equal(JSON.stringify(requested[0]?.headers).includes('circle-k-se-fuel-connector'), true);
    await assert.rejects(
      () => fetchCircleKSeFuelPrices({ sourceUrls: [CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL], fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
