import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRema1000FlyerNoOffersUrl, fetchRema1000FlyerNoPromotions, parseRema1000FlyerNoPromotions } from '../rema-1000-flyer-no.js';

const RETRIEVED_AT = '2026-05-25T14:15:00.000Z';
const SOURCE_URL = 'https://www.rema.no/kampanjevarer/';
const FIXTURE = `<!doctype html><main>
  <article class="kampanje produkt" data-sku="rema-ae-1" data-category="baby" data-valid-from="2026-05-20" data-valid-to="2026-05-26">
    <a href="/kampanjevarer/bleier"><img src="/img/bleier.jpg" /></a>
    <h2>Spar 50% på bleier</h2>
    <p>Aktiver bleiekuttet i REMA-appen med koden "bleier" og få priskuttet rett i kassa neste gang du handler.</p>
  </article>
  <article class="campaign product" data-sku="rema-ae-2" data-category="produce">
    <a href="/rema-appen/bonus/"><h3>Tjen 10% Bonus på all fersk frukt og grønt</h3></a>
    <p>Du får automatisk 10% Bonus når du betaler med en av betalingsmåtene du har lagt til i REMA-appen eller skanner strekkoden din.</p>
  </article>
  <article class="tilbud product" data-sku="rema-ae-3">
    <h3>Grillpølser</h3><span class="medlemspris">29,90 kr</span><p>Medlemspris i REMA-appen.</p>
  </article>
</main>`;

describe('REMA 1000 NO flyer connector', () => {
  it('builds the REMA campaign URL', () => {
    assert.equal(buildRema1000FlyerNoOffersUrl(), SOURCE_URL);
  });

  it('parses NOK app promotion rows from campaign markup', () => {
    const rows = parseRema1000FlyerNoPromotions(FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'rema-1000-no',
      code: 'rema-ae-1',
      name: 'Spar 50% på bleier',
      category: 'baby',
      promotionType: 'app_discount',
      price: null,
      priceText: '',
      discountText: 'Spar 50%',
      discountPercent: 50,
      is_member_price: true,
      requiresApp: true,
      validFrom: '2026-05-20',
      validTo: '2026-05-26',
      productUrl: 'https://www.rema.no/kampanjevarer/bleier',
      imageUrl: 'https://www.rema.no/img/bleier.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.discountPercent, 10);
    assert.equal(rows[1]?.is_member_price, true);
    assert.equal(rows[2]?.price, 29.9);
    assert.equal(rows[2]?.priceText, '29,90 kr');
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchRema1000FlyerNoPromotions({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('rema-1000-flyer-no-connector'), true);
    await assert.rejects(
      () => fetchRema1000FlyerNoPromotions({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when no campaign rows are present', () => {
    assert.throws(() => parseRema1000FlyerNoPromotions('<main>Ingen kampanjer</main>', SOURCE_URL, RETRIEVED_AT), /no parseable weekly promotion rows/);
  });
});
