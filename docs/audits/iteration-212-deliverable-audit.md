# Iteration 212 Deliverable Audit: Replacement DB Config Diagnostic Evidence

## Objective slice

Preserve explicit replacement database cutover evidence when downstream migration,
ingestion, or DB-backed snapshot steps unexpectedly lose their resolved
`DATABASE_URL` after candidate validation has already passed.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep working toward real GroceryView production readiness | `.github/workflows/db-cutover-validation.yml` now fails closed with JSON evidence when downstream replacement DB steps have no `DATABASE_URL` | Implemented |
| Preserve migration config diagnostics | `Apply replacement DB migrations` writes `/tmp/replacement-db-migrations.json` with `replacement_database_url_config_missing` before exiting | Implemented |
| Preserve ingestion config diagnostics | `Run replacement DB all-store ingestion validation` writes replacement connector, catalog-target, and ingestion result JSON with `replacement_ingestion_database_url_config_missing` before exiting | Implemented |
| Preserve snapshot config diagnostics | `Export replacement DB-backed site snapshot` writes both replacement snapshot evidence files with `replacement_snapshot_database_url_config_missing` before exiting | Implemented |
| Keep docs/tests aligned | Workflow schema coverage, runbook assertions, and the production readiness runbook document the three config-missing blockers | Implemented |

## Remaining gaps

This iteration improves replacement DB cutover evidence preservation only. Full
production readiness still requires a successful hosted daily ingestion run,
populated production secrets/variables, migrated production DB, and healthy
deployed readiness endpoints.
