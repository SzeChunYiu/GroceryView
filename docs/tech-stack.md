# GroceryView Tech Stack Recommendation

**Lane:** TECH-STACK / Pane 3  
**Research date:** 2026-05-16  
**Input:** `PROPOSAL.md` v0.2, Stockholm MVP for Web + Android + iOS

## 1. Executive recommendation

Use a **TypeScript-first product stack with a Python data plane**, pinned to currently stable platform releases:

| Layer | Recommendation | Why this is optimal for GroceryView |
|---|---|---|
| Web app | **Next.js 16.2+ + TypeScript + App Router** | Best fit for SEO product/store/category pages, public market reports, fast server-rendered chart pages, and B2B/marketing pages. |
| Mobile apps | **Expo SDK 55 + React Native 0.83 + Expo Router** for an immediate start; **upgrade to Expo SDK 56 after stable GA** if it lands before app hardening | Fastest stable Expo route to high-quality Android/iOS apps with camera, push notifications, OTA updates, and shared React/TypeScript skills, while avoiding beta churn during the first sprint. |
| Monorepo | **pnpm workspaces + Turborepo** | Enables shared API client, validation schemas, types, business rules, and UI tokens while keeping web and mobile independently optimized. |
| Backend API | **NestJS + TypeScript** | Strong modular backend for auth-gated APIs, alerts, baskets, watchlists, billing, admin tools, and typed contracts shared with clients. |
| Data/ML workers | **Python + Dagster** | Best fit for ingestion, product matching, receipt OCR post-processing, deal scoring, index calculations, and data quality jobs. |
| Database | **PostgreSQL 18.x where managed support is available; PostgreSQL 17 acceptable + PostGIS + native partitioning** | Correct primary system of record for relational grocery data, price events, spatial store filters, privacy, transactions, and expansion. |
| Cache/queues | **Redis + BullMQ initially; add Kafka/Redpanda later only if volume demands it** | Keeps MVP simple while supporting alerts, ingestion fanout, cache invalidation, and async jobs. |
| Search | **Postgres full-text/trigram for MVP; Meilisearch when search quality becomes a product bottleneck** | Product search needs typo tolerance and facets eventually, but Postgres is enough for the first 500-5,000 products. |
| Object storage | **S3-compatible storage** | Receipts, shelf photos, OCR artifacts, product images, and moderation evidence. |
| Analytics | **PostHog or Segment + warehouse later; ClickHouse only after event volume justifies it** | Avoid premature analytics infra; add OLAP once price/event datasets exceed Postgres materialized-view comfort. |
| Hosting | **Vercel for web, Fly.io/Render/AWS for API/workers, managed Postgres** | Keeps the launch team focused on product/data quality rather than platform operations. |

**Do not build one universal Expo web app as the main website.** Use Expo/React Native for mobile and Next.js for web. Share types, API clients, validation schemas, business logic, theme tokens, and selected simple components, but keep the public web experience native to Next.js for SEO, server rendering, chart performance, and content operations.

## 2. Product constraints from the proposal

GroceryView is not a basic grocery list app. The stack must support:

- Public SEO pages: market, product, store, category, index, weekly report.
- Native mobile workflows: favorite stores, watchlist, basket, budget, push alerts, barcode scan, receipt scan, in-store mode.
- Event-style data model: every price observation and promotion is immutable history.
- TradingView-like charts: product time series, category indices, percentiles, marker overlays, confidence styling.
- Stockholm-local filters: store, chain, district, radius, favorite stores, member-price inclusion.
- Data trust: source confidence, verified vs estimated styling, wrong-price reports, receipt/shelf-photo evidence.
- Future expansion: multiple cities, countries, currencies, languages, chains, VAT/local rules, and local product taxonomies.

## 3. Version posture as of 2026-05-16

The recommendation intentionally follows **stable platform releases**, not canary releases:

