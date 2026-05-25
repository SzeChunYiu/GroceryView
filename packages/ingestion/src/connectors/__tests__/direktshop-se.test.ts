import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDirektshopSeEmaginPdfUrl,
  fetchDirektshopSeFlyerOffers,
  parseDirektshopSeFlyerOffers
} from '../direktshop-se.js';

const RETRIEVED_AT = '2026-05-25T14:30:00.000Z';
const SOURCE_URL = 'https://direkten.se/kampanjer/';
const FLYER_URL = 'https://www.e-magin.se/latestpaper/direkten-v21';

const FIXTURE = `<!doctype html><script>
window.__DATA__ = {
  "links":[{"text":"DRBlad","type":"DRBlad","url":"https:\\/\\/www.e-magin.se\\/latestpaper\\/direkten-v21"}],
  "weeklyOffers":[
    {
      "id":"direkten-001",
      "details":{"brand":"Direkten","packageInformation":"50 cl","name":"Kaffe & bulle","mechanicInfo":"2 för 39:-"},
      "category":{"articleGroupName":"Fika"},
      "validTo":"2026-06-01",
      "comparisonPrice":"19,50/st",
      "stores":[{"storeMarketingName":"Direkten Vega","storeId":"vega","regularPrice":"25","storeInd":true}],
      "eans":[{"id":"731000000001","image":"https://direkten.se/img/kaffe.jpg"}]
    },
    {
      "id":"direkten-002",
      "details":{"brand":"GB","packageInformation":"Stycksak","name":"Glassmustaschen","mechanicInfo":"20% rabatt"},
      "category":{"articleGroupName":"Glass"},
      "validTo":"2026-06-01",
      "stores":[{"storeMarketingName":"Direkten Vega","storeId":"vega","referencePriceText":"Ord.pris 30 kr.","storeInd":true}],
      "eans":[{"id":"731000000002","image":"https://direkten.se/img/glass.jpg"}]
    },
    {"id":"broken","details":{"name":"Saknar pris"}}
  ]
};
</script>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Direktshop SE flyer connector', () => {
  it('parses Direkten flyer weeklyOffers and e-magin flyer metadata', () => {
    const rows = parseDirektshopSeFlyerOffers(FIXTURE, {
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      code: 'direkten-001',
      name: 'Kaffe & bulle',
      brand: 'Direkten',
      packageText: '50 cl',
      category: 'Fika',
      priceText: '2 för 39:-',
      comparisonPrice: '19,50/st',
      regularPriceText: 'Ord.pris 25 kr.',
      validTo: '2026-06-01',
      storeName: 'Direkten Vega',
      storeId: 'vega',
      availableInStore: true,
      sourceUrl: SOURCE_URL,
      flyerUrl: FLYER_URL,
      flyerPdfUrl: 'https://api.e-magin.se/api/pdf/direkten-v21',
      imageUrl: 'https://direkten.se/img/kaffe.jpg',
      retrievedAt: RETRIEVED_AT,
      structuredPromotion: {
        kind: 'multi_buy',
        quantity: 2,
        price: 39,
        sourceText: '2 för 39:-'
      }
    });
    assert.deepEqual(rows[1]?.structuredPromotion, {
      kind: 'percent_off',
      percentOff: 20,
      sourceText: '20% rabatt'
    });
  });

  it('fetches campaign pages, preserves connector headers, and honors maxRows', async () => {
    const headers: Array<HeadersInit | undefined> = [];
    const rows = await fetchDirektshopSeFlyerOffers({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers);
        return response(FIXTURE);
      },
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.deepEqual(rows.map((row) => row.code), ['direkten-001']);
    assert.equal(JSON.stringify(headers[0]).includes('direktshop-se-flyer-connector'), true);
  });

  it('rejects unsupported sources, malformed pages, and HTTP failures', async () => {
    assert.equal(buildDirektshopSeEmaginPdfUrl('https://www.e-magin.se/paper/direkten-v22'), 'https://api.e-magin.se/api/pdf/direkten-v22');
    assert.throws(
      () => parseDirektshopSeFlyerOffers(FIXTURE, { sourceUrl: 'https://example.com/', retrievedAt: RETRIEVED_AT }),
      /Direkten campaign source/
    );
    assert.throws(
      () => parseDirektshopSeFlyerOffers('<html></html>', { sourceUrl: SOURCE_URL, retrievedAt: RETRIEVED_AT }),
      /weeklyOffers/
    );
    await assert.rejects(
      () => fetchDirektshopSeFlyerOffers({ fetchImpl: async () => response('blocked', 503), sourceUrls: [SOURCE_URL] }),
      /Direktshop SE flyer page request failed.*503/
    );
  });
});
