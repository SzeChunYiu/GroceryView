import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runbook = readFileSync(new URL('../../docs/ops/production-daily-ingestion-readiness.md', import.meta.url), 'utf8');

describe('production daily ingestion readiness runbook', () => {
  it('documents generated daily connectors instead of requiring a connector secret', () => {
    const requiredSecretsSection = runbook.slice(
      runbook.indexOf('## Required secrets'),
      runbook.indexOf('## Generate coverage targets from the live DB')
    );

    assert.doesNotMatch(requiredSecretsSection, /GROCERYVIEW_DAILY_CONNECTORS_JSON/);
    assert.match(runbook, /production_config_preflight_diagnostic_missing/);
    assert.match(runbook, /daily ingestion workflow generates `GROCERYVIEW_DAILY_CONNECTORS_JSON`/);
    assert.match(runbook, /npm run --silent ops:daily-connectors/);
    assert.match(runbook, /npm run --silent ops:daily-connectors > \/tmp\/groceryview-daily-connectors\.json/);
    assert.match(runbook, /GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE=\/tmp\/groceryview-daily-connectors\.json/);
    assert.doesNotMatch(runbook, /GROCERYVIEW_DAILY_CONNECTORS_JSON=\$\(npm run --silent ops:daily-connectors\)/);
    assert.doesNotMatch(runbook, /Use the emitted JSON as the `GROCERYVIEW_DAILY_CONNECTORS_JSON` secret\/value/);
  });
  it('documents bounded bulk daily ingestion runner controls', () => {
    for (const name of [
      'GROCERYVIEW_DAILY_MAX_CONNECTORS',
      'GROCERYVIEW_DAILY_MAX_CONCURRENCY',
      'GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS',
      'GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS',
      'GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS'
    ]) {
      assert.match(runbook, new RegExp(name));
    }
    assert.match(runbook, /bounded bulk/);
    assert.match(runbook, /all six required chains/);
  });

  it('documents source-run accepted-row thresholds for every required chain', () => {
    assert.match(runbook, /GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN/);
    assert.match(runbook, /source-run row thresholds/);
    assert.match(runbook, /positive integer threshold for all six required chains/);
    assert.match(runbook, /source_run_insufficient_accepted_rows/);
  });


  it('documents daily store enumeration evidence before connector validation', () => {
    assert.match(runbook, /npm run --silent ops:daily-connector-stores/);
    assert.match(runbook, /groceryview-daily-connector-stores/);
    assert.match(runbook, /store_enumeration_missing_chain/);
    assert.match(runbook, /store_enumeration_empty_chain/);
    assert.match(runbook, /before connector and target validation/);
  });

  it('documents production ingestion config evidence artifacts', () => {
    assert.match(runbook, /groceryview-production-ingestion-config/);
    assert.match(runbook, /production-env-validation\.json/);
    assert.match(runbook, /groceryview-catalog-targets\.json/);
    assert.match(runbook, /groceryview-daily-connectors\.json/);
  });


  it('documents daily ingestion chain summary evidence', () => {
    assert.match(runbook, /chainSummaries/);
    assert.match(runbook, /groceryview-daily-ingestion-result/);
    assert.match(runbook, /daily_ingestion_connectors_diagnostic_missing/);
    assert.match(runbook, /daily_ingestion_missing_chain_summary/);
    assert.match(runbook, /daily_ingestion_chain_not_succeeded/);
    assert.match(runbook, /daily_ingestion_chain_without_observations/);
    assert.match(runbook, /missing_configured_store_observations/);
    assert.match(runbook, /persistence_failed/);
    assert.match(runbook, /source run/);
    assert.match(runbook, /failed/);
  });

  it('documents deployed readiness evidence artifacts after daily ingestion', () => {
    assert.match(runbook, /groceryview-deployed-readiness/);
    assert.match(runbook, /postgres-readiness\.json/);
    assert.match(runbook, /source-run-readiness\.json/);
    assert.match(runbook, /catalog-coverage-readiness\.json/);
    assert.match(runbook, /postgres_readiness_config_missing/);
    assert.match(runbook, /postgres_readiness_diagnostic_missing/);
    assert.match(runbook, /source_run_readiness_config_missing/);
    assert.match(runbook, /source_run_readiness_diagnostic_missing/);
    assert.match(runbook, /catalog_coverage_readiness_config_missing/);
    assert.match(runbook, /catalog_coverage_readiness_diagnostic_missing/);
  });

  it('documents DB-to-site snapshot generation after daily ingestion writes latest_prices', () => {
    assert.match(runbook, /npm run --silent ingest:export-db-snapshot/);
    assert.match(runbook, /GROCERYVIEW_DB_SITE_SNAPSHOT_PATH=/);
    assert.match(runbook, /postgres\.latest_prices/);
    assert.match(runbook, /No latest price rows available/);
    assert.match(runbook, /daily ingestion workflow exports this snapshot/);
    assert.match(runbook, /groceryview-db-site-snapshot/);
    assert.match(runbook, /GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE/);
    assert.match(runbook, /GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT/);
    assert.match(runbook, /GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS/);
    assert.match(runbook, /GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS/);
    assert.match(runbook, /db_site_snapshot_missing_required_chains/);
    assert.match(runbook, /db_site_snapshot_missing_required_stores/);
    assert.match(runbook, /db_site_snapshot_missing_required_products/);
    assert.match(runbook, /db_site_snapshot_missing_required_store_price_types/);
    assert.match(runbook, /db_site_snapshot_missing_required_categories/);
    assert.match(runbook, /db_site_snapshot_stale_observations/);
    assert.match(runbook, /missingRequiredChains/);
    assert.match(runbook, /missingRequiredStoreExternalRefs/);
    assert.match(runbook, /missingRequiredProductSlugs/);
    assert.match(runbook, /missingRequiredStorePriceTypes/);
    assert.match(runbook, /missingRequiredCategorySlugs/);
    assert.match(runbook, /staleObservationCount/);
  });


  it('documents replacement DB cutover validation before production DATABASE_URL changes', () => {
    assert.match(runbook, /Replacement DB cutover validation/);
    assert.match(runbook, /db-cutover-validation\.yml/);
    assert.match(runbook, /REPLACEMENT_DATABASE_URL/);
    assert.match(runbook, /CANDIDATE_DATABASE_URL/);
    assert.match(runbook, /ops:validate-db-cutover/);
    assert.match(runbook, /ops:apply-db-migrations/);
    assert.match(runbook, /ingest:export-db-snapshot/);
    assert.match(runbook, /groceryview-replacement-db-migrations/);
    assert.match(runbook, /groceryview-replacement-db-ingestion/);
    assert.match(runbook, /groceryview-replacement-db-site-snapshot/);
    assert.match(runbook, /replacement_database_url_missing/);
    assert.match(runbook, /replacement_database_url_matches_current_database_url/);
    assert.match(runbook, /replacement_database_not_writable/);
    assert.match(runbook, /replacement_daily_ingestion_missing_chain_summary/);
    assert.match(runbook, /replacement_daily_ingestion_chain_without_observations/);
    assert.match(runbook, /replacement_db_site_snapshot_without_observations/);
    assert.match(runbook, /Only after this workflow passes/);
  });

});
