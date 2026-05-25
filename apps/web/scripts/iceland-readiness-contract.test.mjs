import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('Iceland coverage readiness gate wiring', () => {
  it('ships an ops script and API route that fail closed before public Iceland claims', async () => {
    const ops = await read('../../packages/ops/src/index.ts');
    const route = await read('src/app/api/ops/iceland-readiness/route.ts');
    const script = await read('../../scripts/ops/print-iceland-coverage-readiness.mjs');
    const pkg = await read('../../package.json');

    assert.match(ops, /export const icelandCoverageThresholds/);
    assert.match(ops, /buildIcelandCoverageReadinessReport/);
    assert.match(ops, /publicClaimsAllowed: productionReady/);
    assert.match(ops, /reykjavikClaimsAllowed: reykjavikReady/);
    assert.match(ops, /iceland_starter_basket_only/);
    assert.match(ops, /iceland_live_price_evidence_missing/);
    assert.match(route, /icelandCoverageInput/);
    assert.match(route, /export const runtime = 'nodejs'/);
    assert.match(route, /process\.env\.ICELAND_COVERAGE_JSON/);
    assert.match(route, /emptyIcelandCoverageReadinessInput/);
    assert.match(script, /ICELAND_COVERAGE_JSON/);
    assert.match(script, /--self-test-preview/);
    assert.match(script, /--self-test-reykjavik/);
    assert.match(script, /--self-test-production/);
    assert.match(pkg, /ops:iceland-readiness/);
  });
});
