import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('heatmap route locks row, column, tone, and cell-link semantics', async () => {
  const heatmap = await read('src/app/heatmap/page.tsx');

  assert.match(heatmap, /categorySummaries\.map\(\(category\) => \(\{/);
  assert.match(heatmap, /groceryIndex\.chains\.map\(\(chain\) => \(\{/);
  assert.match(heatmap, /calculateChainPriceIndex\(\[/);
  assert.match(heatmap, /if \(value < 96\).*emerald/s);
  assert.match(heatmap, /if \(value <= 103\).*amber/s);
  assert.match(heatmap, /return 'border-red-300 bg-red-100 text-red-950 hover:bg-red-200'/);
  assert.match(heatmap, /row\.cells\.map\(\(\{ chain, cell \}\) => \{/);
  assert.match(heatmap, /href=\{`\/grocery-index\/\$\{symbol\}`\}/);
});
