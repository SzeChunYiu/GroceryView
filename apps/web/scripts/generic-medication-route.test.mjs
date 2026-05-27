import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('generic medication comparison route', () => {
  it('links branded OTC products to generics by active ingredient and savings evidence', async () => {
    const page = await read('src/app/[country]/pharmacy/[product]/page.tsx');
    const helper = await read('src/lib/generic-medication.ts');

    assert.match(page, /params: Promise<PageParams>/);
    assert.match(page, /buildGenericMedicationComparison/);
    assert.match(page, /Active ingredient match/);
    assert.match(page, /Average savings/);
    assert.match(page, /not substitution advice/);
    assert.match(page, /notFound/);

    assert.match(helper, /activeIngredientId/);
    assert.match(helper, /productKind: 'branded'/);
    assert.match(helper, /productKind: 'generic'/);
    assert.match(helper, /averageGenericPrice/);
    assert.match(helper, /averageSavingsPercent/);
    assert.match(helper, /brandedMedicationSlugs/);
  });
});
