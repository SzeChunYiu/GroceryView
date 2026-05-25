import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('product analytics dashboard', () => {
  it('surfaces aggregate product strategy signals on the data sources page', async () => {
    const [analytics, dataSources, dataGrid] = await Promise.all([
      read('src/lib/analytics.ts'),
      read('src/app/data-sources/page.tsx'),
      read('src/components/data-grid.tsx')
    ]);

    assert.match(analytics, /productAnalyticsDashboard/);
    assert.match(analytics, /search_volume/);
    assert.match(analytics, /zero_result_queries/);
    assert.match(analytics, /list_adds/);
    assert.match(analytics, /alert_creates/);
    assert.match(analytics, /deal_clicks/);
    assert.match(analytics, /no search terms, user IDs, product IDs, or basket contents/);

    assert.match(dataSources, /Internal product analytics/);
    assert.match(dataSources, /Search volume, zero-result queries, list adds, alert creates, and deal clicks/);
    assert.match(dataSources, /productAnalyticsDashboard\.metrics\.map/);
    assert.match(dataSources, /DataGrid compact/);
    assert.match(dataGrid, /compact/);
  });
});
