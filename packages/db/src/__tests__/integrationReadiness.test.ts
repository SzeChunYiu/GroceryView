import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS,
  POSTGRES_INTEGRATION_REQUIRED_TABLES,
  TIMESCALEDB_EVALUATION_FALLBACK_FUNCTIONS,
  TIMESCALEDB_EVALUATION_FALLBACK_TABLES,
  buildTimescaleDbEvaluationReport,
  buildPostgresIntegrationReadinessReport,
  buildPostgresRepositorySmokeProbes,
  checkPostgresIntegrationReadiness,
  checkPostgresRepositoryIntegrationReadiness,
  collectPostgresIntegrationProbe,
  summarizePostgresIntegrationReadinessReport,
  type QueryExecutor
} from '../index.js';

class ProbeQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('information_schema.tables')) {
      return [{ table_name: 'app_users' }, { table_name: 'notification_tasks' }] as T[];
    }
    if (sql.includes('schema_migrations')) {
      return [{ version: '001_groceryview_schema' }] as T[];
    }
    if (sql.includes('select 1 as ok')) {
      return [{ ok: 1 }] as T[];
    }
    throw new Error('probe failed');
  }
}

class MissingSchemaMigrationsExecutor extends ProbeQueryExecutor {
  override async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('schema_migrations')) {
      throw new Error('relation "schema_migrations" does not exist');
    }
    if (sql.includes('information_schema.tables')) {
      return [{ table_name: 'app_users' }] as T[];
    }
    if (sql.includes('select 1 as ok')) {
      return [{ ok: 1 }] as T[];
    }
    throw new Error('probe failed');
  }
}

class RepositorySmokeQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];

  constructor(private readonly readable = true) {}

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (!this.readable) return [] as T[];
    if (sql.includes('information_schema.tables')) {
      return POSTGRES_INTEGRATION_REQUIRED_TABLES.map((table_name) => ({ table_name })) as T[];
    }
    if (sql.includes('schema_migrations')) {
      return POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS.map((version) => ({ version })) as T[];
    }
    if (sql.includes('insert into chains')) {
      return [{ id: 'chain-1' }] as T[];
    }
    if (sql.includes('insert into products')) {
      return [{ id: 'product-1' }] as T[];
    }
    if (sql.includes('insert into source_runs')) {
      return [{ id: 'source-run-1' }] as T[];
    }
    if (sql.includes('insert into raw_records')) {
      return [{ id: 'raw-record-1' }] as T[];
    }
    if (sql.includes('insert into observations')) {
      return [{ id: 'observation-1' }] as T[];
    }
    if (sql.includes('from latest_prices')) {
      return [{ observation_id: 'observation-1' }] as T[];
    }
    if (sql.includes('select weekly_budget')) {
      return [{ weekly_budget: '1000', monthly_budget: '4000' }] as T[];
    }
    if (sql.includes('select store_id from favorite_stores')) {
      return [{ store_id: 'postgres-probe-store-run-42' }] as T[];
    }
    if (sql.includes('from watchlist_items')) {
      return [
        {
          product_id: 'postgres-probe-grocery-run-42',
          target_price: '49.90',
          alert_deal_score_at: 80,
          favorite_stores_only: true
        }
      ] as T[];
    }
    if (sql.includes('insert into weekly_baskets')) {
      return [{ id: 'weekly-basket-1' }] as T[];
    }
    if (sql.includes('from basket_items')) {
      return [{ product_id: 'postgres-probe-grocery-run-42', quantity: '2' }] as T[];
    }
    if (sql.includes('from basket_import_review_items')) {
      return [{
        review_item_id: 'postgres-probe-basket-import-review-run-42',
        raw_name: 'Postgres Probe Unmatched Retailer Row',
        quantity: '1.000',
        reason: 'PostgreSQL integration smoke probe.',
        retailer_id: 'willys',
        source_kind: 'bookmarklet',
        captured_at: '2026-05-20T00:00:00.000Z',
        status: 'open',
        created_at: '2026-05-20T00:00:00.000Z',
        resolved_at: null,
        resolved_product_id: null
      }] as T[];
    }
    if (sql.includes('update basket_import_review_items')) {
      return [{
        review_item_id: 'postgres-probe-basket-import-review-run-42',
        raw_name: 'Postgres Probe Unmatched Retailer Row',
        quantity: '1.000',
        reason: 'PostgreSQL integration smoke probe.',
        retailer_id: 'willys',
        source_kind: 'bookmarklet',
        captured_at: '2026-05-20T00:00:00.000Z',
        status: 'dismissed',
        created_at: '2026-05-20T00:00:00.000Z',
        resolved_at: '2026-05-20T00:00:00.000Z',
        resolved_product_id: null
      }] as T[];
    }
    if (sql.includes('from subscription_entitlements')) {
      return [
        {
          user_id: 'postgres-probe-user-run-42',
          tier: 'premium',
          plan: 'premium_monthly',
          status: 'active',
          current_period_ends_at: '2026-06-20T00:00:00.000Z',
          provider: 'stripe_compatible',
          provider_customer_id: 'postgres-probe-customer-run-42',
          provider_subscription_id: 'postgres-probe-subscription-run-42',
          updated_at: '2026-05-20T00:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from human_review_assignments')) {
      return [
        {
          id: 'postgres-probe-assignment-run-42',
          review_id: 'postgres-probe-assignment-run-42',
          subject_type: 'product_match',
          subject_id: 'postgres-probe-match-run-42',
          priority: 'low',
          reason: 'PostgreSQL integration smoke probe.',
          assignee_id: 'postgres-probe-reviewer-run-42',
          assigned_at: '2026-05-20T00:00:00.000Z',
          due_at: '2026-05-20T00:00:00.000Z',
          status: 'assigned'
        }
      ] as T[];
    }
    if (sql.includes('from notification_suppressions')) {
      return [
        {
          id: 'postgres-probe-suppression-run-42',
          recipient: 'postgres-probe-user-run-42@example.invalid',
          channel: 'email',
          reason: 'unsubscribed',
          active: true,
          updated_at: '2026-05-20T00:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from alert_rules')) {
      return [
        {
          id: 'postgres-probe-alert-run-42',
          user_id: 'postgres-probe-user-run-42',
          product_id: 'postgres-probe-product-run-42',
          store_id: null,
          channel: 'push',
          alert_type: 'target_price',
          target_price: '49.90',
          deal_score_threshold: null,
          active: true,
          created_at: '2026-05-20T00:00:00.000Z',
          updated_at: '2026-05-20T00:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from pantry_items')) {
      return [
        {
          id: 'postgres-probe-pantry-run-42',
          user_id: 'postgres-probe-user-run-42',
          product_id: 'postgres-probe-product-run-42',
          name: 'Postgres Probe Pantry Item',
          category: 'pantry',
          quantity: '1.000',
          unit: 'pcs',
          minimum_quantity: '2.000',
          target_quantity: '4.000',
          expires_on: '2026-06-20',
          updated_at: '2026-05-20T00:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from receipt_uploads')) {
      return [
        {
          id: 'postgres-probe-receipt-run-42',
          user_id: 'postgres-probe-user-run-42',
          store_id: null,
          image_uri: 'scan://postgres-probe/run-42',
          purchased_at: '2026-05-20T00:00:00.000Z',
          total_amount: '12.34',
          ocr_confidence: '0.9700',
          status: 'parsed',
          created_at: '2026-05-20T00:00:00.000Z',
          updated_at: '2026-05-20T00:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from receipt_items')) {
      return [
        {
          id: 'postgres-probe-receipt-item-run-42',
          receipt_id: 'postgres-probe-receipt-run-42',
          raw_name: 'Postgres Probe Receipt Item',
          product_id: 'postgres-probe-product-run-42',
          canonical_name: 'Postgres Probe Product',
          quantity: '1.000',
          item_total: '12.34',
          match_confidence: '0.9100'
        }
      ] as T[];
    }
    if (sql.includes('from household_plans')) {
      return [
        {
          id: 'postgres-probe-household-run-42',
          user_id: 'postgres-probe-user-run-42',
          name: 'Postgres Probe Household',
          weekly_budget: '800.00',
          approval_limit: '400.00',
          reviewer_user_id: 'postgres-probe-user-run-42',
          created_at: '2026-05-20T00:00:00.000Z',
          updated_at: '2026-05-20T00:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from household_members')) {
      return [
        {
          household_id: 'postgres-probe-household-run-42',
          user_id: 'postgres-probe-user-run-42',
          display_name: 'Postgres Probe User'
        }
      ] as T[];
    }
    if (sql.includes('from household_basket_items')) {
      return [
        {
          household_id: 'postgres-probe-household-run-42',
          line_position: 0,
          product_id: 'postgres-probe-product-run-42',
          quantity: '1.000',
          added_by: 'postgres-probe-user-run-42'
        }
      ] as T[];
    }
    if (sql.includes('from household_watchlist_items')) {
      return [
        {
          household_id: 'postgres-probe-household-run-42',
          line_position: 0,
          product_id: 'postgres-probe-product-run-42',
          added_by: 'postgres-probe-user-run-42',
          target_price: '50.00'
        }
      ] as T[];
    }
    if (sql.includes('from household_favorite_stores')) {
      return [
        {
          household_id: 'postgres-probe-household-run-42',
          store_id: 'postgres-probe-store-run-42'
        }
      ] as T[];
    }
    return [] as T[];
  }
}

describe('buildPostgresIntegrationReadinessReport', () => {
  it('fails closed with concrete blockers for missing schema, migrations, and repository probes', () => {
    const report = buildPostgresIntegrationReadinessReport({
      requiredTables: [...POSTGRES_INTEGRATION_REQUIRED_TABLES],
      existingTables: ['app_users', 'favorite_stores', 'notification_tasks'],
      requiredMigrationVersions: [...POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS],
      appliedMigrationVersions: ['001_groceryview_schema'],
      repositoryChecks: [
        { name: 'upsert_user', status: 'pass' },
        { name: 'human_review_assignment_round_trip', status: 'fail' },
        { name: 'notification_suppression_round_trip', status: 'not_run' }
      ]
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'missing_table:alert_rules',
      'missing_table:basket_import_review_items',
      'missing_table:basket_items',
      'missing_table:chains',
      'missing_table:community_reporter_trust',
      'missing_table:fuel_grades',
      'missing_table:fuel_price_source_observations',
      'missing_table:fuel_price_sources',
      'missing_table:household_basket_items',
      'missing_table:household_favorite_stores',
      'missing_table:household_members',
      'missing_table:household_plans',
      'missing_table:household_watchlist_items',
      'missing_table:human_review_assignments',
      'missing_table:human_reviewers',
      'missing_table:latest_prices',
      'missing_table:notification_suppressions',
      'missing_table:observations',
      'missing_table:observations_v2',
      'missing_table:pantry_items',
      'missing_table:price_daily',
      'missing_table:price_weekly',
      'missing_table:products',
      'missing_table:raw_records',
      'missing_table:receipt_items',
      'missing_table:receipt_uploads',
      'missing_table:retailer_source_policies',
      'missing_table:source_runs',
      'missing_table:subscription_entitlements',
      'missing_table:user_preferences',
      'missing_table:watchlist_items',
      'missing_table:weekly_baskets',
      'missing_migration:002_repository_support_schema',
      'missing_migration:003_subscription_entitlements',
      'missing_migration:004_alert_rules',
      'missing_migration:005_pantry_inventory',
      'missing_migration:006_source_runs_official_api',
      'missing_migration:007_receipt_uploads',
      'missing_migration:008_household_plans',
      'missing_migration:009_retailer_source_policies',
      'missing_migration:010_basket_import_reviews',
      'missing_migration:010_commodity_taxonomy',
      'missing_migration:011_multi_vertical_domains',
      'missing_migration:012_price_rollups',
      'missing_migration:013_observations_partitioning',
      'missing_migration:014_fuel_price_sources',
      'missing_migration:016_observation_connector_idempotency',
      'missing_migration:017_observation_availability',
      'repository_check_fail:human_review_assignment_round_trip',
      'repository_check_not_run:notification_suppression_round_trip'
    ]);
    assert.deepEqual(report.evidence, [
      'table:app_users',
      'table:favorite_stores',
      'table:notification_tasks',
      'migration:001_groceryview_schema',
      'repository_check:upsert_user'
    ]);
  });

  it('marks the integration contract ready only when every probe passes', () => {
    const report = buildPostgresIntegrationReadinessReport({
      requiredTables: [...POSTGRES_INTEGRATION_REQUIRED_TABLES],
      existingTables: [...POSTGRES_INTEGRATION_REQUIRED_TABLES],
      requiredMigrationVersions: [...POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS],
      appliedMigrationVersions: [...POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS],
      repositoryChecks: [
        { name: 'upsert_user', status: 'pass' },
        { name: 'favorite_store_round_trip', status: 'pass' },
        { name: 'human_review_assignment_round_trip', status: 'pass' },
        { name: 'notification_suppression_round_trip', status: 'pass' }
      ]
    });

    assert.deepEqual(report, {
      status: 'ready',
      blockers: [],
      evidence: [
        'table:alert_rules',
        'table:app_users',
        'table:basket_import_review_items',
        'table:basket_items',
        'table:chains',
        'table:community_reporter_trust',
        'table:favorite_stores',
        'table:fuel_grades',
        'table:fuel_price_source_observations',
        'table:fuel_price_sources',
        'table:household_basket_items',
        'table:household_favorite_stores',
        'table:household_members',
        'table:household_plans',
        'table:household_watchlist_items',
        'table:human_review_assignments',
        'table:human_reviewers',
        'table:latest_prices',
        'table:notification_suppressions',
        'table:notification_tasks',
        'table:observations',
        'table:observations_v2',
        'table:pantry_items',
        'table:price_daily',
        'table:price_weekly',
        'table:products',
        'table:raw_records',
        'table:receipt_items',
        'table:receipt_uploads',
        'table:retailer_source_policies',
        'table:source_runs',
        'table:subscription_entitlements',
        'table:user_preferences',
        'table:watchlist_items',
        'table:weekly_baskets',
        'migration:001_groceryview_schema',
        'migration:002_repository_support_schema',
        'migration:003_subscription_entitlements',
        'migration:004_alert_rules',
        'migration:005_pantry_inventory',
        'migration:006_source_runs_official_api',
        'migration:007_receipt_uploads',
        'migration:008_household_plans',
        'migration:009_retailer_source_policies',
        'migration:010_basket_import_reviews',
        'migration:010_commodity_taxonomy',
        'migration:011_multi_vertical_domains',
        'migration:012_price_rollups',
        'migration:013_observations_partitioning',
        'migration:014_fuel_price_sources',
        'migration:016_observation_connector_idempotency',
        'migration:017_observation_availability',
        'repository_check:favorite_store_round_trip',
        'repository_check:human_review_assignment_round_trip',
        'repository_check:notification_suppression_round_trip',
        'repository_check:upsert_user'
      ],
      summary: 'PostgreSQL integration contract is ready.'
    });
  });
});

describe('summarizePostgresIntegrationReadinessReport', () => {
  it('counts blocker and evidence categories for readiness dashboards', () => {
    const report = buildPostgresIntegrationReadinessReport({
      requiredTables: ['app_users', 'latest_prices', 'products'],
      existingTables: ['app_users'],
      requiredMigrationVersions: ['001_groceryview_schema', '002_repository_support_schema'],
      appliedMigrationVersions: ['001_groceryview_schema'],
      repositoryChecks: [
        { name: 'user_budget_round_trip', status: 'pass' },
        { name: 'price_observation_pipeline_round_trip', status: 'fail' },
        { name: 'notification_suppression_round_trip', status: 'not_run' }
      ]
    });

    assert.deepEqual(summarizePostgresIntegrationReadinessReport(report), {
      status: 'blocked',
      blockers: {
        total: 5,
        missingTables: 2,
        missingMigrations: 1,
        repositoryFailures: 1,
        repositoryNotRun: 1
      },
      evidence: {
        total: 3,
        tables: 1,
        migrations: 1,
        repositoryChecks: 1
      }
    });
  });

  it('reports zero blockers for a ready PostgreSQL integration report', () => {
    const report = buildPostgresIntegrationReadinessReport({
      requiredTables: ['app_users'],
      existingTables: ['app_users'],
      requiredMigrationVersions: ['001_groceryview_schema'],
      appliedMigrationVersions: ['001_groceryview_schema'],
      repositoryChecks: [{ name: 'user_budget_round_trip', status: 'pass' }]
    });

    assert.deepEqual(summarizePostgresIntegrationReadinessReport(report), {
      status: 'ready',
      blockers: {
        total: 0,
        missingTables: 0,
        missingMigrations: 0,
        repositoryFailures: 0,
        repositoryNotRun: 0
      },
      evidence: {
        total: 3,
        tables: 1,
        migrations: 1,
        repositoryChecks: 1
      }
    });
  });
});

describe('buildTimescaleDbEvaluationReport', () => {
  it('keeps the price tape ready on declarative partitions when TimescaleDB is not installed', () => {
    const report = buildTimescaleDbEvaluationReport({
      timescaleExtensionAvailable: false,
      hypertables: [],
      compressionPolicies: [],
      retentionPolicies: [],
      fallbackTables: [...TIMESCALEDB_EVALUATION_FALLBACK_TABLES],
      fallbackFunctions: [...TIMESCALEDB_EVALUATION_FALLBACK_FUNCTIONS]
    });

    assert.equal(report.status, 'fallback_ready');
    assert.deepEqual(report.blockers, []);
    assert.deepEqual(report.timescaleGaps, [
      'timescaledb_extension_not_installed',
      'missing_hypertable:observations_v2',
      'missing_compression_policy:observations_v2',
      'missing_retention_policy:observations_v2'
    ]);
    assert.match(report.recommendation, /Use declarative monthly partitions/);
    assert.equal(report.evidence.includes('fallback_table:observations_v2'), true);
    assert.equal(report.evidence.includes('fallback_table:price_daily'), true);
    assert.equal(report.evidence.includes('fallback_function:drop_observations_partitions_before'), true);
  });

  it('marks TimescaleDB ready only when hypertable, compression, and retention evidence exists', () => {
    const report = buildTimescaleDbEvaluationReport({
      timescaleExtensionAvailable: true,
      hypertables: ['observations_v2'],
      compressionPolicies: ['observations_v2'],
      retentionPolicies: ['observations_v2'],
      fallbackTables: [...TIMESCALEDB_EVALUATION_FALLBACK_TABLES],
      fallbackFunctions: [...TIMESCALEDB_EVALUATION_FALLBACK_FUNCTIONS]
    });

    assert.deepEqual(report, {
      status: 'timescale_ready',
      blockers: [],
      timescaleGaps: [],
      evidence: [
        'timescaledb_extension:available',
        'hypertable:observations_v2',
        'compression_policy:observations_v2',
        'retention_policy:observations_v2',
        'fallback_table:observations_v2',
        'fallback_table:price_daily',
        'fallback_table:price_weekly',
        'fallback_function:create_observations_partitions',
        'fallback_function:drop_observations_partitions_before'
      ],
      recommendation: 'TimescaleDB is ready for observations_v2 hypertable compression and retention policies.',
      summary: 'TimescaleDB evaluation is ready.'
    });
  });

  it('blocks the evaluation when neither TimescaleDB policies nor the partition fallback are complete', () => {
    const report = buildTimescaleDbEvaluationReport({
      timescaleExtensionAvailable: false,
      hypertables: [],
      compressionPolicies: [],
      retentionPolicies: [],
      fallbackTables: ['observations_v2'],
      fallbackFunctions: []
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'missing_fallback_table:price_daily',
      'missing_fallback_table:price_weekly',
      'missing_fallback_function:create_observations_partitions',
      'missing_fallback_function:drop_observations_partitions_before'
    ]);
    assert.match(report.summary, /blocked/);
  });
});

describe('collectPostgresIntegrationProbe', () => {
  it('collects schema, migration, and repository probe evidence from a live executor', async () => {
    const executor = new ProbeQueryExecutor();
    const probe = await collectPostgresIntegrationProbe({
      executor,
      repositoryProbes: [
        {
          name: 'user_read_probe',
          async run(queryExecutor) {
            await queryExecutor.query('select 1 as ok');
          }
        },
        {
          name: 'suppression_read_probe',
          async run(queryExecutor) {
            await queryExecutor.query('select * from notification_suppressions limit 1');
          }
        }
      ]
    });

    assert.deepEqual(probe, {
      requiredTables: [...POSTGRES_INTEGRATION_REQUIRED_TABLES],
      existingTables: ['app_users', 'notification_tasks'],
      requiredMigrationVersions: [...POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS],
      appliedMigrationVersions: ['001_groceryview_schema'],
      repositoryChecks: [
        { name: 'user_read_probe', status: 'pass' },
        { name: 'suppression_read_probe', status: 'fail' }
      ]
    });
    assert.deepEqual(executor.calls[0].params[0], [...POSTGRES_INTEGRATION_REQUIRED_TABLES]);
    assert.match(executor.calls[0].sql, /information_schema\.tables/);
    assert.match(executor.calls[1].sql, /schema_migrations/);
  });

  it('fails closed when migration metadata cannot be read', async () => {
    const probe = await collectPostgresIntegrationProbe({
      executor: new MissingSchemaMigrationsExecutor(),
      repositoryProbes: [
        {
          name: 'user_read_probe',
          async run(queryExecutor) {
            await queryExecutor.query('select 1 as ok');
          }
        }
      ]
    });

    assert.deepEqual(probe.appliedMigrationVersions, []);
    assert.deepEqual(probe.repositoryChecks, [
      { name: 'schema_migrations_probe', status: 'fail' },
      { name: 'user_read_probe', status: 'pass' }
    ]);

    const report = buildPostgresIntegrationReadinessReport(probe);
    assert.equal(report.status, 'blocked');
    assert.match(report.blockers.join('\n'), /missing_migration:001_groceryview_schema/);
    assert.match(report.blockers.join('\n'), /repository_check_fail:schema_migrations_probe/);
    assert.deepEqual(report.evidence, ['table:app_users', 'repository_check:user_read_probe']);
  });
});

describe('checkPostgresIntegrationReadiness', () => {
  it('collects live evidence and returns a readiness report in one call', async () => {
    const report = await checkPostgresIntegrationReadiness({
      executor: new ProbeQueryExecutor(),
      repositoryProbes: [
        {
          name: 'user_read_probe',
          async run(queryExecutor) {
            await queryExecutor.query('select 1 as ok');
          }
        },
        {
          name: 'suppression_read_probe',
          async run(queryExecutor) {
            await queryExecutor.query('select * from notification_suppressions limit 1');
          }
        }
      ]
    });

    assert.equal(report.status, 'blocked');
    assert.match(report.summary, /blocked/);
    assert.deepEqual(report.evidence, [
      'table:app_users',
      'table:notification_tasks',
      'migration:001_groceryview_schema',
      'repository_check:user_read_probe'
    ]);
    assert.match(report.blockers.join('\n'), /missing_table:notification_suppressions/);
    assert.match(report.blockers.join('\n'), /repository_check_fail:suppression_read_probe/);
  });
});

describe('checkPostgresRepositoryIntegrationReadiness', () => {
  it('runs schema, migration, and repository smoke probes through one readiness check', async () => {
    const executor = new RepositorySmokeQueryExecutor();
    const report = await checkPostgresRepositoryIntegrationReadiness({
      executor,
      runId: 'run/42',
      now: '2026-05-20T00:00:00.000Z'
    });

    assert.equal(report.status, 'ready');
    assert.deepEqual(report.blockers, []);
    assert.equal(report.evidence.includes('repository_check:user_budget_round_trip'), true);
    assert.equal(report.evidence.includes('repository_check:price_observation_pipeline_round_trip'), true);
    assert.equal(executor.calls.some((call) => call.sql.includes('information_schema.tables')), true);
    assert.equal(executor.calls.some((call) => call.sql.includes('schema_migrations')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-product-run-42')), true);
  });
});

describe('buildPostgresRepositorySmokeProbes', () => {
  it('builds destructive-safe repository read/write probes with sanitized ids', async () => {
    const executor = new RepositorySmokeQueryExecutor();
    const probes = buildPostgresRepositorySmokeProbes({
      runId: 'run/42',
      now: '2026-05-20T00:00:00.000Z'
    });

    assert.deepEqual(probes.map((probe) => probe.name), [
      'user_budget_round_trip',
      'user_subscription_entitlement_round_trip',
      'grocery_user_state_round_trip',
      'basket_import_review_round_trip',
      'human_review_assignment_round_trip',
      'notification_suppression_round_trip',
      'alert_rule_round_trip',
      'pantry_item_round_trip',
      'receipt_upload_round_trip',
      'household_plan_round_trip',
      'price_observation_pipeline_round_trip'
    ]);

    for (const probe of probes) {
      await probe.run(executor);
    }

    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-user-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-subscription-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-store-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-grocery-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-basket-import-review-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-assignment-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-suppression-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-alert-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-pantry-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-receipt-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-receipt-item-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-household-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-chain-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-product-run-42')), true);
  });

  it('fails closed when a smoke probe cannot read back its write', async () => {
    const probes = buildPostgresRepositorySmokeProbes({
      runId: 'run-42',
      now: '2026-05-20T00:00:00.000Z'
    });

    await assert.rejects(
      () => probes[0]!.run(new RepositorySmokeQueryExecutor(false)),
      /user budget round trip did not return the written values/
    );
  });
});
