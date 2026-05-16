# GroceryView Database Schema

This directory contains the PostgreSQL/PostGIS schema for the Stockholm MVP. The design follows the project rule that prices and promotions are append-only observations; fast current prices and chart series are maintained as read-model tables derived from those observations.

## Migrations

- `001_extensions.sql` enables `postgis`, `pg_trgm`, and `btree_gist`.
- `002_init.sql` creates enums and core tables.
- `003_indexes.sql` creates spatial, search, time-series, and user-list indexes.
- `004_partition_maintenance.sql` adds the reusable monthly `price_observations` partition maintenance function and extends the deterministic MVP partition window.
- `seeds/001_stockholm_seed.sql` inserts Stockholm, MVP launch chains, and 20 hero products.

## Enum semantics

- `price_type`: `regular`, `promotion`, `member`, `online`, `in_store`, `clearance`, `estimated`. Use this to distinguish regular shelf prices, campaigns, member-only prices, online-only prices, and low-confidence estimates.
- `source_type`: `retailer_page`, `retailer_api`, `flyer`, `receipt`, `shelf_photo`, `manual_admin`, `open_data`, `estimated`. Every price-like row records where the data came from.
- `confidence_band`: `verified`, `high`, `medium`, `low`, `estimated`. UI can render solid lines for verified/high observations and dotted styling for estimated/low-confidence data.
- `observation_status`: `pending`, `accepted`, `rejected`, `superseded`. Used for ingestion run state and individual observation QA.
- `alert_status`: `active`, `paused`, `triggered`, `expired`, `deleted`.
- `moderation_status`: `open`, `in_review`, `approved`, `rejected`, `merged`.
- `receipt_status`: `uploaded`, `processing`, `parsed`, `failed`, `reviewed`.

## Tables and columns

### `cities`
Primary key: `id`. Unique: `(name, country_code)`.

Columns: `id`, `name`, `country_code`, `currency_code`, `timezone`, `locale`, `created_at`.

Represents city launch markets. Stockholm is seeded first, while country, currency, timezone, and locale keep the schema expansion-ready.

### `chains`
Primary key: `id`. Unique: `name`, `slug`.

Columns: `id`, `name`, `slug`, `country_code`, `website_url`, `created_at`.

Represents grocery chains such as ICA, Willys, Coop, Hemköp, Lidl, and City Gross.

### `stores`
Primary key: `id`. Foreign keys: `chain_id -> chains.id`, `city_id -> cities.id`. Unique: `slug`, `(chain_id, retailer_store_id)`.

Columns: `id`, `chain_id`, `city_id`, `name`, `slug`, `address`, `district`, `postal_code`, `latitude`, `longitude`, `location`, `retailer_store_id`, `opening_hours`, `is_active`, `created_at`, `updated_at`.

`location` is `geography(Point, 4326)` for PostGIS radius/district filters. Distance may be displayed as user information but is intentionally not a Deal Score input in MVP.

### `products`
Primary key: `id`. Unique: `ean`, `slug`.

Columns: `id`, `ean`, `name`, `slug`, `brand`, `category`, `subcategory`, `unit`, `unit_size`, `unit_quantity_text`, `package_size`, `nutrition`, `image_url`, `is_private_label`, `created_at`, `updated_at`.

Canonical product catalog. `unit` and `unit_size` enable unit-price normalization across package sizes.

### `product_aliases`
Primary key: `id`. Foreign key: `product_id -> products.id`. Unique: `(product_id, alias)`.

Columns: `id`, `product_id`, `alias`, `source_type`, `created_at`.

Stores retailer names, OCR names, abbreviations, and localized aliases for product matching. `alias` has a trigram index.

### `product_equivalence_groups`
Primary key: `id`.

Columns: `id`, `name`, `category`, `description`, `created_at`.

Groups products that can be compared or substituted, such as private-label alternatives.

### `product_equivalence_members`
Primary key: `(group_id, product_id)`. Foreign keys: `group_id -> product_equivalence_groups.id`, `product_id -> products.id`.

