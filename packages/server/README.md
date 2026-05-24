# @groceryview/server

Node HTTP server package for GroceryView. It adapts the shared GroceryView API and domain packages into a runtime service that can be embedded by tests/tools or started as a Node server.

## Code layout

- `src/index.ts` is the package entrypoint and contains the HTTP handler, Node server adapter, runtime configuration loading, health reporting, OpenAPI document generation, and readiness helpers.
- `src/__tests__/` contains the package's Node test suite.
- Build output is written to `dist/`; test output is written to `dist-test/`.

## Local commands

Run commands from the repository root:

```sh
npm run build -w @groceryview/server
npm test -w @groceryview/server
```

To start the built Node server locally:

```sh
npm run build -w @groceryview/server
PORT=3000 node packages/server/dist/index.js
```

`NODE_ENV=production` requires the production environment variables validated by `loadRuntimeConfig`, including `AUTH_SECRET`, `DATABASE_URL`, `PUBLIC_WEB_URL`, notification, billing, scanning, and catalog/source-run readiness settings.

## Public API

The package exposes a single top-level module, `@groceryview/server`, from `src/index.ts`. Its main exports include:

- HTTP primitives: `HttpHandler`, `createHttpHandler`, `handleNodeHttpRequest`, `createNodeServer`.
- Runtime server helpers: `RuntimeConfig`, `RuntimeHandlerOptions`, `RuntimeHttpService`, `loadRuntimeConfig`, `createRuntimeHttpHandler`, `createRuntimeNodeServer`, `startNodeServerFromEnv`.
- Auth and persistence wiring types: `AuthOptions`, `AuthProvider`, `AuthSessionExchangeVerifier`, `RuntimePersistenceRepository`, `RuntimePgPool`, `RuntimePgPoolFactory`.
- OpenAPI generation: `OpenApiDocument`, `OpenApiOperation`, `OpenApiPathItem`, `OpenApiSecurityRequirement`, `buildOpenApiDocument`.
- Operational reports: `HealthReport`, `buildHealthReport`, PostgreSQL readiness helpers, and scan-upload readiness helpers.
