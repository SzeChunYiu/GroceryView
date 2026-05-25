import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS } from '../all-store-runner.js';
import {
  fetchHalalCenterSeAssortment,
  isWhitelistedHalalCenterSeCategory,
  parseHalalCenterSeAssortment,
  parseHalalCenterSeStores,
  verifyHalalCenterSeChainStatus
} from '../halal-center-se.js';

const RETRIEVED_AT = '2026-05-25T13:10:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Halal Center</h1>
  <p>Beställ från vår online webbshop med leverans i Sverige.</p>
  <p>Halal kött, nötkött, kyckling och lamm för familjens veckohandling.</p>
  <p>Ris, mjöl, kryddor, konserv och olja finns i skafferiet.</p>
  <p>Fryst kebab och andra frozen halal staples.</p>
  <p>Mejeri, ost, yoghurt och kyld dryck.</p>
  <p>Halal Center Stockholm</p>
</main>`;

describe('Halal Center SE connector', () => {
  it('documents kosher/halal retailer type and national online qualification', () => {
    const status = verifyHalalCenterSeChainStatus();

    assert.equal(status.chain, 'halal-center');
    assert.equal(status.country, 'SE');
    assert.equal(status.retailer_type, 'kosher_halal');
    assert.equal(status.status, 'verified_national_online_presence');
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.evidence.some((entry) => entry.kind === 'online_store'), true);
  });

  it('parses stores and emits only grocery-overlap assortment rows', () => {
    const stores = parseHalalCenterSeStores(FIXTURE);
    const rows = parseHalalCenterSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.deepEqual(stores.map((store) => store.storeId), ['stockholm']);
    assert.deepEqual(rows.map((row) => row.category), ['meat_halal', 'pantry', 'frozen', 'dairy']);
    assert.equal(rows.every((row) => row.country === 'SE' && row.currency === 'SEK' && row.chain === 'halal-center'), true);
    assert.equal(rows.every((row) => row.retailer_type === 'kosher_halal'), true);
    assert.equal(isWhitelistedHalalCenterSeCategory('newspapers_books'), false);
  });

  it('fetches fixture pages, honors maxRows, and registers the all-store runner connector key', async () => {
    const rows = await fetchHalalCenterSeAssortment({
      fetchImpl: async () => new Response(FIXTURE, { status: 200 }),
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.code, 'halal-center:stockholm:meat_halal');
    assert.ok(ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS.includes('halal-center-se-kosher-halal-products'));
  });

  it('fails closed without three stores or national online presence and rejects blocked responses', async () => {
    assert.throws(() => parseHalalCenterSeAssortment('<h1>Halal Center</h1><p>Halal kött och ris.</p>', RETRIEVED_AT), /three stores or national online presence/);
    await assert.rejects(
      () => fetchHalalCenterSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
