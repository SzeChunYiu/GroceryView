import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchDocmorrisSeProducts,
  normalizeDocmorrisCandidate,
  parseDocmorrisSeProducts,
  type DocmorrisSeProductRow
} from '../docmorris-se.js';

const OBSERVED_AT = '2026-05-25T12:00:00.000Z';
const OFFERS_URL = 'https://www.docmorris.de/angebote';
const COUPON_URL = 'https://www.docmorris.de/angebote/couponartikel';
const SPARSETS_URL = 'https://www.docmorris.de/angebote/sparsets';

function docmorrisFixture(candidates: unknown[]): string {
  return `<!doctype html>
<html lang="de">
  <head><title>Recorded DocMorris fixture</title></head>
  <body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          productList: {
            items: candidates
          }
        }
      }
    })}</script>
    <a href="/voltaren-schmerzgel-forte-180g">
      Voltaren Schmerzgel forte 23,2 mg/g 180 g 180 g • Gel Haleon Germany GmbH
      34,90 € * Verkaufspreis : 24,49 € 24 , 49 € Grundpreis : 136.06 €/kg Rabattstempel -30% + Weitere Packungsgrößen
    </a>
  </body>
</html>`;
}

const RECORDED_DOCMORRIS_FIXTURE = docmorrisFixture([
  {
    productName: 'Heumann Ibuprofen Schmerztabletten 400 mg Filmtabletten 50 St',
    currentPrice: { amount: '3,89', currency: 'EUR' },
    listPriceEur: '11,84',
    basePriceText: '0.08 €/St',
    discountLabel: '-67%',
    productUrl: '/heumann-ibuprofen-400-50-st',
    packageSize: '50 St',
    promotionTags: ['Angebote']
  },
  {
    displayName: 'Euro-free row should be filtered',
    price: { amount: '39,90', currency: 'SEK' }
  },
  {
    name: 'Missing price should be filtered',
    packageSize: '1 St'
  }
]);

