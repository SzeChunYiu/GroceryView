# Contributing to GroceryView

GroceryView is an npm-workspace monorepo for grocery price discovery, comparison,
ingestion, and operations tooling. It includes a Next.js web app plus shared
packages for catalog, ingestion, API, analytics, auth, database, and related
services.

## Where the code lives

- `apps/web`: Next.js web UI (`@groceryview/web`). Route handlers, pages, and UI
  live under `apps/web/src/app`, `apps/web/src/components`, `apps/web/src/hooks`,
  `apps/web/src/lib`, and `apps/web/src/types`.
- `apps/api`, `apps/jobs`, and `apps/mobile`: service, job, and mobile app
  workspaces.
- `packages/*`: shared public workspaces used by the apps.
- `scripts/`, `workers/`, `db/`, `prisma/`, `infra/`, and `deploy/`: ingestion,
  operations, schema, infrastructure, and deployment support.
- `tests/`: repository-level tests that are not owned by a single workspace.

## Local setup and commands

Use npm; the repository is configured with `package-lock.json` and npm
workspaces.

```sh
npm install
npm run dev -w @groceryview/web
```

Useful checks before opening a pull request:

```sh
npm run test
npm run typecheck
npm run build
```

For the web app only:

```sh
npm run test -w @groceryview/web
npm run build -w @groceryview/web
```

## Public top-level modules

The root workspace exposes these top-level app and package modules:

- Apps: `@groceryview/web`, `@groceryview/jobs`, and `@groceryview/mobile`.
- Shared packages: `@groceryview/analytics`, `@groceryview/api`,
  `@groceryview/api-contracts`, `@groceryview/auth`, `@groceryview/catalog`,
  `@groceryview/core`, `@groceryview/db`, `@groceryview/geo`,
  `@groceryview/image-cache`, `@groceryview/ingestion`,
  `@groceryview/monetization`, `@groceryview/notifications`,
  `@groceryview/ops`, `@groceryview/scanning`, and `@groceryview/server`.

## Contribution notes

Keep changes scoped and small. Prefer workspace-specific commands while iterating,
then run the broader checks when a change touches shared packages or contracts.
Document new scripts, routes, schemas, or public package APIs near the code that
introduces them.
