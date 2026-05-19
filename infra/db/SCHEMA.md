# GroceryView Infrastructure Database Schema

This schema targets PostgreSQL 18 with PostGIS and pg_trgm enabled by
`infra/db/migrations/001_groceryview_pg18_foundation.sql`.

All price-like records preserve provenance. `price_type` distinguishes shelf,
promotion, member, online, estimated, and crowd-reported values. `confidence`
is a 0-1 score, `observed_at` is the source observation timestamp, and
`provenance` is JSONB containing source identifiers, fetch metadata, and
normalization notes.

## Extensions

- `postgis`: store coordinates as `geography(point, 4326)` and index stores.
- `pg_trgm`: fuzzy product and alias lookup.

## Tables

### chains

Retailer chain registry. Columns: `id`, `name`, `country_code`, `website_url`,
`created_at`, `updated_at`.

### stores

Physical or online store locations. Columns: `id`, `chain_id`, `name`,
`address`, `city`, `region`, `country_code`, `location`, `opening_hours`,
`retailer_store_id`, `is_online`, `provenance`, `created_at`, `updated_at`.
`location` uses PostGIS geography.

### products

Canonical grocery product catalog. Columns: `id`, `barcode`, `canonical_name`,
`brand`, `category`, `package_size`, `package_unit`, `comparable_unit`,
`image_url`, `attributes`, `provenance`, `created_at`, `updated_at`.

### aliases

Product aliases from barcodes, retailer names, search names, and receipts.
Columns: `id`, `product_id`, `alias`, `alias_type`, `source_type`,
`confidence`, `observed_at`, `provenance`.

### users

Application users. Columns: `id`, `email`, `display_name`,
`preferred_currency`, `locale`, `created_at`, `updated_at`.

### watchlists

User product or query watchlists. Columns: `id`, `user_id`, `product_id`,
`query`, `target_price`, `price_type`, `created_at`.

### baskets

Shopping baskets. Columns: `id`, `user_id`, `name`, `budget_id`, `status`,
`created_at`, `updated_at`.

### basket_items

Basket line items. Columns: `id`, `basket_id`, `product_id`, `raw_name`,
`quantity`, `unit`, `created_at`.

### budgets

Weekly or monthly budget periods. Columns: `id`, `user_id`, `period`, `amount`,
`currency`, `starts_on`, `ends_on`, `created_at`.

### source_runs

One ingestion or import run. Columns: `id`, `source_type`, `source_name`,
`started_at`, `finished_at`, `status`, `fetched_record_count`, `provenance`,
`error_message`, `created_at`.

### raw_records

Immutable fetched payloads. Columns: `id`, `source_run_id`, `source_type`,
`source_record_id`, `fetched_at`, `payload`, `payload_hash`, `provenance`,
`created_at`.

### observations

Immutable product price observations. Columns: `id`, `product_id`, `store_id`,
`chain_id`, `source_run_id`, `raw_record_id`, `observed_at`, `price`,
`unit_price`, `currency`, `price_type`, `regular_price`, `promotion_label`,
`member_only`, `confidence`, `source_type`, `source_url`, `provenance`,
`created_at`.

`price_observations` is a compatibility view over `observations`.

### latest_prices

Derived current-price read model keyed by product, chain, price type, and
store. Columns: `id`, `product_id`, `store_id`, `chain_id`,
`observation_id`, `observed_at`, `price`, `unit_price`, `currency`,
`price_type`, `confidence`, `source_type`, `provenance`, `updated_at`.

### alerts

User alert rules for price, promotion, stock, and budget signals. Columns:
`id`, `user_id`, `product_id`, `watchlist_id`, `alert_type`,
`threshold_price`, `price_type`, `channel`, `active`, `last_triggered_at`,
`provenance`, `created_at`, `updated_at`.

## Provenance Contract

`stores`, `products`, `aliases`, `source_runs`, `raw_records`,
`observations`, `latest_prices`, and `alerts` contain a `provenance`
JSONB column. Price consumers must display `price_type`, `confidence`, and
`observed_at` whenever they present a value from `observations` or
`latest_prices`; estimated and crowd-reported values must not be labeled as
official shelf prices.
