import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyMigrations, createMigrationPlan, migrationVersionFromPath, parseSqlStatements, type SqlExecutor } from '../index.js';

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
