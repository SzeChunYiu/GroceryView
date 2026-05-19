# GroceryView Database Schema

Target runtime: PostgreSQL 18 with `postgis`, `pg_trgm`, and `pgcrypto`.

The migration in `migrations/001_groceryview_schema.sql` stores grocery prices as immutable observations. `latest_prices` is a derived lookup table and must not be treated as the source of truth.

## Extensions

- `pgcrypto`: UUID generation with `gen_random_uuid()`.
- `postgis`: store geospatial store coordinates with `geography(point, 4326)`.
- `pg_trgm`: product and alias fuzzy matching indexes.

## Provenance Model

Price and ingestion records expose provenance directly:

- `source_runs.provenance`: run-level metadata such as collector version, schedule, retailer scope, HTTP metadata, and operator notes.
- `raw_records.provenance`: raw payload metadata such as fetch URL, capture timestamp, parser version, and source checksum.
- `observations.provenance`: normalized price metadata such as extraction rule, original displayed price, campaign identifiers, and review notes.
- `latest_prices.provenance`: copied from the winning observation so API callers can show source context without joining.

Every price-bearing row carries `price_type`, `confidence`, `observed_at`, and `provenance` either directly or through its referenced observation.

## Partitioning Plan

`observations` is intentionally kept as a single table for the first migration so early API and worker lanes can integrate without partition-management code. When write volume requires partitioning, add a follow-up migration that:

1. creates `observations_v2 partition by range (observed_at)`,
2. creates monthly partitions named `observations_YYYY_MM`,
3. recreates the product/time, store/time, price type/time, and provenance indexes on each partition,
4. backfills from `observations`,
5. swaps read/write code to `observations_v2`.

The same pattern can be reused for long-term raw payload retention in `raw_records` if retailer capture volume grows faster than normalized observations.

## Deal Score Boundary

The schema stores store location in `stores.position` for map and trip-planning features. Distance or travel time must not be stored as an input to default Deal Score ranking. Deal Score should use price history, discount depth, confidence, and provenance; distance can be applied later as an explicit user-side filter or trip-planning sort.

## Tables

### `chains`

Retail banners such as ICA, Willys, Coop, Lidl, Hemkop, and City Gross.

Key columns: `slug`, `name`, `country_code`, `website_url`.

### `stores`

Physical or online stores belonging to a chain.

Key columns: `chain_id`, `slug`, `external_ref`, address fields, `position`, `store_type`, `opening_hours`, `online_order_url`.

Indexes: `stores_position_gix` for location queries.

### `products`

Canonical product records used by search, charts, baskets, and matching.

Key columns: `slug`, `canonical_name`, `brand`, `brand_owner`, `private_label_owner`, `barcode`, `category_path`, package fields, `comparable_unit`, `nutrition`, `image_url`.

Indexes: `products_name_trgm_idx` for fuzzy product search.

### `aliases`

Retailer, receipt, community, imported, or manual names that may resolve to canonical products.

Key columns: `product_id`, `alias`, `normalized_alias`, `source_type`, `source_ref`, `match_confidence`, `reviewed_at`.

Indexes: `aliases_normalized_trgm_idx` for fuzzy alias matching.

### `source_runs`

One ingestion attempt from a retailer API, page scrape, leaflet, OCR run, community report, or manual seed.

Key columns: `source_type`, `source_name`, `source_url`, `started_at`, `finished_at`, `status`, `provenance`, `error_message`.

Indexes: `source_runs_status_started_idx`.

### `raw_records`

Raw payloads captured during ingestion before normalization.

Key columns: `source_run_id`, `record_type`, `external_ref`, `observed_at`, `payload`, `payload_hash`, `provenance`.

Indexes: `raw_records_payload_gin_idx`.

### `observations`

Immutable normalized price facts. This is the canonical table for historical charts and price provenance.

Key columns: `product_id`, `chain_id`, `store_id`, `source_run_id`, `raw_record_id`, `retailer_product_ref`, `price_type`, `price`, `regular_price`, `unit_price`, `currency`, `quantity`, `quantity_unit`, promotion fields, `member_required`, `observed_at`, validity window fields, `confidence`, `provenance`.

Allowed `price_type` values: `shelf`, `online`, `member`, `promotion`, `receipt`, `community`, `estimated`.

Indexes: product/time, store/time, price type/time, and provenance GIN.

### `latest_prices`

Materialized latest price lookup for API and UI reads. Each row references the observation that won the rollup.

Key columns: `product_id`, `chain_id`, `store_id`, `price_type`, `observation_id`, `price`, `regular_price`, `unit_price`, `currency`, `observed_at`, `confidence`, `provenance`, `updated_at`.

Primary key: `(product_id, chain_id, store_id, price_type)`.

### `users`

Application user profile data.

Key columns: `email`, `display_name`, `home_store_id`, `preferred_currency`, `dietary_preferences`.

### `watchlists`

User watchlists for product or category target prices.

Key columns: `user_id`, `name`, `product_id`, `category_path`, `target_price`, `favorite_stores_only`, `include_member_prices`.

Indexes: `watchlists_user_idx`.

### `baskets`

Weekly basket planning records. Items are kept in `items` JSON until the product contract stabilizes.

Key columns: `user_id`, `name`, `week_start`, `status`, `items`.

Indexes: `baskets_user_week_idx`.

### `budgets`

Weekly or monthly user budgets, optionally scoped to a category path.

Key columns: `user_id`, `period`, `amount`, `currency`, `category_path`, `starts_on`, `ends_on`.

Indexes: `budgets_user_period_idx`.

### `alerts`

User alert rules for target prices, Deal Score thresholds, stock, or price drops.

Key columns: `user_id`, `watchlist_id`, `product_id`, `store_id`, `alert_type`, `target_price`, `deal_score_threshold`, `active`, `last_triggered_at`.

Indexes: `alerts_active_user_idx`.
