# Nordic retail coverage audit (SE/NO/IS)

Audit date: 2026-05-24. Scope: retail chains in Sweden (SE), Norway (NO), and Iceland (IS) that matter for grocery/pharmacy/fuel/convenience/specialty/online coverage. This is a chain-level coverage audit, not a store-count audit.

## Source notes

- SE grocery baseline: Swedish Competition Authority summary and Swedish Food Retail Index name ICA, Coop, Willys, Hemköp, Lidl, City Gross, Mathem and adjacent online/specialty names such as Matsmart, Delitea, Linas Matkasse, Matkomfort, Middagsfrid, Tempo and Eurocash: https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/rapportserie/rapport_2024-5_summary.pdf and https://www.svenskdagligvaruhandel.se/wp-content/uploads/The-Food-Retail-Index-July-2024.pdf
- SE pharmacy baseline: Swedish Pharmacy Association sector report lists national chains Apoteket, Apotek Hjärtat, Kronans Apotek and Doz Apotek; ICA Gruppen confirms Apotek Hjärtat as a leading chain: https://sverigesapoteksforening.se/wp-content/uploads/2024/05/Eng-version-final-3.pdf and https://www.icagruppen.eu/en/about-ica-gruppen/our-business/our-companies/apotek-hjartat/
- NO grocery baseline: Norwegian market sources group grocery under NorgesGruppen, Coop Norge, REMA 1000 and Bunnpris, with concepts Kiwi, Meny, Spar, Joker, Coop Extra/Mega/Prix/Obs/Marked, Rema 1000, Bunnpris and Oda: https://brailey.no/insights/norwegian-grocery-market-2015-2024-dashboard/ and https://www.grocerytradenews.com/10-supermarkets-in-norway/
- NO pharmacy baseline: Apotekforeningen key figures list Apotek 1, Vitusapotek, Boots apotek and Ditt Apotek as the main chains: https://www.apotek.no/Files/Filer_2014/Engelske_sider/Key%20figures%202024.pdf
- IS grocery/convenience baseline: Iceland supermarket guides and Samkaup list Bónus, Krónan, Nettó, Hagkaup, Prís, Kjörbúðin, Krambúðin, 10-11, Iceland/Samkaup formats and Costco: https://guidetoiceland.is/travel-info/shopping-for-groceries-in-iceland and https://kjorbudin.is/samkaupstores/
- IS pharmacy baseline: Lyfja identifies itself as Iceland's leading retail pharmacy; Lyf og Heilsa operates Lyf og Heilsa and Apótekarinn brands: https://old.lyfja.is/english/ and https://www.lsretail.com/customers/lyf-og-heilsa
- IS fuel baseline: current travel/fuel guides consistently identify N1, Orkan, Olís, ÓB, Atlantsolía and Costco fuel: https://www.icerental4x4.is/en/icerental-4x4-blog/gas-stations-in-iceland/ and https://www.gocarrental.is/driving/driving-tips/iceland-gas-station/
- SE/NO convenience: Reitan Convenience Sweden lists Pressbyrån, 7-Eleven and PBX; Convenience Stores Sweden lists Reitan, Axfood Närlivs/Direkten/Handlar'n, Time/Nära Dej; Norwegian convenience lists include Narvesen, 7-Eleven, Deli de Luca and MIX: https://www.reitanconvenience.se/ and https://conveniencestores.se/vip/390-vad-ar-convenience-stores-sweden

## Connector inventory found

`packages/ingestion/src/connectors/` currently contains exact or category connectors for: `apohem`, `citygross`, `citygross-bulk`, `coop`, `fuel-stations`, `hemkop`, `ica`, `ica-bulk`, `ica-reklamblad`, `lidl`, `lidl-bulk`, `mathem`, `matpriskollen`, `matspar`, `okq8-fuel`, `openfoodfacts`, `overpass`, `st1-fuel`, `willys`, `willys-bulk`.

Legend: **direct** = named connector; **aggregate** = aggregator/source can cover some products/stores but not a chain-native feed; **none** = no connector found.

