import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/daily-ingestion.yml', import.meta.url), 'utf8');

describe('daily ingestion workflow', () => {
  it('runs on a daily schedule and fails closed on missing deployed ingestion evidence', () => {
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron:\s*['"]\d+\s+\d+\s+\*\s+\*\s+\*['"]/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /name: Preflight required production configuration/);
    assert.ok(
      workflow.indexOf('name: Preflight required production configuration') < workflow.indexOf('name: Install'),
      'production config preflight must run before npm install and connector generation'
    );

    for (const command of [
      'npm ci',
      'npm run test -w @groceryview/db',
      'npm run test -w @groceryview/ingestion',
      'npm run --silent ops:daily-connectors',
      'npm run --silent ops:validate-production-env',
      'node packages/ingestion/dist/index.js',
      '/api/readiness/postgres',
      '/api/readiness/source-runs',
      '/api/readiness/catalog-coverage'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+').replaceAll('/', '\\/')));
    }

    assert.match(workflow, /npm run --silent ops:daily-connectors >\/tmp\/groceryview-daily-connectors\.json/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE=\/tmp\/groceryview-daily-connectors\.json/);
    assert.doesNotMatch(workflow, /GROCERYVIEW_DAILY_CONNECTORS_JSON=\$\(npm run --silent ops:daily-connectors\)/);
    assert.doesNotMatch(workflow, /test -n "\$\{GROCERYVIEW_DAILY_CONNECTORS_JSON:-\}"/);
    for (const requiredConfigName of [
      'AUTH_SECRET',
      'DATABASE_URL',
      'PUBLIC_WEB_URL',
      'NOTIFICATION_WEBHOOK_SECRET',
      'BILLING_WEBHOOK_SECRET',
      'METRICS_TOKEN',
      'GROCERYVIEW_SERVER_URL',
      'CATALOG_COVERAGE_TARGETS_JSON'
    ]) {
      assert.match(workflow, new RegExp(`missing production config: ${requiredConfigName}`));
    }
    assert.match(workflow, /CATALOG_COVERAGE_TARGETS_JSON/);
    assert.match(workflow, /connectorStoreCoverageCount/);
    assert.match(workflow, /coverageStoreCount/);
    assert.match(workflow, /body\.status !== 'succeeded'/);
    assert.match(workflow, /missingProductStorePairs/);
    assert.match(workflow, /requiredActions/);

    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(workflow, new RegExp(`source_run_missing_fresh_chain:${chain}`));
    }

    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
