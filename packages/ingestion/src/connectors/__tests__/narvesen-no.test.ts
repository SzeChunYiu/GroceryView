import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchNarvesenNoProducts, NARVESEN_NO_DEFAULT_SOURCE_URLS, parseNarvesenNoProducts } from '../narvesen-no.js';

const RETRIEVED_AT = '2026-05-25T15:00:00.000Z';
const SOURCE_URL = 'https://www.narvesen.no/kampanjer/';
const FIXTURE = `<!doctype html><main>
  <article class="produkt kampanje" data-sku="narv-1" data-category="coffee" data-promotion="Morgenkupp">
    <a href="/produkt/kaffe"><img src="/img/kaffe.jpg" /></a>
    <h2>Kaffe og bolle</h2><span class="tilbudspris">39,90</span>
  </article>
  <div class="product card" data-product-id="narv-2" data-category="drink">
    <a href="/produkt/vann"><h3>Isvann 0,5 l</h3></a><span class="price">29 kr</span>
  </div>
</main>`;

describe('Narvesen NO connector', () => {
  it('declares Narvesen source URLs', () => {
    assert.equal(NARVESEN_NO_DEFAULT_SOURCE_URLS[0], 'https://www.narvesen.no/');
  });

  it('parses NOK convenience rows from Narvesen campaign markup', () => {
    const rows = parseNarvesenNoProducts(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'narvesen-no',
      code: 'narv-1',
      name: 'Kaffe og bolle',
      category: 'coffee',
      price: 39.9,
      priceText: '39,90',
      promotionText: 'Morgenkupp',
      productUrl: 'https://www.narvesen.no/produkt/kaffe',
      imageUrl: 'https://www.narvesen.no/img/kaffe.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1]?.currency, 'NOK');
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchNarvesenNoProducts({
      sourceUrls: [SOURCE_URL],
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('narvesen-no-connector'), true);
    await assert.rejects(
      () => fetchNarvesenNoProducts({ sourceUrls: [SOURCE_URL], fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when no rows are present', () => {
    assert.throws(() => parseNarvesenNoProducts('<main>Ingen kampanjer</main>', SOURCE_URL, RETRIEVED_AT), /no parseable convenience rows/);
  });
});
