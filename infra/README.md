# GroceryView local infrastructure

Use `infra/docker-compose.yml` for local API, worker, and schema development against real services.

## Core services

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis object-storage object-storage-init
```

This starts PostgreSQL/PostGIS 18 on `localhost:5432`, Redis 7 on `localhost:6379`, and MinIO S3-compatible object storage on `localhost:9000` with a `groceryview-raw` bucket. The server runtime reads the root `.env.example` `S3_*` settings plus `SCAN_UPLOAD_MAX_BYTES` to sign scanner upload tickets against that bucket.

Run the smoke check before API or worker development:

```bash
infra/scripts/smoke-local-services.sh
```

The script starts the core services, waits for healthy Postgres, Redis, and MinIO containers, verifies `pg_isready`, verifies `redis-cli ping`, and checks that the configured MinIO bucket exists.

GitHub Actions also runs this smoke check in `Local infrastructure smoke` for pull requests that change local infrastructure files.

## Retailer connector smoke

After a connector has approved legal/robots/data-agreement gates, build the ingestion package and run a real endpoint pull smoke without parsing or persisting product rows:

```bash
npm run build --workspace @groceryview/ingestion
GROCERYVIEW_CONNECTOR_URL="https://provider.example/api/products" GROCERYVIEW_CONNECTOR_CHAIN_ID="willys" GROCERYVIEW_CONNECTOR_SOURCE_TYPE="official_api" GROCERYVIEW_CONNECTOR_LEGAL_REVIEW_STATUS="approved" GROCERYVIEW_CONNECTOR_HAS_DATA_AGREEMENT="true" infra/scripts/smoke-retailer-connector.sh
```

The script reuses the ingestion connector gate, refuses to fetch when required approvals are missing, performs the HTTP pull with a timeout, and prints status code, byte count, content hash, and raw snapshot reference for follow-up parser work. Set `GROCERYVIEW_CONNECTOR_TIMEOUT_SECONDS` to a positive integer to adjust the fetch timeout for slow provider endpoints.

## Open Prices real-data smoke

Use Open Food Facts Open Prices as the first public, license-aware real price-data pull. Build the ingestion package, provide a custom User-Agent as requested by the Open Food Facts API rules, then run:

```bash
npm run build --workspace @groceryview/ingestion
OPEN_PRICES_USER_AGENT="GroceryView/0.1 (contact@example.com)" \
  infra/scripts/smoke-open-prices.sh
```

The smoke calls `https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10&location__osm_address_country_code=SE&order_by=-date` by default, parses returned SEK price rows into GroceryView ingestion records, requires at least one accepted product price, and prints source URL, content hash, raw snapshot reference, first normalized product, and Open Prices attribution. Override `OPEN_PRICES_COUNTRY_CODE`, `OPEN_PRICES_SIZE`, `OPEN_PRICES_TIMEOUT_SECONDS`, or `OPEN_PRICES_URL` for bounded follow-up pulls that still return SEK prices.

To save the normalized rows for inspection or handoff to a persistence job, set `OPEN_PRICES_OUTPUT_PATH`:

```bash
OPEN_PRICES_USER_AGENT="GroceryView/0.1 (contact@example.com)" \
OPEN_PRICES_OUTPUT_PATH=/tmp/groceryview-open-prices-preview.json \
  infra/scripts/smoke-open-prices.sh
```

The artifact includes the same provenance summary plus `acceptedObservations` with normalized products, aliases, price observations, and promotion observations. It intentionally excludes the raw response body; use `rawSnapshotRef` and `contentHash` to bind the artifact back to the pulled source snapshot.

To persist a saved, readable artifact into PostgreSQL, build the database package and run the import script with `DATABASE_URL` and `OPEN_PRICES_INPUT_PATH`:

```bash
npm run build --workspace @groceryview/db
DATABASE_URL=postgresql://groceryview:groceryview@localhost:5432/groceryview \
OPEN_PRICES_INPUT_PATH=/tmp/groceryview-open-prices-preview.json \
OPEN_PRICES_IMPORT_RESULT_PATH=/tmp/groceryview-open-prices-import-result.json \
  infra/scripts/import-open-prices-artifact.sh
```

The import script creates an `official_api` source run, upserts Open Prices chains/products/aliases, stores each accepted row as a raw price record without a raw response body, writes immutable observations, lets the database adapter roll them into `latest_prices`, and optionally writes the persisted result summary to `OPEN_PRICES_IMPORT_RESULT_PATH`.

To preflight the saved artifact before a database connection or built DB package is available, run the import script in dry-run mode:

```bash
OPEN_PRICES_IMPORT_DRY_RUN=true \
OPEN_PRICES_INPUT_PATH=/tmp/groceryview-open-prices-preview.json \
OPEN_PRICES_IMPORT_RESULT_PATH=/tmp/groceryview-open-prices-import-result.json \
  infra/scripts/import-open-prices-artifact.sh
```

The dry run validates that the artifact is readable JSON and prints or writes accepted observation, source URL, content hash, and raw snapshot reference evidence without opening PostgreSQL.

## Hosted deployment smoke

After deploying a server, run the hosted HTTP smoke before promoting traffic:

```bash
GROCERYVIEW_SERVER_URL=https://api.groceryview.example \
  infra/scripts/smoke-hosted-http.sh