Columns: `group_id`, `product_id`, `equivalence_score`, `created_at`.

Join table that scores how interchangeable a product is within a group.

### `source_runs`
Primary key: `id`.

Columns: `id`, `source_type`, `source_name`, `started_at`, `finished_at`, `status`, `parser_version`, `metadata`.

Tracks ingestion/parser executions and supports lineage from observations back to the run that produced them.

### `source_records_raw`
Primary key: `id`. Foreign key: `source_run_id -> source_runs.id`. Unique: `record_hash`.

Columns: `id`, `source_run_id`, `source_type`, `source_url`, `storage_uri`, `record_hash`, `payload`, `fetched_at`, `parser_version`, `confidence_score`.

Stores raw or object-storage-backed source records. Canonical observations reference these rows via `raw_record_id`.

### `price_observations`
Primary key: `(id, observed_at)` so PostgreSQL can enforce uniqueness on the `observed_at` range-partitioned table. Foreign keys: `product_id -> products.id`, `store_id -> stores.id`, `city_id -> cities.id`, `chain_id -> chains.id`, `source_run_id -> source_runs.id`, `raw_record_id -> source_records_raw.id`.

Columns: `id`, `product_id`, `store_id`, `city_id`, `chain_id`, `price_type`, `price_sek`, `regular_price_sek`, `member_price_sek`, `unit_price_sek`, `unit_price_unit`, `currency_code`, `observed_at`, `valid_from`, `valid_to`, `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `parser_version`, `confidence_score`, `confidence_band`, `status`, `created_at`.

Immutable event table for every observed price. SEK prices use `numeric(12,2)`. Unit prices are preserved separately in `unit_price_sek` and `unit_price_unit` so charts and comparisons can show package price and normalized unit price. The table is range-partitioned monthly by `observed_at` with seed partitions for May-August 2026 plus a default partition for backfills/future rows until automated partition maintenance exists.

### `promotion_observations`
Primary key: `id`. Foreign keys mirror `price_observations`.

Columns: `id`, `product_id`, `store_id`, `city_id`, `chain_id`, `promo_price_sek`, `regular_price_sek`, `unit_price_sek`, `unit_price_unit`, `promo_start`, `promo_end`, `member_only`, `promotion_text`, `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, `confidence_score`, `confidence_band`, `status`, `created_at`.

Immutable promotion table for flyers, campaign pages, member offers, and shelf-photo promo reports.

### `latest_store_prices`
Primary key: `id`. Foreign keys: product/store/city/chain plus optional source lineage and composite `price_observation_id`/`price_observation_observed_at -> price_observations(id, observed_at)`. Unique: `(product_id, store_id)`.

