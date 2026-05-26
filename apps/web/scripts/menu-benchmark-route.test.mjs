import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('restaurant menu benchmark route', () => {
  it('ships the country-scoped restaurant menu benchmark surface', async () => {
    const page = await read('src/app/[country]/restaurants/menu-benchmark/page.tsx');
    const helper = await read('src/lib/menu-benchmark.ts');

    assert.match(page, /Restaurant menu benchmark/);
    assert.match(page, /type="file"/);
    assert.match(page, /Menu text/);
    assert.match(page, /benchmarkMenuItems/);
    assert.match(page, /summarizeMenuBenchmark/);
    assert.match(page, /snapshot\.retrievedLabel/);
    assert.match(page, /priced unusually high or low/);

    assert.match(helper, /priced-high-vs-cost/);
    assert.match(helper, /priced-low-vs-cost/);
    assert.match(helper, /foodCostPercent < 18/);
    assert.match(helper, /foodCostPercent > 42/);
    assert.match(helper, /estimatedCost/);
  });
});
