# Iteration 101 Deliverable Audit — Connected Category Market API

## Objective restatement

Move the coffee category page from static category copy toward live, customer-interesting price-market numbers: current price, Deal Score, 1M move, 52-week position, Stockholm median gap, and verified-history evidence.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add category-market API coverage before implementation | API tests assert `getCategoryMarket('coffee')` returns the coffee row with current price, Deal Score, 1M move, 52-week position, median gap, and verified-history counts | Red then green |
| Expose public HTTP route | Server tests cover `/api/categories/coffee/market`; OpenAPI documents `/api/categories/{category}/market` as public | Implemented |
| Connect category UI to real API data | `apps/web/scripts/pages.mjs` adds a connected coffee category panel that fetches `/api/categories/coffee/market` and renders leader/range/median/evidence metrics | Implemented |
| Keep fail-soft local preview | Without an API base, the category page keeps the static board visible and reports local preview mode | Implemented |
| Preserve range semantics | Category rows reuse market mover evidence, including current-inclusive 52-week ranges | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/api` | Category API regression tests pass |
| `rtk npm run test --workspace @groceryview/server` | HTTP route and OpenAPI tests pass |
| `rtk npm run test --workspace @groceryview/web` | Category page generation tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Category market data is connected to the API, but production proof still depends on deployment plus fresh Open Prices/imported or retailer-approved observations.
- The coffee category page is connected first; other category pages still need equivalent connected panels as they are added.
