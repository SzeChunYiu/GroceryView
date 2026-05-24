# Beef cuts product-class map

Status: operator reference for GroceryView product-class matching.  
Ticket: factory-tickets #1710.  
Last evidence pass: 2026-05-24.

This document defines the canonical beef-cut classes used when normalising Nordic grocery SKUs. It covers Swedish, Norwegian Bokmål, Icelandic, and English nomenclature, the parser attributes to emit, and chain-level SKU examples for Swedish reference chains.

## Normalisation rules

1. Split anatomical cut, preparation, pack state, and fat percentage into attributes. Do not create separate product classes for `skivad`, `i bit`, `färsk`, `fryst`, `marinerad`, country of origin, organic labels, or pack size.
2. Prefer explicit cut tokens over generic `nöt`, `nötkött`, `biff`, `beef`. Example: `Lövbiff av nötinnanlår` is `beef_thin_sliced_top_round`, not a generic steak.
3. Parse labelled fat values from title first (`5%`, `12%`, `fetthalt lägre än 20%`), then nutrition facts if available, then fallback cut bands below.
4. Prepared food stays in scope only when the SKU is clearly a butcher/meat product (`hamburgare av nöt`, `högrevsburgare`, `pepparbiff`). Exclude ready meals, dumplings, pasta, baby food, pet food, soups, and plant-based substitutes.
5. Keep language-specific aliases in the match evidence; normalise only after matching so Swedish/Norwegian/Icelandic terms remain auditable.

## Canonical classes and nomenclature

| Canonical class | Swedish labels | Norwegian labels | Icelandic labels | English labels | Core attributes |
| --- | --- | --- | --- | --- | --- |
| `beef_mince` | nötfärs, köttfärs av nöt, stekfärs av nöt | kjøttdeig av storfe, karbonadedeig, storfekjøttdeig | nautahakk, nautgripahakk, hakk úr nautakjöti | ground beef, beef mince | `cut=ground_mixed`, `bone=boneless`, `preparation=ground` |
| `beef_chuck` | högrev, högrev benfri, högrevsfärs | høyrygg, høyryggdeig | nautaframpartur, chuck/hálsvöðvi where imported | chuck, chuck roll | `cut=chuck`, `bone=usually_boneless`, `preparation=whole_piece_or_ground` |
| `beef_ribeye` | entrecôte, entrecote, entrecôte i skivor, entrecôte bit | entrecôte, entrecote | entrecôte, ribeye, rifjasteik | ribeye, entrecôte | `cut=ribeye`, `bone=boneless`, `preparation=steak_or_piece` |
| `beef_striploin_sirloin` | ryggbiff, biff med kappa, utskuren biff | ytrefilet, mørbrad/striploin where chain uses it | hryggvöðvi, sirloin, striploin | striploin, sirloin steak, rump/sirloin retail biff | `cut=striploin_or_sirloin`, `bone=boneless`, `preparation=steak_or_piece` |
| `beef_tenderloin` | oxfilé, nötfilé, file, filé av nöt | indrefilet av storfe, oksefilet | nautalund, nautafile | beef tenderloin, fillet | `cut=tenderloin`, `bone=boneless`, `preparation=whole_piece_or_steak` |
| `beef_thin_sliced_top_round` | lövbiff, lövbiff av innanlår, minutbiff, nötrulle skivad | løvbiff, flatbiff i skiver, minutbiff | þunnar nautakjötssneiðar, minute steak | minute steak, thin-sliced top round | `cut=top_round_or_round`, `bone=boneless`, `preparation=thin_sliced` |
| `beef_roast_round` | rostbiff, fransyska, innanlår, ytterlår, nötstek, nätad fransyska | roastbiff, rundstek, flatbiff, bankekjøtt | roastbeef, nautasteik, innralæri/utanlæri | roast beef, topside/silverside/round roast | `cut=round_roast`, `bone=boneless`, `preparation=roast_piece_or_deli_sliced` |
| `beef_stew_cubes` | grytbitar nöt, grytbitar av nötytterlår, grytkött | grytekjøtt, biffstrimler/grytebiter av storfe | nautakjöt í bita, pottréttakjöt | beef stew cubes, diced beef | `cut=mixed_or_round_or_chuck`, `bone=boneless`, `preparation=diced` |
| `beef_burger_patties` | hamburgare av nöt, högrevsburgare, färsbiff, pannbiff av nöt | storfeburger, hamburgere av storfe, karbonader | nautaborgari, hamborgari úr nautakjöti | beef burger, beef patty | `cut=ground_mixed_or_chuck`, `bone=boneless`, `preparation=formed_patty` |

