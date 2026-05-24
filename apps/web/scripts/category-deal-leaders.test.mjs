import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('category deal leaders surfaces', () => {
  it('wires real deal leaders into category pages and the homepage shell', async () => {
    const categoryPage = await read('src/app/categories/[slug]/page.tsx');
    const marketShell = await read('src/components/market-shell.tsx');
    const verified = await read('src/lib/verified-data.ts');

    assert.match(categoryPage, /summarizeCategoryDealLeaders/);
    assert.match(categoryPage, /categoryDealLeaderCandidates\.filter/);
    assert.match(categoryPage, /sourceConfidence/);
    assert.match(categoryPage, /href=\{`\/products\/\$\{leader\.productId\}`\}/);

    assert.match(marketShell, /Today(?:&apos;|')s best category deals/);
    assert.match(marketShell, /categoryDealLeaders\.slice\(0, 8\)/);
    assert.match(marketShell, /href=\{`\/categories\/\$\{leader\.categorySlug\}`\}/);
    assert.match(marketShell, /sourceConfidence labels/);

    assert.match(verified, /categoryDealLeaderCandidates = matchedChainProducts\.map/);
    assert.match(verified, /summarizeCategoryDealLeaders\(\{/);
  });
});
