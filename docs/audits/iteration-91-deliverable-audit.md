# Iteration 91 Deliverable Audit — Hosted Product Terminal Smoke

## Objective restatement

Continue proving that the customer-facing product terminal is not only static UI/API code, but can be validated from a deployed API surface. This iteration extends hosted smoke coverage so operators can prove the same product-terminal endpoint used by connected clients returns quote, ticker, distribution, and chart JSON before promotion.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Prove hosted API can serve terminal numbers | `infra/scripts/smoke-hosted-http.sh` now calls `/api/products/${GROCERYVIEW_TERMINAL_PRODUCT_ID}/terminal` after `/api/health` | Implemented |
| Keep same-product validation explicit | The smoke script defaults `GROCERYVIEW_TERMINAL_PRODUCT_ID=coffee` and verifies the response has the matching `productId` | Implemented |
| Validate customer-interesting terminal fields | The smoke script requires `ticker`, `quote`, `distributions`, and `chart` fields before printing terminal smoke success | Implemented |
| Publish operator command plan evidence | `buildHostedSmokeCommandPlan()` includes `GROCERYVIEW_TERMINAL_PRODUCT_ID=coffee` and adds `hosted_product_terminal` evidence | Implemented |
| Document how to run hosted terminal smoke | `infra/README.md` documents the terminal endpoint, default product id, override variable, and required JSON fields | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/ops` | Hosted smoke script, docs, and command-plan tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The repo now ships a hosted product-terminal smoke script and command plan, but actual hosted proof still requires a deployed API URL and an observed successful smoke run.
- Terminal values still depend on approved retailer endpoints, provider-specific adapters, durable snapshot storage, scheduled ingestion worker proof, and catalog backfill beyond seed products.
