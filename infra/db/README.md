# Database Migration Verification

Run the migration verifier from the repository root:

```sh
infra/db/scripts/verify-migrations.sh
```

The script starts a temporary `postgis/postgis:18-3.6` container, waits for PostgreSQL readiness, and applies every `*.sql` file in `infra/db/migrations` in lexical order with `psql -v ON_ERROR_STOP=1`.

After migrations are applied, the verifier records each migration basename in `schema_migrations` and asserts that the catalog, provenance, app repository, review, and notification tables expected by the product schema exist in `public`.

When `infra/db/seeds/*.sql` exists, the script applies seed files after migrations and asserts the starter data surface:

- at least 6 chains,
- at least 6 stores with non-null `position`,
- at least 20 products.

Environment overrides:

- `POSTGIS_IMAGE`: container image, default `postgis/postgis:18-3.6`.
- `POSTGRES_DB`: database name, default `groceryview`.
- `POSTGRES_USER`: user name, default `groceryview`.
- `POSTGRES_PASSWORD`: password, default `groceryview`.
- `POSTGRES_READY_TIMEOUT_SECONDS`: PostgreSQL readiness wait in seconds, default `60`.
- `MIGRATIONS_DIR`: migration directory, default `infra/db/migrations`.
- `SEEDS_DIR`: seed directory, default `infra/db/seeds`.

The verifier exits nonzero when Docker is missing, no migrations are present, PostgreSQL does not become ready, any migration or seed fails, or seed count assertions fail.
`POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` must be nonempty so the temporary container and `psql` checks use explicit credentials.

## Runtime readiness smoke

After a hosted server is deployed with `DATABASE_URL` and `METRICS_TOKEN`, call the token-protected readiness route to prove the live runtime can read the required PostgreSQL schema and migration metadata without exposing the database URL:

```sh
curl -fsS \
  -H "x-groceryview-metrics-token: $METRICS_TOKEN" \
  "$GROCERYVIEW_SERVER_URL/api/readiness/postgres"
```

The route returns HTTP 200 only when the required tables and migration versions are present. It returns HTTP 503 with explicit blockers when migrations are missing or the readiness provider cannot run.
