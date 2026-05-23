import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validateDatabaseCutover } from '../../scripts/ops/validate-db-cutover.mjs';

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('production DB cutover validation script', () => {
  it('is exposed as an operator command for replacement DATABASE_URL validation', () => {
    assert.equal(packageJson.scripts['ops:validate-db-cutover'], 'node scripts/ops/validate-db-cutover.mjs');
  });

  it('blocks when the replacement URL matches the current production URL', async () => {
    const url = 'postgres://postgres.dgsoqwanrkqgdichtgzl:super-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres';
    const result = await validateDatabaseCutover({ DATABASE_URL: url, REPLACEMENT_DATABASE_URL: url }, { generatedAt: '2026-05-23T09:30:00.000Z' });

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, ['replacement_database_url_matches_current_database_url']);
    assert.equal(JSON.stringify(result).includes('super-secret'), false);
  });

  it('blocks when the replacement DB cannot prove write connectivity', async () => {
    class FailingPool {
      async query() {
        throw new Error('the database system is not accepting connections');
      }
      async end() {}
    }

    const result = await validateDatabaseCutover(
      {
        REPLACEMENT_DATABASE_URL: 'postgres://postgres.abcdefghijklmnopqrst:replacement-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
      },
      { Pool: FailingPool, sleep: async () => {}, generatedAt: '2026-05-23T09:31:00.000Z' }
    );

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, ['replacement_database_not_writable', 'database_not_accepting_connections']);
    assert.equal(result.candidate.projectRef, 'abcdefghijklmnopqrst');
    assert.equal(JSON.stringify(result).includes('replacement-secret'), false);
  });

  it('reports ready only after write-mode and select connectivity pass for a distinct replacement DB', async () => {
    const queries = [];
    class ReadyPool {
      async query(sql) {
        queries.push(sql);
        return { rows: [{ ok: 1 }] };
      }
      async end() {}
    }

    const result = await validateDatabaseCutover(
      {
        DATABASE_URL: 'postgres://postgres.dgsoqwanrkqgdichtgzl:old-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
        REPLACEMENT_DATABASE_URL: 'postgres://postgres.abcdefghijklmnopqrst:new-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
      },
      { Pool: ReadyPool, sleep: async () => {}, generatedAt: '2026-05-23T09:32:00.000Z' }
    );

    assert.equal(result.status, 'ready');
    assert.deepEqual(result.blockers, []);
    assert.deepEqual(queries, ['set default_transaction_read_only=off', 'select 1 as ok']);
    assert.equal(result.candidate.projectRef, 'abcdefghijklmnopqrst');
    assert.match(result.nextActions.join('\n'), /ops:apply-db-migrations/);
    assert.match(result.nextActions.join('\n'), /Daily ingestion readiness/);
    assert.equal(JSON.stringify(result).includes('new-secret'), false);
    assert.equal(JSON.stringify(result).includes('old-secret'), false);
  });

  it('emits structured blocked evidence when no replacement database URL is configured', async () => {
    const result = await validateDatabaseCutover({}, { generatedAt: '2026-05-23T09:50:00.000Z' });

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, ['replacement_database_url_missing']);
    assert.match(result.nextActions.join('\n'), /REPLACEMENT_DATABASE_URL/);
    assert.match(result.nextActions.join('\n'), /Production DB cutover validation/);
  });
});
