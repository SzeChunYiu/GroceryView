# Iteration 83 Deliverable Audit — Product Price Terminal UI

## Objective restatement

Continue improving GroceryView's customer-facing UI and ship each fix through a PR merged to `main`. This iteration targets the explicit request for grocery-price views that feel like TradingView or Seeking Alpha: same-product distribution vs Stockholm/local area, stock-like history, and customer-interesting evidence numbers.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Improve customer-visible UI | `apps/web/scripts/pages.mjs` enriches `products/coffee/index.html` from a basic product ticker into a product price terminal | Implemented |
| Show same product vs Stockholm price distribution | Product page includes a `Stockholm vs local price distribution` section with Stockholm P05/P25/Median/P75/P95 and histogram marker | Implemented |
| Show same product vs local area distribution | Product page includes Odenplan local P05/P25/Median/P75/P95, local histogram marker, and local percentile copy | Implemented |
| Provide stock-style historical view | Product page includes `Trading-style price chart`, range toggles, candlestick-style SVG, moving median line, promo marker, 52-week low, and 30D median signals | Implemented |
| Surface customer-interesting grocery numbers | Quote strip shows best verified shelf price, lowest visible promo, 52W range, evidence volume, Deal Score, Stockholm shelf percentile, local promo percentile, freshness, and the guarded current-price table keeps unit prices | Implemented |
| Keep evidence safety visible | Existing price evidence guardrails remain and current prices still label promotion, member, estimated, confidence, and observed time | Preserved |
| Add styling for the new UI | `apps/web/public/styles.css` adds quote strip, distribution board, histogram, and responsive rules | Implemented |
| Verify generated static page output | `apps/web/scripts/pages.test.mjs` asserts terminal, distribution, local percentile, candlestick history, and stock-style signals are present | Covered |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Static page-generation tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Product distribution and candlestick data are still static page evidence, not live-rendered from a production database.
- Real external grocery data ingestion still depends on provider credentials/source approvals/readiness gates; this UI makes the needed customer numbers visible once live data is connected.
- Only the coffee product detail page gets the terminal treatment in this PR; other product pages should reuse the same pattern after product detail routing/data is generalized.
