# Iteration 104 Deliverable Audit — Connected Daily Deals UI

## Objective restatement

Move the daily shopper deal board from static example rows toward live GroceryView market data. The page should pull top deals from the public market overview and show best price, store, Deal Score, verdict mix, and ranked-deal count.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected daily deals panel, API fetch, metric data attributes, and connected result copy on `deals/today/index.html` | Red then green |
| Connect public market overview route | `apps/web/scripts/pages.mjs` fetches `/api/market/overview` and reads `topDeals` for the daily deal board | Implemented |
| Render customer-interesting deal numbers | The connected panel renders top deal ticker, best price, store id, Deal Score, verdict, ranked-deal count, Buy count, and Compare count | Implemented |
| Preserve local preview behavior | Without an API base, the page keeps static ranked deal rows and reports local preview mode | Implemented |
| Keep deal trust guardrails visible | Existing ad-exclusion, estimated-row, and member-price guardrails remain beside the connected API panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected daily deals UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The daily deals page can pull public market data, but hosted proof still needs a deployed API base and fresh production data.
- Other static shopper surfaces still need the same connected-treatment pass before the broad UI objective can be considered complete.
