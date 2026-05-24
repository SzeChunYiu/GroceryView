import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('shopping list route', () => {
  it('ships the requested route, checkable row component, and localStorage-backed hook', async () => {
    const [page, row, hook, shareRoute, bulkImport, searchRoute] = await Promise.all([
      read('src/app/list/page.tsx'),
      read('src/components/CheckableListItem.tsx'),
      read('src/hooks/useList.ts'),
      read('src/app/api/list/share/route.ts'),
      read('src/components/BulkImportDialog.tsx'),
      read('../../apps/api/src/routes/search.ts')
    ]);

    assert.match(page, /useList/);
    assert.match(page, /CheckableListItem/);
    assert.match(page, /BulkImportDialog/);
    assert.match(page, /addImportedItems/);
    assert.match(page, /Shopping list/);
    assert.match(page, /shareLink/);
    assert.match(page, /Expired links stay read-only/);

    assert.match(row, /'use client'/);
    assert.match(row, /type="checkbox"/);
    assert.match(row, /checked=\{item\.checked\}/);
    assert.match(row, /onToggle\(item\.id\)/);
    assert.match(row, /line-through/);
    assert.match(row, /matchedProductSlug/);

    assert.match(hook, /'use client'/);
    assert.match(hook, /localStorage\.getItem\(LIST_STORAGE_KEY\)/);
    assert.match(hook, /localStorage\.setItem\(LIST_STORAGE_KEY/);
    assert.match(hook, /toggleItemChecked/);
    assert.match(hook, /checked: !item\.checked/);
    assert.match(hook, /addImportedItems/);
    assert.match(hook, /importSource: 'bulk-clipboard'/);
    assert.match(hook, /matchedProductSlug/);
    assert.match(hook, /ShareLinkMetadata/);
    assert.match(hook, /URLSearchParams\(search\)\.get\('share'\)/);
    assert.match(hook, /expiresAt/);
    assert.match(hook, /isExpired/);

    assert.match(shareRoute, /expiresAt/);
    assert.match(shareRoute, /shareUrl/);
    assert.match(shareRoute, /base64url/);

    assert.match(bulkImport, /'use client'/);
    assert.match(bulkImport, /parseBulkImportLines/);
    assert.match(bulkImport, /matchBulkImportLineToCatalog/);
    assert.match(bulkImport, /productCatalogMatches/);
    assert.match(bulkImport, /navigator\.clipboard\.readText/);
    assert.match(bulkImport, /one item per line/i);
    assert.match(bulkImport, /matchedProductSlug/);
    assert.match(bulkImport, /unmatchedLines/);

    assert.match(searchRoute, /searchRoutes/);
    assert.match(searchRoute, /products\/search\/list-import/);
    assert.match(searchRoute, /plainTextLines/);
    assert.match(searchRoute, /matchedProductSlug/);
  });
});
