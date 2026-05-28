# 07 — Task F: Analytics Event Implementation

## Task
Make analytics event tracking consistent with the metric dictionary and event tracking spec.

## Scope
```text
apps/web/src/lib/analytics.ts
apps/web/src/app/search/page.tsx
apps/web/src/app/deals/page.tsx
apps/web/src/app/market/page.tsx
apps/web/src/app/map/page.tsx
docs/specs/analytics-event-tracking.md
docs/specs/metric-dictionary.md
apps/web/scripts/metric-definitions.test.mjs
```

## Do
Define or update `AnalyticsEvent` type. Add helper:
```text
trackGroceryViewEvent(event)
```

Use canonical event names:
```text
search_submitted
search_filter_applied
search_sort_changed
search_result_clicked
product_opened
deal_card_clicked
market_filter_changed
market_heatmap_cell_clicked
map_marker_selected
preview_opened
evidence_drawer_opened
fuel_grade_selected
pharmacy_otc_alert_set
watchlist_item_added
```

## Do not
Do not invent multiple names for the same event. Do not track sensitive/private data without consent. Do not block page navigation on analytics.

## Tests
```bash
npm run test -w @groceryview/web -- apps/web/scripts/metric-definitions.test.mjs
```
