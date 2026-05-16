# Handoff — backend-api lane

Updated: 2026-05-16 23:18 Europe/Stockholm
Pane: PANE 2 / WORKER-A
Branch: `backend-api/openapi-config`
PR: https://github.com/SzeChunYiu/GroceryView/pull/10

## Task taken
- Re-read `docs/parallel-sessions/shared.md` and `docs/parallel-sessions/backend-api.md`.
- Checked local repo state before editing: main shared worktree was on `data-worker/dagster-scaffold` with unrelated dirty/untracked files, so I used a clean git worktree at `/tmp/gv-backend-api-worker-a-openapi`.
- `codex-tasks/backend-api-tasks.md` is still absent from the active backend branches/main; I inspected the checklist from `origin/ceo/roadmap-phase1` and implemented the first not-yet-covered API configuration slice after the existing scaffold/database work: required API packages, Zod env validation, global validation, Swagger docs, CORS defaults, and checklist-conformant health response.

## What changed
- Added API dependencies: `@nestjs/swagger`, `swagger-ui-express`, `zod`, `@nestjs/terminus`, and `@types/swagger-ui-express`.
- Replaced the old class-validator env file with `apps/api/src/config/env.schema.ts` using Zod for `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`, and existing DB toggles.
- Updated `main.ts` to enable:
  - global `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`,
  - CORS from `CORS_ORIGINS` with default `http://localhost:3000`,
  - Swagger/OpenAPI UI at `/docs` titled `GroceryView API`, version `0.1.0`.
- Updated `.env.example` to default API port `3001`, include `REDIS_URL` and `CORS_ORIGINS`, and use the GroceryView local PostgreSQL URL.
- Updated `GET /health` and e2e expectation to return `{ "status": "ok", "service": "api" }` per the checklist.

## Verification
Commands run from `/tmp/gv-backend-api-worker-a-openapi/apps/api` with Node 24.15.0 on PATH and `COREPACK_HOME=/tmp/scyiu-corepack`:
- `corepack pnpm@10.21.0 add @nestjs/swagger swagger-ui-express zod @nestjs/terminus`
- `corepack pnpm@10.21.0 add -D @types/swagger-ui-express`
- `corepack pnpm@10.21.0 install --frozen-lockfile` — passed.
- `corepack pnpm@10.21.0 build` — passed.
- `corepack pnpm@10.21.0 test:e2e` — passed, 1 suite / 1 test.
- Smoke after build with `PORT=3109 DATABASE_ENABLED=false node dist/main.js`:
  - `curl http://127.0.0.1:3109/health` returned HTTP 200 and `{ "status": "ok", "service": "api" }`.
  - `curl http://127.0.0.1:3109/docs` returned HTTP 200.

## Next task
- Implement domain controllers and typed placeholder responses for products, stores, prices, watchlists, baskets, and alerts, then introduce `packages/api-contracts` Zod schemas if the checklist remains authoritative.

## Blockers / notes
- `codex-tasks/backend-api-tasks.md` remains absent on `main`, `backend-api/nestjs-scaffold`, and `backend-api/database-connection`; only `origin/ceo/roadmap-phase1` currently contains that checklist.
- This branch is based on `origin/backend-api/database-connection`, so its PR to `main` will be stacked on existing backend scaffold/database commits until earlier backend PRs merge.

---

## Worker update — 2026-05-17 00:29 Europe/Stockholm
Pane: PANE 5 / WORKER-D
Branch: `backend-api/products-crud`
Base branch used: `origin/backend-api/openapi-config`

### Task taken
- Re-read `docs/parallel-sessions/shared.md` and `docs/parallel-sessions/backend-api.md` from the shared worktree.
- Avoided the existing backend work from panes 2-4:
  - `backend-api/nestjs-scaffold` / PR #6: NestJS scaffold and health baseline.
  - `backend-api/database-connection` / PR #7: TypeORM database scaffold and entities.
  - `backend-api/openapi-config` / PR #10: env validation, CORS, Swagger/OpenAPI, and health response.
- Implemented the next distinct unchecked API checklist slice: domain controllers and typed seed/demo placeholder responses for products, stores, prices, watchlists, baskets, and alerts.

### What changed
- Added controllers and wired modules for:
  - Products: `GET /products`, `GET /products/:slug`.
  - Stores: `GET /stores`, `GET /stores/:slug`.
  - Prices: `GET /products/:slug/prices`, `GET /products/:slug/series`.
  - Watchlists: `GET /me/watchlist`, `POST /me/watchlist`.
  - Baskets: `GET /me/weekly-basket`, `POST /me/weekly-basket/items`.
  - Alerts: `GET /me/alerts`.
