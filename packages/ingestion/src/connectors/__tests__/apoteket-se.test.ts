import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchApoteketSeProducts,
  normalizeApoteketCandidate,
  normalizeApoteketCandidateRows,
  parseApoteketSeProducts,
  type ApoteketSeProductRow
} from '../apoteket-se.js';

const OBSERVED_AT = '2026-05-25T08:30:00.000Z';
const SOURCE_URL = 'https://www.apoteket.se/kategori/kosttillskott-vitaminer/';

function apoteketFixture(candidates: unknown[]): string {
  return `<!doctype html>
<html lang="sv">
  <head><title>Recorded Apoteket fixture</title></head>
  <body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          dehydratedState: {
            queries: [
              {
                state: {
                  data: {
                    productList: {
                      items: candidates
                    }
                  }
                }
              }
            ]
          }
        }
      }
    })}</script>
    <script>
      window.__APOTEKET_BOOTSTRAP__ = JSON.parse('${JSON.stringify({
        shelves: [
          {
            products: [
              {
                productName: 'ACO Solkräm SPF 30 200 ml',
                currentPrice: { amount: '129,00', currency: 'SEK' },
                packageSize: '200 ml',
                productUrl: '/produkt/aco-solkram-spf30-200ml/'
              }
            ]
          }
        ]
      }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');
    </script>
  </body>
</html>`;
}

const RECORDED_APOTEKET_FIXTURE = apoteketFixture([
  {
    productName: 'Apoteket C-vitamin 100 tabletter',
    price: { amount: '79,90', currency: 'SEK' },
    packageSize: '100 tabletter',
    productUrl: '/produkt/apoteket-c-vitamin-100-tabletter/',
    storeId: 'online-se'
  },
  {
    displayName: 'Flux Fluorskölj 500 ml',
    salesPrice: 59.5,
    currencyCode: 'SEK',
    netContent: '500 ml',
    canonicalUrl: 'https://www.apoteket.se/produkt/flux-fluorskolj-500ml/'
  },
  {
    name: 'Receptbelagd rad ska filtreras',
    price: 10,
    productType: 'Receptbelagt läkemedel'
  },
  {
    productName: 'Euro row ska filtreras',
    price: { amount: 12, currency: 'EUR' }
  },
  {
    productName: 'Saknar pris ska filtreras',
    packageSize: '10 st'
  },
  {
    productName: 'Apoteket C-vitamin 100 tabletter',
    price: { amount: '79,90', currency: 'SEK' },
    packageSize: '100 tabletter',
    productUrl: '/produkt/apoteket-c-vitamin-100-tabletter/',
    storeId: 'online-se'
  }
]);

function response(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

describe('Apoteket.se connector fixture parsing', () => {
  it('parses a recorded HTML fixture into normalized product rows', () => {
    const rows = parseApoteketSeProducts(RECORDED_APOTEKET_FIXTURE, SOURCE_URL, OBSERVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'apoteket',
      store_id: 'online-se',
      product_name: 'Apoteket C-vitamin 100 tabletter',
      price_sek: 79.9,
      unit: '100 tabletter',
      observed_at: OBSERVED_AT,
      source_url: 'https://www.apoteket.se/produkt/apoteket-c-vitamin-100-tabletter/'
    });
    assert.deepEqual(
      rows.map((row) => ({ name: row.product_name, price: row.price_sek, unit: row.unit, source: row.source_url })),
      [
        {
          name: 'Apoteket C-vitamin 100 tabletter',
          price: 79.9,
          unit: '100 tabletter',
          source: 'https://www.apoteket.se/produkt/apoteket-c-vitamin-100-tabletter/'
        },
        {
          name: 'Flux Fluorskölj 500 ml',
          price: 59.5,
          unit: '500 ml',
          source: 'https://www.apoteket.se/produkt/flux-fluorskolj-500ml/'
        },
        {
          name: 'ACO Solkräm SPF 30 200 ml',
          price: 129,
          unit: '200 ml',
          source: 'https://www.apoteket.se/produkt/aco-solkram-spf30-200ml/'
        }
      ]
    );
  });

  it('normalizes edge cases without emitting unsafe pharmacy rows', () => {
    assert.equal(
      normalizeApoteketCandidate(
        { title: 'Koffeintabletter 30 st', sellingPrice: '42,50', href: '/produkt/koffeintabletter-30st/' },
        SOURCE_URL,
        OBSERVED_AT
      )?.unit,
      '30 st'
    );
    assert.equal(
      normalizeApoteketCandidate({ name: 'Receptbelagd', price: 25, requiresPrescription: true }, SOURCE_URL, OBSERVED_AT),
      null
    );
    assert.equal(
      normalizeApoteketCandidate({ name: 'Fel valuta', price: { amount: 25, currency: 'NOK' } }, SOURCE_URL, OBSERVED_AT),
      null
    );
    assert.equal(normalizeApoteketCandidate({ name: 'Saknar pris' }, SOURCE_URL, OBSERVED_AT), null);
  });

  it('emits Apoteket-specific channel, member, coupon, and multi-buy pricing quirks', () => {
    const rows = normalizeApoteketCandidateRows(
      {
        productName: 'Apoteket Aloe Vera Gel 200 ml',
        currentPrice: 59,
        storePrice: 89,
        packageSize: '200 ml',
        productUrl: '/produkt/254012',
        campaignLabel: 'Webbpris 25% vid köp av 2 online',
        memberPriceLabel: 'Apoteket+ medlemspris med kod MEDLEM',
        isMemberPrice: true,
        requiresCoupon: true
      },
      SOURCE_URL,
      OBSERVED_AT
    );

    assert.deepEqual(
      rows.map((row) => ({
        channel: row.channel,
        price: row.price_sek,
        member: row.is_member_price,
        coupon: row.is_coupon_price,
        multiBuy: row.multi_buy
      })),
      [
        {
          channel: 'online',
          price: 59,
          member: true,
          coupon: true,
          multiBuy: 'Webbpris 25% vid köp av 2 online'
        },
        {
          channel: 'store',
          price: 89,
          member: true,
          coupon: undefined,
          multiBuy: undefined
        }
      ]
    );
  });

  it('mocks HTTP with the fixture, de-duplicates rows, passes crawler headers, and honors maxRows', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchApoteketSeProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_APOTEKET_FIXTURE);
      },
      sourceUrls: [SOURCE_URL, 'https://www.apoteket.se/sok/?q=solskydd'],
      maxRows: 2,
      observedAt: OBSERVED_AT
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(
      rows.map((row) => row.product_name),
      ['Apoteket C-vitamin 100 tabletter', 'Flux Fluorskölj 500 ml']
    );
    assert.equal(rows.every((row) => row.country === 'SE' && row.currency === 'SEK' && row.chain === 'apoteket'), true);
    assert.equal(rows.every((row) => row.observed_at === OBSERVED_AT), true);
  });

  it('fails closed for HTTP errors and malformed fixture pages', async () => {
    await assert.rejects(
      () =>
        fetchApoteketSeProducts({
          fetchImpl: async () => response('Forbidden', 403),
          sourceUrls: [SOURCE_URL],
          observedAt: OBSERVED_AT
        }),
      /Apoteket request failed for https:\/\/www\.apoteket\.se\/kategori\/kosttillskott-vitaminer\/: 403/
    );

    assert.deepEqual(parseApoteketSeProducts('<html><body>No JSON product data</body></html>', SOURCE_URL, OBSERVED_AT), []);
  });
});
