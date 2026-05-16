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

## Worker-B update — SQL validation task

Date: 2026-05-16
Branch: `db-schema/initial-schema`
Role: Pane 3 / WORKER-B

### Task attempted

Manager handoff assigned WORKER-B to run the real Docker/Postgres SQL validation from `codex-tasks/db-schema-tasks.md` task 12:

```bash
docker compose -f infra/docker-compose.yml up -d postgres
for f in infra/db/migrations/*.sql infra/db/seeds/*.sql; do docker compose -f infra/docker-compose.yml exec -T postgres psql -U groceryview -d groceryview -v ON_ERROR_STOP=1 -f - < "$f"; done
docker compose -f infra/docker-compose.yml down
```

### Result

The real Docker/Postgres validation remains blocked on this host because Docker is not installed:

```text
$ docker compose -f infra/docker-compose.yml up -d postgres
/usr/bin/bash: line 4: docker: command not found
exit_status=127
```

Because the compose startup command cannot run, the migration/seed `psql` loop was not executed and should not be claimed as complete.

### Next task

Run task 12 on a machine with Docker Compose available, capture the exact migration/seed output, and then update this handoff. No schema SQL changes were made in this WORKER-B pass.

## Worker-B update — SQL validation via PostGIS container fallback

Date: 2026-05-16
Branch: `db-schema/initial-schema`
Role: Pane 3 / WORKER-B

### Required Docker Compose command result

The requested Docker Compose validation command still cannot run on this host because the `docker` CLI is not installed:

```text
$ docker compose -f infra/docker-compose.yml up -d postgres
/usr/bin/bash: line 4: docker: command not found
exit=127
```

### Fallback real PostgreSQL/PostGIS validation

To avoid relying only on parser validation, I pulled the same PostGIS image referenced by `infra/docker-compose.yml` with Apptainer (`docker://postgis/postgis:18-3.6`) and ran the migrations/seeds against a real PostgreSQL 18.4 + PostGIS database inside that container.

Validation output:

```text
$ apptainer exec postgis_18_3.6.sif PostgreSQL 18/PostGIS validation
initdb --auth=trust --username=groceryview
postgres -D /tmp/groceryview-pgdata4 -h 127.0.0.1 -p 55435 -k /tmp/groceryview-pgsocket4
127.0.0.1:55435 - accepting connections
psql -v ON_ERROR_STOP=1 -f infra/db/migrations/001_extensions.sql
CREATE EXTENSION
CREATE EXTENSION
CREATE EXTENSION
psql -v ON_ERROR_STOP=1 -f infra/db/migrations/002_init.sql
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
psql -v ON_ERROR_STOP=1 -f infra/db/migrations/003_indexes.sql
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
psql -v ON_ERROR_STOP=1 -f infra/db/seeds/001_stockholm_seed.sql
INSERT 0 1
INSERT 0 6
INSERT 0 20
smoke: extensions count (postgis, pg_trgm, btree_gist)
3
smoke: public table count
29
smoke: chain/product seed counts
6|20
```

### Status

- SQL migrations and seeds are validated against a real PostgreSQL 18.4/PostGIS database using the compose image via Apptainer.
- The literal Docker Compose task remains unavailable on this host until Docker is installed, but the database-level validation itself passed.

---

## Worker-C update — price observation partitioning

Date: 2026-05-16
Branch: `db-schema/pane4-partitions`
Role: Pane 4 / WORKER-C

### Task implemented

Implemented the partitioning option from `codex-tasks/db-schema-tasks.md` task 8 for the immutable price event table, separate from Pane 2 task 11 (`packages/db`) and Pane 3 task 12 (real Docker/Postgres validation).

### Changes made

- Updated `infra/db/migrations/002_init.sql` so `price_observations` is native PostgreSQL range-partitioned by `observed_at`.
- Changed `price_observations` primary key to `(id, observed_at)` because PostgreSQL requires partitioned-table unique/primary keys to include the partition key.
- Added initial monthly partitions:
  - `price_observations_2026_05`
  - `price_observations_2026_06`
  - `price_observations_2026_07`
  - `price_observations_2026_08`
  - `price_observations_default` for backfills/future rows until automated partition maintenance exists.
- Updated `latest_store_prices` to use a composite optional FK (`price_observation_id`, `price_observation_observed_at`) back to `price_observations(id, observed_at)`.
- Updated `infra/db/SCHEMA.md` to document the implemented partition layout, composite price-observation key, and ongoing partition maintenance requirement.

### Validation

The literal Docker Compose command still cannot run on this host because Docker is not installed, but the same PostGIS image from `infra/docker-compose.yml` was executed with Apptainer and validated against a real PostgreSQL 18/PostGIS database after the partitioning change. Fallback parser validation with `libpg-query` 17.7.3 also passed.

Real PostgreSQL/PostGIS validation output:

```text
$ apptainer exec docker://postgis/postgis:18-3.6 PostgreSQL 18/PostGIS validation
psql -v ON_ERROR_STOP=1 -f infra/db/migrations/001_extensions.sql
CREATE EXTENSION
CREATE EXTENSION
CREATE EXTENSION
psql -v ON_ERROR_STOP=1 -f infra/db/migrations/002_init.sql
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
psql -v ON_ERROR_STOP=1 -f infra/db/migrations/003_indexes.sql
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
psql -v ON_ERROR_STOP=1 -f infra/db/seeds/001_stockholm_seed.sql
INSERT 0 1
INSERT 0 6
INSERT 0 20
smoke: partitioned price_observations relkind
p
smoke: price observation partitions
5
smoke: table count
32
smoke: chain/product seed counts
6|20
```

Parser validation output:

```text
OK infra/db/migrations/001_extensions.sql
OK infra/db/migrations/002_init.sql
OK infra/db/migrations/003_indexes.sql
OK infra/db/seeds/001_stockholm_seed.sql
```

### Next task

- Add a future scheduled migration/job to create monthly `price_observations` partitions at least three months ahead and drain rows from `price_observations_default`.