- **Next.js:** use Next.js **16.2+** for new web work; npm reports **16.2.6** as the latest `next` package on 2026-05-16. Next 16 made Turbopack stable/default, and 16.2 adds performance and deployment-adapter improvements useful for a server-rendered product/search site.
- **Mobile:** use **Expo SDK 55** for the MVP if development starts immediately. It includes React Native 0.83 and React 19.2. Expo SDK 56 is currently beta as of 2026-05-16, with React Native 0.85.2 and React 19.2.3; adopt SDK 56 only after stable GA and one dependency-compatibility pass. Do not build the MVP on Expo canary/beta unless a native dependency forces it.
- **Database:** prefer **PostgreSQL 18.x** for greenfield managed deployments if the hosting provider supports it with backups/PITR; PostgreSQL 18.4 is the current documented branch as of this research date. PostgreSQL 17 remains fine when provider support or extension compatibility lags.
- **Node:** pin the repo with Volta/asdf and CI. Use **Node 24 LTS** as the cross-repo default for new work because it is the current official LTS line; Node 22 LTS is an acceptable fallback if a provider or native dependency lags. Avoid Node 20 because it is EOL even though some toolchain minimums still mention 20.x.

## 4. Frontend architecture

### 4.1 Web: Next.js

**Recommended stack**

- Next.js 16.2+ App Router
- TypeScript
- Tailwind CSS + shadcn/ui or Radix primitives for web-only components
- TanStack Query for client-side authenticated data
- Server Components for public read-heavy pages
- Lightweight Charts by TradingView for product/index charts on web
- MapLibre GL for store/district maps if needed
- Playwright for E2E tests

**Why**

The website is central to acquisition and SEO. Public pages like `/products/[slug]`, `/stores/[slug]`, `/categories/[slug]`, `/indices/stockholm-grocery-index`, and `/weekly-report` should be crawlable, fast, and metadata-rich. Next.js App Router supports server rendering, Server Components, route-level metadata, caching, and production SEO patterns that fit this need.

**Recommended page rendering modes**

| Page type | Rendering strategy |
|---|---|
| Home, market overview, weekly report | Static or ISR where possible; dynamic widgets hydrated client-side. |
| Product pages | Server-render canonical product data + initial chart summary; fetch live prices client-side or via revalidation. |
| Store/category pages | ISR with frequent revalidation. |
| Basket planner, account, watchlist | Authenticated client/server hybrid; no indexing. |
| B2B/demo pages | Static. |

### 4.2 Mobile: React Native + Expo

**Recommended stack**

- Expo SDK 55 / React Native 0.83 stable baseline for immediate MVP work; plan a short SDK 56 upgrade spike after stable release
- Expo Router for mobile navigation and deep linking
- EAS Build, EAS Submit, EAS Update
- Expo Camera for barcode scanning and receipt image capture
- Expo Notifications for push; FCM/APNs behind Expo initially
- TanStack Query + persisted cache for offline-tolerant reads
- FlashList for deal feeds, product search results, and watchlists
- NativeWind or a small design-token layer for styling; avoid overly complex universal UI frameworks in MVP

**Why**

The mobile app needs camera, push, in-store mode, native performance, and app-store distribution. Expo now covers the critical MVP-native features while reducing iOS/Android build friction. React Native keeps one mobile codebase for Android and iOS and shares the team’s React/TypeScript skills with the web codebase.

**Important mobile decisions**

- Use **development builds**, not Expo Go, for real QA because camera, notifications, app config, native modules, and production behavior must be tested like shipped apps.
- Track Expo SDK 56 during implementation. Upgrade before public launch only after it is stable and the dependency ecosystem has caught up; otherwise keep the MVP on SDK 55 and schedule the upgrade after launch.
- Keep chart interactions simpler on mobile for MVP. Use server-prepared chart series and a mobile chart component optimized for line charts and markers. Web can carry the heavier TradingView-like charting surface first.
- Build robust offline states: last known prices, stale-data labels, cached favorite-store feed, and basket running total.

### 4.3 Shared code strategy

Recommended monorepo layout:

```text
apps/
  web/                 # Next.js
  mobile/              # Expo / React Native
  admin/               # optional later, can be Next.js
services/
  api/                 # NestJS
  workers/             # Python/Dagster jobs
packages/
  api-contracts/       # Zod schemas, DTOs, route types
  domain/              # Deal Score, units, price math, confidence labels
  db/                  # Drizzle/SQL migrations or Prisma schema
  ui-tokens/           # colors, typography, spacing, chart palette
  config/              # eslint, tsconfig, prettier
```

