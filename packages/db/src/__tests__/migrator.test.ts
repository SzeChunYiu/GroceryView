import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_MIGRATIONS_TABLE_SQL,
  applyMigrations,
  buildMigrationPlanStatus,
  createMigrationPlan,
  createPostgresMigrationExecutor,
  migrationVersionFromPath,
  parseSqlStatements,
  type QueryExecutor,
  type SqlExecutor
} from '../index.js';

class RecordingExecutor implements SqlExecutor {
  appliedVersions = new Set<string>();
  statements: string[] = [];

  async getAppliedMigrationVersions() {
    return [...this.appliedVersions].sort();
  }

  async execute(sql: string) {
    this.statements.push(sql);
  }

  async recordMigration(version: string) {
    this.appliedVersions.add(version);
  }
}

class RecordingQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];
  versions: string[] = [];

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('select version from schema_migrations')) {
      return this.versions.map((version) => ({ version })) as T[];
    }
    if (sql.includes('insert into schema_migrations')) {
      this.versions.push(params[0] as string);
    }
    return [] as T[];
  }
}

describe('parseSqlStatements', () => {
  it('splits SQL statements while ignoring comments and blanks', () => {
    assert.deepEqual(parseSqlStatements('-- hello\ncreate table a(id text);\n\ncreate index a_idx on a(id);'), [
      'create table a(id text)',
      'create index a_idx on a(id)'
    ]);
  });

  it('does not split semicolons inside quoted SQL values or identifiers', () => {
    assert.deepEqual(
      parseSqlStatements(`
        insert into source_runs(source_name, provenance)
        values ('weekly; leaflet', '{"note":"trusted; source"}');
        create table "prices;archive"(id text);
      `),
      [
        `insert into source_runs(source_name, provenance)
        values ('weekly; leaflet', '{"note":"trusted; source"}')`,
        'create table "prices;archive"(id text)'
      ]
    );
  });

  it('keeps dollar-quoted migration blocks intact', () => {
    assert.deepEqual(
      parseSqlStatements(`
        do $$
        begin
          raise notice 'seed; ready';
        end
        $$;
        create index latest_prices_observed_idx on latest_prices(observed_at);
      `),
      [
        `do $$
        begin
          raise notice 'seed; ready';
        end
        $$`,
        'create index latest_prices_observed_idx on latest_prices(observed_at)'
      ]
    );
  });
});

describe('migrationVersionFromPath', () => {
  it('derives the migration version from a SQL basename', () => {
    assert.equal(migrationVersionFromPath('infra/db/migrations/001_extensions.sql'), '001_extensions');
    assert.equal(migrationVersionFromPath('infra\\db\\migrations\\002_init.sql'), '002_init');
  });

  it('rejects non-SQL migration paths', () => {
    assert.throws(() => migrationVersionFromPath('infra/db/migrations/README.md'), /must end in \.sql/);
  });
});

describe('createMigrationPlan', () => {
  it('filters SQL files, sorts lexically by path, and preserves SQL contents', () => {
    const plan = createMigrationPlan([
      { path: 'infra/db/migrations/010_indexes.sql', sql: 'create index products_name_idx on products(name);' },
      { path: 'infra/db/migrations/README.md', sql: 'ignore me' },
      { path: 'infra/db/migrations/001_extensions.sql', sql: 'create extension if not exists postgis;' },
      { path: 'infra/db/migrations/002_init.sql', sql: 'create table chains(id uuid primary key);' }
    ]);

    assert.deepEqual(plan, [
      { version: '001_extensions', sql: 'create extension if not exists postgis;' },
      { version: '002_init', sql: 'create table chains(id uuid primary key);' },
      { version: '010_indexes', sql: 'create index products_name_idx on products(name);' }
    ]);
  });

  it('rejects duplicate derived migration versions', () => {
    assert.throws(
      () =>
        createMigrationPlan([
          { path: 'infra/db/migrations/001_init.sql', sql: 'create table chains(id uuid primary key);' },
          { path: 'db/migrations/001_init.sql', sql: 'create table stores(id uuid primary key);' }
        ]),
      /Duplicate migration version: 001_init/
    );
  });
});

