import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const registryPath = new URL('../../../docs/roadmap/feature-implementation-registry.md', import.meta.url);
const seedPath = new URL('../../../docs/handoff/groceryview-implement-everything-lock/feature_registry_seed.json', import.meta.url);

test('feature implementation registry exists and covers seed features', async () => {
  const registry = await readFile(registryPath, 'utf8');
  const seed = JSON.parse(await readFile(seedPath, 'utf8'));

  assert.match(registry, /# Feature implementation registry/);
  assert.match(registry, /Orphans allowed.*0/);

  for (const row of seed) {
    assert.match(
      registry,
      new RegExp(`\\| ${row.feature_id.replace(/_/g, '_')} \\|`),
      `registry should list ${row.feature_id}`
    );
    assert.doesNotMatch(
      registry,
      new RegExp(`\\| ${row.feature_id} \\|[^\\n]*\\| TODO_REGISTER`, 'm'),
      `${row.feature_id} should not remain TODO in registry table`
    );
  }
});

test('implemented preview and admin features have code evidence', async () => {
  const checks = [
    ['product_preview', 'src/components/preview/product-preview-card.tsx'],
    ['store_preview', 'src/components/preview/store-preview-card.tsx'],
    ['deal_preview', 'src/components/preview/deal-preview-card.tsx'],
    ['admin_source_runs', 'src/app/admin/source-runs/page.tsx'],
    ['adslot', 'src/lib/ad-slots.ts']
  ];

  for (const [, relativePath] of checks) {
    const source = await readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
    assert.ok(source.length > 0);
  }
});
