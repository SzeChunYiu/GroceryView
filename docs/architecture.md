# GroceryView Architecture

**Lane:** ARCHITECT  
**Source:** `PROPOSAL.md` v0.2  
**Scope:** High-level architecture for the Stockholm MVP with an expansion path to multi-city grocery price intelligence.

## 1. Architectural goals

GroceryView is a TradingView-style grocery market terminal. The architecture must make products, stores, baskets, categories, and indices first-class trackable instruments with price observations, histories, percentiles, alerts, and charts.

Core goals:

1. **Event-sourced pricing:** Never overwrite a price. Store every observed price and promotion as a time-stamped observation with source and confidence metadata.
2. **Chart-first product model:** Serve product, store, category, basket, and index time series efficiently for web and mobile charts.
3. **Trust and explainability:** Show last updated time, source type, confidence, verified/estimated styling, and why a Deal Score was assigned.
4. **Selected-scope comparison:** Compare within user-selected stores, districts, chains, and favorite stores. Do not penalize by travel time in MVP.
5. **MVP now, data moat later:** Start with Stockholm, hero categories/products, and core P0 features, while preserving data structures for receipt OCR, community verification, advanced indices, and multi-city expansion.
6. **International-ready foundations:** Model country, city, currency, locale, unit conversion, member pricing, tax/VAT, private labels, chain/store-level pricing, and product taxonomy without Sweden-only hardcoding.

## 2. Recommended system overview

```text
                    ┌────────────────────────────┐
                    │        Web / Mobile         │
                    │ Next.js + Expo React Native │
                    └─────────────┬──────────────┘
                                  │ HTTPS / JSON
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Platform                             │
│  Auth │ Products │ Stores │ Prices │ Baskets │ Alerts │ Indices  │
│  NestJS/Node.js or FastAPI; this doc recommends NestJS+TS MVP     │
└─────────────┬───────────────┬────────────────┬──────────────────┘
              │               │                │
              ▼               ▼                ▼
     ┌────────────────┐ ┌──────────────┐ ┌──────────────────────┐
     │ PostgreSQL +   │ │ Redis cache  │ │ Object storage       │
     │ TimescaleDB    │ │ + job queues │ │ receipts/shelf photos│
     └────────────────┘ └──────────────┘ └──────────────────────┘
              ▲               ▲
              │               │
┌─────────────┴────────────────────────────────────────────────────┐
│                         Data Platform                             │
│  Retailer ingestion │ Promotion ingestion │ Receipt OCR           │
│  Product matching   │ Normalization       │ Deal scoring          │
│  Index calculation  │ Alert evaluation    │ Confidence scoring     │
└──────────────────────────────────────────────────────────────────┘
```

### Stack recommendation for MVP

- **Web:** Next.js, TypeScript, Tailwind CSS, server-side rendering for SEO market/product/store/category pages.
- **Mobile:** React Native with Expo, TypeScript, shared design tokens and generated/shared API client, push notifications, barcode scanner, receipt camera upload.
- **Backend API:** NestJS + TypeScript for type sharing with web/mobile, modular controllers, background workers, OpenAPI generation, and a strong fit for product/API work. Python services can be introduced for OCR/matching/ML-heavy tasks.
- **Database:** PostgreSQL with TimescaleDB extension for price time series and continuous aggregates; PostGIS for store geography.
- **Cache/queue:** Redis for API caching, rate limiting, BullMQ-style job queues, and short-lived alert/deal feed caches.
- **Object storage:** S3-compatible bucket for receipt images, shelf photos, product images when cached, OCR artifacts, and source snapshots where legally appropriate.
- **Search:** PostgreSQL full-text/trigram search for MVP; OpenSearch/Meilisearch later if product search needs dedicated ranking.
- **Analytics:** Event tracking pipeline into warehouse later; in MVP, append-only `analytics_events` plus privacy-safe aggregated exports.

## 3. Frontend architecture

### 3.1 Applications

```text
apps/web        Next.js website and responsive app shell
apps/mobile     Expo React Native iOS/Android app
packages/api    Generated API client and shared request types
packages/ui     Shared tokens, icons, formatting, chart primitives where practical
packages/domain Shared domain constants: units, confidence labels, score bands
```

### 3.2 Web responsibilities

The web app should support both logged-in app use and public SEO pages.

