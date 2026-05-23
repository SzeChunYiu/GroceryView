# Iteration 179 deliverable audit

## Scope

Advance DB-to-site snapshot generation from "some latest price rows exist" to a launch-chain coverage gate that fails closed when any required chain is absent from the exported public `postgres.latest_prices` evidence.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Fail closed when the DB snapshot lacks launch-chain coverage | `scripts/ingestion/export-db-site-snapshot.mjs` validates `requiredChains` against observed `chainSlug` values and throws `db_site_snapshot_missing_required_chains:<chains>` | Implemented |
| Preserve public-only site snapshot output | `buildDbSiteSnapshotArtifact()` still emits normalized public rows and keeps raw private payloads out of the artifact | Preserved |
| Make workflow enforce required-chain coverage | `.github/workflows/daily-ingestion.yml` passes `GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS` and rejects non-empty `coverage.missingRequiredChains` | Implemented |
| Document operator controls and blockers | `docs/ops/production-daily-ingestion-readiness.md` documents `GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS`, `missingRequiredChains`, and `db_site_snapshot_missing_required_chains` | Updated |
| Test coverage | `tests/schema/db-site-snapshot-script.test.mjs`, `tests/schema/daily-ingestion-workflow.test.mjs`, and `tests/schema/production-readiness-runbook.test.mjs` assert the new gate and docs | Added |

## Verification

- `rtk node --test tests/schema/db-site-snapshot-script.test.mjs tests/schema/daily-ingestion-workflow.test.mjs tests/schema/production-readiness-runbook.test.mjs`
