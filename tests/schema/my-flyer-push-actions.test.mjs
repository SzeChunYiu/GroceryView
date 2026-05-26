import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../../apps/web/src/app/[country]/my-flyer/page.tsx', import.meta.url), 'utf8');
const pushActions = readFileSync(new URL('../../apps/web/src/components/my-flyer-push-actions.tsx', import.meta.url), 'utf8');
const pushLib = readFileSync(new URL('../../apps/web/src/lib/push.ts', import.meta.url), 'utf8');

describe('MyFlyer push actions', () => {
  it('uses the authenticated browser session account id instead of a static placeholder', () => {
    assert.doesNotMatch(pushActions, /signed-in-user/);
    assert.doesNotMatch(pushLib, /signed-in-user/);
    assert.match(pushActions, /readBrowserAccountSession\(\)/);
    assert.match(pushLib, /sessionStorage/);
    assert.match(pushLib, /groceryview:userId/);
    assert.match(pushLib, /accountId:\s*session\.userId/);
  });

  it('refreshes the MyFlyer API with the signed-in user id and bearer token', () => {
    assert.match(pushActions, /buildMyFlyerRefreshUrl\(\{/);
    assert.match(pushActions, /userId:\s*session\.userId/);
    assert.match(pushActions, /Authorization:\s*`Bearer \$\{session\.accessToken\}`/);
    assert.match(pushLib, /user_id:\s*userId/);
  });

  it('mounts signed-in MyFlyer controls on the printable country page', () => {
    assert.match(page, /import \{ MyFlyerPushActions \}/);
    assert.match(page, /<MyFlyerPushActions/);
    assert.match(page, /defaultAlgorithm="watchlist_first"/);
    assert.match(page, /country="se"/);
  });
});
