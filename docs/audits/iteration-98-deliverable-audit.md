# Iteration 98 Deliverable Audit — Market Movers API

## Objective restatement

Make the market-mover UI real-data ready by exposing the same customer-interesting stock-style numbers through `/api/market/overview`: current quote, 1M move, 52-week range and position, same-product Stockholm median gap, and verified-history counts.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Preserve existing market overview | `getMarketOverview()` still returns city, indices, and top deals | Preserved |
| Add API-backed mover rows | `getMarketOverview()` now returns `movers` sorted by absolute 1M move | Implemented |
| Show current price and store | Each mover includes `currentPrice`, `bestStoreId`, and `bestStoreName` | Implemented |
| Show historical movement | Each mover includes `oneMonthMovePercent` | Implemented |
| Show 52-week context | Each mover includes `range52Week` and `range52WeekPositionPercent` | Implemented |
| Show Stockholm same-product comparison | Each mover includes `stockholmMedianGap` | Implemented |
| Show evidence quality | Each mover includes `historyPoints` and `verifiedHistoryPoints` | Implemented |
| Test HTTP/API behavior | API and server tests assert the coffee mover metrics through the public market endpoint | Verified by tests |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/api` | API route tests pass with mover payload |
| `rtk npm run test --workspace @groceryview/server` | HTTP endpoint tests pass with mover payload |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The web market page still needs a connected browser pull that renders the new `movers` response live.
- Hosted proof still depends on deployment plus fresh Open Prices/imported or retailer-approved observations.
