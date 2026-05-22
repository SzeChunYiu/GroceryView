import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const scriptPath = new URL('../../scripts/ops/print-daily-connector-stores.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('daily connector stores export script', () => {
  it('documents the live Coop and Willys store catalog APIs used for branch metadata', () => {
    assert.match(script, /fetchWillysStores/);
    assert.match(script, /fetchCoopStores/);
    assert.match(script, /storesByChain/);
    assert.equal(
      pkg.scripts['ops:daily-connector-stores'],
      'npm run build -w @groceryview/ingestion && node scripts/ops/print-daily-connector-stores.mjs'
    );
  });

  it('self-test emits daily connector store metadata for supported branch-scoped chains', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    const body = JSON.parse(output);
    assert.deepEqual(body.supportedChains, ['willys', 'coop']);
    assert.equal(body.storesByChain.willys[0].storeId, '2149');
    assert.equal(body.storesByChain.coop[0].storeId, '196183');
    for (const chain of body.supportedChains) {
      for (const store of body.storesByChain[chain]) {
        assert.equal(typeof store.storeId, 'string');
        assert.equal(typeof store.name, 'string');
        assert.equal(typeof store.address, 'string');
        assert.equal(typeof store.city, 'string');
      }
    }
  });
});
