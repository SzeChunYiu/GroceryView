import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { createProductionDbRecoveryPacket } from '../../scripts/ops/print-production-db-recovery-packet.mjs';

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('production DB recovery packet script', () => {
  it('is exposed as an operator command for blocked production DB cutover evidence', () => {
    assert.equal(packageJson.scripts['ops:db-recovery-packet'], 'node scripts/ops/print-production-db-recovery-packet.mjs');
  });

  it('summarizes the current 57P03 Supabase DB blocker without leaking credentials', async () => {
    const calls = [];
    const packet = await createProductionDbRecoveryPacket(
      { SUPABASE_ACCESS_TOKEN: 'sbp_secret', SUPABASE_PROJECT_REF: 'dgsoqwanrkqgdichtgzl' },
      {
        generatedAt: '2026-05-23T09:20:00.000Z',
        fetchImpl: async (url, init) => {
          calls.push({ url: String(url), auth: init.headers.authorization });
          if (String(url).endsWith('/projects/dgsoqwanrkqgdichtgzl')) {
            return jsonResponse({ name: 'groceryview-prod', status: 'ACTIVE_HEALTHY', region: 'eu-north-1' });
          }
          if (String(url).includes('/health')) {
            return jsonResponse([
              { name: 'db', healthy: false, status: 'UNHEALTHY', error: 'FATAL: 57P03: the database system is not accepting connections DETAIL: Hot standby mode is disabled.' },
              { name: 'db_postgres_user', healthy: false, status: 'UNHEALTHY', error: 'postgresql://postgres:secret@db.example/postgres is not accepting connections' },
              { name: 'pooler', healthy: true, status: 'ACTIVE_HEALTHY' },
              { name: 'rest', healthy: false, status: 'UNHEALTHY', error: 'Failed to retrieve project rest service health' }
            ]);
          }
          return jsonResponse({ message: 'Failed to run sql query: FATAL: 57P03: the database system is not accepting connections' }, 500);
        }
      }
    );

    assert.equal(packet.status, 'blocked');
    assert.deepEqual(packet.blockers, [
      'supabase_service_unhealthy:db',
      'supabase_service_unhealthy:db_postgres_user',
      'supabase_service_unhealthy:rest',
      'supabase_management_sql_unavailable'
    ]);
    assert.equal(packet.projectName, 'groceryview-prod');
    assert.equal(packet.evidence.managementSqlProbe.status, 'blocked');
    assert.match(packet.completionGate, /Do not run production migrations/);
    assert.deepEqual(packet.recommendedActions.map((action) => action.id), ['supabase-platform-recovery', 'replacement-db-cutover']);
    assert.equal(calls.every((call) => call.auth === 'Bearer sbp_secret'), true);
    assert.equal(JSON.stringify(packet).includes('secret@'), false);
    assert.equal(JSON.stringify(packet).includes('sbp_secret'), false);
  });

  it('reports ready only when health and management SQL probe are both healthy', async () => {
    const packet = await createProductionDbRecoveryPacket(
      { SUPABASE_ACCESS_TOKEN: 'sbp_secret', SUPABASE_PROJECT_REF: 'healthyref' },
      {
        generatedAt: '2026-05-23T09:21:00.000Z',
        fetchImpl: async (url) => {
          if (String(url).endsWith('/projects/healthyref')) {
            return jsonResponse({ name: 'groceryview-prod', status: 'ACTIVE_HEALTHY', region: 'eu-north-1' });
          }
          if (String(url).includes('/health')) {
            return jsonResponse([
              { name: 'db', healthy: true, status: 'ACTIVE_HEALTHY' },
              { name: 'db_postgres_user', healthy: true, status: 'ACTIVE_HEALTHY' },
              { name: 'pooler', healthy: true, status: 'ACTIVE_HEALTHY' },
              { name: 'rest', healthy: true, status: 'ACTIVE_HEALTHY' }
            ]);
          }
          return jsonResponse([{ groceryview_recovery_probe: '2026-05-23T09:21:00Z' }]);
        }
      }
    );

    assert.equal(packet.status, 'ready');
    assert.deepEqual(packet.blockers, []);
    assert.deepEqual(packet.recommendedActions.map((action) => action.id), ['rerun-daily-ingestion-readiness']);
  });

  it('requires explicit Supabase management credentials and project ref', async () => {
    await assert.rejects(() => createProductionDbRecoveryPacket({ SUPABASE_PROJECT_REF: 'ref' }), /SUPABASE_ACCESS_TOKEN is required/);
    await assert.rejects(() => createProductionDbRecoveryPacket({ SUPABASE_ACCESS_TOKEN: 'sbp_secret' }), /SUPABASE_PROJECT_REF is required/);
  });
});
