import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('home page exposes all three final product domains as connected cards', () => {
  const home = source('components/mvp/mvp-home-page.tsx');
  for (const required of [
    'Domain cards',
    'Compare groceries',
    'Compare OTC pharmacy prices',
    'Compare fuel prices',
    '/browse',
    '/pharmacy',
    '/fuel'
  ]) {
    assert.match(home, new RegExp(required), `home page missing ${required}`);
  }
});

test('product and store detail copy keeps the final visual matrix labels discoverable', () => {
  const product = source('app/products/[slug]/page.tsx');
  const store = source('app/stores/[slug]/page.tsx');
  assert.match(product, /Similar products/);
  assert.match(store, /Store visual evidence board/);
});

test('fuel visual command center uses the required final user question', () => {
  const fuel = source('app/fuel/page.tsx');
  assert.match(fuel, /Where can I compare fuel prices by grade\?/);
});