```

The HTTP smoke calls `/api/health` and requires `status: ok` from the `groceryview-server` service. To include the deployed web surface in the same evidence run, set `GROCERYVIEW_WEB_URL`:

```bash
GROCERYVIEW_SERVER_URL=https://api.groceryview.example \
GROCERYVIEW_WEB_URL=https://groceryview.example \
  infra/scripts/smoke-hosted-http.sh
```

The same HTTP smoke also calls `/api/products/${GROCERYVIEW_TERMINAL_PRODUCT_ID:-coffee}/terminal` and requires product-terminal JSON with a matching `productId`, `ticker`, `quote`, `distributions`, and `chart`. Set `GROCERYVIEW_TERMINAL_PRODUCT_ID` when a deployment should prove a different seeded or backfilled product:

```bash
GROCERYVIEW_SERVER_URL=https://api.groceryview.example \
GROCERYVIEW_TERMINAL_PRODUCT_ID=coffee \
  infra/scripts/smoke-hosted-http.sh
```

Set `HOSTED_HTTP_SMOKE_OUTPUT_PATH` to save passed hosted HTTP smoke evidence as JSON for release records:

```bash
GROCERYVIEW_SERVER_URL=https://api.groceryview.example \
HOSTED_HTTP_SMOKE_OUTPUT_PATH=/tmp/groceryview-hosted-http-smoke.json \
  infra/scripts/smoke-hosted-http.sh
```

After the hosted database has migrations applied, scan providers are configured, and object storage credentials are populated, run the token-protected PostgreSQL plus scanner readiness smoke:

```bash
GROCERYVIEW_SERVER_URL=https://api.groceryview.example \
METRICS_TOKEN=replace-with-deployment-token \
  infra/scripts/smoke-hosted-readiness.sh
```

The readiness smoke calls `/api/readiness/postgres`, `/api/readiness/scanning`, `/api/readiness/scan-upload-cors`, `/api/readiness/scan-upload-storage`, and `/api/readiness/scan-upload-write` with `METRICS_TOKEN` and requires ready responses before the deployment can count as database-backed, scanner-provider, scan-upload-CORS, scan-upload-storage, and scan-upload-write smoke evidence.

Set `HOSTED_READINESS_SMOKE_OUTPUT_PATH` to save passed PostgreSQL, scan-provider, scan-upload-CORS, scan-upload-storage, and scan-upload-write readiness evidence as JSON for release records:

```bash
GROCERYVIEW_SERVER_URL=https://api.groceryview.example \
METRICS_TOKEN=replace-with-deployment-token \
HOSTED_READINESS_SMOKE_OUTPUT_PATH=/tmp/groceryview-hosted-readiness-smoke.json \
  infra/scripts/smoke-hosted-readiness.sh
```

## Smoke environment overrides

Use these variables when running the smoke script against a non-default compose file, renamed services, or slower local Docker runtime.

| Variable | Default | Purpose |
|---|---:|---|
| `COMPOSE_FILE` | `infra/docker-compose.yml` | Docker Compose file used for the local dependency stack. |
| `POSTGRES_SERVICE` | `postgres` | Compose service name for PostgreSQL/PostGIS readiness checks. |
| `REDIS_SERVICE` | `redis` | Compose service name for Redis readiness checks. |
| `OBJECT_STORAGE_SERVICE` | `object-storage` | Compose service name for MinIO health checks. |
| `OBJECT_STORAGE_INIT_SERVICE` | `object-storage-init` | Compose service name that creates and verifies the configured bucket. |
| `POSTGRES_DB` | `groceryview` | Database name used by the `pg_isready` probe. |
| `POSTGRES_USER` | `groceryview` | Database user used by the `pg_isready` probe. |
| `S3_BUCKET` | `groceryview-raw` | MinIO bucket that must exist before API or worker development. |
| `WAIT_SECONDS` | `90` | Maximum seconds to wait for health checks before printing diagnostics. |

## Smoke troubleshooting

The smoke script prints Docker inspect state and the last compose logs for Postgres, Redis, MinIO, and the bucket initialization service before it exits nonzero.

### Missing Docker

If the script prints `docker is required to smoke-test local services`, install Docker Engine or Docker Desktop and make sure the `docker` CLI is on `PATH`. Then verify access with:

```bash
docker compose version
```

### PostgreSQL 18 volume mount

PostgreSQL 18 images reject a bind or named volume mounted directly at `/var/lib/postgresql/data`. Keep the compose volume mounted at `/var/lib/postgresql`, as defined in this repo, and recreate the local service volume if an older layout is still present:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d postgres
```

### MinIO bucket initialization

If bucket verification fails, inspect the `object-storage-init` logs printed by the smoke script first. Confirm that `.env.example` or your shell environment still sets `S3_BUCKET`, `MINIO_ROOT_USER`, and `MINIO_ROOT_PASSWORD`, then rerun the initializer:

```bash
docker compose -f infra/docker-compose.yml run --rm object-storage-init
infra/scripts/smoke-local-services.sh
```

## Optional pgAdmin

```bash
docker compose -f infra/docker-compose.yml --profile admin up -d pgadmin
```

pgAdmin runs on `localhost:5050` and uses the credentials from the root `.env.example`.