Share aggressively at the **domain and contract** level, not by forcing identical UI across web and mobile. GroceryView’s website and app have different jobs.

## 5. Backend recommendation

### 5.1 API service: NestJS

Use NestJS as the main application backend for:

- Auth/session integration
- Favorite stores
- Watchlists
- Weekly baskets
- Budget tracker
- Basket comparison
- Alerts API
- Product/store/category APIs
- Admin/review workflows
- Subscription/ad entitlement logic
- Public SEO API endpoints consumed by Next.js

**Why NestJS over FastAPI for the main API**

Both are good. For this product, NestJS is the better default because the user-facing product is React/TypeScript on both web and mobile. A TypeScript API reduces duplicated DTOs, improves end-to-end type safety, and fits the long-lived modular domain: stores, products, baskets, budgets, alerts, indices, and ads.

**Where Python should be used**

Use Python where it is strongest:

- Retailer/catalog ingestion
- HTML/PDF/flyer parsing
- Receipt OCR post-processing
- Product matching and alias clustering
- Price anomaly detection
- Index calculation
- Deal Score batch recalculation
- Data-quality dashboards

This gives GroceryView a clean split: **TypeScript for product APIs; Python for data intelligence.**

### 5.2 API contract

Use one of these patterns:

1. **REST + OpenAPI + generated clients** — best if external/B2B API access is likely.
2. **tRPC for internal app APIs** — fastest TypeScript DX, but less ideal for public external API compatibility.

Recommendation: **REST/OpenAPI for core product APIs** with Zod validation and generated TypeScript clients. Keep an internal tRPC layer only if the team strongly values TS-only speed and accepts adding REST later.

## 6. Database and data model

### 6.1 Primary database: PostgreSQL

PostgreSQL should be the system of record for MVP.

Recommended extensions/features:

- PostGIS for store coordinates, radius filters, districts, and expansion geographies. Use indexed `ST_DWithin` queries for radius filtering, but keep travel distance informational rather than part of Deal Score for MVP.
- `pg_trgm` and full-text search for MVP product search.
- Native range/list partitioning for `price_observations`, `promotion_observations`, and analytics events.
- Materialized views for deal feeds, product latest prices, weekly index snapshots, and store/category summaries.
- JSONB for raw source payload snapshots where schema varies, while keeping canonical product/price fields relational.
- Row-level privacy boundaries for receipts, household data, budgets, and location history.

**Avoid TimescaleDB as a hard dependency on day one.** It is attractive for time-series, but native PostgreSQL partitioning plus materialized views is enough for MVP and reduces extension/hosting constraints. Revisit Timescale or ClickHouse once ingestion volume and chart latency prove the need.

### 6.2 Core tables

The proposal’s model is strong. Implement it with a few additional operational tables:

```text
chains
stores
products
product_aliases
product_equivalence_groups
price_observations
promotion_observations
latest_store_prices          # materialized/current projection
price_series_daily           # rollup for chart APIs
index_snapshots
favorite_stores
watchlist_items
weekly_baskets
basket_items
budgets
alerts
alert_deliveries
receipt_uploads
receipt_line_items
shelf_photo_reports
source_runs
source_records_raw
moderation_queue
```

### 6.3 Price observations design

Principles:

- Never overwrite observations; append immutable events.
- Separate regular, promo, member, online, and in-store prices.
- Store source type, source URL/file, parser version, confidence score, and raw snapshot pointer.
- Build read models for current prices and charts from events.
- Include `city_id`, `chain_id`, `store_id`, `product_id`, `observed_at`, and `valid_from/valid_to` where known.

Partition examples:

- `price_observations`: monthly range partition by `observed_at`, sub-index by `(product_id, city_id, observed_at desc)` and `(store_id, observed_at desc)`.
- `promotion_observations`: partition by `promo_start` or `observed_at`.
- `app_events`: weekly/monthly partition by event time if stored in Postgres initially.

