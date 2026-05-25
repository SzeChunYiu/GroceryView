import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchLifeSeAssortment,
  isWhitelistedLifeSeCategory,
  LIFE_SE_CHAIN_STATUS,
  LIFE_SE_PRODUCTS_URL,
  LIFE_SE_STORES_URL,
  parseLifeSeAssortment,
  parseLifeSeStores,
  verifyLifeSeChainStatus
} from '../life-se.js';

const RETRIEVED_AT = '2026-05-25T17:45:00.000Z';
const APOLLO_STATE = JSON.stringify({
  'Store:101': {
    __typename: 'Store',
    id: 101,
    name: 'LIFE Stockholm Gallerian',
    address1: '<p>Gallerian, Hamng 37</p><p>11153</p><p>Stockholm</p>',
    city: 'Stockholm',
    contact: '<p>Telefon: 010-543 3460</p><p>Adress: Hamngatan 37, 111 53 Stockholm</p>',
    coordinates: { latitude: 59.331326895, longitude: 18.067467599 }
  },
  'Store:102': {
    __typename: 'Store',
    id: 102,
    name: 'LIFE Göteborg Femmanhuset',
    address1: '<p>Femmanhuset</p><p>41106</p><p>Göteborg</p>',
    city: 'Göteborg',
    contact: '<p>Telefon: 010-543 3411</p><p>Adress: Postgatan 26-32, 411 06 Göteborg</p>',
    coordinates: { latitude: 57.70887, longitude: 11.96958 }
  },
  'Store:103': {
    __typename: 'Store',
    id: 103,
    name: 'LIFE Malmö Triangeln Köpcentrum',
    address1: '<p>Södra Förstadsgatan 41</p><p>21143</p><p>Malmö</p>',
    city: 'Malmö',
    contact: '<p>Telefon: 010-543 3422</p><p>Adress: Södra Förstadsgatan 41, 211 43 Malmö</p>',
    coordinates: { latitude: 55.59581, longitude: 13.0008 }
  },
  'Category:754': {
    __typename: 'Category',
    name: 'Produkter',
    'products({"filters":{"booleanFilters":[],"listFilters":[],"multiListFilters":[],"rangeFilters":[]},"first":24,"offset":0,"orderBy":null,"orderByDirection":"DESCENDING"})': {
      __typename: 'PagedResult',
      totalResults: 1629
    }
  }
});

const FIXTURE = `<!doctype html><main>
  <h1>Produkter</h1>
  <p>Life är nordens ledande hälsokedja</p>
  <p>Life har cirka 130 butiker utspritt i Sverige och Norge med ett brett utbud av hälsoprodukter och personlig hälsorådgivning.</p>
  <nav>
    <a href="/kosttillskott">Kosttillskott</a>
    <a href="/mat-dryck">Mat &amp; Dryck</a>
    <a href="/skonhet">Skönhet &amp; Hygien</a>
    <a href="/hem-livsstil">Hem &amp; Livsstil</a>
    <a href="/traning">Träning</a>
  </nav>
  <p>I butikerna finns hälsosam mat, naturlig hudvård, träningstillskott, vitaminer och mineraler.</p>
  <script>window.__APOLLO_STATE__=JSON.parse(${JSON.stringify(APOLLO_STATE)});</script>
</main>`;

describe('Life SE connector', () => {
  it('documents Life as a national Swedish health-food chain with null-price category coverage', () => {
    const status = verifyLifeSeChainStatus();

    assert.equal(status, LIFE_SE_CHAIN_STATUS);
    assert.equal(status.chain, 'life-se');
    assert.equal(status.retailerType, 'health_food');
    assert.equal(status.status, 'verified_national_health_food_chain');
    assert.equal(status.qualifiesForNationalChain, true);
    assert.equal(status.qualifiesForLocationConnector, true);
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.equal(status.observedSwedenStoreCount >= 50, true);
    assert.equal(status.observedProductCount, 1629);
    assert.match(status.caveat, /null-price health-food category coverage/i);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === LIFE_SE_STORES_URL), true);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === LIFE_SE_PRODUCTS_URL), true);
  });

  it('parses public Apollo store-locator entries from the official store page state', () => {
    const stores = parseLifeSeStores(FIXTURE);

    assert.deepEqual(stores.map((store) => store.storeId), ['101', '102', '103']);
    assert.equal(stores[0]?.country, 'SE');
    assert.equal(stores[0]?.retailerType, 'health_food');
    assert.equal(stores[0]?.address, 'Hamngatan 37, 111 53 Stockholm');
    assert.equal(stores[1]?.city, 'Göteborg');
    assert.equal(stores[2]?.phone, '010-543 3422');
    assert.equal(stores.every((store) => store.productUrl.startsWith('https://www.lifebutiken.se/butiker/')), true);
  });

  it('emits health-food category rows with observed store and product counts', () => {
    const rows = parseLifeSeAssortment(FIXTURE, RETRIEVED_AT);

    assert.equal(rows.length, 5);
    assert.deepEqual(rows.map((row) => row.category), [
      'supplements',
      'food_drink',
      'beauty_hygiene',
      'home_lifestyle',
      'training'
    ]);
    assert.equal(rows.every((row) => row.price === null && row.priceText === ''), true);
    assert.equal(rows[0]?.provenance.observedStoreCount, 3);
    assert.equal(rows[0]?.provenance.observedProductCount, 1629);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'life-se',
      retailerType: 'health_food',
      code: 'life-se:supplements',
      name: 'Supplements and vitamins',
      category: 'supplements',
      price: null,
      priceText: '',
      available: true,
      productUrl: 'https://www.lifebutiken.se/kosttillskott',
      sourceUrl: LIFE_SE_PRODUCTS_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedLifeSeCategory('pharmacy'), false);
  });

  it('fetches product and store pages with connector headers, maxRows, and blocked-response handling', async () => {
    const requests: Array<{ input: RequestInfo | URL; headers: HeadersInit | undefined }> = [];
    const rows = await fetchLifeSeAssortment({
      fetchImpl: async (input, init) => {
        requests.push({ input, headers: init?.headers });
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(requests.length, 2);
    assert.equal(requests.some((request) => String(request.input) === LIFE_SE_PRODUCTS_URL), true);
    assert.equal(requests.some((request) => String(request.input) === LIFE_SE_STORES_URL), true);
    assert.equal(JSON.stringify(requests[0]?.headers).includes('life-se-connector'), true);
    await assert.rejects(
      () => fetchLifeSeAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when national-chain or catalogue evidence is missing', () => {
    assert.throws(
      () => parseLifeSeAssortment('<h1>Life</h1>', RETRIEVED_AT),
      /national-chain store evidence/
    );
    assert.throws(
      () => parseLifeSeAssortment('<h1>Life är nordens ledande hälsokedja</h1><p>Life har cirka 130 butiker</p>', RETRIEVED_AT),
      /product-category total/
    );
  });
});
