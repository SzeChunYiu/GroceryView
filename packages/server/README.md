# @groceryview/server

Node HTTP runtime for GroceryView. The package adapts shared API, auth, database, notification, scanning, monetization, and core domain modules into a deployable service or an embeddable request handler for tests and tools.

## Key files

- `src/index.ts` — public package entrypoint, HTTP router, runtime config loader, OpenAPI generator, health/readiness handlers, Node server adapter, API handler wiring, and repository/provider interfaces.
- `src/lib/receiptOCR.ts` — receipt OCR spend-history helper used by scan and receipt upload flows.
- `src/__tests__/` and `__tests__/` — Node test coverage for HTTP routes, auth, runtime config, OpenAPI, notification webhooks/workers, human review, and readiness.
- `tsconfig.build.json` / `tsconfig.test.json` — build and test TypeScript project configs.

## Public exports

`src/index.ts` is exported as `@groceryview/server`. Important exports include:

- HTTP/server: `HttpHandler`, `createHttpHandler`, `handleNodeHttpRequest`, `createNodeServer`, `createRuntimeHttpHandler`, `createRuntimeNodeServer`, `startNodeServerFromEnv`.
- Runtime config: `RuntimeConfig`, `RuntimeHandlerOptions`, `RuntimeHttpService`, `loadRuntimeConfig`, `GROCERYVIEW_API_VERSION`, `GROCERYVIEW_OPENAPI_VERSION`.
- Auth/session: `AuthOptions`, `AuthProvider`, `AuthProviderAssertion`, `AuthSessionExchangeVerifier`, `VerifiedAuthProviderUser`.
- Persistence/Postgres: `RuntimePersistenceRepository`, `RuntimePgPool`, `RuntimePgPoolFactory`, Postgres readiness reports and source-run health types.
- OpenAPI/health: `OpenApiDocument`, `OpenApiOperation`, `OpenApiPathItem`, `OpenApiSecurityRequirement`, `buildOpenApiDocument`, `HealthReport`, `buildHealthReport`.
- Notifications/billing/scanning: webhook, metrics, worker, billing checkout/portal, scan provider readiness, and scan upload wiring types.

## Postgres access

Production runtime uses `DATABASE_URL` through the `pg`-compatible pool factory in `src/index.ts`. Postgres-backed handlers are wired to `@groceryview/db` helpers such as `createPostgresRepository`, `createPostgresCatalogReader`, `createPostgresSourceRecordReader`, `createPgQueryExecutor`, `checkPostgresIntegrationReadiness`, and `checkSourceRunHealth`.

Readiness endpoints validate database connectivity before dependent catalog, source-run, and scan upload features are treated as available. Tests can inject `RuntimePersistenceRepository`, `RuntimePgPoolFactory`, or individual provider functions to avoid real database access.

## API handlers

`createRuntimeHttpHandler` builds the production handler from runtime config, repositories, and providers. It covers auth/session exchange, account deletion and privacy, budget/category patches, basket import review, flyer offers, deals, watchlist price alerts, notification metrics/webhooks/workers, billing checkout and portal sessions, scan upload processing, OpenAPI, health, and readiness routes.

## Migrations

Schema migrations live outside this package in the repository Prisma/database workflow. This package does not run migrations itself; it assumes migrations have already been applied before production traffic reaches Postgres. Use the repository-level migration and DB readiness commands before starting the server.

## Jobs

Operational job endpoints and helpers include notification worker cycles, source-run health checks, catalog coverage reports, scan upload readiness, and account deletion/privacy planning. Long-running jobs should be invoked by the configured worker/scheduler with injected repositories rather than from request handlers that cannot tolerate retries.

## OCR and scanning

Scanning flows use `@groceryview/scanning` providers plus `src/lib/receiptOCR.ts`. The runtime can wire OCR.Space receipts, OpenFoodFacts barcode lookup, scan upload storage, CORS/write readiness, and review work item planning. If OCR or storage providers are missing, readiness reports should mark scan features unavailable rather than fabricating receipt data.

## Usage example

```ts
import { createRuntimeNodeServer, loadRuntimeConfig } from '@groceryview/server';

const runtimeConfig = loadRuntimeConfig(process.env);
const server = createRuntimeNodeServer({ runtimeConfig });

server.listen(runtimeConfig.port, () => {
  console.log(`GroceryView server listening on ${runtimeConfig.port}`);
});
```

## Local commands

Run from the repository root when CI/local capacity allows:

```sh
npm run build -w @groceryview/server
npm test -w @groceryview/server
```

To start a built server:

```sh
PORT=3000 node packages/server/dist/index.js
```
