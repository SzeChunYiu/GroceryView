# Handoff — DB Schema lane

Date: 2026-05-16
Branch: `db-schema/initial-schema`

## Done this iteration

- Read lane context:
  - `docs/parallel-sessions/shared.md`
  - `docs/parallel-sessions/db-schema.md`
  - `GOAL.md`, `PROPOSAL.md`, `docs/tech-stack.md`, `docs/architecture.md`
  - `codex-tasks/db-schema-tasks.md`
- Checked repo state before editing and created branch `db-schema/initial-schema`.
- Created database directories:
  - `infra/db/migrations/`
  - `infra/db/seeds/`
  - `packages/db/src/` (empty placeholder; not committed unless package files are added later)
- Added local development compose file:
  - `infra/docker-compose.yml`
  - PostGIS PostgreSQL 18, Redis 7, optional pgAdmin profile, MinIO.
  - Comments instruct worker/API lanes to use this compose file for real local DB development.
- Added root `.env.example` with `DATABASE_URL`, `REDIS_URL`, pgAdmin, and S3/MinIO defaults.
- Added migrations:
  - `infra/db/migrations/001_extensions.sql`
  - `infra/db/migrations/002_init.sql`
  - `infra/db/migrations/003_indexes.sql`
- Added seed data:
  - `infra/db/seeds/001_stockholm_seed.sql`
  - Seeds Stockholm, ICA, Willys, Coop, Hemköp, Lidl, City Gross, and the 20 proposal hero products.
- Added schema documentation:
  - `infra/db/SCHEMA.md`
  - Documents all tables/columns, keys, price/provenance semantics, confidence labels, partition plan, and why travel time is not a Deal Score input.

## Schema decisions

- Price and promotion observations are immutable append-only event tables.
- Current and chart-oriented tables are modeled as read projections:
  - `latest_store_prices`
  - `price_series_daily`
  - `index_snapshots`
- Monetary values use `numeric(12,2)` for SEK prices.
- Unit prices are stored separately as `unit_price_sek` plus `unit_price_unit`.
- Store geography uses `stores.location geography(Point, 4326)` for PostGIS spatial filters.
- Provenance is explicit on observation/read-model rows: `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, `confidence_score`, and `confidence_band`.
- Travel time/distance is intentionally not a Deal Score ranking input for MVP; user-selected scopes should control the comparison set.

## Deferred work

- Native partitioning is documented but deferred. Next DB migration should convert or replace `price_observations` with monthly `observed_at` range partitions and recreate the required per-partition indexes.
- Materialized views/jobs for refreshing `latest_store_prices`, `price_series_daily`, and `index_snapshots` are deferred until API/worker contracts settle.
- `packages/db` ORM setup is deferred until the API lane chooses Drizzle/TypeORM integration details.

## Validation

Requested Docker validation command could not run in this environment because `docker` is not installed:

```text
$ docker compose -f infra/docker-compose.yml up -d postgres
/usr/bin/bash: line 1: docker: command not found
```

Fallback validation performed with the PostgreSQL parser exposed by `libpg-query` 17.7.3:

```text
OK infra/db/migrations/001_extensions.sql
OK infra/db/migrations/002_init.sql
OK infra/db/migrations/003_indexes.sql
OK infra/db/seeds/001_stockholm_seed.sql
```

Checklist spot checks:

```text
All 26 required tables found in 002_init.sql.
Required index patterns found in 003_indexes.sql.
Seed file contains 6 chains and 20 hero products.
```

## Next task

- Run the real Docker/Postgres validation on a host with Docker available:
  - `docker compose -f infra/docker-compose.yml up -d postgres`
  - `for f in infra/db/migrations/*.sql infra/db/seeds/*.sql; do docker compose -f infra/docker-compose.yml exec -T postgres psql -U groceryview -d groceryview -v ON_ERROR_STOP=1 -f - < "$f"; done`
  - `docker compose -f infra/docker-compose.yml down`
- If validation passes, continue with DB packaging/ORM integration once the API lane confirms its choice.
