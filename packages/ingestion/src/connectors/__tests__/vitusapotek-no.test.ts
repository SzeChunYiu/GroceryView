import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractVitusapotekNoProductUrls,
  fetchVitusapotekNoProducts,
  parseVitusapotekNoProducts,
  VITUSAPOTEK_NO_BASE_URL
} from '../vitusapotek-no.js';

const RETRIEVED_AT = '2026-05-25T12:00:00.000Z';
const PRODUCT_URL = `${VITUSAPOTEK_NO_BASE_URL}/smerte-feber-og-forkjolelse/smertestillende/paracet-tab-500mg-20-stk-517128`;
const BRAND_URL = `${VITUSAPOTEK_NO_BASE_URL}/vare-merker/paracet`;

const PRODUCT_HTML = `<!doctype html>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
{"@type":"ListItem","position":1,"name":"Hjem","item":"https://www.vitusapotek.no/"},
{"@type":"ListItem","position":2,"name":"Smerte, feber og forkjølelse","item":"https://www.vitusapotek.no/smerte-feber-og-forkjolelse"},
{"@type":"ListItem","position":3,"name":"Smertestillende","item":"https://www.vitusapotek.no/smerte-feber-og-forkjolelse/smertestillende"},
{"@type":"ListItem","position":4,"name":"Paracet tab 500mg","item":"${PRODUCT_URL}"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org/","@type":"Drug","name":"Paracet tab 500mg","image":"https://www.vitusapotek.no/io/paracet.png","brand":{"@type":"Brand","name":"Paracet"},"offers":{"@type":"Offer","url":"${PRODUCT_URL}","priceCurrency":"NOK","price":64.9,"availability":"https://schema.org/InStock"},"sku":"517128","url":"${PRODUCT_URL}","gtin13":"7040885171283","seller":{"@type":"Organization","name":"Vitusapotek"}}
</script>`;

const BRAND_HTML = `<!doctype html>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","name":"Paracet"},{"@type":"ItemList","itemListElement":[
{"@type":"ListItem","position":1,"url":"${PRODUCT_URL}"},
{"@type":"ListItem","position":2,"url":"/sol-fritid-og-reise/reiseapotek/smertestillende/paracet-brusetabletter-500mg-20-stk-199122"},
{"@type":"ListItem","position":3,"url":"${PRODUCT_URL}"}
]}]}
</script>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Vitusapotek NO connector', () => {
  it('parses schema.org Drug offers into NOK product rows', () => {
    const rows = parseVitusapotekNoProducts(PRODUCT_HTML, PRODUCT_URL, RETRIEVED_AT);

    assert.deepEqual(rows, [
      {
        country: 'NO',
        currency: 'NOK',
        chain: 'vitusapotek',
        code: '517128',
        ean: '7040885171283',
        name: 'Paracet tab 500mg',
        brand: 'Paracet',
        category: 'Smerte, feber og forkjølelse/Smertestillende',
        price: 64.9,
        priceText: '64,90 kr',
        productUrl: PRODUCT_URL,
        imageUrl: 'https://www.vitusapotek.no/io/paracet.png',
        sourceUrl: PRODUCT_URL,
        retrievedAt: RETRIEVED_AT
      }
    ]);
  });

  it('extracts and deduplicates product URLs from JSON-LD item lists', () => {
    assert.deepEqual(extractVitusapotekNoProductUrls(BRAND_HTML, BRAND_URL), [
      PRODUCT_URL,
      `${VITUSAPOTEK_NO_BASE_URL}/sol-fritid-og-reise/reiseapotek/smertestillende/paracet-brusetabletter-500mg-20-stk-199122`
    ]);
  });

  it('fetches listing and product pages with crawler headers, maxRows, and EAN dedupe', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: HeadersInit[] = [];
    const rows = await fetchVitusapotekNoProducts({
      sourceUrls: [BRAND_URL],
      maxRows: 1,
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers ?? {});
        return response(String(input) === BRAND_URL ? BRAND_HTML : PRODUCT_HTML);
      }
    });

    assert.deepEqual(requestedUrls, [BRAND_URL, PRODUCT_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('vitusapotek-no-connector'), true);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.chain, 'vitusapotek');
  });

  it('rejects unsupported sources and blocked HTTP responses', async () => {
    assert.throws(() => parseVitusapotekNoProducts(PRODUCT_HTML, 'https://example.com/paracet', RETRIEVED_AT), /only accepts vitusapotek\.no/);
    await assert.rejects(
      () => fetchVitusapotekNoProducts({ sourceUrls: [BRAND_URL], fetchImpl: async () => response('blocked', 403) }),
      /blocked with HTTP 403/
    );
  });
});