## Sweden (SE)

| Category | Chain / banner | Connector coverage | Gap |
|---|---:|---|---|
| Grocery | ICA Nära, ICA Supermarket, ICA Kvantum, ICA Maxi | direct (`ica`, `ica-bulk`, `ica-reklamblad`) | — |
| Grocery | Coop, Stora Coop, X:-tra | direct (`coop`) | X:-tra banner handling should be verified inside Coop feed. |
| Grocery | Willys, Willys Hemma | direct (`willys`, `willys-bulk`) | — |
| Grocery | Hemköp | direct (`hemkop`) | — |
| Grocery | Lidl | direct (`lidl`, `lidl-bulk`) | — |
| Grocery | City Gross | direct (`citygross`, `citygross-bulk`) | — |
| Grocery/convenience | Tempo, Handlar'n, Matöppet, Nära Dej, Time | none | Add Axfood Närlivs / independent-convenience connector or OSM-only location coverage. |
| Border/specialty grocery | Eurocash, EKO, Costco Sweden | none | Add chain pages/store/product availability where public. |
| Online grocery | Mathem | direct (`mathem`) | — |
| Online grocery/meal kits | Matsmart, Delitea, Linas Matkasse, Matkomfort, Middagsfrid | aggregate for price comparison only (`matpriskollen`, `matspar` may observe some offers) | Add native online connectors if catalog/prices are in scope. |
| Pharmacy | Apohem | direct (`apohem`) | — |
| Pharmacy | Apoteket, Apotek Hjärtat, Kronans Apotek, Doz Apotek, Apotea, MEDS | none | Add pharmacy category connectors; prioritize Apoteket/Hjärtat/Kronans/Apotea. |
| Fuel | OKQ8, St1 | direct (`okq8-fuel`, `st1-fuel`) | — |
| Fuel | Circle K, Ingo, Preem, Tanka, Qstar, Din-X, Bilisten, Gulf/Shell-branded independents | aggregate/generic only (`fuel-stations`, `overpass`) | Add named fuel price connectors where public. |
| Convenience | Pressbyrån, 7-Eleven, PBX, Direkten, MyWay | none | Add Reitan Convenience and Axfood Närlivs convenience coverage. |
| Specialty/alcohol | Systembolaget | none | Add if regulated-alcohol product price/availability is in scope. |

## Norway (NO)

| Category | Chain / banner | Connector coverage | Gap |
|---|---:|---|---|
| Grocery | Kiwi | none | Add NorgesGruppen connector. |
| Grocery | Meny, Spar, Eurospar, Joker, Nærbutikken | none | Add NorgesGruppen connector with banner tagging. |
| Grocery | REMA 1000 | none | Add Reitan/REMA connector. |
| Grocery | Coop Extra, Coop Mega, Coop Prix, Coop Obs, Coop Marked, Matkroken | none | Add Coop Norge connector. |
| Grocery | Bunnpris | none | Add Bunnpris connector. |
| Online grocery | Oda | none | Add Oda connector (important online/price benchmark). |
| Pharmacy | Apotek 1, Vitusapotek, Boots apotek, Ditt Apotek, Farmasiet | none | Add pharmacy connectors; prioritize Apotek 1/Vitusapotek/Farmasiet. |
| Fuel | Circle K, Esso, Shell, YX, Uno-X, St1, Best, Bunker Oil | aggregate/generic only (`fuel-stations`, `overpass`) | Add named fuel price/location connectors. |
| Convenience | Narvesen, 7-Eleven, Deli de Luca, MIX | none | Add Reitan/NorgesGruppen convenience connectors if convenience assortment matters. |
| Specialty/variety | Europris, Normal, Rusta, Jula/Biltema convenience consumables | none | Out of core grocery unless household consumables are in scope. |
| Specialty/alcohol | Vinmonopolet | none | Add only if regulated-alcohol prices are in scope. |

## Iceland (IS)

