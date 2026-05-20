import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMobilePermissionPlan, nextMobilePermissionPrompt, summarizeMobilePermissionPlan } from '../permissions.js';

describe('mobile permission plan', () => {
  it('marks scan and notification surfaces ready when native permissions are granted', () => {
    const plan = buildMobilePermissionPlan({ camera: 'granted', notifications: 'granted' });

    assert.equal(plan.status, 'ready');
    assert.deepEqual(plan.readySurfaces, ['/scan/barcode', '/scan/receipt', '/profile/notifications-placeholder']);
    assert.deepEqual(plan.blockedSurfaces, []);
    assert.equal(nextMobilePermissionPrompt(plan), null);
    assert.deepEqual(summarizeMobilePermissionPlan(plan), { ready: 3, request_permission: 0, open_settings: 0, unavailable: 0 });
  });

  it('requests camera permission before barcode and receipt scans while notifications remain ready', () => {
    const plan = buildMobilePermissionPlan({ camera: 'not_determined', notifications: 'granted' });

    assert.equal(plan.status, 'needs_permission');
    assert.deepEqual(plan.blockedSurfaces, ['/scan/barcode', '/scan/receipt']);
    assert.equal(nextMobilePermissionPrompt(plan)?.permission, 'camera');
    assert.equal(nextMobilePermissionPrompt(plan)?.status, 'request_permission');
    assert.deepEqual(summarizeMobilePermissionPlan(plan), { ready: 1, request_permission: 2, open_settings: 0, unavailable: 0 });
  });

  it('routes denied and blocked permissions to settings before primary actions continue', () => {
    const plan = buildMobilePermissionPlan({ camera: 'denied', notifications: 'blocked' });

    assert.equal(plan.status, 'blocked');
    assert.deepEqual(plan.blockedSurfaces, ['/scan/barcode', '/scan/receipt', '/profile/notifications-placeholder']);
    assert.deepEqual(
      plan.prompts.map((prompt) => ({ permission: prompt.permission, status: prompt.status, retryable: prompt.retryable })),
      [
        { permission: 'camera', status: 'open_settings', retryable: true },
        { permission: 'camera', status: 'open_settings', retryable: true },
        { permission: 'notifications', status: 'open_settings', retryable: false }
      ]
    );
  });

  it('fails closed when a required native capability is unavailable on the device', () => {
    const plan = buildMobilePermissionPlan({ camera: 'unavailable', notifications: 'not_determined' });

    assert.equal(plan.status, 'blocked');
    assert.deepEqual(summarizeMobilePermissionPlan(plan), { ready: 0, request_permission: 1, open_settings: 0, unavailable: 2 });
    assert.match(plan.prompts[0].reason, /unavailable/);
  });
});
