# Database scaling plan

Append-heavy price observations and search documents. See also [database-architecture-scaling.md](../specs/database-architecture-scaling.md).

## Partitioning

- `observations` / `observations_v2`: monthly range partitions by observation time.
- `raw_records`: monthly by `ingested_at` where stored.
- BRIN indexes on append-only time columns for pruning.

## Indexes

- B-tree on `(product_id, observed_at desc)` for latest price lookups.
- GIN / trigram / full-text on `search_documents` as needed for product search.

## Serving layer

- `latest_prices` and gold snapshots materialized for public pages (avoid ad-hoc full history scans).
- Rollup tables: `price_daily`, `price_weekly` for charts and market KPIs.

## Large ingestion

- COPY into staging tables.
- Batch writes with chunk checkpoints.
- Idempotency keys per connector delivery.

## TimescaleDB evaluation

Declarative partitions remain primary until hypertable compression/retention is proven in production (`timescaleDbEvaluation` in verified-data).

## Ops scripts

| Script | Purpose |
|--------|---------|
| `npm run ops:db-io-hotspots` | IO-heavy query identification |
| `npm run ops:check-hot-query-plans` | Plan regression fixtures |
| `npm run ops:run-db-retention` | Retention drill |

Admin storage dashboard: `/admin/storage`.
