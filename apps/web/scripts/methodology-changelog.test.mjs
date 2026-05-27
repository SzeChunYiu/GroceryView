import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);

function read(relative) {
  return readFile(new URL(relative, root), 'utf8');
}

test('public methodology changelog is structured and linked from source surfaces', async () => {
  const changelog = await read('src/lib/methodology-changelog.ts');
  const page = await read('src/app/methodology-changelog/page.tsx');
  const seo = await read('src/lib/seo.ts');
  const dataSources = await read('src/app/data-sources/page.tsx');
  const chainIndex = await read('src/app/chain-index/page.tsx');
  const methodology = await read('src/app/index-methodology/page.tsx');

  assert.match(changelog, /export const methodologyChangelogEntries/);
  assert.match(changelog, /changeType: 'data_source'/);
  assert.match(changelog, /changeType: 'index_methodology'/);
  assert.match(changelog, /changeType: 'market_coverage'/);
  assert.match(changelog, /confidence: 'high'/);
  assert.match(changelog, /freshnessLabel/);
  assert.match(changelog, /affectedRoutes/);
  assert.match(changelog, /source: \{/);
  assert.match(changelog, /PR #3410/);

  assert.match(page, /Data and methodology changes/);
  assert.match(page, /methodologyChangelogEntries\.map/);
  assert.match(page, /entry\.affectedRoutes\.map/);
  assert.match(page, /entry\.evidence\.map/);
  assert.match(page, /latestMethodologyChangelogEntry/);
  assert.match(seo, /'\/methodology-changelog'/);
  assert.match(dataSources, /href="\/methodology-changelog"/);
  assert.match(chainIndex, /href="\/methodology-changelog"/);
  assert.match(methodology, /href="\/methodology-changelog"/);
});
