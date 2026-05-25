import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('shopping list page renders collaborative activity with actors and timestamps', async () => {
  const page = await read('src/app/list/page.tsx');
  const permissions = await read('src/lib/list-permissions.ts');
  const activityStream = await read('src/components/activity-stream.tsx');

  assert.match(page, /ActivityStream/);
  assert.match(page, /sharedShoppingListActivityFeed/);
  assert.match(page, /listId="local-shopping-list"/);
  assert.match(page, /data-print-hidden="true"/);

  assert.match(permissions, /sharedShoppingListActivityFeed/);
  assert.match(permissions, /item_added/);
  assert.match(permissions, /item_checked/);
  assert.match(permissions, /item_removed/);
  assert.match(permissions, /Sam Shopper/);
  assert.match(permissions, /Mina Parent/);
  assert.match(permissions, /timestamp/);

  assert.match(activityStream, /event\.actor\.name/);
  assert.match(activityStream, /formatTimestamp\(event\.timestamp\)/);
  assert.match(activityStream, /Shared-list changes/);
});
