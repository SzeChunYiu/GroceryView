# @groceryview/db

Shared database package for GroceryView TypeScript services.

The backend API lane currently uses NestJS with TypeORM and `pg`, so this package exposes TypeORM `EntitySchema` definitions for the core API tables, a `createGroceryViewDataSourceOptions()` helper, and Zod validation for database environment variables.

SQL migrations remain the source of truth under `infra/db/migrations/`; this package must keep `synchronize: false`.
