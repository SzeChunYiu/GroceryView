# Iteration 111 Deliverable Audit — Connected Smart Swaps UI

## Objective restatement

Move the smart swaps page from static substitutions toward live comparable-product evidence. Shoppers should be able to load same-category swap candidates, best known price, Deal Score, estimated savings versus the current best quote, and equivalence reason from public API responses.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected smart swaps panel, load action, metric data attributes, `/api/products/{id}/equivalents` fetch, and connected result copy on `savings/smart-swaps/index.html` | Red then green |
| Connect public equivalents route | `apps/web/scripts/pages.mjs` fetches `/api/products/milk/equivalents` from the configured API base | Implemented |
| Compare against current product quote | The same live action fetches `/api/products/milk/terminal` to estimate savings against the current best quote instead of only listing candidates | Implemented |
| Render customer-interesting swap numbers | The connected panel renders live comparable-product count, best swap price/store, Deal Score, estimated savings, and equivalence reason | Implemented |
| Preserve local preview behavior | Without an API base, static swap candidates and guardrails remain visible with an explicit local-preview message | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected smart swaps UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Smart swaps can pull public equivalent-product evidence, but hosted proof still needs a deployed API base and fresh production price observations.
- Savings ledger, meal-planning, pantry, nutrition, loyalty, billing, and catalog-coverage shopper surfaces still need connected-treatment passes where they remain static.
