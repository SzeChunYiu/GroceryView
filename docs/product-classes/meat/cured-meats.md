# Product class: cured meats (`cured-meats`)

This file defines the grocery equivalence class for preserved meat products whose primary preservation or flavour treatment is curing, brining, smoking, drying, fermenting, or a combination of those processes. It covers ready-to-eat charcuterie slices, bacon/streaky pork, cured ham, kassler/Canadian-style smoked loin, salami/fermented sausage, and air-dried hams.

## Source evidence

SKU examples below cite either the checked-in ingestion snapshots under `apps/web/src/lib/ingested/` or public retailer product URLs captured in those snapshots/search results. Snapshot timestamps used by this doc:

- ICA: `apps/web/src/lib/ingested/ica.ts`, retrieved `2026-05-24T00:56:17.000Z`.
- Coop: `apps/web/src/lib/ingested/coop.ts`, product snapshot retrieved `2026-05-23T19:45:53.055Z`; weekly-discount snapshot retrieved `2026-05-22T15:07:27.837Z`; plus public Coop product URLs for additional SKU coverage.
- Willys: `apps/web/src/lib/ingested/willys.ts`, retrieved `2026-05-23T20:40:33.430Z`.
- Hemköp: `apps/web/src/lib/ingested/hemkop.ts`, retrieved `2026-05-23T18:24:28.695Z`.
- City Gross: `apps/web/src/lib/ingested/citygross.ts`, retrieved `2026-05-23T21:33:46.069Z`.

## Nomenclature by class

| Class key | English | Swedish terms | Norwegian terms | Icelandic terms | Include | Exclude / route elsewhere |
| --- | --- | --- | --- | --- | --- | --- |
| `bacon-streaky` | Bacon / streaky bacon | bacon, skivat bacon, kalkonbacon, stekfläsk, sidfläsk | bacon, skivet bacon, flesk, sideflesk, stekeflesk | beikon, sneitt beikon, síðuflesk | Raw or ready-to-cook cured/smoked belly, turkey/chicken bacon analogues when merchandised as bacon | Plant-based bacon -> `plant-based-deli`; bacon-flavoured snacks/cheese -> source category |
| `cured-ham` | Cured/smoked/cooked ham | skinka, rökt skinka, basturökt skinka, kokt skinka, extrarökt skinka, strimlad rökt skinka, julskinka | skinke, røkt skinke, kokt skinke, juleskinke | skinka, reykt skinka, soðin skinka, jólaskinka | Pork ham/leg/shoulder cuts sold sliced, diced, shredded, whole, or deli-cut | Baby meals, cheese spreads, pet food, pizzas where ham is only an ingredient |
| `kassler-smoked-loin` | Kassler / smoked pork loin | kassler, varmrökt kassler, vinmarinerad kassler | kassler, røkt svinekam | kassler, reyktur svínahryggur | Brined and smoked pork loin/neck sold whole, sliced, or by weight | Fresh pork loin without curing/smoke -> `fresh-pork` |
| `salami-fermented-sausage` | Salami / cured sausage | salami, pepparsalami, vitlökssalami, salami Milano/Napoli, chorizo, prickig korv, kallrökt korv | salami, peppersalami, hvitløkssalami, chorizo, spekepølse | salami, pepper-salami, hvítlaukssalami, chorizo, spægipylsa | Dry, semi-dry, cold-smoked, or fermented sausages sold as slicing sausage, snack sticks, deli slices | Fresh grill sausages unless explicitly fermented/cured/smoked; hot dogs/falukorv -> `sausages` |
| `air-dried-ham` | Prosciutto / Serrano / air-dried ham | prosciutto, parmaskinka, serranoskinka, lufttorkad skinka, crudo | spekeskinke, parmaskinke, serranoskinke, lufttørket skinke | parmaskinka, serrano-skinka, loftþurrkuð skinka, hráskinka | Dry-cured whole-muscle hams and slices | Filled pasta or pizza where prosciutto is only an ingredient unless no better class exists |
| `smoked-ready-meat` | Smoked ready-to-eat meat | rökt kalkon, rökt kyckling, granrökt hästkött, varmrökt/rimmat kött | røkt kalkun, røkt kylling, røkt kjøtt | reyktur kalkúnn, reyktur kjúklingur, reykt kjöt | Non-ham cured/smoked ready-to-eat meats in deli/chark taxonomy | Hot smoked fish -> `smoked-fish`; fresh marinated poultry -> poultry classes |

