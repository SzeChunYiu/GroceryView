# GroceryView data sources

This page lists Swedish grocery-chain data sources that GroceryView reads from code in `packages/ingestion/src/connectors`. A chain is included only when a fetcher exists in that directory.

## Chain source coverage

| Chain/source | Fetcher(s) | Notes |
| --- | --- | --- |
| Axfood / Willys | `willys.ts`, `willys-bulk.ts` | Product and price ingestion for Willys catalogue surfaces. |
| Axfood / Hemköp | `hemkop.ts` | Product and price ingestion for Hemköp catalogue surfaces. |
| ICA | `ica.ts`, `ica-bulk.ts`, `ica-reklamblad.ts` | ICA catalogue and flyer-style offer ingestion. |
| Coop | `coop.ts` | Coop product and price ingestion. |
| City Gross | `citygross.ts`, `citygross-bulk.ts` | City Gross product and price ingestion. |
| Lidl | `lidl.ts`, `lidl-bulk.ts` | Lidl product and offer ingestion. |
| Mathem | `mathem.ts` | Online grocery product and price ingestion. |
| Matpriskollen | `matpriskollen.ts` | Aggregated offer/price observations. |
| Matspar | `matspar.ts` | Aggregated comparison observations. |

Support connectors such as `openfoodfacts.ts`, `overpass.ts`, pharmacy (`apohem.ts`), and fuel (`okq8-fuel.ts`, `st1-fuel.ts`, `fuel-stations.ts`) are not listed as Swedish grocery-chain price sources here because they are enrichment, location, pharmacy, or fuel inputs rather than grocery-chain product fetchers.

## Confidence computation

GroceryView carries confidence with price and product observations so UI and API callers can distinguish direct retailer evidence from weaker matches.

1. Start with source provenance. Direct retailer fetchers such as Willys, Hemköp, ICA, Coop, City Gross, Lidl, and Mathem receive the strongest starting confidence because the observation comes from the chain or its own storefront. Aggregators such as Matpriskollen and Matspar start lower because they are secondary sources.
2. Adjust for evidence quality. Confidence is reduced when required fields are missing, the unit or package size must be inferred, the row is promo/member-only, or the product match is approximate rather than a direct product identifier match.
3. Adjust for freshness. Recent observations keep their source confidence. Stale observations are downgraded before they are used for cheapest-price claims, deal scores, or alert decisions.
4. Keep reason labels. Rows should expose confidence reasons such as official source, estimated, promotion/member-only, or low-confidence OCR/manual evidence when those apply.
5. Map numeric scores for display. Scores at or above `0.90` are high confidence, scores from `0.75` up to `0.90` are medium confidence, and lower verified scores are low confidence. Unverified rows must not be used for customer-facing price claims.

When a surface combines several observations, it should use the confidence attached to the selected row or a conservative aggregate, and it should keep missing-price and low-confidence blockers visible instead of estimating hidden prices.
