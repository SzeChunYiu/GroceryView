# Nordic category coverage audit

P0 category mapping scope: every known Nordic country label in the seed chain set is normalized into a single GroceryView taxonomy in `packages/core/src/lib/categoryMap.ts`.

## Unified taxonomy coverage

Required launch coverage:

- Groceries: `produce`, `dairy`, `meat_fish`, `pantry`, `frozen`, `bakery`, `beverages`, `ready_meals`, `baby`, `pet`, `household`, `personal_care`.
- Pharmacy OTC: `pharmacy_otc` for apotek/apteekki/reseptfritt/håndkøbsmedicin/over-the-counter labels.
- Fuel: `fuel` for petrol station, drivmedel/drivstoff/brændstof/polttoaine/eldsneyti labels.
- Convenience snacks: `convenience_snacks` for kiosk, sweets, crisps, nesti, välipalat, and service-station snack labels.

`auditCategoryCoverage()` reports no missing required P0 categories for the checked mapping table.

## Country and chain label mapping

| Country | Chain examples | Label examples | Unified category |
| --- | --- | --- | --- |
| SE | ICA, Willys | Frukt & grönt, Frukt och grönt | `produce` |
| SE | ICA, Willys | Mejeri | `dairy` |
| SE | ICA, Willys | Kött, chark & fisk; Kött och fisk | `meat_fish` |
| SE | ICA, Willys | Skafferi, Kolonial | `pantry` |
| SE | ICA, Willys | Apotek & receptfritt, Apotek | `pharmacy_otc` |
| SE | ICA | Drivmedel | `fuel` |
| SE | ICA, Willys | Chips, godis & snacks; Kioskvaror | `convenience_snacks` |
| NO | Kiwi | Frukt, Meieri, Ferskvarer, Dagligvarer | grocery taxonomy |
| NO | Kiwi, Circle K Norge | Apotekvarer, Reseptfritt | `pharmacy_otc` |
| NO | Kiwi, Circle K Norge | Drivstoff | `fuel` |
| NO | Kiwi, Circle K Norge | Kiosk, Snacks | `convenience_snacks` |
| DK | Netto | Frugt, Mejeri, Kød & fisk, Kolonial, Frost | grocery taxonomy |
| DK | Netto, Matas | Apotek, Håndkøbsmedicin | `pharmacy_otc` |
| DK | Netto | Brændstof | `fuel` |
| DK | Netto, Matas | Kioskvarer, Slik, Snacks | `convenience_snacks` |
| FI | K-Market | Hedelmät, Maitotuotteet, Liha, Pakasteet | grocery taxonomy |
| FI | K-Market, ABC | Apteekki | `pharmacy_otc` |
| FI | K-Market, ABC | Polttoaine | `fuel` |
| FI | K-Market, ABC | Makeiset, Snacksit, Kioski, Välipalat | `convenience_snacks` |
| IS | Bónus | Ávextir og grænmeti, Mjólkurvörur, Kjöt | grocery taxonomy |
| IS | Bónus, Olís | Apótek, Lyf án lyfseðils | `pharmacy_otc` |
| IS | Bónus, Olís | Eldsneyti | `fuel` |
| IS | Bónus, Olís | Sælgæti, Nesti | `convenience_snacks` |

## Unmapped-label list

No unmapped labels remain in the P0 Nordic seed set.

```json
[]
```

When ingestion adds a new raw chain label, pass it to `auditCategoryCoverage([{ country, chain, label }])`; non-empty `unmappedLabels` must be triaged here before launch.
