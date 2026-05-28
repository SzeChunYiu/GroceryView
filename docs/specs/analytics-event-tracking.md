# Analytics event tracking

## Purpose

Track product usage like a data analytics project: funnels, search quality, deal engagement, and correlation with data quality — without PII leakage or pre-consent tracking.

## Principles

1. **`noun_verb` event names** — stable, grep-friendly, dictionary-aligned.
2. **Consistent payload shape** — every event includes session, page, optional domain and entity.
3. **Consent-gated optional analytics** — necessary cookies only until consent; no raw receipts in events.
4. **Events map to metrics** — each core funnel step ties to [metric dictionary](./metric-dictionary.md) entries.
5. **No console-only tracking** — use `@groceryview/analytics` / `apps/web/src/lib/analytics.ts` batching APIs.
6. **Source panel attribution** — `sourcePanel` identifies which UI surface fired the event.

## Event naming

```text
search_submitted
search_result_clicked
product_opened
deal_opened
watchlist_item_added
map_marker_selected
preview_opened
evidence_drawer_opened
market_filter_changed
fuel_grade_selected
pharmacy_otc_alert_set
```

## Core event groups

| Area | Events |
|------|--------|
| Search | `search_submitted`, `search_filter_applied`, `search_sort_changed`, `search_result_clicked`, `search_zero_result`, `search_suggestion_clicked` |
| Product | `product_opened`, `product_quote_clicked`, `product_watchlist_added`, `product_similar_clicked`, `product_evidence_opened` |
| Deals | `deal_tab_selected`, `deal_card_clicked`, `deal_explanation_opened` |
| Market | `market_filter_changed`, `market_category_clicked`, `market_heatmap_cell_clicked`, `market_saved_view_created` |
| Map | `map_layer_changed`, `map_marker_selected`, `map_store_opened`, `map_list_fallback_used` |
| Pharmacy / Fuel | Domain-specific selection and alert events |

## Event payload (required fields)

| Field | Required | Notes |
|-------|----------|-------|
| `eventName` | yes | `noun_verb` |
| `occurredAt` | yes | ISO timestamp |
| `sessionId` | yes | Anonymous session |
| `pagePath` | yes | Route path |
| `domain` | no | `grocery` \| `pharmacy` \| `fuel` |
| `entityType`, `entityId` | no | Product, store, category, etc. |
| `sourcePanel` | no | UI surface name |
| `rank`, `filters`, `metadata` | no | Context |

## Examples

**Good:** Search form submit fires `search_submitted` with query hash, filter slugs (not labels), result count.

**Good:** Deal card click fires `deal_card_clicked` with `entityId=productSlug`, `sourcePanel=home_deals_rail`.

**Good:** Item card impressions batched via `/api/analytics/item-card-impressions` without console output.

## Anti-patterns

- Ad-hoc event names (`clickSearch`, `SearchButtonPressed`).
- Tracking before consent on non-necessary cookies.
- Putting category **labels** in filter metadata when **slugs** are the canonical dimension.
- One-off `console.log` funnels instead of shared analytics module.
- Missing events on primary CTAs (search submit, product open, deal open).

## Required tests

- `search-telemetry.test.mjs`, `item-card-impressions.test.mjs`, `funnel-analytics.test.mjs` — existing patterns extended for new events.
- Event name lint: new interactive surfaces document events in page/feature spec.
- Consent tests: analytics scripts respect `google-consent-mode` / consent frame categories.

## PR update checklist

- [ ] New interactive public surface → add events to page/feature spec
- [ ] New funnel step → link to metric in dictionary
- [ ] Renamed event → migration note + dashboard update
