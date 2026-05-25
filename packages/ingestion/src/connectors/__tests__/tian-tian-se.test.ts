import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchTianTianSeAssortment,
  isWhitelistedTianTianSeCategory,
  parseTianTianSeAssortment,
  TIAN_TIAN_SE_CHAIN_STATUS,
  TIAN_TIAN_SE_OFFICIAL_URL,
  verifyTianTianSeChainStatus
} from '../tian-tian-se.js';

const RETRIEVED_AT = '2026-05-25T12:45:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Tian Tian / Asian Express</h1>
  <p>Asian groceries for Sweden with ris, rice, nudlar and noodles.</p>
  <p>Soja, soy sauce and other sauces and condiments for home cooking.</p>
  <p>Fryst frozen dumplings and gyoza.</p>
  <p>Asiatiska varor, pantry staples and kryddor.</p>
  <p>Snacks, chips, godis and kakor.</p>
  <p>Dryck, beverage, tea and bubble tea.</p>
  <p>Kitchenware and gifts are not grocery overlap categories.</p>
</main>`;

describe('Tian Tian SE / Asian Express connector', () => {
  it('documents the verified ethnic_asian chain status', () => {
    const status = verifyTianTianSeChainStatus();

    assert.equal(status, TIAN_TIAN_SE_CHAIN_STATUS);
    assert.equal(status.status, 'verified_asian_grocery_operator');
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.retailer_type, 'ethnic_asian');
    assert.match(status.caveat, /grocery-overlap categories/);
    assert.equal(status.evidence.some((entry) => entry.kind === 'official_site'), true);
  });

  it('emits SE/SEK source-backed rows only for whitelisted grocery-overlap categories', () => {
    const rows = parseTianTianSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.deepEqual(rows.map((row) => row.category), [
      'rice_noodles',
      'sauces_condiments',
      'frozen',
      'pantry',
      'snacks',
      'beverages'
    ]);
    assert.equal(rows.some((row) => /kitchenware/i.test(row.provenance.evidenceText)), false);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'tian-tian',
      operatorName: 'Tian Tian / Asian Express',
      retailer_type: 'ethnic_asian',
      code: 'tian-tian:rice_noodles',
      name: 'Asian rice and noodle assortment',
      category: 'rice_noodles',
      price: null,
      priceText: '',
      available: true,
      sourceUrl: TIAN_TIAN_SE_OFFICIAL_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedTianTianSeCategory('kitchenware'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchTianTianSeAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('tian-tian-se-connector'), true);
    await assert.rejects(
      () => fetchTianTianSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when the source does not prove the Tian Tian / Asian Express operator', () => {
    assert.throws(
      () => parseTianTianSeAssortment('<h1>Asian grocery market</h1><p>rice noodles soy sauce</p>', RETRIEVED_AT),
      /chain evidence missing/
    );
  });
});
