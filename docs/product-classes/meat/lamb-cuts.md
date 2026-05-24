# Product classes: lamb cuts

Ticket: factory-tickets#1713
Scope: define lamb-cut equivalence classes for Sweden, Norway, and Iceland so marketplace, flyer, and store-ingestion pipelines can compare like with like across chains.

## Normalization rules

- Treat **animal + cut + preparation + bone state** as the primary class key. Brand, origin, and organic labels are attributes, not separate classes, unless a downstream matcher explicitly requests origin-restricted comparison.
- Keep **minced lamb** separate from whole-muscle cuts even when the declared fat percentage is low.
- Do not compare smoked/cured seasonal products (`pinnekjøtt`, `hangikjöt`, cured `fenalår`) against fresh lamb classes.
- Capture declared fat as a numeric value when present; otherwise use the default range below as a weak prior only.
- Preparation values are controlled terms: `whole`, `boneless`, `bone_in`, `sliced`, `diced`, `minced`, `rack`, `marinated`, `smoked`, `cured`, `frozen`.

## Class catalog

| Class id | English class | Swedish nomenclature | Norwegian nomenclature | Icelandic nomenclature | Cut attributes | Fat % attribute | Preparation values |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `lamb-ground` | Ground/minced lamb | `lammfärs` | `lammekjøttdeig`, `kjøttdeig av lam`, `lammekjøttdeig` | `lambahakk`, `hakkað lambakjöt` | trim/mince; no primal cut | required if declared; otherwise `10-20` prior | `minced`, `fresh`, `frozen` |
| `lamb-leg-roast` | Leg / roast | `lammstek`, `lammlår`, `lammrostbiff` | `lammelår`, `lammestek`, `surret lammestek` | `lambalæri`, `lambasteik` | hind leg/topside; bone-in or boneless | optional; lean prior `5-12` | `whole`, `boneless`, `bone_in`, `sliced`, `marinated` |
| `lamb-chops-loin` | Loin chops | `lammkotlett`, `lammkotletter`, `kotlettrad` | `lammekoteletter`, `lammekotelett` | `lambakótilettur`, `kótilettur` | loin/saddle chop; often bone-in | optional; medium prior `12-25` | `sliced`, `bone_in`, `marinated`, `frozen` |
| `lamb-rack` | Rack / ribs | `lammracks`, `lammrack`, `lammsadel`, `lammrygg` | `lammerack`, `lammecarré`, `lammerygg` | `lambahryggur`, `lambakóróna`, `lambakare` | rib rack/back/saddle; french-trim flag when visible | optional; medium prior `10-22` | `rack`, `bone_in`, `whole`, `marinated` |
| `lamb-fillet-loin` | Fillet / loin | `lammfilé`, `lammytterfilé`, `lamminnerfilé` | `lammefilet`, `lam ytrefilet`, `lam indrefilet` | `lambalundir`, `lambafille`, `lamba innralæri` | tenderloin/striploin; boneless | optional; lean prior `2-10` | `whole`, `boneless`, `sliced`, `marinated` |
| `lamb-shoulder-bog` | Shoulder / forequarter | `lammbog`, `lammframdel`, `lammgrytbitar` | `lammebog`, `fårikålkjøtt`, `grytekjøtt av lam` | `lambabógur`, `lambaframpartur`, `súpukjöt` | shoulder/forequarter/stew meat; bone flag important | optional; medium/fatty prior `12-28` | `whole`, `bone_in`, `boneless`, `diced`, `sliced` |
| `lamb-shank` | Shank | `lammlägg`, `framlägg`, `baklägg` | `lammeskank`, `lammeknoke` | `lambaskanki`, `lambalærisneið með legg` | lower leg; collagen-rich; front/back when known | optional; medium prior `8-18` | `bone_in`, `whole`, `sliced`, `frozen` |
| `lamb-smoked-cured` | Smoked/cured lamb (exclude from fresh comparisons) | `rökt lamm`, `torkat lamm` | `pinnekjøtt`, `fenalår`, `røkt lammelår` | `hangikjöt`, `reykt lambakjöt`, `léttreyktur lambahryggur` | cured/smoked seasonal lamb; not fresh commodity | not comparable; preserve declared nutrition only | `smoked`, `cured`, `sliced`, `bone_in`, `boneless` |

## Chain SKU example seeds