Columns: `id`, `product_id`, `store_id`, `city_id`, `chain_id`, `price_observation_id`, `price_observation_observed_at`, `price_type`, `price_sek`, `regular_price_sek`, `member_price_sek`, `unit_price_sek`, `unit_price_unit`, `observed_at`, `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `parser_version`, `confidence_score`, `confidence_band`, `updated_at`.

Current-price read model updated from immutable observations. It is a table rather than a source of truth.

### `price_series_daily`
Primary key: `id`. Foreign keys: product/city/store/chain. Unique: `(product_id, city_id, store_id, chain_id, series_date, price_type)`.

Columns: `id`, `product_id`, `city_id`, `store_id`, `chain_id`, `series_date`, `price_type`, `min_price_sek`, `median_price_sek`, `max_price_sek`, `best_price_sek`, `unit_price_sek`, `observation_count`, `confidence_band`, `updated_at`.

Daily chart rollup for product, city, chain, and optional store scopes.

### `index_snapshots`
Primary key: `id`. Foreign keys: `city_id -> cities.id`, optional `chain_id`, optional source lineage. Unique: `(city_id, index_key, snapshot_date)`.

Columns: `id`, `city_id`, `index_key`, `index_name`, `category`, `chain_id`, `snapshot_date`, `value`, `change_7d_pct`, `change_30d_pct`, `source_type`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, `confidence_score`, `confidence_band`, `created_at`.

Stores GroceryView market/index time series such as category indices or chain price-level indices.

### `users`
Primary key: `id`. Unique: `email`. Foreign key: `home_city_id -> cities.id`.

Columns: `id`, `email`, `display_name`, `home_city_id`, `created_at`, `updated_at`.

Minimal product-user table. It intentionally does not store password or auth-provider details yet.

### `favorite_stores`
Primary key: `(user_id, store_id)`. Foreign keys: `user_id -> users.id`, `store_id -> stores.id`.

Columns: `user_id`, `store_id`, `created_at`.

User-selected stores used to scope market views and alerts.

### `watchlist_items`
Primary key: `id`. Foreign keys: `user_id -> users.id`, `product_id -> products.id`. Unique: `(user_id, product_id)`.

Columns: `id`, `user_id`, `product_id`, `target_price_sek`, `threshold_pct`, `include_member_prices`, `status`, `created_at`, `updated_at`.

TradingView-style product watchlist rows with price/percent alert settings.

### `weekly_baskets`
Primary key: `id`. Foreign keys: `user_id -> users.id`, optional `city_id -> cities.id`. Unique: `(user_id, week_start, name)`.

Columns: `id`, `user_id`, `name`, `week_start`, `city_id`, `budget_sek`, `created_at`, `updated_at`.

Weekly shopping-list/basket header, optionally tied to a user budget.

### `basket_items`
Primary key: `id`. Foreign keys: `weekly_basket_id -> weekly_baskets.id`, `product_id -> products.id`. Unique: `(weekly_basket_id, product_id)`.

Columns: `id`, `weekly_basket_id`, `product_id`, `quantity`, `unit`, `is_checked`, `created_at`, `updated_at`.

Line items in a weekly basket.

### `budgets`
Primary key: `id`. Foreign keys: `user_id -> users.id`, optional `city_id -> cities.id`.

Columns: `id`, `user_id`, `city_id`, `period`, `amount_sek`, `category`, `starts_on`, `ends_on`, `created_at`, `updated_at`.

Weekly or monthly budget settings, optionally category-specific.

### `alerts`
Primary key: `id`. Foreign keys: `user_id -> users.id`, optional `watchlist_item_id`, optional `product_id`, optional `city_id`.

Columns: `id`, `user_id`, `watchlist_item_id`, `product_id`, `city_id`, `threshold_price_sek`, `threshold_pct`, `status`, `last_triggered_at`, `created_at`, `updated_at`.

Alert definitions for watched products or product/city price triggers.

### `alert_deliveries`
Primary key: `id`. Foreign key: `alert_id -> alerts.id`.

Columns: `id`, `alert_id`, `channel`, `status`, `payload`, `delivered_at`, `created_at`.

Delivery log for push/email/SMS/in-app notifications.

### `receipt_uploads`
Primary key: `id`. Foreign keys: optional `user_id`, `store_id`, `city_id`, `source_run_id`, and `raw_record_id`.

Columns: `id`, `user_id`, `store_id`, `city_id`, `object_uri`, `receipt_date`, `total_sek`, `status`, `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, `confidence_score`, `confidence_band`, `created_at`.

User receipt images/OCR artifacts for analytics and community verification. Receipt payloads live in object storage.

### `receipt_line_items`
Primary key: `id`. Foreign keys: `receipt_upload_id -> receipt_uploads.id`, optional `product_id -> products.id`.

Columns: `id`, `receipt_upload_id`, `product_id`, `raw_name`, `quantity`, `unit`, `line_price_sek`, `unit_price_sek`, `confidence_score`, `created_at`.

Parsed receipt lines, including raw OCR text and optional product match.

### `shelf_photo_reports`
Primary key: `id`. Foreign keys: optional `user_id`, `product_id`, `store_id`, `source_run_id`, and `raw_record_id`.

