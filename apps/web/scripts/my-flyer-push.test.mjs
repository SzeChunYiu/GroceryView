import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('MyFlyer ready push notifications', () => {
  it('centralizes opt-in and regeneration notification logic in the web push helper', () => {
    const push = read('src/lib/push.ts');

    assert.match(push, /export const MY_FLYER_READY_PUSH_CHANNEL = 'my-flyer-ready'/);
    assert.match(push, /export function buildMyFlyerReadySummary/);
    assert.match(push, /\$\{dealCount\} \$\{dealLabel\} this week, save up to \$\{normalizeSavings\(notification\.saveUpToKr\)\} kr/);
    assert.match(push, /Notification\.requestPermission\(\)/);
    assert.match(push, /navigator\.serviceWorker\.ready/);
    assert.match(push, /\/api\/notifications\/subscription/);
    assert.match(push, /channels: \[MY_FLYER_READY_PUSH_CHANNEL\]/);
    assert.match(push, /safeLocalStorageSet\(MY_FLYER_READY_OPT_IN_KEY, 'granted'\)/);
    assert.match(push, /\/api\/my-flyer\?\$\{params\.toString\(\)\}/);
    assert.match(push, /response\.headers\.get\('X-MyFlyer-Cache'\)/);
    assert.match(push, /cacheStatus === 'MISS'/);
    assert.match(push, /registration\.showNotification\(title/);
  });

  it('handles push, message, and notification-click events in the service worker', () => {
    const worker = read('public/sw.js');

    assert.match(worker, /MY_FLYER_READY_TYPE = 'MY_FLYER_READY_NOTIFICATION'/);
    assert.match(worker, /self\.addEventListener\('push'/);
    assert.match(worker, /eventData\.json\(\)/);
    assert.match(worker, /showFlyerReadyNotification/);
    assert.match(worker, /self\.registration\.showNotification\('Your MyFlyer is ready'/);
    assert.match(worker, /self\.addEventListener\('message'/);
    assert.match(worker, /self\.addEventListener\('notificationclick'/);
    assert.match(worker, /clients\.openWindow\(targetUrl\)/);
  });

  it('exposes an opt-in control on the printable MyFlyer page', () => {
    const page = read('src/app/[city]/my-flyer/page.tsx');
    const actions = read('src/components/my-flyer-push-actions.tsx');

    assert.match(page, /MyFlyerPushActions/);
    assert.match(page, /NEXT_PUBLIC_VAPID_PUBLIC_KEY/);
    assert.match(page, /saveUpToKr/);
    assert.match(actions, /enableMyFlyerReadyPush/);
    assert.match(actions, /refreshMyFlyerAndNotify/);
    assert.match(actions, /Enable alert/);
  });
});
