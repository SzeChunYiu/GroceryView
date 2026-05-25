import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchKronansApotekSeProducts, parseKronansApotekSeProducts } from '../kronans-apotek-se.js';

const OBSERVED_AT = '2026-05-25T13:45:00.000Z';
const MEMBER_URL = 'https://www.kronansapotek.se/erbjudanden/alltid-hos-oss/';
const CAMPAIGN_URL = 'https://www.kronansapotek.se/erbjudanden/kronansapotek-klipp/';

const MEMBER_FIXTURE = `<!doctype html><main>
  <h2>För våra klubbmedlemmar</h2>
  <p>Alltid bra klubbpriser.</p>
  <article>2 för 20:- 4.7 av 5 i omdöme Kronans Apotek Druvsocker + Vitamin C Jordgubb Druvsockertabletter, 14 st Livsmedel Pris online10,90 kr</article>
  <article>2 för 140:- 4.9 av 5 i omdöme Kronans Apotek Linsvätska Allt-i-ett Linsvätska, 355 ml Medicinteknisk produkt Pris online79 kr</article>
</main>`;

const CAMPAIGN_FIXTURE = `<!doctype html><main>
  <article>40% 4.4 av 5 i omdöme Kronans Apotek D-vitamin 20µg Vegansk Vegansk kapslar 100 st Kosttillskott Kampanjpris online56,40 kr Tidigare pris: 99 kr</article>
  <article>4.9 av 5 i omdöme Kronans Apotek Gurkmeja + Ingefära Kapslar 60 st Kosttillskott Pris online99 kr</article>
</main>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Kronans Apotek SE connector pricing quirks', () => {
  it('marks member-page online rows and captures multi-buy evidence', () => {
    const rows = parseKronansApotekSeProducts(MEMBER_FIXTURE, MEMBER_URL, OBSERVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'kronans-apotek',
      channel: 'online',
      product_name: 'Kronans Apotek Druvsocker + Vitamin C Jordgubb Druvsockertabletter, 14 st',
      price_sek: 10.9,
      price_text: '10.90 SEK',
      source_url: MEMBER_URL,
      observed_at: OBSERVED_AT,
      is_member_price: true,
      multi_buy: { kind: 'multi_buy', n: 2, price_sek: 20 }
    });
    assert.equal(rows.every((row) => row.channel === 'online' && row.is_member_price === true), true);
  });

  it('captures campaign online price and original price only when first-party evidence is present', () => {
    const rows = parseKronansApotekSeProducts(CAMPAIGN_FIXTURE, CAMPAIGN_URL, OBSERVED_AT);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.product_name, 'Kronans Apotek D-vitamin 20µg Vegansk Vegansk kapslar 100 st');
    assert.equal(rows[0]?.price_sek, 56.4);
    assert.equal(rows[0]?.original_price_sek, 99);
    assert.equal(rows[0]?.is_member_price, undefined);
    assert.equal(rows[1]?.original_price_sek, undefined);
  });

  it('fetches configured pages with crawler headers and honors maxRows', async () => {
    const requested: string[] = [];
    const headers: Array<HeadersInit | undefined> = [];

    const rows = await fetchKronansApotekSeProducts({
      fetchImpl: async (input, init) => {
        requested.push(String(input));
        headers.push(init?.headers);
        return response(String(input).includes('alltid-hos-oss') ? MEMBER_FIXTURE : CAMPAIGN_FIXTURE);
      },
      sourceUrls: [MEMBER_URL, CAMPAIGN_URL],
      observedAt: OBSERVED_AT,
      maxRows: 3
    });

    assert.deepEqual(requested, [MEMBER_URL, CAMPAIGN_URL]);
    assert.equal(JSON.stringify(headers[0]).includes('kronans-apotek-se-connector'), true);
    assert.equal(rows.length, 3);
    assert.equal(rows.every((row) => row.country === 'SE' && row.currency === 'SEK'), true);
  });

  it('fails closed on HTTP errors and non-product pages', async () => {
    await assert.rejects(
      () => fetchKronansApotekSeProducts({ fetchImpl: async () => response('blocked', 403), sourceUrls: [MEMBER_URL], observedAt: OBSERVED_AT }),
      /Kronans Apotek request failed/
    );
    assert.deepEqual(parseKronansApotekSeProducts('<main>Rabattkoder gäller online i kassan.</main>', CAMPAIGN_URL, OBSERVED_AT), []);
  });
});
