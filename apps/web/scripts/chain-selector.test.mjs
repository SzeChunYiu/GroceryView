import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const sourcePath = 'src/components/chain-selector.tsx';

async function exists(relative) {
  try {
    await access(new URL(relative, root));
    return true;
  } catch {
    return false;
  }
}

test('chain selector exposes an accessible radio group', async () => {
  assert.equal(await exists(sourcePath), true);
  const source = await readFile(new URL(sourcePath, root), 'utf8');

  assert.match(source, /export function ChainSelector/);
  assert.match(source, /role="radiogroup"/);
  assert.match(source, /aria-label=\{label\}/);
  assert.match(source, /role="radio"/);
  assert.match(source, /aria-checked=\{isSelected\}/);
  assert.match(source, /aria-label=\{option\.label\}/);
});

test('chain selector keeps custom controls focus-visible compatible', async () => {
  const source = await readFile(new URL(sourcePath, root), 'utf8');

  assert.match(source, /focus-visible:outline/);
  assert.match(source, /focus-visible:outline-2/);
  assert.match(source, /focus-visible:outline-offset-2/);
});

test('chain selector activates onSelect with Enter and Space', async () => {
  const source = await readFile(new URL(sourcePath, root), 'utf8');

  assert.match(source, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /onKeyDown=\{handleKeyDown\(option\)\}/);
  assert.match(source, /onSelect\(option\.id\)/);
});
