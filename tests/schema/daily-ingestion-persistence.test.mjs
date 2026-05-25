import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dbSource = readFileSync(new URL('../../packages/db/src/index.ts', import.meta.url), 'utf8');
const ingestionSource = readFileSync(new URL('../../packages/ingestion/src/index.ts', import.meta.url), 'utf8');
const changeOnlyMigration = readFileSync(new URL('../../infra/db/migrations/028_observation_change_only_scd.sql', import.meta.url), 'utf8');

describe('daily ingestion persistence SQL', () => {
  it('deduplicates exact connector observation replays and latest-price conflict keys within each batch', () => {
    assert.match(dbSource, /upsertConnectorPriceObservations\(observations\)/);
    assert.match(dbSource, /price numeric\(12, 2\)/);
    assert.match(dbSource, /unit_price numeric\(12, 4\)/);
    assert.match(dbSource, /confidence numeric\(5, 4\)/);
    assert.match(dbSource, /domain text/);
    assert.match(dbSource, /origin_country char\(2\)/);
    assert.match(dbSource, /cert_level text/);
    assert.match(dbSource, /origin_country: observation\.originCountry \?\? null/);
    assert.match(dbSource, /cert_level: observation\.certLevel \?\? null/);
    assert.match(ingestionSource, /originCountry: accepted\.priceObservation\.originCountry/);
    assert.match(ingestionSource, /certLevel: accepted\.priceObservation\.certLevel/);
    assert.match(dbSource, /partition by\s+product_id,\s*chain_id,\s*store_id,\s*domain,\s*price_type,\s*observed_at,\s*retailer_product_ref,\s*price,\s*unit_price,\s*currency,\s*is_available,\s*confidence,\s*provenance/is);
    assert.match(dbSource, /observations\.domain = ranked_input\.domain/);
    assert.match(dbSource, /observations\.price = ranked_input\.price/);
    assert.match(dbSource, /observations\.unit_price = ranked_input\.unit_price/);
    assert.match(dbSource, /observations\.currency = ranked_input\.currency/);
    assert.match(dbSource, /observations\.is_available = ranked_input\.is_available/);
    assert.match(dbSource, /observations\.confidence = ranked_input\.confidence/);
    assert.match(dbSource, /observations\.provenance = ranked_input\.provenance/);
    assert.match(dbSource, /distinct on \(\s*product_id,\s*chain_id,\s*store_id,\s*price_type\s*\)/);
    assert.match(dbSource, /from written\s+order by\s+product_id,\s*chain_id,\s*store_id,\s*price_type,\s*observed_at desc/is);
  });

  it('writes connector observations only when the latest price fact changes', () => {
    assert.match(dbSource, /latest_prior as \(/);
    assert.match(dbSource, /observations\.observed_at <= ranked_input\.observed_at/);
    assert.match(dbSource, /change_input as \(/);
    assert.match(dbSource, /latest_prior\.price is distinct from ranked_input\.price/);
    assert.match(dbSource, /latest_prior\.unit_price is distinct from ranked_input\.unit_price/);
    assert.match(dbSource, /latest_prior\.is_available is distinct from ranked_input\.is_available/);
    assert.match(dbSource, /closed_prior as \(/);
    assert.match(dbSource, /set valid_until = change_input\.observed_at/);
    assert.match(dbSource, /coalesce\(valid_from,\s*observed_at\)/);
    assert.match(dbSource, /coalesce\(inserted\.id,\s*existing\.id,\s*latest_prior\.id\) as id/);
    assert.match(changeOnlyMigration, /observations_change_only_lookup_idx/);
    assert.match(changeOnlyMigration, /partition by product_id,\s*chain_id,\s*store_id,\s*domain,\s*price_type/);
    assert.match(changeOnlyMigration, /valid_from = observed_at/);
    assert.match(changeOnlyMigration, /valid_until = intervals\.valid_until/);
  });

  it('deduplicates raw-record conflict keys within each persistence batch', () => {
    assert.match(ingestionSource, /distinct on \(\s*payload_hash\s*\)/);
    assert.match(ingestionSource, /from input\s+order by\s+payload_hash,\s*observed_at desc nulls last,\s*ordinal desc/is);
  });
});
