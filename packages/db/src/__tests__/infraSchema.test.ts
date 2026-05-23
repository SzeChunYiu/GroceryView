import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const migration = readFileSync(join(repoRoot, 'infra/db/migrations/001_groceryview_schema.sql'), 'utf8').toLowerCase();
const repositoryMigration = readFileSync(join(repoRoot, 'infra/db/migrations/002_repository_support_schema.sql'), 'utf8').toLowerCase();
const entitlementMigration = readFileSync(join(repoRoot, 'infra/db/migrations/003_subscription_entitlements.sql'), 'utf8').toLowerCase();
const alertRulesMigration = readFileSync(join(repoRoot, 'infra/db/migrations/004_alert_rules.sql'), 'utf8').toLowerCase();
const pantryInventoryMigration = readFileSync(join(repoRoot, 'infra/db/migrations/005_pantry_inventory.sql'), 'utf8').toLowerCase();
const sourceRunsOfficialApiMigration = readFileSync(join(repoRoot, 'infra/db/migrations/006_source_runs_official_api.sql'), 'utf8').toLowerCase();
const receiptUploadsMigration = readFileSync(join(repoRoot, 'infra/db/migrations/007_receipt_uploads.sql'), 'utf8').toLowerCase();
const householdPlansMigration = readFileSync(join(repoRoot, 'infra/db/migrations/008_household_plans.sql'), 'utf8').toLowerCase();
const retailerSourcePoliciesMigration = readFileSync(join(repoRoot, 'infra/db/migrations/009_retailer_source_policies.sql'), 'utf8').toLowerCase();
const basketImportReviewsMigration = readFileSync(join(repoRoot, 'infra/db/migrations/010_basket_import_reviews.sql'), 'utf8').toLowerCase();
const priceAlertsMigration = readFileSync(join(repoRoot, 'infra/db/migrations/011_price_alerts.sql'), 'utf8').toLowerCase();
const migrationsDir = join(repoRoot, 'infra/db/migrations');
const allMigrations = readdirSync(migrationsDir)
  .filter((entry) => entry.endsWith('.sql') && !entry.startsWith('._'))
  .sort()
  .map((entry) => readFileSync(join(migrationsDir, entry), 'utf8').toLowerCase())
  .join('\n');
const repositoryMigrations = `${repositoryMigration}\n${entitlementMigration}\n${alertRulesMigration}\n${pantryInventoryMigration}\n${receiptUploadsMigration}\n${householdPlansMigration}\n${basketImportReviewsMigration}`;
const sourcePolicyTables = ['retailer_source_policies'];
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
  'basket_import_review_items',
  'human_review_assignments',
  'human_reviewers',
  'community_reporter_trust',
  'subscription_entitlements',
  'notification_tasks',
  'notification_suppressions',
  'alert_rules',
  'pantry_items',
  'receipt_uploads',
  'receipt_items',
  'household_plans',
  'household_members',
  'household_basket_items',
  'household_watchlist_items',
  'household_favorite_stores'
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

