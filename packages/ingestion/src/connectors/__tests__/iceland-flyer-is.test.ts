import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildIcelandFlyerIsOffersUrl, fetchIcelandFlyerIsPromotions, parseIcelandFlyerIsPromotions } from '../iceland-flyer-is.js';

const RETRIEVED_AT = '2026-05-25T14:10:00.000Z';
const SOURCE_URL = 'https://www.samkaup.is/velduverslun/';
const FIXTURE = `<!doctype html><main>
  <article class="vara tilboð" data-sku="ice-1" data-category="frozen" data-valid-from="2026-05-22" data-valid-to="2026-05-28">
    <a href="/tilbod/iceland-pizza"><img src="/img/pizza.jpg" /></a>
    <h2>Iceland pizza 400 g</h2><span class="verð">1.299 kr.</span><span class="einingarverð">3.248 kr/kg</span>
  </article>
  <article class="campaign product netto" data-product-id="netto-2" data-category="produce">
    <a href="https://netto.is/vara/eplar"><h3>Nettó epli</h3></a><span class="price">399 kr</span>
  </article>
</main>`;

describe('Iceland/Samkaup flyer connector', () => {
  it('builds the Samkaup family offers URL', () => {
    assert.equal(buildIcelandFlyerIsOffersUrl(), SOURCE_URL);
  });

  it('parses ISK weekly promotion rows from Samkaup-family flyer markup', () => {
    const rows = parseIcelandFlyerIsPromotions(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'IS',
      currency: 'ISK',
      chain: 'iceland-is',
      code: 'ice-1',
      name: 'Iceland pizza 400 g',
      category: 'frozen',
      promotionType: 'weekly_flyer',
      price: 1299,
      priceText: '1.299 kr.',
      comparePriceText: '3.248 kr/kg',
      validFrom: '2026-05-22',
      validTo: '2026-05-28',
      productUrl: 'https://www.samkaup.is/tilbod/iceland-pizza',
      imageUrl: 'https://www.samkaup.is/img/pizza.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.chain, 'netto-is');
    assert.equal(rows[1]?.currency, 'ISK');
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchIcelandFlyerIsPromotions({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('iceland-flyer-is-connector'), true);
    await assert.rejects(
      () => fetchIcelandFlyerIsPromotions({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when no flyer rows are present', () => {
    assert.throws(() => parseIcelandFlyerIsPromotions('<main>Engin tilboð</main>', SOURCE_URL, RETRIEVED_AT), /no parseable weekly promotion rows/);
  });
});
