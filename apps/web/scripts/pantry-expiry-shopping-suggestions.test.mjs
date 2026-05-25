import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('pantry expiry shopping suggestions', () => {
  it('keeps deal evidence traceable from current pantry deals to replacement links', async () => {
    const pantryLib = await read('src/lib/pantry.ts');
    const inventoryPage = await read('src/app/pantry-inventory/page.tsx');
    const tracker = await read('src/components/pantry-tracker.tsx');

    assert.match(pantryLib, /buildPantryDealEvidence/);
    assert.match(pantryLib, /storeName/);
    assert.match(pantryLib, /dealScore/);
    assert.match(pantryLib, /price/);
    assert.match(pantryLib, /href/);

    assert.match(inventoryPage, /currentPantryDeals/);
    assert.match(inventoryPage, /replacementHref/);
    assert.match(inventoryPage, /Link target:/);
    assert.match(inventoryPage, /Deal evidence:/);

    assert.match(tracker, /dealEvidence/);
    assert.match(tracker, /Target/);
    assert.match(tracker, /Deal evidence:/);
  });
});
