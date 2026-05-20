# Iteration 87 Deliverable Audit — Product Price Terminal API

## Objective restatement

Continue turning GroceryView into a TradingView/Seeking Alpha-style grocery-price product. Prior UI work made the coffee terminal visible; this iteration makes the same terminal numbers available through the API so web/mobile clients can render them from product data instead of hand-coded copy.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Expose customer-interesting product numbers | `ProductPriceTerminalReport` returns best quote, unit price, Deal Score band, 1M move, 52-week range, and evidence volume | Implemented |
| Show same-product Stockholm/local distribution | `getProductPriceTerminal()` returns whole-Stockholm and local-area distribution rows with sample size, min/P05/P25/median/P75/P95/max, percentile, and customer-readable comparison copy | Implemented |
| Support historic stock-like chart data | API report includes `buildPriceChartSeries()` output with confidence-aware line style, points, markers, and history summary/new-low status | Implemented |
| Make it available to clients | Server exposes `GET /api/products/{id}/terminal`; OpenAPI documents the public route | Implemented |
| Verify route and unknown-product behavior | API/server/OpenAPI tests cover the report, chart data, distribution values, and 404 handling for missing products | Covered |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/api` | API terminal tests pass |
| `rtk npm run test --workspace @groceryview/server` | HTTP/OpenAPI route tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Web/mobile UIs still need to call `/api/products/{id}/terminal` in connected mode; the current static product page still renders bundled demo evidence.
- Real terminal values still depend on approved retailer endpoints, provider-specific adapters, durable snapshot storage, and scheduled ingestion worker proof.
