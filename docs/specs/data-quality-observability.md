# Data quality and observability

## Purpose

Ensure published prices are **complete, fresh, valid, unique, consistent, and lineage-aware**. Quality failures block or downgrade public claims; observability reports give operators daily visibility.

## Principles

1. **Critical failures block publish** — negative prices, invalid currency, future timestamps, empty gold snapshots.
2. **Warnings publish with caveats** — stale source, low observation count, coverage drop → lower confidence label.
3. **Lineage is always available backstage** — `source_run_id`, `quality_check_id`, `raw_record_id` on admin/export paths.
4. **Frontstage shows human evidence** — source name, last observed date, confidence, row count, known limitations.
5. **Never expose backstage IDs on public pages** — no `source_run_id=` in user-facing copy.
6. **Daily automated reports** — source runs, quality, freshness, coverage, search quality, DB health.

## Quality dimensions

Completeness, freshness, validity, uniqueness, consistency, accuracy proxy, lineage, coverage.

## Check categories

### Critical (block publish)

| Check | Example failure |
|-------|-----------------|
| Negative or zero price | Parser bug |
| Invalid currency | Missing SEK/NOK/ISK |
| Future `observed_at` | Clock skew |
| Duplicate `latest_prices` key | Idempotency break |
| Missing `source_run` | Orphan observations |
| Empty gold snapshot | Failed aggregation |
| Pharmacy prescription row public | Domain boundary violation |
| Fuel station claim without evidence | Missing station flag |

### Warning (publish with caveat)

Stale source, low observation count, missing image/brand, unmatched store, coverage drop, high duplicate rate.

## Observability reports (target artifacts)

```text
daily_source_run_report.json
daily_quality_report.json
daily_freshness_report.json
daily_coverage_report.json
daily_search_quality_report.json
daily_db_health_report.json
```

## Frontstage vs backstage evidence

| Audience | Shows |
|----------|-------|
| Public | `Source: OpenPrices · Last observed: 2026-05-20 · Confidence: Medium · 24 observations · Limitation: no branch shelf data` |
| Admin | Run IDs, dead-letter queue, lineage graph, index bloat, gate failure details |

## Examples

**Good:** Product page `EvidenceStrip` uses `VerifiedEvidence` with freshness/confidence labels from shared helpers.

**Good:** `/admin/sources/dead-letters` lists parser failures for replay without blocking the rest of the connector run.

**Good:** Market page labels missing history as “—” instead of interpolating fake index points.

## Anti-patterns

- Showing “High confidence” with zero observations.
- Hiding stale data without a freshness label.
- Public pages mentioning Redis, pgbouncer, cursor tokens, or `source_run_id`.
- Silently dropping rejected rows with no dead-letter record.

## Required tests

- Quality gate unit tests for each critical check.
- Content lint: public routes must not match backstage debug phrases (see [atomic gap registry](../roadmap/atomic-gap-registry.md)).
- Evidence strip tests: required fields present when data exists; `NoVerifiedDataPanel` when not.
- Admin route tests: dead-letter and source-run pages require auth boundary.

## PR update checklist

- [ ] New public claim → document quality gates and claim boundary
- [ ] New source → freshness SLA + coverage target in connector doc
- [ ] Changed evidence UI → update frontstage mapping examples here
