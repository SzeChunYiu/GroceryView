import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('ChainSelector exposes accessible keyboard-selectable radio controls', async () => {
  const chainSelector = await read('src/components/chain-selector.tsx');

  assert.match(chainSelector, /'use client'/);
  assert.match(chainSelector, /role="radiogroup"/);
  assert.match(chainSelector, /aria-label=\{label\}/);
  assert.match(chainSelector, /role="radio"/);
  assert.match(chainSelector, /aria-label=\{chain\.name\}/);
  assert.match(chainSelector, /aria-checked=\{isSelected\}/);
  assert.match(chainSelector, /focus-visible:outline/);
  assert.match(chainSelector, /onClick=\{\(\) => onSelect\(chain\.id\)\}/);
  assert.match(chainSelector, /onKeyDown=\{\(event\) => activateWithKeyboard\(event, chain\.id\)\}/);
  assert.match(chainSelector, /activationKeys = new Set\(\['Enter', ' '\]\)/);
  assert.match(chainSelector, /onSelect\(chainId\)/);
});
