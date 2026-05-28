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

const ADMIN_REPORT_HELPERS = [
  'src/lib/admin-reports/source-runs.ts',
  'src/lib/admin-reports/dead-letters.ts',
  'src/lib/admin-reports/data-quality.ts',
  'src/lib/admin-reports/search-analytics.ts',
  'src/lib/admin-reports/query-performance.ts',
  'src/lib/admin-reports/storage.ts'
];

const REPORT_ROUTE_BINDINGS = [
  { route: 'src/app/admin/source-runs/page.tsx', helper: '@/lib/admin-reports/source-runs', getter: 'getSourceRunsReport' },
  { route: 'src/app/admin/source-runs/[id]/page.tsx', helper: '@/lib/admin-reports/source-runs', getter: 'getSourceRunDetail' },
  { route: 'src/app/admin/dead-letters/page.tsx', helper: '@/lib/admin-reports/dead-letters', getter: 'getDeadLettersReport' },
  { route: 'src/app/admin/data-quality/page.tsx', helper: '@/lib/admin-reports/data-quality', getter: 'getDataQualityReport' },
  { route: 'src/app/admin/search-analytics/page.tsx', helper: '@/lib/admin-reports/search-analytics', getter: 'getSearchAnalyticsReport' },
  { route: 'src/app/admin/query-performance/page.tsx', helper: '@/lib/admin-reports/query-performance', getter: 'getQueryPerformanceReport' },
  { route: 'src/app/admin/storage/page.tsx', helper: '@/lib/admin-reports/storage', getter: 'getStorageReport' }
];

test('lock-pack admin backstage routes exist', async () => {
  for (const relative of ADMIN_ROUTES) {
    await access(new URL(`../${relative}`, import.meta.url));
  }
});

test('admin report helpers exist', async () => {
  for (const relative of ADMIN_REPORT_HELPERS) {
    await access(new URL(`../${relative}`, import.meta.url));
  }
});

test('report admin pages read from shared helpers', async () => {
  for (const binding of REPORT_ROUTE_BINDINGS) {
    const source = await readFile(new URL(`../${binding.route}`, import.meta.url), 'utf8');
    assert.match(source, new RegExp(binding.helper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${binding.route} should import ${binding.helper}`);
    assert.match(source, new RegExp(`${binding.getter}\\(`), `${binding.route} should call ${binding.getter}`);
    assert.match(source, /AdminReportSourceLabel/, `${binding.route} should show scaffold/source label`);
  }
});

test('backstage helper gates /admin paths', async () => {
  const source = await readFile(new URL('../src/lib/backstage.ts', import.meta.url), 'utf8');
  assert.match(source, /\/admin/);
});