## 7. Data pipeline

### 7.1 Orchestration

Use **Dagster** for the data pipeline because GroceryView’s data domain is asset-centric: products, store catalog, raw source captures, parsed prices, matched products, confidence scores, rollups, and indices. Dagster’s asset model, lineage, observability, and testability map well to this product.

Airflow is also viable and mature, but for a small team building a data product with many derived assets, Dagster is the more ergonomic MVP choice.

### 7.2 Pipeline modules

```text
Source discovery
  -> retailer catalog/flyer fetchers
  -> Open Food Facts barcode/nutrition enrichment
  -> manual seed/admin uploads
  -> receipt and shelf-photo uploads

Raw persistence
  -> source_records_raw in object storage + metadata in Postgres

Parsing and normalization
  -> product names, quantities, units, promo mechanics, member-only flags

Product matching
  -> exact barcode match
  -> alias match
  -> equivalent group match
  -> low-confidence human review

Observation write
  -> price_observations
  -> promotion_observations
  -> confidence score

Derived assets
  -> latest prices
  -> product chart series
  -> deal score snapshots
  -> store deal feed
  -> basket comparison cache
  -> Stockholm/category/private-label indices
  -> alert candidates
```

### 7.3 OCR strategy

MVP receipt scanning should be server-side first:

1. Mobile captures receipt image.
2. Upload to private object storage.
3. Create `receipt_upload` record.
4. OCR worker extracts text using managed OCR initially.
5. Parser maps receipt lines to products/stores with confidence.
6. Low-confidence lines go to review/correction.

Use on-device OCR later only if privacy, latency, or cost requires it. Managed OCR is faster to iterate and easier to monitor during MVP.

### 7.4 Data-source posture

- Start with a limited Stockholm hero catalog and manually reviewed store set.
- Use open product data for barcode/nutrition enrichment, not as a price source.
- Treat retailer pages/flyers as source observations with legal review and conservative crawl rates.
- Prefer official APIs/partnerships where available.
- Make confidence visible in UI from the first release.

## 8. Search and matching

### MVP

Use PostgreSQL:

- `pg_trgm` for fuzzy product/store names.
- Full-text indexes for categories and aliases.
- Ranked search that boosts barcode exact match, canonical products, favorite-store availability, and high-confidence prices.

### Scale-up

Add Meilisearch when product search must support fast typo-tolerant search, facets, filters, and better UX across tens/hundreds of thousands of products. Add OpenSearch only if you need heavy search analytics, complex relevance tuning, and larger operational budget.

### Product matching

Use a layered matcher:

1. Barcode/GTIN exact match.
2. Retailer SKU exact match.
3. Normalized name + package size + brand.
4. Alias table.
5. Embedding-assisted candidate generation for messy receipt lines.
6. Human review for low-confidence matches.

Keep exact, equivalent, and smart-swap matches as distinct concepts; never silently merge them.

## 9. Charts and market-terminal experience

### Web charting

Use **TradingView Lightweight Charts** for product and index line charts because GroceryView explicitly wants a TradingView-like market-terminal feel. It fits:

- Product price history
- 7D/30D/90D/1Y ranges
- Multi-store comparison lines
- Promotion markers
- 52-week high/low markers
- Percentile bands

### Mobile charting

Use a simpler native chart component for MVP:

- Line chart with markers
- Time-range selector
- Tooltip/crosshair if stable
- Confidence styling with solid/dotted lines

Do not try to reproduce the full web terminal on mobile in phase 1. Mobile’s main job is fast decision support: Buy / Wait / Compare / Add to basket / Scan.

## 10. Infrastructure

### MVP deployment

| Component | MVP deployment |
|---|---|
| Web | Vercel or self-hosted Next.js on Fly.io/Render if avoiding platform lock-in. |
| API | Containerized NestJS on Fly.io, Render, ECS, or Kubernetes later. |
| Workers | Python containers run by Dagster. |
| Database | Managed PostgreSQL with backups, PITR, read replica later. |
| Redis | Managed Redis. |
| Object storage | S3-compatible private buckets. |
| Secrets | Cloud secret manager; never in client bundles. |
| Observability | Sentry + OpenTelemetry + structured logs. |
| Uptime | Health checks for API, workers, ingestion freshness, and price coverage. |

