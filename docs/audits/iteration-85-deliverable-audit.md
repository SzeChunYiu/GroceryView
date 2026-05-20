# Iteration 85 Deliverable Audit — Retailer Connector Smoke Script

## Objective restatement

Continue closing the gap between static/demo GroceryView data and real customer-visible grocery data. Iteration 84 added the source-gated connector runner; this iteration adds an operator-facing smoke script that can perform an approved endpoint pull and print proof that bytes were retrieved and content-addressed.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Make real data pull testable | `infra/scripts/smoke-retailer-connector.sh` loads the built ingestion package and calls `planRetailerConnectorRun()` plus `fetchRetailerConnectorSnapshot()` against a configured endpoint | Implemented |
| Keep live safety fail-closed | Script requires connector URL and chain ID, blocks before fetch unless legal/robots/data-agreement gates satisfy the source type, and exits nonzero on blocked/failed pulls | Implemented |
| Produce reusable pull evidence | Successful smoke output includes run key, source run ID, URL, HTTP status, content type, byte count, retrieved timestamp, content hash, and raw snapshot ref | Implemented |
| Document operator usage | `infra/README.md` documents the build step, required env vars, and what the smoke proves | Implemented |
| Verify script contract | `packages/ops/src/__tests__/localInfra.test.ts` asserts the script, source-access gates, ingestion helper calls, blocked-before-fetch messaging, and README docs | Covered |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/ops` | Ops tests pass |
| `rtk npm run build --workspace @groceryview/ingestion` plus `rtk env ... infra/scripts/smoke-retailer-connector.sh` | Connector smoke can pull a configured URL and print snapshot evidence |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The smoke proves an approved endpoint can be pulled and content-addressed; provider-specific parsers still need to convert real retailer payloads into product rows.
- Production usage still needs real approved endpoints, credentials/headers if required, durable object storage for raw snapshots, and scheduled worker wiring.
