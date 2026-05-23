import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listLocalSmokeEnvOverrideNames, localSmokeEnvOverrides } from '../index.js';

const compose = readFileSync(new URL('../../../../infra/docker-compose.yml', import.meta.url), 'utf8');
const envExample = readFileSync(new URL('../../../../.env.example', import.meta.url), 'utf8');
const infraReadme = readFileSync(new URL('../../../../infra/README.md', import.meta.url), 'utf8');
const smokeScript = readFileSync(new URL('../../../../infra/scripts/smoke-local-services.sh', import.meta.url), 'utf8');
const hostedReadinessSmokeScript = readFileSync(new URL('../../../../infra/scripts/smoke-hosted-readiness.sh', import.meta.url), 'utf8');
const hostedHttpSmokeScript = readFileSync(new URL('../../../../infra/scripts/smoke-hosted-http.sh', import.meta.url), 'utf8');
const smokeRetailerConnectorScript = readFileSync(new URL('../../../../infra/scripts/smoke-retailer-connector.sh', import.meta.url), 'utf8');
const smokeOpenPricesScript = readFileSync(new URL('../../../../infra/scripts/smoke-open-prices.sh', import.meta.url), 'utf8');
const importOpenPricesArtifactScript = readFileSync(new URL('../../../../infra/scripts/import-open-prices-artifact.sh', import.meta.url), 'utf8');
const verifyMigrationsScript = readFileSync(new URL('../../../../infra/db/scripts/verify-migrations.sh', import.meta.url), 'utf8');
const smokeWorkflow = readFileSync(new URL('../../../../.github/workflows/local-infra-smoke.yml', import.meta.url), 'utf8');

