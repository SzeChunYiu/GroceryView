import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ANTEP_SE_CHAIN_STATUS,
  ANTEP_SE_SOURCE_URL,
  fetchAntepSeAssortment,
  isWhitelistedAntepSeCategory,
  parseAntepSeAssortment,
  parseAntepSeStores,
  verifyAntepSeChainStatus
} from '../antep-se.js';

const RETRIEVED_AT = '2026-05-25T13:05:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Antep Market</h1>
  <p>Färskt bröd, pide, baklava och bakverk bakas dagligen.</p>
  <p>Frukt, grönt, oliver, halal kött, sucuk, lamm, bulgur, ris, kryddor, tahini och linser.</p>
  <p>Vi säljer inte bara vattenpipor och presentartiklar.</p>
  <h2>Rinkeby</h2><p>Rinkebystråket 12, 163 71 Spånga</p>
  <h2>Fittja</h2><p>Fittjavägen 3, 145 51 Norsborg</p>
</main>`;

describe('Antep SE connector', () => {
  it('documents a multi-store Middle Eastern grocery chain and skipped single shops', () => {
    const status = verifyAntepSeChainStatus();

    assert.equal(status, ANTEP_SE_CHAIN_STATUS);
    assert.equal(status.status, 'verified_multi_store_chain');
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.retailer_type, 'ethnic_middle_eastern');
    assert.match(status.caveat, /one-off Turkish, Lebanese, or Syrian/);
    assert.equal(status.skippedSingleShopNames.includes('Yara Market'), true);
  });

  it('parses verified Antep Market stores', () => {
    const stores = parseAntepSeStores(FIXTURE);

    assert.deepEqual(stores.map((store) => store.storeId), ['rinkeby', 'fittja']);
    assert.equal(stores[0]?.country, 'SE');
    assert.equal(stores[1]?.sourceUrl, ANTEP_SE_SOURCE_URL);
  });

  it('emits only grocery-overlap category rows', () => {
    const rows = parseAntepSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.equal(rows.length, 8);
    assert.deepEqual([...new Set(rows.map((row) => row.category))], ['bakery', 'produce', 'meat_deli', 'pantry']);
    assert.equal(rows.some((row) => /vattenpipor|presentartiklar/i.test(row.provenance.evidenceText)), false);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'antep',
      operatorName: 'Antep Market',
      retailer_type: 'ethnic_middle_eastern',
      code: 'antep:rinkeby:bakery',
      name: 'Middle Eastern bread and bakery assortment',
      category: 'bakery',
      price: null,
      priceText: '',
      available: true,
      storeId: 'rinkeby',
      storeName: 'Antep Market Rinkeby',
      city: 'Stockholm',
      address: 'Rinkebystråket 12, 163 71 Spånga',
      sourceUrl: ANTEP_SE_SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedAntepSeCategory('homewares'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchAntepSeAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('antep-se-connector'), true);
    await assert.rejects(
      () => fetchAntepSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed without multi-store evidence', () => {
    assert.throws(
      () => parseAntepSeAssortment('<h1>Antep Market</h1><p>Rinkebystråket 12, 163 71 Spånga</p>', RETRIEVED_AT),
      /at least two verified Antep Market stores/
    );
  });
});
