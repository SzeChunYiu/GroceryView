import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('basket builder removes a focused row on Backspace after confirm', async () => {
  const component = await read('src/components/basket-builder.tsx');

  assert.match(component, /'use client'/);
  assert.match(component, /onKeyDown=\{\(event\) => handleBasketRowKeyDown\(event, row\)\}/);
  assert.match(component, /event\.key !== 'Backspace'/);
  assert.match(component, /event\.preventDefault\(\)/);
  assert.match(component, /window\.confirm\(`Remove \$\{row\.name\} from this basket\?`\)/);
  assert.match(component, /rows\.filter\(\(candidate\) => candidate\.id !== row\.id\)/);
  assert.match(component, /isEditableTarget\(event\.target\)/);
});
