# ICA connector

Last verified: 2026-05-24

## Source and access pattern

The native ICA connector reads the public store-scoped promotions feed exposed by
ICA Handla Privatkund:

```text
GET https://handlaprivatkund.ica.se/stores/{storeAccountId}/api/product-listing-pages/v1/pages/promotions
```

Required query parameters are:

| Parameter | Meaning |
| --- | --- |
| `regionId` | ICA region identifier used by the selected store page. |
| `includeAdditionalPageInfo=true` | Keeps the response shape aligned with the web product listing page. |
| `maxProductsToDecorate` | Maximum number of promoted products decorated in the response. |
| `maxPageSize` | Page size requested from the listing endpoint. |

The connector sends browser-compatible JSON headers plus the selected store as
referer. The implemented default request path is produced by
`buildIcaStorePromotionsUrl()` in `packages/ingestion/src/connectors/ica.ts`.

The default branch set is encoded in `DEFAULT_ICA_STORE_CONFIGS`; each entry
provides:

- `storeAccountId` — ICA's store account identifier.
- `storeName` — operator-readable branch name.
- `regionId` — region context for the Handla endpoint.

`fetchIcaDefaultStoreProducts()` iterates the configured stores with bounded
concurrency and fails closed if any configured branch returns no usable rows or
stays unavailable after retries.

## Extracted fields

Rows are parsed from `productGroups[].decoratedProducts[]` and materialized as
`IcaProduct` values. The connector extracts:

| Output field | Source field / derivation |
| --- | --- |
| `code` | `retailerProductId`; used as the connector-local product code. |
| `productId` | ICA product UUID from `productId`. |
| `retailerProductId` | ICA retailer product identifier. |
| `name` | Product display name. |
| `brand` | Brand string when present. |
| `categories` | Listing group `type`, group `name`, or `store_promotions` fallback. |
| `imageUrl` | `image.src`. |
| `productUrl` | Store-scoped product detail URL built from store account id and retailer product id. |
| `packageSize` | `packSizeDescription`. |
| `countryOfOrigin` | `countryOfOrigin`. |
| `price` / `priceCurrency` | Regular item price from `price.amount` / `price.currency`. |
| `unitPrice` / `unitPriceCurrency` / `unitPriceUnit` | `unitPrice.price.amount`, currency, and unit token. |
| `promoPrice` / `promoPriceCurrency` | Promotion item price from `promoPrice`. |
| `promoUnitPrice` / `promoUnitPriceCurrency` / `promoUnitPriceUnit` | Promotion unit price from `promoUnitPrice`. |
| `promotionDescription` | First `promotions[].description`. |
| `storeAccountId`, `storeName`, `regionId` | The selected store config. |
| `sourceUrl`, `retrievedAt` | Connector provenance. |

The daily database ingestion path maps these native rows into price observations
with promotion text and both promotional and regular prices when the feed
provides them.

## Known quirks and constraints

- ICA is store-scoped: prices and offers can differ by branch, so every emitted
  row must keep `storeAccountId` and `storeName` provenance.
- The connector intentionally uses the promotions page feed. A broader product
  search endpoint observed in the frontend bundle at
  `/stores/{storeAccountId}/api/webproductpagews/v6/product-pages/search` remains
  blocked by CloudFront/AWS WAF for the approved unauthenticated connector path.
  That investigation is captured as `ICA_MAXI_CATALOG_SEARCH_INVESTIGATION`.
- `retailerProductId` is not guaranteed to be an EAN. Treat it as an ICA-local
  identifier unless a separate barcode enrichment step proves otherwise.
- Some money objects, unit-price objects, images, countries of origin, and
  promotion descriptions are optional. The parser emits `null` or an empty
  string instead of fabricating values.
- The endpoint can set session cookies, but the connector does not require user
  credentials and does not model account-specific, personalized, or wallet-only
  offers.
- `unitPrice.unit` can be a localization token such as `fop.price.per.kg` rather
  than a normalized SI unit. Downstream display code should normalize or map it
  before presenting it as shopper-facing copy.

## Edge cases and fail-closed behavior

- Non-object payloads parse to an empty row set.
- Products missing `productId`, `retailerProductId`, or `name` are skipped.
- Duplicate `retailerProductId` values within a response are deduplicated so one
  store listing cannot emit the same product twice.
- `maxRows` stops parsing after the requested number of accepted rows.
- All-store fetches fail closed when a configured branch is missing from the
  accepted result set, including branches that failed after retries.
- Daily ingestion only treats this source as acceptable when the connector config
  carries the approved public-source/legal-review metadata required by the
  ingestion guardrails.

## Verification notes

- 2026-05-24: a bounded request to the default promotions URL for store
  `1004599` returned HTTP 200 with JSON keys `additionalPageInfo`, `metadata`,
  `missedPromotions`, and `productGroups`; the first decorated product included
  regular price, unit price, package size, promotion, and image fields.
- Unit coverage in `packages/ingestion/src/__tests__/ingestion.test.ts` asserts
  URL construction, store-scoped provenance, duplicate suppression, bounded
  all-store concurrency, retry/fail-closed behavior, and daily DB observation
  materialization for `ica-store-promotions-native-v1`.

## Related files

- `packages/ingestion/src/connectors/ica.ts`
- `packages/ingestion/src/connectors/ica-reklamblad.ts`
- `packages/ingestion/src/__tests__/ingestion.test.ts`
- `docs/data-sources.md`