Columns: `id`, `user_id`, `product_id`, `store_id`, `object_uri`, `reported_price_sek`, `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, `confidence_score`, `confidence_band`, `status`, `created_at`.

Community shelf-photo evidence for price verification and moderation.

### `moderation_queue`
Primary key: `id`. Foreign key: optional `assigned_to_user_id -> users.id`.

Columns: `id`, `entity_type`, `entity_id`, `reason`, `status`, `assigned_to_user_id`, `resolution_note`, `created_at`, `updated_at`.

Generic moderation queue for ambiguous product matches, wrong-price reports, receipts, and shelf photos.

## Indexes

Important indexes include:

- `stores_location_gist_idx`: GiST index on `stores.location` for PostGIS radius filters.
- `products_name_trgm_idx`: GIN trigram index on product names.
- `product_aliases_alias_trgm_idx`: GIN trigram index on aliases.
- `price_observations_product_city_observed_idx`: product/city history lookup ordered by latest observation.
- `price_observations_store_observed_idx`: store history lookup ordered by latest observation.
- `promotion_observations_product_dates_idx`: promotion lookup by product and campaign dates.
- `latest_store_prices_product_store_idx`: current price lookup for a product at a store.
- `watchlist_items_user_product_idx`: watchlist lookup by user and product.
- `basket_items_basket_product_idx`: basket lookup by basket and product.

## Partitioning

`price_observations` is implemented as a native PostgreSQL range-partitioned table using `PARTITION BY RANGE (observed_at)`. The initial migration creates monthly partitions for the first MVP development window:

- `price_observations_2026_05`: `2026-05-01` inclusive to `2026-06-01` exclusive.
- `price_observations_2026_06`: `2026-06-01` inclusive to `2026-07-01` exclusive.
- `price_observations_2026_07`: `2026-07-01` inclusive to `2026-08-01` exclusive.
- `price_observations_2026_08`: `2026-08-01` inclusive to `2026-09-01` exclusive.
- `price_observations_2026_09`: `2026-09-01` inclusive to `2026-10-01` exclusive.
- `price_observations_2026_10`: `2026-10-01` inclusive to `2026-11-01` exclusive.
- `price_observations_2026_11`: `2026-11-01` inclusive to `2026-12-01` exclusive.
- `price_observations_default`: fallback for backfills and future rows before scheduled maintenance creates the exact monthly child table.

The parent indexes in `003_indexes.sql` create partitioned indexes for product/city history, store history, source-run lineage, and raw-record lineage. Migration `004_partition_maintenance.sql` creates `ensure_price_observation_partitions(months_ahead, months_behind, anchor_date)`, which workers/operators can call from scheduled maintenance before each month starts. For example, call `SELECT * FROM ensure_price_observation_partitions(6, 1, CURRENT_DATE);` to ensure partitions from one month behind through six months ahead. The function raises if rows for a missing month have already landed in `price_observations_default`; in that case, first move the matching default rows into staging in a controlled maintenance window, create the month partition, and then reinsert/replay the staged rows through the partitioned parent.

Apply the same pattern later to `promotion_observations` if campaign volume requires it.

## Price and provenance semantics

- Observation tables are append-only. Do not update old rows to represent a changed price; insert a new observation.
- `price_sek`, `regular_price_sek`, `member_price_sek`, `promo_price_sek`, and receipt totals are `numeric(12,2)`.
- `unit_price_sek` and `unit_price_unit` store normalized unit pricing separately from package pricing.
- `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, and `confidence_score` are the required provenance fields for price/promotion/read-model rows.
- `latest_store_prices`, `price_series_daily`, and `index_snapshots` are derived read models. The immutable source of truth is the observation/source lineage.

## Deal Score note: travel time

Travel time and transport cost are not stored as Deal Score ranking factors for the MVP. The product proposal explicitly says users may willingly travel when savings are meaningful. GroceryView should show scope filters such as selected stores, district, radius, favorite stores, or chain, and may display distance as context, but the database does not encode a travel-time penalty in price ranking.
