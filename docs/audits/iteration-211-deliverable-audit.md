# Iteration 211 Deliverable Audit: Replacement DB Evidence Upload Hardening

## Objective slice

Preserve replacement database cutover validation evidence when connector or catalog-target generation fails before all-store ingestion starts, and make replacement DB evidence uploads fail visibly when expected files are missing.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep working toward real GroceryView production readiness | `.github/workflows/db-cutover-validation.yml` now captures `replacement_daily_connectors_status=$?` and `replacement_catalog_targets_status=$?` before replacement DB ingestion | Implemented |
| Preserve replacement connector diagnostics | The workflow writes fail-closed `replacement_daily_connectors_diagnostic_missing` payloads to replacement connector and ingestion result evidence when connector generation fails before JSON | Implemented |
| Preserve replacement catalog-target diagnostics | The workflow writes fail-closed `replacement_catalog_targets_diagnostic_missing` payloads to catalog target and ingestion result evidence when target generation fails before JSON | Implemented |
| Make missing replacement evidence fail visibly | `groceryview-replacement-db-migrations`, `groceryview-replacement-db-ingestion`, and `groceryview-replacement-db-site-snapshot` now use `if-no-files-found: error` | Implemented |
| Keep docs/tests aligned | `tests/schema/db-cutover-validation-workflow.test.mjs`, `tests/schema/production-readiness-runbook.test.mjs`, and `docs/ops/production-daily-ingestion-readiness.md` cover the new blockers and upload behavior | Implemented |

## Remaining gaps

This iteration improves replacement DB cutover evidence preservation only. Full production readiness still requires a successful hosted daily ingestion run, populated production secrets/variables, migrated production DB, and healthy deployed readiness endpoints.
