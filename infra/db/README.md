# Database Migration Verification

Run the migration verifier from the repository root:

```sh
infra/db/scripts/verify-migrations.sh
```

The script starts a temporary `postgis/postgis:18-3.6` container, waits for PostgreSQL readiness, and applies every `*.sql` file in `infra/db/migrations` in lexical order with `psql -v ON_ERROR_STOP=1`.

Environment overrides:

- `POSTGIS_IMAGE`: container image, default `postgis/postgis:18-3.6`.
- `POSTGRES_DB`: database name, default `groceryview`.
- `POSTGRES_USER`: user name, default `groceryview`.
- `POSTGRES_PASSWORD`: password, default `groceryview`.
- `MIGRATIONS_DIR`: migration directory, default `infra/db/migrations`.

The verifier exits nonzero when Docker is missing, no migrations are present, PostgreSQL does not become ready, or any migration fails.