function sourcePolicyTableDefinition(table: string): string {
  const match = retailerSourcePoliciesMigration.match(new RegExp(`create table if not exists ${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `${table} source policy table missing`);
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

  it('tracks observed product availability without deleting price facts', () => {
    assert.match(allMigrations, /alter table observations add column if not exists is_available boolean not null default true/);
    assert.match(allMigrations, /alter table latest_prices add column if not exists is_available boolean not null default true/);
    assert.match(schemaDoc, /is_available/);
    assert.match(schemaDoc, /out-of-stock/i);
  });

  it('keeps connector observation writes idempotent without overwriting history', () => {
    assert.match(allMigrations, /create unique index if not exists observations_connector_idempotency_idx/);
    for (const column of [
      'product_id',
      'chain_id',
      'store_id',
      'domain',
      'retailer_product_ref',
      'price_type',
      'observed_at',
      'price',
      'unit_price',
      'currency',
      'is_available',
      'confidence',
      'provenance'
    ]) {
      assert.match(allMigrations, new RegExp(`\\b${column}\\b`), `idempotency index missing ${column}`);
    }
    assert.match(allMigrations, /nulls not distinct/);
    assert.match(schemaDoc, /exact connector replay idempotency/);
  });

  it('tracks observation availability through immutable rows, rollups, and static snapshots', () => {
    for (const table of ['observations', 'latest_prices', 'observations_v2']) {
      assert.match(
        allMigrations,
        new RegExp(`alter table ${table} add column if not exists is_available boolean not null default true`),
        `${table}.is_available migration missing`
      );
    }
    assert.match(allMigrations, /observations_connector_idempotency_idx[\s\S]*is_available/);
    assert.match(allMigrations, /latest_prices_grocery_snapshot_idx[\s\S]*is_available/);
    assert.match(schemaDoc, /observations\.is_available/);
    assert.match(schemaDoc, /latest_prices\.is_available/);
    assert.match(schemaDoc, /Out of stock/i);
  });

  it('keeps latest prices derived from observations and uniquely addressable', () => {
    const latestPrices = tableDefinition('latest_prices');
    assert.match(latestPrices, /observation_id uuid not null references observations\(id\)/);
    assert.match(latestPrices, /unique nulls not distinct \(product_id, chain_id, store_id, price_type\)/);
  });

  it('indexes latest_prices for bounded DB-backed site snapshot exports', () => {
    assert.match(allMigrations, /create index concurrently if not exists latest_prices_grocery_snapshot_idx/);
    assert.match(allMigrations, /on latest_prices \(domain, observed_at desc, product_id, chain_id, store_id, price_type\)/);
    assert.match(allMigrations, /include \(observation_id, price, regular_price, unit_price, currency, is_available, confidence, provenance\)/);
    assert.match(allMigrations, /where domain = 'grocery'/);
    assert.match(schemaDoc, /latest_prices_grocery_snapshot_idx/);
    assert.match(schemaDoc, /db-backed site snapshot exporter/i);
    assert.match(schemaDoc, /do not replace it with a raw `observations` scan/i);
  });

  it('materializes daily and weekly price rollups for chart and 52-week-low reads', () => {
    for (const table of ['price_daily', 'price_weekly']) {
      assert.match(allMigrations, new RegExp(`create table if not exists ${table}\\b`), `${table} table missing`);
      assert.match(schemaDoc, new RegExp(`### \`${table}\``), `${table} missing from SCHEMA.md`);
      assert.match(migrationVerifier, new RegExp(`\\b${table}\\b`), `${table} missing from migration verifier`);
    }

    assert.match(allMigrations, /date_trunc\('week', observed_at\)::date/);
    assert.match(allMigrations, /min_price numeric\(12, 2\) not null/);
    assert.match(allMigrations, /max_price numeric\(12, 2\) not null/);
    assert.match(allMigrations, /avg_price numeric\(12, 4\) not null/);
    assert.match(allMigrations, /last_price numeric\(12, 2\) not null/);
    assert.match(allMigrations, /observation_count integer not null check \(observation_count > 0\)/);
    assert.match(allMigrations, /price_daily_product_chain_day_idx/);
    assert.match(allMigrations, /price_weekly_product_chain_week_idx/);
    assert.match(schemaDoc, /charts and 52-week-low reads must hit `price_daily` or `price_weekly`/);
  });

  it('builds the observations time-series partition lane with monthly partitions and BRIN pruning', () => {
    assert.match(allMigrations, /create table if not exists observations_v2\b[\s\S]*partition by range \(observed_at\)/);
    assert.match(allMigrations, /create table if not exists observations_default partition of observations_v2 default/);
    assert.match(allMigrations, /create or replace function ensure_observations_monthly_partition\(partition_month date\)/);
    assert.match(allMigrations, /to_char\(partition_month, 'yyyy_mm'\)/);
    assert.match(allMigrations, /for values from \(%l\) to \(%l\)/);
    assert.match(allMigrations, /using brin \(observed_at\)/);
    assert.match(allMigrations, /create_observations_partitions\(window_start date, months_ahead integer\)/);
    assert.match(allMigrations, /drop_observations_partitions_before\(cutoff_month date\)/);
    assert.match(migrationVerifier, /\bobservations_v2\b/);
    assert.match(schemaDoc, /monthly range partitions/);
    assert.match(schemaDoc, /BRIN/i);
    assert.match(schemaDoc, /retention.*partition drop/);
  });

  it('preserves provenance on source-derived tables', () => {
    for (const table of provenanceTables) {
      assert.match(tableDefinition(table), /\bprovenance\b/, `${table}.provenance missing`);
      assert.match(schemaDoc, new RegExp(`### \`${table}\`[\\s\\S]*provenance`), `${table} provenance missing from SCHEMA.md`);
    }
  });

  it('allows official public API source runs for persisted Open Prices pulls', () => {
    assert.match(sourceRunsOfficialApiMigration, /official_api/, 'official_api source run migration missing');
    assert.match(schemaDoc, /official public api/, 'official API source run docs missing');
    assert.match(schemaDoc, /open prices/, 'Open Prices persistence docs missing');
  });

  it('scopes catalog and price facts to supported price domains for future verticals', () => {
    for (const table of ['chains', 'stores', 'products', 'observations', 'latest_prices']) {
      assert.match(allMigrations, new RegExp(`alter table ${table} add column if not exists domain`), `${table}.domain migration missing`);
      assert.match(allMigrations, new RegExp(`${table}_price_domain_check`), `${table} domain constraint missing`);
      assert.match(schemaDoc, new RegExp(`### \`${table}\`[\\s\\S]*\\bdomain\\b`), `${table}.domain docs missing`);
    }
    assert.match(allMigrations, /domain in \('grocery', 'fuel', 'pharmacy'\)/);
    assert.match(allMigrations, /default 'grocery'/);
    assert.match(allMigrations, /observations_domain_observed_idx/);
    assert.match(schemaDoc, /multi-vertical price domain model/);
    assert.match(schemaDoc, /public routes must not render non-grocery prices until `observations\.domain`/);
  });

  it('models fuel grades and operator or crowd fuel source evidence', () => {
    for (const table of ['fuel_grades', 'fuel_price_sources', 'fuel_price_source_observations']) {
      assert.match(allMigrations, new RegExp(`create table if not exists ${table}\\b`), `${table} table missing`);
      assert.match(schemaDoc, new RegExp(`### \`${table}\``), `${table} missing from SCHEMA.md`);
      assert.match(migrationVerifier, new RegExp(`\\b${table}\\b`), `${table} missing from migration verifier`);
    }
    for (const grade of ['fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85']) {
      assert.match(allMigrations, new RegExp(grade), `${grade} missing from fuel grade catalog`);
    }
    assert.match(allMigrations, /operator_public_price_page/);
    assert.match(allMigrations, /crowd_station_report/);
    assert.match(allMigrations, /original_price_text text not null/);
    assert.match(allMigrations, /alter table products add column if not exists fuel_grade_id/);
    assert.match(allMigrations, /products_fuel_grade_domain_check/);
    assert.match(schemaDoc, /fuel prices are always price per litre/);
    assert.match(schemaDoc, /community_reporter_trust/);
  });

  it('persists retailer source policy decisions before ingestion fetches run', () => {
    const sourcePolicies = sourcePolicyTableDefinition('retailer_source_policies');
    assert.match(sourcePolicies, /chain_id uuid not null references chains\(id\) on delete cascade/);
    assert.match(sourcePolicies, /source_surface text not null check/);
    assert.match(sourcePolicies, /policy_label text not null check/);
    assert.match(sourcePolicies, /robots_url text not null/);
    assert.match(sourcePolicies, /disallowed_path_matches text\[\] not null default array\[\]::text\[\]/);
    assert.match(sourcePolicies, /crawl_delay_seconds integer check \(crawl_delay_seconds is null or crawl_delay_seconds >= 0\)/);
    assert.match(sourcePolicies, /legal_review_status text not null check/);
    assert.match(sourcePolicies, /provenance jsonb not null default '\{\}'::jsonb/);
    for (const value of ['allowed', 'fixture_review', 'manual_review', 'blocked', 'stub_only']) {
      assert.match(sourcePolicies, new RegExp(`'${value}'`));
    }
    for (const surface of ['store_locator', 'offer', 'product', 'search', 'basket', 'account', 'member', 'app_api']) {
      assert.match(sourcePolicies, new RegExp(`'${surface}'`));
    }
    assert.match(retailerSourcePoliciesMigration, /retailer_source_policies_label_review_idx/);
    assert.match(retailerSourcePoliciesMigration, /retailer_source_policies_disallowed_gin_idx/);
    assert.match(retailerSourcePoliciesMigration, /retailer_source_policies_provenance_gin_idx/);
    assert.match(schemaDoc, /### `retailer_source_policies`/);
    assert.match(schemaDoc, /blocked, manual-review, fixture-review, and stub-only surfaces fail closed/);
  });

  it('indexes geospatial store lookup and fuzzy product matching', () => {
    assert.match(migration, /stores_position_gix on stores using gist \(position\)/);
    assert.match(migration, /stores_name_trgm_idx on stores using gin \(name gin_trgm_ops\)/);
    assert.match(migration, /stores_slug_trgm_idx on stores using gin \(slug gin_trgm_ops\)/);
    assert.match(migration, /products_name_trgm_idx on products using gin \(canonical_name gin_trgm_ops\)/);
    assert.match(migration, /products_slug_trgm_idx on products using gin \(slug gin_trgm_ops\)/);
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
    assert.match(repositoryTableDefinition('watchlist_items'), /allowed_price_types text\[\] not null default array\['shelf'\]::text\[\]/);
    assert.match(repositoryTableDefinition('watchlist_items'), /allowed_price_types <@ array\['shelf', 'member', 'promotion', 'estimated'\]::text\[\]/);
    assert.match(tableDefinition('watchlists'), /allowed_price_types text\[\] not null default array\['shelf'\]::text\[\]/);
    assert.match(repositoryTableDefinition('basket_import_review_items'), /user_id text not null references app_users\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('basket_import_review_items'), /review_item_id text not null/);
    assert.match(repositoryTableDefinition('basket_import_review_items'), /status text not null check \(status in \('open', 'accepted', 'dismissed'\)\)/);
    assert.match(repositoryTableDefinition('basket_import_review_items'), /primary key \(user_id, review_item_id\)/);
    assert.match(repositoryTableDefinition('pantry_items'), /user_id text not null references app_users\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('pantry_items'), /category text not null check/);
    assert.match(repositoryTableDefinition('pantry_items'), /quantity numeric\(12, 3\) not null check \(quantity >= 0\)/);
    assert.match(repositoryTableDefinition('pantry_items'), /target_quantity numeric\(12, 3\) check \(target_quantity is null or target_quantity >= 0\)/);
    assert.match(repositoryTableDefinition('receipt_uploads'), /user_id text not null references app_users\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('receipt_uploads'), /total_amount numeric\(12, 2\) not null check \(total_amount >= 0\)/);
    assert.match(repositoryTableDefinition('receipt_uploads'), /ocr_confidence numeric\(5, 4\) not null check \(ocr_confidence between 0 and 1\)/);
    assert.match(repositoryTableDefinition('receipt_uploads'), /status text not null check/);
    assert.match(repositoryTableDefinition('receipt_items'), /receipt_id text not null references receipt_uploads\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('receipt_items'), /quantity numeric\(12, 3\) not null check \(quantity > 0\)/);
    assert.match(repositoryTableDefinition('receipt_items'), /match_confidence numeric\(5, 4\) check \(match_confidence is null or match_confidence between 0 and 1\)/);
    assert.match(repositoryTableDefinition('household_plans'), /user_id text not null references app_users\(id\) on delete cascade/);
    assert.match(repositoryTableDefinition('household_plans'), /weekly_budget numeric\(12, 2\) not null check \(weekly_budget >= 0\)/);
    assert.match(repositoryTableDefinition('household_plans'), /approval_limit numeric\(12, 2\) not null check \(approval_limit >= 0\)/);
    assert.match(repositoryTableDefinition('household_members'), /primary key \(household_id, user_id\)/);
    assert.match(repositoryTableDefinition('household_basket_items'), /quantity numeric\(12, 3\) not null check \(quantity > 0\)/);
    assert.match(repositoryTableDefinition('household_watchlist_items'), /target_price numeric\(12, 2\) check \(target_price is null or target_price >= 0\)/);
    assert.match(repositoryTableDefinition('household_favorite_stores'), /primary key \(household_id, store_id\)/);
  });

  it('migrates web price alert subscriptions with account and product lookup indexes', () => {
    assert.match(priceAlertsMigration, /create table if not exists price_alerts/);
    assert.match(priceAlertsMigration, /id uuid primary key default gen_random_uuid\(\)/);
    assert.match(priceAlertsMigration, /user_email text not null/);
    assert.match(priceAlertsMigration, /product_id text not null/);
    assert.match(priceAlertsMigration, /target_price numeric\(12, 2\) not null check \(target_price >= 0\)/);
    assert.match(priceAlertsMigration, /created_at timestamptz not null default now\(\)/);
    assert.match(priceAlertsMigration, /price_alerts_user_created_idx on price_alerts \(user_email, created_at desc, id\)/);
    assert.match(priceAlertsMigration, /price_alerts_product_idx on price_alerts \(product_id, id\)/);
    assert.match(schemaDoc, /### `price_alerts`/);
    assert.match(schemaDoc, /target-price alert subscriptions captured by the web alert api/);
    assert.match(migrationVerifier, /\bprice_alerts\b/);
  });

  it('indexes repository workflow lookups used by adapters and workers', () => {
    assert.match(repositoryMigration, /watchlist_items_user_idx on watchlist_items \(user_id, id\)/);
    assert.match(repositoryMigration, /weekly_baskets_user_week_idx on weekly_baskets \(user_id, week_start desc\)/);
    assert.match(basketImportReviewsMigration, /basket_import_review_items_open_idx on basket_import_review_items \(user_id, status, created_at, review_item_id\)/);
    assert.match(repositoryMigration, /human_review_assignments_open_idx on human_review_assignments \(status, due_at, id\)/);
    assert.match(entitlementMigration, /subscription_entitlements_status_idx on subscription_entitlements \(status, updated_at desc\)/);
    assert.match(repositoryMigration, /notification_tasks_due_idx on notification_tasks \(status, send_at, id\)/);
    assert.match(repositoryMigration, /notification_suppressions_active_idx on notification_suppressions \(active, recipient, channel, id\)/);
    assert.match(alertRulesMigration, /alert_rules_active_user_idx on alert_rules \(user_id, active, product_id, alert_type, id\)/);
    assert.match(pantryInventoryMigration, /pantry_items_user_idx on pantry_items \(user_id, product_id\)/);
    assert.match(pantryInventoryMigration, /pantry_items_expiry_idx on pantry_items \(expires_on\) where expires_on is not null/);
    assert.match(receiptUploadsMigration, /receipt_uploads_user_purchased_idx on receipt_uploads \(user_id, purchased_at desc, id\)/);
    assert.match(receiptUploadsMigration, /receipt_uploads_status_idx on receipt_uploads \(status, updated_at desc, id\)/);
    assert.match(receiptUploadsMigration, /receipt_items_receipt_idx on receipt_items \(receipt_id, id\)/);
    assert.match(householdPlansMigration, /household_plans_user_idx on household_plans \(user_id\)/);
    assert.match(householdPlansMigration, /household_members_user_idx on household_members \(user_id, household_id\)/);
    assert.match(householdPlansMigration, /household_basket_items_product_idx on household_basket_items \(product_id, household_id\)/);
    assert.match(householdPlansMigration, /household_watchlist_items_product_idx on household_watchlist_items \(product_id, household_id\)/);
  });

  it('keeps the migration verifier aligned with catalog and repository tables', () => {
    for (const table of [...requiredTables, ...repositoryTables, ...sourcePolicyTables]) {
      assert.match(migrationVerifier, new RegExp(`\\b${table}\\b`), `${table} missing from migration verifier`);
    }
    assert.match(migrationVerifier, /create table if not exists schema_migrations/);
    assert.match(migrationVerifier, /insert into schema_migrations\(version\)/);
    assert.match(migrationVerifier, /information_schema\.tables/);
    assert.match(migrationVerifier, /migration metadata assertion failed/);
    assert.match(migrationVerifier, /migration table assertion failed/);
    assert.match(migrationVerifier, /pg_extension/);
    assert.match(migrationVerifier, /migration extension assertion failed/);
    assert.match(migrationVerifier, /required migration extensions ok/);
    assert.match(migrationVerifier, /postgres_ready_timeout_seconds/);
    assert.match(migrationVerifier, /seq 1 "\$postgres_ready_timeout_seconds"/);
    assert.match(migrationVerifier, /migrations=\(\)/);
    assert.doesNotMatch(migrationVerifier, /mapfile/);
  });
});
