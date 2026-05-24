# City Gross connector

Last verified from checked-in ingestion evidence: 2026-05-23 (`apps/web/src/lib/ingested/citygross.ts`, retrieved `2026-05-23T21:33:46.069Z`). Earlier regeneration evidence is recorded in `docs/ingestion/citygross-evidence.md` from 2026-05-22.

## Source and access pattern

The connector uses City Gross public JSON endpoints exposed by `www.citygross.se`:

- Store catalog: `https://www.citygross.se/api/v1/PageData/stores`
- Product search: `https://www.citygross.se/api/v1/Loop54/products?Q={query}&skip={skip}&take={take}&siteId={siteId}`
- Product pages and images are converted to absolute `https://www.citygross.se/...` URLs when the API returns relative paths.

`packages/ingestion/src/connectors/citygross.ts` first loads the public store catalog, normalizes each usable `siteId`, and then queries the Loop54 product endpoint per store. The checked-in generated web snapshot uses the `kaffe` query across 40 store ids, paginates with `take=24`, and stores 7,200 real product rows. The reusable all-store runner also supports configured query lists, per-store row caps, concurrency, retry, and fail-on-store-failure controls.

`packages/ingestion/src/connectors/citygross-bulk.ts` wraps the all-store product fetch and fails closed if fewer than 100 product rows are returned unless a different `minRows` is configured.

## Extracted store fields

| Field | Source / meaning |
| --- | --- |
| `storeId` | City Gross `siteId`; required for store emission and product fanout. |
| `name` | Store display name. |
| `city` | Store name with a leading `City Gross` prefix removed when possible. |
| `latitude`, `longitude` | Parsed from `storeLocation.coordinates` when present. |
| `url` | Absolute store page URL built from the store `url` path. |
| `sourceUrl` | Store catalog endpoint. |
| `retrievedAt` | Connector run timestamp. |

Store rows fail closed when `siteId` or `storeName` is absent. The store catalog response must be an array, and the connector throws if no usable stores remain after normalization.

## Extracted product fields

| Field | Source / meaning |
| --- | --- |
| `code` | City Gross product `id`; required for emission. |
| `gtin` | Product GTIN/EAN when present. |
| `name` | Product name; required for emission. |
| `brand` | Product brand text when present. |
| `category` | Product category text from the Loop54 row. |
| `packageText` | Package/size text from `descriptiveSize`. |
| `storeId` | Store/site id used for the request. |
| `price` | Current numeric price from `productStoreDetails.prices.currentPrice.price`; required for emission. |
| `regularPrice` | Ordinary price when present. |
| `unitPrice`, `unitPriceUnit` | Comparative price and comparative unit from the current-price object. |
| `priceText` | Formatted current price string used by generated artifacts. |
| `productUrl` | Absolute product URL built from the product path. |
| `imageUrl` | Absolute image URL from the first image row. |
| `sourceUrl` | Exact Loop54 URL used for this row. |
| `retrievedAt` | Connector run timestamp. |

Products fail closed when any of `code`, `name`, or current numeric `price` is missing. Duplicate product ids are collapsed within a single store/query fetch, and all-store results are deduplicated by `storeId + code`.

## Known quirks and edge cases

- **Store-scoped pricing.** The `siteId` parameter controls prices. Always keep `storeId` and `sourceUrl` with observations; rows from one store must not be treated as chain-wide evidence.
- **Search-query coverage.** The product endpoint is search-driven. A generated snapshot using one query such as `kaffe` proves the endpoint and store-specific shape, but not complete assortment coverage.
- **Pagination boundaries.** The connector stops when the page returns fewer than the requested page size, zero items, or `skip >= totalCount` when `totalCount` is present.
- **Store fanout failures.** Individual all-store fetch failures can be retried or tolerated depending on runner controls. If every store fails and no usable rows remain, the all-store fetch throws with the first store failure.
- **Relative media and product paths.** Product URLs and image URLs may be relative; normalization converts them to absolute City Gross URLs.
- **Sparse metadata.** GTIN, brand, category, descriptive size, ordinary price, comparative price, comparative unit, store coordinates, and store page paths can be absent and should remain blank/null rather than fabricated.
- **Numeric parsing.** Price fields are parsed conservatively from numbers or numeric strings only. Localized display-only prices should not be inferred unless the API provides a valid numeric value.
- **Bulk guardrail.** The bulk connector intentionally rejects very small all-store captures, which protects daily ingestion from publishing a partial or blocked scrape as successful coverage.

## Current repo wiring

- Store/product connector: `packages/ingestion/src/connectors/citygross.ts`
- Bulk minimum-row wrapper: `packages/ingestion/src/connectors/citygross-bulk.ts`
- Generated web snapshot: `apps/web/src/lib/ingested/citygross.ts`
- Evidence notes: `docs/ingestion/citygross-evidence.md`
- Store enumeration support: `packages/ingestion/src/store-enumerator.ts`
- Daily ingestion exports: `packages/ingestion/src/index.ts`

## Operator guidance

Use the City Gross connector for store-scoped product and price evidence when a concrete `siteId` is known. Production runs should configure enough queries and stores to meet the required coverage gate, keep `storeId` on every observation, and treat low row counts or missing store coverage as blockers rather than extrapolating a branch's catalog from another branch.
