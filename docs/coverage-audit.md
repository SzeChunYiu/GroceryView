# Nordic Retail Coverage Audit

Date: 2026-05-25

Scope: SE, NO, and IS retail chains relevant to GroceryView launch coverage, grouped by grocery, pharmacy, fuel, convenience, specialty, and online. This audit cross-references the connector files under `packages/ingestion/src/connectors/` and records gaps that should become follow-up tickets. The list focuses on named retail banners or online operators with repeatable public/catalog/locator/source surfaces; independent one-off stores are covered by OSM/Overpass gap audits, not by chain-specific connector tickets.

## Connector Inventory

Current connector files cover these named chains or source classes:

| Country | Chain/source | Connector status |
| --- | --- | --- |
| SE | ICA | `ica.ts`, `ica-bulk.ts`, `ica-reklamblad.ts` |
| SE | Willys | `willys.ts`, `willys-bulk.ts` |
| SE | Hemköp | `hemkop.ts` |
| SE | Coop | `coop.ts` |
| SE | Lidl | `lidl.ts`, `lidl-bulk.ts` |
| SE | City Gross | `citygross.ts`, `citygross-bulk.ts` |
| SE | Mathem | `mathem.ts` |
| SE | Matspar | `matspar.ts` |
| SE | Matpriskollen | `matpriskollen.ts` |
| SE | Snabbgross / Axfood B2B | no named connector in `main` |
| SE | Direkten | `direkten-se.ts` |
| SE | 7-Eleven | `seven-eleven-se.ts` |
| SE | Pressbyrån | no named connector |
| SE | OKQ8 | `okq8-fuel.ts` |
| SE | Preem | `preem-se.ts` |
| SE | St1 | `st1-fuel.ts` |
| SE | Apohem | `apohem.ts` |
| SE | Apoteket | `apoteket-se.ts` |
| SE | Kronans Apotek | `kronans-apotek-se.ts` |
| SE | Lloyds Apotek | `lloyds-apotek-se.ts` |
| SE | local/specialty food | `action-se.ts`, `afroshop-se.ts`, `antep-se.ts`, `asia-supermarket-gbg-se.ts`, `babyland-se.ts`, `goodstore-se.ts`, `hala-se.ts`, `halal-center-se.ts`, `hemmavid-se.ts`, `karma-se.ts`, `kartamart-se.ts`, `kosher-deli-se.ts`, `localfoodnodes-se.ts`, `naturkraft-se.ts`, `polski-sklep-se.ts`, `tian-tian-se.ts`, `toogoodtogo-se.ts` |
| NO | Meny | `meny-no.ts` |
| NO | Normal | `normal-no.ts` |
| NO | Europris | `europris-no.ts` |
| NO | Seven-Eleven | `seven-eleven-no.ts` |
| NO | Helios | `helios-no.ts` |
| NO | Sunkost | `sunkost-no.ts` |
| NO | Afroshop / Asia Mart | `afroshop-no.ts`, `asia-mart-no.ts` |
| IS | Bónus | `bonus-is.ts` |
| IS | N1 | `n1-is.ts` |
| IS | ÓB | `ob-is-fuel.ts` |
| IS | Lyf og Heilsa | `lyfogheilsa-is.ts` |
| All | OpenFoodFacts, OSM/Overpass, fuel stations | `openfoodfacts.ts`, `overpass.ts`, `fuel-stations.ts` |

## Sweden

Sources used: ICA Group store-format page; Axfood family page; Swedish Competition Authority grocery-market summary; Reitan Retail/Reitan Convenience brand pages; retailer/operator public sites for pharmacies, fuel, and online/specialty operators.

