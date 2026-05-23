import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildSupabaseDirectConnectionString,
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
    assert.equal(calls.filter((call) => call.type === 'constructor').length, 3);
    assert.equal(calls.filter((call) => call.type === 'query' && call.sql === 'set default_transaction_read_only=off').length, 3);
    assert.equal(calls.filter((call) => call.type === 'end').length, 3);
    assert.equal(calls[0].config.connectionString.includes(':5432/'), true);
    assert.equal(result.alternateConnections[0].status, 'blocked');
  });


  it('derives a redacted direct Supabase host probe from pooler credentials', async () => {
    const poolerUrl = 'postgres://postgres.dgsoqwanrkqgdichtgzl:super-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=no-verify';
    const directUrl = buildSupabaseDirectConnectionString(poolerUrl);
    assert.equal(directUrl, 'postgres://postgres:super-secret@db.dgsoqwanrkqgdichtgzl.supabase.co:5432/postgres?sslmode=no-verify');

    const connections = [];
    class PoolerFailingDirectReadyPool {
      constructor(config) {
        this.connectionString = config.connectionString;
        connections.push(config.connectionString);
      }
      async query() {
        if (this.connectionString.includes('.pooler.supabase.com')) {
          throw new Error('the database system is not accepting connections');
        }
        return { rows: [{ ok: 1 }] };
      }
      async end() {}
    }

    const result = await checkDailyDatabaseConnectivity(
      {
        DATABASE_URL: poolerUrl,
        GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS: '1'
      },
      { Pool: PoolerFailingDirectReadyPool, sleep: async () => {} }
    );

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, ['database_not_accepting_connections']);
    assert.equal(result.alternateConnections.length, 1);
    assert.equal(result.alternateConnections[0].name, 'supabase_direct_host');
    assert.equal(result.alternateConnections[0].status, 'ready');
    assert.equal(result.alternateConnections[0].host, 'db.dgsoqwanrkqgdichtgzl.supabase.co');
    assert.match(result.alternateConnections[0].action, /Direct Supabase host accepts writes/);
    assert.equal(JSON.stringify(result).includes('super-secret'), false);
    assert.equal(connections.some((connection) => connection.includes('db.dgsoqwanrkqgdichtgzl.supabase.co:5432')), true);
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
    assert.equal(isTransientDailyDatabaseError(new Error('Failed to connect to database: {:error, :db_connection_closed_in_auth} 08006')), true);
    assert.equal(isTransientDailyDatabaseError(new Error('57P03: the database system is not accepting connections DETAIL: Hot standby mode is disabled.')), true);
  });

  it('classifies Supabase pooler auth-closed and hot-standby failures as actionable blockers', async () => {
    class AuthClosedPool {
      async query() {
        const error = new Error('Failed to connect to database: {:error, :db_connection_closed_in_auth} 08006');
        error.code = '08006';
        throw error;
      }

      async end() {}
    }

    const authClosed = await checkDailyDatabaseConnectivity(
      {
        DATABASE_URL: 'postgres://postgres.dgsoqwanrkqgdichtgzl:super-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
        GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS: '1'
      },
      { Pool: AuthClosedPool, sleep: async () => {} }
    );

    assert.equal(authClosed.status, 'blocked');
    assert.deepEqual(authClosed.blockers, ['supabase_pooler_auth_closed']);
    assert.equal(JSON.stringify(authClosed).includes('super-secret'), false);

    class HotStandbyPool {
      async query() {
        throw new Error('FATAL: 57P03: the database system is not accepting connections DETAIL: Hot standby mode is disabled.');
      }

      async end() {}
    }

    const hotStandby = await checkDailyDatabaseConnectivity(
      {
        DATABASE_URL: 'postgres://postgres.dgsoqwanrkqgdichtgzl:super-secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',
        GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS: '1'
      },
      { Pool: HotStandbyPool, sleep: async () => {} }
    );

    assert.equal(hotStandby.status, 'blocked');
    assert.deepEqual(hotStandby.blockers, ['database_not_accepting_connections']);
    assert.match(hotStandby.error, /Hot standby mode is disabled/);
  });
});
