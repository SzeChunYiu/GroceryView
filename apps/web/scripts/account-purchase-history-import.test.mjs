import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFile(join(root, path), 'utf8');

describe('account purchase history CSV import', () => {
  it('seeds account staples favorites brand preferences and budgets from purchase rows', async () => {
    const account = await read('src/app/account/page.tsx');
    const dialog = await read('src/components/BulkImportDialog.tsx');
    const personalization = await read('src/lib/personalization.ts');
    const recurringBasket = await read('src/lib/recurring-basket.ts');

    assert.match(account, /buildPurchaseHistoryPersonalizationSeed/);
    assert.match(account, /parsePurchaseHistoryCsv/);
    assert.match(account, /account staples, favorites, and brand preferences/);
    assert.match(account, /Brand preference seeds/);
    assert.match(account, /Budget seeds/);
    assert.match(account, /BulkImportDialog importMode="purchase-history"/);

    assert.match(dialog, /buildPurchaseHistoryPersonalizationSeed/);
    assert.match(dialog, /data-purchase-history-personalization-seeds/);
    assert.match(dialog, /staple seed\(s\)/);
    assert.match(dialog, /favorite seed\(s\)/);
    assert.match(dialog, /brand preference seed\(s\)/);
    assert.match(dialog, /Brand preference seeds/);

    assert.match(personalization, /PurchaseHistoryPersonalizationSeed/);
    assert.match(personalization, /parsePurchaseHistoryCsv/);
    assert.match(personalization, /buildPurchaseHistoryImportPreview/);
    assert.match(personalization, /buildPurchaseHistoryPersonalizationSeed/);
    assert.match(personalization, /stapleSeeds/);
    assert.match(personalization, /favoriteProductSeeds/);
    assert.match(personalization, /brandPreferenceSeeds/);
    assert.match(personalization, /budgetSeeds/);
    assert.match(personalization, /Purchase history imports seed personalization only after a signed-in shopper reviews the CSV preview/);

    assert.match(recurringBasket, /parsePurchaseHistoryCsv/);
    assert.match(recurringBasket, /buildPurchaseHistoryImportPreview/);
  });
});
