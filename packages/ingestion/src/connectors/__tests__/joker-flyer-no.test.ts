import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildJokerFlyerNoOffersUrl, fetchJokerFlyerNoPromotions, parseJokerFlyerNoPromotions } from '../joker-flyer-no.js';

const RETRIEVED_AT = '2026-05-25T13:20:00.000Z';
const SOURCE_URL = 'https://joker.no/erbjudanden';
const FIXTURE = `<!doctype html><main>
  <article class="produkt tilbud" data-sku="joker-1" data-category="dairy" data-valid-from="2026-05-20" data-valid-to="2026-05-26">
    <a href="/produkt/lettmelk"><img src="/img/melk.jpg" /></a>
    <h2>Tine Lettmelk 1 l</h2><span class="tilbudspris">19,90</span><span class="enhetspris">19,90/l</span>
  </article>
  <article class="campaign product" data-sku="joker-2" data-category="produce">
    <a href="/produkt/epler"><h3>Norske epler</h3></a><span class="price">29 kr</span>
  </article>
</main>`;

describe('Joker NO flyer connector', () => {
  it('builds the Joker offers URL', () => {
    assert.equal(buildJokerFlyerNoOffersUrl(), SOURCE_URL);
  });

  it('parses NOK weekly promotion rows from flyer markup', () => {
    const rows = parseJokerFlyerNoPromotions(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'joker-no',
      code: 'joker-1',
      name: 'Tine Lettmelk 1 l',
      category: 'dairy',
      promotionType: 'weekly_flyer',
      price: 19.9,
      priceText: '19,90',
      comparePriceText: '19,90/l',
      validFrom: '2026-05-20',
      validTo: '2026-05-26',
      productUrl: 'https://joker.no/produkt/lettmelk',
      imageUrl: 'https://joker.no/img/melk.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.currency, 'NOK');
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchJokerFlyerNoPromotions({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('joker-flyer-no-connector'), true);
    await assert.rejects(
      () => fetchJokerFlyerNoPromotions({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when no flyer rows are present', () => {
    assert.throws(() => parseJokerFlyerNoPromotions('<main>Ingen tilbud</main>', SOURCE_URL, RETRIEVED_AT), /no parseable weekly promotion rows/);
  });
});