### Environments

- `dev`: local Docker Compose for Postgres/Redis/object-store emulator.
- `staging`: production-like test data, TestFlight/internal Android builds.
- `prod`: strict secrets, backups, alerting, and admin audit logs.

## 11. Privacy, security, and compliance

GroceryView handles location, receipts, household budget, and dietary preferences. Build privacy into the stack:

- Private receipt/shelf-photo buckets with short-lived signed URLs.
- User-level authorization on every receipt, basket, budget, household, and location-derived record.
- Encryption at rest via managed database/storage defaults; consider application-layer encryption for receipt OCR text later.
- Delete-account and delete-receipt workflows from MVP.
- Separate ad identifiers and recommendation logic; ads must never affect Deal Score.
- Admin audit logs for human review of receipt/photo data.
- Data retention rules for raw receipt images and OCR artifacts.

## 12. Monetization stack

- **Ads:** Google AdMob for mobile and AdSense/Ad Manager for web, with strict placement rules from the proposal.
- **Subscriptions:** RevenueCat for mobile subscriptions to simplify App Store / Play Store entitlement handling; mirror entitlements into backend.
- **B2B later:** separate API keys, usage metering, and export jobs; do not expose user-private data.

## 13. Phased implementation plan

### Phase 1: Stockholm MVP foundation, 0-3 months

Build:

- Monorepo and CI.
- Next.js public web shell.
- Expo mobile shell.
- NestJS API.
- PostgreSQL schema and migrations.
- Store database for Stockholm.
- Product catalog for ~500 hero products.
- Price observation ingestion path.
- Product search.
- Product page with basic chart.
- Favorite stores, watchlist, weekly basket, budget tracker.
- Deal Score v1.
- Basket comparison across selected/favorite stores.
- Basic alerts.
- Ad-ready layout placeholders.

Defer:

- Receipt OCR automation beyond upload/prototype.
- Advanced indices beyond required simple fixed baskets.
- Yellow sticker radar.
- B2B dashboard.
- Multi-city support except in schema.

### Phase 2: Daily utility, 3-6 months

Add:

- Barcode scan.
- Receipt OCR pipeline.
- Household sharing.
- Better product matching and alias review tools.
- Private-label smart swaps.
- Personal grocery inflation.
- Push alert tuning.

### Phase 3: Data moat, 6-12 months

Add:

- Community verification.
- Shelf-photo reports.
- Advanced indices.
- SEO scale-up.
- Analytics warehouse or ClickHouse if Postgres rollups become insufficient.
- B2B analytics beta.

## 14. Key trade-offs considered

### React Native Web vs Next.js website

React Native Web/Expo web can ship a web surface from the mobile app, but GroceryView’s web requirements are SEO-heavy and chart-heavy. Next.js is better for public acquisition pages and market reports. Use Expo web only for internal previews or simple shared screens.

### NestJS vs FastAPI

FastAPI is excellent, especially for data-heavy Python teams. However, a TypeScript backend fits the React/Expo/Next product surface better. Keep Python for workers and intelligence jobs rather than making it the primary product API.

### Supabase vs custom backend

Supabase is attractive for speed because it packages Postgres, Auth, Storage, Realtime, and Edge Functions. It is viable for prototype/MVP if the team wants maximum speed. However, GroceryView has complex domain logic, ingestion, alerts, ranking, ad separation, privacy workflows, and future B2B APIs. A custom NestJS API over managed Postgres gives more explicit control. Supabase can still be used as managed Postgres/Auth/Storage if desired, but do not expose database tables directly as the long-term API contract.

### TimescaleDB vs native PostgreSQL partitioning

Time-series price data is central, but MVP volume is manageable. Native partitioning and materialized views avoid extension lock-in and deployment constraints. Reassess after real ingestion volume is known.

### ClickHouse vs PostgreSQL for analytics

