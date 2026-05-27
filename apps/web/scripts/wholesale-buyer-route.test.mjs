import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('country wholesale buyer route', () => {
  it('filters to B2B-priced bulk rows and compares per-unit retail references', async () => {
    const page = await read('src/app/[country]/wholesale/page.tsx');

    assert.match(page, /params: Promise<\{ country: string \}>/);
    assert.match(page, /row\.isB2BPriced && row\.isBulkPack/);
    assert.match(page, /Snabbgross/);
    assert.match(page, /7-Eleven B2B/);
    assert.match(page, /Retail reference/);
    assert.match(page, /retailUnitPrice/);
    assert.match(page, /wholesaleUnitPrice/);
    assert.match(page, /savingsPercent/);
    assert.match(page, /B2B priced \+ bulk only/);
    assert.match(page, /Retail reference rows are filtered out/);
  });
});
