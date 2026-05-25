# Diapers product class

Decision: Libero and Pampers size 7 and 8 rows stay in the existing `diapers` product class. Do not split them into a separate `toddler-pants` class.

Rationale:

- Shoppers compare these rows by the same unit economics as smaller diapers: price per piece, pack count, brand, store, and promotion cadence.
- Swedish source labels use both open diapers (`Öppna Blöjor`, `Tejpblöjor`) and pants (`Byxblöjor`, `Pants`) inside the same baby-care shelf, and the size number is a variant, not a separate class key.
- Existing diaper watchlists, price-drop alerts, and promo cadence logic should continue to match size 7/8 rows unless a shopper explicitly filters them out.

## Concrete source examples

| Source | SKU/code | Name evidence | Class | Notes |
| --- | --- | --- | --- | --- |
| `apps/web/src/lib/axfood-products.ts` | `101615649_ST` | `Libero Up&go 7 16-26kg Byxblöjor` | `diapers` | Size 7 pants; keep with diaper unit-price comparisons. |
| `apps/web/src/lib/axfood-products.ts` | `101615650_ST` | `Libero Up&go 8 19-30kg Byxblöjor` | `diapers` | Size 8 pants; do not create `toddler-pants`. |
| `apps/web/src/lib/axfood-products.ts` | `101615656_ST` | `Libero Comfort 7 16-26kg Öppna Blöjor` | `diapers` | Size 7 open diaper; same class as smaller Comfort rows. |
| `apps/web/src/lib/ingested/ica.ts` | `2155246` | `Pampers Baby Dry Pants Strl 7 15+kg 29p` | `diapers` | ICA pants naming maps to the same class. |
| `apps/web/src/lib/ingested/ica.ts` | `2155240` | `Pampers Baby Dry Pants Strl 6 13-19kg VP 32p` | `diapers` | Adjacent size-6 evidence confirms continuity across sizes. |

## Edge-case behavior

- If a source row contains `Byxblöjor`, `Pants`, `Öppna Blöjor`, `Tejpblöjor`, `blöjor`, `diapers`, or `nappies` with a baby/toddler size marker (`Strl`, `size`, `Up&go`, `Baby Dry`, `Comfort`, or kg bands), keep `diapers`.
- Size 7 and 8 are variants on the diaper class. Preserve the size/weight band as product metadata for filtering and display.
- Do not use `toddler-pants` as a class key. If merchandising needs a pants facet, use a secondary variant such as `diaper_style=pants` while keeping `product_class=diapers`.
- Pull-ups/training pants that are explicitly toilet-training underwear and lack diaper/blöjor/nappy wording should be reviewed before inclusion; they may need a future `potty-training` class, but the current Libero/Pampers size 7/8 rows do not.
- Rows missing category text in Axfood (for example the Willys-only Libero size 7/8 rows) still classify as `diapers` when the name and brand evidence match the table above.
