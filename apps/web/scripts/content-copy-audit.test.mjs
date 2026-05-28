import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const BLOCKED_ON_PUBLIC = [
  'Server-side cursor pagination',
  'source_run_id',
  'raw_record_id',
  'COPY staging',
  'fail closed until Redis cache and pgbouncer'
];

const PUBLIC_FILES = [
  'src/app/search/page.tsx',
  'src/components/market-shell.tsx',
  'src/app/[locale]/page.tsx'
].map((relative) => new URL(`../${relative}`, import.meta.url));

test('public routes avoid backstage debug phrases', async () => {
  for (const fileUrl of PUBLIC_FILES) {
    let source;
    try {
      source = await readFile(fileUrl, 'utf8');
    } catch {
      continue;
    }
    for (const phrase of BLOCKED_ON_PUBLIC) {
      assert.doesNotMatch(
        source,
        new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        `${fileUrl.pathname} should not include "${phrase}"`
      );
    }
  }
});
