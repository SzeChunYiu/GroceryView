# Atomic gap registry

Track small missing pieces so GroceryView does not drift. Each gap has a stable ID, severity, fix, and test requirement. Update status in PRs that close gaps.

**Format:** `ProjectGap { id, area, severity, pageOrFeature, description, userImpact, fix, testRequired, status }`

---

## Open gaps

### `search-category-label-url`

| Field | Value |
|-------|-------|
| area | uiux |
| severity | high |
| pageOrFeature | Search / products facets |
| description | Category facet links pass display labels (e.g. `Dairy`) in `?category=` instead of canonical slugs (`mejeri-ost-och-agg`). API tests still assert `facets.categories` values as labels even though search cards pass `categorySlug`. |
| userImpact | Wrong filters, zero results, inconsistent routes vs `/browse/[slug]`. |
| fix | Emit `categorySlug` on search facets; link with slug; migrate filter normalization. |
| testRequired | Facet href uses slug; filtered search returns expected rows. Enforced by `atomic-gap-registry.test.mjs` (open-gap probe). |
| status | open |

### `mvp-mover-category-slug-derivation`

| Field | Value |
|-------|-------|
| area | data |
| severity | high |
| pageOrFeature | MVP market / deals data (`apps/web/src/lib/mvp/data.ts`) |
| description | `categorySlug` derived from `categoryLabel.toLowerCase().replace(...)` instead of product.category slug, breaking links for non-ASCII or mismatched labels. |
| userImpact | Broken category/market links from biggest movers and deal cards. |
| fix | Use `product.category` or explicit slug from verified-data movers. |
| testRequired | Mover links resolve to existing category routes. Evidence: `verified-data.ts` `categorySlug: product.category` on movers board. |
| status | done |

### `market-table-missing-3m-1y`

| Field | Value |
|-------|-------|
| area | analytics |
| severity | high |
| pageOrFeature | `/market` category index table |
| description | `CategoryIndexRow` type includes `threeMonthChangePct` and `oneYearChangePct` but table only renders Weekly, Observations, Freshness. |
| userImpact | Users cannot compare medium/long-term category trends on market overview. |
| fix | Add 3M and 1Y columns from snapshot; label windows clearly (W / 3M / 1Y). |
| testRequired | Route test asserts table headers include 3M and 1Y. Evidence: `market-search-ui.test.mjs`. |
| status | done |

### `public-debug-copy-cursor-pagination`

| Field | Value |
|-------|-------|
| area | content |
| severity | medium |
| pageOrFeature | `/search` |
| description | Public heading reads “Server-side cursor pagination” and explains cursor windows — backstage implementation detail. |
| userImpact | User confusion; reads like developer docs. |
| fix | Replace with “Showing X–Y of Z results”; move pagination detail to admin/docs only. |
| testRequired | Content lint blocks phrase `Server-side cursor pagination` on public routes. Evidence: `content-copy-audit.test.mjs`, `market-search-ui.test.mjs`. |
| status | done |

### `public-infra-copy-market-shell`

| Field | Value |
|-------|-------|
| area | content |
| severity | medium |
| pageOrFeature | Locale home / `market-shell.tsx` |
| description | Public sections headline “Redis cache, cursor pagination, and pooler guardrails” with TTL/coverage ops copy. |
| userImpact | Shoppers see infrastructure jargon unrelated to price questions. |
| fix | Remove or relocate to `/data-sources` admin/ops audience; frontstage shows price evidence only. |
| testRequired | Content lint blocks `Redis cache` and `pgbouncer` on locale entry pages. Evidence: `content-copy-audit.test.mjs`. |
| status | done |

### `analytics-event-naming-gap`

| Field | Value |
|-------|-------|
| area | analytics |
| severity | medium |
| pageOrFeature | Search, product, deals funnels |
| description | Spec still lists `deal_opened` while runtime uses `deal_card_clicked`, and no consolidated telemetry test asserts `GROCERYVIEW_ANALYTICS_EVENT_NAMES` against the dictionary. |
| userImpact | Cannot measure search→product conversion or deal engagement consistently. |
| fix | Align spec/runtime names and add telemetry tests for canonical event coverage. |
| testRequired | Telemetry tests assert event names match dictionary. Enforced by `atomic-gap-registry.test.mjs` (open-gap probe). |
| status | open |

### `search-results-missing-evidence-strip`

| Field | Value |
|-------|-------|
| area | uiux |
| severity | medium |
| pageOrFeature | `/search` result cards |
| description | Search result articles show price labels but no shared freshness/confidence evidence strip unlike MVP product/deals surfaces. |
| userImpact | Users cannot judge trust of search hits vs product page. |
| fix | Add `EvidenceStrip` or compact confidence/freshness badges per card. |
| testRequired | Search card render test includes confidence + freshness labels when data present. Evidence: `search-result-preview-card.tsx` (`EvidenceStrip`). |
| status | done |

### `metric-dictionary-not-centralized`

| Field | Value |
|-------|-------|
| area | analytics |
| severity | medium |
| pageOrFeature | Cross-page price/deal displays |
| description | Deal scores and price changes computed inline in pages/components rather than imported from shared `packages/metrics` definitions. |
| userImpact | Same product may show inconsistent deal labels or change % across surfaces. |
| fix | Add `packages/metrics/src/definitions.ts`; pages import canonical formulas. |
| testRequired | Cross-surface consistency test for sample product slugs. Evidence: `metric-definitions.test.mjs`. |
| status | done |

### `market-chain-index-no-chart`

| Field | Value |
|-------|-------|
| area | uiux |
| severity | low |
| pageOrFeature | `/market` chain index section |
| description | Chain index renders text summary of latest value and weekly change but no sparkline/chart despite index point series available. |
| userImpact | Harder to scan trend vs category table sparklines. |
| fix | Reuse price chart component with accessible table fallback. |
| testRequired | Market page includes chart or documented table fallback for SR. Evidence: `market-search-ui.test.mjs` (`ChartShell`, `MultiLineChart`). |
| status | done |

### `verified-data-fail-closed-banner-public`

| Field | Value |
|-------|-------|
| area | content |
| severity | low |
| pageOrFeature | `verified-data.ts` production readiness labels |
| description | Public-facing verified-data modules expose “fail closed until Redis cache and pgbouncer are configured” strings reachable from data-sources/market contexts. |
| userImpact | Ops status leaks into shopper-facing trust copy. |
| fix | Split operator readiness from public evidence labels. |
| testRequired | Public routes do not render `fail closed until Redis` phrase. Enforced by `atomic-gap-registry.test.mjs` (open-gap probe). |
| status | open |

---

## Gap summary

| Status | Count |
|--------|-------|
| open | 3 |
| in_progress | 0 |
| done | 7 |

**Total gaps:** 10

---

## How to add a gap

1. Assign `kebab-case-id` unique in this file.
2. Set severity from user/data impact.
3. Link fix to a test name or script.
4. Reference in PR: `Tracks gap: [id]` or `Fixes gap: [id]`.

## Required tests (registry meta)

- `apps/web/scripts/atomic-gap-registry.test.mjs` — file exists, ≥8 gap IDs, required field keywords present, summary counts match statuses, open/done probes match code.
