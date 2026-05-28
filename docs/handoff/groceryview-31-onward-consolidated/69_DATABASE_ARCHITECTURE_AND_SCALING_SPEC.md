# 69 — Database Architecture and Scaling Spec

## Goal

Support tons of daily ingested data without making the website slow or the database unmaintainable.

## Principles

```text
1. Append-only observations.
2. Immutable raw records.
3. Latest-price tables for fast user pages.
4. Gold snapshots for public pages.
5. Partition large fact tables.
6. Index for actual query patterns.
7. Do not query raw data on user pages.
8. Keep admin/debug queries separate from public queries.
```

## Table categories

### Fact tables

```text
raw_records
observations
price_events
source_run_events
search_events
watchlist_events
```

### Dimension tables

```text
products
stores
chains
categories
regions
domains
sources
fuel_grades
pharmacy_eans
```

### Serving tables

```text
latest_prices
search_documents
market_overview_snapshot
category_page_snapshot
product_page_snapshot
store_page_snapshot
deal_scores
```

## Partitioning

Partition these by time and/or domain:

```text
raw_records by ingested_at month
observations by observed_at month
source_run_events by started_at month
search_events by event_date month
```

Optional subpartition or index by:

```text
domain
source_id
category_slug
chain_id
region_id
```

## Indexes

Typical indexes:

```sql
-- latest prices
(product_id, domain)
(product_id, store_id, source_id)
(category_slug, domain)
(chain_id, category_slug)
(last_observed_at)

-- observations
(product_id, observed_at desc)
(source_run_id)
(domain, observed_at desc)
(store_id, observed_at desc)
(category_slug, observed_at desc)

-- search
(search_vector)
(domain, category_slug)
(chain_id)
(price_current)
(confidence, freshness)
```

## Materialized views / snapshots

Use serving snapshots for:

```text
Home
Search
Market
Browse
Product
Store
Deals
Map
Pharmacy
Fuel
```

Avoid:

```text
public page directly scanning observations
public page joining raw_records
public page computing large aggregations at request time
```

## Size optimization

```text
raw payloads compressed in object storage
DB stores hashes + parsed critical fields
archive old raw payload metadata if needed
partition pruning
drop/rebuild stale unused indexes
monitor index bloat
vacuum/analyze strategy
```

## Load efficiency

```text
batch inserts
staging tables
COPY for large loads
upsert only final deduped rows
chunk checkpoints
parallel connector execution with rate limits
incremental gold snapshot refresh
```

## Website serving

Public pages should read from:

```text
latest_prices
search_documents
*_snapshot tables
small materialized views
```

Admin pages can read heavier technical tables with pagination.

## DB observability

Track:

```text
table sizes
index sizes
dead tuples
autovacuum lag
slow queries
materialized view refresh time
partition growth
query p95 latency
write throughput
```

## Claude Code task

Generate:

```text
docs/data/database-scaling-plan.md
scripts/ops/db-size-report.mjs
scripts/ops/db-index-health.mjs
tests/schema/database-scaling-plan.test.mjs
```
