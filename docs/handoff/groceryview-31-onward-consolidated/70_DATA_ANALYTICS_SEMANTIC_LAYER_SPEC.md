# 70 — Data Analytics Semantic Layer Spec

## Goal

Make GroceryView a data analytics project, not only a website.

Metrics must be defined once and reused across:

```text
website panels
market dashboard
admin dashboards
saved views
reports
future BI tools
```

## Semantic layer principle

A metric should not be redefined differently in every page.

Example:

```text
deal_score
```

should mean the same thing in:

```text
Deals page
Product page
Market dashboard
Watchlist alerts
Analytics reports
```

## Metric definition shape

```ts
type MetricDefinition = {
  id: string;
  label: string;
  description: string;
  owner: "data_engineering" | "analytics" | "product";
  grain: "product" | "store" | "category" | "chain" | "region" | "domain" | "day";
  formula: string;
  inputs: string[];
  dimensions: string[];
  filters?: string[];
  freshnessSlaHours: number;
  confidenceRules: string[];
  publicClaimBoundary: string;
};
```

## Core metrics

```text
current_best_price
unit_price
price_index
chain_price_index
category_price_index
weekly_change_pct
three_month_change_pct
one_year_change_pct
deal_score
deal_label
price_spread_pct
freshness_rate
coverage_rate
confidence_score
observation_count
source_success_rate
search_zero_result_rate
search_to_product_click_rate
watchlist_alert_trigger_rate
```

## Dimensions

```text
domain
date
source
chain
store
category
subcategory
region
kommun
fuel_grade
pharmacy_ean
confidence_label
freshness_label
deal_label
```

## Analytics dashboards

### Product analytics

```text
most searched products
most clicked products
products with high zero-result recovery
watchlist adds
```

### Market analytics

```text
category index movement
chain index movement
deal opportunity
coverage
```

### Data quality analytics

```text
freshness
coverage
dead letters
source run success
```

### UX analytics

```text
task completion
search → product click
deal → product click
map → store click
preview → full page click
```

## Analytics event contract

```ts
type AnalyticsEvent = {
  eventId: string;
  eventName: string;
  occurredAt: string;
  userId?: string;
  sessionId: string;
  pagePath: string;
  domain?: "grocery" | "pharmacy" | "fuel";
  entityType?: string;
  entityId?: string;
  sourcePanel?: string;
  metadata?: Record<string, unknown>;
};
```

## Claude Code task

Generate:

```text
docs/analytics/metric-dictionary.md
docs/analytics/event-tracking-plan.md
packages/metrics/src/definitions.ts
tests/schema/metric-definitions.test.mjs
```
