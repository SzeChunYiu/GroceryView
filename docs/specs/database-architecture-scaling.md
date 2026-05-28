# Database architecture and scaling

## Purpose

Support high daily ingest volume without slowing public pages or making the schema unmaintainable. Public routes read **serving tables and gold snapshots only**; admin/debug routes may query heavier facts with pagination.

## Principles

1. **Append-only observations** — history is never overwritten.
2. **Immutable raw records** — audit trail preserved.
3. **`latest_prices` for fast user pages** — precomputed best current price per product/store scope.
4. **Gold snapshots for public pages** — home, search, market, browse, product, store, deals, map, pharmacy, fuel.
5. **Partition large fact tables** — time and optionally domain.
6. **Index for actual query patterns** — not speculative indexes on every column.
7. **Never query raw data on user pages** — no `raw_records` or full `observations` scans in public SSR.
8. **Separate admin/debug query paths** — `source_runs`, dead letters, lineage behind `/admin`.

## Table categories

| Category | Examples |
|----------|----------|
| Fact | `raw_records`, `observations`, `price_events`, `source_run_events`, `search_events` |
| Dimension | `products`, `stores`, `chains`, `categories`, `regions`, `domains`, `sources`, `fuel_grades` |
| Serving | `latest_prices`, `search_documents`, `*_snapshot`, `deal_scores` |

## Partitioning

Partition by month on `ingested_at` / `observed_at` / `started_at` for:

- `raw_records`, `observations`, `source_run_events`, `search_events`

Optional filters: `domain`, `source_id`, `category_slug`, `chain_id`, `region_id`.

## Index patterns (public serving)

```sql
-- latest_prices
(product_id, domain), (product_id, store_id, source_id)
(category_slug, domain), (chain_id, category_slug), (last_observed_at)

-- observations (admin/analytics only)
(product_id, observed_at DESC), (source_run_id), (domain, observed_at DESC)

-- search_documents
(domain, category_slug), (chain_id), (price_current), (confidence, freshness)
```

## Materialized views / snapshots

Public pages **must** read from:

- `latest_prices`, `search_documents`, `market_overview_snapshot`, `product_page_snapshot`, etc.

**Avoid on public pages:**

- Scanning `observations` for aggregations
- Joining `raw_records`
- Computing large rollups at request time

## Examples

**Good:** `/market` reads `CategoryIndexRow` data from gold snapshot; weekly/3M/1Y columns come from precomputed index series.

**Good:** Product search returns cursor-paginated envelopes from `search_documents`, not live joins across observations.

**Good:** Admin `/admin/scrapers` paginates `source_runs` with operator-facing detail.

## Anti-patterns

- Adding a public page that `SELECT`s millions of observation rows per request.
- Storing uncompressed raw payloads in Postgres when object storage + hash suffices.
- Missing partition pruning on date-filtered admin queries.
- Sharing connection pool between heavy batch loads and user-facing SSR without pgbouncer.

## Required tests

- Schema tests assert serving tables exist for each public route contract.
- Route/data tests confirm public pages do not import raw observation query helpers.
- `database-scaling-plan.test.mjs` (when ops scripts land) validates partition/index documentation stays current.
- Load smoke: product search p95 within budget reading from serving layer only.

## DB observability (track continuously)

Table/index sizes, dead tuples, autovacuum lag, slow queries, MV refresh time, partition growth, write throughput, query p95.

## PR update checklist

- [ ] New public route → add or extend a gold snapshot / serving table
- [ ] New filter dimension → index + partition strategy documented here
- [ ] Heavy admin query → pagination + separate route, not added to SSR path
