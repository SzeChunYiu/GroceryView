import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('data grid uses pure CSS row striping for visual scanning', async () => {
  const source = await readFile(new URL('../src/components/data-grid.tsx', import.meta.url), 'utf8');

  assert.match(source, /export function DataGrid/);
  assert.match(source, /odd:bg-white/);
  assert.match(source, /even:bg-slate-50/);
  assert.match(source, /hover:bg-emerald-50\/70/);
  assert.doesNotMatch(source, /index\s*%\s*2/);
});
