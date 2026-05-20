import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

describe('PostgreSQL readiness endpoint', () => {
  it('requires a metrics token before exposing PostgreSQL readiness evidence', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      postgresReadinessProvider: async () => ({
        status: 'ready',
        blockers: [],
        evidence: ['table:app_users', 'migration:001_groceryview_schema'],
        summary: 'PostgreSQL integration contract is ready.'
      })
    });

    const unauthorized = await handle(new Request('http://localhost/api/readiness/postgres'));
    assert.equal(unauthorized.status, 401);

    const authorized = await handle(new Request('http://localhost/api/readiness/postgres', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(authorized.status, 200);
    assert.deepEqual(await authorized.json(), {
      status: 'ready',
      blockers: [],
      evidence: ['table:app_users', 'migration:001_groceryview_schema'],
      summary: 'PostgreSQL integration contract is ready.'
    });
  });

  it('fails closed when PostgreSQL readiness is blocked or not configured', async () => {
    const blocked = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      postgresReadinessProvider: async () => ({
        status: 'blocked',
        blockers: ['missing_migration:003_subscription_entitlements'],
        evidence: ['table:app_users'],
        summary: 'PostgreSQL integration contract is blocked.'
      })
    });
    const blockedResponse = await blocked(new Request('http://localhost/api/readiness/postgres', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(blockedResponse.status, 503);
    assert.deepEqual(await blockedResponse.json(), {
      status: 'blocked',
      blockers: ['missing_migration:003_subscription_entitlements'],
      evidence: ['table:app_users'],
      summary: 'PostgreSQL integration contract is blocked.'
    });

    const missingToken = createHttpHandler(undefined, {
      postgresReadinessProvider: async () => ({
        status: 'ready',
        blockers: [],
        evidence: [],
        summary: 'PostgreSQL integration contract is ready.'
      })
    });
    assert.equal((await missingToken(new Request('http://localhost/api/readiness/postgres'))).status, 503);

    const missingProvider = createHttpHandler(undefined, { notificationMetricsToken: 'metrics-token' });
    assert.equal((await missingProvider(new Request('http://localhost/api/readiness/postgres', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }))).status, 503);
  });

  it('fails closed without leaking database errors when the readiness provider throws', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      async postgresReadinessProvider() {
        throw new Error('password=super-secret relation schema_migrations does not exist');
      }
    });

    const response = await handle(new Request('http://localhost/api/readiness/postgres', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(response.status, 503);
    const body = await response.json() as { blockers: string[]; summary: string };
    assert.deepEqual(body.blockers, ['postgres_readiness_probe_failed']);
    assert.equal(JSON.stringify(body).includes('super-secret'), false);
  });
});
