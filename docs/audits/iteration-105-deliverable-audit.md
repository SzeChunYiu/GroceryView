# Iteration 105 Deliverable Audit — Connected Budget Forecast UI

## Objective restatement

Move the household budget forecast page from static example values toward protected account data. Shoppers should be able to load their live weekly/monthly budget status, actual remaining buffers, next-basket estimate, and after-estimate budget impact from `/api/budget/summary`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected budget API panel, load action, metric data attributes, `/api/budget/summary` fetch, and connected result copy on `budget/forecast/index.html` | Red then green |
| Connect protected budget summary route | `apps/web/scripts/pages.mjs` fetches `/api/budget/summary` with bearer headers from the API session bridge | Implemented |
| Render customer-interesting budget numbers | The connected panel renders weekly budget status, monthly budget status, actual remaining buffers, next-basket estimate, and after-estimate buffer | Implemented |
| Preserve local preview behavior | Without an API session, the page keeps the static forecast ledger and reports local preview mode | Implemented |
| Keep budget trust guardrails visible | Existing correction-plan guardrails remain beside the connected API panel so estimated prices still cannot create false savings | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected budget forecast UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Budget forecast UI can pull protected account summary data, but hosted proof still needs a deployed API base, real provider auth, and durable database-backed budget rows.
- Other static shopper surfaces still need the same connected-treatment pass where they remain static.
