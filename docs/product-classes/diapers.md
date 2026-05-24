# Product class: diapers

## Equivalence key

The diaper equivalence class compares disposable baby diaper packs by normalized
diaper size and visible diaper count:

`diapers:{size}:{count}`

`size` is one of `NB`, `1`, `2`, `3`, `4`, `5`, or `6`. `count` is the number of
individual diapers in one sellable consumer pack. Two SKUs map to the same
canonical class only when both values match after extraction. Brand, subline,
fit style, weight range, shelf price, loyalty price, store, and promotion text
do not change the class.

Examples:

- `diapers:4:37` covers any size 4 pack with 37 diapers.
- `diapers:5:34` covers any size 5 pack with 34 diapers.
- `diapers:NB:22` covers a newborn pack with 22 diapers when the retailer labels
  it as `NB`, `Newborn`, or equivalent newborn copy.

## Included products

Map a SKU into this class when all of these are true:

- The product is a disposable infant or toddler diaper pack.
- The product title, subtitle, package size, or structured metadata exposes a
  supported size: `NB`, `1`, `2`, `3`, `4`, `5`, or `6`.
- The same source row exposes a diaper count, either as `p`, `st`, `pack`,
  `per frp`, `pcs`, `pieces`, or an equivalent package-count field.
- The count describes individual diapers, not the number of retail bundles in a
  promotion.

Do not require brand equivalence. `Libero Comfort 4 37p` and `Pampers Premium
Protection Strl 4 39p` are different canonical classes because their counts
differ, not because their brands differ.

## Canonical SKU examples by chain

These examples are present in the repository's current retailer fixtures and
show how the class key is derived.

| Chain | Source SKU | Extracted key |
| --- | --- | --- |
| Willys | `101615621_ST` Libero Comfort 4 7-12kg Oppna Blojor, 37p | `diapers:4:37` |
| Willys | `101615647_ST` Libero Up&go 5 9-14kg Byxblojor, 29p | `diapers:5:29` |
| Willys | `101615648_ST` Libero Up&go 6 13-20kg Byxblojor, 27p | `diapers:6:27` |
| Willys | `101615653_ST` Libero Comfort2 3-6kg Oppna Blojor, 47p | `diapers:2:47` |
| Willys | `101615624_ST` Libero Touch 2 3-6kg Tejpblojor, 47p | `diapers:2:47` |
| Hemkop | `101615621_ST` Libero Comfort 4 7-12kg Oppna Blojor, 37p | `diapers:4:37` |
| Hemkop | `101615647_ST` Libero Up&go 5 9-14kg Byxblojor, 29p | `diapers:5:29` |
| Hemkop | `101615648_ST` Libero Up&go 6 13-20kg Byxblojor, 27p | `diapers:6:27` |
| Hemkop | `101314330_ST` Minstingen Blojor 4 7-16kg Tejpblojor, 50p | `diapers:4:50` |
| Hemkop | `101314331_ST` Minstingen Blojor 3 4-9kg Tejpblojor, 56p | `diapers:3:56` |
| ICA | `2155196` Pampers Premium Protection Strl 3 6-10kg VP, 48p | `diapers:3:48` |
| ICA | `2155197` Pampers Premium Protection Strl 4 9-14kg VP, 39p | `diapers:4:39` |
| ICA | `2155198` Pampers Premium Protection Strl 5 11-16kg VP, 34p | `diapers:5:34` |
| ICA | `2155199` Pampers Premium Protection Strl 6 13-18kg VP, 30p | `diapers:6:30` |
| ICA | `2155241` Pampers Premium Protection Pants Strl 4 9-15kg, 31p | `diapers:4:31` |

## Attribute extraction rules

1. Normalize text from product `name`, `brand`, `subline`, `packageSize`, and
   retailer-specific package fields before matching. Treat case, accents, and
   punctuation as non-significant for matching, but preserve the original name
   for display.
2. Extract size from the strongest explicit size token:
   - `NB`, `newborn`, `nyfodd`, and newborn-only copy map to `NB`.
   - `strl 4`, `storlek 4`, `size 4`, `4 7-12kg`, and equivalent title tokens
     map to `4`.
   - For compact names such as `Comfort2 3-6kg`, use the number immediately
     attached to the diaper line as the size when the following token is a
     weight range.
3. Extract count from the package-count token nearest the diaper package field:
   `37p`, `37 st`, `37-pack`, `37 pcs`, `37 pieces`, or `37 per frp`.
4. If both title and structured package metadata expose a count, prefer the
   structured package value only when it is a diaper count. Otherwise prefer the
   title/subline count nearest the diaper line.
5. Ignore weight range for equivalence once size is extracted. Keep weight
   range as an optional display attribute because retailers vary ranges for the
   same numeric size.
6. Keep diaper format as a secondary attribute:
   `open`, `tape`, `pants`, or `unknown`. Format does not split the class.
7. Compute comparable unit price as `price / count`, with unit `diaper`, when a
   row has a price and a valid count.

## Edge cases

- Multi-pack promotions: `2 for 189 kr` is a price offer across two sellable
  packs. Do not multiply the count unless the product itself says the sellable
  package contains multiple inner packs, such as `2x37p`.
- Multi-pack products: when the SKU package says `2x37p`, normalize the count to
  `74` and key it as `diapers:{size}:74`. Keep `innerPackCount=2` as a display
  attribute if the pipeline supports it.
- Single diapers or samples: exclude rows that sell a single diaper sample or a
  trial unit unless the source gives a normal retail count and size.
- Scented or unscented: ignore scent claims for class matching. Scent is a
  secondary attribute because diaper comparisons are driven by size and count.
- Wipes, swim pants, bedwetting pants, training pants, menstrual or adult
  incontinence products: exclude them from this class even when they use diaper
  language.
- Sizes outside the supported set, such as `7`, `8`, `S`, `M`, or `L`, are not
  part of this class. Keep them unmapped or create a separate class expansion
  ticket if those products become required.
- Ambiguous count: if a source row has size but no visible count, do not map it
  into a canonical class. It may still be indexed as a raw product row.

## Coverage notes

The current fixtures provide 3-5 concrete diaper examples for Willys, Hemkop,
and ICA. Demo watchlist data also includes a Coop diaper alert row, but it is
not enough to establish 3-5 canonical Coop SKUs, so Coop should remain outside
the documented chain examples until live Coop fixture coverage includes pack
size and count.
