import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const repoRoot = new URL('../../..', import.meta.url);
const source = (path) => readFileSync(new URL(path, repoRoot), 'utf8');

function runJson(script, extraEnv = {}) {
  const result = spawnSync(process.execPath, [script], {
    cwd: repoRoot,
    env: {
      ...process.env,
      GROCERYVIEW_REPORT_MODE: 'fixture',
      GROCERYVIEW_SOURCE_RUN_REPORT_ALLOW_FAILURES: '1',
      GROCERYVIEW_DEAD_LETTER_ALLOW_CRITICAL: '1',
      GROCERYVIEW_DB_INDEX_HEALTH_ALLOW_UNUSED: '1',
      ...extraEnv
    },
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${script} failed: ${result.stderr}`);
  const report = JSON.parse(result.stdout);
  assert.match(report.status, /^(live|generated|scaffold|stale|unavailable)$/);
  assert.equal(typeof report.sourceLabel, 'string');
  assert.equal(Array.isArray(report.rows), true);
  assert.equal(typeof report.generatedAt, 'string');
  assert.equal(typeof report.nextIntegration, 'string');
  return report;
}

test('required data ops reports output shared JSON contracts', () => {
  for (const script of [
    'scripts/ops/source-run-report.mjs',
    'scripts/ops/quality-report.mjs',
    'scripts/ops/dead-letter-report.mjs',
    'scripts/ops/search-analytics-report.mjs',
    'scripts/ops/db-size-report.mjs',
    'scripts/ops/db-index-health.mjs',
    'scripts/ops/slow-query-report.mjs'
  ]) {
    const report = runJson(script);
    assert.equal(report.status, 'generated');
    assert.ok(report.rows.length > 0, `${script} should return rows`);
  }
});

test('gold publish gate blocks critical fixture failures', () => {
  const result = spawnSync(process.execPath, ['scripts/ops/check-gold-publish-gate.mjs'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      GROCERYVIEW_REPORT_MODE: 'fixture',
      GROCERYVIEW_GOLD_PUBLISH_FIXTURE_SCENARIO: 'blocked'
    },
    encoding: 'utf8'
  });
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'generated');
  assert.equal(report.gateStatus, 'blocked');
  assert.equal(report.publishAllowed, false);
  assert.match(report.blockers.join(' '), /quality_critical_checks_failed|gold_snapshot_empty/);
});

test('idempotency helper and production database closure docs cover required behaviors', () => {
  const idempotency = source('packages/ingestion/src/idempotency.ts');
  const scalingPlan = source('docs/data/database-scaling-plan.md');
  const sourceRunContract = source('docs/data/source-run-contract.md');

  assert.match(idempotency, /buildSourceRunInputHash/);
  assert.match(idempotency, /buildObservationIdempotencyKey/);
  assert.match(idempotency, /stableValue/);
  assert.match(scalingPlan, /Partition plan for raw_records and observations/);
  assert.match(scalingPlan, /Bulk load plan using staging\/COPY/);
  assert.match(scalingPlan, /Quality gate publish blocker/);
  assert.match(scalingPlan, /DB health report/);
  assert.match(scalingPlan, /Slow query report/);
  for (const table of ['source_runs', 'raw_records', 'dead_letters', 'quality_checks', 'lineage_events', 'latest_prices', 'search_documents', 'gold_snapshots', 'analytics_events']) {
    assert.match(sourceRunContract, new RegExp(table));
  }
});

test('admin report pages show generated report status while public pages avoid debug identifiers', () => {
  for (const adminPath of [
    'apps/web/src/app/admin/source-runs/page.tsx',
    'apps/web/src/app/admin/data-quality/page.tsx',
    'apps/web/src/app/admin/dead-letters/page.tsx',
    'apps/web/src/app/admin/search-analytics/page.tsx',
    'apps/web/src/app/admin/query-performance/page.tsx',
    'apps/web/src/app/admin/storage/page.tsx'
  ]) {
    const page = source(adminPath);
    assert.match(page, /AdminReportSourceLabel/);
  }

  const labelHelper = source('apps/web/src/lib/admin-backstage-scaffold.tsx');
  assert.match(labelHelper, /Report status: \{label\.status\}/);
  assert.match(labelHelper, /mode === 'generated'/);

  for (const publicPath of [
    'apps/web/src/app/search/page.tsx',
    'apps/web/src/app/map/page.tsx',
    'apps/web/src/app/watchlist/page.tsx',
    'apps/web/src/components/mvp/mvp-home-page.tsx'
  ]) {
    const publicSource = source(publicPath);
    assert.doesNotMatch(publicSource, /raw_records|source_runs|dead_letters|quality_checks|lineage_events|gold_snapshots|analytics_events/);
  }
});
