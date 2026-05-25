import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ASIA_SUPERMARKET_GBG_CHAIN,
  ASIA_SUPERMARKET_GBG_SOURCE_URL,
  ASIA_SUPERMARKET_GBG_VERIFIED_STORES,
  fetchAsiaSupermarketGbgAssortment,
  isWhitelistedAsiaSupermarketGbgCategory,
  parseAsiaSupermarketGbgAssortment,
  parseAsiaSupermarketGbgCategories,
  verifyAsiaSupermarketGbgChainStatus,
  type AsiaSupermarketGbgStore
} from '../asia-supermarket-gbg-se.js';

const RETRIEVED_AT = '2026-05-25T13:20:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Välkommen till Asian Food Store – en liten del av Asien i Kville Saluhall.</h1>
  <p>Här hittar ni mängder av populära produkter så som gyoza, dumplings, alla möjliga sorters nudlar, moshi, kimchi, sticky rice, jasminris, frysta jätteräkor, asiatiska såser och marinader, matcha, snacks, sötsaker, drickor och mycket annat spännande från bl a Vietnam, Filipinerna, Thailand, Sydkorea, Japan och Kina.</p>
  <p>Gustaf Dalénsgatan 2, 417 22 Göteborg</p>
</main>`;

const THREE_STORES: AsiaSupermarketGbgStore[] = [
  ...ASIA_SUPERMARKET_GBG_VERIFIED_STORES,
  {
    storeId: 'nordstan-pop-up',
    name: 'Asian Food Store Nordstan pop-up',
    address: 'Lilla Klädpressaregatan 15, 411 05 Göteborg',
    city: 'Göteborg',
    country: 'SE',
    sourceUrl: ASIA_SUPERMARKET_GBG_SOURCE_URL
  },
  {
    storeId: 'angered-market',
    name: 'Asian Food Store Angered market',
    address: 'Hjällbovägen 103, 424 69 Angered',
    city: 'Göteborg',
    country: 'SE',
    sourceUrl: ASIA_SUPERMARKET_GBG_SOURCE_URL
  }
];

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Asia Supermarket Gothenburg SE connector', () => {
  it('skips the default Gothenburg Asian Food Store candidate because fewer than three stores are verified', () => {
    const status = verifyAsiaSupermarketGbgChainStatus();
    const result = parseAsiaSupermarketGbgAssortment(FIXTURE, RETRIEVED_AT);

    assert.equal(status?.status, 'skipped_below_chain_threshold');
    assert.equal(status?.storeCount, 1);
    assert.match(status?.note ?? '', /fewer than three stores/);
    assert.deepEqual(result.rows, []);
    assert.equal(result.skipped?.qualifiesForChainConnector, false);
    assert.equal(result.skipped?.evidence[0]?.sourceUrl, ASIA_SUPERMARKET_GBG_SOURCE_URL);
  });

  it('emits normalized ethnic_asian assortment rows only when chain evidence reaches three stores', () => {
    const result = parseAsiaSupermarketGbgAssortment(FIXTURE, RETRIEVED_AT, ASIA_SUPERMARKET_GBG_SOURCE_URL, { stores: THREE_STORES });

    assert.equal(result.skipped, null);
    assert.equal(result.rows.length, 21);
    assert.deepEqual([...new Set(result.rows.map((row) => row.category))], [
      'pantry',
      'rice_noodles',
      'frozen',
      'seafood',
      'sauces_condiments',
      'snacks',
      'beverages'
    ]);
    assert.deepEqual(result.rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: ASIA_SUPERMARKET_GBG_CHAIN,
      retailer_type: 'ethnic_asian',
      code: 'asia-supermarket-gbg:kville-saluhall:pantry',
      name: 'Asian pantry assortment',
      category: 'pantry',
      price: null,
      priceText: '',
      available: true,
      storeId: 'kville-saluhall',
      storeName: 'Asian Food Store Kville Saluhall',
      city: 'Göteborg',
      address: 'Gustaf Dalénsgatan 2, 417 22 Göteborg',
      sourceUrl: ASIA_SUPERMARKET_GBG_SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: result.rows[0]?.provenance
    });
  });

  it('uses overlap category whitelist semantics', () => {
    const categories = parseAsiaSupermarketGbgCategories(FIXTURE);

    assert.equal(categories.some((category) => category.category === 'pantry'), true);
    assert.equal(isWhitelistedAsiaSupermarketGbgCategory('newspapers_books'), false);
    assert.equal(isWhitelistedAsiaSupermarketGbgCategory('sauces_condiments'), true);
  });

  it('fetches with connector headers, supports maxRows, and rejects blocked HTTP responses', async () => {
    const headers: HeadersInit[] = [];
    const result = await fetchAsiaSupermarketGbgAssortment({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return response(FIXTURE);
      },
      retrievedAt: RETRIEVED_AT,
      stores: THREE_STORES,
      maxRows: 2
    });

    assert.equal(result.rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('asia-supermarket-gbg-se-connector'), true);
    await assert.rejects(
      () => fetchAsiaSupermarketGbgAssortment({ fetchImpl: async () => response('blocked', 403) }),
      /blocked with HTTP 403/
    );
  });
});
