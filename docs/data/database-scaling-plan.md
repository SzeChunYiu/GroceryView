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

## Production database closure checklist

- **Partition plan for raw_records and observations:** `raw_records` partitions by `ingested_at`; `observations_v2` partitions by `observed_at`; BRIN indexes prune append-only windows; partition-drop retention is the default deletion path.
- **Bulk load plan using staging/COPY:** connector payloads land in staging via `COPY`, validate row contracts there, then promote to `raw_records`, `observations`, `latest_prices`, `search_documents`, and `gold_snapshots` only after quality gates pass.
- **Dedupe/idempotency key helper:** `packages/ingestion/src/idempotency.ts` builds deterministic connector/source/observation hashes; `observations_connector_idempotency_idx` blocks replay duplicates.
- **Quality gate publish blocker:** `scripts/ops/check-gold-publish-gate.mjs` blocks publish when critical `quality_checks`, missing `source_runs`, empty `gold_snapshots`, or forbidden domain claims are detected.
- **DB health report:** `scripts/ops/db-size-report.mjs` and `scripts/ops/db-index-health.mjs` return table/index growth, unused-index, and retention evidence.
- **Slow query report:** `scripts/ops/slow-query-report.mjs` summarizes `pg_stat_statements` p95/call/row evidence and links recommendations back to serving tables and partition pruning.

## TimescaleDB evaluation

Declarative partitions remain primary until hypertable compression/retention is proven in production (`timescaleDbEvaluation` in verified-data).

## Ops scripts

| Script | Purpose |
|--------|---------|
| `npm run ops:db-io-hotspots` | IO-heavy query identification |
| `npm run ops:check-hot-query-plans` | Plan regression fixtures |
| `npm run ops:run-db-retention` | Retention drill |

Admin storage dashboard: `/admin/storage`.
