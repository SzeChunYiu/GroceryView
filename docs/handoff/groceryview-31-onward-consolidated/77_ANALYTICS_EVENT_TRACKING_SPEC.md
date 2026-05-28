# 77 — Analytics Event Tracking Spec

## Goal

Track product usage like a data analyst project.

## Event naming

Use:

```text
noun_verb
```

Examples:

```text
search_submitted
search_result_clicked
product_opened
deal_opened
watchlist_item_added
map_marker_selected
preview_opened
evidence_drawer_opened
fuel_grade_selected
pharmacy_otc_alert_set
```

## Core events

### Search

```text
search_submitted
search_filter_applied
search_sort_changed
search_result_clicked
search_zero_result
search_suggestion_clicked
```

### Product

```text
product_opened
product_quote_clicked
product_watchlist_added
product_similar_clicked
product_evidence_opened
```

### Deals

```text
deal_tab_selected
deal_card_clicked
deal_explanation_opened
```

### Market

```text
market_filter_changed
market_category_clicked
market_heatmap_cell_clicked
market_saved_view_created
```

### Map

```text
map_layer_changed
map_marker_selected
map_store_opened
map_list_fallback_used
```

### Pharmacy

```text
pharmacy_product_clicked
pharmacy_ean_comparison_opened
pharmacy_alert_set
```

### Fuel

```text
fuel_grade_selected
fuel_station_candidate_clicked
fuel_alert_set
fuel_detour_calculated
```

## Event payload

```ts
type AnalyticsEvent = {
  eventName: string;
  occurredAt: string;
  sessionId: string;
  userId?: string;
  pagePath: string;
  domain?: "grocery" | "pharmacy" | "fuel";
  entityType?: string;
  entityId?: string;
  sourcePanel?: string;
  rank?: number;
  filters?: Record<string, string>;
  metadata?: Record<string, unknown>;
};
```

## Analytics dashboards

```text
Search quality
Conversion funnel
Deal engagement
Market dashboard usage
Map usage
Watchlist/alerts
Data quality correlation
```
