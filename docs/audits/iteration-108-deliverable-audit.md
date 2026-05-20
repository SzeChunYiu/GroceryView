# Iteration 108 Deliverable Audit — Connected Store Comparison UI

## Objective restatement

Move the Stockholm store comparison page from static example rows toward protected basket comparison data. Shoppers should be able to load favorite-store totals, best single-store option, split-basket total, split-store count, missing products, and savings from `/api/basket/compare`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected store comparison panel, load action, metric data attributes, `/api/basket/compare` fetch, and connected result copy on `stores/compare/index.html` | Red then green |
| Connect protected basket comparison route | `apps/web/scripts/pages.mjs` fetches `/api/basket/compare` with bearer headers from the API session bridge | Implemented |
| Render customer-interesting comparison numbers | The connected panel renders best single-store option, split-basket total, split-store count, savings versus best single-store, favorite-store totals count, and missing products | Implemented |
| Preserve local preview behavior | Without an API session, the page keeps static comparison rows and explains that a saved basket/session is needed | Implemented |
| Keep comparison trust guardrails visible | Existing verified coverage, low-confidence-row, flyer-confirmation, and receipt-confidence guardrails remain beside the connected API panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected store comparison UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Store comparison can pull protected basket-comparison rows, but useful hosted proof still needs a deployed API base, authenticated session, saved basket, and fresh production price data.
- Route planning, savings, pantry, meal-planning, and remaining static shopper surfaces still need connected-treatment passes where they remain static.
