# Iteration 99 Deliverable Audit — Connected Market Movers UI

## Objective restatement

Make the stock-style market mover board actionable with real API data by wiring `/market/` to fetch `/api/market/overview` and render the live leader, 1M move, 52-week range/position, Stockholm median gap, and verified-history evidence.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Preserve static market board | Existing `/market/` mover table remains visible without API configuration | Preserved |
| Add connected market pull | New `market-movers` flow fetches `/api/market/overview` from the configured API base | Implemented |
| Render live leader | `data-market-movers-leader` shows product, current price, 1M move, and Stockholm median gap | Implemented |
| Render live 52-week context | `data-market-movers-range` shows 52-week range and range position from `range52WeekPositionPercent` | Implemented |
| Render live evidence quality | `data-market-movers-evidence` shows verified-history counts | Implemented |
| Keep fail-safe preview behavior | Missing API base or API failure leaves the static board visible with explicit status copy | Implemented |
| Test the UI contract | Web page-generation tests assert the flow hooks, fetch path, and live mover fields | Verified by tests |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Static page-generation test passes with connected market hooks |
| `rtk npm run build --workspace @groceryview/web` | Web build passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Hosted proof still depends on deployment plus fresh Open Prices/imported or retailer-approved observations.
- Market-wide movers are now API-connectable, but broader screens such as category movers, watchlists, and budget impact can still be upgraded with the same live-tape pattern.
