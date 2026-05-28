import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repoRoot = new URL('../../..', import.meta.url);

test('release readiness report passes with ads, accessibility, QA docs, and release gate evidence', async () => {
  const { stdout } = await execFileAsync('node', ['scripts/ops/release-readiness-report.mjs'], {
    cwd: repoRoot,
    env: { ...process.env, TZ: 'UTC' }
  });
  const report = JSON.parse(stdout);

  assert.equal(report.reportType, 'release_readiness_report');
  assert.equal(report.status, 'ready');
  assert.equal(report.summary.blocked, 0);

  for (const id of [
    'ad_label_exact',
    'ad_free_sensitive_routes',
    'search_ad_after_result_12',
    'no_nested_ads',
    'live_adsense_deferred',
    'preview_accessibility',
    'visual_accessibility',
    'manual_qa_docs',
    'release_gate_commands',
    'closure_tests'
  ]) {
    assert.equal(report.rows.find((row) => row.id === id)?.status, 'pass', `${id} should pass`);
  }
});

test('manual QA and production readiness docs include required closure sections', async () => {
  const [ux, smoke, release] = await Promise.all([
    readFile(new URL('../../../docs/qa/manual-ux-accessibility-checklist.md', import.meta.url), 'utf8'),
    readFile(new URL('../../../docs/qa/manual-smoke-test-plan.md', import.meta.url), 'utf8'),
    readFile(new URL('../../../docs/release/production-readiness-checklist.md', import.meta.url), 'utf8')
  ]);

  assert.match(ux, /Keyboard reachable/);
  assert.match(ux, /Escape closes/);
  assert.match(ux, /focus returns to trigger/);
  assert.match(ux, /plain summary/);
  assert.match(smoke, /Search/);
  assert.match(smoke, /Map/);
  assert.match(smoke, /Watchlist/);
  assert.match(release, /npm run test -w @groceryview\/web/);
  assert.match(release, /npx tsc --noEmit/);
  assert.match(release, /node scripts\/ops\/release-readiness-report\.mjs/);
});
