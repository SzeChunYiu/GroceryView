import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const component = new URL('../src/components/data-grid.tsx', import.meta.url);

test('DataGrid row striping is provided by pure CSS', async () => {
  const source = await readFile(component, 'utf8');

  assert.match(source, /export const dataGridRowStripingClass/);
  assert.match(source, /nth-child\(even\)/);
  assert.match(source, /striped \? dataGridRowStripingClass : ''/);
  assert.doesNotMatch(source, /rowIndex|index %|map\([^)]*index/);
});
