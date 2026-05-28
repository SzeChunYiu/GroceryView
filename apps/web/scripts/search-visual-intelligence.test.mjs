import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const searchSource = () => readFileSync(new URL('../src/app/search/page.tsx', import.meta.url), 'utf8');

test('search page includes result-card evidence visuals with accessible fallback', () => {
  const source = searchSource();
  for (const required of [
    'ChartShell',
    'Sparkline',
    'ChartTableFallback',
    'Search result evidence',
    'Which filtered products are strongest?',
    'optional sparkline'
  ]) {
    assert.match(source, new RegExp(required), `search page missing ${required}`);
  }
});
