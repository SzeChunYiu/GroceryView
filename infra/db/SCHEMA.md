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
- `retailer_source_policies.provenance`: source-policy metadata such as robots crawl evidence, reviewer, policy matrix version, and source-policy notes.
- `observations.provenance`: normalized price metadata such as extraction rule, original displayed price, campaign identifiers, and review notes.
- `latest_prices.provenance`: copied from the winning observation so API callers can show source context without joining.
- `fuel_price_sources.provenance`: source-level fuel evidence such as operator page, crowd reporter metadata, legal review, and policy notes.
- `fuel_price_source_observations`: links fuel source evidence to immutable `domain='fuel'` observations while preserving the original source price text.

Every price-bearing row carries `price_type`, `confidence`, `observed_at`, and `provenance` either directly or through its referenced observation.
Fuel-domain rows carry litre unit prices through immutable `domain = fuel` observations and fuel source links.

## Partitioning Plan

Migration 013 builds the first time-series partition lane without breaking existing `latest_prices` foreign keys:

1. `observations` remains the canonical immutable write table for current adapters.
2. `observations_v2` is a mirror table partitioned by range on `observed_at`.
3. Monthly range partitions are named `observations_YYYY_MM` and can be pre-created with `create_observations_partitions(window_start, months_ahead)`.
4. `ensure_observations_monthly_partition(partition_month)` auto-creates the matching month before trigger-synced writes land.
5. Each monthly partition carries product/time, store/time, price type/time, domain/time, provenance GIN, and BRIN indexes. BRIN keeps append-only time pruning cheap at large row counts.
6. `drop_observations_partitions_before(cutoff_month)` is the retention tiering hook: operators can archive a month, then perform retention by partition drop instead of row deletes.

The same monthly range partition and retention by partition drop pattern can be reused for long-term raw payload retention in `raw_records` if retailer capture volume grows faster than normalized observations.

## Deal Score Boundary

The schema stores store location in `stores.position` for map and trip-planning features. Distance or travel time must not be stored as an input to default Deal Score ranking. Deal Score should use price history, discount depth, confidence, and provenance; distance can be applied later as an explicit user-side filter or trip-planning sort.

## Multi-Vertical Price Domain Model

Migration 011 adds a `domain` column to `chains`, `stores`, `products`, `observations`, and `latest_prices`. Existing rows default to `grocery`; future verticals are constrained to `fuel` and `pharmacy` until a later migration expands the supported set. This keeps matching domain-scoped: grocery uses EAN + commodity matching, fuel uses fuel grades, and pharmacy uses OTC/health EANs. Public routes must not render non-grocery prices until `observations.domain` has connector or trusted crowd rows for that vertical.

Migration 014 adds the fuel source contract. `fuel_grades` is the only supported grade catalog for the current fuel lane: 95 E10, 98, diesel, HVO100, and E85. `fuel_price_sources` accepts either an operator public price page or a trusted crowd station report, and `fuel_price_source_observations` ties that source evidence to immutable `domain='fuel'` observations with the original price text. Fuel prices are always price per litre; estimated fuel rows are not part of this source model.

## Tables

### `chains`

Retail banners such as ICA, Willys, Coop, Lidl, Hemkop, Netto, and City Gross.

Key columns: `slug`, `name`, `domain`, `country_code`, `website_url`.

### `stores`

Physical or online stores belonging to a chain.

Key columns: `chain_id`, `slug`, `domain`, `external_ref`, address fields, `position`, `store_type`, `opening_hours`, `online_order_url`.

Indexes: `stores_position_gix` for location queries, plus `stores_name_trgm_idx` and `stores_slug_trgm_idx` for fuzzy store search.

### `products`

Canonical product records used by search, charts, baskets, and matching.

Key columns: `slug`, `canonical_name`, localized display names (`name_sv`, `name_en`), `domain`, `brand`, `brand_owner`, `private_label_owner`, `barcode`, `category_path`, package fields, `comparable_unit`, `nutrition`, `image_url`. Commodity columns (migration 010): `product_kind` (`branded`|`commodity`), `commodity_id`, `variant`, `is_organic`, `origin_country`. Fuel column (migration 014): `fuel_grade_id`.

Indexes: `products_name_trgm_idx`, `products_name_sv_trgm_idx`, `products_name_en_trgm_idx`, and `products_slug_trgm_idx` for fuzzy product search; `products_commodity_idx` and `products_kind_idx` for commodity matching.

### `commodities`

