import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('retailer data freshness banners', () => {
  it('shows last successful ingest time, stale warnings, and affected chains on source-heavy pages', async () => {
    const [dataSourcesPage, sourceHealth, dataUi] = await Promise.all([
      read('src/app/data-sources/page.tsx'),
      read('src/lib/source-health.ts'),
      read('src/components/data-ui.tsx')
    ]);

    assert.match(sourceHealth, /RetailerFreshnessBannerRow/);
    assert.match(sourceHealth, /buildRetailerFreshnessBanners/);
    assert.match(sourceHealth, /lastSuccessfulIngestLabel/);
    assert.match(sourceHealth, /staleAfterHours/);
    assert.match(sourceHealth, /affectedChains/);
    assert.match(sourceHealth, /data is stale; use caution before trusting current prices/);

    assert.match(dataUi, /DataFreshnessBanner/);
    assert.match(dataUi, /data-retailer-freshness-banner/);
    assert.match(dataUi, /data-source-freshness-status/);
    assert.match(dataUi, /Last successful ingest/);
    assert.match(dataUi, /Affected chains/);

    assert.match(dataSourcesPage, /buildRetailerFreshnessBanners\(sourceCoverage\)/);
    assert.match(dataSourcesPage, /<DataFreshnessBanner rows=\{retailerFreshnessBanners\} \/>/);
  });
});
