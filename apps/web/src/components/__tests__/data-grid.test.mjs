import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('data grid renders an empty state cell for null row values', async () => {
  const dataGrid = await read('src/components/data-grid.tsx');

  assert.match(dataGrid, /value: ReactNode \| null/);
  assert.match(dataGrid, /No value recorded/);
  assert.match(dataGrid, /row\.value === null \? <EmptyDataGridCell label=\{emptyCellLabel\} \/> : row\.value/);
});
