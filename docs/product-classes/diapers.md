# Product class: diapers

Canonical class key: `diapers`

## Size 7 and 8 decision

Libero and Pampers size 7/8 baby diaper rows stay in the existing
`diapers` class. They should **not** be split into a separate
`toddler-pants` class while the product is still sold as `Blöjor`,
`Byxblöjor`, `Tejpblöjor`, pants diapers, or open diapers and exposes a
per-piece diaper pack count.

Rationale:

- The shopper task is still diaper price comparison: parents compare pack
  price and SEK/diaper across sizes and retailers.
- Swedish retailer labels keep these rows in the diaper vocabulary
  (`Blöjor`, `Byxblöjor`, `Öppna Blöjor`, `Pants`) even when the child
  weight range overlaps toddler ages.
- Size 7/8 rows share the same pack-count unit semantics as sizes 1-6
  (`20p`, `24p`, `29p`, `per frp`) and can use the same unit-price logic.
- A separate `toddler-pants` class would fragment identical Pampers/Libero
  diaper lines and hide substitutions between size 6, 7, and 8 packs.

Use a future `toddler-pants` class only for non-diaper training pants or
potty-training underwear that no longer markets itself as diapers and does
not belong in per-diaper price comparisons.

## Concrete source examples

The current fixture data contains these size 7/8 rows that should map to
`diapers`:

| Source file | Code | Retailer name | Brand | Pack / size signal | Classification note |
| --- | --- | --- | --- | --- | --- |
| `apps/web/src/lib/axfood-products.ts` | `101615649_ST` | `Up&go 7 16-26kg Byxblöjor` | Libero | `LIBERO, 24p`; Willys/Hemköp row in `barn` | Size 7 pants diapers; keep as `diapers`. |
| `apps/web/src/lib/axfood-products.ts` | `101615650_ST` | `Up&go 8 19-30kg Byxblöjor` | Libero | `LIBERO, 20p`; Willys-only row with blank category | Size 8 pants diapers; blank category must not prevent `diapers`. |
| `apps/web/src/lib/axfood-products.ts` | `101615656_ST` | `Comfort 7 16-26kg Öppna Blöjor` | Libero | `LIBERO, 28p`; Willys-only row with blank category | Size 7 open diapers; not `toddler-pants`. |
| `apps/web/src/lib/ingested/ica.ts` | `2155246` | `Byxblöjor Baby Dry Pants Strl 7 15+kg 29p Pampers` | Pampers | `29 per frp`; `unitPriceUnit=fop.price.per.each` | Size 7 with `15+kg`; keep as `diapers`. |

Adjacent size 6 rows such as Libero `101615648_ST` (`Up&go 6 13-20kg
Byxblöjor`) and Pampers `2155240` (`Byxblöjor Baby Dry Pants Strl 6
13-19kg VP 32p Pampers`) remain in `diapers`; the size 7/8 rows extend
that same class boundary rather than opening a new one.

## Edge-case behavior

- `Strl 7`, `7`, `Strl 8`, and `8` are size signals, not class names. Class
  by product type first (`Blöjor`, `Byxblöjor`, `Pants`, `Öppna Blöjor`).
- Weight ranges including `15+kg`, `16-26kg`, and `19-30kg` remain valid
  diaper metadata. Do not infer potty-training products from high weights
  alone.
- Blank or missing source categories should not demote a row when the name,
  brand line, and pack count clearly identify diapers.
- Pants-style rows (`Byxblöjor`, `Pants`, `Up&go`) and open/tape rows
  (`Öppna Blöjor`, `Tejpblöjor`, `Comfort`) all share the `diapers` class;
  fit/form can be captured as attributes if needed.
- Keep per-piece comparison (`SEK/diaper`) for every row with a pack count;
  do not compare diaper packs by kg even when a weight range is present.

## Fixture/test impact

No product-class fixture or test file in this tree currently references a
`diapers` class key, so this ticket only adds the missing class guidance.
When a product-class mapper fixture is introduced, include the four rows
above as regression cases for size 7/8 class assignment.
