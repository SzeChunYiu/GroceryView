import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchKosherDeliSeAssortment,
  isWhitelistedKosherDeliSeCategory,
  KOSHER_DELI_SE_COVERAGE_STATUS,
  KOSHER_DELI_SE_JFST_URL,
  parseKosherDeliSeAssortment,
  parseKosherDeliSeStore,
  verifyKosherDeliSeCoverageStatus
} from '../kosher-deli-se.js';

const RETRIEVED_AT = '2026-05-25T13:05:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Kosherian i Bajit – Makolet</h1>
  <p>Makolet - en livsmedelsbutik för koshervaror från hela världen.</p>
  <p>Hos Makolet finns ett stort urval av köttprodukter, charkuterier, torrvaror, mejeriprodukter, sötsaker m.m.</p>
  <p>Öppettiderna är måndagar - torsdagar 9:00-17:30.</p>
  <p>Bajit, Nybrogatan 19A, Stockholm</p>
</main>`;

describe('Kosher Deli SE / Makolet connector', () => {
  it('documents the limited single-store coverage gap instead of inventing a chain', () => {
    const status = verifyKosherDeliSeCoverageStatus();

    assert.equal(status, KOSHER_DELI_SE_COVERAGE_STATUS);
    assert.equal(status.status, 'limited_single_verified_store');
    assert.equal(status.qualifiesForChainConnector, false);
    assert.equal(status.storeCount, 1);
    assert.equal(status.retailer_type, 'kosher_halal');
    assert.match(status.caveat, /limited-coverage status/);
    assert.equal(status.evidence.some((entry) => entry.kind === 'community_page'), true);
  });

  it('parses the verified Stockholm Makolet location', () => {
    assert.deepEqual(parseKosherDeliSeStore(FIXTURE), {
      storeId: 'makolet-bajit',
      name: 'Makolet i Bajit',
      address: 'Nybrogatan 19A',
      city: 'Stockholm',
      country: 'SE',
      sourceUrl: KOSHER_DELI_SE_JFST_URL
    });
  });

  it('emits source-backed assortment rows only for grocery-overlap categories', () => {
    const rows = parseKosherDeliSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.deepEqual(rows.map((row) => row.category), ['meat_deli', 'dairy', 'pantry']);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'kosher-deli',
      operatorName: 'Makolet i Bajit',
      retailer_type: 'kosher_halal',
      code: 'kosher-deli:makolet-bajit:meat_deli',
      name: 'Kosher meat and deli products',
      category: 'meat_deli',
      price: null,
      priceText: '',
      available: true,
      storeId: 'makolet-bajit',
      storeName: 'Makolet i Bajit',
      city: 'Stockholm',
      address: 'Nybrogatan 19A',
      sourceUrl: KOSHER_DELI_SE_JFST_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedKosherDeliSeCategory('restaurant_catering'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchKosherDeliSeAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('kosher-deli-se-connector'), true);
    await assert.rejects(
      () => fetchKosherDeliSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when the source does not prove Makolet kosher grocery coverage', () => {
    assert.throws(
      () => parseKosherDeliSeAssortment('<h1>Generic deli</h1><p>Nybrogatan 19A</p>', RETRIEVED_AT),
      /did not verify Makolet kosher grocery coverage/
    );
  });
});
