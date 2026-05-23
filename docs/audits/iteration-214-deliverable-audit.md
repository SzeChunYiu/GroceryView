# Iteration 214 Deliverable Audit: Daily DB Direct Host Probe Evidence

## Objective slice

Surface the already-implemented Supabase direct-host fallback probe in production
daily-ingestion workflow evidence so operators can distinguish a pooler outage
from a writable direct database host before replacement cutover.

## Prompt-to-artifact checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep working toward real GroceryView production readiness | `.github/workflows/daily-ingestion.yml` now passes `GROCERYVIEW_DAILY_DB_DIRECT_PROBE_ATTEMPTS` into the DB connectivity diagnostic step | Implemented |
| Preserve direct-host fallback evidence | The DB connectivity gate prints a compact non-secret `supabase_direct_host` summary from `alternateConnections[]` before failing closed | Implemented |
| Keep operator docs aligned | `docs/ops/production-daily-ingestion-readiness.md` documents `alternateConnections[]`, `supabase_direct_host`, and the direct probe attempt variable | Implemented |
| Keep tests aligned | Daily workflow and runbook schema tests assert the direct probe variable and evidence names | Implemented |

## Remaining gaps

This iteration improves production DB diagnostic evidence only. Full production
readiness still requires a successful hosted daily ingestion run, populated
production secrets/variables, migrated production DB, and healthy deployed
readiness endpoints.
