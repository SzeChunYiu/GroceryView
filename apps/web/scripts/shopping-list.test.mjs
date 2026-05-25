import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('shopping list route', () => {
  it('ships the requested route, checkable row component, and localStorage-backed hook', async () => {
    const [page, listSharePreview, row, hook, shareRoute, bulkImport, searchRoute, listCard, listSequencing, tripPlanner] = await Promise.all([
      read('src/app/list/page.tsx'),
      read('src/components/list-share-preview.tsx'),
      read('src/components/CheckableListItem.tsx'),
      read('src/hooks/useList.ts'),
      read('src/app/api/list/share/route.ts'),
      read('src/components/BulkImportDialog.tsx'),
      read('../../apps/api/src/routes/search.ts'),
      read('src/components/list-card.tsx'),
      read('src/lib/list-sequencing.ts'),
      read('src/lib/trip-planner.ts')
    ]);

    assert.match(page, /ListSharePreview/);
    assert.match(page, /metadataForShoppingListShare/);
    assert.match(listSharePreview, /useList/);
    assert.match(listSharePreview, /CheckableListItem/);
    assert.match(listSharePreview, /BulkImportDialog/);
    assert.match(listSharePreview, /addImportedItems/);
    assert.match(listSharePreview, /Shopping list/);

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
    assert.match(hook, /verifyShareToken/);
    assert.match(hook, /crypto.subtle.sign/);
    assert.match(hook, /Invalid read-only list link signature/);
    assert.match(hook, /shareLink/);

    assert.match(shareRoute, /createHmac/);
    assert.match(shareRoute, /hmac-sha256/);
    assert.match(shareRoute, /expiresAt/);
    assert.match(shareRoute, /shareUrl/);

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

    assert.match(listSequencing, /STORE_AISLE_LAYOUT_STORAGE_KEY = 'groceryview:shopping-list:aisle-layout:v1'/);
    assert.match(listSequencing, /storeAisleLayoutPreferenceFromStorage/);
    assert.match(listSequencing, /normalizeStoreAisleLayoutPreference/);
    assert.match(listSequencing, /moveStoreAisleDepartment/);
    assert.match(tripPlanner, /storeLayoutDepartmentsForOrder\(chain: StoreLayoutChain = 'ica', groupOrder: StoreLayoutGroupOrder = 'store-layout', departmentOrder\?: string\[]\)/);
    assert.match(tripPlanner, /sortItemsByStoreLayout<[\s\S]*departmentOrder\?: string\[]/);
    assert.match(listCard, /STORE_AISLE_LAYOUT_STORAGE_KEY/);
    assert.match(listCard, /window\.localStorage\.getItem\(STORE_AISLE_LAYOUT_STORAGE_KEY\)/);
    assert.match(listCard, /window\.localStorage\.setItem\(STORE_AISLE_LAYOUT_STORAGE_KEY/);
    assert.match(listCard, /data-store-aisle-layout-controls/);
    assert.match(listCard, /moveStoreAisleDepartment/);
    assert.match(listCard, /sortItemsByStoreLayout\([\s\S]*aisleLayoutPreference\.departmentOrder/);
  });
});
