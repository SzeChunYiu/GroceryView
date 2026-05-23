# Iteration 215 Deliverable Audit: Daily DB Transaction Pooler Evidence

## Objective slice

Surface the existing Supabase transaction-pooler fallback probe in production
daily-ingestion workflow evidence alongside the direct-host probe, so operators
can distinguish session-pooler rewrites from transaction-pooler and direct-host
recovery options.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep working toward real GroceryView production readiness | `.github/workflows/daily-ingestion.yml` now passes `GROCERYVIEW_DAILY_DB_ALTERNATE_POOLER_PROBE_ATTEMPTS` into the DB connectivity diagnostic step | Implemented |
| Preserve transaction-pooler fallback evidence | The DB connectivity gate prints compact non-secret `supabase_transaction_pooler` summaries from `alternateConnections[]` before failing closed | Implemented |
| Keep operator docs aligned | `docs/ops/production-daily-ingestion-readiness.md` documents `alternateConnections[]`, `supabase_transaction_pooler`, and the alternate-pooler probe attempt variable | Implemented |
| Keep tests aligned | Daily workflow and runbook schema tests assert the transaction-pooler probe variable and evidence names | Implemented |

## Remaining gaps

This iteration improves production DB diagnostic evidence only. Full production
readiness still requires a successful hosted daily ingestion run, populated
production secrets/variables, migrated production DB, and healthy deployed
readiness endpoints.
