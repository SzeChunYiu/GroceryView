# Apoteket.se connector notes

Last verified from checked-in connector fixtures: **2026-05-25**. Connector source inspected: **2026-05-25**.

Apoteket.se is treated as a public Swedish pharmacy catalog source for non-prescription, public product price rows. The connector reads HTML pages from `www.apoteket.se` and extracts embedded JSON/Next.js flight payload product data from `packages/ingestion/src/connectors/apoteket-se.ts` without logging in or submitting cart/prescription flows.

## Data sources

| Surface | Source URL pattern | Connector entry point | Notes |
|---|---|---|---|
| Search results | `https://www.apoteket.se/sok/?q={query}` | `fetchApoteketSeProducts()` | Default query coverage includes vitamin search. Rows are accepted only when public product name and SEK price evidence are present. |
| Category pages | `https://www.apoteket.se/kategori/{categoryPath}/` | `fetchApoteketSeProducts({ sourceUrls })` | Default category coverage includes supplements/vitamins, food/drink, toothpaste, and sunscreen pages. |
| Embedded product payloads | `<script>` JSON, `JSON.parse(...)`, and `self.__next_f.push(...)` fragments | `parseApoteketSeProducts()` | Parser walks JSON-like roots and normalizes candidate product objects found in page payloads. |
| Daily ingestion virtual URL | `groceryview://daily/apoteket-se/products/public` | daily connector dispatcher in `packages/ingestion/src/index.ts` | Materializes `domain=pharmacy` observations for public, non-prescription Apoteket rows. |

## Extracted fields

Normalized by `normalizeApoteketCandidate()` into `ApoteketSeProductRow`:

- `country` — always `SE`.
- `chain` — always `apoteket`.
- `currency` — always `SEK`; non-SEK candidates are skipped.
- `product_name` — first usable product/display/name/title field.
- `price_sek` — rounded public selling price from `price_sek`, `currentPrice`, `salesPrice`, `salePrice`, `sellingPrice`, or nested `price` data.
- `unit` — package/unit text from payload fields, falling back to a unit parsed from the product name.
- `observed_at` — caller-provided observation timestamp or fetch time.
- `source_url` — absolute product URL when a product link/canonical URL exists, otherwise the page URL.
- `store_id` — optional, only if a public payload includes store-specific evidence.

## Known quirks and edge cases

- Prescription-only candidates are excluded via `requiresPrescription`/`prescriptionOnly` style flags, so the connector does not emit prescription medicine comparison rows.
- The parser accepts several payload shapes because Apoteket pages can expose product data through plain JSON scripts, `JSON.parse(...)` strings, or Next.js flight records.
- Rows missing either product name or numeric price are dropped instead of guessed.
- Currency must resolve to SEK. Foreign-currency or malformed price objects are ignored.
- Duplicate candidates are de-duplicated by store id, normalized product name, price, unit, and source URL during parsing, then again across fetched source pages.
- Public category/search pages are online catalog evidence. The connector does not claim physical-branch availability unless a future payload supplies explicit `store_id` evidence.
- HTML pages with no extractable product JSON return an empty row list; HTTP non-2xx responses fail closed with the source URL and status code.

## Evidence and generated artifacts

- Connector implementation: `packages/ingestion/src/connectors/apoteket-se.ts`.
- Connector fixture tests: `packages/ingestion/src/connectors/__tests__/apoteket-se.test.ts`.
- Daily ingestion coverage: `packages/ingestion/src/__tests__/ingestion.test.ts` verifies Apoteket SE daily dispatch into `domain=pharmacy` observations.
- Domain boundary: pharmacy remains a separate price domain with no prescription comparison or medical advice claims.

## Last verification

Checked-in Apoteket connector fixtures and ingestion dispatch tests were inspected on **2026-05-25**. No live fetch was run for this documentation-only note.