P0 web surfaces:

- Market overview page: Stockholm market, top drops/gainers, category heatmap, true deals, index summaries.
- Product ticker pages: `/products/:slug` with current best price, chart, stores, equivalents, Deal Score, watchlist CTA.
- Store pages: `/stores/:slug` with store price level, best categories, current offers, confidence and last updated.
- Category pages: `/categories/:slug` with index, best deals, price movers, product screener entry points.
- Authenticated app pages: Today dashboard, favorite stores, watchlist, weekly basket, budget, alerts.

### 3.3 Mobile responsibilities

The mobile app should prioritize daily/weekly utility:

- Today dashboard.
- Product search and Product Price Terminal.
- Favorite stores and watchlist.
- Weekly Basket and budget running total.
- Push alerts for watched products, target prices, basket total drops, index movements.
- P1 barcode scan and receipt scan.
- P1/P2 shelf photo and community verification capture.

### 3.4 UX modes

The API should expose enough data to let clients render both:

- **Simple mode:** Buy now, Wait, Compare, Stock up, Not a real deal.
- **Advanced mode:** charts, percentiles, 7D/30D/90D changes, 52-week ranges, indices, screeners, confidence details.

### 3.5 Chart and time-series contract

Chart responses should use a common shape for products, stores, baskets, and indices:

```json
{
  "instrument": { "id": "prod_123", "type": "product", "symbol": "ZOEGAS-COFFEE-450G" },
  "range": "90d",
  "currency": "SEK",
  "unit": "package",
  "series": [
    {
      "timestamp": "2026-05-16T10:00:00Z",
      "value": 49.90,
      "priceType": "promo",
      "confidence": 0.85,
      "style": "solid",
      "sourceType": "retailer_page"
    }
  ],
  "markers": [
    { "timestamp": "2026-05-13T00:00:00Z", "type": "promotion", "label": "Member price" }
  ],
  "bands": [
    { "type": "normal_range", "low": 54.90, "high": 69.90 }
  ]
}
```

UI rule from the proposal:

- Solid line = verified observed prices.
- Dotted line = estimated or promo-only history.
- Marker = promotion event.
- Shaded band = normal price range.

## 4. Backend API architecture

### 4.1 Service modules

```text
Auth and Identity
  accounts, sessions, households, consents, data deletion

Catalog Service
  products, canonical product graph, aliases, barcodes, brands, categories, equivalents, substitutions

Store Service
  chains, stores, districts, opening hours, geodata, user favorite stores

Price Service
  price observations, promotion observations, current price materialization, history APIs

Market Data Service
  instruments, product/store/category/basket/index time series, top movers, 52-week lows, heatmaps

Deal Scoring Service
  Deal Score v1, verdicts, explainability, score bands, sponsored-content isolation

Basket Service
  weekly baskets, basket items, substitutions, selected-store comparison strategies

Budget Service
  weekly/monthly/category/household budgets, running totals, receipt summary linkage

Watchlist and Alerts Service
  product/category/index watches, target prices, percentile triggers, basket total triggers, push/email dispatch

Scan and Community Service
  barcode lookup, receipt upload/OCR, shelf photo upload, wrong price reports, verification reputation

Analytics and Ads Service
  privacy-safe event collection, ad slots, premium/ad-free flags; never affects Deal Score or ranking
```

### 4.2 API style

Use a REST JSON API for MVP because the required client interactions are straightforward and cacheable. Generate OpenAPI types for clients. GraphQL can be considered later for complex dashboard composition, but REST plus dedicated aggregate endpoints is sufficient for MVP.

API conventions:

- Versioned prefix: `/api/v1`.
- Auth via secure session/JWT depending on platform; refresh tokens for mobile.
- Cursor pagination for lists and observations.
- `scope` parameters for city, district, chain, favorite stores, selected stores.
- `includeMemberPrices`, `includeOnlinePrices`, `verifiedOnly`, `privateLabelMode` filters.
- All money responses include currency and unit context.
- All prices include `observedAt`, `lastVerifiedAt`, `sourceType`, `confidenceScore`, and `priceType`.

### 4.3 MVP API endpoints

#### Market and indices

