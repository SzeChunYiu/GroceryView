import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTooGoodToGoSeCityUrl, fetchTooGoodToGoSeListings, parseTooGoodToGoSeListings } from '../toogoodtogo-se.js';

const OBSERVED_AT = '2026-05-25T12:30:00.000Z';
const FIXTURE = `<!doctype html><html><body>
<script id="__NEXT_DATA__" type="application/json">{
  "props": { "pageProps": { "items": [
    {
      "item": { "item_id": "bag-espresso-fridhemsplan", "name": "Magic Bag", "description": "Surplus pastries and sandwiches" },
      "store": { "store_id": "espresso-house-fridhemsplan", "store_name": "Espresso House Fridhemsplan", "chain": "Espresso House" },
      "price": { "minor_units": 3900, "code": "SEK" },
      "value": { "minor_units": 12900, "code": "SEK" },
      "pickup_interval": { "start": "2026-05-25T17:00:00+02:00", "end": "2026-05-25T18:00:00+02:00" },
      "items_available": 3
    },
    {
      "item": { "item_id": "bag-ica-liljeholmen", "name": "Frukt & grönt-påse" },
      "store": { "store_name": "ICA Nära Liljeholmen" },
      "price": { "amount": 49, "currency": "SEK" },
      "value": { "amount": 99, "currency": "SEK" },
      "available_count": 1
    }
  ] } }
}</script>
</body></html>`;

describe('Too Good To Go SE surplus connector', () => {
  it('parses public city listing magic bags as surplus price observations', () => {
    const rows = parseTooGoodToGoSeListings({ html: FIXTURE, city: 'stockholm', observedAt: OBSERVED_AT });

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      id: 'toogoodtogo-se-stockholm-bag-espresso-fridhemsplan',
      domain: 'surplus_food',
      country: 'SE',
      chainId: 'espresso-house',
      storeName: 'Espresso House Fridhemsplan',
      city: 'stockholm',
      productName: 'Magic Bag',
      description: 'Surplus pastries and sandwiches',
      discountedPrice: 39,
      originalPrice: 129,
      currency: 'SEK',
      discountPercent: 69.8,
      pickupWindowStart: '2026-05-25T17:00:00+02:00',
      pickupWindowEnd: '2026-05-25T18:00:00+02:00',
      availableCount: 3,
      isSurplus: true,
      observedAt: OBSERVED_AT,
      sourceUrl: buildTooGoodToGoSeCityUrl('stockholm'),
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.chainId, 'ica-nara-liljeholmen');
    assert.equal(rows[1]?.discountedPrice, 49);
    assert.equal(rows[1]?.isSurplus, true);
  });

  it('fetches city pages with crawler headers and fails closed on blocked responses', async () => {
    const requested: string[] = [];
    const headers: HeadersInit[] = [];
    const rows = await fetchTooGoodToGoSeListings({
      cities: ['stockholm'],
      observedAt: OBSERVED_AT,
      fetchImpl: async (input, init) => {
        requested.push(String(input));
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200, headers: { 'content-type': 'text/html' } });
      }
    });

    assert.equal(rows.length, 2);
    assert.equal(requested[0], buildTooGoodToGoSeCityUrl('stockholm'));
    assert.equal(JSON.stringify(headers[0]).includes('toogoodtogo-se-connector'), true);
    await assert.rejects(
      () => fetchTooGoodToGoSeListings({ cities: ['malmo'], fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
