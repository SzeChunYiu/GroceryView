import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const pkg = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
const script = await readFile(new URL('../../../scripts/ops/print-web-bundle-pr-summary.mjs', import.meta.url), 'utf8');
const chart = await readFile(new URL('../src/components/price-chart-terminal.tsx', import.meta.url), 'utf8');

test('web bundle PR summary keeps chart modules lazy and Core Web Vitals visible', () => {
  assert.match(pkg, /"perf:bundle:pr-summary"/);
  assert.match(workflow, /Web bundle PR summary/);
  assert.match(workflow, /npm run perf:bundle:pr-summary -w @groceryview\/web/);
  assert.match(script, /Core Web Vitals/);
  assert.match(script, /docs\/test-results\/web-bundle-pr-summary\.md/);
  assert.match(script, /lightweight-charts/);
  assert.match(chart, /import\('lightweight-charts'\)/);
  assert.doesNotMatch(chart, /import\s+\{[^}]*\}\s+from 'lightweight-charts'/);
});
