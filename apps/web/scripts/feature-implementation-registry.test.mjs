import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const registryPath = new URL('../../../docs/roadmap/feature-implementation-registry.md', import.meta.url);
const seedPath = new URL('../../../docs/handoff/groceryview-implement-everything-lock/feature_registry_seed.json', import.meta.url);

const DEFERRED_ROW_PATTERN = /^\| ([a-z0-9_]+) \| ([^|]+) \| ([^|]+) \|$/gm;

function parseFeatureRows(source) {
  const mainTable = source.split('## Deferred (explicit)')[0] ?? source;
  return mainTable
    .split('\n')
    .filter((line) => /^\| [a-z][a-z0-9_]* \|/.test(line) && !line.startsWith('| feature_id |'))
    .map((line) => {
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
      return {
        featureId: cells[0],
        surface: cells[1],
        targetStatus: cells[2],
        status: cells[3],
      };
    });
}

function parseDeferredRows(source) {
  const deferredSection = source.split('## Deferred (explicit)')[1]?.split('## Registry meta')[0] ?? '';
  const rows = [];
  for (const match of deferredSection.matchAll(DEFERRED_ROW_PATTERN)) {
    if (match[1] === 'feature_id') continue;
    rows.push({ featureId: match[1] });
  }
  return rows;
}

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

test('registry summary counts match parsed feature rows', async () => {
  const registry = await readFile(registryPath, 'utf8');
  const featureRows = parseFeatureRows(registry);
  const deferredRows = parseDeferredRows(registry);

  assert.equal(featureRows.length, 39, 'main registry table should list 39 features');
  assert.equal(deferredRows.length, 2, 'deferred table should list 2 features');

  const statusCounts = featureRows.reduce((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});

  assert.equal(statusCounts.IMPLEMENTED, 38);
  assert.equal(statusCounts.TEST_ONLY, 1);
  assert.equal(statusCounts.DEFERRED ?? 0, 0);

  assert.match(registry, /\*\*Total registered:\*\* 39 \(\+ 2 deferred\)/);
  assert.match(registry, /feature-implementation-registry\.test\.mjs/);
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

test('event_tracking_plan stays TEST_ONLY while analytics gap is open', async () => {
  const registry = await readFile(registryPath, 'utf8');
  assert.match(
    registry,
    /\| event_tracking_plan \| data \| IMPLEMENT_NOW_DATA \| TEST_ONLY \|[^|\n]*analytics-event-naming-gap/
  );
});
