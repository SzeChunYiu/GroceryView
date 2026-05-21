import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const scriptPath = new URL('../../scripts/ops/validate-production-env.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('production env value validation script', () => {
  it('validates daily connectors and catalog coverage targets for all required chains', () => {
    for (const name of ['GROCERYVIEW_DAILY_CONNECTORS_JSON', 'CATALOG_COVERAGE_TARGETS_JSON']) {
      assert.match(script, new RegExp(name));
    }
    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(script, new RegExp(`['"]${chain}['"]`));
    }
    assert.match(script, /requireEveryProductInEveryStore must be true/);
    assert.equal(pkg.scripts['ops:validate-production-env'], 'node scripts/ops/validate-production-env.mjs');
  });

  it('self-test passes with six connectors and product-store matrix targets', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), {
      status: 'ready',
      connectorCount: 6,
      coverageProductCount: 2,
      coverageStoreCount: 2
    });
  });

  it('fails closed when required env values are missing', () => {
    const result = spawnSync(process.execPath, [scriptPath.pathname], { encoding: 'utf8', env: {} });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing required env/);
    assert.match(result.stderr, /GROCERYVIEW_DAILY_CONNECTORS_JSON/);
    assert.match(result.stderr, /CATALOG_COVERAGE_TARGETS_JSON/);
  });
});
