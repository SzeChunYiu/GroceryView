import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);

function distanceCopySnapshot(distanceKm) {
  return `${new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'long',
  }).format(Math.max(0, distanceKm))} from Stockholm center`;
}

test('store locator distance copy snapshot uses localized kilometer unit formatting', async () => {
  const source = await readFile(new URL('src/components/store-locator.tsx', root), 'utf8');
  const mapSource = await readFile(new URL('src/components/store-map.tsx', root), 'utf8');

  assert.match(source, /new Intl\.NumberFormat\('en', \{[\s\S]*unit: 'kilometer'/);
  assert.match(mapSource, /formatStoreDistanceCopy\(storeDistanceFromStockholm\(store\)\)/);
  const distanceCopySnapshots = [0.6, 1, 8.7].map(distanceCopySnapshot);

  assert.deepEqual(distanceCopySnapshots, [
    '0.6 kilometers from Stockholm center',
    '1 kilometer from Stockholm center',
    '8.7 kilometers from Stockholm center',
  ]);
});
