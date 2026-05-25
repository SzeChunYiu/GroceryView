# Per-class freshness lag report

Fresh classes are perishable: observations older than 7 days are stale. The `/coverage` page renders `perClassFreshnessLagReport` from `apps/web/src/lib/verified-data.ts` so ingest cadence tuning can see stale classes without inferring missing prices.

## Method

- Report as of: 2026-05-25.
- Fresh window: observation age is less than 7 days.
- Included dated observations: OpenPrices dated observations and the Axfood chain snapshot captured on 2026-05-21.
- Excluded claims: branch-level shelf prices, inventory, and synthetic dates for sources without dated observations.

## QA checks

- `/coverage` lists every observed class with total observations, fresh observations, stale observations, latest observed date, source breakdown, and fresh percentage.
- A class with 0 fresh observations is marked stale; a class with both fresh and stale observations is marked mixed.
- The source coverage footer remains visible so stale rows can be traced to source coverage boundaries.

## Initial cadence signal

The current snapshot contains 3,540 dated observations across 26 classes. 1,445 observations are inside the 7-day freshness window, for an overall fresh share of 40.8%.

| Class | Observations | Fresh | Stale | Fresh % | Latest observed | Source breakdown |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Frozen | 99 | 0 | 99 | 0.0% | 2026-05-14 | OpenPrices 99 |
| Beverages | 89 | 0 | 89 | 0.0% | 2026-05-18 | OpenPrices 89 |
| Snacks | 53 | 0 | 53 | 0.0% | 2026-05-14 | OpenPrices 53 |
| Breakfast | 28 | 0 | 28 | 0.0% | 2026-05-12 | OpenPrices 28 |
| Dairy | 13 | 0 | 13 | 0.0% | 2026-04-27 | OpenPrices 13 |
| Personal care | 6 | 0 | 6 | 0.0% | 2026-04-27 | OpenPrices 6 |
| Fish & Seafood | 1 | 0 | 1 | 0.0% | 2026-02-07 | OpenPrices 1 |
| Fruit & Vegetables | 1 | 0 | 1 | 0.0% | 2018-05-01 | OpenPrices 1 |
| Meat & Charcuterie | 1 | 0 | 1 | 0.0% | 2024-08-19 | OpenPrices 1 |
| Plant-based | 1159 | 3 | 1156 | 0.3% | 2026-05-19 | OpenPrices 1159 |
| Pantry | 650 | 2 | 648 | 0.3% | 2026-05-19 | OpenPrices 650 |
| Unclassified | 468 | 468 | 0 | 100.0% | 2026-05-21 | Axfood 468 |
| Skafferi | 279 | 279 | 0 | 100.0% | 2026-05-21 | Axfood 279 |
| Mejeri Ost Och Agg | 112 | 112 | 0 | 100.0% | 2026-05-21 | Axfood 112 |
| Frukt Och Gront | 99 | 99 | 0 | 100.0% | 2026-05-21 | Axfood 99 |
| Dryck | 85 | 85 | 0 | 100.0% | 2026-05-21 | Axfood 85 |
| Kott Fagel Och Chark | 80 | 80 | 0 | 100.0% | 2026-05-21 | Axfood 80 |
| Brod Och Kakor | 71 | 71 | 0 | 100.0% | 2026-05-21 | Axfood 71 |
| Godis Snacks Och Glass | 45 | 45 | 0 | 100.0% | 2026-05-21 | Axfood 45 |
| Hem Och Hushall | 45 | 45 | 0 | 100.0% | 2026-05-21 | Axfood 45 |
| Fryst | 38 | 38 | 0 | 100.0% | 2026-05-21 | Axfood 38 |
| Fisk Och Skaldjur | 33 | 33 | 0 | 100.0% | 2026-05-21 | Axfood 33 |
| Halsa Och Skonhet | 33 | 33 | 0 | 100.0% | 2026-05-21 | Axfood 33 |
| Djur | 32 | 32 | 0 | 100.0% | 2026-05-21 | Axfood 32 |
| Barn | 19 | 19 | 0 | 100.0% | 2026-05-21 | Axfood 19 |
| Fardigmat | 1 | 1 | 0 | 100.0% | 2026-05-21 | Axfood 1 |

Classes with low fresh percentages should be prioritized for source refresh before they drive shopper-facing comparison claims.
