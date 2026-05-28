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

## Code touchpoints

- Ingestion pipeline: `packages/ingestion/src/pipeline.ts`
- Scraper logs / run metadata: `packages/db/src/queries/scraperLogs.ts`
- Admin UI: `/admin/source-runs`, `/admin/sources`

## Idempotency

Replays must use stable `input_hash` + `schema_version` so duplicate connector deliveries do not double-publish gold rows. See `packages/ingestion/src/backfill-replay.ts`.
