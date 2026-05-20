# Iteration 94 Deliverable Audit — Open Prices Normalized Artifact

## Objective restatement

Continue closing the real-data gap by making the Open Prices pull reusable after the live smoke completes. The repository already proves it can fetch and normalize public SEK price rows; this iteration lets operators persist the normalized rows as a local JSON artifact for inspection or handoff to a future persistence job.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Pull real public price rows | `infra/scripts/smoke-open-prices.sh` still pulls the default Open Prices Sweden/SEK endpoint and requires at least one accepted row | Preserved |
| Save normalized output on demand | Setting `OPEN_PRICES_OUTPUT_PATH` writes a JSON artifact with `acceptedObservations` | Implemented |
| Preserve provenance in the artifact | The artifact includes source URL, status code, content type, byte count, retrieved timestamp, SHA-256 content hash, raw snapshot reference, accepted/rejected counts, first product, and attribution | Implemented |
| Avoid storing raw response body by default | The artifact intentionally excludes `body`; live verification confirmed `hasRawBody: false` | Implemented |
| Document operator usage | `infra/README.md` documents `OPEN_PRICES_OUTPUT_PATH` and the `acceptedObservations` payload | Implemented |
| Prove live artifact creation | `OPEN_PRICES_OUTPUT_PATH=/tmp/groceryview-open-prices-preview.json` produced status `passed`, 6 `acceptedObservations`, SHA-256 `1383b2f62b683c97a5de6bd79cb5d56773ec2656d7c0e13297af4595dc9f58ab`, and no raw body field | Verified locally |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/ops` | Open Prices script/docs tests pass |
| `rtk npm run build --workspace @groceryview/ingestion && OPEN_PRICES_USER_AGENT='GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)' OPEN_PRICES_OUTPUT_PATH=/tmp/groceryview-open-prices-preview.json rtk infra/scripts/smoke-open-prices.sh` | Build succeeds, live pull passes, and output artifact is written |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The normalized artifact is local and operator-triggered; it is not yet persisted into PostgreSQL or scheduled as a hosted worker.
- Retailer-specific Stockholm/live provider connectors, legal approvals, and hosted worker proof remain separate blockers.
