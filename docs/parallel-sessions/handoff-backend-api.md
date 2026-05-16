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

## Worker-C update — 2026-05-17 00:30 Europe/Stockholm
Pane: PANE 4 / WORKER-C
Branch: `backend-api/domain-placeholders-worker-c`
PR: https://github.com/SzeChunYiu/GroceryView/pull/12

### Task taken
- Re-read `docs/parallel-sessions/shared.md` and `docs/parallel-sessions/backend-api.md`.
- The local `codex-tasks/backend-api-tasks.md` file is still absent, so I used the canonical checklist from `origin/ceo/roadmap-phase1:codex-tasks/backend-api-tasks.md` plus the latest backend handoff/PR state.
- Avoided prior backend work from panes/branches that already covered NestJS scaffold, database connection, and OpenAPI/config.
- Implemented the next uncovered backend API slice: domain modules/controllers with typed seed/demo placeholder responses for products, stores, prices, watchlists, baskets, and alerts.

### What changed
- Added typed placeholder controllers and wired modules for:
  - `GET /products`, `GET /products/:slug`
  - `GET /stores`, `GET /stores/:slug`
  - `GET /products/:slug/prices`, `GET /products/:slug/series`
  - `GET /me/watchlist`, `POST /me/watchlist`
  - `GET /me/weekly-basket`, `POST /me/weekly-basket/items`
  - `GET /me/alerts`
- Placeholder payloads are explicit `demo: true` / `sourceType: seed/demo` data and do not depend on PostgreSQL.
- Added Swagger decorators and expanded e2e coverage for the new placeholder routes.

### Verification
Commands run from `/tmp/gv-backend-api-worker-c-clone` with Node `v24.15.0` on PATH and `COREPACK_HOME=/tmp/scyiu-corepack`:
- `corepack pnpm@10.21.0 --dir apps/api install --frozen-lockfile` — passed.
- `corepack pnpm@10.21.0 --dir apps/api build` — passed.
- `corepack pnpm@10.21.0 --dir apps/api test:e2e` — passed (`Test Suites: 1 passed`, `Tests: 2 passed`).
- Smoke after build with `PORT=3210 DATABASE_ENABLED=false node apps/api/dist/main.js`:
  - `GET /health` returned HTTP 200 with `{ "status": "ok", "service": "api" }`.
  - `GET /products/zoegas-skane-mellanrost-450g` returned HTTP 200 demo product JSON.
  - `GET /products/zoegas-skane-mellanrost-450g/prices` returned HTTP 200 seed/demo price JSON.
  - `GET /docs` returned HTTP 200.

### Next task
- Create `packages/api-contracts` Zod schemas and then replace/mirror the local DTOs with shared contract types when that package is available.

### Blockers / notes
- The canonical checklist remains absent from the active worktree and is only visible on `origin/ceo/roadmap-phase1`.
- PR is open: https://github.com/SzeChunYiu/GroceryView/pull/12
- This branch is stacked on `origin/backend-api/openapi-config`; earlier backend PRs still need to merge before the diff to `main` is minimal.

---

## Worker-C repair update — 2026-05-17 01:10 Europe/Stockholm
Pane: PANE 4 / WORKER-C
Branch prepared from latest `origin/main`: `backend-api/domain-placeholders-worker-c`
PR: https://github.com/SzeChunYiu/GroceryView/pull/12

### Task taken
- Re-read `docs/parallel-sessions/shared.md` and `docs/parallel-sessions/backend-api.md` from the shared worktree.
- Confirmed `origin/main:codex-tasks/backend-api-tasks.md` exists and still lists backend checklist items unchecked.
- Repaired Worker-C's domain placeholder branch by replaying the API scaffold/config/domain placeholder files onto current `origin/main` (`526bec1`) so the PR no longer deletes current-main files such as `.env.example`, `ROADMAP.md`, `codex-tasks/**`, `infra/**`, or `packages/db/**`.
- Kept the Worker-C slice focused on checklist item 8: domain modules/controllers with typed seed/demo placeholder responses for products, stores, prices, watchlists, baskets, and alerts.

### Verification rerun
Environment: Node `v24.15.0`, `COREPACK_HOME=/tmp/scyiu-corepack`, pnpm `10.21.0`.
- `corepack pnpm@10.21.0 --dir apps/api install --frozen-lockfile` — passed.
- `corepack pnpm@10.21.0 --dir apps/api build` — passed.
- `corepack pnpm@10.21.0 --dir apps/api test:e2e` — passed (`Test Suites: 1 passed`, `Tests: 2 passed`).
- Smoke with `PORT=3224 DATABASE_ENABLED=false node apps/api/dist/main.js`:
  - `GET /health` returned HTTP 200 with `{ "status": "ok", "service": "api" }`.
  - `GET /products`, `/products/zoegas-skane-mellanrost-450g`, `/stores`, `/stores/ica-nara-odenplan`, `/products/zoegas-skane-mellanrost-450g/prices`, `/products/zoegas-skane-mellanrost-450g/series`, `/me/watchlist`, `/me/weekly-basket`, `/me/alerts`, and `/docs` all returned HTTP 200.

### Next task
- Worker-D / a later backend task can create `packages/api-contracts` Zod schemas and wire the controllers to shared contracts.

### Blockers / notes
- This repair is intended to replace the previous stale-base Worker-C PR contents while keeping the same PR URL.
