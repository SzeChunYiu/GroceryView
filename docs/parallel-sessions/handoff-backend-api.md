# Handoff — backend-api lane

Updated: 2026-05-17 00:45 Europe/Stockholm
Pane: PANE 3 / WORKER-B
Branch: `backend-api/domain-placeholders`
PR: https://github.com/SzeChunYiu/GroceryView/pull/14

## Task taken
- Re-read `docs/parallel-sessions/shared.md` and `docs/parallel-sessions/backend-api.md`.
- Also checked the backend task checklist from `origin/ceo/roadmap-phase1` because `codex-tasks/backend-api-tasks.md` is absent from the active backend branches/main.
- Worker-A already implemented the API configuration/OpenAPI/health slice on `backend-api/openapi-config`; this branch is based on `origin/backend-api/openapi-config` and implements the next distinct unchecked slice: domain modules and controllers with typed placeholder responses.

## What changed
- Added typed demo/seed controllers for the checklist routes:
  - Products: `GET /products`, `GET /products/:slug`.
  - Stores: `GET /stores`, `GET /stores/:slug`.
  - Prices: `GET /products/:slug/prices`, `GET /products/:slug/series`.
  - Watchlists: `GET /me/watchlist`, `POST /me/watchlist`.
  - Baskets: `GET /me/weekly-basket`, `POST /me/weekly-basket/items`.
  - Alerts: `GET /me/alerts`.
- Added new `AlertsModule`, `BasketsModule`, and `WatchlistsModule` and registered all domain controllers from `AppModule`.
- Expanded e2e coverage for products, stores, prices, watchlist, weekly basket, and alerts placeholder endpoints.

## Verification
Commands run from `/tmp/gv-worker-b-clone/apps/api` with Node 24.15.0 on PATH and `COREPACK_HOME=/tmp/scyiu-corepack`:
- `node -v` — `v24.15.0`.
- `corepack pnpm@10.21.0 install --frozen-lockfile` — passed.
- `corepack pnpm@10.21.0 build` — passed.
- `DATABASE_ENABLED=false corepack pnpm@10.21.0 test:e2e` — passed, 1 suite / 5 tests.
- Smoke after build with `PORT=3112 DATABASE_ENABLED=false node dist/main.js`:
  - `GET /health` returned `{"status":"ok","service":"api"}`.
  - `GET /products` returned 2 seed products including `zoegas-skane-450g`.
  - `GET /stores` returned 2 Stockholm seed stores including `willys-odenplan`.
  - `GET /products/zoegas-skane-450g/prices` returned 2 SEK seed observations.
  - `GET /products/zoegas-skane-450g/series` returned a 3-point seed series.
  - `GET /me/watchlist` returned 1 seed item.
  - `GET /me/weekly-basket` returned 2 seed items.
  - `GET /me/alerts` returned 1 enabled target-price seed alert.
  - `GET /docs` returned HTTP 200.

## Next task
- Create `packages/api-contracts` with Zod schemas (`ProductSummarySchema`, `StoreSummarySchema`, `PriceObservationSchema`, `DealScoreSchema`, `WatchlistItemSchema`, `WeeklyBasketSchema`, `AlertSchema`) and then wire those contracts into the API controllers.

## Blockers / notes
- This PR is stacked on `origin/backend-api/openapi-config`, which is itself stacked on earlier backend scaffold/database PRs until those are merged into `main`.
- `codex-tasks/backend-api-tasks.md` remains absent on the active backend branches/main; `origin/ceo/roadmap-phase1` remains the source for the numbered checklist.
