import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_REKLAMBLAD_SE_SOURCE_URLS,
  fetchReklambladSeDeals,
  parseReklambladSeDeals,
  REKLAMBLAD_SE_BASE_URL
} from '../reklamblad-se.js';

const RETRIEVED_AT = '2026-05-25T19:00:00.000Z';
const SOURCE_URL = `${REKLAMBLAD_SE_BASE_URL}/butiker/willys/erbjudanden`;
const FIXTURE = `<!doctype html><main>
  <a class="js-offer-link-item grid__row-item" href="/visa/erbjudanden/willys-reklamblad-1?offer=6201#page=1" title="Willys Bananer erbjuda" data-offer-id="6201">
    <div class="product">
      <div class="store-image"><img alt="Willys" src="https://img.offers-cdn.net/assets/uploads/stores/se/logos/willys.webp"></div>
      <div data-offer-name="Bananer" class="js-shopping-list-btn-add-item"></div>
      <div class="product__image"><picture><img alt="Willys Bananer erbjuda" src="https://img.offers-cdn.net/assets/uploads/offers/se/6201/bananer.webp"></picture></div>
      <h3 class="product__name txt-title"> Bananer </h3>
      <div class="product-date txt-xs"> 5 dagar </div>
      <div class="product__price-offer m-0 quality-price--none"> 19,90 kr </div>
    </div>
  </a>
  <a class="js-offer-link-item grid__row-item" href="/butiker/willys/erbjudanden/kaffe-medlemspris-erbjudande-6202/" title="Willys Kaffe Medlemspris erbjuda" data-offer-id="6202">
    <div class="product">
      <div class="store-image"><img alt="Willys" src="https://img.offers-cdn.net/assets/uploads/stores/se/logos/willys.webp"></div>
      <h3 class="product__name txt-title"> Kaffe Medlemspris </h3>
      <div class="product-date txt-xs"> 3 dagar </div>
      <div class="product__price-offer m-0 quality-price--none"> 49,00 kr </div>
    </div>
  </a>
</main>`;

describe('Reklamblad.se weekly deal connector', () => {
  it('parses current deal cards as SEK price observations', () => {
    const rows = parseReklambladSeDeals(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      source: 'reklamblad-se',
      chain: 'willys',
      code: '6201',
      name: 'Bananer',
      storeName: 'Willys',
      price: 19.9,
      priceText: '19,90 kr',
      validRemainingText: '5 dagar',
      productUrl: 'https://www.reklambladerbjudanden.se/visa/erbjudanden/willys-reklamblad-1?offer=6201#page=1',
      imageUrl: 'https://img.offers-cdn.net/assets/uploads/offers/se/6201/bananer.webp',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      is_deal: true,
      is_member_price: false,
      promotionType: 'weekly_flyer',
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.is_member_price, true);
    assert.equal(rows[1]?.price, 49);
  });

  it('fetches default chain pages with connector headers and maxRows', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchReklambladSeDeals({
      sourceUrls: DEFAULT_REKLAMBLAD_SE_SOURCE_URLS.slice(0, 2),
      retrievedAt: RETRIEVED_AT,
      maxRows: 1,
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        assert.equal(JSON.stringify(init?.headers).includes('reklamblad-se-connector'), true);
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(requestedUrls.length, 1);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.is_deal, true);
  });

  it('rejects unsupported sources, blocked responses, and empty pages', async () => {
    assert.throws(() => parseReklambladSeDeals(FIXTURE, 'https://example.com/butiker/willys/erbjudanden', RETRIEVED_AT), /only accepts/);
    assert.throws(() => parseReklambladSeDeals('<main>captcha</main>', SOURCE_URL, RETRIEVED_AT), /blocked\/login/);
    assert.throws(() => parseReklambladSeDeals('<main>Inga erbjudanden</main>', SOURCE_URL, RETRIEVED_AT), /no parseable/);
    await assert.rejects(
      () => fetchReklambladSeDeals({ sourceUrl: SOURCE_URL, fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked/
    );
  });
});
