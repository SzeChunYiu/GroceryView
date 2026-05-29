import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const policy = readFileSync(new URL('../src/lib/route-seo-policy.ts', import.meta.url), 'utf8');
const searchPage = readFileSync(new URL('../src/app/search/page.tsx', import.meta.url), 'utf8');
const mapPage = readFileSync(new URL('../src/app/map/page.tsx', import.meta.url), 'utf8');
const dealsPage = readFileSync(new URL('../src/app/deals/page.tsx', import.meta.url), 'utf8');

test('route SEO policy defines private, query, and map canonical/noindex decisions', () => {
  for (const token of ['canonicalForRoute', 'robotsForRoute', "'/admin'", "'/account'", "'/settings'", "'/api'", "'/login'", "'/watchlist'", "path === '/search'", "path === '/map'", "path === '/deals'", 'empty search result state', 'query or faceted search state', 'selected map marker or layer state']) {
    assert.match(policy, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('search map and deal pages apply route policy metadata', () => {
  assert.match(searchPage, /metadataForSearch\(resolvedSearchParams\)/);
  assert.match(mapPage, /metadataForPolicyRoute\('\/map'/);
  assert.match(dealsPage, /metadataForPolicyRoute\('\/deals'/);
});
