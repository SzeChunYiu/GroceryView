import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('comparison tables surface price volatility persistence labels', async () => {
  const helper = await read('src/lib/compare-price-snapshots.ts');
  const itemTable = await read('src/components/ItemComparisonTable.tsx');
  const storeTable = await read('src/components/StoreComparisonTable.tsx');

  assert.match(helper, /ComparePriceVolatilityKind = 'stable' \| 'volatile' \| 'promotional-cycle'/);
  assert.match(helper, /label: 'Stable' \| 'Volatile' \| 'Promotional cycle'/);
  assert.match(helper, /comparePriceSnapshotVolatilityLabel/);
  assert.match(helper, /promotionalText/);
  assert.match(helper, /spreadPercent/);
  assert.match(helper, /Comparison rows for this item span/);

  assert.match(itemTable, /comparePriceSnapshotVolatilityLabel/);
  assert.match(itemTable, /volatility\.label/);
  assert.match(itemTable, /volatility\.detail/);
  assert.match(itemTable, /snapshotRows/);

  assert.match(storeTable, /comparePriceSnapshotVolatilityLabel/);
  assert.match(storeTable, /promotionalHint: showLoyaltyPrice/);
  assert.match(storeTable, /volatility\.label/);
  assert.match(storeTable, /volatility\.detail/);
});
