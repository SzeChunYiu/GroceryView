# Beef cuts product-class map

Status: operator reference for GroceryView product-class matching.  
Ticket: factory-tickets #1710.  
Last evidence pass: 2026-05-25.

This document defines the canonical beef-cut classes used when normalising
Nordic grocery SKUs. It covers Swedish, Norwegian, Icelandic, and English
nomenclature, parser attributes, and chain-level SKU examples for beef mince,
steaks, roasts, stewing cuts, and prepared cut formats.

## Normalisation rules

1. Prefer the explicit anatomical cut over marketing words. `strimlad entrecote`
   is still `beef_ribeye` with `preparation=strips`.
2. Keep `cut`, `fat_percent`, and `preparation` separate. Do not create new
   classes for organic, grass-fed, frozen, halal, dry-aged, or marinade claims.
3. Use title fat numbers before nutrition panels for mince (`nötfärs 10%`,
   `karbonadedeig 5%`, `nautahakk 12%`). If no number exists, emit the fallback
   band and set `fat_percent_source=fallback_cut_band`.
4. Bone-in terms (`med ben`, `på ben`, `bein`, `beinlaus`) affect `bone`, not
   the cut class. Most Nordic supermarket beef steaks are boneless unless the
   title explicitly says otherwise.
5. Keep Swedish/Norwegian/Icelandic aliases as parser evidence; do not translate
   titles before matching.

## Canonical classes and local nomenclature

| Canonical class | Swedish labels | Norwegian labels | Icelandic labels | English labels | Cut attributes |
| --- | --- | --- | --- | --- | --- |
| `beef_mince` | nötfärs, köttfärs nöt, blandfärs where beef share is explicit | kjøttdeig av storfe, karbonadedeig | nautahakk, hakk nautakjöt | beef mince, ground beef | `cut=ground_mixed`, `bone=boneless`, `preparation=ground` |
| `beef_ribeye` | entrecôte, entrecote | entrecôte, entrecote | entrecote, naut entrecote | ribeye, entrecote | `cut=ribeye`, `bone=usually_boneless` |
| `beef_tenderloin` | oxfilé, biff filé | indrefilet av storfe, okse indrefilet | nautalund, lundabiti | beef tenderloin, fillet | `cut=tenderloin`, `bone=boneless` |
| `beef_sirloin` | ryggbiff, biff, utskuren biff | ytrefilet, mørbrad where chain uses sirloin-style | nautasteik, sirloin | sirloin steak, striploin | `cut=sirloin_or_striploin`, `bone=usually_boneless` |
| `beef_chuck` | högrev, grytbitar av högrev | høyrygg, grytekjøtt | nautaframpartur, gúllas | chuck, braising beef | `cut=chuck`, `bone=usually_boneless`, `preparation=whole_or_diced` |
| `beef_round` | innanlår, fransyska, rostbiff | rundstek, flatbiff, bankekjøtt, roastbiff | innralæri, roast beef | round, topside, roast beef | `cut=round`, `bone=boneless`, `preparation=roast_or_slice` |
| `beef_brisket` | bringa, oxbringa | oksebryst, brisket | bringa, nautabringa | brisket | `cut=brisket`, `bone=usually_boneless` |
| `beef_short_rib` | short ribs, revben nöt, högrev på ben | short ribs, okseribbe | nautarif, short ribs | beef short rib | `cut=rib`, `bone=bone_in` |
| `beef_flank_skirt` | flankstek, flap steak, bavette | flank steak, flankstek, bavette | flanksteik, bavette | flank steak, skirt/bavette | `cut=flank_or_skirt`, `bone=boneless` |
| `beef_diced_strips` | grytbitar, lövbiff, strimlat nötkött, wokstrimlor | biffstrimler, grytekjøtt, strimlet storfe | gúllas, nautakjötsstrimlar | diced beef, beef strips | `cut=derived_from_label_or_mixed`, `preparation=diced_or_strips` |

## Fat-percent and preparation attributes

| Canonical class | Typical labelled/fallback fat band | Parser value guidance | Common preparations |
| --- | --- | --- | --- |
| `beef_mince` | labelled 5%, 10%, 12%, 15%, 20%; fallback 5-20% | Parse the number nearest `nötfärs`, `köttdeig`, `karbonadedeig`, or `nautahakk`. Karbonadedeig is normally leaner; use exact label when present. | `ground`, `fresh`, `frozen`, `formed`, `seasoned` |
| `beef_ribeye` | 10-25% marbling/fat band | Most products omit a percent; use nutrition only if labelled. | `steak`, `whole_piece`, `sliced`, `strips`, `grilled`, `marinated` |
| `beef_tenderloin` | 2-8% | Lean fallback; premium whole fillet/medallions stay same class. | `whole_piece`, `steak`, `medallion`, `frozen` |
| `beef_sirloin` | 3-12% | Includes ryggbiff/ytrefilet/sirloin-style steak. | `steak`, `whole_piece`, `sliced`, `marinated` |
| `beef_chuck` | 8-18% | Högrev/høyrygg and chuck stew packs keep `cut=chuck`; diced packs add `preparation=diced`. | `whole_piece`, `diced`, `slow_cook`, `stew` |
| `beef_round` | 2-10% | Roasts and roast-beef slices are round/topside unless product metadata names another cut. | `roast`, `thin_sliced`, `cooked`, `sandwich_slice` |
| `beef_brisket` | 10-25% | Preserve smoked/cured/corned as preparation values. | `whole_piece`, `smoked`, `slow_cook`, `cured` |
| `beef_short_rib` | 15-30% | Bone-in by default when `rib`, `revben`, or `rif` appears. | `bone_in`, `bbq`, `slow_cook`, `marinated` |
| `beef_flank_skirt` | 4-12% | Bavette/flap/flank map together unless the chain has a stricter cut taxonomy. | `steak`, `whole_piece`, `marinated`, `grilled` |
| `beef_diced_strips` | derive from named cut or fallback 5-15% | If title says `högrev grytbitar`, emit `cut=chuck`; if generic, use mixed/unknown with preparation. | `diced`, `strips`, `thin_sliced`, `wok` |

