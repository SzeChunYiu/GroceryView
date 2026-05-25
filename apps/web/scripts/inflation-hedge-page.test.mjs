import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageUrl = new URL('../src/app/[country]/inflation-hedge/page.tsx', import.meta.url);

describe('personal inflation hedge page', () => {
  it('compares basket inflation to official CPI and lists verified hedge switches', async () => {
    const source = await readFile(pageUrl, 'utf8');

    assert.match(source, /calculatePersonalGroceryInflation/);
    assert.match(source, /personalGroceryInflation/);
    assert.match(source, /officialCpiReference/);
    assert.match(source, /SCB/);
    assert.match(source, /KPI2020COICOPM/);
    assert.match(source, /personalVsOfficialGap/);
    assert.match(source, /hedgedVsOfficialGap/);
    assert.match(source, /buildHedgeCandidates/);
    assert.match(source, /topChainSpreads/);
    assert.match(source, /Store and brand moves ranked by inflation relief/);
    assert.match(source, /No magic deflator, just sourced substitutions/);
  });
});
