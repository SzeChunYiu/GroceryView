import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('category deal leader surfaces', () => {
  it('keeps homepage and category pages backed by summarized verified leader data', () => {
    const homePage = readFileSync('apps/web/src/app/page.tsx', 'utf8');
    const homeShell = readFileSync('apps/web/src/components/mvp/mvp-home-page.tsx', 'utf8');
    const mvpData = readFileSync('apps/web/src/lib/mvp/data.ts', 'utf8');
    const category = readFileSync('apps/web/src/app/categories/[slug]/page.tsx', 'utf8');
    const verifiedData = readFileSync('apps/web/src/lib/verified-data.ts', 'utf8');

    assert.match(verifiedData, /summarizeCategoryDealLeaders\(\{/);
    assert.match(verifiedData, /minimumSourceConfidence:\s*0\.6/);
    assert.match(verifiedData, /cross-chain spread derived/);

    assert.match(homePage, /MvpHomePage/);
    assert.match(mvpData, /categoryDealLeaders/);
    assert.match(homeShell, /Today's best deals/);
    assert.match(homeShell, /href=\{productRoute\(deal\.product\.id\)\}/);
    assert.match(homeShell, /Open full deals feed/);
    assert.match(homeShell, /EvidenceStrip evidence=\{deal\}/);

    assert.match(category, /summarizeCategoryDealLeaders/);
    assert.match(category, /data-category-deal-leaders/);
    assert.match(category, /href=\{`\/products\/\$\{leader\.productId\}`\}/);
    assert.match(category, /sourceConfidence/);
    assert.match(category, /visible chain coverage only/);
  });
});
