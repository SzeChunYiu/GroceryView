# Iteration 208 Deliverable Audit: Deployed Readiness Evidence Fallbacks

## Objective slice

Preserve deployed readiness probe evidence in the scheduled production gate when required probe configuration is missing or a deployed readiness `curl` exits before writing its normal JSON payload.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep working toward real GroceryView production readiness | `.github/workflows/daily-ingestion.yml` now writes non-secret config-missing JSON for deployed PostgreSQL, source-run, and catalog-coverage readiness probes before curl when `GROCERYVIEW_SERVER_URL` or `METRICS_TOKEN` is absent | Implemented |
| Preserve deployed probe diagnostics when curl fails before JSON | The three deployed readiness steps capture `postgres_readiness_status=$?`, `source_run_readiness_status=$?`, and `catalog_coverage_readiness_status=$?`, then write fail-closed `*_diagnostic_missing` JSON payloads when their artifact files are empty | Implemented |
| Make missing deployed-readiness evidence fail visibly | `groceryview-deployed-readiness` now uses `if-no-files-found: error` for `postgres-readiness.json`, `source-run-readiness.json`, and `catalog-coverage-readiness.json` | Implemented |
| Keep readiness docs/audit aligned | `docs/ops/production-daily-ingestion-readiness.md` and `docs/status/completion-audit.md` document the deployed readiness config/curl diagnostic fallbacks | Implemented |
| Verify through schema coverage | `tests/schema/daily-ingestion-workflow.test.mjs` asserts the new workflow fallbacks; `tests/schema/production-readiness-runbook.test.mjs` asserts runbook coverage | Implemented |

## Remaining gaps

This iteration improves deployed-readiness evidence preservation only. Full production readiness still requires observed successful hosted daily ingestion, populated secrets/variables, migrated production DB, and healthy deployed readiness endpoints.
