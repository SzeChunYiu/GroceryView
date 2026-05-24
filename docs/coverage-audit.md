# Nordic retail coverage audit (SE + NO + IS)

Date: 2026-05-24. Scope is chain/banner coverage for grocery, pharmacy, fuel, convenience, specialty/warehouse, and online food retail in Sweden (SE), Norway (NO), and Iceland (IS). Independent single-store operators are excluded unless they trade under a repeated chain banner.

## Connector inventory found in `packages/ingestion/src/connectors/`

Direct chain connectors: Apohem, City Gross, Coop, Hemköp, ICA, Lidl, Mathem, OKQ8 fuel, St1 fuel, Willys. Aggregator/generic connectors: Matpriskollen, Matspar, OpenFoodFacts, Overpass, generic fuel-stations.

## Sweden

| Category | Chain / banner | Connector status |
| --- | --- | --- |
| Grocery | ICA Maxi, ICA Kvantum, ICA Supermarket, ICA Nära | Covered by `ica.ts` / `ica-bulk.ts`; weekly leaflet via `ica-reklamblad.ts` |
| Grocery | Coop, Stora Coop, Coop X:-tra, Coop Mini | Covered at group level by `coop.ts`; verify banner-level completeness |
| Grocery | Willys, Willys Hemma | Covered by `willys.ts` / `willys-bulk.ts` |
| Grocery | Hemköp | Covered by `hemkop.ts` |
| Grocery | City Gross | Covered by `citygross.ts` / `citygross-bulk.ts` |
| Grocery | Lidl | Covered by `lidl.ts` / `lidl-bulk.ts` |
| Grocery / convenience | Tempo, Handlar'n, Matöppet | Gap |
| Grocery / border discount | Eurocash | Gap |
| Online grocery | Mathem | Covered by `mathem.ts` |
| Online comparison | Matpriskollen, Matspar | Covered by `matpriskollen.ts`, `matspar.ts` |
| Pharmacy | Apohem | Covered by `apohem.ts` |
| Pharmacy | Apotek Hjärtat, Apoteket, Kronans Apotek, Doz Apotek | Gap |
| Online pharmacy | Apotea, Meds | Gap |
| Fuel | OKQ8 | Covered by `okq8-fuel.ts` |
| Fuel | St1 / Shell | Covered by `st1-fuel.ts`; verify Shell branding coverage |
| Fuel | Circle K / Ingo, Preem, Qstar / Bilisten, Tanka, din-X, Gulf | Gap, except possible generic station metadata via `fuel-stations.ts` / `overpass.ts` |
| Convenience | Pressbyrån, 7-Eleven, PBX, Direkten, MyWay | Gap |
| Specialty / warehouse | Systembolaget, Costco Sweden | Gap |

## Norway

| Category | Chain / banner | Connector status |
| --- | --- | --- |
| Grocery | KIWI, MENY, SPAR, Eurospar, Joker, Nærbutikken, Jacob's | Gap |
| Grocery | REMA 1000 | Gap |
| Grocery | Coop Extra, Coop Mega, Coop Obs, Coop Prix, Coop Marked, Matkroken | Gap |
| Grocery | Bunnpris | Gap |
| Online grocery | Oda, Morgenlevering | Gap |
| Pharmacy | Apotek 1, Boots apotek, Vitusapotek, Ditt Apotek | Gap |
| Fuel | Circle K, Esso, Shell / St1, YX, Uno-X, Best, Automat1, Bunker Oil | Gap, except possible generic station metadata via `fuel-stations.ts` / `overpass.ts` |
| Convenience | Narvesen, 7-Eleven, YX 7-Eleven, Deli de Luca, MIX, Northland | Gap |
| Specialty / warehouse | Gigaboks, Europris, Holdbart | Gap |

## Iceland

| Category | Chain / banner | Connector status |
| --- | --- | --- |
| Grocery | Bónus, Hagkaup | Gap |
| Grocery | Krónan | Gap |
| Grocery | Nettó, Prís, Kjörbúðin, Krambúðin, Iceland, 10-11, Extra | Gap |
| Grocery / convenience | SPAR Iceland rollout from Samkaup conversions | Gap |
| Grocery / specialty | Costco Iceland, Fjarðarkaup, Melabúðin | Gap |
| Online grocery | Heimkaup | Gap |
| Pharmacy | Lyfja | Gap |
| Pharmacy | Lyf og heilsa, Apótekarinn, Garðs Apótek | Gap |
| Pharmacy | ÍslandsApótek, Lyfjaval, Lyfjaver | Gap |
| Fuel | N1, Orkan, Olís, ÓB, Atlantsolía | Gap, except possible generic station metadata via `fuel-stations.ts` / `overpass.ts` |
| Convenience | 10-11, Krambúðin, N1 service stores | Gap |

## Explicit gap list for connector tickets

