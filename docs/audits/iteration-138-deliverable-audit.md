# Iteration 138 deliverable audit — OpenFoodFacts metadata catalog slice

## Objective

Turn the OpenFoodFacts metadata-widen research finding into a real GroceryView product surface while keeping the product honest: metadata-only rows may widen product discovery, but they must not imply synthetic prices, store availability, or verified retailer assortment.

## Delivered product surface

- Ingestion connector: added `buildOpenFoodFactsSwedenSearchUrl()` and `fetchOpenFoodFactsSwedenCatalog()` for the public OpenFoodFacts Sweden metadata search API, including pagination, deduplication, retry handling for transient 429/5xx responses, optional skipped-page behavior, and progress callbacks for refresh scripts.
- Refresh script: added `apps/web/scripts/refresh-openfoodfacts-catalog.mjs`, which builds from `@groceryview/ingestion`, attempts a bounded public API tranche, and falls back to the existing OpenPrices/OpenFoodFacts-backed metadata slice when the live API cannot return a stable minimum row count.
- Generated data: refreshed `apps/web/src/lib/openfoodfacts-catalog.ts` on 2026-05-22 with 1,214 metadata-only Swedish product rows, carrying OpenFoodFacts/ODbL attribution and explicit no-price language.
- Web product surface: added an OpenFoodFacts metadata catalog card on `/products`, including counts, preview products, external OFF product links, and repeated `metadata-only` / `No synthetic prices` guardrails.
- Data-source inventory: documented the partial surface in `docs/data-sources.md` and updated `docs/ingestion-targets.md` so the full all-products widen remains open until a durable export/filter path replaces fragile deep pagination.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| TDD red — web route contract | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="OpenFoodFacts metadata catalog"` initially failed because `apps/web/scripts/refresh-openfoodfacts-catalog.mjs` did not exist. |
| Targeted ingestion test | Pass | `rtk npm run test -w @groceryview/ingestion -- --test-name-pattern="OpenFoodFactsSwedenCatalog"` exited 0; ingestion suite reported 107 passing tests including the OpenFoodFacts catalog pagination/retry/progress cases. |
| Targeted web route test | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="OpenFoodFacts metadata catalog"` exited 0; web route suite reported 57 passing tests including the metadata-only catalog contract. |
| Refresh script | Pass | `GROCERYVIEW_OPENFOODFACTS_REFRESH_MODE=fallback rtk node apps/web/scripts/refresh-openfoodfacts-catalog.mjs` wrote 1,214 OpenFoodFacts metadata catalog products to `apps/web/src/lib/openfoodfacts-catalog.ts`. |
| Generated data count | Pass | Local generated-module count found 1,214 `"code":` rows and a non-pending retrieved timestamp. |
| Full repository tests | Pass | `rtk git diff --check && rtk npm test` exited 0 on the product branch. |
| Build | Pass | `rm -rf apps/web/.next && rtk npm run build` completed workspace TypeScript builds and the Next.js production build for 203 static routes. |
| Typecheck | Pass | `rtk npm run typecheck` (`tsc --noEmit -p tsconfig.json`) exited 0. |
| Product PR merge | Pass | PR #878 merged at 2026-05-22T12:42:28Z with merge commit `c5351a3a0c9cc375d4804ff2f9a3751ebc34e01d`; verified as an ancestor of `origin/main`. |
| Audit PR merge | Pending | This follow-up audit branch records the product PR merge proof; merge proof must be added after this audit PR lands. |

## Guardrails checked

- The generated module and UI state that rows are metadata-only and that GroceryView does not infer prices from OpenFoodFacts product records.
- The `/products` card links out to OpenFoodFacts records but does not attach retailer names, stock status, or current price claims to catalog-only rows.
- The refresh script refuses to replace the generated module below the configured minimum row count.
- The full ~25,090-product OpenFoodFacts Swedish catalog is not marked complete; live API pagination repeatedly returned 503/page-cap behavior during this round, so a durable export/filter path remains necessary.

## Code-review graph note

The project instruction asks for code-review-graph MCP tools before file scanning. Those MCP tools were not available in this execution context, so this audit was produced from direct repository inspection, targeted tests, and refresh output instead.

## Remaining research findings after this round

- Complete the full OpenFoodFacts all-Sweden metadata catalog using a durable bulk export/filter strategy instead of fragile deep public search pagination.
- Complete production readiness checks across every required chain, store, and product target.
- Replace manual fulfillment evidence snapshots with official live retailer fulfillment APIs where contracts and compliance allow.
- Add a real retailer transfer adapter only after legal/commercial capability verification supplies an endpoint and signing contract.
- Continue remaining data-source backlog: ICA Handla per-branch, Coop discovery, Mathem probing, refresh scripts for Axfood/OpenPrices, and receipt scanner ground-truth ingestion.
