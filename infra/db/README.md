# Database Migration Verification

Run the migration verifier from the repository root:

```sh
infra/db/scripts/verify-migrations.sh
```

The script starts a temporary `postgis/postgis:18-3.6` container, waits for PostgreSQL readiness, and applies every `*.sql` file in `infra/db/migrations` in lexical order with `psql -v ON_ERROR_STOP=1`.

The `Release validation` GitHub Actions workflow runs the same verifier after build/typecheck, so migration and seed SQL are checked continuously before product PRs can merge.

When `infra/db/seeds/*.sql` exists, the script applies seed files after migrations and asserts the starter data surface:

- at least 6 chains,
- at least 6 stores with non-null `position`,
- at least 20 products.

Environment overrides:

- `POSTGIS_IMAGE`: container image, default `postgis/postgis:18-3.6`.
- `POSTGRES_DB`: database name, default `groceryview`.
- `POSTGRES_USER`: user name, default `groceryview`.
- `POSTGRES_PASSWORD`: password, default `groceryview`.
- `MIGRATIONS_DIR`: migration directory, default `infra/db/migrations`.
- `SEEDS_DIR`: seed directory, default `infra/db/seeds`.

The verifier exits nonzero when Docker is missing, no migrations are present, PostgreSQL does not become ready, any migration or seed fails, or seed count assertions fail.
