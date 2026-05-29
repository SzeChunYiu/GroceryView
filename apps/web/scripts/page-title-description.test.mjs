import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const seo = readFileSync(new URL('../src/lib/seo.ts', import.meta.url), 'utf8');
const pages = [
  'src/app/page.tsx', 'src/app/search/page.tsx', 'src/app/market/page.tsx', 'src/app/browse/page.tsx', 'src/app/deals/page.tsx', 'src/app/map/page.tsx', 'src/app/fuel/page.tsx', 'src/app/fuel/stations/page.tsx', 'src/app/pharmacy/page.tsx', 'src/app/pharmacy/otc/page.tsx', 'src/app/data-sources/page.tsx', 'src/app/methodology/page.tsx', 'src/app/guides/page.tsx', 'src/app/admin/seo/page.tsx'
];
const banned = ['domain=fuel modeling', 'gated feature readiness', 'price foundation', 'server-side cursor pagination', 'source_run_id', 'raw_record_id', 'COPY staging', 'pgbouncer', 'Redis cache', 'parser version', 'buildPriceChartSeries', 'dead-letter queue', 'raw_records'];

test('public metadata uses human copy and avoids backend/debug phrases', () => {
  for (const phrase of banned) assert.doesNotMatch(seo, new RegExp(phrase, 'i'));
  assert.match(seo, /Compare source-backed public OTC pharmacy catalog rows/);
  assert.match(seo, /source-backed fuel observations by grade/);
});

test('important pages expose route metadata and readable headings', () => {
  for (const page of pages) {
    const source = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.match(source, /routeMetadata|metadataForSearch|metadataForPolicyRoute/, `${page} should define metadata`);
    assert.match(source, /<h1|PageQuestionHeader|MvpHomePage|PharmacyPage/, `${page} should include a human heading`);
  }
});
