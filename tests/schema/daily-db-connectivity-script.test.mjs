import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  checkDailyDatabaseConnectivity,
  classifyDatabaseUrl,
  isTransientDailyDatabaseError,
  redactDatabaseUrl
} from '../../scripts/ops/check-daily-db-connectivity.mjs';

const scriptSource = readFileSync(
  new URL('../../scripts/ops/check-daily-db-connectivity.mjs', import.meta.url),
  'utf8'
);

describe('daily DB connectivity diagnostic script', () => {
  it('classifies and redacts Supabase pooler URLs without leaking credentials', () => {
    const rawUrl = 'postgres://postgres.dgsoqwanrkqgdichtgzl:super-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres';

    assert.equal(
      redactDatabaseUrl(rawUrl),
      'postgres://postgres.dgsoqwanrkqgdichtgzl:***@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
    );
    assert.deepEqual(classifyDatabaseUrl(rawUrl), {
      host: 'aws-1-eu-north-1.pooler.supabase.com',
      port: 5432,
      originalPort: 6543,
      database: 'postgres',
      username: 'postgres.dgsoqwanrkqgdichtgzl',
      isSupabasePooler: true,
      poolerMode: 'session',
      transformedForDailyWrites: true,
      redactedUrl: 'postgres://postgres.dgsoqwanrkqgdichtgzl:***@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
    });
  });

  it('retries transient write-mode startup failures and returns sanitized blocker evidence', async () => {
    const calls = [];
    class FailingPool {
      constructor(config) {
        calls.push({ type: 'constructor', config });
      }

      async query(sql) {
        calls.push({ type: 'query', sql });
        throw new Error('the database system is not accepting connections');
      }

      async end() {
        calls.push({ type: 'end' });
      }
    }

    const result = await checkDailyDatabaseConnectivity(
      {
        DATABASE_URL: 'postgres://postgres.dgsoqwanrkqgdichtgzl:super-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
        GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS: '2',
        GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS: '0'
      },
      { Pool: FailingPool, sleep: async () => {} }
    );

    assert.equal(result.status, 'blocked');
    assert.equal(result.attempts, 2);
    assert.equal(result.host, 'aws-1-eu-north-1.pooler.supabase.com');
    assert.equal(result.port, 5432);
    assert.equal(result.originalPort, 6543);
    assert.equal(result.poolerMode, 'session');
    assert.equal(result.transformedForDailyWrites, true);
    assert.deepEqual(result.blockers, ['database_not_accepting_connections']);
    assert.equal(JSON.stringify(result).includes('super-secret'), false);
    assert.equal(calls.filter((call) => call.type === 'constructor').length, 2);
    assert.equal(calls.filter((call) => call.type === 'query' && call.sql === 'set default_transaction_read_only=off').length, 2);
    assert.equal(calls.filter((call) => call.type === 'end').length, 2);
    assert.equal(calls[0].config.connectionString.includes(':5432/'), true);
  });

  it('reports ready after proving write-mode and select connectivity', async () => {
    const queries = [];
    class ReadyPool {
      async query(sql) {
        queries.push(sql);
        return { rows: [{ ok: 1 }] };
      }

      async end() {}
    }

    const result = await checkDailyDatabaseConnectivity(
      {
        DATABASE_URL: 'postgres://user:password@db.example.test:5432/groceryview',
        GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS: '1'
      },
      { Pool: ReadyPool, sleep: async () => {} }
    );

    assert.equal(result.status, 'ready');
    assert.equal(result.attempts, 1);
    assert.deepEqual(queries, ['set default_transaction_read_only=off', 'select 1 as ok']);
    assert.equal(JSON.stringify(result).includes('password'), false);
  });

  it('uses a startup-sized retry window for database 57P03 recovery before failing closed', async () => {
    const sleeps = [];
    let attempts = 0;
    class RecoveringPool {
      async query(sql) {
        if (sql === 'set default_transaction_read_only=off') {
          attempts += 1;
          if (attempts < 3) {
            const error = new Error('the database system is not accepting connections');
            error.code = '57P03';
            throw error;
          }
        }
        return { rows: [{ ok: 1 }] };
      }

      async end() {}
    }

    const result = await checkDailyDatabaseConnectivity(
      {
        DATABASE_URL: 'postgres://user:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
      },
      { Pool: RecoveringPool, sleep: async (ms) => sleeps.push(ms) }
    );

    assert.equal(result.status, 'ready');
    assert.ok(result.retryAttempts >= 20, 'default retry attempts must cover slow Supabase startup/recovery windows');
    assert.deepEqual(sleeps, [10_000, 20_000]);
  });

  it('documents the production failure signatures currently blocking daily ingestion', () => {
    for (const signature of [
      'DATABASE_URL',
      'default_transaction_read_only=off',
      'database system is not accepting connections',
      'ECONNREFUSED',
      'econnrefused',
      'Connection terminated unexpectedly'
    ]) {
      assert.match(scriptSource, new RegExp(signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.equal(isTransientDailyDatabaseError(new Error('Failed to connect to database: {"error":"econnrefused"}')), true);
  });
});
