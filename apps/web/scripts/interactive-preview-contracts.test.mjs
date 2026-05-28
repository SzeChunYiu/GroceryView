import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const PREVIEW_COMPONENTS = [
  'product-preview-card.tsx',
  'store-preview-card.tsx',
  'category-preview-card.tsx',
  'deal-preview-card.tsx',
  'fuel-station-preview-card.tsx',
  'pharmacy-otc-preview-card.tsx',
  'evidence-drawer.tsx',
  'preview-side-drawer.tsx',
  'preview-bottom-sheet.tsx',
  'preview-drawer.tsx'
];

const root = new URL('../src/components/preview/', import.meta.url);

test('interactive preview components export and use PreviewDrawer pattern', async () => {
  for (const file of PREVIEW_COMPONENTS) {
    const source = await readFile(new URL(file, root), 'utf8');
    assert.match(source, /export function|export \{/);
  }

  const product = await readFile(new URL('product-preview-card.tsx', root), 'utf8');
  assert.match(product, /Quick view/);
  assert.match(product, /PreviewDrawer/);
  assert.match(product, /EvidenceDrawer/);

  const drawer = await readFile(new URL('preview-drawer.tsx', root), 'utf8');
  assert.match(drawer, /Escape/);
  assert.match(drawer, /aria-modal/);
});
