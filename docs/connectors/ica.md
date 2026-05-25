# ICA connector notes

Last verified from checked-in ingestion evidence: **2026-05-24**. Connector source inspected: **2026-05-25**.

ICA coverage currently uses public, store-scoped offer surfaces rather than a general authenticated basket API. GroceryView keeps ICA provenance branch-specific and does not infer prices across stores.

## Data sources

| Surface | Source URL pattern | Connector entry point | Notes |
|---|---|---|---|
| Store promotions | `https://handlaprivatkund.ica.se/stores/{storeAccountId}/api/product-listing-pages/v1/pages/promotions?regionId={regionId}&includeAdditionalPageInfo=true&maxProductsToDecorate={n}&maxPageSize={n}` | `fetchIcaProducts()` / all-store daily dispatcher | Primary structured source for ICA store promotion rows. Uses curated `storeAccountId`, `storeName`, and `regionId` values from `DEFAULT_ICA_STORE_CONFIGS`. |
| ICA weekly offer pages | `https://www.ica.se/erbjudanden/{store-slug}-{storeId}/` | `fetchIcaReklambladOffers()` | Public store offer pages expose weekly offer rows and an e-magin flyer URL. |
| e-magin flyer PDF | `https://api.e-magin.se/api/pdf/{paper}` derived from the offer page flyer link | `buildEmaginPdfUrl()` inside `ica-reklamblad.ts` | Stored only as flyer provenance; product rows still come from parsed ICA offer page state. |
| Catalog search investigation | `https://handlaprivatkund.ica.se/stores/{storeAccountId}/api/webproductpagews/v6/product-pages/search?...` | `ICA_MAXI_CATALOG_SEARCH_INVESTIGATION` in `ica-bulk.ts` | Documented as blocked by CloudFront/AWS WAF until ICA-approved access exists; not used for production product rows. |

## Extracted fields

### Store promotions (`IcaProduct`)

- Product identity: `code`, `productId`, `retailerProductId`, `name`, `brand`.
- Merchandising: `categories`, `imageUrl`, `productUrl`, `packageSize`, `countryOfOrigin`, `soldByWeight`.
- Price evidence: `price`, `priceCurrency`, `unitPrice`, `unitPriceCurrency`, `unitPriceUnit`, plus promotion price/unit-price fields and `promotionDescription`.
- Store provenance: `storeAccountId`, `storeName`, `regionId`, `sourceUrl`, `retrievedAt`.

### Weekly offer pages (`IcaReklambladOffer`)

- Offer identity and product text: `code`, `name`, `brand`, `packageText`, `category`.
- Price text: `priceText`, `comparisonPrice`, `regularPriceText`, `validTo`.
- Store availability: `storeName`, `storeId`, `availableInStore`, `availableOnline`.
- Product media and source evidence: `eans`, `imageUrl`, `sourceUrl`, `flyerUrl`, `flyerPdfUrl`, `retrievedAt`.

## Known quirks and edge cases

- ICA prices and offers are store-scoped. The same product or promotion can differ by `storeAccountId`, so rows must keep store id/name in their dedupe key and evidence trail.
- Promotion payloads can omit numeric base price while still providing campaign text. The connector keeps nullable numeric prices and preserves price text instead of guessing.
- `regionId` is required for the Handla private-customer promotions endpoint; current configs use the checked-in default region id unless a store config overrides it.
- The store-offer page parser depends on public HTML/page-state structure and can fail closed if ICA changes the embedded offer shape.
- The legacy `reklamblad.ica.se` host was rejected in evidence; current flyer provenance comes from ICA store offer pages and e-magin links.
- General catalog search remains explicitly blocked by WAF in `ica-bulk.ts`; use store promotions / weekly offers until an approved search contract exists.
- All-store runs are bounded through the shared all-store task runner so one bad branch does not require inferring empty national coverage.

## Evidence and generated artifacts

- Connector implementations: `packages/ingestion/src/connectors/ica.ts`, `packages/ingestion/src/connectors/ica-reklamblad.ts`, and `packages/ingestion/src/connectors/ica-bulk.ts`.
- Daily connector mapping: `packages/ingestion/src/index.ts`.
- Evidence logs: `docs/ingestion/ica-evidence.md` and `docs/ingestion/ica-reklamblad-evidence.md`.
- Chain-study reference: link to this note from the chain-study/source review wherever ICA connector status is summarized.

## Last verification

The latest checked-in ICA evidence includes store-scoped promotions retrieved on **2026-05-24** and ICA/e-magin weekly offer evidence retrieved on **2026-05-22**. This documentation pass inspected connector source on **2026-05-25** and did not run a new live fetch.
