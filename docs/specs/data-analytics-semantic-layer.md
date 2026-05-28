# Data analytics semantic layer

## Purpose

GroceryView is a **data analytics product**, not only a website. Metrics must be defined once in the [metric dictionary](./metric-dictionary.md) and reused identically across website panels, market dashboard, admin dashboards, saved views, and future BI exports.

## Principles

1. **One metric, one definition** — `deal_score` means the same on Deals, Product, Market, Watchlist, and reports.
2. **Explicit grain** — every metric declares product × store × category × chain × region × domain × day.
3. **Confidence and freshness rules are part of the metric** — not reimplemented per page.
4. **Public claim boundaries** — each metric documents what must *not* be claimed publicly.
5. **Events feed metrics** — analytics events in [event tracking spec](./analytics-event-tracking.md) map to funnel and quality metrics.
6. **Freshness SLA per metric** — stale metrics show caveats or hide panels.

## Metric definition shape (required fields)

| Field | Description |
|-------|-------------|
| `id` | Stable snake_case identifier |
| `label` | Human-readable name |
| `description` | Plain-language definition |
| `owner` | `data_engineering` \| `analytics` \| `product` |
| `grain` | Smallest aggregation unit |
| `formula` | SQL or pseudocode |
| `inputs` | Source tables/columns |
| `dimensions` | Sliceable attributes |
| `freshnessSlaHours` | Max age before downgrade |
| `confidenceRules` | When to show high/medium/low |
| `publicClaimBoundary` | What we must not imply |

## Core metrics (registry)

Price: `current_best_price`, `unit_price`, `price_index`, `chain_price_index`, `category_price_index`, `weekly_change_pct`, `three_month_change_pct`, `one_year_change_pct`

Deal: `deal_score`, `deal_label`, `price_spread_pct`

Quality: `freshness_rate`, `coverage_rate`, `confidence_score`, `observation_count`, `source_success_rate`

Search/UX: `search_zero_result_rate`, `search_to_product_click_rate`, `watchlist_alert_trigger_rate`

## Dimensions

`domain`, `date`, `source`, `chain`, `store`, `category`, `subcategory`, `region`, `kommun`, `fuel_grade`, `pharmacy_ean`, `confidence_label`, `freshness_label`, `deal_label`

## Analytics event contract

Events use `noun_verb` naming and include: `eventName`, `occurredAt`, `sessionId`, `pagePath`, optional `domain`, `entityType`, `entityId`, `sourcePanel`, `metadata`.

## Examples

**Good:** Market category table shows `weekly_change_pct`, `three_month_change_pct`, `one_year_change_pct` from the same index engine used on `/index/[symbol]`.

**Good:** Deal card label (`Real Deal` / `Fair Discount` / `Not Really a Deal`) comes from shared `classifyDeal()` + dictionary definition.

## Anti-patterns

- Recomputing “best price” differently on Search vs Product vs Deals.
- Showing percentage change without stating observation window (weekly vs 3M vs 1Y).
- Dashboard-specific metric names (`marketDealScore` vs `deal_score`).
- Public pages inventing metrics not in the dictionary.

## Required tests

- `metric-definitions.test.mjs` — dictionary entries have required fields.
- Cross-page tests: same product shows consistent `deal_label` and `current_best_price` on search card, product page, deals board.
- Index consistency: category index weekly change on `/market` matches category index route for same slug/filters.

## PR update checklist

- [ ] New visible metric → add row to [metric dictionary](./metric-dictionary.md)
- [ ] Changed formula → update dictionary + downstream tests
- [ ] New dashboard panel → document dimensions and filters here or in dictionary
