# Iteration 112 Deliverable Audit — Connected Savings Ledger UI

## Objective restatement

Move the savings ledger from static receipt examples toward protected account and basket evidence. Shoppers should be able to load budget actuals, next-basket estimate, split-basket forecast savings, assignment evidence, and missing-product blockers before any savings are treated as realized.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected savings ledger panel, load action, metric data attributes, `/api/budget/summary` and `/api/basket/compare` fetches, and connected result copy on `savings/ledger/index.html` | Red then green |
| Connect protected budget and basket routes | `apps/web/scripts/pages.mjs` fetches `/api/budget/summary` and posts `/api/basket/compare` through the API session bridge | Implemented |
| Render customer-interesting savings numbers | The connected panel renders budget actuals, next-basket estimate, split-basket forecast savings, verified assignment-line count, split-store count, and missing-product blockers | Implemented |
| Preserve savings trust rules | Static receipt-confirmation, estimate-rejection, and loyalty-separation guardrails remain beside the connected forecast panel | Implemented |
| Keep fail-closed local preview | Without a protected API session, the page keeps static ledger entries and explains that a saved basket/session is required for live ledger evidence | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected savings ledger UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Savings ledger can pull protected budget and basket forecast evidence, but realized receipt savings still require live receipt ingestion/account data beyond the static examples.
- Meal-planning, pantry, nutrition, loyalty, billing, and catalog-coverage shopper surfaces still need connected-treatment passes where they remain static.
