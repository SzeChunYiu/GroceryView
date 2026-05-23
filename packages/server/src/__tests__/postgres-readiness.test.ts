import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SourceRunHealthCheckResult } from '@groceryview/db';
import { createHttpHandler, summarizePostgresReadinessForHttp } from '../index.js';

const readyDiagnostics = {
  blockers: { total: 0, missingTables: 0, missingMigrations: 0, repositoryChecks: 0 },
  evidence: { total: 2, tables: 1, migrations: 1, repositoryChecks: 0 }
};

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
      diagnostics: readyDiagnostics,
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
      diagnostics: {
        blockers: { total: 1, missingTables: 0, missingMigrations: 1, repositoryChecks: 0 },
        evidence: { total: 1, tables: 1, migrations: 0, repositoryChecks: 0 }
      },
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

  it('summarizes readiness blocker and evidence categories for HTTP clients', () => {
    assert.deepEqual(
      summarizePostgresReadinessForHttp({
        status: 'blocked',
        blockers: [
          'missing_table:latest_prices',
          'missing_migration:003_subscription_entitlements',
          'repository_check_fail:price_observation_pipeline_round_trip',
          'repository_check_not_run:notification_suppression_round_trip'
        ],
        evidence: ['table:app_users', 'migration:001_groceryview_schema', 'repository_check:user_budget_round_trip'],
        summary: 'PostgreSQL integration contract is blocked.'
      }),
      {
        blockers: { total: 4, missingTables: 1, missingMigrations: 1, repositoryChecks: 2 },
        evidence: { total: 3, tables: 1, migrations: 1, repositoryChecks: 1 }
      }
    );
  });
});

describe('source run readiness endpoint', () => {
  it('requires a metrics token before exposing source run health evidence', async () => {
    const healthy: SourceRunHealthCheckResult = {
      report: {
        status: 'healthy',
        blockers: [],
        evidence: ['source_run_succeeded:run-1'],
        runningRunIds: [],
        staleRunIds: [],
        latestSuccessfulRunId: 'run-1',
        latestSuccessfulFinishedAt: '2026-05-20T08:05:00.000Z'
      },
      summary: {
        status: 'healthy',
        blockers: {
          total: 0,
          failed: 0,
          partial: 0,
          stale: 0,
          stuckRunning: 0,
          missingFinishedAt: 0,
          startedInFuture: 0,
          finishedInFuture: 0,
          noFreshRuns: 0,
          missingFreshChains: 0,
          insufficientAcceptedRows: 0
        },
        evidence: { total: 1, succeeded: 1 },
        running: 0,
        stale: 0,
        latestSuccessfulRunId: 'run-1',
        latestSuccessfulFinishedAt: '2026-05-20T08:05:00.000Z'
      },
      runCount: 1,
      filter: { sourceType: 'retailer_api', limit: 100 }
    };
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      sourceRunHealthProvider: async () => healthy
    });

    const unauthorized = await handle(new Request('http://localhost/api/readiness/source-runs'));
    assert.equal(unauthorized.status, 401);

    const authorized = await handle(new Request('http://localhost/api/readiness/source-runs', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(authorized.status, 200);
    assert.deepEqual(await authorized.json(), healthy);
  });

  it('fails closed when source run health is blocked or not configured', async () => {
    const blockedHealth: SourceRunHealthCheckResult = {
      report: {
        status: 'blocked',
        blockers: ['source_run_failed:run-2'],
        evidence: [],
        runningRunIds: [],
        staleRunIds: []
      },
      summary: {
        status: 'blocked',
        blockers: {
          total: 1,
          failed: 1,
          partial: 0,
          stale: 0,
          stuckRunning: 0,
          missingFinishedAt: 0,
          startedInFuture: 0,
          finishedInFuture: 0,
          noFreshRuns: 0,
          missingFreshChains: 0,
          insufficientAcceptedRows: 0
        },
        evidence: { total: 0, succeeded: 0 },
        running: 0,
        stale: 0
      },
      runCount: 1,
      filter: { limit: 100 }
    };
    const blocked = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      sourceRunHealthProvider: async () => blockedHealth
    });
    const blockedResponse = await blocked(new Request('http://localhost/api/readiness/source-runs', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(blockedResponse.status, 503);
    assert.deepEqual(await blockedResponse.json(), blockedHealth);

    const missingToken = createHttpHandler(undefined, {
      sourceRunHealthProvider: async () => blockedHealth
    });
    assert.equal((await missingToken(new Request('http://localhost/api/readiness/source-runs'))).status, 503);

    const missingProvider = createHttpHandler(undefined, { notificationMetricsToken: 'metrics-token' });
    assert.equal((await missingProvider(new Request('http://localhost/api/readiness/source-runs', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }))).status, 503);
  });

  it('fails closed without leaking source errors when the health provider throws', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      async sourceRunHealthProvider() {
        throw new Error('source token=super-secret could not read source_runs');
      }
    });

    const response = await handle(new Request('http://localhost/api/readiness/source-runs', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(response.status, 503);
    const body = await response.json() as SourceRunHealthCheckResult;
    assert.deepEqual(body.report.blockers, ['source_run_health_probe_failed']);
    assert.equal(JSON.stringify(body).includes('super-secret'), false);
  });
});

