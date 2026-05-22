import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ingestionSource = readFileSync(new URL('../../packages/ingestion/src/index.ts', import.meta.url), 'utf8');

describe('daily ingestion persistence SQL', () => {
  it('deduplicates latest-price conflict keys within each observation batch', () => {
    assert.match(ingestionSource, /distinct on \(\s*product_id,\s*chain_id,\s*store_id,\s*price_type\s*\)/);
    assert.match(ingestionSource, /from inserted\s+order by\s+product_id,\s*chain_id,\s*store_id,\s*price_type,\s*observed_at desc/is);
  });
});
