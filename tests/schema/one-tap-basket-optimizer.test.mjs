import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('one-tap basket optimizer surface', () => {
  it('keeps busy-user basket optimization scoped, confidence-labeled, and override-safe', () => {
    const weeklyBasketPage = readFileSync('apps/web/src/app/weekly-basket/page.tsx', 'utf8');
    const demoData = readFileSync('apps/web/src/lib/demo-data.ts', 'utf8');

    assert.match(demoData, /compareBasketStrategies\(weeklyBasketOptimizerInput\)/);
    assert.match(demoData, /scope:\s*'cheapest_single_store'/);
    assert.match(demoData, /scope:\s*'split_shop'/);
    assert.match(demoData, /scope:\s*'preferred_chains'/);
    assert.match(demoData, /preservedManualOverrideCount/);
    assert.match(demoData, /manualOverrides/);

    assert.match(weeklyBasketPage, /data-one-tap-basket-optimizer/);
    assert.match(weeklyBasketPage, /data-one-tap-scope/);
    assert.match(weeklyBasketPage, /cheapest single store, split shop, or preferred chains/);
    assert.match(weeklyBasketPage, /Manual overrides stay pinned/);
    assert.match(weeklyBasketPage, /data-preserved-manual-override/);
    assert.match(weeklyBasketPage, /confidenceLabel/);
  });
});
