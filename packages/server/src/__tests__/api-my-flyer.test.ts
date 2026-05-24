import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGroceryViewApi } from '@groceryview/api';
import { createSessionToken } from '@groceryview/auth';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

async function bearer(userId: string, secret = 'my-flyer-secret') {
  const accessToken = await createSessionToken({
    userId,
    expiresAt: '2026-05-27T00:00:00.000Z'
  }, secret);
  return { authorization: `Bearer ${accessToken}` };
}

describe('api my-flyer contract', () => {
  it('returns a 200 personalized flyer response filtered by favorite store and watchlist product', async () => {
    const api = createGroceryViewApi();
    api.addFavoriteStore('user-1', 'willys-odenplan');
    api.addWatchlistItem('user-1', { productId: 'coffee', favoriteStoresOnly: true });
    const handle = createHttpHandler(api, {
      authSecret: 'my-flyer-secret',
      now: new Date('2026-05-24T10:00:00.000Z')
    });

    const response = await handle(new Request('http://localhost/api/my-flyer?userId=user-1&asOf=2026-05-20T12:00:00.000Z', {
      headers: await bearer('user-1')
    }));

    assert.equal(response.status, 200);
    const body = await json(response) as {
      userId: string;
      generatedAt: string;
      filters: { asOf: string };
      favoriteStoreIds: string[];
      watchlistProductIds: string[];
      offerCount: number;
      stores: Array<{ storeId: string; offerCount: number; topOfferId: string }>;
      offers: Array<{ offerId: string; storeId: string; productId: string; offerPrice: number; regularPrice: number; sourceUrl: string }>;
      guardrails: string[];
    };
    assert.equal(body.userId, 'user-1');
    assert.equal(body.generatedAt, '2026-05-20T12:00:00.000Z');
    assert.deepEqual(body.filters, { asOf: '2026-05-20T12:00:00.000Z' });
    assert.deepEqual(body.favoriteStoreIds, ['willys-odenplan']);
    assert.deepEqual(body.watchlistProductIds, ['coffee']);
    assert.equal(body.offerCount, 1);
    assert.deepEqual(body.stores, [{
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      chain: 'willys',
      offerCount: 1,
      totalOneEachSavings: 15,
      topOfferId: 'flyer-willys-odenplan-coffee-2026w21',
      topDealScore: 82
    }]);
    assert.deepEqual(body.offers.map((offer) => [offer.offerId, offer.storeId, offer.productId, offer.offerPrice, offer.regularPrice]), [
      ['flyer-willys-odenplan-coffee-2026w21', 'willys-odenplan', 'coffee', 49.9, 64.9]
    ]);
    assert.match(body.offers[0]?.sourceUrl ?? '', /^https:\/\/www\.willys\.se\//);
    assert.match(body.guardrails[0] ?? '', /favorite stores and watchlist products/i);
  });

  it('returns 400 for request-schema violations before provider work', async () => {
    const handle = createHttpHandler(createGroceryViewApi(), { authSecret: 'my-flyer-secret' });

    const missingUser = await handle(new Request('http://localhost/api/my-flyer?asOf=2026-05-20T12:00:00.000Z', {
      headers: await bearer('user-1')
    }));
    assert.equal(missingUser.status, 400);
    assert.deepEqual(await json(missingUser), { error: 'userId query parameter is required.' });

    const invalidAsOf = await handle(new Request('http://localhost/api/my-flyer?userId=user-1&asOf=20-05-2026', {
      headers: await bearer('user-1')
    }));
    assert.equal(invalidAsOf.status, 400);
    assert.deepEqual(await json(invalidAsOf), { error: 'asOf must be an ISO timestamp.' });

    const unsupported = await handle(new Request('http://localhost/api/my-flyer?userId=user-1&limit=20', {
      headers: await bearer('user-1')
    }));
    assert.equal(unsupported.status, 400);
    assert.deepEqual(await json(unsupported), { error: 'Unsupported my-flyer query parameter: limit.' });
  });

  it('returns 404 for source-backed store or product filters outside the catalog', async () => {
    const handle = createHttpHandler(createGroceryViewApi(), { authSecret: 'my-flyer-secret' });

    const missingStore = await handle(new Request('http://localhost/api/my-flyer?userId=user-1&storeId=missing-store', {
      headers: await bearer('user-1')
    }));
    assert.equal(missingStore.status, 404);
    assert.deepEqual(await json(missingStore), { error: 'Store not found.' });

    const missingProduct = await handle(new Request('http://localhost/api/my-flyer?userId=user-1&productId=missing-product', {
      headers: await bearer('user-1')
    }));
    assert.equal(missingProduct.status, 404);
    assert.deepEqual(await json(missingProduct), { error: 'Product not found.' });
  });
});
