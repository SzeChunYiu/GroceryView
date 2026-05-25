import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ATLANTSOLIA_IS_MEMBER_DISCOUNT_ISK_PER_LITRE,
  ATLANTSOLIA_IS_FUEL_PRICES_URL,
  fetchAtlantsoliaIsFuelPrices,
  parseAtlantsoliaIsFuelPricePage
} from '../atlantsolia-is.js';

const CAPTURED_AT = '2026-05-25T11:00:00.000Z';
const FIXTURE = `<!doctype html><main>
<h1>Stöðvar</h1>
<table>
<tr><th>Afgreiðslustöð</th><th>95 Okt.</th><th>Dísel</th><th>Rafmagn</th></tr>
<tr><td><a href="/stodvar/akureyri-baldursnes/">Akureyri Baldursnes</a></td><td><div>205,40</div></td><td><div>246,70</div></td><td>65 kr/kWh</td></tr>
<tr><td><a href="/stodvar/akureyri-glerartorg/">Akureyri Gler&#xE1;rtorg</a></td><td><div>205,40</div></td><td><div>246,70</div></td><td>65 kr/kWh</td></tr>
<tr><td><a href="/stodvar/bildshofdi/">B&#xED;ldsh&#xF6;f&#xF0;i</a></td><td><div>231,40</div></td><td><div>266,10</div></td><td></td></tr>
<tr><td><a href="/stodvar/stykkisholmur/">Stykkish&#xF3;lmur</a></td><td><div>220,30</div></td><td><div>257,70</div></td><td></td></tr>
</table>
</main>`;

describe('Atlantsolía IS fuel connector', () => {
  it('parses station-table petrol and diesel rows with store channel and station IDs', () => {
    const rows = parseAtlantsoliaIsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT });
    const baldursnes95 = rows.find((row) => row.productId === 'fuel-95-e10' && row.store_id === 'atlantsolia-is-akureyri-baldursnes');

    assert.equal(rows.length, 14);
    assert.deepEqual(baldursnes95, {
      domain: 'fuel',
      productId: 'fuel-95-e10',
      gradeLabel: 'Atlantsolía 95 Okt.',
      pricePerLitre: 205.4,
      unit: 'l',
      currency: 'ISK',
      chainId: 'atlantsolia-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'Atlantsolía',
      channel: 'store',
      store_id: 'atlantsolia-is-akureyri-baldursnes',
      is_member_price: false,
      is_subscription_price: false,
      is_coupon_price: false,
      is_clearance: false,
      sourceUrl: ATLANTSOLIA_IS_FUEL_PRICES_URL,
      observedAt: CAPTURED_AT,
      effectiveFrom: '2026-05-25',
      provenance: baldursnes95?.provenance
    });
    assert.equal(baldursnes95?.provenance.originalStationName, 'Akureyri Baldursnes');
    assert.equal(baldursnes95?.provenance.originalStationHref, 'https://www.atlantsolia.is/stodvar/akureyri-baldursnes/');
    assert.equal(rows.some((row) => row.productId === 'fuel-diesel' && row.store_id === 'atlantsolia-is-bildshofdi' && row.pricePerLitre === 266.1), true);
    assert.equal(rows.some((row) => row.provenance.originalStationName === 'Akureyri Glerártorg'), true);
  });

  it('emits dælulykill/app member prices except on source-listed no-discount low-price stations', () => {
    const rows = parseAtlantsoliaIsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT });
    const glerartorgMember95 = rows.find(
      (row) => row.productId === 'fuel-95-e10' && row.store_id === 'atlantsolia-is-akureyri-glerartorg' && row.is_member_price
    );

    assert.equal(glerartorgMember95?.pricePerLitre, 194.4);
    assert.equal(glerartorgMember95?.membershipProgram, 'Atlantsolía app/dælulykill');
    assert.equal(glerartorgMember95?.memberDiscountIskPerLitre, ATLANTSOLIA_IS_MEMBER_DISCOUNT_ISK_PER_LITRE);
    assert.equal(glerartorgMember95?.is_subscription_price, false);
    assert.equal(glerartorgMember95?.is_coupon_price, false);
    assert.equal(glerartorgMember95?.is_clearance, false);
    assert.equal(rows.some((row) => row.store_id === 'atlantsolia-is-akureyri-baldursnes' && row.is_member_price), false);
  });

  it('fails closed for non-Atlantsolía sources, blocked pages, and missing fuel tables', () => {
    assert.throws(
      () => parseAtlantsoliaIsFuelPricePage({ body: FIXTURE, capturedAt: CAPTURED_AT, sourceUrl: 'https://example.com/fuel' }),
      /atlantsolia\.is source URLs/
    );
    assert.throws(
      () => parseAtlantsoliaIsFuelPricePage({ body: 'captcha access denied', capturedAt: CAPTURED_AT }),
      /blocked\/login/
    );
    assert.deepEqual(parseAtlantsoliaIsFuelPricePage({ body: '<table><tr><td>No prices</td></tr></table>', capturedAt: CAPTURED_AT }), []);
  });

  it('uses crawler headers and rejects blocked HTTP responses', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchAtlantsoliaIsFuelPrices({
      capturedAt: CAPTURED_AT,
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 14);
    assert.equal(JSON.stringify(headers[0]).includes('atlantsolia-is-connector'), true);
    await assert.rejects(
      () => fetchAtlantsoliaIsFuelPrices({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