These examples are normalization seeds, not guaranteed-live assortment promises. Availability is seasonal for lamb in all three markets, so crawlers should store the observation date and source URL with every SKU.

| Market | Chain/source | SKU example | Normalized class id | Cut | Preparation | Fat % attribute | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SE | ICA | Lammstek i ugn / lammstek | `lamb-leg-roast` | leg/roast | `whole` | unknown | https://www.ica.se/recept/lamm/ |
| SE | ICA | Lammkotletter | `lamb-chops-loin` | loin chop | `sliced`, `bone_in` | unknown | https://www.ica.se/recept/lamm/kotlett/ |
| SE | ICA | Lammytterfilé | `lamb-fillet-loin` | loin fillet | `boneless` | unknown | https://www.ica.se/recept/lamm/file/ |
| SE | ICA | Lammlägg | `lamb-shank` | shank | `bone_in` | unknown | https://www.ica.se/recept/lamm/ |
| SE | ICA | Lammracks | `lamb-rack` | rack/ribs | `rack`, `bone_in` | unknown | https://www.ica.se/artikel/allt-om-lamm/ |
| SE | Coop | Lammfärs recipe/product wording | `lamb-ground` | mince | `minced` | declared when present | https://www.coop.se/recept/recept-a-o/l/ |
| SE | Coop | Lammkotletter | `lamb-chops-loin` | loin chop | `sliced`, `bone_in` | unknown | https://www.coop.se/recept/recept-a-o/l/ |
| SE | Coop | Lammstek | `lamb-leg-roast` | leg/roast | `whole` | unknown | https://www.coop.se/recept/recept-a-o/l/ |
| SE | Coop | Lammytterfilé | `lamb-fillet-loin` | loin fillet | `boneless` | unknown | https://www.coop.se/recept/recept-a-o/l/ |
| SE | Coop | Lammframdel | `lamb-shoulder-bog` | forequarter | `bone_in` | unknown | https://www.coop.se/handla/varor/kott-fagel-chark/lamm/bit/lammframdel-2373705400009 |
| SE | Willys | Lammstek search/catalog seed | `lamb-leg-roast` | leg/roast | `whole` | unknown | https://www.willys.se/ |
| SE | Willys | Lammkotletter search/catalog seed | `lamb-chops-loin` | loin chop | `sliced`, `bone_in` | unknown | https://www.willys.se/ |
| SE | Willys | Lammytterfilé search/catalog seed | `lamb-fillet-loin` | loin fillet | `boneless` | unknown | https://www.willys.se/ |
| SE | Willys | Lammfärs search/catalog seed | `lamb-ground` | mince | `minced` | declared when present | https://www.willys.se/ |
| SE | Willys | Lammlägg search/catalog seed | `lamb-shank` | shank | `bone_in` | unknown | https://www.willys.se/ |
| SE | Mathem | Scan Lammytterfilé ca 460 g | `lamb-fillet-loin` | loin fillet | `boneless` | source nutrition says 2.5 g fat/100 g | https://www.mathem.se/se/products/3390-scan-lammytterfile/ |
| SE | Mathem | Scan Utvald Lammkotlett ca 435 g | `lamb-chops-loin` | loin chop | `sliced`, `bone_in` | source nutrition says 17 g fat/100 g | https://www.mathem.se/se/products/2759-scan-utvald-lammkotlett/ |
| SE | Mathem | Scan Benfri Lammstek ca 700 g | `lamb-leg-roast` | leg/roast | `boneless` | unknown | https://www.mathem.se/se/products/3102-scan-benfri-lammstek/ |
| SE | Mathem | A.G. Bergfalk Lammfärs 450 g | `lamb-ground` | mince | `minced` | declared when present | https://www.mathem.se/se/products/2635-ag-bergfalk-lammfars/ |
| SE | Mathem | Scan Lammkotlett Örter ca 450 g | `lamb-chops-loin` | loin chop | `marinated`, `sliced`, `bone_in` | source nutrition says 5.8 g saturated fat/100 g | https://www.mathem.se/se/products/33334-scan-lammkotlett-orter-ca/ |
| NO | MENY | Lammelår | `lamb-leg-roast` | leg | `whole`, `bone_in` | unknown | https://meny.no/oppskrifter/lam/Lammelar/Provencalsk-lammelar-pa-gronnsaksseng/ |
| NO | MENY | Lammestek | `lamb-leg-roast` | roast | `whole`, `boneless` when `surret` | unknown | https://meny.no/oppskrifter/Lam/Lammestek/ |
| NO | MENY | Lammekoteletter | `lamb-chops-loin` | loin chop | `sliced`, `bone_in` | unknown | https://meny.no/oppskrifter/lammekoteletter |
| NO | MENY | Fårikålkjøtt | `lamb-shoulder-bog` | shoulder/forequarter/stew | `diced`, `bone_in` | unknown | https://meny.no/om-lam/ |
| NO | MENY | Lammekjøttdeig / lam burgers | `lamb-ground` | mince | `minced` | declared when present | https://meny.no/oppskrifter/lam/ |
| IS | Icelandic/Kjarnafæði | Lambalæri | `lamb-leg-roast` | leg | `whole`, `bone_in` | unknown | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Icelandic/Kjarnafæði | Lambahryggur | `lamb-rack` | saddle/back/rack | `whole`, `bone_in` | unknown | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Icelandic/Kjarnafæði | Lambakótilettur | `lamb-chops-loin` | loin chop | `sliced`, `bone_in` | unknown | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Icelandic/Kjarnafæði | Lambalundir | `lamb-fillet-loin` | tenderloin | `boneless` | unknown | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |
| IS | Icelandic/Kjarnafæði | Lambaframpartur úrbeinaður | `lamb-shoulder-bog` | forequarter/shoulder | `boneless`, `sliced` | unknown | https://www.kjarnafaedi.is/static/files/forsida/Baekur/kjarnafaedi_vorubkl_motuneyti_netid_staerri.pdf |

