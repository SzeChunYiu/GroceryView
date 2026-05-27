import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchMiddleEasternNoAssortment,
  isWhitelistedMiddleEasternNoCategory,
  MIDDLE_EASTERN_NO_CHAIN_STATUS,
  MIDDLE_EASTERN_NO_IMS_CITYCON_URL,
  MIDDLE_EASTERN_NO_IMS_KILDEN_URL,
  parseMiddleEasternNoAssortment,
  parseMiddleEasternNoStores,
  verifyMiddleEasternNoChainStatus
} from '../middle-eastern-no.js';

const RETRIEVED_AT = '2026-05-25T13:30:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Internasjonal matsenter (IMS) med østlandssatsing på Torget Vest</h1>
  <p>IMS er kjent for sine eksotiske dagligvarer, halal ferskt kjøtt og eget bakeri med naanbrød.</p>
  <p>IMS har base i Rogaland hvor de etablerte de første butikkene i Stavanger og Sandnes. Nå tar de det internasjonale konseptet til Østlandet og Torget Vest.</p>
  <p>Internasjonal matsenter tilbyr matvarer fra hele verden. Kundene får fersk frukt og ferske grønnsaker som man ikke finner i vanlige dagligvarebutikker. Et rikt utvalg av fersk halal kjøtt, krydder og andre typer dagligvarer skal bidra til å begeistre kundene.</p>
  <h2>IMS HILLVEÅG (Tvers over kilden):</h2>
  <p>IMS tilbyr matvarer fra hele verden, ferske og exotiske grønnsaker, halal kjøtt og ferske naanbrød bakt i vårt butikkbakeri.</p>
  <p>IMS Hillevåg ligger like ved Kilden kjøpesenter, i Gartnerveien 25.</p>
</main>`;

describe('Middle Eastern NO / IMS connector', () => {
  it('documents that IMS clears the multi-location ethnic Middle Eastern coverage bar without merging independent stores', () => {
    const status = verifyMiddleEasternNoChainStatus();

    assert.equal(status, MIDDLE_EASTERN_NO_CHAIN_STATUS);
    assert.equal(status.chain, 'ims-no');
    assert.equal(status.status, 'verified_multi_location_halal_international_market');
    assert.equal(status.minimumVerifiedStoreCount, 3);
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.qualifiesForLocationConnector, true);
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.equal(status.retailer_type, 'ethnic_middle_eastern');
    assert.match(status.caveat, /not.*pure Middle Eastern-only/i);
    assert.match(status.caveat, /null-price assortment/i);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === MIDDLE_EASTERN_NO_IMS_CITYCON_URL), true);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === MIDDLE_EASTERN_NO_IMS_KILDEN_URL), true);
  });

  it('parses source-backed IMS locations from public pages', () => {
    const stores = parseMiddleEasternNoStores(FIXTURE);

    assert.deepEqual(stores.map((store) => store.storeId), ['hillevag', 'sandnes', 'drammen-torget-vest']);
    assert.equal(stores[0]?.address, 'Gartnerveien 25, 4016 Stavanger');
    assert.equal(stores[1]?.city, 'Sandnes');
    assert.equal(stores[2]?.address, 'Torget Vest, Drammen');
    assert.equal(stores.every((store) => store.country === 'NO'), true);
  });

  it('emits null-price assortment rows for grocery-overlap categories only', () => {
    const rows = parseMiddleEasternNoAssortment(
      FIXTURE,
      RETRIEVED_AT,
      [MIDDLE_EASTERN_NO_IMS_CITYCON_URL, MIDDLE_EASTERN_NO_IMS_KILDEN_URL]
    );

    assert.equal(rows.length, 15);
    assert.deepEqual([...new Set(rows.map((row) => row.category))], [
      'produce',
      'halal_meat',
      'bakery_naan',
      'spices_pantry',
      'international_grocery'
    ]);
    assert.equal(rows.some((row) => /bøker|klær/i.test(row.provenance.evidenceText)), false);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'ims-no',
      operatorName: 'Internasjonal Matsenter (IMS)',
      retailer_type: 'ethnic_middle_eastern',
      code: 'ims-no:hillevag:produce',
      name: 'Fresh fruit and exotic vegetables',
      category: 'produce',
      price: null,
      priceText: '',
      available: true,
      storeId: 'hillevag',
      storeName: 'IMS Hillevåg',
      city: 'Stavanger',
      address: 'Gartnerveien 25, 4016 Stavanger',
      sourceUrl: MIDDLE_EASTERN_NO_IMS_KILDEN_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedMiddleEasternNoCategory('restaurant'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchMiddleEasternNoAssortment({
      sourceUrls: [MIDDLE_EASTERN_NO_IMS_CITYCON_URL],
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('middle-eastern-no-connector'), true);
    await assert.rejects(
      () => fetchMiddleEasternNoAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when the source does not prove at least three IMS stores', () => {
    assert.throws(
      () => parseMiddleEasternNoAssortment('<h1>Internasjonal matsenter</h1><p>IMS Hillevåg Gartnerveien 25</p>', RETRIEVED_AT),
      /at least three verified IMS store locations/
    );
  });
});
