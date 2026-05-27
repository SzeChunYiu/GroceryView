import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildKiwiNoPriceCheckUrl,
  fetchKiwiNoPriceCheckObservations,
  kiwiNoAccessResearch,
  parseKiwiNoPriceCheckObservations
} from '../kiwi-no.js';

const OBSERVED_AT = '2026-05-25T18:30:00.000Z';
const SOURCE_URL = 'https://kiwi.no/dagligvarer/prissjekk';
const FIXTURE = `<!doctype html><main>
  <h1>Prissjekk</h1>
  <p>Finner vi en lik vare, med samme vekt eller størrelse, til en lavere pris, setter vi ned prisen så raskt som mulig!*</p>
  <p>Merk at enkelte produkter ikke nødvendigvis finnes i alle KIWI-butikker. Med forbehold om trykkfeil og utsolgtsituasjoner.</p>
  <p>* Unntak ved medlemstilbud/fordelsprogram, partikjøp og lokale tilbud.</p>
  <h2>Uke 21</h2>
  <p>Gjelder til og med 24.05.2026.</p>
  <p>VARETEKST GAMMEL UTPRIS NY UTPRIS LAVESTE PRIS SISTE 30 DAGENE</p>
  <p>EVERGOOD FILTERMALT 500G 129,00 77,40 129,00</p>
  <p>STARBUCKS PROTEIN CARAMEL HAZELNUT 330ML 28,90 23,1 28,90</p>
  <p>BROKKOLI STK 14,90</p>
</main>`;

describe('KIWI Norway price-check connector', () => {
  it('documents access constraints for fixture-only public price-check parsing', () => {
    assert.equal(buildKiwiNoPriceCheckUrl(), SOURCE_URL);
    assert.equal(kiwiNoAccessResearch.status, 'fixture_parser_allowed_public_price_check_only');
    assert.ok(kiwiNoAccessResearch.constraints.some((constraint) => constraint.includes('Do not emit unit prices')));
  });

  it('parses public KIWI price-check rows without inventing unit or member prices', () => {
    const rows = parseKiwiNoPriceCheckObservations(FIXTURE, SOURCE_URL, OBSERVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'kiwi-no',
      code: 'kiwi-no-evergood-filtermalt-500g',
      name: 'EVERGOOD FILTERMALT 500G',
      regularPrice: 129,
      regularPriceText: '129,00',
      offerPrice: 77.4,
      offerPriceText: '77,40',
      memberPrice: null,
      memberPriceText: '',
      memberOnly: false,
      lowestPriceLast30Days: 129,
      lowestPriceLast30DaysText: '129,00',
      unitPrice: null,
      unitPriceText: '',
      unitPriceUnit: '',
      unitPriceEvidence: 'not_published_in_kiwi_prissjekk_row',
      storeScope: 'kiwi_no_assortment_may_vary_by_store',
      sourceUrl: SOURCE_URL,
      observedAt: OBSERVED_AT,
      validTo: '24.05.2026',
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.offerPrice, 23.1);
    assert.equal(rows[2]?.regularPrice, null);
    assert.equal(rows[2]?.offerPrice, 14.9);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchKiwiNoPriceCheckObservations({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      observedAt: OBSERVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('kiwi-no-price-check-connector'), true);
    await assert.rejects(
      () => fetchKiwiNoPriceCheckObservations({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when no KIWI price-check rows are present', () => {
    assert.throws(() => parseKiwiNoPriceCheckObservations('<main>Ingen priser</main>', SOURCE_URL, OBSERVED_AT), /no parseable price rows/);
  });
});
