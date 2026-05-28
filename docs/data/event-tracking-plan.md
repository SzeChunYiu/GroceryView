# GroceryView event tracking plan

Aligned with [77 — Analytics Event Tracking Spec](../handoff/groceryview-31-onward-consolidated/77_ANALYTICS_EVENT_TRACKING_SPEC.md). Naming convention: `noun_verb`, lowercase snake_case.

## Consent and privacy

| Rule | Implementation |
|------|----------------|
| Analytics requires opt-in | `apps/web/src/lib/analytics.ts` — `analyticsConsentGranted()` / policy `2026-05-22-consent-v1` |
| No PII in payloads | No email, name, phone, raw search text, or user-id in public aggregate pipelines |
| Session linkage | `sessionId` from client header `x-groceryview-session-id` or anonymous runtime id |
| Server emit | `packages/server/src/analytics/events.ts` — strips blocked metadata keys, buckets query length only |

## Event contract

## Canonical public analytics events

These names must match `GROCERYVIEW_ANALYTICS_EVENT_NAMES` in `apps/web/src/lib/analytics.ts`.

```text
search_submitted
search_filter_applied
search_sort_changed
search_result_clicked
product_opened
deal_card_clicked
deal_opened
market_filter_changed
market_heatmap_cell_clicked
map_marker_selected
preview_opened
evidence_drawer_opened
fuel_grade_selected
fuel_station_candidate_clicked
fuel_alert_set
pharmacy_product_clicked
pharmacy_ean_comparison_opened
pharmacy_otc_alert_set
watchlist_item_added
```

```ts
type AnalyticsEvent = {
  eventName: string;
  occurredAt: string;
  sessionId: string;
  userId?: string; // backstage/export only; never in aggregate UX pipelines
  pagePath: string;
  domain?: 'grocery' | 'pharmacy' | 'fuel';
  entityType?: string;
  entityId?: string;
  sourcePanel?: string;
  rank?: number;
  filters?: Record<string, string>;
  metadata?: Record<string, string | number | boolean>;
};
```

## UI → analytics mapping

### Search

| UI surface | Event | Trigger | Payload notes |
|------------|-------|---------|---------------|
| SearchBar submit | `search_submitted` | User submits query | Funnel: `landing_search` via `trackSearchToSavingsFunnelStep`; server: `result_count`, `query_length_bucket` only |
| Filter chips | `search_filter_applied` | Filter change | `filters` keys only (category, domain, diet) |
| Sort control | `search_sort_changed` | Sort change | `metadata.sort` |
| Result card click | `search_result_clicked` | Click product from results | `entityType=product`, `entityId`, `rank` |
| Empty state | `search_zero_result` | Zero cards returned | `metadata.result_count=0` |
| Suggestion row | `search_suggestion_clicked` | Autocomplete pick | `metadata.suggestion_type` |

### Product

| UI surface | Event | Trigger | Payload notes |
|------------|-------|---------|---------------|
| Product detail route | `product_opened` | PDP load | `entityId` = slug/id; server wired on `GET /api/products/:id` |
| Quote / store row | `product_quote_clicked` | Price row interaction | `entityId`, `sourcePanel` |
| Watchlist CTA | `product_watchlist_added` | Add to watchlist | Maps to `watchlist_item_added` on API success |
| Similar products | `product_similar_clicked` | Substitution rail | `entityId`, `rank` |
| Evidence drawer | `product_evidence_opened` | Lineage UI open | `sourcePanel=evidence_drawer` |

### Deals

| UI surface | Event | Trigger |
|------------|-------|---------|
| Deals tabs | `deal_tab_selected` | Tab change |
| Deal card | `deal_card_clicked` | Card navigation |
| Deal detail open | `deal_opened` | Deal explanation/preview opened |
| Deal explainer | `deal_explanation_opened` | Score methodology panel |

### Market

| UI surface | Event | Trigger |
|------------|-------|---------|
| Market filters | `market_filter_changed` | Scope change |
| Category row | `market_category_clicked` | Drill-down |
| Heatmap cell | `market_heatmap_cell_clicked` | Cell select |
| Saved view | `market_saved_view_created` | Save filter set |

