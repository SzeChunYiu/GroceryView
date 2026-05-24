import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchN1FuelPrices, N1FuelSourceError, parseN1FuelPrices } from '../n1-is.js';

const recordedFixture = JSON.stringify({
  lastUpdated: '2026-05-23T10:15:00.000Z',
  stations: [
    {
      id: 'n1-hringbraut',
      name: 'N1 Hringbraut',
      address: 'Hringbraut 100, Reykjavík',
      lat: 64.1411,
      lon: -21.9496,
      prices: {
        '95': '315,70 kr.',
        diesel: 317.9,
        methane: null
      }
    },
    {
      id: 'n1-akureyri',
      name: 'N1 Akureyri',
      prices: {
        bensin95: '316.4',
        disel: '318,2 ISK',
        diesel: 'not reported'
      }
    },
    {
      id: 'n1-empty',
      name: 'N1 incomplete',
      prices: {
        '95': 0,
        diesel: -1
      }
    },
    {
      id: 'n1-no-name',
      prices: { '95': 310 }
    }
  ]
});

describe('N1 Iceland fuel connector', () => {
  it('parses a recorded fixture into fuel rows with provenance', () => {
    const rows = parseN1FuelPrices({
      body: recordedFixture,
      sourceUrl: 'https://www.n1.is/fixture',
      capturedAt: '2026-05-24T08:00:00.000Z',
      rawSnapshotRef: 'raw://n1-is/test-fixture'
    });

    assert.equal(rows.length, 4);
    assert.deepEqual(rows.map((row) => [row.stationId, row.productId, row.pricePerLitre]), [
      ['n1-akureyri', 'fuel-95', 316.4],
      ['n1-akureyri', 'fuel-diesel', 318.2],
      ['n1-hringbraut', 'fuel-95', 315.7],
      ['n1-hringbraut', 'fuel-diesel', 317.9]
    ]);
    assert.equal(rows[0].domain, 'fuel');
    assert.equal(rows[0].currency, 'ISK');
    assert.equal(rows[0].unit, 'l');
    assert.equal(rows[0].operatorName, 'N1');
    assert.equal(rows[0].observedAt, '2026-05-23T10:15:00.000Z');
    assert.equal(rows[0].provenance.rawSnapshotRef, 'raw://n1-is/test-fixture');
  });

  it('fetches via injected HTTP and preserves the source URL', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchN1FuelPrices({
      sourceUrl: 'https://www.n1.is/mock-prices',
      capturedAt: '2026-05-24T08:00:00.000Z',
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(recordedFixture, { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    assert.deepEqual(requestedUrls, ['https://www.n1.is/mock-prices']);
    assert.equal(rows[0].sourceUrl, 'https://www.n1.is/mock-prices');
  });

  it('fails closed for bad HTTP and empty fixtures', async () => {
    await assert.rejects(
      () => fetchN1FuelPrices({ fetchImpl: async () => new Response('Forbidden', { status: 403 }) }),
      /N1 fuel request failed: 403/
    );
    assert.throws(
      () => parseN1FuelPrices({ body: JSON.stringify({ stations: [] }), capturedAt: '2026-05-24T08:00:00.000Z' }),
      N1FuelSourceError
    );
  });
});
