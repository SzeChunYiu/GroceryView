import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const browseSource = () => readFileSync(new URL('../src/app/browse/page.tsx', import.meta.url), 'utf8');
const categorySource = () => readFileSync(new URL('../src/app/browse/[category]/page.tsx', import.meta.url), 'utf8');

test('browse page includes category coverage visuals with accessible fallback', () => {
  const source = browseSource();
  for (const required of [
    'ChartShell',
    'DistributionBand',
    'ChartTableFallback',
    'Browse category coverage',
    'Which categories have verified rows?',
    'Best current insight'
  ]) {
    assert.match(source, new RegExp(required), `browse page missing ${required}`);
  }
});

test('category browse page includes chain index visuals with drill-through evidence', () => {
  const source = categorySource();
  for (const required of [
    'ChartShell',
    'Sparkline',
    'ChartTableFallback',
    'Category price index by chain',
    'Which chains have enough evidence for this category?',
    'link to filtered search'
  ]) {
    assert.match(source, new RegExp(required), `category browse page missing ${required}`);
  }
});
