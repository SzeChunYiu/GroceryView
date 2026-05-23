import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dbSource = readFileSync(new URL('../../packages/db/src/index.ts', import.meta.url), 'utf8');

describe('daily ingestion persistence SQL', () => {
  it('deduplicates exact connector observation replays and latest-price conflict keys within each batch', () => {
    assert.match(dbSource, /upsertConnectorPriceObservations\(observations\)/);
    assert.match(dbSource, /price numeric\(12, 2\)/);
    assert.match(dbSource, /unit_price numeric\(12, 4\)/);
    assert.match(dbSource, /confidence numeric\(5, 4\)/);
    assert.match(dbSource, /partition by\s+product_id,\s*chain_id,\s*store_id,\s*price_type,\s*observed_at,\s*retailer_product_ref,\s*price,\s*unit_price,\s*currency,\s*confidence,\s*provenance/is);
    assert.match(dbSource, /observations\.price = ranked_input\.price/);
    assert.match(dbSource, /observations\.unit_price = ranked_input\.unit_price/);
    assert.match(dbSource, /observations\.currency = ranked_input\.currency/);
    assert.match(dbSource, /observations\.confidence = ranked_input\.confidence/);
    assert.match(dbSource, /observations\.provenance = ranked_input\.provenance/);
    assert.match(dbSource, /distinct on \(\s*product_id,\s*chain_id,\s*store_id,\s*price_type\s*\)/);
    assert.match(dbSource, /from written\s+order by\s+product_id,\s*chain_id,\s*store_id,\s*price_type,\s*observed_at desc/is);
  });
});
