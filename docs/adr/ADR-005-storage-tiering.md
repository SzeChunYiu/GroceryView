# ADR-005: Hot Postgres + Cold Parquet Tiering

- **Status:** Accepted
- **Date:** 2026-05-24
- **Owners:** GroceryView data/ingestion maintainers
- **Scope:** Price-observation storage, historical analytics, and public snapshot export

## Context

GroceryView writes immutable price evidence into PostgreSQL tables such as
`price_observations`, rolls current public rows into `latest_prices`, and exports
DB-backed static-site modules from that current view. The same source trail is
also needed for trend, freshness, category-index, and audit queries that look
back across many daily connector runs.

Keeping every historical row in the low-latency PostgreSQL path forever makes the
OLTP database carry two different jobs:

1. serving current product, basket, and readiness queries with predictable p95
   latency; and
2. scanning old observations for analytics, QA, incident reconstruction, and
   model/ranker backtests.

Those jobs have different access patterns. Recent rows are updated and queried by
product/store/source-run during ingestion and site export. Older rows are mostly
append-only evidence that operators read in partitions by date, country, chain,
category, or source type.

## Decision

Use a two-tier storage model:

- **Hot tier:** PostgreSQL keeps the current operational window: the last **60
  days** of `price_observations` plus the current `latest_prices` rollup,
  source-run status, products, stores, chains, and review metadata.
- **Cold tier:** observations older than 60 days are compacted to immutable
  Parquet partitions in object storage and queried with DuckDB for analytics,
  audits, and backtests.
- **Boundary contract:** PostgreSQL remains the source of truth for current
  product UX, ingestion idempotency, readiness gates, and public static-site
  snapshots. Parquet is the source of truth for long-horizon history once a row
  has crossed the 60-day retention boundary and the export manifest has been
  verified.

## Why 60 days stay hot

The 60-day window balances product correctness and database cost:

- **Freshness and launch readiness:** public pages and readiness checks care most
  about the newest observations. Existing runbooks already fail closed when site
  snapshot rows exceed a freshness budget; those checks should remain PostgreSQL
  reads against indexed recent rows.
- **Promotion and flyer cycles:** most grocery promotion, price-drop, and
  member-price questions fit inside several weekly cycles. Sixty days provides
  enough overlap for regressions and rollback investigations without forcing
  multi-month scans through the transactional database.
- **Operational recovery:** connector bugs are usually detected within daily or
  weekly ingestion windows. Keeping two months hot lets operators repair bad
  rows, compare source runs, and regenerate `latest_prices` without first
  hydrating a cold partition.
- **Predictable indexes:** btree indexes on product, store, domain, and observed
  time remain small enough for current-product queries and DB-backed site export
  to avoid historical scan pressure.

The 60-day number is a policy default, not a legal retention limit. Raising or
lowering it requires re-checking query latency, DB storage growth, recovery needs,
and the downstream cold-export SLA.

## Why Parquet is the cold format

Parquet is chosen for cold observation evidence because it matches the shape of
historical GroceryView queries:

- **Column pruning:** analytics often need `observed_at`, `chain_id`,
  `store_id`, `product_id`, `price`, `unit_price`, `currency`, `source_type`,
  `confidence_score`, and provenance columns, not every product/store attribute.
- **Compression:** repeated chain, source, domain, and category values compress
  well, keeping long history cheap to store and copy.
- **Partitioned append model:** daily or weekly partitions can be written once,
  checksummed, and treated as immutable evidence rather than mutable app state.
- **Tooling interoperability:** DuckDB, Python, Spark, and warehouse import tools
  can all read the same files without a bespoke export format.

Partition cold files by at least `country`, `domain`, and observation date
(`observed_date=YYYY-MM-DD` or `observed_month=YYYY-MM` for compacted archives).
Include an export manifest with row counts, min/max `observed_at`, source-run ids,
content hashes, schema version, and the PostgreSQL high-water mark used for the
export.

## DuckDB query path

DuckDB is the default query engine for cold history because it can scan Parquet in
place for operator and CI analytics without running a separate warehouse service.
The intended path is:

1. Select a bounded set of Parquet partitions from object storage or a local
   artifact cache by date, country, domain, chain, or category.
2. Query those files directly with DuckDB's Parquet reader.
3. Join to small dimension snapshots (`products`, `chains`, `stores`, category
   mappings) exported alongside the observation partitions when human-readable
   labels are needed.
4. Materialize only the report output back into CI artifacts, docs, or dashboard
   tables; do not re-import historical partitions into the hot OLTP path unless
   an incident runbook explicitly requires it.

Example operator query:

```sql
select
  chain_id,
  date_trunc('week', observed_at) as observed_week,
  count(*) as observations,
  median(unit_price) as median_unit_price
from read_parquet('s3://groceryview-cold/price_observations/country=SE/domain=grocery/observed_month=2026-03/*.parquet')
where confidence_score >= 0.8
  and source_type in ('retailer_api', 'retailer_page', 'receipt_scan')
group by 1, 2
order by 2, 1;
```

This keeps ad hoc historical scans away from the production PostgreSQL pool while
still preserving exact row-level evidence for audits.

## Lifecycle

1. **Ingest:** connectors append validated observations to PostgreSQL and update
   current rollups/readiness evidence.
2. **Hot serve:** product APIs, basket comparison, catalog coverage, and
   `ingest:export-db-snapshot` read current PostgreSQL rows only.
3. **Export:** a scheduled cold-tier job copies observations older than the hot
   boundary into Parquet partitions and writes a manifest.
4. **Verify:** compare source PostgreSQL counts and min/max timestamps against
   the manifest; fail closed on missing partitions, duplicate primary keys, or
   schema-version mismatches.
5. **Retain hot boundary:** after a successful verified export and a grace period,
   prune only the exported historical rows from PostgreSQL. Never prune rows that
   still feed `latest_prices`, unresolved review queues, or open incident
   investigations.
6. **Query cold:** analytics and audit jobs use DuckDB over Parquet and publish
   report artifacts rather than loading old data back into app tables.

## Consequences

### Positive

- Current user-facing reads stay isolated from unbounded historical growth.
- Long-horizon analytics can scan compressed columnar files cheaply.
- Historical evidence remains immutable and independently checksummed.
- Replacement DB cutovers and static-site snapshot exports need only the hot
  operational window plus current rollups.

### Trade-offs

- Operators must maintain export manifests and verify hot-to-cold handoff before
  pruning.
- Historical analytics need DuckDB/object-storage access rather than plain SQL
  against production Postgres.
- Schema changes require dual migration discipline: PostgreSQL migrations for hot
  tables and Parquet schema-version handling for cold partitions.
- Incident response may need a controlled rehydration path if a bug is discovered
  after affected observations have moved cold.

## Guardrails

- Do not write synthetic or estimated rows into cold history unless they were
  already accepted as explicit `source_type='estimated'` observations with
  provenance in the hot tier.
- Do not let a successful Parquet export bypass current freshness/readiness gates;
  public pages still require fresh `latest_prices` evidence.
- Do not prune PostgreSQL solely by age. Prune only rows covered by a verified
  manifest and outside any active incident/review hold.
- Keep raw private payloads out of public static-site snapshots. Cold partitions
  may carry normalized provenance fields, but raw receipts or private user data
  require separate access controls.

## Open follow-ups

- Implement the cold-tier exporter and manifest verifier.
- Add a runbook section for emergency rehydration into a scratch database.
- Decide whether monthly compaction should rewrite daily partitions after the
  incident-response grace period.
