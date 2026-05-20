# Iteration 95 Deliverable Audit — Open Prices PostgreSQL Import Path

## Objective restatement

Continue closing the real-data gap by moving the saved Open Prices artifact from an operator inspection file into a database-importable surface. This iteration does not claim hosted scheduled ingestion; it creates the tested PostgreSQL import path needed after a live Open Prices smoke writes `acceptedObservations`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Preserve real pull artifact contract | `infra/scripts/smoke-open-prices.sh` still writes `acceptedObservations` without raw response body | Preserved |
| Persist accepted rows into canonical DB tables | `persistOpenPricesArtifact()` upserts chains/products/aliases, writes raw price records, records immutable observations, and rolls up latest prices | Implemented |
| Keep Open Prices distinct from retailer connectors | `infra/db/migrations/006_source_runs_official_api.sql` adds `official_api` source runs and `infra/db/SCHEMA.md` documents Open Prices usage | Implemented |
| Provide an operator command | `infra/scripts/import-open-prices-artifact.sh` reads `OPEN_PRICES_INPUT_PATH`, requires `DATABASE_URL`, and calls `persistOpenPricesArtifact()` through `createPgQueryExecutor()` | Implemented |
| Fail closed before DB writes on bad artifacts | db tests assert a failed/empty artifact rejects before any query runs | Verified by tests |
| Avoid storing raw response body | importer stores only normalized accepted rows and provenance; the smoke artifact already excludes `body` | Implemented |
| Prove current real artifact is importer-compatible | Fresh Open Prices pull at `2026-05-20T10:38:28.445Z` produced 6 `acceptedObservations`, SHA-256 `6ac6441843335b311d1f4ebf74c8c0967de7c01ab98bb0c4081983d7016da180`, then `persistOpenPricesArtifact()` accepted it through a recording executor with 6 raw-record writes, 6 observation writes, latest-price rollup, and no raw body | Verified locally |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/db` | db importer, schema, migration, repository tests pass |
| `rtk npm run test --workspace @groceryview/ops` | import script and README contract tests pass |
| `rtk npm run build --workspace @groceryview/ingestion && rtk npm run build --workspace @groceryview/db && OPEN_PRICES_OUTPUT_PATH=/tmp/groceryview-open-prices-db-import.json infra/scripts/smoke-open-prices.sh && node ... persistOpenPricesArtifact(...)` | Live Open Prices artifact validates through the PostgreSQL importer without raw body |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The import path is tested with a query executor but has not yet been observed against a provisioned hosted PostgreSQL database.
- Hosted scheduled Open Prices ingestion still needs a worker/cron runtime that pulls, writes the artifact, imports it, and records freshness evidence.
- Retailer-specific Stockholm connectors, credentials/endpoints, and legal approvals remain separate blockers.
