import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CIRCLE_K_NO_DRINK_URL,
  CIRCLE_K_NO_FOOD_URL,
  CIRCLE_K_NO_FUEL_PRICES_URL,
  fetchCircleKNoRows,
  parseCircleKNoRows
} from '../circle-k-no.js';

const RETRIEVED_AT = '2026-05-25T14:30:00.000Z';

const FUEL_FIXTURE = `<!doctype html><main>
  <h1>Drivstoffpriser</h1>
  <p>Som firmakunde får du tilgang til Norges beste stasjonsnett. Logg inn i vår kundeportal for oppdaterte listepriser.</p>
  <h2>Circle K hjelper bedriften å holde transportkostnadene nede</h2>
  <p>Lokale variasjoner kan forekomme, men som firmakunde vil dere alltid få de laveste tilgjengelige priser på bensin og diesel.</p>
  <h2>Drivstoffpriser - Tungbil</h2>
  <p>Logg inn via vår kundeportal for kort og finn dagens priser.</p>
</main>`;

const FOOD_FIXTURE = `<!doctype html><main>
  <h1>Vår meny</h1>
  <p>Vi serverer pølser, burgere, sandwich, salater og pizza på stasjonene.</p>
</main>`;

const DRINK_FIXTURE = `<!doctype html><main>
  <h1>Drikke</h1>
  <p>Circle K er kjent for Koppen, kaffe, smoothies, juicer og energidrikk.</p>
</main>`;

describe('Circle K NO connector', () => {
  it('emits explicit fuel portal and convenience metadata rows', () => {
    const rows = parseCircleKNoRows({
      fuelPricesHtml: FUEL_FIXTURE,
      foodHtml: FOOD_FIXTURE,
      drinkHtml: DRINK_FIXTURE,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(rows.map((row) => row.id), [
      'circle-k-no-business-fuel-prices',
      'circle-k-no-truck-fuel-prices',
      'circle-k-no-station-food',
      'circle-k-no-station-drink'
    ]);
    assert.deepEqual(rows[0], {
      id: 'circle-k-no-business-fuel-prices',
      chain: 'circle-k-no',
      country: 'NO',
      currency: 'NOK',
      domain: 'fuel',
      category: 'business_fuel_prices',
      product: 'Circle K Norway business fuel list prices',
      price: null,
      unit: 'metadata',
      customerSegment: 'business',
      channel: 'portal',
      requiresLogin: true,
      sourceUrl: CIRCLE_K_NO_FUEL_PRICES_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.category === 'food')?.requiresLogin, false);
    assert.equal(rows.find((row) => row.category === 'drink')?.sourceUrl, CIRCLE_K_NO_DRINK_URL);
  });

  it('fails closed when required fuel or convenience evidence is absent', () => {
    assert.throws(
      () => parseCircleKNoRows({ fuelPricesHtml: '<p>captcha</p>', foodHtml: FOOD_FIXTURE, drinkHtml: DRINK_FIXTURE, retrievedAt: RETRIEVED_AT }),
      /blocked\/login/
    );
    assert.throws(
      () => parseCircleKNoRows({ fuelPricesHtml: FUEL_FIXTURE, foodHtml: '<p>Mat</p>', drinkHtml: DRINK_FIXTURE, retrievedAt: RETRIEVED_AT }),
      /station food menu/
    );
  });

  it('fetches the three source pages with crawler headers and blocked-response handling', async () => {
    const requested: Array<{ input: RequestInfo | URL; headers: HeadersInit | undefined }> = [];
    const rows = await fetchCircleKNoRows({
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async (input, init) => {
        requested.push({ input, headers: init?.headers });
        const url = String(input);
        if (url === CIRCLE_K_NO_FOOD_URL) return new Response(FOOD_FIXTURE, { status: 200 });
        if (url === CIRCLE_K_NO_DRINK_URL) return new Response(DRINK_FIXTURE, { status: 200 });
        return new Response(FUEL_FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 4);
    assert.deepEqual(requested.map((request) => String(request.input)), [CIRCLE_K_NO_FUEL_PRICES_URL, CIRCLE_K_NO_FOOD_URL, CIRCLE_K_NO_DRINK_URL]);
    assert.equal(JSON.stringify(requested[0]?.headers).includes('circle-k-no-connector'), true);
    await assert.rejects(
      () => fetchCircleKNoRows({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
