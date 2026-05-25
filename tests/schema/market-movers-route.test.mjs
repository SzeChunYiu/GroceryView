import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../../apps/web/src/app/movers/page.tsx', import.meta.url), 'utf8');
const verifiedData = readFileSync(new URL('../../apps/web/src/lib/verified-data.ts', import.meta.url), 'utf8');
const appNav = readFileSync(new URL('../../apps/web/src/components/app-nav.tsx', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../../apps/web/src/app/sitemap.ts', import.meta.url), 'utf8');

describe('market movers route', () => {
  it('renders a discoverable movers board with route metadata and navigation', () => {
    assert.match(page, /weeklyPriceMoversBoard/);
    assert.match(page, /data-market-mover/);
    assert.match(page, /routeMetadata\(\{\s*path: '\/movers'/);
    assert.match(appNav, /href: '\/movers'/);
    assert.match(sitemap, /entry\('\/movers'/);
  });

  it('uses real observed history with category, source, unit-price, and coverage filters', () => {
    assert.match(verifiedData, /summarizePriceHistory\(historyPoints\)/);
    assert.match(verifiedData, /priceDropMoversBoard/);
    assert.match(verifiedData, /priceRiseMoversBoard/);
    assert.match(verifiedData, /marketMoverFilterOptions/);
    assert.match(page, /selectedCategory/);
    assert.match(page, /selectedChain/);
    assert.match(page, /selectedUnit/);
    assert.match(page, /minimumCoverage/);
    assert.match(page, /unit-price-alerts\?product=/);
  });
});