## SKU evidence by chain

At least five examples are listed per reference chain. Source notes point to
retailer product/search/category pages whose live content can vary by store and
date; ingestion snapshots should be preferred for exact test fixtures.

| Country | Chain | Five SKU/title examples | Source notes |
| --- | --- | --- | --- |
| Sweden | ICA | `Nötfärs 12% ICA`; `Nötfärs 5% ICA`; `Entrecôte skivad`; `Ryggbiff`; `Högrev grytbitar` | ICA beef/mince product and offer pages under `handla.ica.se` and `ica.se/recept` expose `nötfärs`, `entrecôte`, `ryggbiff`, `högrev`, and `grytbitar` nomenclature. |
| Sweden | Willys | `Nötfärs 10%`; `Nötfärs 5%`; `Entrecôte`; `Ryggbiff`; `Grytbitar av nöt` | Willys product/search URLs use slugged forms such as `Notfars`, `Entrecote`, `Ryggbiff`, `Grytbitar`, and `Hogrev` on `willys.se`. |
| Sweden | Coop | `Nötfärs 12%`; `Eko Nötfärs`; `Entrecôte`; `Ryggbiff`; `Högrev` | Coop assortment/flyer pages (`coop.se`, `dr.coop.se`) use the same Swedish cut terms and distinguish mince fat percent in titles. |
| Norway | MENY | `Kjøttdeig av storfe 14%`; `Karbonadedeig 5%`; `Entrecôte av storfe`; `Ytrefilet av storfe`; `Høyrygg` | MENY category pages for storfe, kjøttdeig/farse, biff and grytekjøtt expose the Norwegian labels. |
| Norway | REMA 1000 | `Kjøttdeig av storfe`; `Karbonadedeig`; `Entrecôte`; `Ytrefilet`; `Grytekjøtt av storfe` | REMA recipe/product pages use `kjøttdeig`, `karbonadedeig`, `entrecôte`, `ytrefilet`, and `grytekjøtt` as customer-facing labels. |
| Norway | KIWI | `Kjøttdeig`; `Karbonadedeig`; `Biffstrimler`; `Entrecôte`; `Høyrygg` | KIWI recipe and product-guide pages expose the same labels for mince, strips, steak, and braising cuts. |
| Iceland | Krónan | `Nautahakk`; `Nautahakk 12%`; `Nauta entrecote`; `Nautalund`; `Gúllas nautakjöt` | Krónan product pages under `kronan.is/vara/...` use `nautahakk`, `entrecote`, `nautalund`, and `gúllas` wording for Icelandic beef SKUs. |

## Fixture recommendations

For automated classifier tests, include one fixture per major class and language:

- Swedish: `Nötfärs 10%`, `Entrecôte`, `Oxfilé`, `Ryggbiff`, `Högrev`,
  `Fransyska`, `Oxbringa`, `Short ribs nöt`, `Flankstek`, `Strimlat nötkött`.
- Norwegian: `Kjøttdeig av storfe`, `Karbonadedeig 5%`, `Entrecôte`,
  `Indrefilet`, `Ytrefilet`, `Høyrygg`, `Grytekjøtt`, `Biffstrimler`.
- Icelandic: `Nautahakk`, `Nauta entrecote`, `Nautalund`, `Nautasteik`,
  `Gúllas nautakjöt`, `Nautabringa`, `Nautakjötsstrimlar`.

Expected core parse examples:

```json
[
  {
    "raw": "Nötfärs 10% 500g",
    "class": "beef_mince",
    "cut": "ground_mixed",
    "bone": "boneless",
    "preparation": ["ground", "fresh"],
    "fat_percent": 10,
    "fat_percent_source": "title"
  },
  {
    "raw": "Entrecôte av storfe 2 skiver",
    "class": "beef_ribeye",
    "cut": "ribeye",
    "bone": "usually_boneless",
    "preparation": ["steak", "sliced"],
    "fat_percent": null,
    "fat_percent_band": "10-25",
    "fat_percent_source": "fallback_cut_band"
  },
  {
    "raw": "Grytbitar av högrev",
    "class": "beef_chuck",
    "cut": "chuck",
    "bone": "usually_boneless",
    "preparation": ["diced", "stew"],
    "fat_percent": null,
    "fat_percent_band": "8-18",
    "fat_percent_source": "fallback_cut_band"
  }
]
```

## Production caveats

- `biff` is ambiguous in Swedish/Norwegian. Treat it as sirloin/steak only when
  no stronger cut token (`entrecôte`, `högrev`, `indrefilet`) is present.
- `karbonadedeig` is Norwegian lean beef mince, not a prepared patty unless the
  title also contains burger/kaker.
- `roastbiff` can be cooked deli slices or a raw roast; preparation should come
  from the product category and packaging words.
- `gúllas` and `grytbitar` describe preparation (diced/stew). Preserve the named
  cut when the title also includes `högrev`, `høyrygg`, or an equivalent.
