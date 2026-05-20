import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS,
  POSTGRES_INTEGRATION_REQUIRED_TABLES,
  buildPostgresIntegrationReadinessReport,
  buildPostgresRepositorySmokeProbes,
  checkPostgresIntegrationReadiness,
  collectPostgresIntegrationProbe,
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
      'missing_table:basket_items',
      'missing_table:chains',
      'missing_table:community_reporter_trust',
      'missing_table:human_review_assignments',
      'missing_table:human_reviewers',
      'missing_table:latest_prices',
      'missing_table:notification_suppressions',
      'missing_table:observations',
      'missing_table:products',
      'missing_table:raw_records',
      'missing_table:source_runs',
      'missing_table:user_preferences',
      'missing_table:watchlist_items',
      'missing_table:weekly_baskets',
      'missing_migration:002_repository_support_schema',
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
        'table:app_users',
        'table:basket_items',
        'table:chains',
        'table:community_reporter_trust',
        'table:favorite_stores',
        'table:human_review_assignments',
        'table:human_reviewers',
        'table:latest_prices',
        'table:notification_suppressions',
        'table:notification_tasks',
        'table:observations',
        'table:products',
        'table:raw_records',
        'table:source_runs',
        'table:user_preferences',
        'table:watchlist_items',
        'table:weekly_baskets',
        'migration:001_groceryview_schema',
        'migration:002_repository_support_schema',
        'repository_check:favorite_store_round_trip',
        'repository_check:human_review_assignment_round_trip',
        'repository_check:notification_suppression_round_trip',
        'repository_check:upsert_user'
      ],
      summary: 'PostgreSQL integration contract is ready.'
    });
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

describe('buildPostgresRepositorySmokeProbes', () => {
  it('builds destructive-safe repository read/write probes with sanitized ids', async () => {
    const executor = new RepositorySmokeQueryExecutor();
    const probes = buildPostgresRepositorySmokeProbes({
      runId: 'run/42',
      now: '2026-05-20T00:00:00.000Z'
    });

    assert.deepEqual(probes.map((probe) => probe.name), [
      'user_budget_round_trip',
      'human_review_assignment_round_trip',
      'notification_suppression_round_trip',
      'price_observation_pipeline_round_trip'
    ]);

    for (const probe of probes) {
      await probe.run(executor);
    }

    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-user-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-assignment-run-42')), true);
    assert.equal(executor.calls.some((call) => call.params.includes('postgres-probe-suppression-run-42')), true);
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