### Map

| UI surface | Event | Trigger |
|------------|-------|---------|
| Layer toggle | `map_layer_changed` | Layer change |
| Marker | `map_marker_selected` | Marker tap |
| Store sheet | `map_store_opened` | Store detail |
| List fallback | `map_list_fallback_used` | No geo permission |

### Fuel

| UI surface | Event | Trigger | Payload notes |
|------------|-------|---------|---------------|
| Grade result card | `fuel_grade_selected` | User chooses petrol/diesel grade | `domain=fuel`, `entityType=fuel_grade` |
| Station candidate | `fuel_station_candidate_clicked` | User opens a station candidate from fuel search | `entityType=fuel_station`, `entityId=osmId` |
| Fuel alert CTA | `fuel_alert_set` | User starts fuel grade/station alert flow | Aggregate only; no raw location stored |

### Pharmacy

| UI surface | Event | Trigger | Payload notes |
|------------|-------|---------|---------------|
| OTC result card | `pharmacy_product_clicked` | User opens exact OTC/EAN product | `domain=pharmacy`, `entityType=otc_product` |
| EAN comparison | `pharmacy_ean_comparison_opened` | User opens exact-EAN comparison | `entityId=ean` |
| OTC alert CTA | `pharmacy_otc_alert_set` | User starts pharmacy alert flow | Aggregate only |

### Watchlist

| UI surface | Event | Trigger | Payload notes |
|------------|-------|---------|---------------|
| Add/save alert | `watchlist_item_added` | User saves grocery/pharmacy/fuel watch target | `entityType` identifies domain object |

### Funnel (aggregate, web)

| Step ID | Maps to spec events |
|---------|---------------------|
| `landing_search` | `search_submitted` (session start) |
| `product_view` | `product_opened` |
| `compare_view` | compare surfaces |
| `watchlist_alert` | `watchlist_item_added` / alert flows |
| `basket_view` | basket / list planning |
| `savings_action` | savings dashboard CTA |

API: `POST /api/analytics/search-to-savings-funnel` — aggregate counts only (`packages/analytics/src/funnel.ts`).

### Legacy anonymous events (web)

`apps/web/src/lib/track.ts` — `page_view`, `cta_click`, `search`, `conversion` via `groceryview_anonymous_client_event` (buckets in `packages/server/src/lib/events.ts`).

## Server instrumentation (minimal)

| Route | Event | Metadata |
|-------|-------|----------|
| `GET /api/products`, `GET /api/products/search` | `search_submitted` | `result_count`, `query_length_bucket` |
| `GET /api/products/:id` | `product_opened` | `entityType=product`, `entityId` |
| `POST /api/watchlist` | `watchlist_item_added` | `entityType=product`, `entityId` |

Implementation: `emitServerAnalyticsEvent()` in `packages/server/src/analytics/events.ts`.

## Dashboard mapping

| Dashboard | Primary events / metrics |
|-----------|----------------------------|
| Search quality | `search_submitted`, `search_zero_result`, `search_zero_result_rate` |
| Conversion funnel | Funnel steps + `search_to_product_click_rate` |
| Deal engagement | `deal_card_clicked`, `deal_explanation_opened`, `deal_score` |
| Market usage | `market_*` events, `chain_price_index`, `category_index_daily` |
| Map usage | `map_*` events |
| Watchlist / alerts | `watchlist_item_added`, `watchlist_alert_trigger_rate` |
| Data quality correlation | `source_success_rate`, `freshness_rate`, `coverage_rate` |

## Storage (target)

| Layer | Table / store | Notes |
|-------|---------------|-------|
| Bronze | `search_events` | Partitioned by `event_date` (handoff 69) |
| Export | `analytics_events` section in GDPR export | User-owned rows when persisted |
| Runtime | In-memory server buckets | Until warehouse sink is configured |

## QA

- Run `node --test packages/server/scripts/metric-dictionary.test.mjs`
- Run `node --test apps/web/scripts/funnel-analytics.test.mjs` for funnel guardrails
