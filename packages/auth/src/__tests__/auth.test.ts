import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, parseBearerToken, verifySessionToken } from '../index.js';

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
});