```text
GET /api/v1/market/overview?city=stockholm&scope=my_stores
GET /api/v1/market/movers?city=stockholm&period=7d&category=coffee
GET /api/v1/market/heatmap?city=stockholm&metric=price_change_7d
GET /api/v1/indices
GET /api/v1/indices/:id
GET /api/v1/indices/:id/history?range=1y
POST /api/v1/indices/:id/watch
```

#### Stores

```text
GET /api/v1/stores?city=stockholm&chain=willys&district=odenplan
GET /api/v1/stores/:id
GET /api/v1/stores/:id/prices?category=coffee
GET /api/v1/stores/:id/deals
GET /api/v1/users/me/favorite-stores
POST /api/v1/users/me/favorite-stores
DELETE /api/v1/users/me/favorite-stores/:storeId
```

#### Products and product terminal

```text
GET /api/v1/products/search?q=coffee&city=stockholm
GET /api/v1/products/:id
GET /api/v1/products/:id/prices?scope=stockholm&storeIds=...
GET /api/v1/products/:id/history?range=90d&priceType=best
GET /api/v1/products/:id/equivalents
GET /api/v1/products/:id/substitutions
GET /api/v1/products/:id/deal-score?scope=my_stores
GET /api/v1/products/:id/ticker
```

#### Screener and deals

```text
GET /api/v1/screener/products?category=coffee&maxHistoricalPercentile=10&verifiedOnly=true
GET /api/v1/deals?city=stockholm&scope=my_stores&minDealScore=75
GET /api/v1/deals/:id
```

#### Watchlist and alerts

```text
GET /api/v1/watchlist
POST /api/v1/watchlist
PATCH /api/v1/watchlist/:id
DELETE /api/v1/watchlist/:id
GET /api/v1/alerts
POST /api/v1/alerts
PATCH /api/v1/alerts/:id
DELETE /api/v1/alerts/:id
```

#### Weekly Basket and budget

```text
GET /api/v1/basket/current
POST /api/v1/basket/items
PATCH /api/v1/basket/items/:id
DELETE /api/v1/basket/items/:id
POST /api/v1/basket/compare
GET /api/v1/budget
PATCH /api/v1/budget
GET /api/v1/budget/summary?period=week
```

#### Scanning and community

```text
POST /api/v1/scan/barcode
POST /api/v1/scan/receipt
GET /api/v1/scan/receipt/:id/status
POST /api/v1/community/price-report
POST /api/v1/community/shelf-photo
POST /api/v1/community/wrong-price-report
POST /api/v1/community/product-match-correction
```

#### User settings and privacy

```text
GET /api/v1/users/me/preferences
PATCH /api/v1/users/me/preferences
GET /api/v1/users/me/privacy-export
DELETE /api/v1/users/me/receipt-history
DELETE /api/v1/users/me
```

### 4.4 Read model strategy

Raw observations are append-only, but the app needs fast current views. Maintain materialized read models:

- `current_product_store_prices`: best latest regular/promo/member price per product-store.
- `current_product_city_prices`: min/median/percentiles by product-city.
- `current_store_metrics`: store price level, deal density, category strengths, last updated.
- `deal_scores_current`: current Deal Score and explanation for product-store and product-city contexts.
- `instrument_timeseries_daily`: daily normalized points for products/categories/stores/baskets/indices.
- `alert_candidates`: precomputed rows that may trigger watchlist and basket alerts.

Update read models incrementally after ingestion and periodically re-run nightly for backfills and methodology changes.

## 5. Data pipeline architecture

### 5.1 Pipeline stages

```text
1. Source fetch
   Retailer APIs/pages, online catalogs, flyers, seed files, receipts, barcode scans, community photos.

2. Raw landing
   Store immutable raw payloads, crawl metadata, source URL, fetched_at, checksum, parser version.

3. Parse and extract
   Extract retailer product IDs, raw product names, prices, units, offers, validity dates, member flags.

4. Normalize
   Convert units, currency, package sizes, promo structures, VAT/deposit fields, chain/store IDs.

5. Product matching
   Match raw retailer items or receipt lines to canonical products using barcode, aliases, fuzzy matching, package size, brand, and human review queues.

6. Observation write
   Append price_observations and promotion_observations. Do not overwrite historical facts.

7. Confidence scoring
   Assign source confidence, match confidence, recency, conflict indicators, and final confidence labels.

8. Derivations
   Recompute current price views, Deal Score v1, percentiles, indices, top movers, heatmaps, baskets.

9. Alert evaluation
   Compare derived states to watchlist, index, and basket alert rules. Deduplicate and dispatch.

10. Monitoring and review
   Data quality dashboards, low-confidence match queues, source failure alerts, anomaly review.
```

