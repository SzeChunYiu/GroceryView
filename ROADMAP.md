# GroceryView Implementation Roadmap

**Owner:** CEO lane  
**Date:** 2026-05-16  
**Source docs read:** `GOAL.md`, `PROPOSAL.md`, `docs/tech-stack.md`, `docs/architecture.md`, `docs/product-spec.md`, `docs/research-market.md`, `docs/competitor-analysis.md`, `docs/data-sources.md`, `docs/ux-concepts.md`, and `docs/parallel-sessions/*.md`.

## Phase 1 — Foundation

| Item | Status | Owner lane | Priority | Definition of done |
|---|---|---:|---:|---|
| Monorepo scaffold | TODO | frontend-web | P0 | `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, root `tsconfig.json`, `.gitignore`, and shared package directories exist; `pnpm install` succeeds. |
| Web scaffold | TODO | frontend-web | P0 | `apps/web` runs Next.js 16.2+, TypeScript, App Router, Tailwind, shadcn/ui, TanStack Query; placeholder routes `/`, `/products/[slug]`, `/stores/[slug]`, `/categories/[slug]`; `pnpm --filter web build` succeeds. |
| API scaffold | TODO | backend-api | P0 | `apps/api` runs NestJS + TypeScript with `ConfigModule`, Swagger/OpenAPI, validation pipe, modules for products/stores/prices/users/watchlists/baskets/alerts, and `GET /health`; `pnpm --filter api build` succeeds. |
| DB schema | TODO | db-schema | P0 | `infra/db/migrations/*.sql` and `infra/db/SCHEMA.md` define PostgreSQL 18 + PostGIS/pg_trgm schema for chains, stores, products, aliases, observations, latest prices, users, watchlists, baskets, budgets, alerts, source runs, and raw records. |
| Mobile scaffold | TODO | mobile | P1 | `apps/mobile` runs Expo SDK 55 + React Native 0.83 + Expo Router with TypeScript, TanStack Query, persisted cache, camera/notifications placeholders, and screens for Today, Search, Product, Basket, Budget. |
| Data-worker scaffold | TODO | data-worker | P0 | `workers/data-pipeline` runs Python + Dagster with assets for seed stores/products, retailer fetch stubs, normalization, price observations, latest-price rollup, and quality checks; local Dagster webserver starts. |
| Local infrastructure | TODO | db-schema | P0 | `infra/docker-compose.yml` starts PostgreSQL with PostGIS, Redis, and S3-compatible object storage; env examples document ports and secrets. |
| Shared contracts | TODO | backend-api | P0 | `packages/api-contracts` exports Zod DTOs and generated/OpenAPI-compatible types for products, stores, prices, watchlists, baskets, and alerts. |
| CI baseline | TODO | frontend-web | P1 | GitHub Actions or equivalent runs `pnpm install`, `pnpm build`, `pnpm lint`, API build, SQL validation, and worker smoke tests. |

## Phase 2 — Core features

| Item | Status | Owner lane | Priority | Definition of done |
|---|---|---:|---:|---|
| Price display | TODO | frontend-web | P0 | Product pages show current store prices, unit price, price type, confidence, source timestamp, and member/promo labels without implying unverified prices are official shelf prices. |
| API price endpoints | TODO | backend-api | P0 | REST/OpenAPI endpoints return product terminal data, latest store prices, price observations, promotion observations, and confidence labels. |
| Charts | TODO | frontend-web | P0 | Web product pages render TradingView Lightweight Charts with 7D/30D/90D/1Y ranges, multi-store lines, promo markers, and solid/dotted confidence styling. |
| Search | TODO | backend-api | P0 | Product/store search uses PostgreSQL full-text + `pg_trgm`, boosts barcode exact match and favorite-store availability, and returns typed API contracts. |
| Stores map | TODO | frontend-web | P1 | Store pages and map views use store coordinates, chain/format/district filters, and radius display without travel-time penalty in Deal Score. |
| Store and product seeds | TODO | db-schema | P0 | Seed scripts cover ICA, Willys, Coop, Hemköp, Lidl, and City Gross Stockholm stores plus the first 20 hero products. |
| Ingestion v0 | TODO | data-worker | P0 | Dagster materializes source runs, raw snapshots, normalized products, price observations, promotion observations, and latest-price rollups with provenance. |
| Deal Score v1 | TODO | backend-api | P0 | Domain logic returns score band, buy/wait verdict, discount vs median, historical percentile, confidence, and reasons; distance is excluded from default ranking. |

## Phase 3 — User features

| Item | Status | Owner lane | Priority | Definition of done |
|---|---|---:|---:|---|
| Watchlist | TODO | backend-api | P0 | Users can add/remove products, set target prices/percent drops, choose price types, and list watched products via API and web UI. |
| Alerts | TODO | backend-api | P0 | Alert candidates are generated from latest prices, deduplicated in `alert_deliveries`, and exposed for push/email adapters without spamming. |
| Basket | TODO | frontend-web | P0 | Weekly Basket UI supports item quantities, selected/favorite stores, estimated total, buy/wait guidance, private-label mode, and mark-bought state. |
| Basket comparison | TODO | backend-api | P0 | API computes all-at-one-store, cheapest-across-selected, favorite-only, and private-label substitution strategies with clear missing/estimated-price labels. |
| Budget tracker | TODO | frontend-web | P1 | UI shows weekly/monthly budget, basket forecast, category budgets, in-store running total placeholder, and receipt review placeholder. |
| Receipt/photo trust loop | TODO | data-worker | P1 | Upload metadata tables and worker stubs support private object storage, OCR status, review queue, and delete/redaction workflows. |
| Mobile daily utility | TODO | mobile | P1 | Expo app supports Today dashboard, favorite stores, watchlist, product terminal, basket, budget, barcode placeholder, and offline stale-data labels. |

## Cross-lane operating rules

1. Keep app-code changes in lane-owned paths from `docs/parallel-sessions/*.md`.
2. Commit one compact phase per iteration and write a lane handoff in `docs/parallel-sessions/handoff-<lane>.md`.
3. Preserve source provenance and data confidence from day one: source URL/type, observed timestamp, price type, parser version, confidence, and raw snapshot reference.
4. Never make distance or travel time part of default Deal Score. Show distance only as metadata or an explicit user filter.
5. Treat online, flyer, member, in-store, receipt, shelf-photo, manual, and estimated prices as distinct price types.
6. Do not present scraped or open data as a partnership unless there is a signed agreement.
