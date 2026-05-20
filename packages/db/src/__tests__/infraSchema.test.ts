import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const migration = readFileSync(join(repoRoot, 'infra/db/migrations/001_groceryview_schema.sql'), 'utf8').toLowerCase();
const schemaDoc = readFileSync(join(repoRoot, 'infra/db/SCHEMA.md'), 'utf8').toLowerCase();

const requiredTables = [
  'chains',
  'stores',
  'products',
  'aliases',
  'source_runs',
  'raw_records',
  'observations',
  'latest_prices',
  'users',
  'watchlists',
  'baskets',
  'budgets',
  'alerts'
];

const provenanceTables = ['source_runs', 'raw_records', 'observations', 'latest_prices'];

function tableDefinition(table: string): string {
  const match = migration.match(new RegExp(`create table if not exists ${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `${table} table missing`);
  return match[1];
}

describe('infra/db PostgreSQL schema contract', () => {
  it('enables required PostgreSQL extensions for uuid, location, and fuzzy matching', () => {
    for (const extension of ['pgcrypto', 'postgis', 'pg_trgm']) {
      assert.match(migration, new RegExp(`create extension if not exists ${extension}\\b`));
      assert.match(schemaDoc, new RegExp(`\\b${extension}\\b`), `${extension} missing from schema docs`);
    }
  });

  it('keeps every infrastructure table documented and migrated', () => {
    for (const table of requiredTables) {
      assert.match(migration, new RegExp(`create table if not exists ${table}\\b`), `${table} table missing`);
      assert.match(schemaDoc, new RegExp(`### \`${table}\``), `${table} missing from SCHEMA.md`);
    }
  });

  it('stores immutable price facts with type, time, confidence, and provenance', () => {
    const observations = tableDefinition('observations');
    for (const column of ['price_type', 'observed_at', 'confidence', 'provenance']) {
      assert.match(observations, new RegExp(`\\b${column}\\b`), `observations.${column} missing`);
    }
    assert.match(observations, /price_type text not null check/);
    assert.match(observations, /confidence numeric\(5, 4\) not null check \(confidence between 0 and 1\)/);
  });

  it('keeps latest prices derived from observations and uniquely addressable', () => {
    const latestPrices = tableDefinition('latest_prices');
    assert.match(latestPrices, /observation_id uuid not null references observations\(id\)/);
    assert.match(latestPrices, /unique nulls not distinct \(product_id, chain_id, store_id, price_type\)/);
  });

  it('preserves provenance on source-derived tables', () => {
    for (const table of provenanceTables) {
      assert.match(tableDefinition(table), /\bprovenance\b/, `${table}.provenance missing`);
      assert.match(schemaDoc, new RegExp(`### \`${table}\`[\\s\\S]*provenance`), `${table} provenance missing from SCHEMA.md`);
    }
  });

  it('indexes geospatial store lookup and fuzzy product matching', () => {
    assert.match(migration, /stores_position_gix on stores using gist \(position\)/);
    assert.match(migration, /products_name_trgm_idx on products using gin \(canonical_name gin_trgm_ops\)/);
    assert.match(migration, /aliases_normalized_trgm_idx on aliases using gin \(normalized_alias gin_trgm_ops\)/);
  });
});
