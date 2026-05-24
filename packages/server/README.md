# `@groceryview/server`

Runtime HTTP server for GroceryView's Fetch API handlers, Node `http` adapter,
OpenAPI document, production runtime configuration, and operational readiness
probes.

## Key files

| File | Purpose |
| --- | --- |
| `src/index.ts` | Main implementation: request router, auth wiring, readiness probes, runtime config, Node server adapter, and public exports. |
| `src/__tests__/http.test.ts` | Broad HTTP contract coverage for public and authenticated routes. |
| `src/__tests__/auth-http.test.ts` | Authentication/session endpoint coverage. |
| `src/__tests__/openapi.test.ts` | Ensures `buildOpenApiDocument()` stays aligned with exposed routes and security schemes. |
| `src/__tests__/postgres-readiness.test.ts` | PostgreSQL readiness probe behavior. |
| `src/__tests__/notification-*.test.ts` | Notification metrics, webhook, and worker endpoint contracts. |
| `tsconfig.build.json` | Build config for the package. |
| `tsconfig.test.json` | Test emit config used before `node --test`. |

## Public exports

The package exports all runtime primitives from `src/index.ts`, including:

- HTTP/server entrypoints: `createHttpHandler`, `handleNodeHttpRequest`,
  `createNodeServer`, `createRuntimeHttpHandler`, `createRuntimeNodeServer`,
  `createRuntimeHttpService`, `startNodeServerFromEnv`, `isDirectServerEntrypoint`.
- OpenAPI helpers: `buildOpenApiDocument`, `OpenApiDocument`, `OpenApiOperation`,
  `OpenApiPathItem`, `OpenApiSecurityRequirement`.
- Runtime config/auth helpers: `loadRuntimeConfig`, `buildRuntimeAuthOptions`,
  `buildRuntimeRequestAuthOptions`, `buildRepositoryBackedAuthOptions`,
  `RuntimeConfig`, `RuntimeHandlerOptions`, `AuthOptions`, `RuntimePersistenceRepository`,
  `RuntimePgPoolFactory`, `ApiResponseCache`.
- Readiness/report helpers: `buildHealthReport`, `summarizePostgresReadinessForHttp`,
  `postgresReadinessTargetFromDatabaseUrl`, `buildScanUploadStorageReadinessReport`,
  `buildScanUploadCorsReadinessReport`, `buildScanUploadWriteReadinessReport`, and
  their related report types.
- Provider extension types: billing checkout/portal providers, auth assertion verifier,
  flyer offer providers, store flyer offer providers, and runtime Postgres pool types.

## Usage example

```ts
import { createRuntimeNodeServer } from '@groceryview/server';

const server = createRuntimeNodeServer(process.env);
const port = Number(process.env.PORT ?? '3000');

server.listen(port, () => {
  console.log(`GroceryView server listening on :${port}`);
});
```

For tests or adapters that already use the Fetch API, call `createHttpHandler()` or
`createRuntimeHttpHandler()` and pass `Request` objects directly.

## Postgres access

Production runtime configuration requires `DATABASE_URL`. `loadRuntimeConfig()` reads
it from the environment and fails closed in production when it is missing. Runtime
Postgres access is injected through `RuntimePgPoolFactory` and repository builders from
`@groceryview/db`:

- `createPostgresRepository` backs subscriptions, budgets, human review, privacy,
  notifications, and account deletion flows.
- `createPostgresCatalogReader` and catalog/readiness helpers back catalog coverage
  and source-run health endpoints.
- `createPgQueryExecutor` and `createPostgresSourceRecordReader` support operational
  source-run and ingestion health checks.

Important server endpoints that depend on Postgres or Postgres-backed providers include
`/api/readiness/postgres`, `/api/readiness/source-runs`, `/api/readiness/catalog-coverage`,
notification worker routes, billing entitlement persistence, and repository-backed
account/privacy flows.

## Migrations and database operations

Database schema ownership lives in `@groceryview/db`, Prisma, and the root operational
scripts rather than in this package. Server deploys should run migrations before routing
traffic to a new build.

Useful commands from the repository root:

```bash
npm run ops:apply-db-migrations
npm run ops:validate-db-cutover
npm run ops:check-daily-db-connectivity
```

Related files:

- `packages/db/src/index.ts` exposes migrator/readiness/repository helpers consumed here.
- `prisma/schema.prisma` is the Prisma schema used by database operations.
- `scripts/ops/apply-db-migrations.mjs` applies migrations in production-style ops flows.
- `scripts/ops/validate-db-cutover.mjs` and `scripts/ops/check-daily-db-connectivity.mjs`
  verify connectivity and cutover readiness.

## Jobs and workers

The server exposes HTTP-triggered operational worker surfaces rather than owning a
separate scheduler:

- `POST /api/workers/notifications/run` executes the notification worker runner provided
  through `RuntimeHandlerOptions.notificationWorkerRunner` or the runtime repository.
- Notification metrics are served from `GET /api/metrics/notifications` when protected
  by `NOTIFICATION_METRICS_TOKEN`.
- Source-run and catalog readiness endpoints provide CI/ops checks for daily ingestion
  jobs that are orchestrated outside this package.

Daily ingestion and connector job entrypoints live in `@groceryview/ingestion` and root
scripts such as `npm run ops:daily-connectors`.

## OCR and scan upload runtime

Receipt/barcode scan routes are wired through `@groceryview/scanning` providers:

- `POST /api/scans/upload-url` creates a private upload ticket through the configured
  `ScanUploadStorage` implementation.
- `POST /api/scans/process` runs barcode and receipt providers, then returns review work
  items without directly mutating catalog prices.
- Readiness endpoints cover provider health, upload-ticket creation, CORS preflight, and
  write checks: `/api/readiness/scanning`, `/api/readiness/scan-upload-storage`,
  `/api/readiness/scan-upload-cors`, and `/api/readiness/scan-upload-write`.

Production OCR configuration is validated by `loadRuntimeConfig()` using:

- `OCR_SPACE_API_KEY`
- `OCR_SPACE_HEALTHCHECK_IMAGE_URL`
- scan upload storage variables such as `SCAN_UPLOAD_MAX_BYTES`, plus any storage-specific
  provider configuration injected through `RuntimeHandlerOptions`.

## Development and validation

Build and test this package from the repository root:

```bash
npm run build -w @groceryview/server
npm run test -w @groceryview/server
```

This ticket intentionally did not run local tests; CI owns test execution for the PR.
