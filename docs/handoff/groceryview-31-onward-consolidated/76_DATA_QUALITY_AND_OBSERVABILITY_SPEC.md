# 76 — Data Quality and Observability Spec

## Data quality dimensions

```text
Completeness
Freshness
Validity
Uniqueness
Consistency
Accuracy proxy
Lineage
Coverage
```

## Quality check categories

### Critical

Blocks publish.

```text
negative price
invalid currency
future observed_at
duplicate latest price key
missing source_run
gold snapshot empty
pharmacy prescription row public
fuel station-specific claim without station evidence
```

### Warning

Publishes with low confidence or caveat.

```text
stale source
low observation count
missing image
missing brand
unmatched store
coverage drop
high duplicate rate
```

## Observability reports

```text
daily_source_run_report.json
daily_quality_report.json
daily_freshness_report.json
daily_coverage_report.json
daily_search_quality_report.json
daily_db_health_report.json
```

## Admin dashboards

```text
source run status
dead-letter queue
freshness SLA
coverage by domain
quality failures
lineage view
DB size/index health
search analytics
```

## Public evidence mapping

Backstage:

```text
source_run_id=...
quality_check_id=...
raw_record_id=...
```

Frontstage:

```text
Source: OpenPrices
Last observed: 2026-05-20
Confidence: Medium
Rows: 24
Known limitation: no branch-level shelf data
```

## Claude Code task

Generate:

```text
docs/data/quality-gates.md
docs/data/lineage-and-observability.md
apps/web/src/app/admin/data-quality/page.tsx
apps/web/src/app/admin/source-runs/page.tsx
scripts/ops/quality-report.mjs
tests/schema/data-quality-spec.test.mjs
```
