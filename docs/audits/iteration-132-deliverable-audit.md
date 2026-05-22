# Iteration 132 deliverable audit — account-bound basket import review

## Objective

Turn the next research finding into real GroceryView product by making retailer basket imports account-bound through a private review queue: matched rows can update a signed-in basket, but unmatched retailer rows must stay out of the basket until the shopper accepts a verified GroceryView product match or dismisses the row.

## Delivered product surface

- Account API: consented bookmarklet/browser-extension imports now persist unmatched retailer rows into a per-user review queue with stable review item ids, source metadata, status, and guardrails.
- Account API decisions: signed-in users can resolve their own review rows through `accept_as_product` or `dismiss`; accepted rows add only verified GroceryView product ids to the basket, and dismissed rows leave the basket unchanged.
- HTTP API: protected `GET /api/basket/import-review` and `POST /api/basket/import-review/{reviewItemId}/decisions` enforce user authorization before exposing or resolving private review rows.
- Nest API app: demo OpenAPI routes mirror the account-bound review queue and decision contract for app-level clients and docs.
- Web route contract: the basket ideas route now documents the account-bound import review contract and states unmatched retailer rows stay out of baskets until a signed-in shopper accepts a verified match.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Account API TDD red/green | Pass | `rtk npm run test -w @groceryview/api -- --test-name-pattern="account-scoped retailer basket import reviews"` |
| Server route/OpenAPI TDD red/green | Pass | `rtk npm run test -w @groceryview/server -- --test-name-pattern="mutates favorite stores|documents proposal API routes"` |
| Nest API app TDD red/green | Pass | `rtk npm run test -w @groceryview/api-app -- --test-name-pattern="serves products|serves health"` |
| Web route contract TDD red/green | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="account-bound basket import review"` |
| Diff whitespace | Pass | `rtk git diff --check` |
| Full repository tests | Pass | `rtk npm test` |
| Build | Pass | `rtk npm run build` |
| Typecheck | Pass | `rtk npm run typecheck` |
| Product PR merge | Pending | Product PR not opened yet. |
| Audit PR merge | Pending | Audit merge proof requires a follow-up after product PR lands. |

## Guardrails checked

- Review rows are account-bound and cannot be resolved from another user id.
- Unmatched retailer rows do not enter the basket during import.
- Accepted review rows require a verified GroceryView `productId` before they update the basket.
- Dismissed review rows leave the basket unchanged and leave the open queue.
- Static web copy does not render private review data or fake queue rows.

## Code-review graph note

The project instruction asks for code-review-graph MCP tools before file scanning. Those MCP tools were not available in this execution context, so this audit was produced from direct repository inspection and targeted tests instead.

## Remaining research findings after this round

- Enable secure retailer basket transfer only where retailer capabilities are verified, not from static assumptions.
- Complete production readiness checks across every required chain, store, and product target.
- Replace manual fulfillment evidence snapshots with official live retailer fulfillment APIs where contracts and compliance allow.
- Persist basket import review rows in the production database instead of the in-memory demo API store.