## Attribute values

Use these normalized attributes when mapping SKUs into `cured-meats`.

| Attribute | Allowed values | Notes / examples |
| --- | --- | --- |
| `fat_percent_band` | `unknown`, `0-3`, `3-8`, `8-15`, `15-25`, `25-35`, `35-plus` | Populate from nutrition when available. Lean sliced ham/turkey often `0-3` or `3-8`; salami often `25-35`; bacon/stekfläsk often `35-plus`. Do not infer a precise percent from marketing copy; use `unknown` until nutrition is parsed. |
| `cut` | `belly`, `ham-leg`, `loin`, `shoulder`, `poultry-breast`, `whole-muscle-other`, `minced-or-emulsified-sausage`, `formed-slices`, `unknown` | Bacon/sideflesk -> `belly`; skinka/julskinka -> `ham-leg`; kassler -> `loin`; salami/chorizo/prickig korv -> `minced-or-emulsified-sausage`; deli turkey/chicken slices -> `poultry-breast` when known. |
| `preparation` | `cured`, `brined`, `smoked-cold`, `smoked-hot`, `air-dried`, `fermented`, `cooked-cured`, `ready-to-cook`, `ready-to-eat`, `raw-cured`, `unknown` | Multiple values may apply. Example: bacon is often `cured`, `smoked-hot`, `ready-to-cook`; cooked ham is `brined`, `cooked-cured`, `ready-to-eat`; salami is `fermented`, often `air-dried`, `ready-to-eat`. |
| `format` | `sliced`, `diced`, `shredded`, `whole-piece`, `by-weight`, `multi-pack`, `snack-stick`, `filled-ingredient`, `unknown` | `filled-ingredient` is a weak-match flag for tortellini/pizza products containing prosciutto/skinka; prefer non-ingredient SKUs where available. |
| `meat_species` | `pork`, `beef`, `poultry`, `horse`, `mixed`, `plant-based`, `unknown` | `plant-based` is tracked only for exclusion/analogue analysis; do not map it to meat equivalence unless explicitly requested. |

## SKU examples by retailer chain

Each retailer chain has at least five cited SKU examples. The `Suggested class` column is the normalized class key from this document.

### ICA

| SKU / code | Product name | Suggested class | Attribute hints | Citation |
| --- | --- | --- | --- | --- |
| `1477716` | Skinka Strimlad Rökt 180g ICA | `cured-ham` | cut=`ham-leg`; preparation=`smoked-hot`, `cooked-cured`; format=`shredded` | `apps/web/src/lib/ingested/ica.ts`; <https://handlaprivatkund.ica.se/stores/1003822/products/1477716/details> |
| `2002122` | Kassler ca 600g ICA | `kassler-smoked-loin` | cut=`loin`; preparation=`brined`, `smoked-hot`; format=`whole-piece`, `by-weight` | `apps/web/src/lib/ingested/ica.ts`; <https://handlaprivatkund.ica.se/stores/1003822/products/2002122/details> |
| `1447258` | Salami Milano 70g ICA | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`fermented`, `air-dried`; format=`sliced` | `apps/web/src/lib/ingested/ica.ts`; <https://handlaprivatkund.ica.se/stores/1003822/products/1447258/details> |
| `1348425` | Bacon Rökt Skivad 125g Tulip | `bacon-streaky` | cut=`belly`; preparation=`cured`, `smoked-hot`, `ready-to-cook`; format=`sliced` | `apps/web/src/lib/ingested/ica.ts`; <https://handlaprivatkund.ica.se/stores/1003822/products/1348425/details> |
| `1275805` | Emilskinka Rökt 120g Pärsons | `cured-ham` | cut=`ham-leg`; preparation=`smoked-hot`, `cooked-cured`; format=`sliced` | `apps/web/src/lib/ingested/ica.ts`; <https://handlaprivatkund.ica.se/stores/1003822/products/1275805/details> |

