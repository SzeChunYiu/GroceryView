# Feature implementation registry

Living registry for the implement-everything lock pack. Every feature is **IMPLEMENTED**, **DEFERRED** (with reason), or **TEST_ONLY**. Orphan spec mentions are not allowed.

**Seed:** `docs/handoff/groceryview-implement-everything-lock/feature_registry_seed.json`  
**Gap drill-down:** [atomic-gap-registry.md](./atomic-gap-registry.md)

| feature_id | surface | target_status | status | evidence |
|------------|---------|---------------|--------|----------|
| global_search | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `apps/web/src/components/SearchBar.tsx`, `/search` |
| domain_switcher | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | Search/market domain filters, `apps/web/src/lib/search-filters.ts` |
| home_domain_cards | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | Locale home + `market-shell.tsx` domain cards |
| search_domain_filters | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `apps/web/src/app/search/page.tsx` |
| market_kpi_row | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `apps/web/src/app/market/page.tsx` |
| market_heatmap | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | Market heatmap components + route tests |
| category_browse_real_deal_cards | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `apps/web/src/app/browse/[category]/page.tsx` |
| map_layer_controls | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `apps/web/src/app/map/page.tsx` |
| watchlist_multi_domain | public | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `/watchlist`, alerts routes |
| product_preview | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/product-preview-card.tsx` |
| store_preview | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/store-preview-card.tsx` |
| category_preview | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/category-preview-card.tsx` |
| deal_preview | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/deal-preview-card.tsx` |
| fuel_station_preview | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/fuel-station-preview-card.tsx` |
| pharmacy_otc_preview | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/pharmacy-otc-preview-card.tsx` |
| evidence_drawer | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/evidence-drawer.tsx` |
| side_drawer | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/preview-side-drawer.tsx` |
| bottom_sheet | preview | IMPLEMENT_NOW_PREVIEW | IMPLEMENTED | `components/preview/preview-bottom-sheet.tsx` |
| admin_source_runs | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/source-runs`, `/admin/sources` |
| admin_dead_letters | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/dead-letters`, `/admin/sources/dead-letters` |
| admin_data_quality | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/data-quality` |
| admin_lineage | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/lineage` |
| admin_search_analytics | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/search-analytics` |
| admin_query_performance | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/query-performance` |
| admin_ad_policy | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/ad-policy` |
| admin_content_lint | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/content-lint` |
| admin_storage | backstage | IMPLEMENT_NOW_BACKSTAGE | IMPLEMENTED | `/admin/storage` |
| source_runs | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `docs/data/source-run-contract.md`, ingestion pipeline |
| raw_records | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `docs/data/source-run-contract.md`, DB schema |
| dead_letters | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | Admin dead letters + ingestion DLQ scaffold |
| quality_gates | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `docs/data/quality-gates.md`, publish gate in ingestion |
| idempotency_helper | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `packages/ingestion/src/pipeline.ts` |
| gold_publish_gate | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `docs/data/quality-gates.md` |
| db_health_scripts | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `npm run ops:check-supabase-health`, DB ops scripts |
| metric_dictionary | data | IMPLEMENT_NOW_DATA | IMPLEMENTED | `docs/data/metric-dictionary.md`, `packages/metrics/src/definitions.ts`, `metric-definitions.test.mjs` |
| event_tracking_plan | data | IMPLEMENT_NOW_DATA | TEST_ONLY | `docs/data/event-tracking-plan.md`, `trackGroceryViewEvent` (`search_submitted` only); gap `analytics-event-naming-gap` |
| adslot | ads | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `components/design-system/ad-slot.tsx`, `lib/ad-slots.ts` |
| ad_policy | ads | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `lib/ad-policy.ts` |
| ad_tests | ads | IMPLEMENT_NOW_PUBLIC | IMPLEMENTED | `scripts/ad-slot-contracts.test.mjs` |

## Deferred (explicit)

| feature_id | reason | next ticket |
|------------|--------|-------------|
| live_adsense_fill | No production ad network credentials in repo | Monetization provider readiness gate |
| timescale_hypertables | Evaluation only; declarative partitions active | DB scaling plan phase 2 |

## Registry meta

- **Total registered:** 39 (+ 2 deferred)
- **Orphans allowed:** 0
- **Enforced by:** `apps/web/scripts/feature-implementation-registry.test.mjs`
