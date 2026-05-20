# Iteration 89 Deliverable Audit — Nest Product Terminal Endpoint

## Objective restatement

Continue making GroceryView able to pull real customer-facing grocery-price numbers from API surfaces. The core server already exposes `/api/products/{id}/terminal`; this iteration adds the same stock-style terminal report to the newer Nest API app so clients using that surface can retrieve quote, Stockholm/local distribution, history, and chart data.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Expose product terminal numbers from the Nest API app | `apps/api/src/products/products.controller.ts` adds `GET /products/:id/terminal` backed by `createGroceryViewApi().getProductPriceTerminal()` | Implemented |
| Preserve same-product Stockholm/local distribution | API app e2e tests assert `Whole Stockholm` and `Odenplan local area` distributions in the terminal response | Covered |
| Preserve stock-like history/chart payload | API app e2e tests assert chart series id, history new-low status, quote best price, ticker, and evidence guardrails | Covered |
| Document route in OpenAPI | API app e2e test asserts `/products/{id}/terminal` appears in `/api-json` | Covered |
| Fail closed for unknown products | API app e2e test asserts `/products/missing-product/terminal` returns 404 | Covered |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/api-app` | Nest API app e2e tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Nest and core server API surfaces can return seeded terminal data, but hosted API proof and provider-backed retailer ingestion are still missing.
- Mobile screens still need to consume the terminal endpoint.