## Attribute extraction guidance

### Fat percentage

1. Prefer explicit nutrition or product-name declarations (`10%`, `fetthalt 12%`, `fett 17 g/100 g`).
2. For minced lamb, store `fat_percent_declared=true` only when the exact number appears on the SKU page or label. Otherwise assign `fat_percent_bucket=unknown` and keep the class default as a ranking prior.
3. For whole-muscle cuts, fat is often visible but undeclared. Do not infer an exact value; store `fat_percent_bucket` from the class table only for scoring fallback.
4. Do not compare smoked/cured lamb to fresh lamb by fat percentage; curing changes water content and nutrition comparability.

### Cut

Use a normalized `cut` enum with these values:

- `ground`
- `leg_roast`
- `loin_chop`
- `rack_back`
- `fillet_loin`
- `shoulder_forequarter`
- `shank`
- `smoked_cured`

### Preparation

Map SKU text to preparation flags:

| Text signal | Preparation flag |
| --- | --- |
| `benfri`, `utbenet`, `urbenad`, `úrbeinaður`, `boneless` | `boneless` |
| `med ben`, `bone-in`, `m/beini`, `koteletter`, `kótilettur` | `bone_in` |
| `skivad`, `sliced`, `sneiðar`, `sneiddur` | `sliced` |
| `grytbitar`, `grytekjøtt`, `súpukjöt`, `diced` | `diced` |
| `färs`, `kjøttdeig`, `hakk` | `minced` |
| `racks`, `rack`, `carré`, `kare`, `kóróna` | `rack` |
| `marinerad`, `kryddad`, `urter`, `heiðakryddaður` | `marinated` |
| `rökt`, `røkt`, `reykt`, `hangikjöt` | `smoked` |
| `pinnekjøtt`, `fenalår`, `torkat`, `cured` | `cured` |
| `fryst`, `frossen`, `frosinn`, `frozen` | `frozen` |

## Source notes

- ICA's lamb guide and lamb recipe/category pages list common Swedish labels including `lammstek`, `lammlägg`, `lammkotletter`, `lammracks`, and `lammytterfilé`.
- Coop's recipe A-Z page and lamm assortment page provide Swedish chain vocabulary for `lammfärs`, `lammkotletter`, `lammstek`, `lammytterfilé`, and `lammframdel`.
- MENY's lamb pages provide Norwegian vocabulary for `lammelår`, `lammestek`, `lammekoteletter`, `fårikålkjøtt`, and minced-lamb preparations.
- Kjarnafæði's Icelandic product catalog provides Icelandic labels including `lambalæri`, `lambahryggur`, `lambakótilettur`, `lambalundir`, and `lambaframpartur`.
