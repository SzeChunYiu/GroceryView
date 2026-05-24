import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('chain selector ships an accessibility smoke check in the web test script', async () => {
  const packageJson = JSON.parse(await read('package.json'));

  assert.match(packageJson.scripts.test, /node --test scripts\/\*\.test\.mjs/);
  assert.match(packageJson.scripts['test:a11y'], /chain-selector-accessibility\.test\.mjs/);
});

test('chain selector announces selection changes and wires descriptions to controls', async () => {
  const source = await read('src/components/chain-selector.tsx');

  assert.match(source, /export function ChainSelector/);
  assert.match(source, /<fieldset aria-describedby=\{`\$\{helperId\} \$\{statusId\}`\}/);
  assert.match(source, /id=\{helperId\}/);
  assert.match(source, /id=\{statusId\} role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /aria-describedby=\{option\.description \? descriptionId : undefined\}/);
  assert.match(source, /<span id=\{descriptionId\}/);
  assert.match(source, /onChange=\{\(\) => \{/);
  assert.match(source, /setSelectedChainId\(option\.id\)/);
});
