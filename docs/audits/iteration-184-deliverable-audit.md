# Iteration 184 deliverable audit

## Scope

Advance DB-to-site snapshot readiness from coverage-only checks to freshness enforcement, so stale `postgres.latest_prices` rows cannot be published as the daily public site artifact.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Fail closed on stale latest-price evidence | `scripts/ingestion/export-db-site-snapshot.mjs` accepts `maxObservedAgeHours` and throws `db_site_snapshot_stale_observations:<observation-ids>` when exported rows are older than the configured window | Implemented |
| Daily workflow enforces freshness | `.github/workflows/daily-ingestion.yml` sets `GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS` and rejects non-zero `coverage.staleObservationCount` | Implemented |
| Operator evidence includes freshness summary | The snapshot artifact reports `maxObservedAgeHours`, `oldestObservedAt`, `staleObservationCount`, and `staleObservationIds` when freshness enforcement is configured | Implemented |
| Operator runbook documents freshness blocker | `docs/ops/production-daily-ingestion-readiness.md` documents `db_site_snapshot_stale_observations` and `GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS` | Updated |
| Test coverage | `tests/schema/db-site-snapshot-script.test.mjs`, `tests/schema/daily-ingestion-workflow.test.mjs`, and `tests/schema/production-readiness-runbook.test.mjs` assert the freshness gate | Added |

## Verification

- `rtk node --test tests/schema/db-site-snapshot-script.test.mjs tests/schema/daily-ingestion-workflow.test.mjs tests/schema/production-readiness-runbook.test.mjs`