### 5.2 Ingestion modules

- **Retailer catalog ingestion:** Scheduled jobs per chain and source. Capture product data, current prices, online/in-store status, store-specific availability if available.
- **Promotion ingestion:** Weekly flyers/campaign pages and structured offers. Preserve member-only, multi-buy, promo dates, claimed regular price, and promo text.
- **Receipt OCR ingestion:** P1. Upload image to object storage, OCR asynchronously, parse receipt lines, match store/date/items, create receipt observations after user review.
- **Shelf photo/community ingestion:** P2. Accept photo/report, extract price if possible, route to verification/reputation logic.
- **Manual seed data:** MVP seed for Stockholm stores and 500 hero products.

### 5.3 Scheduling

Suggested MVP cadence:

- Retailer/current price sources: every 2-6 hours where allowed and technically feasible.
- Promotions/flyers: daily plus campaign-start checks.
- Current price materializations: after each source batch and nightly full refresh.
- Deal Score, percentiles, and top movers: after price materialization.
- Indices: daily for stable index charts; intraday latest snapshot if enough fresh data.
- Alerts: event-driven after derivations plus a daily digest.

### 5.4 Data quality controls

- Store raw source payload checksums to deduplicate repeated observations.
- Detect impossible prices, unit conversion errors, extreme outliers, and conflicting package sizes.
- Separate `regular`, `promo`, `member`, `multi_buy_effective`, `receipt`, `estimated`, and `unknown` price types.
- Never mix online and in-store prices without labels.
- Never mix exact products and equivalents without an explicit match mode.
- Queue low-confidence product matches for human review before using them in high-confidence charts/indices.
- Preserve parser versions so historical extraction bugs can be backfilled.

## 6. Database schema

The schema below is logical and can be implemented with PostgreSQL migrations. IDs can be UUIDs. Time-series tables should be hypertables if TimescaleDB is available.

### 6.1 Geography, chains, and stores

```sql
countries (
  id uuid primary key,
  iso_code text not null unique,
  name text not null,
  default_currency text not null,
  default_locale text not null
);

cities (
  id uuid primary key,
  country_id uuid not null references countries(id),
  name text not null,
  timezone text not null,
  default_currency text not null
);

districts (
  id uuid primary key,
  city_id uuid not null references cities(id),
  name text not null,
  geometry geography
);

chains (
  id uuid primary key,
  country_id uuid not null references countries(id),
  name text not null,
  slug text not null,
  private_label_owner text,
  website_url text
);

stores (
  id uuid primary key,
  chain_id uuid not null references chains(id),
  city_id uuid not null references cities(id),
  district_id uuid references districts(id),
  name text not null,
  slug text not null,
  address text,
  latitude numeric,
  longitude numeric,
  geog geography(point, 4326),
  store_type text,
  opening_hours jsonb,
  online_store_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.2 Product catalog and equivalence graph

```sql
categories (
  id uuid primary key,
  parent_id uuid references categories(id),
  name text not null,
  slug text not null,
  default_comparable_unit text,
  mvp_priority text
);

brands (
  id uuid primary key,
  name text not null,
  owner text,
  brand_tier text not null -- national, premium, standard_private_label, budget_private_label, organic_private_label, discount_chain_label
);