- Placeholder responses are explicit seed/demo data and use TypeScript DTO/response classes for typed controller return values.
- Expanded e2e coverage for all new placeholder routes while keeping `/health` coverage.

### Verification
Commands run from `/tmp/groceryview-pane5-repo/apps/api` with Node `v24.15.0`, `COREPACK_HOME=/tmp/scyiu-corepack`, and pnpm `10.21.0`:
- `corepack pnpm@10.21.0 install --frozen-lockfile` — passed.
- `corepack pnpm@10.21.0 exec prettier --write "src/**/*.ts" "test/**/*.ts"` — passed.
- `corepack pnpm@10.21.0 lint` — passed.
- `corepack pnpm@10.21.0 build` — passed.
- `corepack pnpm@10.21.0 test:e2e` — passed (`Test Suites: 1 passed`, `Tests: 3 passed`).
- Smoke after build with `PORT=3115 DATABASE_ENABLED=false node dist/main.js`:
  - `curl http://127.0.0.1:3115/health` returned HTTP 200 and `{ "status": "ok", "service": "api" }`.
  - `curl http://127.0.0.1:3115/products` returned HTTP 200 with demo product JSON.

### Next task
- Create `packages/api-contracts` and export shared Zod schemas for product/store/price/deal/watchlist/basket/alert contracts, then wire API controllers to those contracts.

### Blockers / notes
- `codex-tasks/backend-api-tasks.md` is still absent from `main`; the checklist remains discoverable only from `origin/ceo/roadmap-phase1`.
- This PR is stacked on the existing backend OpenAPI branch until earlier backend PRs merge to `main`.

---

## Worker-D update — 2026-05-17 00:48 Europe/Stockholm
Pane: PANE 5 / WORKER-D
Branch: `backend-api/products-crud`
PR: https://github.com/SzeChunYiu/GroceryView/pull/13

### Task taken
- Re-read `docs/parallel-sessions/shared.md` and `docs/parallel-sessions/backend-api.md` from the shared worktree.
- Audited open backend PRs and found panes 2-4 already covered scaffold/database/OpenAPI and Worker-C already opened domain placeholder controllers.
- Added the next distinct unchecked backend API checklist slice for Worker-D: shared API contracts package (`packages/api-contracts`) exporting Zod schemas.

### What changed
- Created `packages/api-contracts` with package name `@groceryview/api-contracts`.
- Exported Zod schemas and inferred TypeScript types for:
  - `ProductSummarySchema`
  - `StoreSummarySchema`
  - `PriceObservationSchema`
  - `DealScoreSchema`
  - `WatchlistItemSchema`
  - `WeeklyBasketSchema`
  - `AlertSchema`
- Included shared currency, price-type, source-type, and weekly-basket item schemas to keep client/server DTOs consistent.
- Kept contracts database-independent and explicit about demo/seed fields.

### Verification
Commands run from `/tmp/gv-worker-d-contracts-clone` with Node `v24.15.0`, `COREPACK_HOME=/tmp/scyiu-corepack`, and pnpm `10.21.0`:
- `corepack pnpm@10.21.0 --dir packages/api-contracts install` — passed.
- `corepack pnpm@10.21.0 --dir packages/api-contracts build` — passed.
- `corepack pnpm@10.21.0 --dir packages/api-contracts typecheck` — passed.
- `corepack pnpm@10.21.0 --dir apps/api install --frozen-lockfile` — passed.
- `corepack pnpm@10.21.0 --dir apps/api build` — passed.
- `corepack pnpm@10.21.0 --dir apps/api test:e2e` — passed (`Test Suites: 1 passed`, `Tests: 3 passed`).
- Smoke after build with `PORT=3125 DATABASE_ENABLED=false node apps/api/dist/main.js`:
  - `GET /health` returned HTTP 200 with `{ "status": "ok", "service": "api" }`.
  - `GET /products` returned HTTP 200.

### Next task
- Wire API controllers to import/validate against `@groceryview/api-contracts` after the stacked backend scaffold/OpenAPI/domain PRs are reconciled.

### Blockers / notes
- PR #13 remains stacked on existing backend API work until earlier backend PRs merge to `main`.
- The root monorepo workspace is not present on this backend stack yet, so the contracts package uses its own package manifest and lockfile like the existing standalone package pattern.
