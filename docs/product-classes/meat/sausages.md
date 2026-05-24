# Product classes: sausages

Ticket: factory-tickets#1717
Scope: define sausage equivalence classes for Sweden, Norway, and Iceland so fresh/frozen/chilled meat ingestion can compare like with like across chains.

## Normalization rules

- Use **sausage style + meat base + heat state + preparation** as the class key. Brand, casing supplier, pack size, organic claim, and spice variant are attributes unless a product is a protected regional style.
- Keep raw/fresh sausage separate from cooked/emulsified sausage because preparation safety and price comparability differ.
- Keep poultry, vegetarian/vegan, blood/liver, and smoked/cured specialty sausages separate from pork/beef grill or hot-dog classes.
- Capture declared fat as a numeric attribute when present (`fett 18 g/100 g`, `fetthalt 23%`). If absent, retain `fat_percent_bucket=unknown` and use class ranges below only as weak priors.
- Preparation values are controlled terms: `cooked`, `raw`, `smoked`, `cured`, `fermented`, `grill`, `boil`, `fry`, `ring`, `link`, `sliced`, `skinless`, `natural_casing`, `frozen`, `vegetarian`, `vegan`.

## Class catalog

| Class id | English class | Swedish nomenclature | Norwegian nomenclature | Icelandic nomenclature | Cut / meat attributes | Fat % attribute | Preparation values |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sausage-hotdog-wiener` | Wieners / hot dogs | `varmkorv`, `wienerkorv`, `hot dog`, `prinskorv` | `wienerpølse`, `rød pølse`, `pølse i brød` | `pylsur`, `vínarpylsur`, `kokteilpylsur` | finely emulsified pork/beef/lamb blend; casing optional | typical prior `15-28`; exact when declared | `cooked`, `boil`, `grill`, `link`, `natural_casing` |
| `sausage-grill-smoked` | Cooked grill sausage | `grillkorv`, `kabanoss`, `kolbasz`, `grillpølse` | `grillpølse`, `kjøttpølse`, `ostepølse`, `baconpølse` | `grillpylsur`, `ostapylsur`, `beikonpylsur` | cooked pork/beef sausage; cheese/bacon as flavor attributes | typical prior `18-32`; exact when declared | `cooked`, `smoked`, `grill`, `link` |
| `sausage-falu-ring` | Ring/bologna-style sausage | `falukorv`, `ringkorv`, `middagskorv` | `middagspølse`, `kjøttpølse ring`, `snabbpølse` | `bjúgu`, `kjötbjúga` | cooked coarse/fine pork-beef ring sausage; ring shape important | typical prior `18-25`; exact when declared | `cooked`, `smoked`, `ring`, `sliced`, `fry` |
| `sausage-fresh-raw` | Raw fresh sausage | `färskkorv`, `salsiccia`, `färsk chorizo`, `råkorv` | `rå pølse`, `rå salsiccia`, `bratwurst`, `rå chorizo` | `hráar pylsur`, `salsiccia`, `bratwurst` | raw minced pork/beef/lamb; must be cooked through | typical prior `15-30`; exact when declared | `raw`, `grill`, `fry`, `link`, `natural_casing` |
| `sausage-fermented-cured` | Fermented/cured slicing sausage | `salami`, `fuet`, `ölkorv`, `pepperoni` | `spekepølse`, `salami`, `morrpølse`, `fenalårpølse` | `salamí`, `pepperoni`, `spægipylsa` | cured/fermented pork/beef/lamb; not fresh meat equivalent | typical prior `25-45`; exact when declared | `cured`, `fermented`, `sliced`, `smoked` |
| `sausage-blood-liver` | Blood/liver sausage | `blodkorv`, `blodpudding`, `leverkorv`, `isterband` | `blodpølse`, `leverpølse`, `medisterpølse` | `blóðmör`, `lifrarpylsa`, `slátur` | blood, liver, grains, pork fat; style-specific | varies; require declared value when available | `cooked`, `smoked`, `fry`, `ring`, `sliced` |
| `sausage-poultry` | Poultry sausage | `kycklingkorv`, `kalkonkorv` | `kyllingpølse`, `kalkunpølse` | `kjúklingapylsur`, `kalkúnapylsur` | chicken/turkey mince; do not compare to pork/beef | typical prior `8-20`; exact when declared | `cooked`, `raw`, `grill`, `link` |
| `sausage-plant-based` | Plant-based sausage | `vegetarisk korv`, `vegokorv`, `vegansk korv` | `vegetarpølse`, `vegansk pølse` | `grænmetispylsur`, `vegan pylsur` | pea/soy/wheat/vegetable protein; meat-free flag required | nutrition-derived only | `vegetarian`, `vegan`, `grill`, `fry`, `link` |

## Chain SKU example seeds

These examples are normalization seeds, not guaranteed-live assortment promises. Store crawlers should persist observation date, pack size, GTIN when available, and source URL with each SKU.

| Market | Chain/source | SKU example | Normalized class id | Cut / meat base | Preparation | Fat % attribute | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SE | ICA | ICA Grillkorv 1 kg | `sausage-grill-smoked` | pork/beef cooked sausage | `cooked`, `grill`, `link` | declared nutrition when captured | https://handla.ica.se/produkt/1477187 |
| SE | ICA | Scan Falukorv ring 800 g | `sausage-falu-ring` | pork/beef ring sausage | `cooked`, `smoked`, `ring` | declared nutrition when captured | https://www.ica.se/static-store-assets/butiker/kvantum/stockholm/ica-kvantum-farsta-1003412/lpu---artikeltabell.pdf |
| SE | ICA | Scan Prinskorv med skinn 600 g | `sausage-hotdog-wiener` | small wiener sausage | `cooked`, `natural_casing`, `link` | declared nutrition when captured | https://www.ica.se/static-store-assets/butiker/kvantum/stockholm/ica-kvantum-farsta-1003412/lpu---artikeltabell.pdf |
| SE | ICA | Scan Chorizo 300 g | `sausage-grill-smoked` | spicy pork/beef sausage | `cooked`, `smoked`, `grill` | declared nutrition when captured | https://www.ica.se/static-store-assets/butiker/kvantum/stockholm/ica-kvantum-farsta-1003412/lpu---artikeltabell.pdf |
| SE | ICA | Isterband with mustard potato purée recipe seed | `sausage-blood-liver` | smoked/fatty pork-grain sausage | `smoked`, `fry`, `link` | unknown | https://www.ica.se/recept/korv/senap/ |
| SE | Coop | Grillad falukorv | `sausage-falu-ring` | ring sausage | `cooked`, `grill`, `sliced` | unknown | https://www.coop.se/inspiration/grilla-korv/ |
| SE | Coop | Lammkorv | `sausage-fresh-raw` | lamb sausage | `raw`, `grill`, `link` | declared when present | https://www.coop.se/inspiration/grilla-korv/ |
| SE | Coop | Salsiccia | `sausage-fresh-raw` | raw pork sausage | `raw`, `grill`, `link` | declared when present | https://www.coop.se/inspiration/grilla-korv/ |
| SE | Coop | Färsk chorizo | `sausage-fresh-raw` | raw spicy sausage | `raw`, `grill`, `link` | declared when present | https://www.coop.se/inspiration/grilla-korv/ |
| SE | Coop | Färskkorv kolbasz/chorizo/kabanoss 300 g | `sausage-fresh-raw` | raw/fresh spiced sausage | `raw`, `grill`, `link` | declared when present | https://dr.coop.se/Butik/235990 |
| SE | Willys | Grillkorv catalog seed | `sausage-grill-smoked` | cooked pork/beef sausage | `cooked`, `grill`, `link` | declared when present | https://www.willys.se/ |
| SE | Willys | Falukorv catalog seed | `sausage-falu-ring` | pork/beef ring sausage | `cooked`, `smoked`, `ring` | declared when present | https://www.willys.se/ |
| SE | Willys | Wienerkorv catalog seed | `sausage-hotdog-wiener` | emulsified hot-dog sausage | `cooked`, `boil`, `link` | declared when present | https://www.willys.se/ |
| SE | Willys | Chorizo catalog seed | `sausage-grill-smoked` | spicy sausage | `cooked`, `grill`, `link` | declared when present | https://www.willys.se/ |
| SE | Willys | Vegokorv catalog seed | `sausage-plant-based` | plant protein sausage | `vegetarian`, `grill`, `link` | nutrition-derived only | https://www.willys.se/ |
| NO | MENY | First Price Grillpølse 1 kg | `sausage-grill-smoked` | cooked grill sausage | `cooked`, `grill`, `link` | declared nutrition when captured | https://meny.no/varer/kjott/polser/grillpolser/grillpolse-7035620095801 |
| NO | MENY | Gilde Wienerpølse ca. 1.56 kg | `sausage-hotdog-wiener` | emulsified wiener sausage | `cooked`, `boil`, `link` | declared nutrition when captured | https://meny.no/varer/kjott/polser/wienerpolser/wienerpolse-2301279800000 |
| NO | MENY | Kokt medisterpølse | `sausage-blood-liver` | pork medister sausage | `cooked`, `ring`, `fry` | declared when present | https://meny.no/varer/kjott/polser |
| NO | MENY | Urøkt bratwurst | `sausage-fresh-raw` | raw/unsmoked bratwurst | `raw`, `grill`, `link` | declared when present | https://meny.no/varer/kjott/polser |
| NO | MENY | Lammepølse | `sausage-fresh-raw` | lamb sausage | `raw`, `grill`, `link` | declared when present | https://meny.no/oppskrifter/polser/ |
| IS | Kjarnafæði | Grillpylsur | `sausage-grill-smoked` | cooked grill sausage | `cooked`, `grill`, `link` | declared nutrition when captured | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Kjarnafæði | Vínarpylsur | `sausage-hotdog-wiener` | Icelandic wiener/hot dog | `cooked`, `boil`, `link` | declared nutrition when captured | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Kjarnafæði | Grófar morgunverðarpylsur | `sausage-grill-smoked` | coarse breakfast sausage | `cooked`, `fry`, `link` | declared nutrition when captured | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Icelandic pylsa reference | Pylsur / Icelandic hot dog | `sausage-hotdog-wiener` | lamb, pork, and beef blend | `cooked`, `boil`, `natural_casing` | declared nutrition when captured | https://trueiceland.com/products/hot-dog-pylsur |
| IS | Icelandic traditional reference | Blóðmör / lifrarpylsa | `sausage-blood-liver` | blood/liver/grain sausage | `cooked`, `sliced`, `fry` | declared when present | https://www.eurofir.org/wp-admin/wp-content/uploads/EuroFIR%2520synthesis%2520reports/Synthesis%2520Report%25206_Traditional%2520Foods%2520in%2520Europe.pdf |

## Attribute extraction guidance

### Fat percentage

1. Prefer exact declarations from nutrition panels or product titles (`fett 19 g/100 g`, `fetthalt 23%`). Store both the numeric value and the evidence text.
2. If only lean/low-fat marketing appears, store `fat_percent_bucket=low_declared` but do not invent a number.
3. For cured/fermented sausages, compare fat percentage only within the cured class because water loss changes nutrition density.
4. For plant-based sausages, derive fat only from nutrition data and set `meat_base=none`.

### Cut / meat base

Use a normalized `meat_base` enum:

- `pork_beef`
- `pork`
- `beef`
- `lamb`
- `poultry`
- `blood_liver`
- `mixed_lamb_pork_beef`
- `plant_based`
- `unknown_meat`

Use `cut=ground_emulsified` for hot dogs/wieners/grillkorv, `cut=coarse_ground` for fresh/farm sausages, `cut=ring` for falukorv/bjúgu, and `cut=sliced_cured` for salami/pepperoni.

### Preparation

| Text signal | Preparation flag |
| --- | --- |
| `färsk`, `rå`, `rå pølse`, `hrá` | `raw` |
| `kokt`, `förkokt`, `wiener`, `varmkorv`, `pylsur` | `cooked` |
| `rökt`, `røkt`, `reykt`, `smoked` | `smoked` |
| `salami`, `fuet`, `spekepølse`, `pepperoni` | `cured`, `fermented` |
| `falukorv`, `ring`, `bjúgu` | `ring` |
| `prinskorv`, `wienerpølse`, `vínarpylsur` | `link` |
| `skivad`, `sliced`, `sneiðar` | `sliced` |
| `skinnfri`, `skinless` | `skinless` |
| `naturskinn`, `med skinn`, `natural casing` | `natural_casing` |
| `vegetarisk`, `vegetarpølse` | `vegetarian` |
| `vegansk`, `vegan` | `vegan` |
| `fryst`, `frossen`, `frosinn`, `frozen` | `frozen` |

## Source notes

- ICA recipe/category pages and public store assortment tables provide Swedish seeds for grillkorv, falukorv, prinskorv, chorizo, and isterband.
- Coop grill guidance explicitly separates pre-cooked grill/falu products from raw fresh sausages such as lammkorv, salsiccia, and färsk chorizo.
- MENY's pølse assortment page lists Norwegian categories including grillpølse, wienerpølse, medisterpølse, bratwurst, lammepølse, kyllingpølse, salsiccia, and chipolata.
- Kjarnafæði's Icelandic product catalog and Icelandic hot-dog references provide Icelandic labels including grillpylsur, vínarpylsur, grófar morgunverðarpylsur, pylsur, blóðmör, and lifrarpylsa.
