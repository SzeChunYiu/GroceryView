import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const COMPONENTS = [
  'PageQuestionHeader',
  'GuidedEmptyState',
  'EvidenceStrip',
  'EvidenceDrawer',
  'AdSlot',
  'ProductPreviewCard',
  'StorePreviewCard',
  'CategoryPreviewCard',
  'DealPreviewCard',
  'PreviewSideDrawer',
  'PreviewBottomSheet'
];

const ROOT = new URL('../src/', import.meta.url);

async function readComponentExport(name) {
  const kebab = name.replace(/([A-Z])/g, (m, l, i) => (i === 0 ? l.toLowerCase() : `-${l.toLowerCase()}`));
  const paths = [
    `components/mvp/handoff-content.tsx`,
    `components/mvp/evidence-strip.tsx`,
    `components/preview/evidence-drawer.tsx`,
    `components/design-system/ad-slot.tsx`,
    `components/preview/${kebab}.tsx`,
    `components/preview/product-preview-card.tsx`
  ];
  for (const relative of paths) {
    try {
      const source = await readFile(new URL(relative, ROOT), 'utf8');
      if (
        source.includes(`export function ${name}`)
        || source.includes(`export { ${name}`)
        || source.includes(`as ${name}`)
      ) {
        return source;
      }
    } catch {
      // try next path
    }
  }
  throw new Error(`Could not find export for ${name}`);
}

test('component matrix exports exist', async () => {
  for (const name of COMPONENTS) {
    const source = await readComponentExport(name);
    assert.match(source, new RegExp(name));
  }
});