| Category | Chain/banner | Connector | Gap |
| --- | --- | --- | --- |
| Grocery | ICA Maxi, ICA Kvantum, ICA Supermarket, ICA Nära | `ica.ts`, `ica-bulk.ts`, `ica-reklamblad.ts` | Need separate merge/coverage checks for format-level completeness. |
| Grocery | Coop, Stora Coop, Coop, Lilla Coop, X:-tra | `coop.ts` | Need explicit X:-tra banner handling. |
| Grocery | Willys, Willys Hemma | `willys.ts`, `willys-bulk.ts` | Direct and Plus flyer branches are separate PRs, not on `main` at this audit point. |
| Grocery | Hemköp | `hemkop.ts` | Present. |
| Grocery | Lidl | `lidl.ts`, `lidl-bulk.ts` | Lidl Plus coupon branch is separate PR, not on `main` at this audit point. |
| Grocery | City Gross | `citygross.ts`, `citygross-bulk.ts` | Klubben branch is separate PR, not on `main` at this audit point. |
| Grocery / B2B | Snabbgross | none | Add connector or explicit B2B exclusion. |
| Grocery / online | Mathem | `mathem.ts` | Present. |
| Grocery / online | Matspar | `matspar.ts` | Present as aggregator. |
| Grocery / online | Matpriskollen | `matpriskollen.ts` | Present as offer aggregator. |
| Convenience | Pressbyrån | none | Add connector or source-policy blocker. |
| Convenience | 7-Eleven SE | `seven-eleven-se.ts` | Present. |
| Convenience | Direkten | `direkten-se.ts` | Present. |
| Convenience | Circle K convenience stores | none | Fuel station coverage exists generically; add convenience/food connector or document no grocery-price claim. |
| Pharmacy | Apoteket | `apoteket-se.ts` | Present. |
| Pharmacy | Kronans Apotek | `kronans-apotek-se.ts` | Present. |
| Pharmacy | Lloyds Apotek | `lloyds-apotek-se.ts` | Present. |
| Pharmacy / online | Apohem | `apohem.ts` | Present. |
| Pharmacy / online | Apotea | none | Add connector or explicit online-pharmacy gap. |
| Pharmacy / online | MEDS | none | Add connector or explicit online-pharmacy gap. |
| Fuel | OKQ8 | `okq8-fuel.ts` | Present. |
| Fuel | Preem | `preem-se.ts` | Present. |
| Fuel | St1 | `st1-fuel.ts` | Present. |
| Fuel | Circle K SE | none | Add connector. |
| Fuel | INGO | none | Add connector or map through parent/source surface. |
| Fuel | Qstar / Bilisten | none | Add connector. |
| Fuel | Tanka | none | Add connector. |
| Fuel | Gulf SE | none | Add connector. |
| Specialty / discount | Normal | no SE connector | Add SE connector or use NO connector only where applicable. |
| Specialty / food rescue | Too Good To Go | `toogoodtogo-se.ts` | Present. |
| Specialty / local | Goodstore, Hala, Halal Center, Kosher Deli, Tian Tian, Polish/Asian/Afro specialty, Local Food Nodes | named connectors present | Coverage is sampled, not exhaustive. OSM gap audit still required. |

## Norway

Sources used: Norwegian Competition Authority grocery-market materials identify the four grocery groups; NorgesGruppen, Coop, Reitan/Rema and Bunnpris public brand surfaces; Reitan Retail convenience and Uno-X public company pages; public pharmacy/fuel/operator surfaces.

| Category | Chain/banner | Connector | Gap |
| --- | --- | --- | --- |
| Grocery | Kiwi | none | Add connector. |
| Grocery | Meny | `meny-no.ts` | Present. |
| Grocery | Spar / Eurospar | none | Add connector. |
| Grocery | Joker | none | Add connector. |
| Grocery | Nærbutikken | none | Add connector or OSM-only branch treatment. |
| Grocery | Coop Extra | none | Add connector. |
| Grocery | Coop Mega | none | Add connector. |
| Grocery | Coop Prix | none | Add connector. |
| Grocery | Coop Marked / Obs | none | Add connector. |
| Grocery | REMA 1000 | none | Add connector. |
| Grocery | Bunnpris | none | Add connector. |
| Convenience | Narvesen | none | Add connector. |
| Convenience | 7-Eleven NO | `seven-eleven-no.ts` | Present. |
| Convenience | Northland | none | Add connector or source-policy blocker. |
| Specialty / discount | Europris | `europris-no.ts` | Present. |
| Specialty / health food | Sunkost | `sunkost-no.ts` | Present. |
| Specialty / health food | Life NO | none | Add connector or explicit blocker. |
| Specialty / organic | Helios | `helios-no.ts` | Present. |
| Specialty / ethnic | Normal, Afroshop, Asia Mart | `normal-no.ts`, `afroshop-no.ts`, `asia-mart-no.ts` | Present for sampled specialty surfaces. |
| Pharmacy | Apotek 1 | none | Add connector. |
| Pharmacy | Vitusapotek | none | Add connector. |
| Pharmacy | Boots Apotek | none | Add connector. |
| Pharmacy | Ditt Apotek | none | Add connector or franchise-directory treatment. |
| Pharmacy / online | Farmasiet | none | Add connector. |
| Fuel | Circle K NO | none | Add connector. |
| Fuel | Esso | none | Add connector or operator-source blocker. |
| Fuel | Shell / St1 | no NO connector | Add connector; SE `st1-fuel.ts` does not cover NO. |
| Fuel | YX | none | Add connector. |
| Fuel | Uno-X | none | Add connector. |
| Fuel | Best | none | Add connector. |

