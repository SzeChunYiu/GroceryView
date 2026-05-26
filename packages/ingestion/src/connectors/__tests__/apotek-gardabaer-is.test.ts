import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  APOTEK_GARDABAER_IS_CATALOGUE_STATUS,
  APOTEK_GARDABAER_IS_PRODUCTS_URL,
  fetchApotekGardabaerIsProducts,
  parseApotekGardabaerIsProducts,
  verifyApotekGardabaerIsCatalogueStatus
} from '../apotek-gardabaer-is.js';

const RETRIEVED_AT = '2026-05-25T15:30:00.000Z';
const FIXTURE = `<!doctype html><main>
<h1>Vörur</h1>
<p>Apótek Garðabæjar býður upp á gott vöruúrval. Við erum að sjálfsögðu með öll helstu lyf og lausasölulyf.
Gott úrval af hjúkrunarvörum, mikið af vítamínum og fæðubótarefnum og snyrtivörur á góðu verði.
Með því að smella á slóðirnar hér fyrir neðan má sjá nánari upplýsingar um ýmsar vörur sem fást hjá okkur.</p>
<p><a href="https://www.weleda.is/">welada.is</a><br>
<a href="www.eucerin.com">www.eucerin.com</a><br>
<a href="heilsa.is">heilsa.is</a><br>
<a href="yggdrasill.is">yggdrasill.is</a></p>
</main>`;

describe('Apótek Garðabæjar IS connector', () => {
  it('documents that the official source has assortment rows but no public prices', () => {
    const status = verifyApotekGardabaerIsCatalogueStatus();

    assert.equal(status, APOTEK_GARDABAER_IS_CATALOGUE_STATUS);
    assert.equal(status.status, 'verified_official_assortment_no_prices');
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.match(status.caveat, /no public product price feed/);
  });

  it('parses official WordPress product-page assortment categories and vendor links', () => {
    const rows = parseApotekGardabaerIsProducts(FIXTURE, APOTEK_GARDABAER_IS_PRODUCTS_URL, RETRIEVED_AT);

    assert.equal(rows.length, 8);
    assert.deepEqual(rows.slice(0, 4).map((row) => row.code), [
      'apotek-gardabaer-is-lausasolu-lyf',
      'apotek-gardabaer-is-hjukrunarvorur',
      'apotek-gardabaer-is-vitamin-og-faedu-botarefni',
      'apotek-gardabaer-is-snyrtivorur'
    ]);
    assert.deepEqual(rows[0], {
      country: 'IS',
      currency: 'ISK',
      chain: 'apotek-gardabaer-is',
      retailerType: 'pharmacy',
      code: 'apotek-gardabaer-is-lausasolu-lyf',
      name: 'Lausasölulyf',
      category: 'otc',
      categorySlug: 'lausasolu-lyf',
      price: null,
      priceText: '',
      available: true,
      productUrl: `${APOTEK_GARDABAER_IS_PRODUCTS_URL}#lausasolu-lyf`,
      brandUrl: '',
      sourceUrl: APOTEK_GARDABAER_IS_PRODUCTS_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.code === 'apotek-gardabaer-is-brand-eucerin-com')?.brandUrl, 'https://www.eucerin.com');
    assert.equal(rows.find((row) => row.code === 'apotek-gardabaer-is-brand-heilsa-is')?.category, 'supplement');
    assert.equal(rows.every((row) => row.price === null), true);
  });

  it('rejects non-Apótek Garðabæjar sources and empty product pages', () => {
    assert.throws(
      () => parseApotekGardabaerIsProducts(FIXTURE, 'https://example.com/vorur/', RETRIEVED_AT),
      /apotekgb\.is source URLs/
    );
    assert.deepEqual(parseApotekGardabaerIsProducts('<main>No pharmacy assortment</main>', APOTEK_GARDABAER_IS_PRODUCTS_URL, RETRIEVED_AT), []);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchApotekGardabaerIsProducts({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 2
    });

    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('apotek-gardabaer-is-connector'), true);
    await assert.rejects(
      () => fetchApotekGardabaerIsProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
