# Contributing to GroceryView

GroceryView is an npm-workspace monorepo for grocery price discovery,
comparison, ingestion, and operations tooling. It includes a Next.js web app
plus shared packages for catalog, ingestion, API, analytics, auth, database,
and related services.

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
workspaces. Treat the setup flow as the local-dev setup script for now: install
from the lockfile once, then start the workspace you are changing.

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

## Branching and commits

- Branch from the latest `main` and keep branches scoped to one ticket or small
  feature, for example `ticket-1234-connector-name` or
  `feature/search-history-persistence`.
- Keep commits small and written in the imperative mood, such as
  `Add Willys fixture parser` or `Document connector workflow`.
- Prefer a scoped prefix when it clarifies ownership: `docs:`, `web:`,
  `ingestion:`, `api:`, `db:`, or `test:`.
- Do not mix formatting churn, dependency updates, generated data, and feature
  code in the same commit unless the ticket explicitly requires it.

## Pull requests

Every PR should include:

- the ticket or issue being addressed;
- a short summary of user-facing and internal changes;
- tests or checks run, or a note explaining why CI-only validation is expected;
- screenshots for visual UI changes;
- migration, data, or ingestion backfill notes when schemas or persisted rows
  change.

Keep PRs reviewable. If a shared barrel such as `packages/*/src/index.ts` needs
an export, keep all existing exports during conflict resolution and avoid
unrelated reordering.

## Adding a connector

1. Add the connector under `packages/ingestion/src/connectors/` with explicit
   row types, source URLs, timestamps, currency, and provenance fields.
2. Parse recorded fixtures deterministically before adding live fetch logic.
   Prefer fixture-based tests in `packages/ingestion/src/connectors/__tests__/`.
3. Fail closed: skip incomplete rows, surface HTTP or parse failures with useful
   errors, and never invent prices or stock status not present in source data.
4. Register chain-wide catalog connectors in `all-store-runner.ts` only when the
   connector is safe for scheduled all-store execution.
5. Export public connector APIs from the ingestion package only when other
   workspaces need them.

## Adding a ranker

1. Put reusable ranking logic in the smallest shared package that owns the data,
   usually `packages/core` for generic scoring or `packages/analytics` for
   product intelligence.
2. Make the inputs explicit and deterministic: prices, units, freshness,
   confidence, and exclusions should be passed in rather than read globally.
3. Add focused tests for tie-breaking, missing evidence, stale data, and edge
   prices. Rankers must explain why a row won instead of returning only an id.
4. Keep no-evidence paths visible to callers. Do not estimate unavailable prices
   unless a product requirement explicitly allows it and labels it as estimated.

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

Keep changes scoped and small. Prefer workspace-specific commands while
iterating, then run the broader checks when a change touches shared packages or
contracts. Document new scripts, routes, schemas, or public package APIs near
the code that introduces them.
