import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DIREKTEN_SE_BASE_URL, fetchDirektenSeProducts, parseDirektenSeProducts } from '../direkten-se.js';
import { ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS } from '../all-store-runner.js';

const RETRIEVED_AT = '2026-05-25T12:20:00.000Z';
const SOURCE_URL = `${DIREKTEN_SE_BASE_URL}/kampanjer/`;

const FIXTURE = `<!doctype html>
<section class="campaign-products">
  <article class="product-card campaign" data-sku="direkten-klassisk-korv" data-category="snabbmat">
    <a href="/produkt/klassisk-korv/"><img src="/assets/korv.jpg" alt="Klassisk korv" /></a>
    <h2>Klassisk korv med bröd</h2>
    <p class="price">25 kr</p>
  </article>
  <article class="product-card offer" data-sku="direkten-kaffe-bulle" data-category="fika">
    <a href="https://direkten.se/produkt/kaffe-bulle/"><img data-src="https://direkten.se/assets/kaffe.jpg" /></a>
    <h3>Kaffe &amp; kanelbulle</h3>
    <span class="pris">39,90 kr</span>
  </article>
  <article class="product-card campaign" data-sku="broken"><h2>Broken</h2></article>
</section>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Direkten SE connector', () => {
  it('parses small-store fixture rows into normalized SEK products', () => {
    const rows = parseDirektenSeProducts(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'direkten',
      code: 'direkten-klassisk-korv',
      name: 'Klassisk korv med bröd',
      category: 'snabbmat',
      price: 25,
      priceText: '25 kr',
      productUrl: 'https://direkten.se/produkt/klassisk-korv/',
      imageUrl: 'https://direkten.se/assets/korv.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1]?.price, 39.9);
    assert.equal(rows[1]?.name, 'Kaffe & kanelbulle');
  });

  it('fetches fixture pages, preserves metadata, honors maxRows, and registers the all-store runner connector key', async () => {
    const rows = await fetchDirektenSeProducts({
      fetchImpl: async () => response(FIXTURE),
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.deepEqual(rows.map((row) => row.code), ['direkten-klassisk-korv']);
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.currency, 'SEK');
    assert.equal(rows[0]?.chain, 'direkten');
    assert.ok(ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS.includes('direkten-se-small-store-products'));
  });

  it('rejects non-Direkten sources and HTTP failures', async () => {
    assert.throws(() => parseDirektenSeProducts(FIXTURE, 'https://example.com/', RETRIEVED_AT), /direkten\.se/);
    await assert.rejects(
      fetchDirektenSeProducts({ fetchImpl: async () => response('blocked', 503), sourceUrls: [SOURCE_URL] }),
      /Direkten SE request failed.*503/
    );
  });
});