1. SE pharmacy: Apotek Hjärtat, Apoteket, Kronans Apotek, Doz Apotek, Apotea, Meds.
2. SE grocery/convenience banners not covered by current Axfood/Coop/ICA/Lidl connectors: Tempo, Handlar'n, Matöppet, Eurocash, Pressbyrån, 7-Eleven, PBX, Direkten, MyWay.
3. SE fuel not directly covered: Circle K/Ingo, Preem, Qstar/Bilisten, Tanka, din-X, Gulf; verify Shell support inside `st1-fuel.ts`.
4. NO grocery: KIWI, MENY, SPAR/Eurospar, Joker, Nærbutikken, Jacob's, REMA 1000, Coop Extra, Coop Mega, Coop Obs, Coop Prix, Coop Marked, Matkroken, Bunnpris.
5. NO pharmacy: Apotek 1, Boots apotek, Vitusapotek, Ditt Apotek.
6. NO fuel/convenience: Circle K, Esso, Shell/St1, YX, Uno-X, Best, Automat1, Bunker Oil, Narvesen, 7-Eleven/YX 7-Eleven, Deli de Luca, MIX, Northland.
7. IS grocery/convenience/online: Bónus, Hagkaup, Krónan, Nettó, Prís, Kjörbúðin, Krambúðin, Iceland, 10-11, Extra, SPAR Iceland, Costco, Fjarðarkaup, Melabúðin, Heimkaup.
8. IS pharmacy/fuel: Lyfja, Lyf og heilsa, Apótekarinn, Garðs Apótek, ÍslandsApótek, Lyfjaval, Lyfjaver, N1, Orkan, Olís, ÓB, Atlantsolía.

## Research notes and sources

- Sweden grocery grouping: ICA Sweden describes ICA's store formats and scale; Axfood lists Willys, Hemköp, City Gross, Tempo, Handlar'n and Matöppet; Coop Sweden describes its national store network; the Swedish Competition Authority summary identifies ICA, Axfood, Coop, Lidl and City Gross as grocery market actors. Sources: https://www.icagroup.se/en/about-ica-gruppen/our-business/our-companies/ica-sweden/ ; https://www.axfood.se/en/About-Axfood/Organization/ ; https://www.coop.se/Globala-sidor/om-coop/ ; https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/rapportserie/rapport_2024-5_summary.pdf
- Sweden pharmacy and fuel: Apotek Hjärtat is documented by ICA Gruppen; the Swedish Pharmacy Association sector report lists national chains Apoteket, Apotek Hjärtat, Kronans Apotek and Doz plus online Apotea, Meds and Apohem; the Swedish Competition Authority road-fuel report identifies Circle K, OKQ8, Preem and St1 as the largest fuel companies. Sources: https://www.icagruppen.eu/en/about-ica-gruppen/our-business/our-companies/apotek-hjartat/ ; https://sverigesapoteksforening.se/wp-content/uploads/2024/05/Eng-version-final-3.pdf ; https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/rapportserie/rapport_2024-7_english.pdf
- Sweden convenience: Reitan Convenience Sweden lists Pressbyrån, 7-Eleven and PBX. Source: https://reitanconvenience.se/en/aboutus/ourbrands
- Norway grocery: NorgesGruppen, Coop Norway, Reitan Retail/REMA 1000 and Bunnpris are the principal grocery groups/banners; sources list NorgesGruppen's KIWI/MENY/SPAR/Joker/Nærbutikken, Coop's Extra/Mega/Obs/Prix/Marked/Matkroken, and REMA 1000. Sources: https://www.norgesgruppen.no/ ; https://www.coop.no/ ; https://www.reitanretail.no/en/about/our-business ; https://konkurransetilsynet.no/wp-content/uploads/2025/09/V2022-12-Ozhegova-assortment-choice.pdf
- Norway pharmacy: Apotekforeningen lists the main chains Apotek 1, Boots apotek, Vitusapotek and Ditt Apotek. Sources: https://www.apotek.no/in-english/pharmacy-ownership ; https://www.apotek.no/Files/Filer_2014/Engelske_sider/Key%20figures%202024.pdf
- Norway fuel/convenience: Reitan Retail lists Narvesen, 7-Eleven and Uno-X; the Norwegian Competition Authority notes Circle K, YX and Uno-X commitments; Reitan Convenience Norway covers Narvesen, 7-Eleven, Northland and Caffeine. Sources: https://www.reitanretail.no/en/about/our-business ; https://konkurransetilsynet.no/extends-commitments-against-circle-k-yx-and-uno-x/?lang=en ; https://no.linkedin.com/company/reitanconveniencenorway
- Iceland grocery: Samkaup lists Nettó, Prís, Kjörbúðin, Krambúðin, Iceland, 10-11 and Extra; SPAR International announced an Iceland rollout using Samkaup conversions; travel and market sources identify Bónus, Krónan, Nettó and Hagkaup as the main supermarket chains. Sources: https://www.samkaup.is/um-samkaup/ ; https://spar-international.com/country/iceland/ ; https://www.hertz.is/iceland-travel-info/iceland-grocery-store-guide/ ; https://www.icelandplanner.com/tools/supermarket-finder/
- Iceland pharmacy/fuel: Lyfja describes itself as a leading Iceland retail pharmacy; LS Retail and the Icelandic Competition Authority identify Lyf og heilsa / Apótekarinn; travel/fuel sources list N1, Orkan, Olís, ÓB and Atlantsolía. Sources: https://old.lyfja.is/english/ ; https://www.lsretail.com/customers/lyf-og-heilsa ; https://en.samkeppni.is/published-content/news/nr/3142 ; https://www.ferdalag.is/en/travel/gas-station ; https://www.icerental4x4.is/en/icerental-4x4-blog/gas-stations-in-iceland/