Canonical generic products for unbranded / loose items (meat, vegetables, fruit, bakery, bulk) that have no EAN and are sold by weight. Chain loose items map here via `products.commodity_id`; cross-chain comparison is on `unit_price` (kr/kg, kr/l, kr/st), not barcode. `is_staple` marks the representative basket behind the per-chain fresh-food index. Starter taxonomy: `packages/catalog/src/commodities.ts`.

Key columns: `slug`, `name_sv`, `name_en`, `category_path`, `comparable_unit` (`kg`|`l`|`st`), `default_variant`, `is_staple`.

### `fuel_grades`

Canonical fuel products for the fuel vertical. Fuel grades are matched by grade id, not EAN or grocery commodity alias, and every supported grade compares on litres only.

Key columns: `id`, `grade_code`, `label`, `comparable_unit`, `match_key`, `active`.

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

### `retailer_source_policies`

Per-chain source policy decisions for store locator, offer, product, search, basket, account, member, and app/API surfaces. Workers should read this table before attempting source access so blocked, manual-review, fixture-review, and stub-only surfaces fail closed before any fetch.

Key columns: `chain_id`, `source_surface`, `policy_label`, `robots_url`, `disallowed_path_matches`, `crawl_delay_seconds`, `legal_review_status`, `source_url`, `provenance`, `reviewed_at`, `updated_at`.

Allowed `policy_label` values: `allowed`, `fixture_review`, `manual_review`, `blocked`, `stub_only`.

Indexes: `retailer_source_policies_label_review_idx`, `retailer_source_policies_disallowed_gin_idx`, and `retailer_source_policies_provenance_gin_idx`.

### `fuel_price_sources`

Source rows accepted by the fuel lane before facts are linked to observations. Operator rows require `operator_id`, `operator_name`, `source_url`, `parser_version`, and `captured_at`. Crowd rows require `station_id`, `reporter_id`, `reporter_trust_tier`, `evidence_type`, and `submitted_at`, with reporter risk controlled by `community_reporter_trust`.

Key columns: `source_kind`, `operator_id`, `operator_name`, `station_id`, `reporter_id`, `reporter_trust_tier`, `evidence_type`, `source_url`, `parser_version`, `captured_at`, `submitted_at`, `provenance`.

Indexes: `fuel_price_sources_kind_captured_idx`.

### `fuel_price_source_observations`

Join table from a fuel operator/crowd source row to the immutable `observations` row it produced. Stores the grade id plus original source price text so rendered rows can prove the per-litre price was copied from source evidence, not inferred.

Key columns: `source_id`, `observation_id`, `fuel_grade_id`, `original_price_text`, `original_effective_date`.

Indexes: `fuel_price_source_observations_grade_idx`.

### `observations`

Immutable normalized price facts. This is the canonical table for historical charts and price provenance.

Key columns: `product_id`, `chain_id`, `store_id`, `domain`, `source_run_id`, `raw_record_id`, `retailer_product_ref`, `price_type`, `price`, `regular_price`, `unit_price`, `currency`, `quantity`, `quantity_unit`, promotion fields, `member_required`, `is_available`, `observed_at`, validity window fields, `confidence`, `provenance`.

`observations.is_available` defaults true for historical rows and is set false when connector evidence shows a product is out-of-stock, not found, or backed by an empty stock response. The field is part of connector replay idempotency so a stock-state change can append an immutable fact without overwriting price history.

Write policy: daily ingestion uses change-only writes. Before inserting a new immutable observation, the PostgreSQL writer compares the incoming `(product_id, chain_id, store_id, price_type)` price tuple with `latest_prices`; unchanged current snapshots reuse the existing `observation_id` instead of creating another daily duplicate. Changed rows keep temporal state by writing `valid_from` from source evidence or defaulting it to `observed_at`.

Allowed `price_type` values: `shelf`, `online`, `member`, `promotion`, `receipt`, `community`, `estimated`.

Indexes: product/time, store/time, price type/time, provenance GIN, and `observations_connector_idempotency_idx` as the compound unique price snapshot guard for scraper upserts and exact connector replay idempotency without updating stored history.

### `observations_v2`

Range-partitioned monthly mirror of immutable `observations` for high-volume history reads. It is populated by `observations_partition_lane_sync`, which calls `ensure_observations_monthly_partition()` before copying inserts and updates from the canonical table.

Key columns: same price, source, availability, provenance, validity, domain, and observed-time fields as `observations`. The partitioned primary key is `(id, observed_at)` because PostgreSQL range-partitioned unique keys must include the partition key.

Partitions: monthly range partitions named `observations_YYYY_MM`, plus `observations_default` for rows outside the pre-created window. Operators should drain the default partition by creating the matching monthly partition before long-term retention.

