import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler, type FlyerOffersProviderQuery } from '../index.js';
import type { FlyerOfferReport, StoreFlyerOfferReport } from '@groceryview/api';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

const sampleOffer = {
  offerId: 'offer-coffee-450g-willys',
  flyerId: 'flyer-willys-week-21',
  chain: 'willys',
  storeId: 'willys-odenplan',
  storeName: 'Willys Odenplan',
  branchDistrict: 'Stockholm',
  productId: 'coffee-450g',
  productName: 'Coffee 450 g',
  category: 'coffee',
  regularPrice: 59.9,
  offerPrice: 49.9,
  savings: 10,
  discountPercent: 16.7,
  currency: 'SEK' as const,
  priceType: 'flyer' as const,
  validFrom: '2026-05-20T00:00:00.000Z',
  validThrough: '2026-05-26T23:59:59.000Z',
  observedAt: '2026-05-24T00:00:00.000Z',
  sourceType: 'weekly_flyer' as const,
  sourceUrl: 'https://example.test/willys/flyers/week-21',
  sourceRunId: 'source-run:willys:flyers:2026-05-24',
  confidence: 0.97,
  dealScore: 82,
  band: { label: 'Good deal' as const, verdict: 'Buy' as const }
};

function priceDropReport(query: FlyerOffersProviderQuery): FlyerOfferReport {
  return {
    asOf: query.asOf ?? '2026-05-24T00:00:00.000Z',
    filters: {
      ...(query.storeId ? { storeId: query.storeId } : {}),
      ...(query.chain ? { chain: query.chain } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.productId ? { productId: query.productId } : {})
    },
    offerCount: 1,
    stores: [
      {
        storeId: sampleOffer.storeId,
        storeName: sampleOffer.storeName,
        chain: sampleOffer.chain,
        offerCount: 1,
        totalOneEachSavings: sampleOffer.savings,
        topOfferId: sampleOffer.offerId,
        topDealScore: sampleOffer.dealScore
      }
    ],
    offers: [sampleOffer],
    guardrails: ['Discounts preserve flyer evidence and regular-vs-offer price context.']
  };
}

function storePriceDropReport(storeId: string): StoreFlyerOfferReport | null {
  if (storeId === 'missing-store') return null;
  return {
    storeId,
    storeName: sampleOffer.storeName,
    chain: sampleOffer.chain,
    asOf: '2026-05-24T00:00:00.000Z',
    offerCount: 1,
    categoryCount: 1,
    totalOneEachSavings: sampleOffer.savings,
    bestOffer: sampleOffer,
    offers: [sampleOffer],
    guardrails: ['Store discounts are scoped to a single branch.']
  };
}

describe('price drops API contract', () => {
  it('returns 200 with validated discount query filters and response shape', async () => {
    let observedQuery: FlyerOffersProviderQuery | undefined;
    const handle = createHttpHandler(undefined, {
      flyerOffersProvider: async (query) => {
        observedQuery = query;
        return priceDropReport(query);
      }
    });

    const response = await handle(new Request('http://localhost/api/deals/discounts?productId=coffee-450g&chain=%20willys%20&asOf=2026-05-24T00:00:00.000Z'));

    assert.equal(response.status, 200);
    assert.deepEqual(observedQuery, {
      asOf: '2026-05-24T00:00:00.000Z',
      chain: 'willys',
      productId: 'coffee-450g',
      storeId: undefined,
      category: undefined
    });

    const body = await json(response) as FlyerOfferReport;
    assert.equal(body.asOf, '2026-05-24T00:00:00.000Z');
    assert.equal(body.filters.productId, 'coffee-450g');
    assert.equal(body.filters.chain, 'willys');
    assert.equal(body.offerCount, 1);
    assert.equal(body.offers[0]?.productId, 'coffee-450g');
    assert.equal(body.offers[0]?.regularPrice, 59.9);
    assert.equal(body.offers[0]?.offerPrice, 49.9);
    assert.equal(body.offers[0]?.discountPercent, 16.7);
    assert.ok(Array.isArray(body.guardrails));
  });

  it('returns 400 for invalid discount request schema', async () => {
    const handle = createHttpHandler(undefined, { flyerOffersProvider: async (query) => priceDropReport(query) });
    const response = await handle(new Request('http://localhost/api/deals/discounts?asOf=not-a-date'));

    assert.equal(response.status, 400);
    const body = await json(response) as { error?: string };
    assert.match(body.error ?? '', /asOf must be an ISO timestamp/i);
  });

  it('returns 404 for missing store-scoped discount reports', async () => {
    const handle = createHttpHandler(undefined, { storeFlyerOffersProvider: async (storeId) => storePriceDropReport(storeId) });
    const response = await handle(new Request('http://localhost/api/stores/missing-store/discounts'));

    assert.equal(response.status, 404);
    const body = await json(response) as { error?: string };
    assert.match(body.error ?? '', /Store not found/i);
  });
});
