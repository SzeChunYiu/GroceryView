import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const publicRoutes = ['page.tsx', 'search/page.tsx', 'market/page.tsx', 'browse/page.tsx', 'deals/page.tsx', 'map/page.tsx', 'fuel/page.tsx', 'fuel/stations/page.tsx', 'pharmacy/page.tsx', 'pharmacy/otc/page.tsx', 'data-sources/page.tsx', 'methodology/page.tsx', 'guides/page.tsx'];
const banned = ['domain=fuel modeling', 'gated feature readiness', 'price foundation', 'server-side cursor pagination', 'source_run_id', 'raw_record_id', 'COPY staging', 'pgbouncer', 'Redis cache', 'parser version', 'buildPriceChartSeries', 'dead-letter queue', 'raw_records'];
const failures = [];
for (const route of publicRoutes) {
  const url = new URL(`src/app/${route}`, root);
  if (!existsSync(url)) failures.push(`${route}: missing`);
  const source = existsSync(url) ? readFileSync(url, 'utf8') : '';
  if (!/(<h1|PageQuestionHeader|MvpHomePage|PharmacyPage)/.test(source)) failures.push(`${route}: missing H1/PageQuestionHeader`);
  if (!/(href=|<button|actions=|MvpHomePage|PharmacyPage)/.test(source)) failures.push(`${route}: missing action`);
  for (const phrase of banned) if (source.includes(phrase)) failures.push(`${route}: banned phrase ${phrase}`);
}
const seo = readFileSync(new URL('src/lib/seo.ts', root), 'utf8');
for (const phrase of banned) if (seo.includes(phrase)) failures.push(`seo.ts: banned phrase ${phrase}`);
assert.deepEqual(failures, []);
console.log(JSON.stringify({ status: 'ok', checkedRoutes: publicRoutes.length }, null, 2));
