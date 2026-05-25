import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOTS_NO_BASE_URL,
  fetchBootsNoProducts,
  normalizeBootsNoCandidate,
  parseBootsNoProducts
} from '../boots-no.js';

const OBSERVED_AT = '2026-05-25T15:00:00.000Z';
const SOURCE_URL = `${BOOTS_NO_BASE_URL}/produkter/kosttilskudd/vitaminer`;

const BOOTS_FIXTURE = `<!doctype html>
<html lang="no">
  <body>
    <script type="application/json">${JSON.stringify({
      products: [
        {
          productName: 'Nycoplus B12-vitamin 9 mcg tabletter 100 stk',
          price: { amount: '129,90', currency: 'NOK' },
          packageSize: '100 stk',
          productUrl: '/nycoplus-b12-vitamin-9-mcg-tabletter-100-stk-912345',
          channel: 'online'
        },
        {
          displayName: 'Cosmica Face Glow Vitamin C Booster 30ml',
          currentPrice: 249,
          currencyCode: 'NOK',
          netContent: '30ml',
          canonicalUrl: 'https://www.boots.no/cosmica-face-glow-vitamin-c-booster-30ml-987654',
          campaignLabel: '2 for 399 kundeklubb'
        },
        {
          name: 'Reseptbelagt rad filtreres',
          price: 10,
          productType: 'Legemiddel på resept'
        },
        {
          productName: 'Euro row filtreres',
          price: { amount: 12, currency: 'EUR' }
        }
      ]
    })}</script>
    <article class="product-card">
      <a href="/vitaminbjorner-eple-paere-60-stk-900001"><h2>Vitaminbjørner Eple & Pære 60 stk</h2></a>
      <span class="price">89,90 kr</span>
    </article>
  </body>
</html>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Boots NO connector', () => {
  it('parses Boots JSON and product-card fixtures into normalized NOK rows', () => {
    const rows = parseBootsNoProducts(BOOTS_FIXTURE, SOURCE_URL, OBSERVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'boots-no',
      product_name: 'Nycoplus B12-vitamin 9 mcg tabletter 100 stk',
      price_nok: 129.9,
      unit: '100 stk',
      observed_at: OBSERVED_AT,
      source_url: 'https://www.boots.no/nycoplus-b12-vitamin-9-mcg-tabletter-100-stk-912345',
      channel: 'online'
    });
    assert.equal(rows[1]?.is_member_price, true);
    assert.equal(rows[1]?.multi_buy, '2 for 399 kundeklubb');
    assert.equal(rows[2]?.product_name, 'Vitaminbjørner Eple & Pære 60 stk');
    assert.equal(rows[2]?.price_nok, 89.9);
  });

  it('normalizes edge cases without emitting prescription or wrong-currency rows', () => {
    assert.equal(
      normalizeBootsNoCandidate({ title: 'Munnspray 20 ml', sellingPrice: '42,50', href: '/munnspray-20ml' }, SOURCE_URL, OBSERVED_AT)?.unit,
      '20 ml'
    );
    assert.equal(normalizeBootsNoCandidate({ name: 'Reseptmedisin', price: 25, requiresPrescription: true }, SOURCE_URL, OBSERVED_AT), null);
    assert.equal(normalizeBootsNoCandidate({ name: 'Feil valuta', price: { amount: 25, currency: 'SEK' } }, SOURCE_URL, OBSERVED_AT), null);
  });

  it('fetches with connector headers, de-duplicates rows, maxRows, and blocked-response handling', async () => {
    const requestedHeaders: Array<HeadersInit | undefined> = [];
    const rows = await fetchBootsNoProducts({
      fetchImpl: async (_input, init) => {
        requestedHeaders.push(init?.headers);
        return response(BOOTS_FIXTURE);
      },
      sourceUrls: [SOURCE_URL, `${BOOTS_NO_BASE_URL}/produkter/kosttilskudd`],
      observedAt: OBSERVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('boots-no-connector'), true);
    await assert.rejects(
      () => fetchBootsNoProducts({ sourceUrls: [SOURCE_URL], fetchImpl: async () => response('blocked', 403) }),
      /blocked with HTTP 403/
    );
  });
});