products (
  id uuid primary key,
  barcode text,
  canonical_name text not null,
  slug text not null,
  brand_id uuid references brands(id),
  brand_owner text,
  private_label_owner text,
  category_id uuid not null references categories(id),
  subcategory_id uuid references categories(id),
  package_size numeric,
  package_unit text,
  comparable_unit text not null,
  comparable_quantity numeric,
  organic boolean default false,
  lactose_free boolean default false,
  gluten_free boolean default false,
  vegan boolean default false,
  image_url text,
  nutrition_source text,
  nutrition jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

retailer_products (
  id uuid primary key,
  chain_id uuid not null references chains(id),
  retailer_product_id text not null,
  product_id uuid references products(id),
  raw_name text not null,
  raw_brand text,
  raw_package_size text,
  product_url text,
  image_url text,
  match_confidence numeric not null default 0,
  reviewed_by_human boolean not null default false,
  active boolean not null default true,
  unique(chain_id, retailer_product_id)
);

product_aliases (
  id uuid primary key,
  raw_name text not null,
  source_type text not null,
  matched_product_id uuid references products(id),
  match_confidence numeric not null,
  reviewed_by_human boolean not null default false,
  created_at timestamptz not null default now()
);

product_equivalences (
  id uuid primary key,
  product_id uuid not null references products(id),
  equivalent_product_id uuid not null references products(id),
  match_mode text not null, -- exact, equivalent, smart_swap
  substitution_confidence text not null, -- high, medium, medium_low, low
  quality_risk text,
  reason text,
  created_at timestamptz not null default now(),
  unique(product_id, equivalent_product_id, match_mode)
);
```

### 6.3 Price observation model

Price observations are the central market-data fact table. Each row is one observed fact at one time from one source. Corrections are appended or represented by invalidation metadata; historical rows are not updated as the normal business path.

```sql
price_observations (
  id uuid primary key,
  product_id uuid references products(id),
  retailer_product_id uuid references retailer_products(id),
  store_id uuid references stores(id),
  chain_id uuid not null references chains(id),
  city_id uuid not null references cities(id),

  observed_at timestamptz not null,
  valid_from timestamptz,
  valid_to timestamptz,

  price numeric(12,2) not null,
  currency text not null,
  quantity numeric,
  package_unit text,
  unit_price numeric(12,4),
  unit_price_unit text, -- SEK/kg, SEK/liter, SEK/piece, SEK/roll, SEK/wash, SEK/diaper

  price_kind text not null, -- regular, promo, member, multi_buy_effective, receipt, shelf, estimated, unknown
  regular_price numeric(12,2),
  promo_price numeric(12,2),
  member_price numeric(12,2),
  regular_price_claimed numeric(12,2),
  discount_amount numeric(12,2),
  discount_pct numeric(8,4),
  promo_type text,
  multi_buy_quantity integer,
  multi_buy_price numeric(12,2),

  source_type text not null, -- official_api, retailer_page, receipt_scan, shelf_photo, flyer, manual_user_report, estimated, seed
  source_id uuid,
  source_url text,
  source_payload_hash text,
  parser_version text,

  is_online_price boolean not null default false,
  is_instore_price boolean not null default false,
  member_only boolean not null default false,
  in_stock boolean,

  source_confidence numeric not null,
  match_confidence numeric,
  confidence_score numeric not null,
  confidence_label text not null, -- high, medium_high, medium, low, estimated
  verification_status text not null default 'unverified', -- verified, receipt_verified, shelf_photo_verified, promo_only, estimated, disputed, rejected

  inserted_at timestamptz not null default now(),
  superseded_by uuid references price_observations(id),
  invalidated_at timestamptz,
  invalidation_reason text
);

create index price_observations_product_time_idx on price_observations(product_id, observed_at desc);
create index price_observations_store_time_idx on price_observations(store_id, observed_at desc);
create index price_observations_chain_city_time_idx on price_observations(chain_id, city_id, observed_at desc);
create index price_observations_source_hash_idx on price_observations(source_payload_hash);
```

#### Observation semantics

- `observed_at` is when the price was observed or fetched.
- `valid_from`/`valid_to` represent campaign validity where known; they are not a replacement for observations.
- `price` is the effective displayed price for `price_kind`.
- `unit_price` is normalized for comparison and indices.
- `regular_price_claimed` is stored separately because retailer claimed regular prices may need trust treatment.
- `member_only`, `is_online_price`, and `is_instore_price` are filters and chart labels, not afterthoughts.
- `source_confidence` measures source trust; `match_confidence` measures product matching; `confidence_score` is the combined trust score used by UI and calculations.
- Estimated rows are allowed for continuity but must be labelled and charted as dotted.

### 6.4 Promotion observations

```sql
promotion_observations (
  id uuid primary key,
  product_id uuid references products(id),
  retailer_product_id uuid references retailer_products(id),
  chain_id uuid not null references chains(id),
  store_id uuid references stores(id),
  city_id uuid references cities(id),
  promo_start timestamptz,
  promo_end timestamptz,
  promo_price numeric(12,2),
  regular_price_claimed numeric(12,2),
  promo_text text,
  member_only boolean not null default false,
  multi_buy_quantity integer,
  multi_buy_price numeric(12,2),
  source_type text not null,
  source_url text,
  source_payload_hash text,
  confidence_score numeric not null,
  created_at timestamptz not null default now()
);
```

### 6.5 Users, households, preferences, and privacy

```sql
users (
  id uuid primary key,
  email text unique,
  display_name text,
  preferred_locale text default 'sv-SE',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

households (
  id uuid primary key,
  name text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

household_members (
  household_id uuid references households(id),
  user_id uuid references users(id),
  role text not null,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

user_preferences (
  user_id uuid primary key references users(id),
  home_area_id uuid references districts(id),
  work_area_id uuid references districts(id),
  weekly_budget numeric(12,2),
  monthly_budget numeric(12,2),
  accept_private_label text default 'maybe', -- yes, no, maybe
  accept_budget_private_label boolean default false,
  include_member_prices boolean default true,
  preferred_language text default 'sv',
  preferred_currency text default 'SEK',
  notification_preferences jsonb,
  dietary_preferences jsonb,
  updated_at timestamptz not null default now()
);

favorite_stores (
  user_id uuid references users(id),
  store_id uuid references stores(id),
  label text, -- home, work, big_shopping, favorite, occasional_deal
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);
```

### 6.6 Watchlists and alerts

```sql
watchlist_items (
  id uuid primary key,
  user_id uuid not null references users(id),
  instrument_type text not null, -- product, category, index, basket
  product_id uuid references products(id),
  category_id uuid references categories(id),
  index_id uuid,
  target_price numeric(12,2),
  preferred_brands jsonb,
  accept_private_label text,
  organic_only boolean default false,
  alert_threshold numeric,
  favorite_stores_only boolean default false,
  stock_up_allowed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alert_rules (
  id uuid primary key,
  user_id uuid not null references users(id),
  watchlist_item_id uuid references watchlist_items(id),
  alert_type text not null, -- target_price, new_52w_low, hist_percentile, favorite_store_offer, deal_score, basket_total, index_move
  parameters jsonb not null,
  enabled boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

alert_events (
  id uuid primary key,
  alert_rule_id uuid not null references alert_rules(id),
  user_id uuid not null references users(id),
  triggered_at timestamptz not null,
  title text not null,
  body text not null,
  payload jsonb,
  delivery_status text not null default 'pending'
);
```

### 6.7 Weekly baskets and budgets

```sql
weekly_baskets (
  id uuid primary key,
  user_id uuid references users(id),
  household_id uuid references households(id),
  week_start date not null,
  status text not null default 'active',
  budget_amount numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

basket_items (
  id uuid primary key,
  basket_id uuid not null references weekly_baskets(id),
  product_id uuid references products(id),
  category_id uuid references categories(id),
  raw_text text,
  quantity numeric,
  quantity_unit text,
  preferred_brand_id uuid references brands(id),
  match_mode text default 'equivalent', -- exact, equivalent, smart_swap
  allow_private_label boolean default true,
  marked_bought boolean default false,
  bought_price numeric(12,2),
  bought_store_id uuid references stores(id),
  added_by uuid references users(id),
  created_at timestamptz not null default now()
);

basket_comparisons (
  id uuid primary key,
  basket_id uuid not null references weekly_baskets(id),
  compared_at timestamptz not null default now(),
  scope jsonb not null,
  options jsonb not null,
  best_option jsonb,
  missing_price_count integer,
  confidence_score numeric
);

budgets (
  id uuid primary key,
  user_id uuid references users(id),
  household_id uuid references households(id),
  budget_type text not null, -- weekly, monthly, category, household
  category_id uuid references categories(id),
  amount numeric(12,2) not null,
  currency text not null default 'SEK',
  mode text, -- strict, balanced, convenience_first, student, family, healthy
  active boolean not null default true
);
```

### 6.8 Receipts and community verification

```sql
receipt_uploads (
  id uuid primary key,
  user_id uuid not null references users(id),
  store_id uuid references stores(id),
  image_object_key text,
  ocr_status text not null default 'pending',
  receipt_datetime timestamptz,
  total_amount numeric(12,2),
  currency text default 'SEK',
  confidence_score numeric,
  user_reviewed boolean default false,
  created_at timestamptz not null default now()
);

receipt_lines (
  id uuid primary key,
  receipt_id uuid not null references receipt_uploads(id),
  raw_name text not null,
  product_id uuid references products(id),
  quantity numeric,
  item_total numeric(12,2),
  discounts numeric(12,2),
  member_price_visible boolean,
  match_confidence numeric,
  created_at timestamptz not null default now()
);

community_reports (
  id uuid primary key,
  user_id uuid references users(id),
  report_type text not null, -- price_report, shelf_photo, wrong_price, out_of_stock, product_match_correction
  product_id uuid references products(id),
  store_id uuid references stores(id),
  price numeric(12,2),
  object_key text,
  notes text,
  status text not null default 'pending',
  confidence_score numeric,
  created_at timestamptz not null default now()
);
```

### 6.9 Instruments, scores, indices, and time series

```sql
instruments (
  id uuid primary key,
  instrument_type text not null, -- product, category, chain, store, basket, index
  symbol text not null unique,
  name text not null,
  city_id uuid references cities(id),
  product_id uuid references products(id),
  category_id uuid references categories(id),
  chain_id uuid references chains(id),
  store_id uuid references stores(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

deal_scores (
  id uuid primary key,
  product_id uuid not null references products(id),
  store_id uuid references stores(id),
  city_id uuid not null references cities(id),
  calculated_at timestamptz not null,
  score integer not null check (score >= 0 and score <= 100),
  score_version text not null,
  historical_percentile numeric,
  current_city_percentile numeric,
  equivalent_unit_price_percentile numeric,
  discount_depth numeric,
  source_confidence numeric,
  user_relevance numeric,
  verdict text not null,
  explanation jsonb not null,
  sponsored_influence boolean not null default false
);

indices (
  id uuid primary key,
  instrument_id uuid not null references instruments(id),
  city_id uuid references cities(id),
  index_type text not null, -- city, district, chain, store, favorite_store, basket_type, brand_tier
  base_date date not null,
  base_value numeric not null default 100,
  methodology_version text not null,
  included_products jsonb not null,
  weighting_method text not null,
  confidence_label text not null,
  active boolean not null default true
);

instrument_timeseries_daily (
  instrument_id uuid not null references instruments(id),
  date date not null,
  value numeric not null,
  value_unit text,
  open_value numeric,
  high_value numeric,
  low_value numeric,
  close_value numeric,
  sample_count integer,
  confidence_score numeric,
  confidence_label text,
  metadata jsonb,
  primary key (instrument_id, date)
);
```

## 7. Deal Score and percentile model

### 7.1 Deal Score v1

Use the proposal's MVP formula until enough history exists:

```text
Deal Score v1 =
  40% current city percentile component
+ 25% known promo/history component
+ 20% unit price vs equivalent products component
+ 10% discount depth component
+  5% source confidence component
```

When sufficient product history exists, move to:

```text
35% historical percentile
25% current city percentile
20% unit price vs equivalent products
10% discount depth
 5% source confidence
 5% user relevance
```

Important invariants:

- Ads and sponsored offers must never change Deal Score, ranking, or verdict.
- Every score response must include an explanation list.
- The score must specify scope: all Stockholm, selected chains, selected district, favorite stores, or selected stores.
- Member-only prices can be included or excluded based on user settings and must be labelled.

### 7.2 Percentiles

Required percentile types:

- **Current city percentile:** current price compared with observed current prices across Stockholm stores.
- **Historical percentile:** current price compared with the product's own historical observed prices.
- **Category unit-price percentile:** unit price compared with equivalent products in the category.
- **Store price-level percentile:** store basket level compared with other stores.
- **Favorite-store percentile:** price compared only with the user's saved stores.
- **Basket percentile:** basket total compared with alternative basket totals in the selected scope.

Compute percentiles from normalized unit prices where appropriate, with filters for exact/equivalent/smart-swap matching, source confidence, member pricing, and online/in-store status.

## 8. Basket comparison architecture

The Basket Service should generate strategy options without travel-time optimization:

1. All items from one selected/favorite store.
2. All items from each selected chain.
3. Cheapest by product across selected/favorite stores.
4. Cheapest by category across selected/favorite stores.
5. Cheapest with private label substitutions.
6. Brand-locked items respected with substitutions only for flexible items.

Input scope must be explicit:

```json
{
  "storeIds": ["..."],
  "chainIds": ["..."],
  "favoriteStoresOnly": true,
  "maxStores": 2,
  "includeMemberPrices": false,
  "includePrivateLabel": "maybe",
  "verifiedOnly": false
}
```

Output should include total, savings breakdown, missing prices, confidence, and item-level recommendations. Distance/address can be shown as information but must not reduce savings or Deal Score in MVP.

## 9. MVP implementation sequence

1. Database migrations for chains, stores, products, retailer products, aliases, observations, users, favorite stores.
2. Seed Stockholm city, major chains, stores, MVP categories, and hero products.
3. Product and store APIs with search.
4. Price observation write path and current price materialized views.
5. Product ticker page data: current prices, history, percentiles, Deal Score v1.
6. Favorite stores and watchlist.
7. Weekly Basket and budget tracker.
8. Basket comparison across selected/favorite stores.
9. Market overview, top deals, basic heatmap, MVP indices.
10. Alerts for target price, Deal Score threshold, 52-week/lowest-percentile, basket total.
11. Mobile app shell with shared API client.
12. P1: barcode scan, receipt scan, household mode, personal grocery inflation.
13. P2: community verification, shelf photos, yellow sticker radar, B2B/API access, multi-city expansion.

## 10. MVP indices

Implement only a small TradingView-style set first:

- Stockholm Grocery Index.
- Stockholm Coffee Index.
- Stockholm Dairy Index.
- Stockholm Protein Index.
- Budget Basket Index.
- My Stores Basket Index.
- Private Label Index.

Index methodology:

- Base value = 100 on selected base date.
- Fixed basket methodology with equal weights inside each category.
- Normalize by comparable unit price.
- Separate regular, promo, member, online, in-store, exact, and equivalent data.
- Use source-confidence weighting where needed.
- Publish included products list and confidence label.

## 11. Security, privacy, and trust

- Encrypt receipt images and sensitive profile data at rest where practical.
- Use signed URLs for object access.
- Keep receipt images out of advertising systems.
- Support deletion of receipt history and full account data.
- Do not sell personal shopping data to advertisers.
- Use aggregated/anonymized analytics only.
- Label sponsored offers clearly.
- Keep recommendation ranking and Deal Score independent from ads.
- Show source type, last verified time, and confidence on price surfaces.
- Log access to sensitive receipt and household data.

## 12. Operational monitoring

Track product and data health, not only server health:

- Ingestion success/failure by source and chain.
- Parser error rate and parser version.
- Observations per day by chain/category/store.
- Product match confidence distribution.
- Percentage of current prices older than freshness SLA.
- Price outlier count and unresolved disputes.
- Alert dispatch success and deduplication rate.
- API latency for search, product page, market overview, and basket comparison.
- Coverage for MVP products/stores/categories.

## 13. Key architectural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Price storage | Append-only observations | Supports history, trust, auditability, charts, and reprocessing. |
| MVP backend | NestJS + TypeScript | Shares types with Next.js/React Native and supports modular API development. |
| Database | PostgreSQL + TimescaleDB + PostGIS | Relational catalog/user data, time-series pricing, geographic store queries. |
| API style | REST + OpenAPI | Simple, cacheable, mobile-friendly MVP API. |
| Search | PostgreSQL FTS/trigram first | Avoids early operational complexity; can migrate later. |
| Data confidence | First-class field on observations/read models | Required for trust, chart styling, and index quality. |
| Basket optimization | Selected-scope price comparison, no travel penalty | Matches proposal's explicit product decision. |
| Indices | Fixed-basket equal-weight MVP | Transparent, explainable, and feasible with limited early data. |
| Ads | Separate from scoring/ranking | Preserves trust; sponsored placements cannot affect Deal Score. |

## 14. Open questions for later lanes

1. Which retailer sources are legally and technically acceptable for automated ingestion in Sweden?
2. Should the MVP backend be pure TypeScript or split TypeScript API + Python data services from day one?
3. How much price freshness is required per category for a `High` confidence label?
4. Which exact hero products make up the first fixed index baskets?
5. What consent language is needed for receipts, household sharing, and anonymized analytics?
