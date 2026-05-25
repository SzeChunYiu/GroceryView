# Hemköp connector notes

Last verified from checked-in ingestion evidence: **2026-05-23**. Connector source inspected: **2026-05-25**.

Hemköp uses Axfood-backed public JSON endpoints. GroceryView treats the connector as a public, read-only source and sends a project User-Agent from `packages/ingestion/src/connectors/hemkop.ts`.

## Data sources

| Surface | Source URL pattern | Connector entry point | Notes |
|---|---|---|---|
| Product search | `https://www.hemkop.se/search?q={query}&page={page}&size={size}` | `fetchHemkopProducts({ queries })` | Public catalog search for selected Swedish grocery query terms. Can include `store={storeId}`, but current docs/evidence treat this as Axfood online catalog evidence rather than guaranteed shelf price for every physical branch. |
| Category catalog | `https://www.hemkop.se/c/{categoryPath}?page={page}&size={size}` | `fetchHemkopProducts({ categoryPaths })` | Category paths are discovered from `https://www.hemkop.se/leftMenu/categorytree`. Used when a broader category crawl is requested instead of the default query set. |
| Weekly discounts | `https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size={size}` | `fetchHemkopWeeklyDiscounts()` and `fetchHemkopWeeklyDiscountsForAllStores()` | Public Axfood campaign JSON keyed by Hemköp store id. This is the branch-scoped offer surface used for weekly discounts. |
| Store catalog | `https://www.hemkop.se/axfood/rest/store` or `https://www.hemkop.se/axfood/rest/store?online=true` | `fetchHemkopStores()` | Public Axfood store rows used to discover store ids, names, cities, coordinates, online/click-and-collect flags, and flyer URLs before all-store discount crawls. |
| Daily ingestion virtual URLs | `groceryview://daily/hemkop/products/all-stores`, `groceryview://daily/hemkop/weekly-offers/all-stores` | daily connector dispatcher in `packages/ingestion/src/index.ts` | Virtual endpoints map production daily connector configuration onto the native Hemköp connector functions. |

## Extracted fields

### Products

Normalized by `normalizeHemkopProduct()` into `HemkopProduct`:

- `code` — product code/EAN-like Axfood identifier.
- `name`, `brand`, `packageText`, `category`.
- `price`, `priceText`, `unitPriceText`, `unitPriceUnit`.
- `imageUrl`, `labels`, `online`, `outOfStock`.
- `sourceUrl`, `retrievedAt` for provenance.

### Weekly discounts

Normalized by `normalizeHemkopWeeklyDiscount()` into `HemkopWeeklyDiscount`:

- `code` — promotion id.
- `productCode` — main product code.
- `name`, `brand`, `category`, `packageText`, `labels`, `imageUrl`.
- `storeId`, plus `storeName` and `city` when populated by all-store fetches.
- `campaignType`, `promotionType`.
- `price`, `priceText`, `comparePriceText`, `regularPriceText`, `savePriceText`.
- `conditionText`, `redeemLimitText`, `startDate`, `endDate`, `validUntil`.
- `sourceUrl`, `retrievedAt` for provenance.

### Stores

Normalized by `normalizeHemkopStore()` into `HemkopStore`:

- `storeId`, `name`, `address`, `city`, `postalCode`, `countryCode`.
- `latitude`, `longitude` from `geoPoint` or address coordinates.
- `onlineStore`, `clickAndCollect`, `flyerUrl`.
- `sourceUrl`, `retrievedAt`.

## Known quirks and edge cases

- Hemköp and Willys share Axfood-style payloads, but the connector keeps separate Hemköp source URLs and chain identifiers so provenance does not collapse into a generic Axfood row.
- Product search rows require a usable `code`, `name`, and numeric `priceValue`; rows missing any of those fields are dropped rather than guessed.
- Store rows require `storeId`, `name`, `address`, and `city`; incomplete locator rows are skipped so daily connector store metadata remains usable for readiness checks.
- Weekly discount rows require promotion code, main product code, name, and numeric promotion price. Promotions are de-duplicated by `storeId:promotionCode`, because the same promotion code can appear for multiple stores.
- `validUntil` arrives as epoch milliseconds in the campaign payload and is converted to ISO; missing or non-numeric values stay blank.
- The all-store weekly discount fetch first enumerates stores, then runs bounded per-store tasks through `runAllStoreTasks()`. If every store task fails, the connector fails closed instead of emitting an empty success.
- The default weekly-discount crawl uses a curated Hemköp store-id list; the all-store mode can instead enumerate stores from the public Axfood store catalog.
- Search/category product prices are online catalog evidence. Branch-level claims should prefer the weekly-discount or store-scoped daily connector rows and keep `sourceUrl`/`retrievedAt` attached.

## Evidence and generated artifacts

- Connector implementation: `packages/ingestion/src/connectors/hemkop.ts`.
- Daily connector mapping: `packages/ingestion/src/index.ts`.
- Generated web data: `apps/web/src/lib/ingested/hemkop.ts`.
- Evidence log: `docs/ingestion/hemkop-evidence.md`.
- Daily connector config export includes Hemköp products and weekly offers via `scripts/ops/print-daily-connectors.mjs`.
- Store enumeration readiness includes Hemköp via `scripts/ops/print-daily-connector-stores.mjs`.

## Last verification

The latest checked-in Hemköp evidence sections are dated **2026-05-23** and document public-store weekly discount batches from `https://www.hemkop.se/search/campaigns/offline` with store catalog source `https://www.hemkop.se/axfood/rest/store`. The connector code was inspected for this note on **2026-05-25**; no new live fetch was run in this documentation-only ticket.
