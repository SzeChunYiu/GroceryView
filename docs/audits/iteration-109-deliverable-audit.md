# Iteration 109 Deliverable Audit — Connected Shopping Route Planner UI

## Objective restatement

Move the shopping route planner from static example stops toward protected basket-comparison data. Shoppers should be able to load live route stops, product-to-store assignments, split-basket total, split-store count, savings, and missing-product blockers from `/api/basket/compare`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected route planner panel, load action, metric data attributes, `/api/basket/compare` fetch, and connected result copy on `routes/shopping/index.html` | Red then green |
| Connect protected basket comparison route | `apps/web/scripts/pages.mjs` fetches `/api/basket/compare` with bearer headers from the API session bridge | Implemented |
| Render customer-interesting route numbers | The connected panel renders live stop count, assigned products, split-basket total, savings versus best single store, and missing-product blockers | Implemented |
| Preserve local preview behavior | Without an API session, the page keeps static route rows and explains that a saved basket/session is needed | Implemented |
| Keep route trust guardrails visible | Existing no-travel-penalty, pickup-window, and low-confidence-row guardrails remain beside the connected API panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected route planner UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Route planner can pull protected basket-comparison rows, but useful hosted proof still needs a deployed API base, authenticated session, saved basket, and fresh production price data.
- Savings, pantry, meal-planning, price-confidence, and remaining static shopper surfaces still need connected-treatment passes where they remain static.