function response(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

function requiredFieldProjection(row: DocmorrisSeProductRow): Record<string, unknown> {
  return {
    chain: row.chain,
    requested_market: row.requested_market,
    fulfillment_market: row.fulfillment_market,
    channel: row.channel,
    currency: row.currency,
    observed_at: row.observed_at
  };
}

describe('DocMorris SE connector fixture parsing', () => {
  it('parses DocMorris offer rows with online-market and loyalty pricing fields', () => {
    const rows = parseDocmorrisSeProducts(RECORDED_DOCMORRIS_FIXTURE, OFFERS_URL, OBSERVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      chain: 'docmorris',
      requested_market: 'SE',
      fulfillment_market: 'DE',
      channel: 'online',
      currency: 'EUR',
      product_name: 'Heumann Ibuprofen Schmerztabletten 400 mg Filmtabletten 50 St',
      price_eur: 3.89,
      unit: '50 St',
      source_url: 'https://www.docmorris.de/heumann-ibuprofen-400-50-st',
      observed_at: OBSERVED_AT,
      list_price_eur: 11.84,
      base_price_text: '0.08 €/St',
      discount_percent: 67,
      promotion_tags: ['Angebote'],
      is_coupon_listing: false,
      is_bundle: false,
      loyalty_points_base: 38,
      loyalty_points_app: 58
    });
    assert.deepEqual(rows[1], {
      chain: 'docmorris',
      requested_market: 'SE',
      fulfillment_market: 'DE',
      channel: 'online',
      currency: 'EUR',
      product_name: 'Voltaren Schmerzgel forte 23,2 mg/g 180 g 180 g • Gel Haleon Germany GmbH',
      price_eur: 24.49,
      unit: '180 g',
      source_url: 'https://www.docmorris.de/voltaren-schmerzgel-forte-180g',
      observed_at: OBSERVED_AT,
      list_price_eur: 34.9,
      base_price_text: '136.06 €/kg',
      discount_percent: 30,
      promotion_tags: ['Rabattstempel -30%'],
      is_coupon_listing: false,
      is_bundle: false,
      loyalty_points_base: 244,
      loyalty_points_app: 367
    });
  });

  it('marks coupon-listing rows and tests coupon-specific fields', () => {
    const rows = parseDocmorrisSeProducts(
      `<a href="/eucerin-sun-50ml">Eucerin Oil Control Face Sun Gel-Creme LSF 50+ 50 ml 24,25 € * Verkaufspreis : 18,69 € Grundpreis : 373.80 €/l Rabattstempel -23%</a>`,
      COUPON_URL,
      OBSERVED_AT
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.is_coupon_listing, true);
    assert.deepEqual(rows[0]?.promotion_tags, ['Rabattstempel -23%', 'Couponartikel']);
    assert.equal(rows[0]?.discount_percent, 23);
    assert.equal(rows[0]?.base_price_text, '373.80 €/l');
    assert.equal(rows[0]?.loyalty_points_base, 186);
    assert.equal(rows[0]?.loyalty_points_app, 280);
  });

  it('marks Sparset and multi-pack rows as bundles', () => {
    const rows = parseDocmorrisSeProducts(
      `<a href="/nasenspray-ratiopharm-2x15ml">Nasenspray ratiopharm Erwachsene oK 2X15 ml 15,00 € * Verkaufspreis : 8,19 € Grundpreis : 273.00 €/l Rabattstempel -45%</a>`,
      SPARSETS_URL,
      OBSERVED_AT
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.is_bundle, true);
    assert.equal(rows[0]?.unit, '2X15 ml');
    assert.deepEqual(rows[0]?.promotion_tags, ['Rabattstempel -45%', 'Sparset']);
    assert.deepEqual(requiredFieldProjection(rows[0] as DocmorrisSeProductRow), {
      chain: 'docmorris',
      requested_market: 'SE',
      fulfillment_market: 'DE',
      channel: 'online',
      currency: 'EUR',
      observed_at: OBSERVED_AT
    });
  });

  it('normalizes candidates, filters non-EUR rows, and derives app points', () => {
    const row = normalizeDocmorrisCandidate(
      {
        title: 'DocMorris Ibuprofen 400 mg Filmtabletten 2X50 St',
        salePrice: { value: '7,58', currency: 'EUR' },
        originalPrice: '22,50',
        pricePerUnit: '0.08 €/St',
        discount: '-66%',
        badges: ['Sparset'],
        href: '/docmorris-ibuprofen-2x50st',
        isBundle: true
      },
      SPARSETS_URL,
      OBSERVED_AT
    );

    assert.equal(row?.price_eur, 7.58);
    assert.equal(row?.list_price_eur, 22.5);
    assert.equal(row?.discount_percent, 66);
    assert.equal(row?.base_price_text, '0.08 €/St');
    assert.equal(row?.is_bundle, true);
    assert.equal(row?.loyalty_points_base, 75);
    assert.equal(row?.loyalty_points_app, 113);
    assert.equal(
      normalizeDocmorrisCandidate({ name: 'Wrong currency', price: { amount: 10, currency: 'SEK' } }, OFFERS_URL, OBSERVED_AT),
      null
    );
    assert.equal(normalizeDocmorrisCandidate({ name: 'Missing price' }, OFFERS_URL, OBSERVED_AT), null);
  });

  it('mocks HTTP, de-duplicates rows, sends crawler headers, and honors maxRows', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchDocmorrisSeProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_DOCMORRIS_FIXTURE);
      },
      sourceUrls: [OFFERS_URL, COUPON_URL],
      maxRows: 1,
      observedAt: OBSERVED_AT
    });

    assert.deepEqual(requestedUrls, [OFFERS_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.product_name, 'Heumann Ibuprofen Schmerztabletten 400 mg Filmtabletten 50 St');
  });

  it('fails closed for HTTP errors and malformed pages', async () => {
    await assert.rejects(
      () =>
        fetchDocmorrisSeProducts({
          fetchImpl: async () => response('Forbidden', 403),
          sourceUrls: [OFFERS_URL],
          observedAt: OBSERVED_AT
        }),
      /DocMorris request failed for https:\/\/www\.docmorris\.de\/angebote: 403/
    );

    assert.deepEqual(parseDocmorrisSeProducts('<html><body>No product data</body></html>', OFFERS_URL, OBSERVED_AT), []);
  });
});
