import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { checkSupabaseProjectHealth } from '../../scripts/ops/check-supabase-project-health.mjs';

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('Supabase project health diagnostic script', () => {
  it('is exposed as an operator command for provider-level DB health triage', () => {
    assert.equal(packageJson.scripts['ops:check-supabase-health'], 'node scripts/ops/check-supabase-project-health.mjs');
  });

  it('reports ready only when project and required services are healthy', async () => {
    const urls = [];
    const result = await checkSupabaseProjectHealth(
      { SUPABASE_ACCESS_TOKEN: 'sbp_secret', SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst' },
      {
        fetchImpl: async (url, init) => {
          urls.push({ url: String(url), authorization: init.headers.authorization });
          if (String(url).endsWith('/projects/abcdefghijklmnopqrst')) {
            return jsonResponse({ name: 'groceryview-prod', status: 'ACTIVE_HEALTHY', region: 'eu-north-1' });
          }
          return jsonResponse([
            { name: 'db', healthy: true, status: 'ACTIVE_HEALTHY' },
            { name: 'db_postgres_user', healthy: true, status: 'ACTIVE_HEALTHY' },
            { name: 'pooler', healthy: true, status: 'ACTIVE_HEALTHY' },
            { name: 'rest', healthy: true, status: 'ACTIVE_HEALTHY' }
          ]);
        }
      }
    );

    assert.equal(result.status, 'ready');
    assert.equal(result.projectName, 'groceryview-prod');
    assert.deepEqual(result.services, ['db', 'db_postgres_user', 'pooler', 'rest']);
    assert.equal(urls.every((call) => call.authorization === 'Bearer sbp_secret'), true);
    assert.equal(JSON.stringify(result).includes('sbp_secret'), false);
  });

  it('fails closed with actionable service blockers for the current Supabase DB failure pattern', async () => {
    const result = await checkSupabaseProjectHealth(
      {
        SUPABASE_ACCESS_TOKEN: 'sbp_secret',
        SUPABASE_PROJECT_REF: 'dgsoqwanrkqgdichtgzl',
        SUPABASE_HEALTH_SERVICES: 'db,pooler,rest,db_postgres_user'
      },
      {
        fetchImpl: async (url) => {
          if (String(url).includes('/health')) {
            return jsonResponse([
              {
                name: 'db',
                healthy: false,
                status: 'UNHEALTHY',
                error: 'Failed to connect to database: FATAL: 57P03: the database system is not accepting connections DETAIL: Hot standby mode is disabled.'
              },
              { name: 'pooler', healthy: true, status: 'ACTIVE_HEALTHY' },
              { name: 'rest', healthy: false, status: 'UNHEALTHY', error: 'Failed to retrieve project rest service health' },
              {
                name: 'db_postgres_user',
                healthy: false,
                status: 'UNHEALTHY',
                error: 'Failed to connect to database: postgres://user:secret@db.example/postgres'
              }
            ]);
          }
          return jsonResponse({ name: 'groceryview-prod', status: 'ACTIVE_HEALTHY', region: 'eu-north-1' });
        }
      }
    );

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, [
      'supabase_service_unhealthy:db',
      'supabase_service_unhealthy:rest',
      'supabase_service_unhealthy:db_postgres_user'
    ]);
    assert.match(result.serviceHealth[0].error, /Hot standby mode is disabled/);
    assert.equal(JSON.stringify(result).includes('secret@'), false);
  });

  it('requires explicit Supabase management credentials and project ref', async () => {
    await assert.rejects(() => checkSupabaseProjectHealth({ SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst' }), /SUPABASE_ACCESS_TOKEN is required/);
    await assert.rejects(() => checkSupabaseProjectHealth({ SUPABASE_ACCESS_TOKEN: 'sbp_secret' }), /SUPABASE_PROJECT_REF is required/);
  });
});
