import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('Norway coverage readiness gate wiring', () => {
  it('ships an ops script and API route that fail closed before public Norway claims', async () => {
    const ops = await read('../../packages/ops/src/index.ts');
    const route = await read('src/app/api/ops/norway-readiness/route.ts');
    const script = await read('../../scripts/ops/print-norway-coverage-readiness.mjs');
    const pkg = await read('../../package.json');

    assert.match(ops, /export const norwayCoverageThresholds/);
    assert.match(ops, /buildNorwayCoverageReadinessReport/);
    assert.match(ops, /publicClaimsAllowed: productionReady/);
    assert.match(ops, /norway_market_not_demo_ready/);
    assert.match(ops, /norway_freshness_evidence_missing/);
    assert.match(route, /norwayCoverageInput/);
    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /process\.env\.NORWAY_COVERAGE_JSON/);
    assert.match(route, /emptyNorwayCoverageReadinessInput/);
    assert.match(script, /NORWAY_COVERAGE_JSON/);
    assert.match(script, /--self-test-demo/);
    assert.match(script, /--self-test-production/);
    assert.match(pkg, /ops:norway-readiness/);
  });
});
