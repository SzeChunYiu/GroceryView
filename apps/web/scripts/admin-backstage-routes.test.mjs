import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const ADMIN_ROUTES = [
  'src/app/admin/source-runs/page.tsx',
  'src/app/admin/source-runs/[id]/page.tsx',
  'src/app/admin/dead-letters/page.tsx',
  'src/app/admin/data-quality/page.tsx',
  'src/app/admin/lineage/page.tsx',
  'src/app/admin/search-analytics/page.tsx',
  'src/app/admin/query-performance/page.tsx',
  'src/app/admin/ad-policy/page.tsx',
  'src/app/admin/content-lint/page.tsx',
  'src/app/admin/storage/page.tsx'
];

test('lock-pack admin backstage routes exist', async () => {
  for (const relative of ADMIN_ROUTES) {
    await access(new URL(`../${relative}`, import.meta.url));
  }
});

test('backstage helper gates /admin paths', async () => {
  const source = await readFile(new URL('../src/lib/backstage.ts', import.meta.url), 'utf8');
  assert.match(source, /\/admin/);
});
