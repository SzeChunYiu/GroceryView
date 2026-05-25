import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BEST_NO_CURRENT_URL, fetchBestNoRows, parseBestNoRows } from '../best-no.js';

const RETRIEVED_AT = '2026-05-25T15:10:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>YX Norge - Din lokale stasjon for drivstoff og service</h1>
  <p>Best stasjonene omprofileres til YX - fortsatt de samme menneskene, avtalene og service som før.</p>
  <p>Fra drivstoff og elbillading til mat, drikke og bilvask får du det du trenger.</p>
  <p>95 Blyfri, 98 Blyfri, Diesel, Avgiftsfri Diesel, HVO 100 og AdBlue.</p>
  <p>Som Coop-medlem får du bonus på drivstoff, og på mange av stasjonene våre kan du bestille mat i YX-appen.</p>
</main>`;

describe('Best NO connector', () => {
  it('emits source-backed legacy Best/YX fuel and station metadata rows', () => {
    const rows = parseBestNoRows({ html: FIXTURE, sourceUrl: BEST_NO_CURRENT_URL, retrievedAt: RETRIEVED_AT });

    assert.deepEqual(rows.map((row) => row.id), [
      'best-no-legacy-brand-status',
      'best-no-fuel-station-services',
      'best-no-station-food',
      'best-no-coop-member-fuel-benefit'
    ]);
    assert.deepEqual(rows[0], {
      id: 'best-no-legacy-brand-status',
      chain: 'best-no',
      country: 'NO',
      currency: 'NOK',
      domain: 'fuel',
      category: 'legacy_brand_status',
      product: 'Best Norway legacy station brand status',
      price: null,
      unit: 'metadata',
      customerSegment: 'consumer',
      channel: 'station',
      brandStatus: 'legacy_best_rebranded_to_yx',
      sourceUrl: BEST_NO_CURRENT_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.category === 'station_food')?.domain, 'convenience');
    assert.equal(rows.find((row) => row.category === 'member_fuel_benefit')?.currency, 'NOK');
  });

  it('fails closed for blocked pages, wrong domains, and missing evidence', () => {
    assert.throws(
      () => parseBestNoRows({ html: 'captcha access denied', sourceUrl: BEST_NO_CURRENT_URL, retrievedAt: RETRIEVED_AT }),
      /blocked\/login/
    );
    assert.throws(
      () => parseBestNoRows({ html: FIXTURE, sourceUrl: 'https://example.com/', retrievedAt: RETRIEVED_AT }),
      /only accepts best\.no/
    );
    assert.throws(
      () => parseBestNoRows({ html: '<main>Drivstoff og mat</main>', sourceUrl: BEST_NO_CURRENT_URL, retrievedAt: RETRIEVED_AT }),
      /brand status/
    );
  });

  it('fetches with connector headers and blocked-response handling', async () => {
    const requestedHeaders: Array<HeadersInit | undefined> = [];
    const rows = await fetchBestNoRows({
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async (_input, init) => {
        requestedHeaders.push(init?.headers);
        return new Response(FIXTURE, { status: 200 });
      }
    });

    assert.equal(rows.length, 4);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('best-no-connector'), true);
    await assert.rejects(
      () => fetchBestNoRows({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