describe('buildMigrationPlanStatus', () => {
  const plan = [
    { version: '001_groceryview_schema', sql: 'create table products(id uuid primary key);' },
    { version: '002_repository_support_schema', sql: 'create table app_users(id text primary key);' },
    { version: '003_subscription_entitlements', sql: 'create table subscription_entitlements(user_id text primary key);' }
  ];

  it('reports ready when every planned migration is applied exactly once', () => {
    assert.deepEqual(buildMigrationPlanStatus(plan, ['003_subscription_entitlements', '001_groceryview_schema', '002_repository_support_schema']), {
      status: 'ready',
      applied: ['001_groceryview_schema', '002_repository_support_schema', '003_subscription_entitlements'],
      pending: [],
      unknownApplied: [],
      duplicateApplied: [],
      summary: 'All planned migrations are applied.'
    });
  });

  it('reports pending migrations without treating unapplied planned versions as drift', () => {
    assert.deepEqual(buildMigrationPlanStatus(plan, ['001_groceryview_schema']), {
      status: 'pending',
      applied: ['001_groceryview_schema'],
      pending: ['002_repository_support_schema', '003_subscription_entitlements'],
      unknownApplied: [],
      duplicateApplied: [],
      summary: '2 migration(s) pending.'
    });
  });

  it('reports metadata drift for unknown or duplicate applied migrations', () => {
    assert.deepEqual(
      buildMigrationPlanStatus(plan, [
        '001_groceryview_schema',
        '001_groceryview_schema',
        '002_repository_support_schema',
        '999_manual_hotfix'
      ]),
      {
        status: 'drift',
        applied: ['001_groceryview_schema', '002_repository_support_schema'],
        pending: ['003_subscription_entitlements'],
        unknownApplied: ['999_manual_hotfix'],
        duplicateApplied: ['001_groceryview_schema'],
        summary: 'Migration metadata drift detected: 2 issue(s).'
      }
    );
  });
});

describe('applyMigrations', () => {
  it('applies pending migrations in version order and records them exactly once', async () => {
    const executor = new RecordingExecutor();
    executor.appliedVersions.add('001_initial_schema');

    await applyMigrations(executor, [
      { version: '002_seed_stockholm', sql: 'insert into chains(id, name) values (\'willys\', \'Willys\');' },
      { version: '001_initial_schema', sql: 'create table chains(id text primary key);' }
    ]);

    assert.deepEqual(executor.statements, ["insert into chains(id, name) values ('willys', 'Willys')"]);
    assert.deepEqual(await executor.getAppliedMigrationVersions(), ['001_initial_schema', '002_seed_stockholm']);
  });
});

describe('createPostgresMigrationExecutor', () => {
  it('bootstraps schema_migrations before reading and recording migration versions', async () => {
    const queryExecutor = new RecordingQueryExecutor();
    const executor = createPostgresMigrationExecutor(queryExecutor);

    assert.deepEqual(await executor.getAppliedMigrationVersions(), []);
    await executor.recordMigration('001_groceryview_schema');

    assert.match(queryExecutor.calls[0]!.sql, /create table if not exists schema_migrations/);
    assert.equal(queryExecutor.calls[0]!.sql, SCHEMA_MIGRATIONS_TABLE_SQL);
    assert.match(queryExecutor.calls[1]!.sql, /select version from schema_migrations/);
    assert.equal(queryExecutor.calls[2]!.sql, SCHEMA_MIGRATIONS_TABLE_SQL);
    assert.deepEqual(queryExecutor.calls[3], {
      sql: 'insert into schema_migrations(version) values ($1) on conflict (version) do nothing',
      params: ['001_groceryview_schema']
    });
  });

  it('runs pending migrations through the PostgreSQL query executor and records them', async () => {
    const queryExecutor = new RecordingQueryExecutor();
    const executor = createPostgresMigrationExecutor(queryExecutor);

    assert.deepEqual(
      await applyMigrations(executor, [{ version: '002_repository_support_schema', sql: 'create table app_users(id text primary key);' }]),
      ['002_repository_support_schema']
    );

    assert.equal(queryExecutor.calls.some((call) => call.sql === 'create table app_users(id text primary key)'), true);
    assert.equal(queryExecutor.versions.includes('002_repository_support_schema'), true);
  });
});
