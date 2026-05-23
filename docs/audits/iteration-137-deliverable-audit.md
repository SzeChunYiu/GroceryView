# Iteration 137 deliverable audit — Sweden-wide OSM store coverage

## Objective

Turn the remaining P0 OSM nationwide-store research finding into real GroceryView product by replacing the Stockholm-only OpenStreetMap store universe with a Sweden-wide Overpass refresh path and generated store module.

## Delivered product surface

- Ingestion connector: added `SWEDEN_GROCERY_OVERPASS_QUERY`, `SWEDISH_COUNTY_ISO3166_2_CODES`, and `buildSwedishCountyGroceryOverpassQuery()` so the store refresh can query Sweden directly or fall back to county-scoped Overpass pulls when the national query times out.
- Refresh script: added `apps/web/scripts/refresh-osm-stores.mjs`, which builds from `@groceryview/ingestion`, fetches public OSM grocery stores, deduplicates by OSM type/id, refuses low-row replacements, and regenerates `apps/web/src/lib/osm-stores.ts` with ODbL attribution.
- Generated data: refreshed `osm-stores.ts` from Overpass on 2026-05-22; the generated module now contains 5,113 Sweden-wide grocery/convenience/supermarket stores across 876 reported city values.
- Web product surfaces: updated source coverage, homepage, stores, and store coverage copy from Stockholm-only language to Sweden-wide OSM store coverage while preserving the guardrail that locations do not imply branch-level prices.
- Research docs: marked the P0 OSM nationwide target as shipped and updated data-source inventory with the new script and county-fallback behavior.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| TDD red — ingestion | Pass | `rtk npm run test -w @groceryview/ingestion -- --test-name-pattern="Overpass"` initially failed because `SWEDEN_GROCERY_OVERPASS_QUERY` was not exported. |
| TDD red — web route contract | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="OSM nationwide"` initially failed because `apps/web/scripts/refresh-osm-stores.mjs` did not exist. |
| Targeted ingestion test | Pass | `rtk npm run test -w @groceryview/ingestion -- --test-name-pattern="Overpass"` passed after adding the Sweden query, county query builder, and exports. |
| Targeted web route test | Pass | `rtk npm run test -w @groceryview/web -- --test-name-pattern="OSM nationwide\|OSM store"` passed after wiring the refresh script and Sweden-wide UI copy. |
| Live OSM refresh | Pass | `rtk npm run build -w @groceryview/ingestion && rtk node apps/web/scripts/refresh-osm-stores.mjs` wrote 5,113 OpenStreetMap grocery stores to `apps/web/src/lib/osm-stores.ts`. |
| Generated data count | Pass | Local count over generated `osm-stores.ts` found 5,113 `source: "osm"` rows and 876 non-empty city values. |
| Full repository tests | Pass | `rtk git diff --check && rtk npm test` exited 0 on this branch. |
| Build | Pass | `rtk npm run build` completed workspace TypeScript builds and the Next.js production build for 203 static routes. |
| Typecheck | Pass | `rtk npm run typecheck` (`tsc --noEmit -p tsconfig.json`) exited 0. |
| Product PR merge | Pass | PR #855 merged at 2026-05-22T12:01:54Z with merge commit `c2adfe7f4410a2ab6574fea5b0ea5baf95bc9802`; verified as an ancestor of `origin/main`. |
| Audit PR merge | Pending | This follow-up audit branch records the product PR merge proof; merge proof must be added after this audit PR lands. |

## Guardrails checked

- OSM data remains location-only; UI copy explicitly says prices are never inferred from store proximity, brand, or format.
- The refresh script refuses to overwrite the generated module when Overpass returns fewer than 2,000 rows.
- Generated module header preserves source URL, retrieval timestamp, ODbL attribution, and regeneration command.
- National Overpass timeouts fail into smaller county-scoped public queries rather than fabricating missing store rows.

## Code-review graph note

The project instruction asks for code-review-graph MCP tools before file scanning. Those MCP tools were not available in this execution context, so this audit was produced from direct repository inspection, tests, and live refresh output instead.

## Remaining research findings after this round

- Complete production readiness checks across every required chain, store, and product target.
- Replace manual fulfillment evidence snapshots with official live retailer fulfillment APIs where contracts and compliance allow.
- Add a real retailer transfer adapter only after legal/commercial capability verification supplies an endpoint and signing contract.
- Continue remaining data-source backlog: full OpenFoodFacts metadata widen, refresh scripts for Axfood/OpenPrices, Coop discovery, Mathem probing, and receipt scanner ground-truth ingestion.
