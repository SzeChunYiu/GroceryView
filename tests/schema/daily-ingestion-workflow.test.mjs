import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/daily-ingestion.yml', import.meta.url), 'utf8');

describe('daily ingestion workflow', () => {
  it('runs on a daily schedule and fails closed on missing deployed ingestion evidence', () => {
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron:\s*['"]\d+\s+\d+\s+\*\s+\*\s+\*['"]/);
    assert.match(workflow, /workflow_dispatch:/);
    const timeoutMatch = workflow.match(/timeout-minutes:\s*(\d+)/);
    assert.ok(timeoutMatch, 'daily ingestion workflow must declare an explicit timeout');
    assert.ok(Number(timeoutMatch[1]) >= 90, 'daily ingestion must allow slow all-store first-run backfills to finish');
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
      'npm run --silent ops:catalog-coverage-targets',
      'npm run --silent ops:validate-production-env',
      'node packages/ingestion/dist/index.js',
      '/api/readiness/postgres',
      '/api/readiness/source-runs',
      '/api/readiness/catalog-coverage'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+').replaceAll('/', '\\/')));
    }

    assert.match(workflow, /npm run --silent ops:daily-connectors >\/tmp\/groceryview-daily-connectors\.json/);
    assert.match(workflow, /CATALOG_COVERAGE_TARGETS_JSON_FILE=\/tmp\/groceryview-catalog-targets\.json/);
    assert.match(workflow, /ops:catalog-coverage-targets\s+--\s+--from-current-connectors >\/tmp\/groceryview-catalog-targets\.json/);
    assert.match(workflow, /ops:validate-production-env\s+--\s+--scope\s+daily-ingestion/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE=\/tmp\/groceryview-daily-connectors\.json/);
    assert.match(workflow, /GROCERYVIEW_DAILY_MAX_CONCURRENCY:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_MAX_CONCURRENCY \|\| '2' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS \|\| '250' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS \|\| '1' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS \|\| '500' \}\}/);
    assert.doesNotMatch(workflow, /GROCERYVIEW_DAILY_CONNECTORS_JSON=\$\(npm run --silent ops:daily-connectors\)/);
    assert.doesNotMatch(workflow, /test -n "\$\{GROCERYVIEW_DAILY_CONNECTORS_JSON:-\}"/);
    assert.doesNotMatch(workflow, /missing production config: CATALOG_COVERAGE_TARGETS_JSON/);
    for (const requiredConfigName of [
      'AUTH_SECRET',
      'DATABASE_URL',
      'PUBLIC_WEB_URL',
      'NOTIFICATION_WEBHOOK_SECRET',
      'BILLING_WEBHOOK_SECRET',
      'METRICS_TOKEN',
      'GROCERYVIEW_SERVER_URL',
    ]) {
      assert.match(workflow, new RegExp(`missing production config: ${requiredConfigName}`));
    }
    assert.match(workflow, /connectorChainIds/);
    assert.match(workflow, /missingConnectorChains/);
    assert.match(workflow, /connectorStoreCoverageCount/);
    assert.match(workflow, /coverageStoreCount/);
    assert.doesNotMatch(workflow, /connectorCount !== 6/);
    assert.match(workflow, /body\.status !== 'succeeded'/);
    assert.match(workflow, /missingProductStorePairs/);
    assert.match(workflow, /requiredActions/);

    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(workflow, new RegExp(`source_run_missing_fresh_chain:${chain}`));
    }

    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
