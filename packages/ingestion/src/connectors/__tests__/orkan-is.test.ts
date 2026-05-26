import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchOrkanIsPricing,
  ORKAN_IS_CARD_URL,
  ORKAN_IS_ENGLISH_URL,
  ORKAN_IS_HOME_URL,
  parseOrkanIsCardTerms,
  parseOrkanIsEvPricing,
  parseOrkanIsHomeLowestFuelPrices
} from '../orkan-is.js';

const CAPTURED_AT = '2026-05-25T18:00:00.000Z';
const HOME_FIXTURE = `<main>
  <h1>Lægsta verðið</h1>
  <h4>Við bjóðum okkar lægsta verð á eftirfarandi staðsetningum</h4>
  <p>Brúartorg, Bústaðavegur, Dalvegur, Einhella, Furuvellir, Hörgárbraut, Kleppsvegur, Mýrarvegur, Reykjavíkurvegur, Salavegur, Skógarhlíð, Suðurfell, Suðurlandsvegur</p>
  <h4>95 okt:</h4><h4>Dísel:</h4><h4>205.3</h4><h4>246.6</h4>
</main>`;
const ENGLISH_FIXTURE = `<main>
  <h1>EV pricing</h1>
  <h5>58kr/kWh* at all stations except Fitjar and Vesturlandsvegur</h5>
  <p>58kr/min after 60min charging</p>
  <p>*12 kr. discount per kW with Orkan card at all our EV stations except Vesturlandsvegur and Fitjar where we offer our lowest price.</p>
  <h5>38kr/kWh at Fitjar and Vesturlandsvegur</h5>
  <p>38kr/min after 60min charging</p>
</main>`;
const CARD_FIXTURE = `<main>
  <h1>Apply for Orkan discount card to wallet</h1>
  <p>With Orkan card you get 12 kr. discount per liter*</p>
  <p>*12 kr. Discount is available at all stations except Orkan Brúartorgi, Bústaðavegi, Dalvegi, Einhellu, Furuvöllum, Hörgárbraut, Kleppsvegi, Mýrarvegi, Reykjavíkurvegi, Salavegi, Skógarhlíð, Suðurfelli og Suðurlandsvegi where we offer our lowest possible price.</p>
</main>`;

describe('Orkan IS pricing connector', () => {
  it('parses lowest-price fuel rows with the lowest-price station cluster', () => {
    const rows = parseOrkanIsHomeLowestFuelPrices({ body: HOME_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      domain: 'fuel',
      productId: 'fuel-95-e10',
      gradeLabel: 'Orkan 95 okt',
      pricePerLitre: 205.3,
      unit: 'l',
      currency: 'ISK',
      chainId: 'orkan-is',
      operatorName: 'Orkan',
      sourceUrl: ORKAN_IS_HOME_URL,
      observedAt: CAPTURED_AT,
      channel: 'self_service_pump',
      format: 'lowest_price_station',
      store_id: 'orkan-is-lowest-price-network',
      region: 'lowest_price_network',
      is_member_price: false,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.pricePerLitre, 246.6);
    assert.equal(rows[0]?.provenance.lowestPriceLocations.includes('Suðurfell'), true);
  });

  it('parses Orkan card fuel discount terms as member-price evidence', () => {
    const rows = parseOrkanIsCardTerms({ body: CARD_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.discountPerLitre, 12);
    assert.equal(rows[0]?.is_member_price, true);
    assert.equal(rows[0]?.memberProgram, 'Orkan card');
    assert.equal(rows[0]?.excludedLocations.includes('Suðurlandsvegi'), true);
  });

  it('parses ordinary, member-discounted, and lowest-site EV prices', () => {
    const rows = parseOrkanIsEvPricing({ body: ENGLISH_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 3);
    assert.equal(rows.find((row) => !row.is_member_price && row.pricePerKwh === 58)?.idlePricePerMinute, 58);
    assert.equal(rows.find((row) => row.is_member_price)?.pricePerKwh, 46);
    assert.equal(rows.find((row) => row.pricePerKwh === 38)?.is_member_price, false);
  });

  it('fetches all official pages with connector headers', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchOrkanIsPricing({
      capturedAt: CAPTURED_AT,
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        assert.equal(JSON.stringify(init?.headers).includes('orkan-is-connector'), true);
        if (String(input) === ORKAN_IS_HOME_URL) return new Response(HOME_FIXTURE, { status: 200 });
        if (String(input) === ORKAN_IS_ENGLISH_URL) return new Response(ENGLISH_FIXTURE, { status: 200 });
        if (String(input) === ORKAN_IS_CARD_URL) return new Response(CARD_FIXTURE, { status: 200 });
        return new Response('missing fixture', { status: 404 });
      }
    });

    assert.deepEqual(requestedUrls, [ORKAN_IS_HOME_URL, ORKAN_IS_ENGLISH_URL, ORKAN_IS_CARD_URL]);
    assert.equal(rows.length, 6);
  });
});
