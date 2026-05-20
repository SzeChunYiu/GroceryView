# GroceryView local infrastructure

Use `infra/docker-compose.yml` for local API, worker, and schema development against real services.

## Core services

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis object-storage object-storage-init
```

This starts PostgreSQL/PostGIS 18 on `localhost:5432`, Redis 7 on `localhost:6379`, and MinIO S3-compatible object storage on `localhost:9000` with a `groceryview-raw` bucket.

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

The script reuses the ingestion connector gate, refuses to fetch when required approvals are missing, performs the HTTP pull with a timeout, and prints status code, byte count, content hash, and raw snapshot reference for follow-up parser work.

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
