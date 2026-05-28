# Source run contract

Bronze-layer ingestion runs. Aligns with lock pack `09_DATABASE_AND_INGESTION_IMPLEMENTATION.md`.

## Entity: `source_runs`

| Field | Type | Notes |
|-------|------|-------|
| run_id | uuid | Primary key |
| domain | enum | grocery, pharmacy, fuel |
| source_id | text | Connector registry id |
| connector_id | text | Implementation id |
| status | enum | pending, running, succeeded, failed, partial |
| started_at | timestamptz | |
| finished_at | timestamptz | nullable |
| raw_record_count | int | |
| accepted_record_count | int | |
| rejected_record_count | int | |
| duplicate_record_count | int | |
| dead_letter_count | int | |
| schema_version | text | |
| code_version | text | git sha or package version |
| input_hash | text | idempotency fingerprint |

## Flow

```text
connector → raw payload → source_run → raw_records → validate → staging → normalize → match → observations → latest_prices → gold snapshots → search_documents → quality report
```

## Production report contracts

Every ops report returns the shared closure shape below so admin pages can show live/generated/scaffold/stale/unavailable provenance without leaking debug identifiers to public pages:

```ts
{
  status: "live" | "generated" | "scaffold" | "stale" | "unavailable";
  sourceLabel: string;
  generatedAt?: string;
  nextIntegration?: string;
  rows: unknown[];
}
```

Required storage/report contracts:

```text
source_runs
raw_records
dead_letters
quality_checks
lineage_events
latest_prices
search_documents
gold_snapshots
analytics_events
```

## Code touchpoints

- Ingestion pipeline: `packages/ingestion/src/pipeline.ts`
- Scraper logs / run metadata: `packages/db/src/queries/scraperLogs.ts`
- Admin UI: `/admin/source-runs`, `/admin/sources`
- Report helpers: `scripts/ops/source-run-report.mjs`, `scripts/ops/quality-report.mjs`, `scripts/ops/dead-letter-report.mjs`, `scripts/ops/search-analytics-report.mjs`

## Idempotency

Replays must use stable `input_hash` + `schema_version` so duplicate connector deliveries do not double-publish gold rows. See `packages/ingestion/src/backfill-replay.ts`.
