# Iteration 96 Deliverable Audit — Live Product Terminal Movement Metrics

## Objective restatement

Improve the GroceryView product UI so customer-facing product terminals show more of the stock-style numbers people expect: current quote, same-product Stockholm/local distributions, historical movement, 52-week range, and evidence quality. This iteration focuses on the connected web terminal panel, using fields already returned by `/api/products/{id}/terminal`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Preserve existing TradingView-style product page | `apps/web/scripts/pages.mjs` still renders quote strip, Stockholm/local distribution, candlestick-style chart, evidence guardrails, and the connected API panel | Preserved |
| Show live historical movement | Connected product-terminal script now reads `quote.oneMonthMovePercent` and renders `data-product-terminal-move` as a 1M move plus Stockholm median gap | Implemented |
| Show live 52-week range | Connected product-terminal script now reads `quote.range52Week` and renders `data-product-terminal-range` | Implemented |
| Show live evidence quality | Connected product-terminal script now reads `quote.evidenceVolume.verifiedHistoryPoints` and renders `data-product-terminal-evidence` | Implemented |
| Keep same-product Stockholm/local distribution | Existing connected panel still renders Stockholm and local distribution summaries from `payload.distributions` | Preserved |
| Test the UI contract | `apps/web/scripts/pages.test.mjs` asserts the new data hooks and API field usage (`oneMonthMovePercent`, `range52Week`, `verifiedHistoryPoints`) | Verified by tests |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Static product page generation test passes with movement/range/evidence hooks |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The connected web panel still depends on a deployed API and operator-provided API base URL for live hosted proof.
- Real production data freshness still depends on hosted ingestion/import and retailer-specific Stockholm connectors/legal approvals.
- More UI can still be added for analyst-style screens such as screener watchlists, category movers, and explainable savings ledgers backed by live persisted observations.
