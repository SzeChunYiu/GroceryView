# Matpriskollen connector

Last verified from checked-in ingestion evidence: 2026-05-23 (`apps/web/src/lib/ingested/matpriskollen.ts`, retrieved `2026-05-23T21:35:19.993Z`). Earlier single-store evidence was captured on 2026-05-21 in `docs/ingestion/matpriskollen-evidence.md`.

## Source and access pattern

The connector reads Matpriskollen's public JSON API used by the consumer offers surface:

- Store discovery: `https://matpriskollen.se/api/v1/stores?lat={lat}&lon={lon}&limit={limit}`
- Store offers: `https://matpriskollen.se/api/v1/stores/{storeKey}/offers?lat={lat}&lon={lon}&limit={limit}`
- Product deep links: `https://matpriskollen.se/deal/{offerKey}`

`packages/ingestion/src/connectors/matpriskollen.ts` fans out over configured regions, discovers nearby stores, filters to grocery chains, and then fetches each accepted store's offer list. The default region set covers Malmö, Stockholm, Göteborg, Uppsala, Västerås, Örebro, Linköping, Helsingborg, Umeå, and Luleå with a per-region store cap of 60, a per-store offer cap of 200, and a global row cap of 3,500 rows.

## Store selection

By default, store names must match:

```text
/(willys|lidl|coop|ica|hemk[oö]p|city gross)/i
```

Stores with no public key, no name match, or `offerCount <= 0` are skipped. Offer rows are deduplicated by `offer code + store key` so the same Matpriskollen offer found through overlapping regions is emitted once per store.

## Extracted fields

Each normalized offer row emits:

| Field | Source / meaning |
| --- | --- |
| `code` | Matpriskollen offer `key` or `id`. |
| `name` | Product name, falling back to the offer description. |
| `brand` | Product brand when present. |
| `store`, `storeKey`, `storeId` | Public store identity from the store list or offer payload. |
| `category` | First parent category name, falling back to the first category name. |
| `priceText` | Display price label such as `19,90/frp`, `79,90/kg`, or multi-buy text. Required for emission. |
| `comparePriceText` | Comparison/unit-price label from `comprice` when provided. |
| `regularPriceText` | Regular price label when present. |
| `packageText` | Package/volume text from `volume`. |
| `condition` | Promotion condition text from the offer payload. |
| `origin` | Product origin label when present. |
| `requiresMembershipCard`, `requiresCoupon` | Boolean promotion gates from the API payload. |
| `validFrom`, `validTo` | Unix-second validity timestamps converted to ISO strings; blank if absent or invalid. |
| `sourceUrl` | Store-offers API URL used for this row. |
| `productUrl` | Public Matpriskollen deal URL built from the offer key. |
| `imageUrl` | Product image URL from `produkt_bild_urls.bildUrl`, `imageURL`, or `imageUrl`. |
| `retrievedAt` | Connector run timestamp. |

Rows fail closed when any of `code`, `name`, or `priceText` is missing.

## Known quirks and edge cases

- **Aggregator provenance, not retailer authority.** Matpriskollen is a public aggregator. Keep `sourceUrl`, `storeKey`, and `retrievedAt` with every row and do not present these rows as retailer-official price truth.
- **Branch specificity is Matpriskollen-scoped.** Rows include a Matpriskollen store key and store name, but the key is not the retailer's native branch id and must be matched before it can prove coverage for GroceryView store targets.
- **Localized price strings.** Price and comparison values arrive as display strings with Swedish decimal commas, units, and multi-buy conditions. Numeric parsing should remain downstream and conservative.
- **Optional promo gates.** Membership-card and coupon flags can be present independently of `condition`; UIs should render them as constraints, not discounts.
- **Sparse optional fields.** Brand, origin, regular price, package text, images, and validity timestamps may be blank. Downstream importers must preserve the row rather than fabricating defaults.
- **Overlapping regional fanout.** The same store or offer may be discoverable from multiple configured cities. The connector deduplicates by offer code and store key, but source URL evidence still points to the first accepted region fetch.
- **HTTP failure behavior.** Store-list request failures throw. Individual store-offer request failures are skipped so one bad store does not poison the full regional scrape.
- **Coverage ceiling.** The checked-in generated module contains 3,500 rows across 68 stores; this is a bounded evidence snapshot, not complete national catalog coverage.

## Current repo wiring

- Connector implementation: `packages/ingestion/src/connectors/matpriskollen.ts`
- Generated web snapshot: `apps/web/src/lib/ingested/matpriskollen.ts`
- Evidence fixture notes: `docs/ingestion/matpriskollen-evidence.md`
- Consumer surfaces: chain index data (`apps/web/src/lib/chain-index-data.ts`) and index methodology (`apps/web/src/app/index-methodology/page.tsx`)

## Operator guidance

Use this connector when GroceryView needs broad public offer evidence across Swedish grocery chains, especially for methodology comparisons and chain-index features. Treat it as supplemental market evidence until store-key matching and daily DB coverage gates prove every target branch/product pair from retailer-native or matched source data.
