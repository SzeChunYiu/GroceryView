import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('feature experiment framework contract', () => {
  it('keeps experiments typed, consent-gated, deterministic, and kill-switchable', async () => {
    const registry = await read('src/lib/feature-experiments.ts');
    const panel = await read('src/components/feature-experiment-panel.tsx');
    const route = await read('src/app/api/analytics/experiment-exposures/route.ts');
    const shell = await read('src/components/market-shell.tsx');

    assert.match(registry, /type ExperimentKey/);
    assert.match(registry, /killSwitch/);
    assert.match(registry, /deterministicExperimentBucket/);
    assert.match(registry, /scope: 'ui-copy-layout-only'/);
    assert.match(registry, /no_price_data_logic/);
    assert.match(panel, /groceryview:consent:state/);
    assert.match(panel, /postExposure/);
    assert.match(panel, /analytics consent missing, exposure not posted/);
    assert.match(route, /analyticsConsent === true/);
    assert.match(route, /no price, ranking, product, or basket data/);
    assert.match(shell, /FeatureExperimentPanel/);
  });
});
