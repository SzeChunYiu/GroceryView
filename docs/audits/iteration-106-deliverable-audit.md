# Iteration 106 Deliverable Audit — Connected Store Deals UI

## Objective restatement

Move the Willys Odenplan favorite-store page from static example highlights toward the public store-deals API. Shoppers should be able to load ranked in-store deals with current store price, Deal Score, category coverage, and Buy/Compare verdict mix from `/api/stores/{id}/deals`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected store-deals panel, load action, metric data attributes, `/api/stores/{id}/deals` fetch, and connected result copy on `stores/willys-odenplan/index.html` | Red then green |
| Connect public store-deals route | `apps/web/scripts/pages.mjs` fetches `/api/stores/` + encoded store id + `/deals` from the configured API base | Implemented |
| Render customer-interesting store numbers | The connected panel renders top in-store deal, store price, Deal Score, ranked-deal count, category coverage, and Buy/Compare verdict mix | Implemented |
| Preserve local preview behavior | Without an API base, the page keeps static store highlights and reports local preview mode | Implemented |
| Keep store trust guardrails visible | Existing verified shelf, retailer-page, and estimated/watchlist-only highlights remain beside the connected API panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected store deals UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Store page can pull public API store-deal rows, but hosted proof still needs a deployed API base and fresh production store price data.
- Store comparison, map, and additional shopper surfaces still need the same connected-treatment pass where they remain static.