### Coop

| SKU / code | Product name | Suggested class | Attribute hints | Citation |
| --- | --- | --- | --- | --- |
| `7300204336008` | Bacon Miniskivat | `bacon-streaky` | cut=`belly`; preparation=`cured`, `ready-to-cook`; format=`sliced` | <https://www.coop.se/handla/varor/kott-fagel-chark/chark/bacon-stekflask/bacon-miniskivat-7300204336008> |
| `2354043600009` | Bacon skivat gårdsmärkt | `bacon-streaky` | cut=`belly`; preparation=`cured`, `ready-to-cook`; format=`sliced`, `by-weight` | <https://www.coop.se/handla/varor/kott-fagel-chark/chark/bacon-stekflask/bacon-skivat-gardsmarkt-2354043600009/> |
| `7300206718000` | Bacon 3-pack Scan | `bacon-streaky` | cut=`belly`; preparation=`cured`, `ready-to-cook`; format=`sliced`, `multi-pack` | `apps/web/src/lib/ingested/coop.ts` weekly discounts; <https://dr.coop.se/Butik/Stora-Coop-Uppsala-Bol%C3%A4nderna> |
| `7300156600233` | Skinka rökt | `cured-ham` | cut=`ham-leg`; preparation=`smoked-hot`, `cooked-cured`; format=`sliced` | <https://www.coop.se/handla/varor/kott-fagel-chark/palagg-deli/rokt-skinka/skinka-rokt-7300156600233> |
| `7391196003610` | Salami Original Kallrökt | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`smoked-cold`, `fermented`; format=`sliced` | <https://www.coop.se/handla/varor/kott-fagel-chark/palagg-deli/rokt-skinka/salami-original-kallrokt-7391196003610> |

### Willys

| SKU / code | Product name | Suggested class | Attribute hints | Citation |
| --- | --- | --- | --- | --- |
| `101205233_KG` | Skivat Bacon, Signal & Ander | `bacon-streaky` | cut=`belly`; preparation=`cured`, `ready-to-cook`; format=`sliced`, `by-weight` | `apps/web/src/lib/ingested/willys.ts` |
| `101183319_ST` | Skinka Basturökt Deliskivor, Garant | `cured-ham` | cut=`ham-leg`; preparation=`smoked-hot`, `cooked-cured`; format=`sliced` | `apps/web/src/lib/ingested/willys.ts` |
| `101435164_ST` | Skinka Extrarökt Deliskivor, Garant | `cured-ham` | cut=`ham-leg`; preparation=`smoked-hot`, `cooked-cured`; format=`sliced` | `apps/web/src/lib/ingested/willys.ts` |
| `101187497_ST` | Pepparsalami Deliskivor, Garant | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`fermented`, `air-dried`; format=`sliced` | `apps/web/src/lib/ingested/willys.ts` |
| `101282504_ST` | Salami Milano Deliskivor, Garant | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`fermented`, `air-dried`; format=`sliced` | `apps/web/src/lib/ingested/willys.ts` |

### Hemköp

