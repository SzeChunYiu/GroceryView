import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AFROSHOP_SE_CHAIN_STATUS,
  AFROSHOP_SE_AFROSHOP_URL,
  fetchAfroshopSeAssortment,
  isWhitelistedAfroshopSeCategory,
  parseAfroshopSeAssortment,
  parseAfroshopSeStores,
  verifyAfroshopSeChainStatus
} from '../afroshop-se.js';

const RETRIEVED_AT = '2026-05-25T13:05:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>AfroShop Stockholm African groceries</h1>
  <p>Visit AfroShop at Järnagatan 7, 124 65 Stockholm for African food.</p>
  <p>African Centre Sweden Göteborg location at Nordhemsgatan 66, 413 09 Göteborg.</p>
  <p>Grocery range includes garri, fufu, yam flour, black-eyed beans, palm oil, egusi, suya spice, stockfish, goat meat, malt drink and ginger beer.</p>
  <p>Hair extensions, cosmetics and textiles are also sold but should not become grocery rows.</p>
</main>`;

describe('AfroShop SE / African Centre connector', () => {
  it('documents a verified Swedish ethnic_african multi-location coverage group', () => {
    const status = verifyAfroshopSeChainStatus();

    assert.equal(status, AFROSHOP_SE_CHAIN_STATUS);
    assert.equal(status.chain, 'afroshop');
    assert.equal(status.retailer_type, 'ethnic_african');
    assert.equal(status.status, 'verified_multi_location_specialty');
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.storeCount, 2);
    assert.match(status.caveat, /beauty, hair, textile/);
  });

  it('parses multiple Swedish African specialty locations from source text', () => {
    const stores = parseAfroshopSeStores(FIXTURE);

    assert.deepEqual(stores.map((store) => store.storeId), ['stockholm-afroshop', 'african-centre-sweden']);
    assert.equal(stores[0]?.country, 'SE');
    assert.equal(stores[1]?.city, 'Göteborg');
  });

  it('emits only whitelisted grocery-overlap categories with Swedish SEK metadata', () => {
    const rows = parseAfroshopSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.equal(rows.length, 10);
    assert.deepEqual([...new Set(rows.map((row) => row.category))], ['grains_flours', 'legumes', 'spices_sauces', 'frozen_meat_fish', 'beverages']);
    assert.equal(rows.some((row) => /Hair|cosmetics|textiles/i.test(row.name)), false);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'afroshop',
      operatorName: 'AfroShop / African Centre Sweden',
      retailer_type: 'ethnic_african',
      code: 'afroshop:stockholm-afroshop:grains_flours',
      name: 'African grains and flours assortment',
      category: 'grains_flours',
      price: null,
      priceText: '',
      available: true,
      storeId: 'stockholm-afroshop',
      storeName: 'AfroShop Stockholm',
      city: 'Stockholm',
      address: rows[0]?.address,
      sourceUrl: AFROSHOP_SE_AFROSHOP_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedAfroshopSeCategory('hair_beauty'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchAfroshopSeAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      sourceUrls: [AFROSHOP_SE_AFROSHOP_URL],
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('afroshop-se-connector'), true);
    await assert.rejects(
      () => fetchAfroshopSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
