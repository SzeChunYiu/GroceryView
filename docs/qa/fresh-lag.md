# Fresh lag QA report

Fresh product classes are perishable. GroceryView treats observations older than **7 days** as stale for shopper-facing fresh meat, fish, produce, and dairy claims.

- Report as-of date: **2026-05-25**
- Fresh window: observations dated after **2026-05-18** (`age < 7d`)
- Source used by the static report: OpenPrices dated SEK observations in `apps/web/src/lib/openprices-products.ts`
- Web surface: `/coverage` and `/chain-coverage` render `freshLagClassReport` from `apps/web/src/lib/verified-data.ts`

| Fresh class | Products | Observations | <7d observations | <7d share | Latest observation | Status |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Fruit & Vegetables | 1 | 1 | 0 | 0.0% | 2018-05-01 | stale |
| Meat & Charcuterie | 1 | 1 | 0 | 0.0% | 2024-08-19 | stale |
| Fish & Seafood | 1 | 1 | 0 | 0.0% | 2026-02-07 | stale |
| Dairy | 12 | 13 | 0 | 0.0% | 2026-04-27 | stale |

## Interpretation

The current static OpenPrices sample has **0/16 fresh-class observations (0.0%)** inside the 7-day freshness window. Fresh classes should therefore be treated as stale for perishable price claims until ingestion cadence is improved or fresher source rows land.

## Guardrails

- Do not fill fresh-class gaps with old observations.
- Do not promote stale fresh rows as live shelf prices.
- Use this report to tune ingest cadence by class; classes with low fresh share need more frequent refreshes before they can support current-price UX.
