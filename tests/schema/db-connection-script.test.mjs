import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPostgresPoolConfig,
  createIpv4Lookup,
  resolveDailyWriteDatabaseUrl,
  transformSupabasePoolerForDailyWrites
} from '../../scripts/ops/db-connection.mjs';

describe('daily DB connection helpers', () => {
  it('prefers direct and replacement URLs before the pooler DATABASE_URL', () => {
    assert.equal(
      resolveDailyWriteDatabaseUrl({
        DATABASE_URL: 'postgres://pooler:6543/postgres',
        DIRECT_DATABASE_URL: 'postgres://direct:5432/postgres',
        REPLACEMENT_DATABASE_URL: 'postgres://replacement:5432/postgres'
      }).source,
      'DIRECT_DATABASE_URL'
    );
    assert.equal(
      resolveDailyWriteDatabaseUrl({
        DATABASE_URL: 'postgres://pooler:6543/postgres',
        REPLACEMENT_DATABASE_URL: 'postgres://replacement:5432/postgres'
      }).source,
      'REPLACEMENT_DATABASE_URL'
    );
  });

  it('transforms Supabase transaction pooler URLs to session pooler writes', () => {
    assert.equal(
      transformSupabasePoolerForDailyWrites('postgres://postgres.ref:secret@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'),
      'postgres://postgres.ref:secret@aws-1-eu-north-1.pooler.supabase.com:5432/postgres'
    );
  });

  it('builds pg pool config with IPv4 lookup', () => {
    const config = buildPostgresPoolConfig('postgres://user:secret@db.example.test:5432/postgres');
    assert.equal(typeof config.lookup, 'function');
    assert.equal(config.max, 1);
  });
});