## Iceland

Sources used: public Icelandic grocery/operator sites, Reitan/N1/ÓB public operator surfaces, pharmacy operator sites, and current connector names.

| Category | Chain/banner | Connector | Gap |
| --- | --- | --- | --- |
| Grocery | Bónus | `bonus-is.ts` | Present. |
| Grocery | Krónan | none | Add connector. |
| Grocery | Nettó | none | Add connector. |
| Grocery | Hagkaup | none | Add connector. |
| Grocery | Krambúðin | none | Add connector. |
| Grocery | Iceland stores | none | Add connector or explicit scope decision. |
| Grocery / online | Heimkaup | none | Add connector. |
| Convenience | 10-11 | none | Add connector. |
| Convenience | Extra | none | Add connector. |
| Convenience | Olís / ÓB convenience | `ob-is-fuel.ts` covers fuel only | Add convenience/retail connector if food prices are claimed. |
| Pharmacy | Lyfja | `lyfogheilsa-is.ts` covers Lyf og Heilsa only | Add Lyfja connector. |
| Pharmacy | Apótekarinn | none | Add connector. |
| Pharmacy | Apótekið | none | Add connector. |
| Pharmacy | Apótek Garðabæjar | none | Add connector. |
| Pharmacy | Lyf og Heilsa | `lyfogheilsa-is.ts` | Present. |
| Fuel | N1 | `n1-is.ts` | Present. |
| Fuel | ÓB | `ob-is-fuel.ts` | Present. |
| Fuel | Orkan | none | Add connector. |
| Fuel | Atlantsolía | none | Add connector. |
| Fuel | Olís | none | Add connector. |
| Fuel | Skeljungur / Shell | none | Add connector. |

## Explicit Gap List

Highest-priority chain connectors missing from `main` after this audit:

1. SE fuel: Circle K SE, INGO, Qstar/Bilisten, Tanka, Gulf.
2. SE convenience: Pressbyrån; Circle K convenience/food rows separate from fuel.
3. SE pharmacy/online: Apotea, MEDS.
4. SE grocery/B2B: Snabbgross.
5. NO grocery: Kiwi, Spar/Eurospar, Joker, Nærbutikken, Coop Extra/Mega/Prix/Marked/Obs, REMA 1000, Bunnpris.
6. NO convenience: Narvesen, Northland.
7. NO pharmacy: Apotek 1, Vitusapotek, Boots Apotek, Ditt Apotek, Farmasiet.
8. NO fuel: Circle K, Esso, Shell/St1, YX, Uno-X, Best.
9. IS grocery: Krónan, Nettó, Hagkaup, Krambúðin, Iceland, Heimkaup.
10. IS convenience: 10-11, Extra, Olís/ÓB retail convenience.
11. IS pharmacy: Lyfja, Apótekarinn, Apótekið, Apótek Garðabæjar.
12. IS fuel: Orkan, Atlantsolía, Olís, Skeljungur/Shell.

## Source Notes

- ICA Group, ICA Sweden store formats: https://www.icagroup.se/en/about-ica-gruppen/our-business/our-companies/ica-sweden/
- Axfood family/banners: https://wwwint.axfood.se/en/about-axfood/the-axfood-family/
- Swedish Competition Authority grocery-market summary: https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/rapportserie/rapport_2024-5_summary.pdf
- Reitan Retail business areas, REMA 1000, convenience, Uno-X: https://www.reitanretail.no/en/about/our-business
- Reitan Convenience Sweden brands: https://reitanconvenience.se/en/aboutus/ourbrands
- Norwegian grocery market structure: https://konkurransetilsynet.no/wp-content/uploads/2025/09/V2022-12-Ozhegova-assortment-choice.pdf
- GroceryView connector inventory: `packages/ingestion/src/connectors/`
