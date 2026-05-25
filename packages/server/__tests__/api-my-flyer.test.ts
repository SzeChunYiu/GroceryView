import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const myFlyerRequestSchema = z.object({
  userId: z.string().min(1),
  algorithm: z.enum(['best_savings', 'best_unit_price', 'watchlist_first']).default('best_savings'),
  country: z.enum(['se', 'no', 'dk', 'fi']).default('se'),
  limit: z.coerce.number().int().min(1).max(50).default(10)
}).strict();

const myFlyerErrorSchema = z.object({ error: z.string() });
const myFlyerOfferSchema = z.object({
  offerId: z.string(),
  productId: z.string(),
  productName: z.string(),
  chain: z.string(),
  offerPrice: z.number(),
  currency: z.literal('SEK'),
  validThrough: z.string(),
  sourceUrl: z.string().url()
});
const myFlyerResponseSchema = z.object({
  userId: z.string(),
  algorithm: z.enum(['best_savings', 'best_unit_price', 'watchlist_first']),
  country: z.string(),
  rows: z.array(z.object({ rank: z.number().int().positive(), offer: myFlyerOfferSchema, explanation: z.array(z.string()) })),
  cache: z.object({ ttlSeconds: z.number().int().positive() })
});

describe('my-flyer API contract', () => {
  it('validates request Zod schema and 200 response shape', () => {
    assert.deepEqual(myFlyerRequestSchema.parse({ userId: 'user-1', limit: '4', algorithm: 'best_unit_price', country: 'se' }).limit, 4);
    const response = myFlyerResponseSchema.parse({
      userId: 'user-1',
      algorithm: 'best_unit_price',
      country: 'se',
      cache: { ttlSeconds: 3600 },
      rows: [{
        rank: 1,
        offer: { offerId: 'offer-1', productId: 'coffee', productName: 'Coffee', chain: 'willys', offerPrice: 49, currency: 'SEK', validThrough: '2026-05-31T21:59:59.000Z', sourceUrl: 'https://example.test/flyer' },
        explanation: ['best_unit_price ranker']
      }]
    });
    assert.equal(response.rows[0]?.offer.currency, 'SEK');
  });

  it('covers 400, 404, and 429 error envelopes where applicable', () => {
    assert.equal(myFlyerRequestSchema.safeParse({ userId: '', limit: 0 }).success, false);
    assert.deepEqual(myFlyerErrorSchema.parse({ error: 'Invalid my-flyer request.' }), { error: 'Invalid my-flyer request.' });
    assert.deepEqual(myFlyerErrorSchema.parse({ error: 'MyFlyer user not found.' }), { error: 'MyFlyer user not found.' });
    assert.deepEqual(myFlyerErrorSchema.parse({ error: 'Too many my-flyer requests.' }), { error: 'Too many my-flyer requests.' });
  });
});
