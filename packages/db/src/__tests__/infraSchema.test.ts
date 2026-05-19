import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const migration = readFileSync(
  join(repoRoot, 'infra/db/migrations/001_groceryview_pg18_foundation.sql'),
  'utf8'
).toLowerCase();
const schemaDoc = readFileSync(join(repoRoot, 'infra/db/SCHEMA.md'), 'utf8').toLowerCase();

const requiredTables = [
  'chains',
  'stores',
  'products',
  'aliases',
  'users',
  'watchlists',
  'baskets',
  'basket_items',
  'budgets',
  'source_runs',
  'raw_records',
  'observations',
  'latest_prices',
  'alerts'
];

const provenanceTables = [
  'stores',
  'products',
  'aliases',
  'source_runs',
  'raw_records',
  'observations',
  'latest_prices',
  'alerts'
];

function tableDefinition(table: string): string {
  const match = migration.match(new RegExp(`create table if not exists ${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `${table} table missing`);
  return match[1];
}

describe('infra/db PostgreSQL schema', () => {
  it('enables the required PostgreSQL extensions', () => {
    assert.match(migration, /create extension if not exists postgis/);
    assert.match(migration, /create extension if not exists pg_trgm/);
  });

  it('creates every P4 infrastructure table', () => {
    for (const table of requiredTables) {
      assert.match(migration, new RegExp(`create table if not exists ${table}\\b`), `${table} table missing`);
      assert.match(schemaDoc, new RegExp(`### ${table}\\b`), `${table} missing from SCHEMA.md`);
    }
  });

  it('keeps price facts typed, timestamped, confidence-scored, and sourced', () => {
    for (const table of ['observations', 'latest_prices']) {
      const definition = tableDefinition(table);
      for (const column of ['price_type', 'confidence', 'observed_at', 'provenance', 'source_type']) {
        assert.match(definition, new RegExp(`\\b${column}\\b`), `${table}.${column} missing`);
      }
    }
  });

  it('keeps a price_observations compatibility view for existing package terminology', () => {
    assert.match(migration, /create or replace view price_observations as\s+select \* from observations/);
  });

  it('documents and stores provenance for source-derived tables', () => {
    for (const table of provenanceTables) {
      assert.match(tableDefinition(table), /\bprovenance\b/, `${table}.provenance missing`);
      assert.match(schemaDoc, new RegExp(`${table}[\\s\\S]*provenance`), `${table} provenance missing from SCHEMA.md`);
    }
  });

  it('uses PostGIS and pg_trgm indexes for location and fuzzy lookup', () => {
    assert.match(migration, /using gist \(location\)/);
    assert.match(migration, /gin_trgm_ops/);
  });

  it('deduplicates latest prices while allowing chain-level prices without a store', () => {
    assert.match(migration, /create unique index if not exists latest_prices_identity_idx on latest_prices nulls not distinct/);
  });
});
