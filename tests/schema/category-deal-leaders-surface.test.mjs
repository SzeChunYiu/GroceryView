import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('category deal leader surfaces', () => {
  it('keeps homepage and category pages backed by summarized verified leader data', () => {
    const home = readFileSync('apps/web/src/app/page.tsx', 'utf8');
    const category = readFileSync('apps/web/src/app/categories/[slug]/page.tsx', 'utf8');
    const verifiedData = readFileSync('apps/web/src/lib/verified-data.ts', 'utf8');

    assert.match(verifiedData, /summarizeCategoryDealLeaders\(\{/);
    assert.match(verifiedData, /minimumSourceConfidence:\s*0\.6/);
    assert.match(verifiedData, /cross-chain spread derived/);

    assert.match(home, /categoryDealLeaders/);
    assert.match(home, /data-home-deal-leaders/);
    assert.match(home, /Today&apos;s best deals/);
    assert.match(home, /href=\{`\/products\/\$\{deal\.productSlug\}`\}/);
    assert.match(home, /href=\{`\/categories\/\$\{deal\.categorySlug\}`\}/);
    assert.match(home, /source confidence and visible cross-chain coverage/);

    assert.match(category, /summarizeCategoryDealLeaders/);
    assert.match(category, /data-category-deal-leaders/);
    assert.match(category, /href=\{`\/products\/\$\{leader\.productId\}`\}/);
    assert.match(category, /sourceConfidence/);
    assert.match(category, /visible chain coverage only/);
  });
});
