import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const repo = new URL('../../..', import.meta.url);
const readWeb = (relative) => readFile(new URL(relative, root), 'utf8');
const readRepo = (relative) => readFile(new URL(relative, repo), 'utf8');
const existsRepo = (relative) => existsSync(new URL(relative, repo));

test('composer small tasks remain closed as separate PR-sized slices', async () => {
  const [
    registry,
    searchCategoryTest,
    fuelTest,
    pharmacyTest,
    crossDomainTest,
    dataOpsTest,
    releaseReadinessTest,
    ledger
  ] = await Promise.all([
    readRepo('docs/roadmap/atomic-gap-registry.md'),
    readRepo('packages/api/src/__tests__/routes.test.ts'),
    readWeb('scripts/fuel-domain-closure.test.mjs'),
    readWeb('scripts/pharmacy-domain-closure.test.mjs'),
    readWeb('scripts/cross-domain-closure.test.mjs'),
    readWeb('scripts/data-ops-production-closure.test.mjs'),
    readWeb('scripts/release-readiness-report.test.mjs'),
    readRepo('docs/release/composer-small-tasks-closure.md')
  ]);

  assert.match(registry, /### `search-category-label-url`[\s\S]*\| status \| done \|/);
  assert.match(searchCategoryTest, /facets\.categories\.find\(\(facet\) => facet\.value === 'dairy'\)/);
  assert.match(searchCategoryTest, /value: 'mejeri-ost-och-agg', label: 'Mejeri Ost Och Ägg'/);

  assert.ok(existsRepo('apps/web/src/app/fuel/stations/page.tsx'));
  assert.ok(existsRepo('apps/web/src/app/fuel/stations/[stationId]/page.tsx'));
  assert.match(fuelTest, /fuel search domain renders grade, operator, and station result cards/);
  assert.match(fuelTest, /fuel map domain supports selected station detail/);
  assert.match(fuelTest, /watchlist/i);

  assert.ok(existsRepo('apps/web/src/app/pharmacy/search/page.tsx'));
  assert.ok(existsRepo('apps/web/src/app/pharmacy/[product]/page.tsx'));
  assert.match(pharmacyTest, /no prescription/i);
  assert.match(pharmacyTest, /no medical advice/i);

  assert.match(crossDomainTest, /global search exposes all domain tabs/);
  assert.match(crossDomainTest, /map exposes required cross-domain routes/);
  assert.match(crossDomainTest, /watchlist and home close cross-domain/);

  for (const scriptPath of [
    'scripts/ops/source-run-report.mjs',
    'scripts/ops/quality-report.mjs',
    'scripts/ops/dead-letter-report.mjs',
    'scripts/ops/search-analytics-report.mjs',
    'scripts/ops/db-size-report.mjs',
    'scripts/ops/db-index-health.mjs',
    'scripts/ops/slow-query-report.mjs',
    'scripts/ops/check-gold-publish-gate.mjs'
  ]) {
    assert.ok(existsRepo(scriptPath), `${scriptPath} should exist`);
  }
  assert.match(dataOpsTest, /gold publish gate blocks critical fixture failures/);

  assert.ok(existsRepo('docs/qa/manual-ux-accessibility-checklist.md'));
  assert.ok(existsRepo('docs/qa/manual-smoke-test-plan.md'));
  assert.ok(existsRepo('docs/release/production-readiness-checklist.md'));
  assert.ok(existsRepo('scripts/ops/release-readiness-report.mjs'));
  assert.match(releaseReadinessTest, /release readiness report passes/);

  for (const task of ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5', 'Task 6']) {
    assert.match(ledger, new RegExp(task));
  }
});
