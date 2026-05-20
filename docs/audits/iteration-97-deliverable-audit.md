# Iteration 97 Deliverable Audit — Market Mover Board

## Objective restatement

Improve the GroceryView web UI so the market overview shows the customer-interesting grocery-price numbers people expect from stock-style market pages: current quote, 1M move, 52-week position, same-product gap versus Stockholm median, and evidence quality.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add stock-style market overview | `/market/` now includes a `Grocery mover board` section with `Biggest verified movers` copy | Implemented |
| Show historical movement | Mover rows show `1M move` for each staple | Implemented |
| Show 52-week context | Mover rows show `52W position` such as near-low, bottom-quartile, or middle-range context | Implemented |
| Show same-product Stockholm context | Mover rows include the gap `vs Stockholm median` for the same package | Implemented |
| Show evidence quality | Mover rows include verified-observation counts | Implemented |
| Keep safety guardrails visible | The market page states that estimated rows cannot top the mover board | Implemented |
| Test the UI contract | `apps/web/scripts/pages.test.mjs` asserts the new market mover labels and safety copy | Verified by tests |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Static page-generation test passes with market mover requirements |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The market mover board is static web copy; live market-wide mover APIs and connected browser pulls are still needed.
- Real production data freshness still depends on hosted ingestion/import, retailer-specific Stockholm connectors, and source-access approvals.
