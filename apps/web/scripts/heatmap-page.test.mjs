import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('heatmap page route', () => {
  it('locks row, column, tone, and linked-cell semantics', async () => {
    const source = await read('src/app/heatmap/page.tsx');

    assert.match(source, /import \{ categorySummaries \} from '@\/lib\/verified-data'/);
    assert.match(source, /const groceryIndex = calculateChainPriceIndex\(\[/);
    assert.match(source, /const matrixRows = categorySummaries\.map/);
    assert.match(source, /cells: groceryIndex\.chains\.map/);

    assert.match(source, /if \(value < 96\) return 'border-emerald-300/);
    assert.match(source, /if \(value <= 103\) return 'border-amber-300/);
    assert.match(source, /return 'border-red-300/);

    assert.match(source, /row\.cells\.map\(\(\{ chain, cell \}\)/);
    assert.match(source, /const symbol = indexSymbol\(chain\.chainId, row\.slug\)/);
    assert.match(source, /href=\{`\/index\/\$\{symbol\}`\}/);
    assert.match(source, /aria-label=\{`\$\{row\.label\} \$\{chain\.chainId\} index/);
  });
});