Indexes: parent and per-partition product/time, store/time, price type/time, domain/time, provenance GIN, and `observed_at` BRIN. Retention uses `drop_observations_partitions_before(cutoff_month)` after archive/downsample handoff.

### `latest_prices`

Materialized latest price lookup for API and UI reads, and the write-side change detector for daily ingestion. Each row references the observation that won the rollup.

Key columns: `product_id`, `chain_id`, `store_id`, `domain`, `price_type`, `observation_id`, `price`, `regular_price`, `unit_price`, `currency`, `observed_at`, `is_available`, `confidence`, `provenance`, `updated_at`.

`latest_prices.is_available` is copied from the winning observation so API and static ProductCard surfaces can show an `Out of stock` badge without scanning raw history.

Primary key: `(product_id, chain_id, store_id, price_type)`.

Snapshot IO note: the DB-backed site snapshot exporter was identified as the likely Supabase Disk IO hot read after the all-store daily runner and DB snapshot work landed. Keep `scripts/ingestion/export-db-site-snapshot.mjs` on the `latest_prices_grocery_snapshot_idx` access pattern: filter to `domain='grocery'`, bound confidence/limit, and read the latest rows from `latest_prices` before joining metadata. Do not replace it with a raw `observations` scan or an unbounded latest-price export; preserve the change-only write path so unchanged daily snapshots reuse existing observations instead of silently dropping writes.

### `price_daily`

Derived daily rollup over immutable `observations` for product charts, 52-week-low checks, and historic range reads. Raw observations remain authoritative; charts and 52-week-low reads must hit `price_daily` or `price_weekly` instead of scanning raw observations for long ranges.

Key columns: `product_id`, `chain_id`, `store_id`, `domain`, `price_type`, `currency`, `bucket_day`, `min_price`, `max_price`, `avg_price`, `last_price`, unit-price equivalents, `first_observed_at`, `last_observed_at`, `observation_count`, `source_observation_ids`, `provenance`.

Indexes: `price_daily_product_chain_day_idx`, `price_daily_store_day_idx`, and `price_daily_domain_day_idx`.

### `price_weekly`

Derived weekly rollup over immutable `observations` for long-range market charts and price-history summaries. It uses ISO-style `date_trunc('week', observed_at)::date` buckets and keeps source observation ids so every aggregate remains traceable to raw facts.

Key columns: `product_id`, `chain_id`, `store_id`, `domain`, `price_type`, `currency`, `week_start`, `min_price`, `max_price`, `avg_price`, `last_price`, unit-price equivalents, `first_observed_at`, `last_observed_at`, `observation_count`, `source_observation_ids`, `provenance`.

Indexes: `price_weekly_product_chain_week_idx`, `price_weekly_store_week_idx`, and `price_weekly_domain_week_idx`.

### `users`

Application user profile data.

Key columns: `email`, `display_name`, `home_store_id`, `preferred_currency`, `dietary_preferences`.

### `subscription_entitlements`

Provider-neutral account entitlement state for premium subscription enforcement.

Key columns: `user_id`, `tier`, `plan`, `status`, `current_period_ends_at`, `provider`, `provider_customer_id`, `provider_subscription_id`, `updated_at`.

The table stores billing-provider identifiers only. Payment card numbers, CVCs, payment method secrets, and checkout client secrets must remain outside GroceryView storage.

### `watchlists`

User watchlists for product or category target prices.

Key columns: `user_id`, `name`, `product_id`, `category_path`, `target_price`, `favorite_stores_only`, `include_member_prices`, `allowed_price_types`.

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

### `price_alerts`

Target-price alert subscriptions captured by the web alert API.

Key columns: `id`, `user_email`, `product_id`, `target_price`, `created_at`.

Indexes: `price_alerts_user_created_idx` for account alert reads and `price_alerts_product_idx` for product-scoped alert evaluation.

### `webhook_subscriptions`

Outbound price-change webhook subscriptions used by `/api/webhooks/price-change` after verified price drops.

Key columns: `id`, `user_id`, `product_id`, `chain`, `callback_url`, `secret`, `active`, `last_delivery_at`, `failure_count`, `created_at`, `updated_at`.

Indexes: `webhook_subscriptions_active_product_idx` for product and chain fanout and `webhook_subscriptions_user_idx` for account-scoped subscription management.

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

App repository budget and authenticated settings preferences.

Key columns: `user_id`, `weekly_budget`, `monthly_budget`, `preferred_currency`, `notification_channels`, `updated_at`.

### `watchlist_items`

Legacy app repository watchlist rows used by existing package APIs.

Key columns: `user_id`, `product_id`, `target_price`, `alert_deal_score_at`, `favorite_stores_only`, `allowed_price_types`.

### `friend_share_signals`

