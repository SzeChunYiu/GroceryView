# Iteration 213 Deliverable Audit: Daily Ingestion Config Diagnostic Evidence

## Objective slice

Preserve explicit production daily-ingestion evidence when downstream connectivity,
migration, ingestion, or DB-backed snapshot steps unexpectedly lose `DATABASE_URL`
after production configuration preflight has already passed.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep working toward real GroceryView production readiness | `.github/workflows/daily-ingestion.yml` now writes fail-closed JSON evidence for downstream production `DATABASE_URL` loss before artifact upload steps run | Implemented |
| Preserve DB connectivity config diagnostics | `Check production DB write connectivity` writes `/tmp/daily-db-connectivity.json` with `daily_db_connectivity_database_url_config_missing` before exiting | Implemented |
| Preserve migration config diagnostics | `Apply production DB migrations` writes `/tmp/production-db-migrations.json` with `production_db_migrations_database_url_config_missing` before exiting | Implemented |
| Preserve ingestion config diagnostics | `Run configured daily ingestion` writes `/tmp/daily-ingestion-result.json` and `codex-tasks/ingestion-blockers.txt` with `daily_ingestion_database_url_config_missing` before exiting | Implemented |
| Preserve snapshot config diagnostics | `Export DB-backed site snapshot` writes both DB-backed site snapshot evidence files with `db_site_snapshot_database_url_config_missing` before exiting | Implemented |
| Keep docs/tests aligned | Daily workflow schema coverage, production readiness runbook assertions, and the runbook blocker catalog document the four config-missing blockers | Implemented |

## Remaining gaps

This iteration improves production daily-ingestion evidence preservation only. Full
production readiness still requires a successful hosted daily ingestion run,
populated production secrets/variables, migrated production DB, and healthy
deployed readiness endpoints.
