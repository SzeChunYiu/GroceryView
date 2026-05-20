# Iteration 84 Deliverable Audit — Retailer Connector Runner

## Objective restatement

Continue improving GroceryView toward real customer data, PR by PR. This iteration targets the data-pull gap: the codebase had access planning and product-ingestion normalization, but no tested runner that could actually execute an approved connector fetch, preserve snapshot provenance, parse rows, and fail closed before unsafe pulls.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Make real grocery data pullable after approvals | `packages/ingestion/src/index.ts` adds `fetchRetailerConnectorSnapshot()` and `runRetailerConnector()` so an approved connector plan can fetch an endpoint, hash the payload, attach a raw snapshot ref, parse rows, and pass them to the ingestion batch path | Implemented |
| Preserve legal/robots/data-agreement gates | `runRetailerConnector()` calls `planRetailerConnectorRun()` first and returns `blocked`/`duplicate` without invoking fetcher or parser | Implemented |
| Preserve provenance for every parsed price | Runner stamps source type, URL, observed time, parser version, raw snapshot ref, and source run id onto parsed records before `ingestRetailerProduct()` | Implemented |
| Fail closed on bad pulls | Non-2xx responses, missing snapshot refs, missing URLs, invalid timestamps, and thrown parser/fetch errors return `failed` with explicit required actions | Implemented |
| Verify with tests | `packages/ingestion/src/__tests__/ingestion.test.ts` covers successful fetch+parse+ingest, blocked gate no-fetch, non-2xx failure, and the fetch helper's content-addressed snapshot output | Covered |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/ingestion` | Ingestion tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- This creates the approved-connector execution seam; it does not add live retailer credentials, legal approvals, production endpoint configuration, or provider-specific parsers.
- Production raw snapshot storage still needs a durable sink/prefix backed by deployed object storage.
- Hosted scheduled connector workers still need deployment wiring and live smoke evidence.
