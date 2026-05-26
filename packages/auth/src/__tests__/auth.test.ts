import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, hashPassword, parseBearerToken, planMobileSessionPolicy, verifyPasswordHash, verifySessionToken } from '../index.js';

describe('auth sessions', () => {
  it('creates and verifies a signed session token', async () => {
    const token = await createSessionToken({ userId: 'user-1', email: 'shopper@example.com', expiresAt: '2099-01-01T00:00:00.000Z' }, 'secret');
    const session = await verifySessionToken(token, 'secret', new Date('2026-05-19T00:00:00.000Z'));

    assert.deepEqual(session, { userId: 'user-1', email: 'shopper@example.com', expiresAt: '2099-01-01T00:00:00.000Z' });
  });

  it('rejects tampered, expired, and malformed tokens', async () => {
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2026-01-01T00:00:00.000Z' }, 'secret');

    await assert.rejects(() => verifySessionToken(`${token}x`, 'secret', new Date('2025-01-01T00:00:00.000Z')), /Invalid session signature/);
    await assert.rejects(() => verifySessionToken(token, 'secret', new Date('2026-05-19T00:00:00.000Z')), /Session expired/);
    await assert.rejects(() => verifySessionToken('bad', 'secret'), /Malformed session token/);
  });

  it('parses bearer authorization headers', () => {
    assert.equal(parseBearerToken('Bearer abc.def'), 'abc.def');
    assert.equal(parseBearerToken('Basic nope'), null);
    assert.equal(parseBearerToken(null), null);
  });

  it('hashes and verifies durable password credentials', async () => {
    const hash = await hashPassword('correct horse battery staple');

    assert.match(hash, /^scrypt\$/);
    assert.deepEqual(await verifyPasswordHash('correct horse battery staple', hash), { valid: true, needsRehash: false });
    assert.deepEqual(await verifyPasswordHash('wrong password', hash), { valid: false, needsRehash: false });
    await assert.rejects(() => hashPassword('short'), /at least 8 characters/);
  });

  it('plans native mobile session storage, device binding, and refresh actions', () => {
    const policy = planMobileSessionPolicy({
      userId: 'user-1',
      platform: 'ios',
      deviceId: 'ios-device-1',
      secureStorageAvailable: true,
      issuedAt: '2026-05-19T00:00:00.000Z',
      expiresAt: '2026-05-23T00:00:00.000Z',
      now: '2026-05-22T06:00:00.000Z'
    });

    assert.deepEqual(policy, {
      userId: 'user-1',
      platform: 'ios',
      deviceBound: true,
      secureStorageRequired: true,
      refreshRecommended: true,
      expired: false,
      blockers: [],
      actions: ['store_in_secure_storage', 'refresh_session']
    });
  });

  it('fails closed for native mobile sessions without secure storage or device binding', () => {
    const policy = planMobileSessionPolicy({
      userId: 'user-1',
      platform: 'android',
      secureStorageAvailable: false,
      issuedAt: '2026-05-19T00:00:00.000Z',
      expiresAt: '2026-05-20T00:00:00.000Z',
      now: '2026-05-20T01:00:00.000Z'
    });

    assert.equal(policy.expired, true);
    assert.equal(policy.secureStorageRequired, true);
    assert.deepEqual(policy.blockers, [
      'Native mobile sessions require secure storage.',
      'Native mobile sessions require a bound device id.'
    ]);
    assert.deepEqual(policy.actions, ['bind_device', 'reauthenticate']);
  });
});
