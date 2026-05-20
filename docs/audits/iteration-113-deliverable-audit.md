# Iteration 113 Deliverable Audit — Connected Catalog Coverage UI

## Objective restatement

Move the catalog coverage dashboard from static coverage rows toward live public API evidence. Shoppers and operators should be able to load product/category coverage, freshness mix, store-chain footprint, market rows, and backfill actions before low-coverage rows power deal boards, alerts, or basket forecasts.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected catalog coverage panel, load action, metric data attributes, `/api/prices/freshness`, `/api/stores`, and `/api/market/overview` fetches, and connected result copy on `catalog/coverage/index.html` | Red then green |
| Pull live public coverage evidence | `apps/web/scripts/pages.mjs` fetches freshness, store, and market overview routes from the configured API base without requiring protected account state | Implemented |
| Render customer/operator coverage numbers | The connected panel renders live product count, category count, market-row count, fresh/aging/stale counts, store count, chain count, district count, and backfill product IDs | Implemented |
| Preserve coverage guardrails | Existing stale-row, low-confidence-produce, and unit-price completeness guardrails remain visible beside the connected API panel | Implemented |
| Keep fail-closed local preview | Without an API base, the page keeps static coverage rows and explains that the API bridge is needed for live coverage evidence | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected catalog coverage UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Catalog coverage can pull live public API evidence, but hosted proof still needs a deployed API base and fresh production price observations.
- Meal-planning, pantry, nutrition, loyalty, and billing shopper surfaces still need connected-treatment passes where they remain static.
