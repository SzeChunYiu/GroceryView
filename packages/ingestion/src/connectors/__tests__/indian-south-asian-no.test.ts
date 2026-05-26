import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchIndianSouthAsianNoAssortment,
  INDIAN_SOUTH_ASIAN_NO_CHAIN_STATUS,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_ABOUT_URL,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_PRIVACY_URL,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL,
  isWhitelistedIndianSouthAsianNoCategory,
  parseIndianSouthAsianNoAssortment,
  parseIndianSouthAsianNoLocations,
  verifyIndianSouthAsianNoChainStatus
} from '../indian-south-asian-no.js';

const RETRIEVED_AT = '2026-05-25T17:00:00.000Z';
const FIXTURE = `<!doctype html><main>
  <h1>Norbygata Engros AS</h1>
  <p>Vi startet vår business med frittstående butikk helt tilbake i 1987 innenfor dagligvarebransjen.</p>
  <p>Vår vareutvalg har hovedsakelig vært innenfor sørasiatisk kjøkken samt sentrale non Food varer.</p>
  <p>I de siste årene har vi kun jobbet med butikk kunder.</p>
  <p>Norbygata Engros AS, Ulvenveien 102, 0581 Oslo. Epost: post@ndnorway.no.</p>
  <nav>
    <a>Krydder</a>
    <a>Linser &laquo;Daal&raquo;/Erter/Bønner</a>
    <a>Flour/Atta/Semolina</a>
    <a>Olje &amp; Ghee</a>
    <a>Ris</a>
  </nav>
  <article>
    <p>Laziza Biryani Masala 100g x 6</p>
    <p>Trs Jeera Cumin Powder 100g x 20</p>
    <p>Regal Juice Nectar Mango (Pakistan) 2L x 6</p>
    <p>Laziza Jelly Strawberry 85g x 6</p>
    <p>Logg inn for pris</p>
  </article>
  <aside>
    <h2>Norbygata Grocery AS</h2>
    <p>Norbygata Dagligvare AS tilbyr et unikt utvalg av eksotiske matvarer, spesielt innenfor Indisk og Pakistansk kjøkken.</p>
    <p>Norbygata Grocery AS har adresse Tøyengata 3, 0190 Oslo, Norway.</p>
  </aside>
</main>`;

describe('Indian South Asian NO / Norbygata connector', () => {
  it('documents that Norbygata clears the retail-plus-wholesale South Asian coverage bar without prices', () => {
    const status = verifyIndianSouthAsianNoChainStatus();

    assert.equal(status, INDIAN_SOUTH_ASIAN_NO_CHAIN_STATUS);
    assert.equal(status.chain, 'norbygata-no');
    assert.equal(status.status, 'verified_retail_wholesale_south_asian_operator');
    assert.equal(status.retailer_type, 'ethnic_indian_south_asian');
    assert.equal(status.minimumVerifiedLocationCount, 2);
    assert.equal(status.qualifiesForChainConnector, true);
    assert.equal(status.qualifiesForLocationConnector, true);
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.match(status.caveat, /null-price assortment/i);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === INDIAN_SOUTH_ASIAN_NO_NORBYGATA_ABOUT_URL), true);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL), true);
    assert.equal(status.evidence.some((entry) => entry.sourceUrl === INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL), true);
  });

  it('parses source-backed retail and wholesale/online Norbygata locations', () => {
    const locations = parseIndianSouthAsianNoLocations(FIXTURE);

    assert.deepEqual(locations.map((location) => location.storeId), [
      'toyengata-retail',
      'ulvenveien-wholesale-online'
    ]);
    assert.equal(locations[0]?.channel, 'retail_store');
    assert.equal(locations[0]?.address, 'Toyengata 3, 0190 Oslo');
    assert.equal(locations[1]?.channel, 'wholesale_online');
    assert.equal(locations[1]?.address, 'Ulvenveien 102, 0581 Oslo');
    assert.equal(locations.every((location) => location.country === 'NO' && location.city === 'Oslo'), true);
  });

  it('emits null-price assortment rows for South Asian grocery-overlap categories only', () => {
    const rows = parseIndianSouthAsianNoAssortment(
      FIXTURE,
      RETRIEVED_AT,
      [
        INDIAN_SOUTH_ASIAN_NO_NORBYGATA_ABOUT_URL,
        INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL,
        INDIAN_SOUTH_ASIAN_NO_NORBYGATA_PRIVACY_URL,
        INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL
      ]
    );

    assert.equal(rows.length, 14);
    assert.deepEqual([...new Set(rows.map((row) => row.category))], [
      'spices_masala',
      'rice_grains',
      'lentils_daal',
      'flour_atta',
      'oil_ghee',
      'sweets_snacks',
      'juice_beverages'
    ]);
    assert.equal(rows.every((row) => row.price === null && row.priceText === ''), true);
    assert.equal(rows.some((row) => /klær|restaurant/i.test(row.provenance.evidenceText)), false);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'norbygata-no',
      operatorName: 'Norbygata Dagligvare / Norbygata Engros',
      retailer_type: 'ethnic_indian_south_asian',
      code: 'norbygata-no:toyengata-retail:spices_masala',
      name: 'South Asian spices and masala mixes',
      category: 'spices_masala',
      price: null,
      priceText: '',
      available: true,
      storeId: 'toyengata-retail',
      storeName: 'Norbygata Dagligvare',
      city: 'Oslo',
      address: 'Toyengata 3, 0190 Oslo',
      channel: 'retail_store',
      sourceUrl: INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(isWhitelistedIndianSouthAsianNoCategory('restaurant'), false);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchIndianSouthAsianNoAssortment({
      sourceUrls: [INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL],
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 3
    });

    assert.equal(rows.length, 3);
    assert.equal(JSON.stringify(headers[0]).includes('indian-south-asian-no-connector'), true);
    await assert.rejects(
      () => fetchIndianSouthAsianNoAssortment({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when sources do not prove both the South Asian focus and two locations', () => {
    assert.throws(
      () => parseIndianSouthAsianNoAssortment('<h1>Norbygata Engros</h1><p>Ulvenveien 102</p>', RETRIEVED_AT),
      /South Asian grocery evidence missing/
    );
    assert.throws(
      () => parseIndianSouthAsianNoAssortment('<h1>Norbygata Engros</h1><p>sørasiatisk kjøkken</p><p>Ulvenveien 102</p>', RETRIEVED_AT),
      /at least two verified Norbygata/
    );
  });
});
