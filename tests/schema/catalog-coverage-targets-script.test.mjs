import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const scriptPath = new URL('../../scripts/ops/print-catalog-coverage-targets.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('catalog coverage target export script', () => {
  it('exports production coverage target JSON from live catalog tables', () => {
    assert.match(script, /DATABASE_URL is required/);
    assert.match(script, /from products order by id/);
    assert.match(script, /join latest_prices on latest_prices.store_id = stores.id/);
    assert.match(script, /from chains order by slug/);
    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(script, new RegExp(`['"]${chain}['"]`));
    }
    assert.equal(pkg.scripts['ops:catalog-coverage-targets'], 'node scripts/ops/print-catalog-coverage-targets.mjs');
  });

  it('self-test emits complete target JSON with required chains and branch-observed store mode', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    const targets = JSON.parse(output);
    assert.deepEqual(targets.targetChains, ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']);
    const hyphenatedOutput = execFileSync(process.execPath, [scriptPath.pathname, '--self-test-hyphenated-chain-slugs'], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(hyphenatedOutput).targetChains, ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']);
    assert.deepEqual(targets.targetProducts, ['coffee', 'milk']);
    assert.deepEqual(targets.targetStores, ['coop-odenplan', 'willys-odenplan']);
    assert.doesNotMatch(script, /select id from stores order by id/);
    assert.equal(targets.requireEveryProductInEveryStore, false);
  });

  it('self-test exports only connector-addressable external store refs', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test-store-external-refs'], { encoding: 'utf8' });
    const targets = JSON.parse(output);
    assert.deepEqual(targets.targetStores, ['1004599', '184900', '216502']);
  });

  it('can intersect observed target stores with the current daily connector store list', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test-store-external-refs', '--self-test-current-connectors'], { encoding: 'utf8' });
    const targets = JSON.parse(output);
    assert.deepEqual(targets.targetStores, ['216502']);
    assert.equal(targets.requireEveryProductInEveryStore, false);
  });
});