| Category | Chain / banner | Connector coverage | Gap |
|---|---:|---|---|
| Grocery | Bónus | none | Add Hagar/Bónus connector. |
| Grocery | Krónan | none | Add Krónan connector. |
| Grocery | Nettó | none | Add Samkaup/Nettó connector. |
| Grocery/hypermarket | Hagkaup | none | Add Hagar/Hagkaup connector. |
| Grocery/discount | Prís | none | Add Prís connector. |
| Grocery/convenience | Kjörbúðin, Krambúðin, 10-11, Iceland, Samkaup Strax/Úrval | none | Add Samkaup/SKEL connector with banner tagging. |
| Grocery/specialty | Costco Iceland, Fjarðarkaup, Melabúðin | none | Add where public online data exists; Costco may be limited. |
| Pharmacy | Lyfja, Lyf og Heilsa, Apótekarinn, Garðs Apótek, Lyfjaval | none | Add Iceland pharmacy connectors; prioritize Lyfja and Lyf og Heilsa/Apótekarinn. |
| Fuel | N1, Orkan, Olís, ÓB, Atlantsolía, Costco fuel, Dælan | aggregate/generic only (`fuel-stations`, `overpass`) | Add Iceland fuel price/location connectors. |
| Specialty/alcohol | Vínbúðin | none | Add if regulated-alcohol products are in scope. |
| Online/convenience delivery | Heimkaup / local e-commerce, chain online shops where available | none | Add only after grocery/pharmacy/fuel priority gaps. |

## Explicit P0 gap list

1. **Norway grocery is completely missing chain-native coverage**: Kiwi, Meny, Spar/Eurospar, Joker/Nærbutikken, REMA 1000, Coop banners, Bunnpris and Oda have no direct connector.
2. **Iceland grocery is completely missing chain-native coverage**: Bónus, Krónan, Nettó, Hagkaup, Prís and Samkaup/SKEL convenience banners have no direct connector.
3. **Pharmacy coverage is Sweden-light and NO/IS absent**: only Apohem is direct. Missing SE national pharmacies (Apoteket, Hjärtat, Kronans, Doz, Apotea/MEDS), NO main chains (Apotek 1, Vitusapotek, Boots, Ditt Apotek, Farmasiet), and IS main chains (Lyfja, Lyf og Heilsa/Apótekarinn).
4. **Fuel coverage is SE-partial and NO/IS generic-only**: OKQ8 and St1 exist; Circle K/Ingo/Preem/Tanka/Qstar/Din-X and all NO/IS named fuel chains need direct price/location connectors if fuel is in product scope.
5. **Convenience coverage is absent**: Pressbyrån, 7-Eleven, PBX, Direkten, MyWay, Narvesen, Deli de Luca, MIX, Krambúðin and 10-11 are not chain-native.
6. **SE long tail remains after the big grocery chains**: Tempo/Handlar'n/Matöppet/Nära Dej/Time, Eurocash, EKO, Costco Sweden and meal-kit/online specialists are not direct.
7. **Aggregator connectors are not substitutes for chain coverage**: Matpriskollen/Matspar/OpenFoodFacts/Overpass help discovery and comparison, but they should not be counted as authoritative chain-native price, stock or promotion connectors.

## Suggested connector priority

1. NO: NorgesGruppen (Kiwi/Meny/Spar/Joker), REMA 1000, Coop Norge, Oda.
2. IS: Bónus/Krónan/Nettó/Hagkaup/Prís/Samkaup.
3. Pharmacies: SE Apoteket/Hjärtat/Kronans/Apotea, NO Apotek 1/Vitusapotek/Farmasiet, IS Lyfja/Lyf og Heilsa.
4. Fuel: Circle K/Preem/Ingo/Tanka for SE; Circle K/Uno-X/YX/Esso/Shell/St1 for NO; N1/Orkan/Olís/ÓB/Atlantsolía for IS.
5. Convenience: Reitan Convenience SE/NO and Samkaup/SKEL IS banners.
