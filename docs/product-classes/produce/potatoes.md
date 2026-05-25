# Produce Class: Potatoes

Purpose: define potato subclasses under `vegetable-root > potatoes` for fresh
whole potato SKUs. This class excludes crisps, fries, mash, gnocchi, frozen
potato products, and prepared side dishes unless a separate fresh potato SKU is
visible.

## Seeded subclasses

| Class | Belongs here | Matching notes |
| --- | --- | --- |
| `potato-floury` | Floury potatoes where the cooking type is explicit but no seeded variety is visible. | Match floury, mealy, baking, or mash-oriented fresh potato wording. |
| `potato-king-edward` | King Edward potatoes. | Child of `potato-floury`; match `king edward`. |
| `potato-bintje` | Bintje potatoes. | Child of `potato-floury`; match `bintje`. |
| `potato-waxy` | Waxy/firm potatoes where the cooking type is explicit but no seeded variety is visible. | Match waxy, firm, salad potato, or boiling potato wording. |
| `potato-cara` | Cara potatoes. | Child of `potato-waxy`; match `cara` in potato context. |
| `potato-mandel` | Mandel potatoes. | Child of `potato-waxy`; match `mandelpotatis`, `mandel potato`, or `mandel`. |
| `potato-charlotte` | Charlotte potatoes. | Child of `potato-waxy`; match `charlotte` in potato context. |
| `potato-new` | New, early, or small seasonal potatoes. | Match `new potato`, `farskpotatis`, `nypotatis`, or clear seasonal early-potato wording. |

## Guardrails

Use `potatoes` for fresh potatoes where no cooking type or variety is visible.
Keep pack weight, loose/per-kg form, washed/unwashed state, grade, origin, and
organic labels as attributes.
