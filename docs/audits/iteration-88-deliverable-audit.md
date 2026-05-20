# Iteration 88 Deliverable Audit — Connected Product Terminal UI

## Objective restatement

Continue turning GroceryView into a TradingView/Seeking Alpha-style grocery-price product. The API now exposes product terminal numbers; this iteration wires the coffee product page to pull `/api/products/{id}/terminal` through the existing API bridge and render customer-facing quote, distribution, and history/chart summaries from the response.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Show customer-interesting product numbers in UI | `apps/web/scripts/pages.mjs` adds a connected product terminal panel with best API quote, Stockholm distribution, local distribution, history, and chart-series summary targets | Implemented |
| Pull real data through an API path | `loadProductTerminalFromApi()` fetches `GET /api/products/${productId}/terminal` from the configured API base and fails closed back to the static preview when no API base or failed response exists | Implemented |
| Preserve safe rendering | The UI updates terminal metrics through `textContent` only; no `innerHTML` rendering is introduced | Implemented |
| Keep static TradingView-style preview | Existing quote strip, Stockholm/local distribution board, candlestick-style SVG, evidence table, and guardrails remain present before a live API pull | Preserved |
| Verify generated static output | `apps/web/scripts/pages.test.mjs` asserts the connected panel, action, result target, API endpoint wiring, local-preview copy, chart-series summary text, and CSS hooks | Covered |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Web page-generation tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The web product page can now call the terminal API in connected mode, but mobile screens still need to consume the endpoint.
- Live terminal values still depend on approved retailer endpoints, provider-specific adapters, durable snapshot storage, hosted API deployment, and scheduled ingestion worker proof.
