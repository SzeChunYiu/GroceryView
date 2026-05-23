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


  it('documents daily store enumeration evidence before connector validation', () => {
    assert.match(runbook, /npm run --silent ops:daily-connector-stores/);
    assert.match(runbook, /groceryview-daily-connector-stores/);
    assert.match(runbook, /store_enumeration_missing_chain/);
    assert.match(runbook, /store_enumeration_empty_chain/);
    assert.match(runbook, /before connector and target validation/);
  });


  it('documents daily ingestion chain summary evidence', () => {
    assert.match(runbook, /chainSummaries/);
    assert.match(runbook, /groceryview-daily-ingestion-result/);
    assert.match(runbook, /daily_ingestion_missing_chain_summary/);
    assert.match(runbook, /daily_ingestion_chain_not_succeeded/);
    assert.match(runbook, /daily_ingestion_chain_without_observations/);
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
    assert.match(runbook, /GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS/);
    assert.match(runbook, /db_site_snapshot_missing_required_chains/);
    assert.match(runbook, /db_site_snapshot_missing_required_stores/);
    assert.match(runbook, /db_site_snapshot_missing_required_products/);
    assert.match(runbook, /db_site_snapshot_missing_required_store_price_types/);
    assert.match(runbook, /db_site_snapshot_missing_required_categories/);
    assert.match(runbook, /missingRequiredChains/);
    assert.match(runbook, /missingRequiredStoreExternalRefs/);
    assert.match(runbook, /missingRequiredProductSlugs/);
    assert.match(runbook, /missingRequiredStorePriceTypes/);
    assert.match(runbook, /missingRequiredCategorySlugs/);
  });

});
