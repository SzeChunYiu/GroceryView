import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMenyFlyerNoOffersUrl,
  fetchMenyFlyerNoPromotions,
  parseMenyFlyerNoPromotions
} from '../meny-flyer-no.js';

const RETRIEVED_AT = '2026-05-25T17:30:00.000Z';
const SOURCE_URL = 'https://meny.no/varer/tilbud';
const JSON_FIXTURE = {
  pageProps: {
    products: [
      {
        id: 'meny-weekly-1',
        name: 'Gilde grillpølser 600 g',
        category: 'grillmat',
        offerPrice: { amount: 49.9, formatted: '49,90 kr' },
        unitPriceText: '83,17/kg',
        validFrom: '2026-05-20',
        validTo: '2026-05-26',
        url: '/varer/kjott/polser/gilde-grillpolser',
        imageUrl: '/images/polser.jpg'
      },
      {
        id: 'meny-coffee-1',
        name: 'Evergood filtermalt kaffe',
        category: 'kaffe',
        campaignPrice: '59,90 kr',
        trumfPrice: { amount: 49.9, formatted: '49,90 kr Trumf' },
        campaignName: 'Trumf-medlemspris',
        validFrom: '2026-05-20',
        validTo: '2026-05-26',
        productUrl: '/varer/drikke/kaffe/evergood-filtermalt'
      }
    ]
  }
};

const HTML_FIXTURE = `<!doctype html><main>
  <article class="product tilbud" data-sku="meny-milk" data-category="dairy" data-valid-from="2026-05-20" data-valid-to="2026-05-26">
    <a href="/varer/meieri/melk"><img src="/img/melk.jpg" /></a>
    <h2>Tine lettmelk 1 l</h2><span class="tilbudspris">19,90</span><span class="enhetspris">19,90/l</span>
  </article>
  <article class="product trumf offer" data-sku="meny-trumf">
    <h2>Jacobs Utvalgte pesto</h2><span class="price">39,90 kr</span><span>Trumf medlemspris</span>
  </article>
</main>`;

describe('Meny NO flyer connector', () => {
  it('builds the public Meny offers URL', () => {
    assert.equal(buildMenyFlyerNoOffersUrl(), SOURCE_URL);
  });

  it('parses weekly and Trumf member promotion rows from JSON payloads', () => {
    const rows = parseMenyFlyerNoPromotions(JSON_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'meny-no',
      code: 'meny-weekly-1',
      name: 'Gilde grillpølser 600 g',
      category: 'grillmat',
      promotionType: 'weekly_flyer',
      price: 49.9,
      priceText: '49,90 kr',
      comparePriceText: '83,17/kg',
      memberProgram: null,
      trumfMemberOnly: false,
      validFrom: '2026-05-20',
      validTo: '2026-05-26',
      productUrl: 'https://meny.no/varer/kjott/polser/gilde-grillpolser',
      imageUrl: 'https://meny.no/images/polser.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      structuredPromotion: { kind: 'weekly_price', memberOnly: false },
      provenance: rows[0]?.provenance
    });
    assert.deepEqual(rows.map((row) => [row.code, row.promotionType, row.price]), [
      ['meny-weekly-1', 'weekly_flyer', 49.9],
      ['meny-coffee-1', 'weekly_flyer', 59.9],
      ['meny-coffee-1:trumf', 'trumf_member', 49.9]
    ]);
    assert.equal(rows[2]?.memberProgram, 'Trumf');
    assert.equal(rows[2]?.structuredPromotion.kind, 'member_price');
  });

  it('parses fallback flyer markup and classifies Trumf copy as member-only', () => {
    const rows = parseMenyFlyerNoPromotions(HTML_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.promotionType, 'weekly_flyer');
    assert.equal(rows[0]?.comparePriceText, '19,90/l');
    assert.equal(rows[1]?.promotionType, 'trumf_member');
    assert.equal(rows[1]?.trumfMemberOnly, true);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchMenyFlyerNoPromotions({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(JSON.stringify(JSON_FIXTURE), { headers: { 'content-type': 'application/json' } });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('meny-flyer-no-connector'), true);
    await assert.rejects(
      () => fetchMenyFlyerNoPromotions({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
