import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const policy = readFileSync(new URL('../../apps/web/src/lib/route-seo-policy.ts', import.meta.url), 'utf8');
for (const token of ['canonicalForRoute', 'robotsForRoute', "path === '/search'", "path === '/map'", "path === '/deals'", "'/admin'", "'/account'", "'/settings'", "'/api'", "'/login'", "'/watchlist'", "empty search result state", "query or faceted search state", "selected map marker or layer state"]) {
  assert.match(policy, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
console.log(JSON.stringify({ status: 'ok', canonicalRules: ['search query -> /search', 'map store -> /stores/[slug]', 'map fuel station -> /fuel/stations/[stationId]', 'deal filters -> /deals'], noindexRules: ['admin/account/settings/api/login/watchlist', 'empty search', 'faceted search', 'selected map states'] }, null, 2));
