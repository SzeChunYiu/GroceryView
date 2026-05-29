import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const policy = readFileSync(new URL('../src/lib/route-seo-policy.ts', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../src/app/robots.ts', import.meta.url), 'utf8');

test('canonical helper covers product store category fuel pharmacy search and map cases', () => {
  for (const token of ["path.startsWith('/products/')", "path.startsWith('/stores/')", "path.startsWith('/browse/')", "path.startsWith('/market/')", "path.startsWith('/fuel/stations/')", "path.startsWith('/pharmacy/')", "return '/map'", "return path", "selectedMapParamToRoute.store", "selectedMapParamToRoute.station", "selectedMapParamToRoute.pharmacy"]) {
    assert.match(policy, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('robots disallows admin private and scaffold surfaces', () => {
  for (const route of ["'/admin'", "'/account'", "'/settings'", "'/login'", "'/watchlist'", "'/api'", "'/component-preview'"]) {
    assert.match(robots, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
