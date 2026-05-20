# Iteration 110 Deliverable Audit — Connected Price Confidence UI

## Objective restatement

Move the price confidence guide from static label copy toward live terminal evidence. Shoppers should be able to load current quote eligibility, current price-row volume, verified-history ratio, evidence guardrails, and confidence-styled chart series from `/api/products/{id}/terminal`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected price confidence panel, load action, metric data attributes, `/api/products/{id}/terminal` fetch, and connected result copy on `prices/confidence/index.html` | Red then green |
| Connect public terminal evidence route | `apps/web/scripts/pages.mjs` fetches `/api/products/coffee/terminal` from the configured API base without requiring protected account state | Implemented |
| Render customer-interesting confidence numbers | The connected panel renders quote eligibility, current price-row count, verified-history ratio, evidence guardrail count, and confidence-styled chart-series count | Implemented |
| Preserve local preview behavior | Without an API base, the static confidence guide stays visible and explains that the API session bridge is needed for live evidence | Implemented |
| Keep trust labels visible | Existing verified shelf, retailer page, member-only, estimated, low-confidence, alert, and deal-board trust rules remain beside the connected evidence panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected price confidence UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Price confidence can pull live product-terminal evidence, but hosted proof still needs a deployed API base and fresh production price observations.
- Savings ledger, smart swaps, meal-planning, pantry, nutrition, loyalty, billing, and catalog-coverage shopper surfaces still need connected-treatment passes where they remain static.
