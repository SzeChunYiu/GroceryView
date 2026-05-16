# @groceryview/db

Shared database configuration helpers for GroceryView TypeScript services.

The backend API lane is using TypeORM with `pg`, so this package exposes:

- Zod validation for database environment variables.
- `createGroceryViewDataSourceOptions()` for safe PostgreSQL TypeORM options.
- Shared enum constants/types that mirror PostgreSQL enum values from the SQL schema,
  including moderation and receipt workflow statuses.

SQL migrations remain the source of truth under `infra/db/migrations/`. This package intentionally keeps TypeORM `synchronize: false` and does not define a duplicate application entity model; consuming services should pass their own minimal TypeORM entities into the helper.
