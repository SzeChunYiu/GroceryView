import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('app nav marks the current route with aria-current page', async () => {
  const appNav = await read('src/components/app-nav.tsx');

  assert.match(appNav, /usePathname/);
  assert.match(appNav, /function isCurrentRoute/);
  assert.match(appNav, /aria-current=\{isCurrent \? ["'"]page["'"] : undefined\}/);
  assert.match(appNav, /border-emerald-700 bg-emerald-50 text-emerald-900/);
});