describe('catalog coverage readiness endpoint', () => {
  const completeCoverage = {
    status: 'complete' as const,
    productCount: 2,
    coverage: {
      products: { covered: 2, target: 2, percent: 100, missing: [] },
      categories: { covered: 2, target: 2, percent: 100, missing: [] },
      chains: { covered: 2, target: 2, percent: 100, missing: [] },
      stores: { covered: 2, target: 2, percent: 100, missing: [] }
    },
    missingProductStorePairs: [],
    requiredActions: []
  };

  it('requires a metrics token before exposing catalog coverage evidence', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      catalogCoverageProvider: async () => completeCoverage
    });

    const unauthorized = await handle(new Request('http://localhost/api/readiness/catalog-coverage'));
    assert.equal(unauthorized.status, 401);

    const authorized = await handle(new Request('http://localhost/api/readiness/catalog-coverage', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(authorized.status, 200);
    assert.deepEqual(await authorized.json(), completeCoverage);
  });

  it('fails closed when catalog coverage is incomplete or not configured', async () => {
    const incompleteCoverage = {
      ...completeCoverage,
      status: 'incomplete' as const,
      missingProductStorePairs: [{ productId: 'milk', storeId: 'coop-odenplan' }],
      requiredActions: ['backfill_product_store_pairs:1']
    };
    const blocked = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      catalogCoverageProvider: async () => incompleteCoverage
    });
    const blockedResponse = await blocked(new Request('http://localhost/api/readiness/catalog-coverage', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(blockedResponse.status, 503);
    assert.deepEqual(await blockedResponse.json(), incompleteCoverage);

    const missingToken = createHttpHandler(undefined, {
      catalogCoverageProvider: async () => completeCoverage
    });
    assert.equal((await missingToken(new Request('http://localhost/api/readiness/catalog-coverage'))).status, 503);

    const missingProvider = createHttpHandler(undefined, { notificationMetricsToken: 'metrics-token' });
    assert.equal((await missingProvider(new Request('http://localhost/api/readiness/catalog-coverage', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }))).status, 503);
  });

  it('fails closed without leaking catalog coverage errors when the provider throws', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      async catalogCoverageProvider() {
        throw new Error('database password=super-secret could not read latest_prices');
      }
    });

    const response = await handle(new Request('http://localhost/api/readiness/catalog-coverage', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(response.status, 503);
    const body = await response.json() as { requiredActions: string[] };
    assert.deepEqual(body.requiredActions, ['catalog_coverage_probe_failed']);
    assert.equal(JSON.stringify(body).includes('super-secret'), false);
  });
});

describe('scan provider readiness endpoint', () => {
  const readyReport = {
    status: 'ready' as const,
    blockers: [],
    evidence: [
      'scan_provider_configured:barcode:openfoodfacts',
      'scan_provider_credentials_present:barcode',
      'scan_provider_health_pass:barcode',
      'scan_provider_configured:receiptOcr:ocrspace',
      'scan_provider_credentials_present:receiptOcr',
      'scan_provider_health_pass:receiptOcr'
    ],
    warnings: [],
    summary: 'Scan providers are ready.'
  };

  it('requires a metrics token before exposing scan provider readiness evidence', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      scanProviderReadinessProvider: async () => readyReport
    });

    const unauthorized = await handle(new Request('http://localhost/api/readiness/scanning'));
    assert.equal(unauthorized.status, 401);

    const authorized = await handle(new Request('http://localhost/api/readiness/scanning', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(authorized.status, 200);
    assert.deepEqual(await authorized.json(), readyReport);
  });

  it('fails closed when scan provider readiness is blocked or not configured', async () => {
    const blockedReport = {
      ...readyReport,
      status: 'blocked' as const,
      blockers: ['scan_provider_health_not_run:receiptOcr'],
      evidence: ['scan_provider_configured:receiptOcr:ocrspace'],
      summary: 'Scan provider readiness is blocked.'
    };
    const blocked = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      scanProviderReadinessProvider: async () => blockedReport
    });
    const blockedResponse = await blocked(new Request('http://localhost/api/readiness/scanning', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(blockedResponse.status, 503);
    assert.deepEqual(await blockedResponse.json(), blockedReport);

    const missingToken = createHttpHandler(undefined, {
      scanProviderReadinessProvider: async () => readyReport
    });
    assert.equal((await missingToken(new Request('http://localhost/api/readiness/scanning'))).status, 503);

    const missingProvider = createHttpHandler(undefined, { notificationMetricsToken: 'metrics-token' });
    assert.equal((await missingProvider(new Request('http://localhost/api/readiness/scanning', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }))).status, 503);
  });

  it('fails closed without leaking scan provider errors when the readiness provider throws', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      async scanProviderReadinessProvider() {
        throw new Error('ocr api key=super-secret failed');
      }
    });

    const response = await handle(new Request('http://localhost/api/readiness/scanning', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(response.status, 503);
    const body = await response.json() as { blockers: string[] };
    assert.deepEqual(body.blockers, ['scan_provider_readiness_probe_failed']);
    assert.equal(JSON.stringify(body).includes('super-secret'), false);
  });
});
