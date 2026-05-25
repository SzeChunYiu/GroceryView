import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL,
  CIRCLE_K_SE_CONSUMER_FUEL_PRICES_URL,
  CIRCLE_K_SE_EXTRA_URL,
  CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL,
  fetchCircleKSeFuelPrices,
  fetchCircleKSePricingQuirks,
  parseCircleKSeFuelPrices,
  parseCircleKSePricingQuirks
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
<p>Som Circle K Pro-kund tankar du till vårt aktuella listpris minus rabatt, oavsett var du befinner dig.</p>
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

const CONSUMER_FUEL_FIXTURE = `<!doctype html><main>
<h1>Drivmedelspriser</h1>
<p>Circle K har frivilligt valt att ta bort priserna på hemsidan.</p>
<p>Aktuellt pris kan ni se på er lokala stations prisstolpe.</p>
<h2>Varierande priser på drivmedel</h2>
<p>Det finns flera skäl till att våra priser varierar från dag till dag och från station till station.</p>
</main>`;

const EXTRA_FIXTURE = `<!doctype html><main>
<h1>Fler förmåner och bättre rabatter vid varje besök</h1>
<p>Ny medlem i EXTRA? Då får du 50 öre rabatt/liter på de 3 första tankningarna när du ansluter dig till Circle K EXTRA med valfritt bank- eller betalkort första gången.</p>
<p>Dessutom får du 50 öre per kWh i rabatt på din första laddning via vår Circle K Charge-app.</p>
<p>Efter var femte besök får du välja en belöning direkt i Circle K-appen. Välj bland goda alternativ som kalla och varma drycker, mat och snacks.</p>
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

  it('emits source-backed Circle K pricing quirks without fabricating food prices', () => {
    const rows = parseCircleKSePricingQuirks({
      observedAt: OBSERVED_AT,
      pages: [
        { sourceUrl: CIRCLE_K_SE_CONSUMER_FUEL_PRICES_URL, html: CONSUMER_FUEL_FIXTURE },
        { sourceUrl: CIRCLE_K_SE_EXTRA_URL, html: EXTRA_FIXTURE },
        { sourceUrl: CIRCLE_K_SE_BUSINESS_FUEL_PRICES_URL, html: BUSINESS_FIXTURE },
        { sourceUrl: CIRCLE_K_SE_TRUCK_FUEL_PRICES_URL, html: TRUCK_FIXTURE }
      ]
    });

    assert.equal(rows.length, 6);
    assert.equal(rows.find((row) => row.kind === 'consumer_local_pump_price')?.requiresStoreId, true);
    assert.equal(rows.find((row) => row.kind === 'consumer_local_pump_price')?.storePriceSource, 'local_station_price_sign');
    assert.equal(rows.find((row) => row.kind === 'extra_new_member_fuel_discount')?.price, 0.5);
    assert.equal(rows.find((row) => row.kind === 'extra_new_member_fuel_discount')?.is_member_price, true);
    assert.equal(rows.find((row) => row.kind === 'extra_charge_app_discount')?.channel, 'app');
    assert.equal(rows.find((row) => row.kind === 'extra_charge_app_discount')?.is_coupon_price, true);
    assert.equal(rows.find((row) => row.kind === 'extra_app_reward_coupon')?.unit, 'offer');
    assert.equal(rows.find((row) => row.kind === 'business_fuel_list_price')?.out_of_scope_for_consumer_connector, true);
    assert.equal(rows.find((row) => row.kind === 'truck_weekly_price')?.productScope, 'truck_fuel');
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_clearance || row.multi_buy), false);
  });

  it('fetches pricing quirk pages with connector headers and fails closed on blocked responses', async () => {
    const requested: Array<{ input: RequestInfo | URL; headers: HeadersInit | undefined }> = [];
    const rows = await fetchCircleKSePricingQuirks({
      observedAt: OBSERVED_AT,
      sourceUrls: [CIRCLE_K_SE_CONSUMER_FUEL_PRICES_URL, CIRCLE_K_SE_EXTRA_URL],
      fetchImpl: async (input, init) => {
        requested.push({ input, headers: init?.headers });
        return new Response(input.toString().includes('/extra') ? EXTRA_FIXTURE : CONSUMER_FUEL_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 4);
    assert.equal(requested.length, 2);
    assert.equal(JSON.stringify(requested[0]?.headers).includes('circle-k-se-pricing-quirks-connector'), true);
    await assert.rejects(
      () => fetchCircleKSePricingQuirks({ sourceUrls: [CIRCLE_K_SE_EXTRA_URL], fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
