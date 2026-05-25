import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('basket builder cheaper substitutions', () => {
  it('uses normalized units and same-category matching before suggesting cheaper substitutes', async () => {
    const [builder, dedupe, normalization] = await Promise.all([
      read('src/components/basket-builder.tsx'),
      read('src/lib/deduplicate-products.ts'),
      read('src/lib/normalization.ts')
    ]);

    assert.match(builder, /findCheaperBasketSubstitutions/);
    assert.match(builder, /Cheaper substitutions/);
    assert.match(builder, /Review only, not auto-applied/);
    assert.match(builder, /Add substitute/);

    assert.match(dedupe, /findCheaperBasketSubstitutions/);
    assert.match(dedupe, /normalizeUnitPriceForPackageText/);
    assert.match(dedupe, /candidateCategory !== sourceCategory/);
    assert.match(dedupe, /candidateUnitPrice\.comparableUnit !== sourceUnitPrice\.comparableUnit/);
    assert.match(dedupe, /candidateUnitPrice\.value >= sourceUnitPrice\.value/);
    assert.match(dedupe, /same category/);
    assert.match(dedupe, /normalized \$\{sourceUnitPrice\.comparableUnit\} unit/);

    assert.match(normalization, /comparableUnitLabel/);
    assert.match(normalization, /kr\/kg/);
    assert.match(normalization, /kr\/l/);
    assert.match(normalization, /kr\/st/);
  });
});