describe('local infrastructure compose', () => {
  it('defines the required development backing services and ports', () => {
    assert.match(compose, /postgres:\n\s+image: postgis\/postgis:18-3\.6/);
    assert.match(compose, /redis:\n\s+image: redis:7-alpine/);
    assert.match(compose, /pgadmin:\n\s+image: dpage\/pgadmin4:latest/);
    assert.match(compose, /object-storage:\n\s+image: minio\/minio:latest/);
    assert.match(compose, /object-storage-init:\n\s+image: minio\/mc:latest/);
    assert.match(compose, /"5432:5432"/);
    assert.match(compose, /"6379:6379"/);
    assert.match(compose, /"5050:80"/);
    assert.match(compose, /"9000:9000"/);
    assert.match(compose, /postgres-data:\/var\/lib\/postgresql/);
    assert.doesNotMatch(compose, /postgres-data:\/var\/lib\/postgresql\/data/);
    assert.match(compose, /http:\/\/localhost:9000\/minio\/health\/live/);
  });

  it('documents connection URLs and S3-compatible object storage settings', () => {
    assert.match(envExample, /^DATABASE_URL=postgresql:\/\/groceryview:groceryview@localhost:5432\/groceryview$/m);
    assert.match(envExample, /^REDIS_URL=redis:\/\/localhost:6379$/m);
    assert.match(envExample, /^S3_ENDPOINT=http:\/\/localhost:9000$/m);
    assert.match(envExample, /^S3_BUCKET=groceryview-raw$/m);
    assert.match(envExample, /^S3_ACCESS_KEY_ID=groceryview$/m);
  });

  it('ships a smoke script for the local development stack', () => {
    assert.match(smokeScript, /docker compose -f "\$COMPOSE_FILE"/);
    assert.match(smokeScript, /compose up -d "\$POSTGRES_SERVICE" "\$REDIS_SERVICE" "\$OBJECT_STORAGE_SERVICE" "\$OBJECT_STORAGE_INIT_SERVICE"/);
    assert.match(smokeScript, /pg_isready -U "\$POSTGRES_USER" -d "\$POSTGRES_DB"/);
    assert.match(smokeScript, /redis-cli ping/);
    assert.match(smokeScript, /mc ls "local\/\$S3_BUCKET"/);
    assert.match(smokeScript, /print_service_diagnostics\(\)/);
    assert.match(smokeScript, /infra\/README\.md#smoke-troubleshooting/);
    assert.match(smokeScript, /docker inspect[\s\S]*health=/);
    assert.match(smokeScript, /compose logs --no-color --tail=120 "\$service"/);
    assert.match(smokeScript, /"\$POSTGRES_SERVICE" "\$REDIS_SERVICE" "\$OBJECT_STORAGE_SERVICE" "\$OBJECT_STORAGE_INIT_SERVICE"/);
    assert.match(smokeScript, /WAIT_SECONDS must be a positive integer/);
  });

  it('publishes every supported smoke environment override for operators', () => {
    assert.deepEqual(listLocalSmokeEnvOverrideNames(), [
      'COMPOSE_FILE',
      'POSTGRES_SERVICE',
      'REDIS_SERVICE',
      'OBJECT_STORAGE_SERVICE',
      'OBJECT_STORAGE_INIT_SERVICE',
      'POSTGRES_DB',
      'POSTGRES_USER',
      'S3_BUCKET',
      'WAIT_SECONDS'
    ]);

    for (const override of localSmokeEnvOverrides) {
      assert.match(smokeScript, new RegExp(`${override.name}="\\$\\{${override.name}:-`));
      assert.match(infraReadme, new RegExp(`\\| \`${override.name}\` \\|`));
      assert.ok(override.defaultValue.length > 0);
      assert.ok(override.purpose.length > 20);
    }
  });

  it('runs the local services smoke check in CI for infra changes', () => {
    assert.match(smokeWorkflow, /name: Local infrastructure smoke/);
    assert.match(smokeWorkflow, /pull_request:/);
    assert.match(smokeWorkflow, /infra\/scripts\/smoke-local-services\.sh/);
    assert.match(smokeWorkflow, /docker compose -f infra\/docker-compose\.yml down -v --remove-orphans/);
  });

  it('documents smoke troubleshooting fixes for common local failures', () => {
    assert.match(infraReadme, /## Smoke troubleshooting/);
    assert.match(infraReadme, /### Missing Docker/);
    assert.match(infraReadme, /docker compose version/);
    assert.match(infraReadme, /### PostgreSQL 18 volume mount/);
    assert.match(infraReadme, /\/var\/lib\/postgresql\/data/);
    assert.match(infraReadme, /docker compose -f infra\/docker-compose\.yml down -v/);
    assert.match(infraReadme, /### MinIO bucket initialization/);
    assert.match(infraReadme, /object-storage-init/);
    assert.match(infraReadme, /S3_BUCKET/);
    assert.match(infraReadme, /## Retailer connector smoke/);
    assert.match(infraReadme, /smoke-retailer-connector\.sh/);
    assert.match(infraReadme, /## Open Prices real-data smoke/);
    assert.match(infraReadme, /smoke-open-prices\.sh/);
    assert.match(infraReadme, /OPEN_PRICES_OUTPUT_PATH/);
    assert.match(infraReadme, /import-open-prices-artifact\.sh/);
    assert.match(infraReadme, /OPEN_PRICES_INPUT_PATH/);
    assert.match(infraReadme, /OPEN_PRICES_IMPORT_RESULT_PATH/);
    assert.match(infraReadme, /acceptedObservations/);
  });

  it('documents hosted deployment smoke commands for API, product terminal, web, PostgreSQL, and scan readiness evidence', () => {
    assert.match(infraReadme, /## Hosted deployment smoke/);
    assert.match(infraReadme, /infra\/scripts\/smoke-hosted-http\.sh/);
    assert.match(infraReadme, /infra\/scripts\/smoke-hosted-readiness\.sh/);
    assert.match(infraReadme, /GROCERYVIEW_SERVER_URL/);
    assert.match(infraReadme, /GROCERYVIEW_WEB_URL/);
    assert.match(infraReadme, /GROCERYVIEW_TERMINAL_PRODUCT_ID/);
    assert.match(infraReadme, /HOSTED_HTTP_SMOKE_OUTPUT_PATH/);
    assert.match(infraReadme, /HOSTED_READINESS_SMOKE_OUTPUT_PATH/);
    assert.match(infraReadme, /METRICS_TOKEN/);
    assert.match(infraReadme, /\/api\/health/);
    assert.match(infraReadme, /\/api\/products\/\$\{GROCERYVIEW_TERMINAL_PRODUCT_ID:-coffee\}\/terminal/);
    assert.match(infraReadme, /\/api\/readiness\/postgres/);
    assert.match(infraReadme, /\/api\/readiness\/scanning/);
  });

  it('ships a hosted readiness smoke script for deployment evidence', () => {
    assert.match(hostedReadinessSmokeScript, /GROCERYVIEW_SERVER_URL/);
    assert.match(hostedReadinessSmokeScript, /METRICS_TOKEN/);
    assert.match(hostedReadinessSmokeScript, /READINESS_TIMEOUT_SECONDS/);
    assert.match(hostedReadinessSmokeScript, /HOSTED_READINESS_SMOKE_OUTPUT_PATH/);
    assert.match(hostedReadinessSmokeScript, /\/api\/readiness\/postgres/);
    assert.match(hostedReadinessSmokeScript, /\/api\/readiness\/scanning/);
    assert.match(hostedReadinessSmokeScript, /x-groceryview-metrics-token: \$METRICS_TOKEN/);
    assert.match(hostedReadinessSmokeScript, /curl -fsS/);
    assert.match(hostedReadinessSmokeScript, /"status"\[\[:space:\]\]\*:\[\[:space:\]\]\*"\(ready\|complete\)"/);
    assert.match(hostedReadinessSmokeScript, /endpoint/);
    assert.match(hostedReadinessSmokeScript, /Hosted readiness smoke evidence written/);
  });

  it('ships a retailer connector smoke script gated by source access approvals', () => {
    assert.match(smokeRetailerConnectorScript, /GROCERYVIEW_CONNECTOR_URL/);
    assert.match(smokeRetailerConnectorScript, /GROCERYVIEW_CONNECTOR_CHAIN_ID/);
    assert.match(smokeRetailerConnectorScript, /GROCERYVIEW_CONNECTOR_LEGAL_REVIEW_STATUS/);
    assert.match(smokeRetailerConnectorScript, /GROCERYVIEW_CONNECTOR_HAS_DATA_AGREEMENT/);
    assert.match(smokeRetailerConnectorScript, /packages\/ingestion\/dist\/index\.js/);
    assert.match(smokeRetailerConnectorScript, /planRetailerConnectorRun/);
    assert.match(smokeRetailerConnectorScript, /fetchRetailerConnectorSnapshot/);
    assert.match(smokeRetailerConnectorScript, /Connector smoke blocked before fetch/);
    assert.match(smokeRetailerConnectorScript, /GROCERYVIEW_CONNECTOR_TIMEOUT_SECONDS must be a positive integer/);
    assert.match(smokeRetailerConnectorScript, /investigate_connector_http_status/);
  });

  it('ships an Open Prices real-data smoke script with custom User-Agent and parser validation', () => {
    assert.match(smokeOpenPricesScript, /OPEN_PRICES_USER_AGENT/);
    assert.match(smokeOpenPricesScript, /OPEN_PRICES_OUTPUT_PATH/);
    assert.match(smokeOpenPricesScript, /buildOpenPricesConnectorUrl/);
    assert.match(smokeOpenPricesScript, /parseOpenPricesSnapshot/);
    assert.match(smokeOpenPricesScript, /runRetailerConnector/);
    assert.match(smokeOpenPricesScript, /writeFile/);
    assert.match(smokeOpenPricesScript, /acceptedObservations/);
    assert.match(smokeOpenPricesScript, /Open Prices normalized artifact written/);
    assert.match(smokeOpenPricesScript, /currency: 'SEK'/);
    assert.match(smokeOpenPricesScript, /countryCode: process\.env\.OPEN_PRICES_COUNTRY_CODE \|\| 'SE'/);
    assert.match(smokeOpenPricesScript, /acceptedCount/);
    assert.match(smokeOpenPricesScript, /OPEN_PRICES_TIMEOUT_SECONDS must be a positive integer/);
    assert.match(smokeOpenPricesScript, /Open Prices smoke requires OPEN_PRICES_USER_AGENT/);
    assert.match(smokeOpenPricesScript, /Hosted Open Prices real-data smoke passed/);
  });

  it('ships an Open Prices artifact import script for PostgreSQL persistence', () => {
    assert.match(importOpenPricesArtifactScript, /OPEN_PRICES_INPUT_PATH/);
    assert.match(importOpenPricesArtifactScript, /DATABASE_URL/);
    assert.match(importOpenPricesArtifactScript, /OPEN_PRICES_IMPORT_DRY_RUN/);
    assert.match(importOpenPricesArtifactScript, /OPEN_PRICES_IMPORT_RESULT_PATH/);
    assert.match(importOpenPricesArtifactScript, /Open Prices import result artifact written/);
    assert.match(importOpenPricesArtifactScript, /status: 'dry_run'/);
    assert.match(importOpenPricesArtifactScript, /acceptedObservationCount/);
    assert.match(importOpenPricesArtifactScript, /writeFile/);
    assert.match(importOpenPricesArtifactScript, /packages\/db\/dist\/index\.js/);
    assert.match(importOpenPricesArtifactScript, /persistOpenPricesArtifact/);
    assert.match(importOpenPricesArtifactScript, /createPgQueryExecutor/);
    assert.match(importOpenPricesArtifactScript, /new Pool/);
    assert.match(importOpenPricesArtifactScript, /Open Prices artifact import requires OPEN_PRICES_INPUT_PATH/);
    assert.match(importOpenPricesArtifactScript, /OPEN_PRICES_INPUT_PATH to point to a readable artifact file/);
    assert.match(importOpenPricesArtifactScript, /Open Prices artifact import requires DATABASE_URL/);
  });

  it('verifies official API source runs and receipt constraints in migration smoke checks', () => {
    assert.match(verifyMigrationsScript, /POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD/);
    assert.match(verifyMigrationsScript, /\$required_name must not be empty/);
    assert.match(verifyMigrationsScript, /insert into source_runs\(source_type, source_name, status\)/);
    assert.match(verifyMigrationsScript, /values \('official_api', 'Open Prices verifier', 'succeeded'\)/);
    assert.match(verifyMigrationsScript, /unsupported_source/);
    assert.match(verifyMigrationsScript, /source_runs official_api source type ok/);
    assert.match(verifyMigrationsScript, /insert into receipt_uploads/);
    assert.match(verifyMigrationsScript, /receipt-verifier-upload/);
    assert.match(verifyMigrationsScript, /receipt_uploads status assertion failed/);
    assert.match(verifyMigrationsScript, /receipt_items quantity assertion failed/);
    assert.match(verifyMigrationsScript, /receipt upload constraints ok/);
  });

  it('ships a hosted HTTP smoke script for API health, product terminal, and optional web checks', () => {
    assert.match(hostedHttpSmokeScript, /GROCERYVIEW_SERVER_URL/);
    assert.match(hostedHttpSmokeScript, /GROCERYVIEW_WEB_URL/);
    assert.match(hostedHttpSmokeScript, /GROCERYVIEW_TERMINAL_PRODUCT_ID/);
    assert.match(hostedHttpSmokeScript, /HTTP_SMOKE_TIMEOUT_SECONDS/);
    assert.match(hostedHttpSmokeScript, /HOSTED_HTTP_SMOKE_OUTPUT_PATH/);
    assert.match(hostedHttpSmokeScript, /\/api\/health/);
    assert.match(hostedHttpSmokeScript, /\/api\/products\/\$\{GROCERYVIEW_TERMINAL_PRODUCT_ID\}\/terminal/);
    assert.match(hostedHttpSmokeScript, /curl -fsS/);
    assert.match(hostedHttpSmokeScript, /"status"\[\[:space:\]\]\*:\[\[:space:\]\]\*"ok"/);
    assert.match(hostedHttpSmokeScript, /"service"\[\[:space:\]\]\*:\[\[:space:\]\]\*"groceryview-server"/);
    assert.match(hostedHttpSmokeScript, /"productId"\[\[:space:\]\]\*:/);
    assert.match(hostedHttpSmokeScript, /"quote"\[\[:space:\]\]\*:/);
    assert.match(hostedHttpSmokeScript, /"distributions"\[\[:space:\]\]\*:/);
    assert.match(hostedHttpSmokeScript, /"chart"\[\[:space:\]\]\*:/);
    assert.match(hostedHttpSmokeScript, /Hosted product terminal smoke passed/);
    assert.match(hostedHttpSmokeScript, /apiHealthUrl/);
    assert.match(hostedHttpSmokeScript, /productTerminalUrl/);
    assert.match(hostedHttpSmokeScript, /Hosted HTTP smoke evidence written/);
  });
});
