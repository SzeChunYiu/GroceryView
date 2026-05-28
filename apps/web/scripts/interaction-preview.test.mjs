import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

const BACKSTAGE_TERMS = [
  'source_run_id',
  'raw_record_id',
  'server-side cursor pagination',
  'buildPriceChartSeries',
  'raw_records',
  'parser version',
  'COPY staging',
  'dead letter',
  'quality_check_result_id'
];

const MATRIX_COMPONENTS = {
  product_card: 'ProductPreviewCard',
  market_category_row: 'CategoryPreviewDrawer',
  evidence_strip: 'EvidenceDrawer'
};

const PUBLIC_ROUTE_FILES = [
  'src/app/search/page.tsx',
  'src/app/browse/[category]/page.tsx',
  'src/app/market/[category]/page.tsx',
  'src/app/products/[slug]/page.tsx',
  'src/app/compare/page.tsx',
  'src/app/fuel/page.tsx',
  'src/components/market-shell.tsx',
  'src/components/mvp/product-card.tsx',
  'src/components/preview/product-preview-card.tsx'
];

test('interaction matrix preview components exist', async () => {
  const matrix = JSON.parse(await read('../../docs/handoff/groceryview-31-onward-consolidated/interaction_matrix.json'));

  for (const [key, componentName] of Object.entries(MATRIX_COMPONENTS)) {
    assert.ok(matrix[key], `interaction matrix missing ${key}`);
    assert.equal(MATRIX_COMPONENTS[key], componentName);
    const source = await read(`src/components/preview/${componentName.replace(/([A-Z])/g, (match, letter, index) => (index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`))}.tsx`);
    assert.match(source, new RegExp(`export function ${componentName}`));
  }

  assert.match(await read('src/components/preview/preview-drawer.tsx'), /export function PreviewDrawer/);
});

test('ProductPreviewCard props stay frontstage-only', async () => {
  const source = await read('src/components/preview/product-preview-card.tsx');
  const matrix = JSON.parse(await read('../../docs/handoff/groceryview-31-onward-consolidated/interaction_matrix.json'));
  const backstageFields = matrix.product_card.backstage;

  assert.match(source, /export type ProductPreviewCardProps/);
  assert.match(source, /product: ProductSummary/);
  assert.match(source, /Quick view/);
  assert.match(source, /Open product/);
  assert.match(source, /PreviewDrawer/);
  assert.match(source, /EvidenceDrawer/);

  for (const field of backstageFields) {
    assert.doesNotMatch(source, new RegExp(field.replace(/_/g, '_'), 'i'));
  }
});

test('backstage helper gates admin routes', async () => {
  const source = await read('src/lib/backstage.ts');
  assert.match(source, /export function isBackstagePath/);
  assert.match(source, /pathname\.startsWith\('\/admin'\)/);
});

test('public routes avoid backstage/debug copy', async () => {
  for (const relativePath of PUBLIC_ROUTE_FILES) {
    const source = await read(relativePath);
    for (const term of BACKSTAGE_TERMS) {
      assert.doesNotMatch(
        source,
        new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        `${relativePath} should not expose "${term}" on the public frontstage`
      );
    }
  }
});

test('search and browse product cards expose quick view without modals', async () => {
  const productPreview = await read('src/components/preview/product-preview-card.tsx');
  const searchPreview = await read('src/components/preview/search-result-preview-card.tsx');

  assert.doesNotMatch(productPreview, /role="dialog"[\s\S]*Quick view|Modal/);
  assert.doesNotMatch(searchPreview, /from '@\/components\/modal'/);
  assert.match(productPreview, /data-quick-view="product"/);
  assert.match(searchPreview, /data-quick-view="search-result"/);
  assert.match(productPreview, /PreviewDrawer/);
  assert.match(searchPreview, /PreviewDrawer/);
});
