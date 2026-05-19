import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyMigrations, parseSqlStatements, type SqlExecutor } from '../index.js';

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
