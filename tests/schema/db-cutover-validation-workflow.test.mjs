import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/db-cutover-validation.yml', import.meta.url), 'utf8');

describe('production DB cutover validation workflow', () => {
  it('runs a manual fail-closed replacement DB validation with redacted evidence', () => {
    assert.match(workflow, /name:\s*Production DB cutover validation/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /concurrency:/);
    assert.match(workflow, /cancel-in-progress:\s*false/);
    assert.match(workflow, /timeout-minutes:\s*120/);

    for (const command of [
      'npm ci',
      'node --test tests/schema/db-cutover-validation-script.test.mjs',
      'npm run --silent ops:validate-db-cutover',
      'npm run --silent ops:apply-db-migrations',
      'npm run --silent ops:daily-connectors',
      'npm run --silent ops:catalog-coverage-targets',
      'node packages/ingestion/dist/index.js',
      'npm run --silent ingest:export-db-snapshot'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+').replaceAll('/', '\\/')));
    }

    assert.match(workflow, /DATABASE_URL:\s*\$\{\{ secrets\.DATABASE_URL \}\}/);
    assert.match(workflow, /REPLACEMENT_DATABASE_URL:\s*\$\{\{ secrets\.REPLACEMENT_DATABASE_URL \}\}/);
    assert.match(workflow, /CANDIDATE_DATABASE_URL:\s*\$\{\{ secrets\.CANDIDATE_DATABASE_URL \}\}/);
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DB_CONNECTIVITY_RETRY_ATTEMPTS/);
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS/);
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS/);
    assert.match(workflow, /\/tmp\/db-cutover-validation\.json/);
    assert.match(workflow, /db_cutover_validation_diagnostic_missing/);
    assert.match(workflow, /cutover_status=\$\?/);
    assert.match(workflow, /body\.status !== 'ready'/);
    assert.match(workflow, /name:\s*Upload DB cutover validation evidence\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-db-cutover-validation/);
    assert.match(workflow, /if-no-files-found:\s*error/);

    assert.match(workflow, /name:\s*Apply replacement DB migrations/);
    assert.match(workflow, /DATABASE_URL:\s*\$\{\{ secrets\.REPLACEMENT_DATABASE_URL \|\| secrets\.CANDIDATE_DATABASE_URL \}\}/);
    assert.match(workflow, /\/tmp\/replacement-db-migrations\.json/);
    assert.match(workflow, /replacement_db_migrations_diagnostic_missing/);
    assert.match(workflow, /name:\s*groceryview-replacement-db-migrations/);

    assert.match(workflow, /name:\s*Run replacement DB all-store ingestion validation/);
    assert.ok(
      workflow.indexOf('name: Apply replacement DB migrations') < workflow.indexOf('name: Run replacement DB all-store ingestion validation'),
      'replacement DB migrations must run before all-store ingestion validation'
    );
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DAILY_MAX_CONCURRENCY/);
    assert.match(workflow, /\/tmp\/replacement-daily-connectors\.json/);
    assert.match(workflow, /\/tmp\/replacement-catalog-targets\.json/);
    assert.match(workflow, /\/tmp\/replacement-daily-ingestion-result\.json/);
    assert.match(workflow, /replacement_daily_ingestion_missing_chain_summary/);
    assert.match(workflow, /replacement_daily_ingestion_chain_not_succeeded/);
    assert.match(workflow, /replacement_daily_ingestion_chain_without_observations/);
    assert.match(workflow, /name:\s*groceryview-replacement-db-ingestion/);
    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(workflow, new RegExp(`'${chain}'`));
    }

    assert.match(workflow, /name:\s*Export replacement DB-backed site snapshot/);
    assert.ok(
      workflow.indexOf('name: Run replacement DB all-store ingestion validation') < workflow.indexOf('name: Export replacement DB-backed site snapshot'),
      'replacement DB snapshot must run after all-store ingestion writes latest_prices'
    );
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_PATH:\s*\/tmp\/replacement-db-site-snapshot\.json/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS:\s*\$\{\{ vars\.GROCERYVIEW_CUTOVER_DB_SITE_SNAPSHOT_REQUIRED_CHAINS \|\| 'ica,willys,coop,hemkop,lidl,city_gross' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE:\s*\/tmp\/replacement-catalog-targets\.json/);
    assert.match(workflow, /replacement_db_site_snapshot_without_observations/);
    assert.match(workflow, /missingRequiredStoreExternalRefs/);
    assert.match(workflow, /missingRequiredStorePriceTypes/);
    assert.match(workflow, /name:\s*groceryview-replacement-db-site-snapshot/);
    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
