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
    const unauthenticatedScan = await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      body: JSON.stringify({ scanId: 'scan-1', kind: 'barcode', payload: '0735000123456' })
    }));
    assert.equal(unauthenticatedScan.status, 401);

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
    const forbiddenScan = await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${wrongUserToken}` },
      body: JSON.stringify({ scanId: 'scan-1', kind: 'barcode', payload: '0735000123456' })
    }));
    assert.equal(forbiddenScan.status, 403);

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
    const authorizedScan = await handle(new Request('http://localhost/api/scans/process?userId=user-1', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ scanId: 'scan-1', kind: 'barcode', payload: '0735000123456' })
    }));
    assert.equal(authorizedScan.status, 200);
  });
});
