# 63 — Backstage Admin / Debug / Observability UI

## Why

The user website should be beautiful and simple. The backstage UI can be dense and technical.

## Backstage routes

```text
/admin/source-runs
/admin/source-runs/[id]
/admin/dead-letters
/admin/data-quality
/admin/lineage
/admin/search-analytics
/admin/query-performance
/admin/ad-policy
/admin/content-lint
/admin/schema-changes
/admin/storage
```

## Source run detail

Show:

```text
source_run_id
domain
connector
status
started/finished
raw count
accepted count
rejected count
duplicate count
schema version
source hash
logs
quality checks
dead letters
lineage
publish decision
```

## Data quality dashboard

Show:

```text
critical failures
warnings
freshness SLA
coverage
dead-letter rate
duplicate rate
source status
```

## Search analytics

Show:

```text
top queries
zero-result queries
click-through
query latency
result rank clicked
domain usage
failed synonym detection
```

## DB performance

Show:

```text
slow queries
table sizes
index sizes
partition sizes
autovacuum lag
dead tuples
materialized view refresh time
```

## Public/private separation

Public page evidence should show:

```text
Source: OpenPrices
Rows: 24
Confidence: Medium
```

Admin page can show:

```text
source_run_id=...
raw_record_id=...
parser_version=...
quality_check_result_id=...
```

## Access

Backstage must require admin/reviewer role.
Never expose backstage internals publicly.
