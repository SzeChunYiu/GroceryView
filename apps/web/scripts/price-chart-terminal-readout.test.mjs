import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('PriceChartTerminal readout includes hovered source name and latest fallback', async () => {
  const terminal = await read('src/components/price-chart-terminal.tsx');

  assert.match(terminal, /type ChartPointReadout = \{[\s\S]*storeName: string;[\s\S]*valueLabel: string;[\s\S]*volatilityLowerLabel: string;[\s\S]*volatilityUpperLabel: string;[\s\S]*\}/);
  assert.match(terminal, /storeName: series\.storeName/);
  assert.match(terminal, /const activeReadout = crosshairReadout \?\? latestReadoutFor\(activeWindow\)/);
  assert.match(terminal, /chartApi\.subscribeCrosshairMove\(handleCrosshairMove\)/);
  assert.match(terminal, /readoutByTime\.get\(selectedTime\)/);
  assert.match(terminal, /`\$\{activeReadout\.storeName\} · \$\{activeReadout\.valueLabel\} · \$\{activeReadout\.dateLabel\}`/);
  assert.match(terminal, /volatility bounds: \{activeReadout \? `\$\{activeReadout\.volatilityLowerLabel\} → \$\{activeReadout\.volatilityUpperLabel\}` : 'not reported'\}/);
});
