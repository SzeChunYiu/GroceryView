# Iteration 102 Deliverable Audit — Connected Price Freshness UI

## Objective restatement

Expose live freshness and backfill evidence in the web UI so customers and operators can tell whether grocery price rows are fresh enough to power deal boards, alerts, and basket totals.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Add UI regression before implementation | Web page-generation tests require a connected freshness panel, API fetch, metrics, and result copy on `retailers/freshness/index.html` | Red then green |
| Connect existing freshness API to UI | `apps/web/scripts/pages.mjs` fetches `/api/prices/freshness?asOf=...` and renders fresh/aging/stale counts, backfill IDs, freshness thresholds, and stale-product names | Implemented |
| Preserve local preview behavior | Without an API base, the retailer freshness page keeps static chain-level copy visible and reports local preview mode | Implemented |
| Keep trust guardrails visible | Existing freshness guardrails remain beside the connected API panel | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Tracked by this PR |

## Live real-data pull evidence

As part of this iteration, the existing Open Prices smoke was run against the live public Open Food Facts Open Prices API with a custom User-Agent.

| Field | Evidence |
| --- | --- |
| Command | `rtk env OPEN_PRICES_USER_AGENT='GroceryViewCodex/0.1 (https://github.com/SzeChunYiu/GroceryView)' OPEN_PRICES_SIZE=10 OPEN_PRICES_OUTPUT_PATH=/tmp/groceryview-open-prices-smoke.json infra/scripts/smoke-open-prices.sh` |
| Result | Passed |
| Source URL | `https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10&location__osm_address_country_code=SE&order_by=-date` |
| Status / bytes | `200`, `29644` bytes |
| Retrieved at | `2026-05-20T11:17:29.122Z` |
| Content hash | `sha256:f7e9c2ed96ca7157bea3fe7b545434fa879b39aa0df29c7d7596eb613fd3b08d` |
| Accepted rows | `5` accepted, `0` rejected |
| First accepted row | `Deli Plant Beef Fresh`, `ICA Kvantum`, `46.32 SEK`, observed `2026-05-19T00:00:00.000Z` |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/web` | Connected freshness UI regression passes |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | TypeScript checks pass |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The UI can now pull freshness data from the API, and the Open Prices smoke proved a live public pull locally.
- Production readiness still needs a hosted deployment, migrated PostgreSQL, hosted Open Prices import proof, and scheduled-worker evidence.
