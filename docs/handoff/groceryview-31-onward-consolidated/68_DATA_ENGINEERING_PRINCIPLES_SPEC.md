# 68 — Data Engineering Principles Spec

## Goal

Make GroceryView a durable daily ingestion and transformation platform.

## Core principles

```text
1. Raw data is immutable.
2. Every ingestion run has a source_run record.
3. Every record is idempotent.
4. Bad rows go to dead letters, not silent deletion.
5. Gold/user-facing snapshots publish only after quality gates pass.
6. Every metric can be traced back to source data.
7. Every source has freshness and coverage status.
8. Every domain has claim boundaries.
```

## Pipeline shape

```text
source connector
→ raw payload capture
→ source_runs
→ raw_records
→ validation
→ staging
→ normalization
→ entity matching
→ observations
→ latest_prices
→ gold snapshots
→ search documents
→ quality report
→ public website
```

## Bronze / Silver / Gold

### Bronze

```text
source_runs
raw_records
raw_payload_files
connector_http_logs
```

### Silver

```text
products
stores
product_aliases
store_aliases
observations
latest_prices
product_matches
```

### Gold

```text
market_overview_snapshot
category_index_daily
chain_index_daily
deal_scores
search_documents
product_page_snapshot
store_page_snapshot
watchlist_alert_candidates
```

## Source run contract

```ts
type SourceRun = {
  runId: string;
  domain: "grocery" | "pharmacy" | "fuel";
  sourceId: string;
  connectorId: string;
  status: "running" | "succeeded" | "failed" | "partial" | "blocked";
  startedAt: string;
  finishedAt?: string;
  sourceUrl?: string;
  inputHash?: string;
  rawRecordCount: number;
  acceptedRecordCount: number;
  rejectedRecordCount: number;
  duplicateRecordCount: number;
  deadLetterCount: number;
  schemaVersion: string;
  codeVersion: string;
};
```

## Idempotency

Use deterministic keys.

```text
sha256(domain + source_id + store_id + product_id + observed_at + price + unit + currency)
```

Rules:

```text
same source/day rerun → no duplicates
partial run → resumable
bad record → dead letter
schema break → block source or whole publish depending severity
```

## Backfill

Backfill command should support:

```text
domain
source
date_from
date_to
dry_run
max_concurrency
resume_from_checkpoint
write_mode: validate_only | append | reprocess
```

## Quality gates

Critical:

```text
price > 0
currency valid
observed_at not in future
domain valid
source_id valid
dedupe key unique
latest_prices no duplicate key
gold snapshot not empty
```

Domain-specific:

```text
pharmacy:
- OTC only
- exact EAN for same-product comparison
- no prescription claim

fuel:
- unit = litre
- grade normalized
- station-specific flag required before pump-price claim

grocery:
- category valid
- product/store identity valid
- no fake branch price if no branch evidence
```

## Observability

Track:

```text
run duration
rows/sec
accepted/rejected rows
duplicate rate
dead-letter rate
freshness SLA
coverage by domain/source/category/region
gold snapshot age
publish gate result
```
