# Iteration 180 deliverable audit

## Scope

Advance DB-to-site snapshot readiness from launch-chain coverage to target-store coverage, so the daily artifact fails closed when any connector-addressable catalog target store lacks public latest-price evidence.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Fail closed when target stores are absent from DB snapshot | `scripts/ingestion/export-db-site-snapshot.mjs` accepts `requiredStoreExternalRefs` and throws `db_site_snapshot_missing_required_stores:<stores>` when any target store external ref has no latest-price row | Implemented |
| Reuse generated catalog target evidence | Exporter can read `GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE` or inline JSON and uses `targetStores` as required store external refs | Implemented |
| Daily workflow enforces target-store coverage | `.github/workflows/daily-ingestion.yml` passes `/tmp/groceryview-catalog-targets.json` into the snapshot exporter and rejects non-empty `coverage.missingRequiredStoreExternalRefs` | Implemented |
| Operator evidence documents store gaps | `docs/ops/production-daily-ingestion-readiness.md` documents `db_site_snapshot_missing_required_stores`, `requiredStoreExternalRefs`, and `missingRequiredStoreExternalRefs` | Updated |
| Test coverage | `tests/schema/db-site-snapshot-script.test.mjs`, `tests/schema/daily-ingestion-workflow.test.mjs`, and `tests/schema/production-readiness-runbook.test.mjs` assert the new store coverage gate | Added |

## Verification

- `rtk node --test tests/schema/db-site-snapshot-script.test.mjs tests/schema/daily-ingestion-workflow.test.mjs tests/schema/production-readiness-runbook.test.mjs`