Private opted-in friend and household deal-share signals used as persisted inputs for friend-shared deal suggestions.

Key columns: `user_id`, `signal_id`, `shared_by_user_id`, `source`, `product_id`, `store_id`, `deal_score`, `shared_at`, `expires_at`.

Primary key: `(user_id, signal_id)`.

Indexes: `friend_share_signals_user_shared_idx` for account reads, `friend_share_signals_product_idx` for product suggestions, and `friend_share_signals_store_idx` for store-scoped suggestions.

### `weekly_baskets`

Legacy app repository basket headers.

Key columns: `user_id`, `week_start`, `created_at`, `updated_at`.

Unique key: `(user_id, week_start)`.

### `basket_items`

Legacy app repository basket lines.

Key columns: `basket_id`, `product_id`, `quantity`, `created_at`.

### `basket_import_review_items`

Account-bound retailer basket import review rows for unmatched bookmarklet, browser extension, or copy/paste rows. These rows are private to `app_users` and stay out of `basket_items` until the signed-in shopper accepts a verified product match or dismisses the row.

Key columns: `user_id`, `review_item_id`, `raw_name`, `quantity`, `reason`, `retailer_id`, `source_kind`, `captured_at`, `status`, `created_at`, `resolved_at`, `resolved_product_id`.

Primary key: `(user_id, review_item_id)`.

Indexes: `basket_import_review_items_open_idx` for account-scoped open queue reads and `basket_import_review_items_retailer_idx` for retailer/capture audits.

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

Scheduled push/email/Telegram notification work items.

Key columns: `channel`, `type`, `title`, `body`, `priority`, `send_at`, `recipient`, `attempt_count`, `max_attempts`, `status`.

### `notification_suppressions`

Recipient suppression records for unsubscribe, bounce, and complaint handling.

Key columns: `recipient`, `channel`, `reason`, `active`, `updated_at`.

### `notification_subscriptions`

Account-scoped delivery destinations for notification fanout. Telegram rows store the Bot API `chat_id` used for target-price alerts.

Key columns: `user_id`, `channel`, `recipient`, `chat_id`, `product_id`, `active`.

### `subscription_entitlements`

Provider-neutral premium subscription entitlement state.

Key columns: `user_id`, `tier`, `plan`, `status`, `current_period_ends_at`, `provider`, `provider_customer_id`, `provider_subscription_id`, `updated_at`.

Stored billing provider identifiers are not payment credentials. Card data, CVCs, payment method secrets, and checkout client secrets stay outside GroceryView storage.

### `pantry_items`

Application repository pantry inventory for replenishment planning.

Key columns: `user_id`, `product_id`, `name`, `category`, `quantity`, `unit`, `minimum_quantity`, `target_quantity`, `expires_on`, `updated_at`.

Indexes: `pantry_items_user_idx` for account inventory reads and `pantry_items_expiry_idx` for expiry-aware replenishment jobs.

### `receipt_uploads`

Account-scoped receipt scan metadata for OCR review and purchase history workflows.

Key columns: `user_id`, `store_id`, `image_uri`, `purchased_at`, `total_amount`, `ocr_confidence`, `status`, `created_at`, `updated_at`.

Indexes: `receipt_uploads_user_purchased_idx` for account purchase history reads and `receipt_uploads_status_idx` for review queue processing.

### `receipt_items`

Line items parsed from receipt scans, including optional product matches.

Key columns: `receipt_id`, `raw_name`, `product_id`, `canonical_name`, `quantity`, `item_total`, `match_confidence`.

Indexes: `receipt_items_receipt_idx` for receipt detail reads.

### `household_plans`

Account-scoped household planning header with shared budget and approval policy.

Key columns: `user_id`, `name`, `weekly_budget`, `approval_limit`, `reviewer_user_id`, `created_at`, `updated_at`.

Indexes: `household_plans_user_idx` for signed-in user household reads.

### `household_members`

Members attached to a household plan for attribution and reviewer validation.

Key columns: `household_id`, `user_id`, `display_name`.

Indexes: `household_members_user_idx` for member-to-household lookups.

### `household_basket_items`

Shared household basket lines with member attribution.

Key columns: `household_id`, `line_position`, `product_id`, `quantity`, `added_by`.

Indexes: `household_basket_items_product_idx` for product impact lookups.

### `household_watchlist_items`

Shared household watchlist lines with optional target prices.

Key columns: `household_id`, `line_position`, `product_id`, `added_by`, `target_price`.

Indexes: `household_watchlist_items_product_idx` for product alert lookups.

### `household_favorite_stores`

Shared favorite stores for household basket and alert filtering.

Key columns: `household_id`, `store_id`.