## Fat-percent and preparation attributes

Emit `fat_percent` as a decimal number when the title or label gives a value. Use `fat_percent_operator=lt` for phrases such as `fetthalt lägre än 12%`; otherwise use `eq`. If no exact value is available, keep `fat_percent=null` and use the fallback band.

| Canonical class | Fat guidance | Preparation values to emit |
| --- | --- | --- |
| `beef_mince` | Exact retail labels commonly show `5`, `10`, `12`, `14`, `15`, or `20`; `lägre än 12%` becomes `fat_percent=12`, `fat_percent_operator=lt`. Fallback band `5-20`. | `raw`, `fresh`, `frozen`, `ground`, `vacuum_packed` |
| `beef_chuck` | Whole chuck fallback `8-18`; high-rev/chuck mince labels often show `13` or `20`. | `raw`, `fresh`, `frozen`, `whole_piece`, `ground`, `burger_blend` |
| `beef_ribeye` | Fallback `10-25`; marbling words (`extra marmorerad`) are quality attributes, not fat percent unless a label gives a number. | `raw`, `fresh`, `frozen`, `sliced`, `whole_piece`, `marinated` |
| `beef_striploin_sirloin` | Fallback `5-15`; keep `kappa` as `fat_cap=true`. | `raw`, `fresh`, `frozen`, `sliced`, `whole_piece`, `steak` |
| `beef_tenderloin` | Fallback `3-8`; do not infer higher fat from premium/holiday wording. | `raw`, `fresh`, `frozen`, `whole_piece`, `sliced`, `steak` |
| `beef_thin_sliced_top_round` | Fallback `3-8`; thin slicing is preparation, not a new cut if `innanlår`, `nötrulle`, or `flatbiff` is present. | `raw`, `fresh`, `thin_sliced`, `minute_steak` |
| `beef_roast_round` | Raw roast fallback `4-10`; cooked deli `rostbiff` may have labelled nutrition and should set `preparation=cooked,deli_sliced`. | `raw`, `fresh`, `whole_piece`, `netted`, `cooked`, `deli_sliced` |
| `beef_stew_cubes` | Fallback `5-15`; if cut is specified (`ytterlår`, `högrev`) populate both class and `source_cut`. | `raw`, `fresh`, `frozen`, `diced`, `stew` |
| `beef_burger_patties` | Exact title values override fallback; `högrevsburgare fetthalt 13%` emits `13`. Fallback `10-20`. | `raw`, `fresh`, `frozen`, `formed_patty`, `ready_to_cook`, `cooked` |

## SKU evidence by chain

Each row cites at least five real SKU/title examples for a chain. Source paths without external URLs are repository ingestion snapshots with retailer source URLs embedded in the file headers or row fields.

