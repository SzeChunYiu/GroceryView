import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('market terminal design tokens', () => {
  it('exposes reusable grocery market tokens to CSS, Tailwind, and chart config', async () => {
    const tokens = await read('src/lib/market-terminal-tokens.ts');
    const globals = await read('src/app/globals.css');
    const tailwind = await read('tailwind.config.ts');
    const chart = await read('src/components/price-chart-terminal.tsx');

    for (const tokenGroup of ['color', 'typography', 'spacing', 'radius', 'chart', 'state', 'chains', 'countries']) {
      assert.match(tokens, new RegExp(`${tokenGroup}:`));
    }
    for (const state of ['confidence', 'freshness', 'rising', 'falling', 'forecast']) {
      assert.match(tokens, new RegExp(`${state}:`));
    }
    for (const chain of ['ica', 'willys', 'hemkop', 'coop', 'meny', 'rema1000']) {
      assert.match(tokens, new RegExp(`${chain}:`));
    }
    for (const country of ['se', 'no', 'dk', 'fi', 'is']) {
      assert.match(tokens, new RegExp(`${country}:`));
    }

    assert.match(globals, /--gv-color-canvas/);
    assert.match(globals, /--gv-font-mono/);
    assert.match(globals, /linear-gradient\(90deg/);
    assert.match(tailwind, /market:/);
    assert.match(tailwind, /var\(--gv-color-accent\)/);
    assert.match(chart, /marketTerminalChartTokens/);
    assert.doesNotMatch(tokens, /Math\.random|Date\.now/);
  });
});
