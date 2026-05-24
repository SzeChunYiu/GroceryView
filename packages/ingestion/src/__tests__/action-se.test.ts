import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTION_SE_PRESENCE, fetchActionSeProducts } from '../connectors/action-se.js';

test('Action SE connector fails closed while no Sweden presence is verified', async () => {
  assert.equal(ACTION_SE_PRESENCE.country, 'SE');
  assert.equal(ACTION_SE_PRESENCE.hasVerifiedPresence, false);
  assert.deepEqual(await fetchActionSeProducts(), []);
});
