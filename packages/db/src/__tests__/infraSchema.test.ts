import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const migration = readFileSync(join(repoRoot, 'infra/db/migrations/001_groceryview_schema.sql'), 'utf8').toLowerCase();
const repositoryMigration = readFileSync(join(repoRoot, 'infra/db/migrations/002_repository_support_schema.sql'), 'utf8').toLowerCase();
const entitlementMigration = readFileSync(join(repoRoot, 'infra/db/migrations/003_subscription_entitlements.sql'), 'utf8').toLowerCase();
const alertRulesMigration = readFileSync(join(repoRoot, 'infra/db/migrations/004_alert_rules.sql'), 'utf8').toLowerCase();
const repositoryMigrations = `${repositoryMigration}\n${entitlementMigration}\n${alertRulesMigration}`;
const migrationVerifier = readFileSync(join(repoRoot, 'infra/db/scripts/verify-migrations.sh'), 'utf8').toLowerCase();
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
const repositoryTables = [
  'app_users',
  'favorite_stores',
  'user_preferences',
  'watchlist_items',
  'weekly_baskets',
  'basket_items',
  'human_review_assignments',
  'human_reviewers',
  'community_reporter_trust',
  'subscription_entitlements',
  'notification_tasks',
  'notification_suppressions',
  'alert_rules'
];

function tableDefinition(table: string): string {
  const match = migration.match(new RegExp(`create table if not exists ${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `${table} table missing`);
  return match[1];
}

function repositoryTableDefinition(table: string): string {
  const match = repositoryMigrations.match(new RegExp(`create table if not exists ${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `${table} repository table missing`);
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

  it('migrates every table used by the PostgreSQL repository adapter', () => {
    for (const table of repositoryTables) {
      assert.match(repositoryMigrations, new RegExp(`create table if not exists ${table}\\b`), `${table} repository table missing`);
    }
    assert.match(repositoryTableDefinition('favorite_stores'), /primary key \(user_id, store_id\)/);
    assert.match(repositoryTableDefinition('weekly_baskets'), /unique \(user_id, week_start\)/);
    assert.match(repositoryTableDefinition('subscription_entitlements'), /user_id text primary key references app_users\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('subscription_entitlements'), /provider_subscription_id text/);
    assert.match(repositoryTableDefinition('notification_tasks'), /status text not null check/);
    assert.match(repositoryTableDefinition('notification_suppressions'), /channel text check \(channel in \('push', 'email'\)\)/);
    assert.match(repositoryTableDefinition('alert_rules'), /user_id text not null references app_users\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('alert_rules'), /alert_type text not null check/);
    assert.match(repositoryTableDefinition('alert_rules'), /deal_score_threshold integer check/);
  });

  it('indexes repository workflow lookups used by adapters and workers', () => {
    assert.match(repositoryMigration, /watchlist_items_user_idx on watchlist_items \(user_id, id\)/);
    assert.match(repositoryMigration, /weekly_baskets_user_week_idx on weekly_baskets \(user_id, week_start desc\)/);
    assert.match(repositoryMigration, /human_review_assignments_open_idx on human_review_assignments \(status, due_at, id\)/);
    assert.match(entitlementMigration, /subscription_entitlements_status_idx on subscription_entitlements \(status, updated_at desc\)/);
    assert.match(repositoryMigration, /notification_tasks_due_idx on notification_tasks \(status, send_at, id\)/);
    assert.match(repositoryMigration, /notification_suppressions_active_idx on notification_suppressions \(active, recipient, channel, id\)/);
    assert.match(alertRulesMigration, /alert_rules_active_user_idx on alert_rules \(user_id, active, product_id, alert_type, id\)/);
  });

  it('keeps the migration verifier aligned with catalog and repository tables', () => {
    for (const table of [...requiredTables, ...repositoryTables]) {
      assert.match(migrationVerifier, new RegExp(`\\b${table}\\b`), `${table} missing from migration verifier`);
    }
    assert.match(migrationVerifier, /create table if not exists schema_migrations/);
    assert.match(migrationVerifier, /insert into schema_migrations\(version\)/);
    assert.match(migrationVerifier, /information_schema\.tables/);
    assert.match(migrationVerifier, /migration metadata assertion failed/);
    assert.match(migrationVerifier, /migration table assertion failed/);
  });
});
