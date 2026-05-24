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
    assert.match(workflow, /\/tmp\/production-config-preflight\.json/);
    assert.match(workflow, /production_config_preflight_missing/);
    assert.match(workflow, /production_config_preflight_status=\$\?/);
    assert.match(workflow, /production_config_preflight_diagnostic_missing/);
    assert.match(workflow, /name: Upload production config preflight evidence\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-production-config-preflight/);
    assert.match(workflow, /name: Preflight DB recovery and cutover unblockers/);
    assert.match(workflow, /ops:check-production-secrets\s+--\s+--from-env\s+--scope\s+db-recovery/);
    assert.match(workflow, /ops:check-production-secrets\s+--\s+--from-env\s+--scope\s+db-cutover/);
    assert.match(workflow, /\/tmp\/daily-db-unblocker-preflight\.json/);
    assert.match(workflow, /dbRecoveryStatus/);
    assert.match(workflow, /dbCutoverStatus/);
    assert.match(workflow, /db_recovery_secret_audit_diagnostic_missing/);
    assert.match(workflow, /db_cutover_secret_audit_diagnostic_missing/);
    assert.match(workflow, /name: Upload DB unblocker preflight evidence\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-db-unblocker-preflight/);

    for (const command of [
      'npm ci',
      'npm run test -w @groceryview/db',
      'npm run test -w @groceryview/ingestion',
      'npm run --silent ops:daily-connector-stores',
      'npm run --silent ops:daily-connectors',
      'npm run --silent ops:catalog-coverage-targets',
      'npm run --silent ops:validate-production-env',
      'npm run --silent ops:check-daily-db-connectivity',
      'npm run --silent ops:db-io-hotspots',
      'npm run --silent ops:apply-db-migrations',
      'node packages/ingestion/dist/index.js',
      '/api/readiness/postgres',
      '/api/readiness/source-runs',
      '/api/readiness/catalog-coverage',
      'npm run --silent ingest:export-db-snapshot',
      'actions/upload-artifact@v4'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+').replaceAll('/', '\\/')));
    }

    assert.match(workflow, /name: Export live store enumeration/);
    assert.ok(
      workflow.indexOf('name: Verify ingestion and DB contracts') < workflow.indexOf('name: Export live store enumeration'),
      'store enumeration must run after package tests and before production config validation'
    );
    assert.ok(
      workflow.indexOf('name: Export live store enumeration') < workflow.indexOf('name: Validate production ingestion configuration'),
      'store enumeration must prove branch metadata before connector and target validation'
    );
    assert.match(workflow, /npm run --silent ops:daily-connector-stores >\/tmp\/daily-connector-stores\.json/);
    assert.match(workflow, /store_enumeration_status=\$\?/);
    assert.match(workflow, /store_enumeration_diagnostic_missing/);
    assert.match(workflow, /body\.storesByChain\?\.\[chain\]/);
    assert.match(workflow, /store_enumeration_missing_chain/);
    assert.match(workflow, /store_enumeration_empty_chain/);
    assert.match(workflow, /name: Upload live store enumeration\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-daily-connector-stores/);
    assert.match(workflow, /path:\s*\/tmp\/daily-connector-stores\.json/);
    assert.match(workflow, /npm run --silent ops:daily-connectors >\/tmp\/groceryview-daily-connectors\.json/);
    assert.match(workflow, /daily_connectors_status=\$\?/);
    assert.match(workflow, /daily_connectors_diagnostic_missing/);
    assert.match(workflow, /CATALOG_COVERAGE_TARGETS_JSON_FILE=\/tmp\/groceryview-catalog-targets\.json/);
    assert.match(workflow, /ops:catalog-coverage-targets\s+--\s+--from-current-connectors >\/tmp\/groceryview-catalog-targets\.json/);
    assert.match(workflow, /catalog_targets_status=\$\?/);
    assert.match(workflow, /catalog_targets_diagnostic_missing/);
    assert.match(workflow, /ops:validate-production-env\s+--\s+--scope\s+daily-ingestion/);
    assert.match(workflow, /production_env_validation_status=\$\?/);
    assert.match(workflow, /production_env_validation_diagnostic_missing/);
    assert.match(workflow, /name: Check production DB write connectivity/);
    assert.ok(
      workflow.indexOf('name: Validate production ingestion configuration') < workflow.indexOf('name: Check production DB write connectivity'),
      'DB write connectivity diagnostics must run after env validation so DATABASE_URL exists'
    );
    assert.ok(
      workflow.indexOf('name: Check production DB write connectivity') < workflow.indexOf('name: Run configured daily ingestion'),
      'DB write connectivity diagnostics must fail before retailer fetches and DB persistence work'
    );
    assert.match(workflow, /\/tmp\/daily-db-connectivity\.json/);
    assert.match(workflow, /daily_db_connectivity_diagnostic_missing/);
    assert.match(workflow, /daily_db_connectivity_database_url_config_missing/);
    assert.match(workflow, /connectivity_status=\$\?/);
    assert.match(workflow, /body\.status !== 'ready'/);
    assert.match(workflow, /GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_ATTEMPTS \|\| '30' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS \|\| '10000' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS \|\| '30000' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_DB_DIRECT_PROBE_ATTEMPTS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_DB_DIRECT_PROBE_ATTEMPTS \|\| '1' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_DB_ALTERNATE_POOLER_PROBE_ATTEMPTS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_DB_ALTERNATE_POOLER_PROBE_ATTEMPTS \|\| '1' \}\}/);
    assert.match(workflow, /supabase_direct_host/);
    assert.match(workflow, /supabase_transaction_pooler/);
    assert.match(workflow, /alternateConnections/);
    assert.match(workflow, /name:\s*groceryview-daily-db-connectivity/);
    assert.match(workflow, /path:\s*\/tmp\/daily-db-connectivity\.json/);
    assert.match(workflow, /name: Upload daily DB connectivity diagnostic\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-daily-db-connectivity[\s\S]*if-no-files-found:\s*error/);
    assert.match(workflow, /name: Capture daily DB IO hotspots before ingestion/);
    assert.ok(
      workflow.indexOf('name: Upload daily DB connectivity diagnostic') < workflow.indexOf('name: Capture daily DB IO hotspots before ingestion'),
      'before-ingestion DB IO hotspots must run after the DB connectivity diagnostic artifact is attempted'
    );
    assert.ok(
      workflow.indexOf('name: Capture daily DB IO hotspots before ingestion') < workflow.indexOf('name: Run configured daily ingestion'),
      'before-ingestion DB IO hotspots must be captured before ingestion writes new rows'
    );
    assert.match(workflow, /\/tmp\/daily-db-io-hotspots-before\.json/);
    assert.match(workflow, /GROCERYVIEW_DB_IO_HOTSPOTS_LIMIT:\s*\$\{\{ vars\.GROCERYVIEW_DB_IO_HOTSPOTS_LIMIT \|\| '20' \}\}/);
    assert.match(workflow, /daily_db_io_hotspots_before_database_url_config_missing/);
    assert.match(workflow, /db_io_hotspots_before_status=\$\?/);
    assert.match(workflow, /daily_db_io_hotspots_before_diagnostic_missing/);
    assert.match(workflow, /name: Generate production DB recovery packet/);
    assert.match(workflow, /if:\s*failure\(\)/);
    assert.match(workflow, /SUPABASE_ACCESS_TOKEN:\s*\$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
    assert.match(workflow, /SUPABASE_PROJECT_REF:\s*\$\{\{ vars\.SUPABASE_PROJECT_REF \|\| secrets\.SUPABASE_PROJECT_REF \}\}/);
    assert.match(workflow, /npm run --silent ops:db-recovery-packet >\/tmp\/production-db-recovery-packet\.json/);
    assert.match(workflow, /production_db_recovery_packet_missing_credentials/);
    assert.match(workflow, /configure-replacement-db-cutover/);
    assert.match(workflow, /REPLACEMENT_DATABASE_URL or CANDIDATE_DATABASE_URL/);
    assert.match(workflow, /SUPABASE_ACCESS_TOKEN to a Supabase Management API personal access token beginning with sbp_/);
    assert.match(workflow, /npm run --silent ops:check-production-secrets -- --from-env --scope db-recovery/);
    assert.match(workflow, /npm run --silent ops:check-production-secrets -- --scope db-cutover/);
    assert.match(workflow, /production_db_recovery_packet_diagnostic_missing/);
    assert.match(workflow, /name: Upload production DB recovery packet\n\s+if:\s*failure\(\)/);
    assert.match(workflow, /name:\s*groceryview-production-db-recovery-packet/);
    assert.match(workflow, /path:\s*\/tmp\/production-db-recovery-packet\.json/);
    assert.match(workflow, /name: Apply production DB migrations/);
    assert.ok(
      workflow.indexOf('name: Check production DB write connectivity') < workflow.indexOf('name: Apply production DB migrations'),
      'DB migrations must only run after the write connectivity diagnostic proves the target database accepts writes'
    );
    assert.ok(
      workflow.indexOf('name: Apply production DB migrations') < workflow.indexOf('name: Run configured daily ingestion'),
      'daily ingestion must run only after the target database has the canonical schema'
    );
    assert.match(workflow, /\/tmp\/production-db-migrations\.json/);
    assert.match(workflow, /production_db_migrations_diagnostic_missing/);
    assert.match(workflow, /production_db_migrations_database_url_config_missing/);
    assert.match(workflow, /production_db_migrations_skipped_after_prior_failure/);
    assert.match(workflow, /migration_status=\$\?/);
    assert.match(workflow, /body\.status !== 'ready'/);
    assert.match(workflow, /name:\s*groceryview-production-db-migrations/);
    assert.match(workflow, /path:\s*\/tmp\/production-db-migrations\.json/);
    assert.match(workflow, /name: Upload production DB migrations result\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-production-db-migrations[\s\S]*if-no-files-found:\s*error/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE=\/tmp\/groceryview-daily-connectors\.json/);
    assert.match(workflow, /GROCERYVIEW_DAILY_MAX_CONCURRENCY:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_MAX_CONCURRENCY \|\| '2' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS \|\| '250' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS \|\| '1' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS \|\| '500' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_STORE_CONCURRENCY:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_STORE_CONCURRENCY \|\| '4' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_STORE_START_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_STORE_START_DELAY_MS \|\| '100' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_STORE_RETRY_ATTEMPTS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_STORE_RETRY_ATTEMPTS \|\| '1' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_STORE_RETRY_BASE_DELAY_MS:\s*\$\{\{ vars\.GROCERYVIEW_DAILY_STORE_RETRY_BASE_DELAY_MS \|\| '500' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DAILY_BLOCKER_LOG_PATH:\s*codex-tasks\/ingestion-blockers\.txt/);
    assert.match(workflow, /daily_ingestion_blocker_log_missing/);
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
      assert.match(workflow, new RegExp(`'${requiredConfigName}'`));
    }
    assert.match(workflow, /missing production config: '\s*\+\s*name/);
    assert.match(workflow, /connectorChainIds/);
    assert.match(workflow, /missingConnectorChains/);
    assert.match(workflow, /connectorStoreCoverageCount/);
    assert.match(workflow, /coverageStoreCount/);
    assert.match(workflow, /name: Upload production ingestion configuration\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-production-ingestion-config/);
    assert.match(workflow, /\/tmp\/production-env-validation\.json/);
    assert.match(workflow, /\/tmp\/groceryview-catalog-targets\.json/);
    assert.match(workflow, /\/tmp\/groceryview-daily-connectors\.json/);
    assert.doesNotMatch(workflow, /connectorCount !== 6/);
    assert.match(workflow, /daily_ingestion_connectors_status=\$\?/);
    assert.match(workflow, /daily_ingestion_connectors_diagnostic_missing/);
    assert.match(workflow, /daily_ingestion_database_url_config_missing/);
    assert.match(workflow, /daily_ingestion_result_diagnostic_missing/);
    assert.match(workflow, /daily_ingestion_skipped_after_prior_failure/);
    assert.match(workflow, /ingestion_status=\$\?/);
    assert.match(workflow, /body\.status !== 'succeeded'/);
    assert.match(workflow, /chainSummaries/);
    assert.match(workflow, /daily_ingestion_missing_chain_summary/);
    assert.match(workflow, /daily_ingestion_chain_not_succeeded/);
    assert.match(workflow, /daily_ingestion_chain_without_observations/);
    assert.match(workflow, /name: Upload daily ingestion result\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-daily-ingestion-result/);
    assert.match(workflow, /path:\s*\|\n\s+\/tmp\/daily-ingestion-result\.json\n\s+codex-tasks\/ingestion-blockers\.txt/);
    assert.match(workflow, /name: Capture daily DB IO hotspots after ingestion\n\s+if:\s*always\(\)/);
    assert.ok(
      workflow.indexOf('name: Upload daily ingestion result') < workflow.indexOf('name: Capture daily DB IO hotspots after ingestion'),
      'after-ingestion DB IO hotspots must run after ingestion result preservation and upload'
    );
    assert.ok(
      workflow.indexOf('name: Capture daily DB IO hotspots after ingestion') < workflow.indexOf('name: Export DB-backed site snapshot'),
      'after-ingestion DB IO hotspots must be captured before later readiness exports can obscure the ingestion delta'
    );
    assert.match(workflow, /\/tmp\/daily-db-io-hotspots-after\.json/);
    assert.match(workflow, /daily_db_io_hotspots_after_database_url_config_missing/);
    assert.match(workflow, /db_io_hotspots_after_status=\$\?/);
    assert.match(workflow, /daily_db_io_hotspots_after_diagnostic_missing/);
    assert.match(workflow, /name: Compare daily DB IO hotspots\n\s+if:\s*always\(\)/);
    assert.ok(
      workflow.indexOf('name: Capture daily DB IO hotspots after ingestion') < workflow.indexOf('name: Compare daily DB IO hotspots'),
      'DB IO hotspot delta must be produced after the after-ingestion capture'
    );
    assert.ok(
      workflow.indexOf('name: Compare daily DB IO hotspots') < workflow.indexOf('name: Upload daily DB IO hotspots'),
      'DB IO hotspot delta must be produced before the hotspot artifact upload'
    );
    assert.match(workflow, /npm run --silent ops:compare-db-io-hotspots --/);
    assert.match(workflow, /--before \/tmp\/daily-db-io-hotspots-before\.json/);
    assert.match(workflow, /--after \/tmp\/daily-db-io-hotspots-after\.json/);
    assert.match(workflow, /--out \/tmp\/daily-db-io-hotspots-delta\.json/);
    assert.match(workflow, /name: Upload daily DB IO hotspots\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-daily-db-io-hotspots/);
    assert.match(workflow, /path:\s*\|\n\s+\/tmp\/daily-db-io-hotspots-before\.json\n\s+\/tmp\/daily-db-io-hotspots-after\.json\n\s+\/tmp\/daily-db-io-hotspots-delta\.json/);
    assert.match(workflow, /name:\s*groceryview-daily-db-io-hotspots[\s\S]*if-no-files-found:\s*error/);
    assert.doesNotMatch(workflow, /hotspots\.length/);
    assert.match(workflow, /name: Export DB-backed site snapshot/);
    assert.ok(
      workflow.indexOf('name: Run configured daily ingestion') < workflow.indexOf('name: Export DB-backed site snapshot'),
      'DB-backed site snapshot export must run only after daily ingestion writes latest_prices'
    );
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_PATH:\s*\/tmp\/groceryview-db-site-snapshot\.json/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE:\s*\$\{\{ vars\.GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE \|\| '0\.5' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT:\s*\$\{\{ vars\.GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT \|\| '50000' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS:\s*\$\{\{ vars\.GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS \|\| '36' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS:\s*\$\{\{ vars\.GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS \|\| 'ica,willys,coop,hemkop,lidl,city_gross' \}\}/);
    assert.match(workflow, /GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE:\s*\/tmp\/groceryview-catalog-targets\.json/);
    assert.match(workflow, /db_site_snapshot_result_diagnostic_missing/);
    assert.match(workflow, /db_site_snapshot_database_url_config_missing/);
    assert.match(workflow, /db_site_snapshot_skipped_after_prior_failure/);
    assert.match(workflow, /snapshot_status=\$\?/);
    assert.match(workflow, /body\.status !== 'passed'/);
    assert.match(workflow, /body\.coverage\?\.observations < 1/);
    assert.match(workflow, /missingRequiredChains/);
    assert.match(workflow, /missingRequiredStoreExternalRefs/);
    assert.match(workflow, /missingRequiredProductSlugs/);
    assert.match(workflow, /missingRequiredStorePriceTypes/);
    assert.match(workflow, /missingRequiredCategorySlugs/);
    assert.match(workflow, /staleObservationCount/);
    assert.match(workflow, /name: Upload DB-backed site snapshot\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-db-site-snapshot/);
    assert.match(workflow, /path:\s*\|\n\s+\/tmp\/groceryview-db-site-snapshot\.json\n\s+\/tmp\/db-site-snapshot-result\.json/);
    assert.match(workflow, /missingProductStorePairs/);
    assert.match(workflow, /missingStorePriceTypes/);
    assert.match(workflow, /requiredActions/);
    assert.match(workflow, /coverage\?\.chains\?\.missing/);
    assert.match(workflow, /coverage\?\.stores\?\.missing/);
    assert.match(workflow, /coverage\?\.products\?\.missing/);
    assert.match(workflow, /coverage\?\.categories\?\.missing/);
    assert.match(workflow, /coverage\?\.priceTypes\?\.missing/);
    assert.match(workflow, /name: Check deployed PostgreSQL readiness\n\s+if:\s*always\(\)/);
    assert.match(workflow, /postgres_readiness_missing_ingestion_connectivity_diagnostic/);
    assert.match(workflow, /postgres_readiness_target_mismatch/);
    assert.match(workflow, /postgres_readiness_status=\$\?/);
    assert.match(workflow, /postgres_readiness_config_missing/);
    assert.match(workflow, /postgres_readiness_diagnostic_missing/);
    assert.match(workflow, /daily-db-connectivity\.json/);
    assert.match(workflow, /postgres-readiness\.json/);
    assert.match(workflow, /name: Check deployed daily source-run freshness\n\s+if:\s*always\(\)/);
    assert.match(workflow, /source_run_readiness_status=\$\?/);
    assert.match(workflow, /source_run_readiness_config_missing/);
    assert.match(workflow, /source_run_readiness_diagnostic_missing/);
    assert.match(workflow, /name: Check deployed catalog product-store coverage\n\s+if:\s*always\(\)/);
    assert.match(workflow, /catalog_coverage_readiness_status=\$\?/);
    assert.match(workflow, /catalog_coverage_readiness_config_missing/);
    assert.match(workflow, /catalog_coverage_readiness_diagnostic_missing/);
    assert.match(workflow, /name: Upload deployed readiness evidence\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-deployed-readiness/);
    assert.match(workflow, /\/tmp\/postgres-readiness\.json/);
    assert.match(workflow, /\/tmp\/source-run-readiness\.json/);
    assert.match(workflow, /\/tmp\/catalog-coverage-readiness\.json/);
    assert.match(workflow, /name:\s*groceryview-deployed-readiness[\s\S]*if-no-files-found:\s*error/);

    assert.match(workflow, /body\.summary\?\.blockers\?\.total/);
    assert.match(workflow, /body\.summary\?\.blockers\?\.missingFreshChains/);
    assert.match(workflow, /body\.summary\?\.blockers\?\.insufficientAcceptedRows/);
    assert.match(workflow, /body\.summary\?\.evidence\?\.succeeded/);
    assert.match(workflow, /body\.summary\?\.latestSuccessfulFinishedAt/);

    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(workflow, new RegExp(`source_run_missing_fresh_chain:${chain}`));
    }

    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