ClickHouse is powerful for large analytical workloads, but it is unnecessary on day one. Add it when product/index analytics queries become too slow or expensive in Postgres.

## 15. Final stack

```text
Frontend
  Web:       Next.js 16.2+, React, TypeScript, Tailwind, Lightweight Charts
  Mobile:    Expo SDK 55, React Native 0.83, Expo Router, TypeScript, FlashList; upgrade to SDK 56 after stable GA if dependency checks pass
  Shared:    Node 24 LTS, pnpm workspaces, Turborepo, Zod schemas, domain package, generated API client

Backend
  API:       NestJS, TypeScript, REST/OpenAPI, Zod validation
  Workers:   Python, Dagster, SQLAlchemy/psycopg, OCR/parsing/matching libraries
  Jobs:      BullMQ + Redis for app jobs; Dagster for data assets

Data
  OLTP:      PostgreSQL with PostGIS, pg_trgm, JSONB, partitioning, materialized views
  Cache:     Redis
  Search:    Postgres FTS/trigram first; Meilisearch later
  Storage:   S3-compatible private object storage
  Analytics: PostHog/Sentry initially; ClickHouse later if needed

Infra
  Web:       Vercel or containerized Next.js
  API:       Container platform such as Fly.io/Render/ECS
  Mobile CI: EAS Build/Submit/Update
  Observability: Sentry, OpenTelemetry, structured logs, uptime checks
```

## 16. Source notes

Research used current official documentation and release notes where possible:

- Next.js App Router and production/metadata documentation: https://nextjs.org/docs/app and https://nextjs.org/docs/app/guides/production-checklist
- Next.js 16 release notes: https://nextjs.org/blog/next-16
- Next.js 16.2 release notes and deployment-adapter update: https://nextjs.org/blog/next-16-2 and https://nextjs.org/blog/nextjs-across-platforms; `npm view next version` returned 16.2.6 during verification on 2026-05-16
- React Native docs and release information: https://reactnative.dev/docs/getting-started and https://reactnative.dev/blog
- React Native 0.85 release note, used as upstream context but not the Expo SDK 55 MVP baseline: https://reactnative.dev/blog/2026/04/07/react-native-0.85
- Expo SDK 55 and Expo Router docs: https://expo.dev/changelog/sdk-55 and https://docs.expo.dev/router/introduction/; `npm view expo version` returned 55.0.24 during verification on 2026-05-16
- Expo SDK 56 beta status used to avoid recommending beta for MVP baseline, while noting RN 0.85.2/React 19.2.3 contents: https://expo.dev/changelog/sdk-56-beta
- Expo EAS Build/Update docs: https://docs.expo.dev/deploy/build-project/ and https://docs.expo.dev/eas-update/deployment/
- Node.js release schedule and LTS/EOL status used for the Node 24 LTS recommendation: https://nodejs.org/en/about/previous-releases
- Expo Camera and push notification docs: https://docs.expo.dev/versions/latest/sdk/camera/ and https://docs.expo.dev/push-notifications/push-notifications-setup/
- NestJS documentation: https://docs.nestjs.com/
- Dagster documentation: https://docs.dagster.io/
- PostgreSQL 18.x release notes and docs for partitioning/search/JSONB/materialized views: https://www.postgresql.org/docs/current/release-18.html, https://www.postgresql.org/docs/release/18.4/, https://www.postgresql.org/docs/current/ddl-partitioning.html, https://www.postgresql.org/docs/current/textsearch.html, https://www.postgresql.org/docs/current/datatype-json.html, and https://www.postgresql.org/docs/current/rules-materializedviews.html
- PostGIS documentation and radius-query guidance: https://postgis.net/docs/ and https://postgis.net/documentation/tips/st-dwithin/
- Supabase architecture/docs as an evaluated alternative: https://supabase.com/docs/guides/getting-started/architecture
- Open Food Facts API: https://openfoodfacts.github.io/openfoodfacts-server/api/
- TradingView Lightweight Charts: https://www.tradingview.com/lightweight-charts/
- Meilisearch docs: https://www.meilisearch.com/docs/
- ClickHouse docs as a later OLAP option: https://clickhouse.com/docs
