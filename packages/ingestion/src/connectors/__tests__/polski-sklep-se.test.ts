import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchPolskiSklepSeAssortment,
  isWhitelistedPolskiSklepSeCategory,
  parsePolskiSklepSeAssortment,
  parsePolskiSklepSeStores,
  POLSKI_SKLEP_SE_CHAIN_STATUS,
  POLSKI_SKLEP_SE_POLMARKET_URL,
  verifyPolskiSklepSeChainStatus
} from '../polski-sklep-se.js';

const RETRIEVED_AT = '2026-05-25T12:10:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Välkommen till butikskedjan Polmarket</h1>
  <p>Hos oss hittar du ett utbud på närmare 5000 polska artiklar.</p>
  <p>I brödavdelningen hittar du dagligen färskt levererat polskt bröd, munkar, bullar och olika bakelse.</p>
  <p>Manuell charkdisk erbjuder stort sortiment av traditionella korvar, skinkor, ostar och massor av olika charkuterier.</p>
  <p>Hos oss hittar du också polska tidningar, böcker och mycket mer.</p>
  <h4>Vällingby</h4><p>Grimstagatan 53, 162 57 Vällingby</p>
  <h4>Huvudsta Centrum</h4><p>Storgatan 70 A-C, 171 52 Solna</p>
  <h4>Hallunda Centrum</h4><p>Hallunda torg, 145 68 Norsborg</p>
</main>`;

describe('Polski Sklep SE / Polmarket connector', () => {
  it('documents that the connector targets the verified Polmarket chain, not generic Polish delis', () => {
    const status = verifyPolskiSklepSeChainStatus();

    assert.equal(status, POLSKI_SKLEP_SE_CHAIN_STATUS);
    assert.equal(status.status, 'verified_three_store_chain');
    assert.equal(status.storeCount, 3);
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.retailer_type, 'ethnic_polish_eastern_european');
    assert.match(status.caveat, /generic Polish-store phrase/);
    assert.equal(status.evidence.some((entry) => entry.kind === 'official_site'), true);
    assert.equal(status.evidence.some((entry) => entry.kind === 'directory_listing'), true);
  });

  it('parses the three official Polmarket locations from the chain page', () => {
    const stores = parsePolskiSklepSeStores(FIXTURE);

    assert.deepEqual(stores.map((store) => store.storeId), ['vallingby', 'huvudsta', 'hallunda']);
    assert.equal(stores[0]?.address, 'Grimstagatan 53, 162 57 Vällingby');
    assert.equal(stores[1]?.city, 'Solna');
    assert.equal(stores[2]?.sourceUrl, POLSKI_SKLEP_SE_POLMARKET_URL);
  });

  it('emits source-backed assortment rows only for grocery-overlap categories', () => {
    const rows = parsePolskiSklepSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.equal(rows.length, 12);
    assert.deepEqual([...new Set(rows.map((row) => row.category))], ['bakery', 'meat_deli', 'dairy', 'pantry']);
    assert.equal(rows.some((row) => row.category === 'bakery' && /tidningar|böcker/i.test(row.provenance.evidenceText)), false);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'polski-sklep',
      operatorName: 'Polmarket',
      retailer_type: 'ethnic_polish_eastern_european',
      code: 'polski-sklep:vallingby:bakery',
      name: 'Polish bread and bakery assortment',
      category: 'bakery',
      price: null,
      priceText: '',
      available: true,
      storeId: 'vallingby',
      storeName: 'Polmarket Vällingby',
      city: 'Vällingby',
      address: 'Grimstagatan 53, 162 57 Vällingby',
      sourceUrl: POLSKI_SKLEP_SE_POLMARKET_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedPolskiSklepSeCategory('newspapers_books'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchPolskiSklepSeAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('polski-sklep-se-connector'), true);
    await assert.rejects(
      () => fetchPolskiSklepSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when the source does not prove at least three stores', () => {
    assert.throws(
      () => parsePolskiSklepSeAssortment('<h1>Välkommen till butikskedjan Polmarket</h1><p>Grimstagatan 53, 162 57 Vällingby</p>', RETRIEVED_AT),
      /at least three verified Polmarket stores/
    );
  });
});
