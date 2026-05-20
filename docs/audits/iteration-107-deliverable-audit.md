# Iteration 107 Deliverable Audit — Connected Store Map UI

## Objective restatement

Move the Stockholm store map from static example rows toward the public stores API. Shoppers should be able to load mapped stores, chains, district coverage, and high-confidence profile counts from `/api/stores` before relying on map or route-planning guidance.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected store map panel, load action, metric data attributes, `/api/stores` fetch, and connected result copy on `stores/map/index.html` | Red then green |
| Connect public stores route | `apps/web/scripts/pages.mjs` fetches `/api/stores` from the configured API base | Implemented |
| Render customer-interesting map numbers | The connected panel renders mapped-store count, chains, district coverage, and high-confidence profile count | Implemented |
| Preserve local preview behavior | Without an API base, the page keeps static map rows and reports local preview mode | Implemented |
| Keep map trust guardrails visible | Existing travel-time, coverage, and pickup-note guardrails remain beside the connected API panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected store map UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Store map can pull public API store rows, but hosted proof still needs a deployed API base and fresh production store coverage.
- Store comparison, route planning, and remaining static shopper surfaces still need connected-treatment passes where they remain static.