| Chain | Five SKU/title examples | Source notes | Parser coverage |
| --- | --- | --- | --- |
| ICA | `Lövbiff av innanlår`; `Högrevsburgare`; `Oxfile Hel Nötfile`; `Ryggbiff`; `Entrecote`; also `Skivad rostbiff` appears as a prepared/deli exclusion-or-roast fixture. | `apps/web/src/lib/ingested/ica-reklamblad.ts` lines around 21615, 24208, 34118, 34141, 34165, 4764; source is ICA weekly offers retrieved `2026-05-23`. | `beef_thin_sliced_top_round`, `beef_burger_patties`, `beef_tenderloin`, `beef_striploin_sirloin`, `beef_ribeye`, `beef_roast_round`. |
| Coop | `Lövbiff av nötinnanlår`; `Entrecôte av nöt`; `Rostbiff av nöt, skivad`; `Hamburgare av nöt, 8-p`; `Stekfärs av nöt`. | `apps/web/src/lib/ingested/matpriskollen.ts` lines around 671, 22728, 22935, 6559, 3569; store rows include Coop stores such as `Coop Malmö Central`, `Coop Norra Parkgatan`, `Coop Köpenhamnsvägen`, and other Coop locations. | Thin-sliced top round, ribeye, roast/deli-sliced round, burger patties, mince with fat parsing from title/category when present. |
| Willys | `Nötfärs 5% Sverige`; `Nötfärs 12% Sverige`; `Högrevsfärs 13% Sverige`; `Entrecôte i Skivor Sverige`; `Ryggbiff i Skivor Sverige`; additional fixtures include `Lövbiff Skivad Sverige`, `Grytbitar Nöt Sverige`, `Oxfilé i Bit Sverige`. | `apps/web/src/lib/ingested/willys.ts` lines around 4970, 5031, 5132, 8314, 8334, 8355, 8479, 8417; source category URLs are Willys public category/campaign JSON retrieved `2026-05-23T20:40:33.430Z`. | Exact fat labels `5`, `12`, `13`; ribeye/striploin/tenderloin/thin-sliced/stew classes; preparation `sliced`, `whole_piece`, `diced`. |
| Lidl | `Nötfärs` (`Matriket`, `fetthalt lägre än 12%`, ca 1.6 kg); `Färsk nötfärs` (`Butcher's`, `fetthalt lägre än 20%`, 1.5 kg); `Ryggbiff` (`Butcher's`, 300 g); `Skivad lövbiff` (`Svensk lövbiff`, ca 1 kg); `Entrecôte i skivor` (`Matriket`, ca 350 g); optional piece fixture `Entrecôte/ Biff med kappa i bit`. | Lidl product pages: `https://www.lidl.se/p/matriket-notfars/p10037686`, `https://www.lidl.se/p/butcher-s-farsk-notfars/p10035156`, `https://www.lidl.se/p/butcher-s-ryggbiff/p10038707`, `https://www.lidl.se/p/skivad-lovbiff/p11219624`, `https://www.lidl.se/p/entrecote-i-skivor/p11221003`, `https://www.lidl.se/p/naturkott-entrecote-biff-med-kappa-i-bit/p10036240`. | `fat_percent_operator=lt` for Lidl mince, `sliced` for lövbiff/entrecôte, `steak` for ryggbiff, `fat_cap=true` for biff med kappa. |

## Matcher notes

Suggested positive cut tokens after lowercasing and accent folding:

```text
notfars|nötfärs|köttfärs av nöt|stekfärs|högrev|hogrev|entrecote|entrecôte|ryggbiff|biff med kappa|oxfile|oxfilé|nötfile|nötfilé|lövbiff|lovbiff|minutbiff|nötrulle|rostbiff|fransyska|innanlår|ytterlår|grytbitar|hamburgare av nöt|högrevsburgare|beef|ground beef|ribeye|sirloin|striploin|tenderloin|roast beef|stew beef
```

Suggested exclusion tokens unless the category is butcher/meat and a human has approved the fixture:

```text
dumplings|pasta|stroganoff med biff|biffragu|barnmat|våtfoder|soppa|sås|vegetarisk|sojafärs|vegofärs|quorn|fiskbiff|grönsaksbiff
```

## Fixture recommendations

Minimum regression set:

```json
[
  {
    "raw": "Nötfärs 5% Sverige",
    "class": "beef_mince",
    "cut": "ground_mixed",
    "preparation": ["raw", "fresh", "ground"],
    "fat_percent": 5,
    "fat_percent_operator": "eq"
  },
  {
    "raw": "Matriket Nötfärs fetthalt lägre än 12%",
    "class": "beef_mince",
    "cut": "ground_mixed",
    "preparation": ["raw", "fresh", "ground"],
    "fat_percent": 12,
    "fat_percent_operator": "lt"
  },
  {
    "raw": "Lövbiff av nötinnanlår",
    "class": "beef_thin_sliced_top_round",
    "cut": "top_round_or_round",
    "preparation": ["raw", "thin_sliced"],
    "fat_percent": null,
    "fat_percent_band": "3-8"
  },
  {
    "raw": "Entrecôte i Skivor Sverige",
    "class": "beef_ribeye",
    "cut": "ribeye",
    "preparation": ["raw", "fresh", "sliced", "steak"],
    "fat_percent": null,
    "fat_percent_band": "10-25"
  },
  {
    "raw": "Entrecôte/ Biff med kappa i bit",
    "class": "beef_striploin_sirloin",
    "cut": "striploin_or_sirloin",
    "preparation": ["raw", "whole_piece"],
    "fat_cap": true
  }
]
```
