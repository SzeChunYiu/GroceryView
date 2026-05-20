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

  it('keeps semicolons inside quoted strings', () => {
    assert.deepEqual(parseSqlStatements("insert into notes(body) values ('Deal ends at 18:00; confirm with store');\nselect 'it''s ok; really';"), [
      "insert into notes(body) values ('Deal ends at 18:00; confirm with store')",
      "select 'it''s ok; really'"
    ]);
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
