import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildKronanFlyerIsOffersUrl, fetchKronanFlyerIsPromotions, parseKronanFlyerIsPromotions } from '../kronan-flyer-is.js';

const RETRIEVED_AT = '2026-05-25T14:30:00.000Z';
const SOURCE_URL = 'https://kronan.is/tilbod';
const FIXTURE = `<!doctype html><main>
  <article class="vara tilbod" data-sku="kro-tilbod-1" data-category="dairy" data-valid-from="2026-05-22" data-valid-to="2026-05-28">
    <a href="/vara/skyr"><img src="/img/skyr.jpg" /></a>
    <h2>Ísey skyr 500 g</h2><span class="tilbodsverd">299 kr.</span><span class="einingarverd">598 kr/kg</span>
  </article>
  <article class="campaign product afslattur" data-sku="kro-tilbod-2" data-category="produce" data-member-tier="kronuklubbur">
    <a href="/vara/bananar"><h3>Bananar</h3></a><span class="price">249</span><span class="regular">Áður 319 kr.</span>
  </article>
</main>`;

describe('Krónan IS flyer connector', () => {
  it('builds the Krónan offers URL', () => {
    assert.equal(buildKronanFlyerIsOffersUrl(), SOURCE_URL);
  });

  it('parses ISK weekly promotion rows and member-tier offers from flyer markup', () => {
    const rows = parseKronanFlyerIsPromotions(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'IS',
      currency: 'ISK',
      chain: 'kronan-is',
      code: 'kro-tilbod-1',
      name: 'Ísey skyr 500 g',
      category: 'dairy',
      promotionType: 'weekly_flyer',
      price: 299,
      priceText: '299 kr.',
      regularPriceText: '',
      comparePriceText: '598 kr/kg',
      validFrom: '2026-05-22',
      validTo: '2026-05-28',
      is_member_price: false,
      memberTier: '',
      productUrl: 'https://kronan.is/vara/skyr',
      imageUrl: 'https://kronan.is/img/skyr.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.currency, 'ISK');
    assert.equal(rows[1]?.code, 'kro-tilbod-2:member');
    assert.equal(rows[1]?.regularPriceText, 'Áður 319 kr.');
    assert.equal(rows[1]?.is_member_price, true);
    assert.equal(rows[1]?.memberTier, 'kronuklubbur');
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchKronanFlyerIsPromotions({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('kronan-flyer-is-connector'), true);
    await assert.rejects(
      () => fetchKronanFlyerIsPromotions({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when no flyer rows are present', () => {
    assert.throws(() => parseKronanFlyerIsPromotions('<main>Engin tilboð</main>', SOURCE_URL, RETRIEVED_AT), /no parseable weekly promotion rows/);
  });
});
