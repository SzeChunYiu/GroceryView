import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS } from '../all-store-runner.js';
import { fetchSnabbgrossSeProducts, parseSnabbgrossSeProducts, SNABBGROSS_SE_BASE_URL } from '../snabbgross-se.js';

const RETRIEVED_AT = '2026-05-25T15:00:00.000Z';
const SOURCE_URL = `${SNABBGROSS_SE_BASE_URL}/sortiment/`;

const FIXTURE = `<!doctype html>
<main data-store-id="sg-arsta" data-store-name="Snabbgross Årsta">
  <article class="product-card" data-sku="snabbgross-idealmakaroner-5kg" data-brand="Kungsörnen" data-category="Torrvaror" data-package="5 kg" data-unit-price="19,98 kr/kg">
    <a href="/produkt/idealmakaroner-5kg"><img src="/assets/pasta.jpg" alt="Idealmakaroner" /></a>
    <h2>Idealmakaroner 5 kg</h2>
    <p class="price">99,90 kr</p>
  </article>
  <article class="product-card campaign" data-sku="snabbgross-rapsolja-10l" data-brand="Snabbgross" data-category="Olja" data-package="10 l" data-unit-price="24,90 kr/l">
    <a href="https://www.snabbgross.se/produkt/rapsolja-10l"><img data-src="https://www.snabbgross.se/assets/olja.jpg" /></a>
    <h3>Rapsolja 10 l</h3>
    <span class="pris">249 kr</span>
  </article>
  <article class="product-card"><h2>Broken</h2></article>
</main>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Snabbgross SE connector', () => {
  it('parses wholesale product rows with SE currency, chain, store, unit, and bulk metadata', () => {
    const rows = parseSnabbgrossSeProducts(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'snabbgross',
      code: 'snabbgross-idealmakaroner-5kg',
      name: 'Idealmakaroner 5 kg',
      brand: 'Kungsörnen',
      category: 'Torrvaror',
      price: 99.9,
      priceText: '99,90 kr',
      unitPriceText: '19,98 kr/kg',
      packageText: '5 kg',
      storeId: 'sg-arsta',
      storeName: 'Snabbgross Årsta',
      customerSegment: 'business',
      consumerRelevantForBulkShoppers: true,
      productUrl: 'https://www.snabbgross.se/produkt/idealmakaroner-5kg',
      imageUrl: 'https://www.snabbgross.se/assets/pasta.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1]?.price, 249);
    assert.equal(rows[1]?.unitPriceText, '24,90 kr/l');
  });

  it('fetches fixture pages, honors maxRows, and registers the chainwide runner key', async () => {
    const headers: Array<HeadersInit | undefined> = [];
    const rows = await fetchSnabbgrossSeProducts({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers);
        return response(FIXTURE);
      },
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.deepEqual(rows.map((row) => row.code), ['snabbgross-idealmakaroner-5kg']);
    assert.equal(JSON.stringify(headers[0]).includes('snabbgross-se-connector'), true);
    assert.ok(ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS.includes('snabbgross-se-wholesale-products'));
  });

  it('rejects non-Snabbgross sources and HTTP failures', async () => {
    assert.throws(() => parseSnabbgrossSeProducts(FIXTURE, 'https://example.com/', RETRIEVED_AT), /snabbgross\.se/);
    await assert.rejects(
      () => fetchSnabbgrossSeProducts({ fetchImpl: async () => response('blocked', 503), sourceUrls: [SOURCE_URL] }),
      /Snabbgross SE request failed.*503/
    );
  });
});
