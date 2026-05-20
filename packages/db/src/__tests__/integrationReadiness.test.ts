import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS,
  POSTGRES_INTEGRATION_REQUIRED_TABLES,
  buildPostgresIntegrationReadinessReport,
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
      return [{ version: '001_initial_schema' }, { version: '006_notification_tasks' }] as T[];
    }
    if (sql.includes('select 1 as ok')) {
      return [{ ok: 1 }] as T[];
    }
    throw new Error('probe failed');
  }
}

describe('buildPostgresIntegrationReadinessReport', () => {
  it('fails closed with concrete blockers for missing schema, migrations, and repository probes', () => {
    const report = buildPostgresIntegrationReadinessReport({
      requiredTables: [...POSTGRES_INTEGRATION_REQUIRED_TABLES],
      existingTables: ['app_users', 'favorite_stores', 'notification_tasks'],
      requiredMigrationVersions: [...POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS],
      appliedMigrationVersions: ['001_initial_schema', '006_notification_tasks'],
      repositoryChecks: [
        { name: 'upsert_user', status: 'pass' },
        { name: 'human_review_assignment_round_trip', status: 'fail' },
        { name: 'notification_suppression_round_trip', status: 'not_run' }
      ]
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'missing_table:community_reporter_trust',
      'missing_table:human_review_assignments',
      'missing_table:human_reviewers',
      'missing_table:notification_suppressions',
      'missing_migration:003_human_review_assignments',
      'missing_migration:004_human_reviewers',
      'missing_migration:005_community_reporter_trust',
      'missing_migration:007_notification_suppressions',
      'missing_migration:008_notification_task_suppressed_status',
      'repository_check_fail:human_review_assignment_round_trip',
      'repository_check_not_run:notification_suppression_round_trip'
    ]);
    assert.deepEqual(report.evidence, [
      'table:app_users',
      'table:favorite_stores',
      'table:notification_tasks',
      'migration:001_initial_schema',
      'migration:006_notification_tasks',
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
        'table:community_reporter_trust',
        'table:favorite_stores',
        'table:human_review_assignments',
        'table:human_reviewers',
        'table:notification_suppressions',
        'table:notification_tasks',
        'migration:001_initial_schema',
        'migration:003_human_review_assignments',
        'migration:004_human_reviewers',
        'migration:005_community_reporter_trust',
        'migration:006_notification_tasks',
        'migration:007_notification_suppressions',
        'migration:008_notification_task_suppressed_status',
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
      appliedMigrationVersions: ['001_initial_schema', '006_notification_tasks'],
      repositoryChecks: [
        { name: 'user_read_probe', status: 'pass' },
        { name: 'suppression_read_probe', status: 'fail' }
      ]
    });
    assert.deepEqual(executor.calls[0].params[0], [...POSTGRES_INTEGRATION_REQUIRED_TABLES]);
    assert.match(executor.calls[0].sql, /information_schema\.tables/);
    assert.match(executor.calls[1].sql, /schema_migrations/);
  });
});
