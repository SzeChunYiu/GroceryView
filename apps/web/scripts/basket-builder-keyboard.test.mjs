import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const component = new URL('../src/components/basket-builder.tsx', import.meta.url);

test('BasketBuilder basket rows support confirmed Backspace removal', async () => {
  const source = await readFile(component, 'utf8');

  assert.match(source, /export function removeBasketBuilderProduct/);
  assert.match(source, /products\.filter\(\(product\) => product\.id !== productId\)/);
  assert.match(source, /function removeOnBackspace\(event: KeyboardEvent<HTMLLIElement>, product: T\)/);
  assert.match(source, /event\.key !== 'Backspace'/);
  assert.match(source, /window\.confirm\(`Remove \$\{product\.name\} from basket\?`\)/);
  assert.match(source, /onKeyDown=\{\(event\) => removeOnBackspace\(event, product\)\}/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(source, /aria-label=\{`\$\{product\.name\} basket row`\}/);
});