| SKU / code | Product name | Suggested class | Attribute hints | Citation |
| --- | --- | --- | --- | --- |
| `101406133_ST` | BACON 2FÖR27, Garant | `bacon-streaky` | cut=`belly`; preparation=`cured`, `ready-to-cook`; format=`sliced`, `multi-pack` | `apps/web/src/lib/ingested/hemkop.ts` weekly discounts; category=`kott-fagel-och-chark|chark|bacon-och-stekflask` |
| `101283257_ST` | Kycklingbacon Rökt med Alspån, Garant | `bacon-streaky` analogue | cut=`poultry-breast`; preparation=`smoked-hot`, `ready-to-cook`; format=`sliced` | `apps/web/src/lib/ingested/hemkop.ts` |
| `101187496_ST` | SALAMI 2FÖR36 / Vitlökssalami Deliskivor, Garant | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`fermented`; format=`sliced` | `apps/web/src/lib/ingested/hemkop.ts` weekly discounts; <https://www.hemkop.se/produkt/Vitl%C3%B6kssalami-Deliskivor-101187496_ST> |
| `101459896_ST` | Picant Kycklingsalami, Pepi | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`fermented` or `unknown`; format=`sliced` | `apps/web/src/lib/ingested/hemkop.ts` |
| `101212214_ST` | Tortellini Prosciutto Crudo Färsk Pasta, Rana | `air-dried-ham` weak ingredient match | cut=`ham-leg`; preparation=`air-dried`; format=`filled-ingredient` | `apps/web/src/lib/ingested/hemkop.ts` |

### City Gross

| SKU / code | Product name | Suggested class | Attribute hints | Citation |
| --- | --- | --- | --- | --- |
| `100007136_KG` | Svensk Kassler Varmrökt & Rimmad, Scan | `kassler-smoked-loin` | cut=`loin`; preparation=`brined`, `smoked-hot`; format=`by-weight` | `apps/web/src/lib/ingested/citygross.ts`; <https://www.citygross.se/matvaror/chark-och-palagg/rimmat-och-rokt/scan-svensk-kassler-varmr%C3%B6kt-och-rimmad-p100007136_KG> |
| `100040607_ST` | Skivat Bacon Originalet, Scan | `bacon-streaky` | cut=`belly`; preparation=`cured`, `ready-to-cook`; format=`sliced` | `apps/web/src/lib/ingested/citygross.ts`; <https://www.citygross.se/matvaror/chark/bacon/scan-skivat-bacon-originalet-p100040607_ST> |
| `100091302_ST` | Prickig Korv Kallrökt, Scan | `salami-fermented-sausage` | cut=`minced-or-emulsified-sausage`; preparation=`smoked-cold`; format=`sliced` | `apps/web/src/lib/ingested/citygross.ts`; <https://www.citygross.se/matvaror/chark/palagg/scan-prickig-korv-kallr%C3%B6kt-p100091302_ST> |
| `100101079_KG` | Kalkonklubba Basturökt, Ingelsta Kalkon | `smoked-ready-meat` | cut=`whole-muscle-other`; preparation=`smoked-hot`; format=`by-weight` | `apps/web/src/lib/ingested/citygross.ts`; <https://www.citygross.se/matvaror/chark/rimmat-och-rokt/ingelstakalkon-kalkonklubba-bastur%C3%B6kt-p100101079_KG> |
| `100102185_ST` | Hästkött Granrökt, Gustafs | `smoked-ready-meat` | cut=`whole-muscle-other`; preparation=`smoked-hot`; format=`sliced` | `apps/web/src/lib/ingested/citygross.ts`; <https://www.citygross.se/matvaror/chark/palagg/gustafs-h%C3%A4stk%C3%B6tt-granr%C3%B6kt-p100102185_ST> |

## Mapping rules

1. Prefer explicit retailer category (`chark`, `bacon`, `pålägg`, `rimmat & rökt`, `kassler-skinka`) plus product name terms over brand text alone.
2. Treat filled pasta, pizza, baby meals, pet food, cheese spreads, chips, and seasonings as weak ingredient matches. They may cite nomenclature but should not drive price equivalence against meat SKUs.
3. When both a process and a cut are present, the cut-specific class wins: `kassler` -> `kassler-smoked-loin`; `bacon`/`sidfläsk` -> `bacon-streaky`; `skinka` -> `cured-ham`.
4. If a SKU has only `rökt`/`reykt`/`røkt` without a meat cut, map to `smoked-ready-meat` and leave `cut=unknown` unless the product title or category supplies the cut.
5. Keep `fat_percent_band=unknown` until nutrition parsing is available; do not infer exact fat percentage from price/unit data.
