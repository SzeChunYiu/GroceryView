import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchHalaSeAssortment,
  isWhitelistedHalaSeCategory,
  parseHalaSeAssortment,
  parseHalaSeStores,
  verifyHalaSeChainStatus,
  HALA_SE_SOURCE_URL
} from '../hala-se.js';

const RETRIEVED_AT = '2026-05-25T13:05:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Hala Livs Centrum AB</h1>
  <p>Livsmedelshandel med brett sortiment. Hala Livs har polska och östeuropeiska varor.</p>
  <p>Sortiment: bröd, pierogi, fryst mat, kabanos, ost, kefir och konserver.</p>
  <p>Jakobsgatan 89, 724 20 Västerås</p>
</main>`;

describe('Hala SE connector', () => {
  it('verifies the source-backed Hala Livs store count', () => {
    const stores = parseHalaSeStores(FIXTURE);
    const status = verifyHalaSeChainStatus(FIXTURE);

    assert.deepEqual(stores.map((store) => store.storeId), ['vasteras-jakobsgatan']);
    assert.equal(stores[0]?.address, 'Jakobsgatan 89, 724 20 Västerås');
    assert.equal(status.storeCount, 1);
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.retailer_type, 'ethnic_polish_eastern_european');
  });

  it('emits SE/SEK Hala rows only for grocery-overlap whitelist categories', () => {
    const rows = parseHalaSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.deepEqual([...new Set(rows.map((row) => row.category))], ['bakery', 'meat_deli', 'dairy', 'pantry', 'frozen']);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'hala',
      operatorName: 'Hala Livs Centrum AB',
      retailer_type: 'ethnic_polish_eastern_european',
      code: 'hala:vasteras-jakobsgatan:bakery',
      name: 'Eastern European bread and bakery assortment',
      category: 'bakery',
      price: null,
      priceText: '',
      available: true,
      storeId: 'vasteras-jakobsgatan',
      storeName: 'Hala Livs Centrum AB',
      city: 'Västerås',
      address: 'Jakobsgatan 89, 724 20 Västerås',
      sourceUrl: HALA_SE_SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedHalaSeCategory('newspapers_books'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchHalaSeAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('hala-se-connector'), true);
    await assert.rejects(
      () => fetchHalaSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed without Hala identity, verified store, or overlap categories', () => {
    assert.throws(() => parseHalaSeAssortment('<p>Jakobsgatan 89, 724 20 Västerås</p>', RETRIEVED_AT), /did not identify Hala Livs/);
    assert.throws(() => parseHalaSeAssortment('<h1>Hala Livs Centrum AB</h1><p>bröd</p>', RETRIEVED_AT), /at least one verified Hala Livs store/);
    assert.throws(() => parseHalaSeAssortment('<h1>Hala Livs Centrum AB</h1><p>Jakobsgatan 89, 724 20 Västerås</p>', RETRIEVED_AT), /no grocery-overlap categories/);
  });
});
