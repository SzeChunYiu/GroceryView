import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken } from '@groceryview/auth';
import { createHttpHandler } from '../index.js';

describe('authenticated HTTP routes', () => {
  it('requires a valid bearer token for user-scoped routes when auth is enabled', async () => {
    const handle = createHttpHandler(undefined, { authSecret: 'secret', now: new Date('2026-05-19T00:00:00.000Z') });

    const unauthenticated = await handle(new Request('http://localhost/api/watchlist?userId=user-1'));
    assert.equal(unauthenticated.status, 401);

    const unauthenticatedAccountAccess = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1'));
    assert.equal(unauthenticatedAccountAccess.status, 401);

    const unauthenticatedPrivacyExport = await handle(new Request('http://localhost/api/privacy/export?userId=user-1'));
    assert.equal(unauthenticatedPrivacyExport.status, 401);
    const unauthenticatedPrivacyFulfillment = await handle(new Request('http://localhost/api/privacy/request-fulfillment?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ requests: [] })
    }));
    assert.equal(unauthenticatedPrivacyFulfillment.status, 401);
    const unauthenticatedHousehold = await handle(new Request('http://localhost/api/households/current?userId=user-1', {
      method: 'PUT',
      body: JSON.stringify({ householdId: 'house-1', name: 'Home', weeklyBudget: 100, approvalLimit: 100, reviewer: 'user-1', members: [{ userId: 'user-1', displayName: 'Alex' }], basketItems: [], sharedFavoriteStoreIds: [] })
    }));
    assert.equal(unauthenticatedHousehold.status, 401);
    const unauthenticatedHouseholdJoin = await handle(new Request('http://localhost/api/households/join?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ householdId: 'house-1', inviteToken: 'house-1:join', displayName: 'Alex' })
    }));
    assert.equal(unauthenticatedHouseholdJoin.status, 401);
    const unauthenticatedHouseholdCheck = await handle(new Request('http://localhost/api/households/current/basket/check?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ productId: 'milk', checked: true })
    }));
    assert.equal(unauthenticatedHouseholdCheck.status, 401);
    const unauthenticatedScan = await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'scan-1', kind: 'barcode', payload: '0735000123456' })
    }));
    assert.equal(unauthenticatedScan.status, 401);
    const unauthenticatedScanUpload = await handle(new Request('http://localhost/api/scans/upload-url?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'scan-1', kind: 'receipt', contentType: 'image/jpeg', byteLength: 1 })
    }));
    assert.equal(unauthenticatedScanUpload.status, 401);
    const unauthenticatedPantry = await handle(new Request('http://localhost/api/pantry/replenishment?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ pantry: [] })
    }));
    assert.equal(unauthenticatedPantry.status, 401);
    const unauthenticatedLocalOffers = await handle(new Request('http://localhost/api/basket/local-offers?userId=user-1'));
    assert.equal(unauthenticatedLocalOffers.status, 401);
    const unauthenticatedMealPlans = await handle(new Request('http://localhost/api/meal-plans/suggestions?userId=user-1'));
    assert.equal(unauthenticatedMealPlans.status, 401);
    const unauthenticatedExpiryRadar = await handle(new Request('http://localhost/api/expiry-deals/radar?userId=user-1'));
    assert.equal(unauthenticatedExpiryRadar.status, 401);

    const wrongUserToken = await createSessionToken({ userId: 'user-2', expiresAt: '2099-01-01T00:00:00.000Z' }, 'secret');
    const forbidden = await handle(new Request('http://localhost/api/watchlist?userId=user-1', {
      headers: { authorization: `Bearer ${wrongUserToken}` }
    }));
    assert.equal(forbidden.status, 403);
    const forbiddenAccountAccess = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
      headers: { authorization: `Bearer ${wrongUserToken}` }
    }));
    assert.equal(forbiddenAccountAccess.status, 403);
    const forbiddenPrivacyPlan = await handle(new Request('http://localhost/api/privacy/deletion-plan?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` }
    }));
    assert.equal(forbiddenPrivacyPlan.status, 403);
    const forbiddenPrivacyFulfillment = await handle(new Request('http://localhost/api/privacy/request-fulfillment?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ requests: [] })
    }));
    assert.equal(forbiddenPrivacyFulfillment.status, 403);
    const forbiddenHousehold = await handle(new Request('http://localhost/api/households/current?userId=user-1', {
      method: 'PUT',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ householdId: 'house-1', name: 'Home', weeklyBudget: 100, approvalLimit: 100, reviewer: 'user-1', members: [{ userId: 'user-1', displayName: 'Alex' }], basketItems: [], sharedFavoriteStoreIds: [] })
    }));
    assert.equal(forbiddenHousehold.status, 403);
    const forbiddenHouseholdJoin = await handle(new Request('http://localhost/api/households/join?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ householdId: 'house-1', inviteToken: 'house-1:join', displayName: 'Alex' })
    }));
    assert.equal(forbiddenHouseholdJoin.status, 403);
    const forbiddenHouseholdCheck = await handle(new Request('http://localhost/api/households/current/basket/check?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ productId: 'milk', checked: true })
    }));
    assert.equal(forbiddenHouseholdCheck.status, 403);
    const forbiddenScan = await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ scanId: 'scan-1', kind: 'barcode', payload: '0735000123456' })
    }));
    assert.equal(forbiddenScan.status, 403);
    const forbiddenScanUpload = await handle(new Request('http://localhost/api/scans/upload-url?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ scanId: 'scan-1', kind: 'receipt', contentType: 'image/jpeg', byteLength: 1 })
    }));
    assert.equal(forbiddenScanUpload.status, 403);
    const forbiddenPantry = await handle(new Request('http://localhost/api/pantry/replenishment?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ pantry: [] })
    }));
    assert.equal(forbiddenPantry.status, 403);
    const forbiddenLocalOffers = await handle(new Request('http://localhost/api/basket/local-offers?userId=user-1', {
      headers: { authorization: `Bearer ${wrongUserToken}` }
    }));
    assert.equal(forbiddenLocalOffers.status, 403);
    const forbiddenMealPlans = await handle(new Request('http://localhost/api/meal-plans/suggestions?userId=user-1', {
      headers: { authorization: `Bearer ${wrongUserToken}` }
    }));
    assert.equal(forbiddenMealPlans.status, 403);
    const forbiddenExpiryRadar = await handle(new Request('http://localhost/api/expiry-deals/radar?userId=user-1', {
      headers: { authorization: `Bearer ${wrongUserToken}` }
    }));
    assert.equal(forbiddenExpiryRadar.status, 403);

    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'secret');
    const authorized = await handle(new Request('http://localhost/api/watchlist?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(authorized.status, 200);
    const authorizedAccountAccess = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(authorizedAccountAccess.status, 200);
    const authorizedPrivacyExport = await handle(new Request('http://localhost/api/privacy/export?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(authorizedPrivacyExport.status, 200);
    const authorizedPrivacyFulfillment = await handle(new Request('http://localhost/api/privacy/request-fulfillment?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ requests: [] })
    }));
    assert.equal(authorizedPrivacyFulfillment.status, 200);
    const authorizedHousehold = await handle(new Request('http://localhost/api/households/current?userId=user-1', {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ householdId: 'house-1', name: 'Home', weeklyBudget: 100, approvalLimit: 100, reviewer: 'user-1', members: [{ userId: 'user-1', displayName: 'Alex' }], basketItems: [], sharedFavoriteStoreIds: [] })
    }));
    assert.equal(authorizedHousehold.status, 200);
    const authorizedScan = await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ scanId: 'scan-1', kind: 'barcode', payload: '0735000123456' })
    }));
    assert.equal(authorizedScan.status, 200);
    const authorizedScanUpload = await handle(new Request('http://localhost/api/scans/upload-url?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ scanId: 'scan-1', kind: 'receipt', contentType: 'image/jpeg', byteLength: 1 })
    }));
    assert.equal(authorizedScanUpload.status, 200);
    const authorizedPantry = await handle(new Request('http://localhost/api/pantry/replenishment?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ pantry: [] })
    }));
    assert.equal(authorizedPantry.status, 200);
    const authorizedLocalOffers = await handle(new Request('http://localhost/api/basket/local-offers?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(authorizedLocalOffers.status, 200);
    const authorizedMealPlans = await handle(new Request('http://localhost/api/meal-plans/suggestions?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(authorizedMealPlans.status, 200);
    const authorizedExpiryRadar = await handle(new Request('http://localhost/api/expiry-deals/radar?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(authorizedExpiryRadar.status, 200);
  });
});
