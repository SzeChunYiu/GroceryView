# Handoff — backend-api lane

Updated: 2026-05-16 23:18 Europe/Stockholm
Pane: PANE 2 / WORKER-A
Branch: `backend-api/openapi-config`
PR: pending at handoff write time

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
