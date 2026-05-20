# GroceryView Database Schema

Target runtime: PostgreSQL 18 with `postgis`, `pg_trgm`, and `pgcrypto`.

The migrations in `migrations/*.sql` store grocery prices as immutable observations and add repository support tables for app workflows. `latest_prices` is a derived lookup table and must not be treated as the source of truth.

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

Indexes: `stores_position_gix` for location queries, plus `stores_name_trgm_idx` and `stores_slug_trgm_idx` for fuzzy store search.

### `products`

Canonical product records used by search, charts, baskets, and matching.

Key columns: `slug`, `canonical_name`, `brand`, `brand_owner`, `private_label_owner`, `barcode`, `category_path`, package fields, `comparable_unit`, `nutrition`, `image_url`.

Indexes: `products_name_trgm_idx` and `products_slug_trgm_idx` for fuzzy product search.

### `aliases`

Retailer, receipt, community, imported, or manual names that may resolve to canonical products.

Key columns: `product_id`, `alias`, `normalized_alias`, `source_type`, `source_ref`, `match_confidence`, `reviewed_at`.

Indexes: `aliases_normalized_trgm_idx` for fuzzy alias matching.

### `source_runs`

One ingestion attempt from an official public API, retailer API, page scrape, leaflet, OCR run, community report, or manual seed. Open Prices imports use `official_api` so public, license-aware pulls stay distinct from retailer-specific connectors.

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

### `subscription_entitlements`

Provider-neutral account entitlement state for premium subscription enforcement.

Key columns: `user_id`, `tier`, `plan`, `status`, `current_period_ends_at`, `provider`, `provider_customer_id`, `provider_subscription_id`, `updated_at`.

The table stores billing-provider identifiers only. Payment card numbers, CVCs, payment method secrets, and checkout client secrets must remain outside GroceryView storage.

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

### `alert_rules`

Application repository alert rules keyed by the text `app_users` identity used by current API and worker packages.

Key columns: `user_id`, `product_id`, `store_id`, `channel`, `alert_type`, `target_price`, `deal_score_threshold`, `active`.

Indexes: `alert_rules_active_user_idx` for account alert-center reads and `alert_rules_store_idx` for store-scoped alert fanout.

### `app_users`

Legacy app repository user records used by existing package contracts while API-facing work moves to canonical `users`.

Key columns: `email`, `created_at`, `updated_at`.

### `favorite_stores`

Legacy app repository favorite-store links.

Key columns: `user_id`, `store_id`, `created_at`.

Primary key: `(user_id, store_id)`.

### `user_preferences`

Legacy app repository budget preferences.

Key columns: `user_id`, `weekly_budget`, `monthly_budget`, `updated_at`.

### `watchlist_items`

Legacy app repository watchlist rows used by existing package APIs.

Key columns: `user_id`, `product_id`, `target_price`, `alert_deal_score_at`, `favorite_stores_only`.

### `weekly_baskets`

Legacy app repository basket headers.

Key columns: `user_id`, `week_start`, `created_at`, `updated_at`.

Unique key: `(user_id, week_start)`.

### `basket_items`

Legacy app repository basket lines.

Key columns: `basket_id`, `product_id`, `quantity`, `created_at`.

### `human_review_assignments`

Operational queue entries for product-match and community-report review.

Key columns: `review_id`, `subject_type`, `subject_id`, `priority`, `reason`, `assignee_id`, `assigned_at`, `due_at`, `status`.

### `human_reviewers`

Reviewer identity and role state for the human review queue.

Key columns: `role`, `active`, `created_at`, `updated_at`.

### `community_reporter_trust`

Rate-limit and trust counters for community price reporters.

Key columns: `reports_last_24_hours`, `pending_reports`, `accepted_reports_last_30_days`, `rejected_reports_last_30_days`, `updated_at`.

### `notification_tasks`

Scheduled push/email notification work items.

Key columns: `channel`, `type`, `title`, `body`, `priority`, `send_at`, `recipient`, `attempt_count`, `max_attempts`, `status`.

### `notification_suppressions`

Recipient suppression records for unsubscribe, bounce, and complaint handling.

Key columns: `recipient`, `channel`, `reason`, `active`, `updated_at`.

### `subscription_entitlements`

Provider-neutral premium subscription entitlement state.

Key columns: `user_id`, `tier`, `plan`, `status`, `current_period_ends_at`, `provider`, `provider_customer_id`, `provider_subscription_id`, `updated_at`.

Stored billing provider identifiers are not payment credentials. Card data, CVCs, payment method secrets, and checkout client secrets stay outside GroceryView storage.
