# Fish fillets product-class map

Status: operator reference for GroceryView product-class matching.
Ticket: factory-tickets #1714.
Last evidence pass: 2026-05-25.

This document defines the canonical fish-fillet classes used when normalising
Nordic grocery SKUs. It covers Swedish, Norwegian, Icelandic, and English
nomenclature; parser attributes for species/cut/preparation/fat; and chain-level
SKU examples for Sweden, Norway, and Iceland.

## Normalisation rules

1. Treat `fillet/filet/filé/flak/flök` as the primary cut signal. Keep species
   (`salmon`, `cod`, `saithe`, etc.), cut (`fillet`, `loin`, `pieces`), skin,
   bone, preparation, and fat values as separate attributes.
2. Prefer explicit species in the title or ingredient declaration over category
   text. Example: `fiskfilé sprödbakad` with ingredient `torsk` is
   `fish_cod_fillet` plus `preparation=breaded`.
3. `loin`, `rygg`, `torskeloin`, `hnakki/hnakkar`, and `back` are still fillet
   cuts, but emit `cut=loin` rather than plain `fillet`.
4. `bitar`, `portioner`, `block`, and `cubes` change `cut_form`, not species.
   Do not create new classes for pack size or count.
5. Use labelled nutrition for `fat_percent` when the retailer exposes it. If the
   SKU has no nutrition value, set `fat_percent=null`, use the fallback band, and
   set `fat_percent_source=fallback_species_band`.
6. Prepared values such as `sprödbakad`, `panerad`, `tempura`, `gravad`,
   `kallrökt`, `heitreyktur`, `teriyaki`, and `lettsaltet/léttsaltaðir` are
   `preparation` modifiers, not separate species classes.

## Canonical classes and local nomenclature

| Canonical class | Swedish labels | Norwegian labels | Icelandic labels | English labels | Core attributes |
| --- | --- | --- | --- | --- | --- |
| `fish_salmon_fillet` | laxfilé, laxfiléer, lax i bit, laxbitar | laksefilet, laksestykke, laksebiter | laxaflak, laxaflök, laxabitar, lax | salmon fillet, salmon portions, salmon pieces | `species=salmon`, `cut=fillet`, `bone=boneless_or_pinbone_unknown`, `skin=skin_on_or_off` |
| `fish_trout_fillet` | öringfilé, regnbågsfilé | ørretfilet, aurefilet | silungsflak, bleikjuflak, urriðaflak | trout fillet | `species=trout`, `cut=fillet`, `bone=boneless_or_pinbone_unknown`, `skin=skin_on_or_off` |
| `fish_cod_fillet` | torskfilé, torskfiléer, torskrygg, torskloin | torskefilet, torsk filet, torskeloin, torskestykke | þorskflak, þorskflök, þorskbitar, þorskhnakkar | cod fillet, cod loin, cod portions | `species=cod`, `cut=fillet_or_loin`, `bone=usually_boneless`, `skin=skinless_or_unknown` |
| `fish_saithe_pollock_fillet` | sejfilé, alaska pollockfilé, pollockfilé | seifilet, pollockfilet, alaska pollock | ufsa/ufsi flök, alaskaufsa flök | saithe fillet, pollock fillet, Alaska pollock fillet | `species=saithe_or_pollock`, `cut=fillet`, `bone=usually_boneless`, `skin=skinless_or_unknown` |
| `fish_haddock_fillet` | koljafilé, kolja | hysefilet, koljefilet | ýsuflök, ýsa | haddock fillet | `species=haddock`, `cut=fillet`, `bone=usually_boneless`, `skin=skinless_or_unknown` |
| `fish_flatfish_fillet` | rödspättafilé, spättafilé, flundrafilé | rødspettefilet, flyndrefilet | rauðsprettuflök, flatfiskflök | plaice fillet, flatfish fillet | `species=flatfish`, `cut=fillet`, `bone=usually_boneless`, `skin=skinless_or_unknown` |
| `fish_mixed_white_fillet` | fiskfilé, vit fiskfilé, panerad fiskfilé | fiskefilet, hvit fisk, fiskestykke | fiskflök, hvítfiskflök | white fish fillet, mixed fish fillet | `species=white_fish_unknown`, `cut=fillet`, `bone=usually_boneless`, `skin=skinless_or_unknown` |
| `fish_tuna_fillet` | tonfiskfilé, tonfiskloin | tunfiskfilet, tunfiskloin | túnfisksteik, túnfiskflak | tuna fillet, tuna loin, tuna steak | `species=tuna`, `cut=fillet_or_loin`, `bone=boneless`, `skin=skinless` |

## Fat-percent, cut, and preparation attributes

Emit exact `fat_percent` values from nutrition where available. Otherwise keep
`fat_percent` null and emit the fallback band as evidence for ranking and
nutrition-per-SEK estimates.

| Canonical class | Typical labelled/fallback fat band | Cut attribute guidance | Common preparations |
| --- | --- | --- | --- |
| `fish_salmon_fillet` | 12-16% fat for raw fillets; 5-16% when marinated/prepared | `cut=fillet`; use `cut_form=side`, `portion`, `pieces`, or `cubes`. `skin=skin_on` when `med roði/m skinn`, else `skinless_or_unknown`. | `raw`, `fresh`, `frozen`, `skin_on`, `skinless`, `cubes`, `marinated`, `gravad`, `cold_smoked`, `hot_smoked`, `teriyaki` |
| `fish_trout_fillet` | 5-13% fat; often slightly leaner than salmon | Same as salmon; keep trout separate even when recipe says `laks eller ørret`. | `raw`, `fresh`, `frozen`, `skin_on`, `skinless`, `grilled`, `pan_fried`, `rakfisk` |
| `fish_cod_fillet` | 0-1% fat for raw cod; 7-11% for breaded/pan-fried products | `cut=loin` for `torskrygg/torskeloin/þorskhnakkar`; otherwise `cut=fillet`. Use `cut_form=pieces` for `bitar`. | `raw`, `fresh`, `frozen`, `loin`, `pieces`, `breaded`, `tempura`, `lightly_salted`, `baked` |
| `fish_saithe_pollock_fillet` | 0.5-2% raw; 7-12% breaded | Map `sej/sei/ufsi` to saithe and `alaska pollock` to pollock. Use `species_detail` when known. | `raw`, `frozen`, `block`, `breaded`, `fish_fingers`, `tempura` |
| `fish_haddock_fillet` | 0.5-2% raw; 6-10% prepared | Use `species=haddock`; do not merge with cod unless the SKU only says `white fish`. | `raw`, `fresh`, `frozen`, `breaded`, `smoked` |
| `fish_flatfish_fillet` | 1-3% raw; 8-14% breaded | Keep flatfish separate for rödspätta/rødspette/rauðspretta because portion shape and price bands differ. | `raw`, `frozen`, `breaded`, `rolled`, `stuffed` |
| `fish_mixed_white_fillet` | 0.5-3% raw white fish; 7-12% breaded | Use only when species is absent or mixed. Promote to cod/saithe/pollock/etc. when ingredients name the fish. | `raw`, `frozen`, `breaded`, `sprödbakad`, `panerad`, `fillet_pieces` |
| `fish_tuna_fillet` | 1-5% raw tuna loin/fillet; canned salads are out of scope | `cut=loin` for loin/steak titles; exclude canned tuna salads unless the SKU is explicitly a fillet/loin. | `raw`, `frozen`, `steak`, `loin`, `marinated` |

### Exact-value examples from cited SKU evidence

- ICA `Torskfilé 300g ICA Gott Liv` and `Torskfiléer Fryst 1kg ICA` list fat at
  0.5 g per 100 g, so emit `fat_percent=0.5` with `fat_percent_source=label_nutrition`.
- ICA `Sprödpanerad torskfilé` lists fat around 10 g per 100 g, so keep species
  cod but add `preparation=breaded` and exact prepared fat.
- Krónan `Hnýfill þorskflök` lists `Fita: 0,5 g`; Krónan `Landlax Laxaflök með
  Roði` lists `Fita: 14,6 g`; Krónan marinated/teriyaki salmon examples show why
  prepared salmon can be lower or higher than the raw salmon fallback.

## SKU evidence by chain

Rows below give five SKU/title examples per reference chain. Source URLs point
to retailer product/search/category/recipe pages that expose the nomenclature;
live assortment and store-specific availability can change.

| Country | Chain | Five SKU/title examples | Source notes |
| --- | --- | --- | --- |
| Sweden | ICA | `Torskfilé 300g ICA Gott Liv`; `Torskfiléer Fryst 1kg ICA`; `Sprödpanerad torskfilé 4-p Fryst 360g ICA`; `Alaska pollock Fryst 400g ICA Basic`; `Laxfilé 3-pack 420g ICA` | ICA product evidence: [torskfilé 300g](https://handla.ica.se/produkt/2083985), [torskfiléer 1kg](https://handla.ica.se/produkt/1384787), [sprödpanerad torskfilé](https://handla.ica.se/produkt/1008930), [Alaska pollock fryst](https://handla.ica.se/produkt/1410808), [laxfilé 3-pack](https://handla.ica.se/produkt/2119277). |
| Sweden | Willys | `Laxfilé Fryst Omega 4x125g`; `Laxfilé Garant 500g`; `Torskfilé Omega 400g`; `Torskfilé Portionbitar Frysta Garant 400g`; `Sejfilé Garant 400g` | Willys public search API evidence from `https://www.willys.se/search?q=...` for `laxfilé`, `torskfilé`, and `sejfilé`; search rows expose product codes `101804336_ST`, `101827824_ST`, `101546946_ST`, `101423140_ST`, and `101545504_ST`. |
| Sweden | Coop | `Laxfilé 4-pack`; `Laxfilé Eko`; `Torskfiléer i bitar`; `Torskfilé Sprödbakad`; `Sejfilébitar i block` | Coop public personalization search evidence from `https://external.api.coop.se/personalization/search/products` for `laxfilé`, `torskfilé`, and `sejfilé`; Coop press also documents own-brand `torskrygg`, `torskfilé`, and `laxfilé` in 300-500 g ranges ([press note](https://pressrum.coop.se/silly-nyheter-wasabi-till-coop/)). |
| Norway | MENY | `Torsk Filet u/Skinn Vill pr Kg`; `Laksefilet`; `Ørretfilet Porsjon 280g Fiskemannen`; `Ørretfilet m/Skinn 500g First Price`; `Seifilet Blokk 400g First Price` | MENY product/category evidence: [Torsk Filet](https://meny.no/varer/fisk-skalldyr/fisk/torsk/torsk-filet-2000193100004), [Laksefilet](https://meny.no/varer/fisk-skalldyr/fisk/laks/laks-naturell/laksefilet-7023539700527), [Ørretfilet porsjon](https://meny.no/varer/fisk-skalldyr/fisk/orret/orretfilet-7035620058608), [Ørretfilet m/skinn](https://meny.no/varer/fisk-skalldyr/fisk/orret/orretfilet-7035620033483), [Seifilet blokk](https://meny.no/varer/fisk-skalldyr/fisk/sei/seifilet-7035620068669). |
| Norway | REMA 1000 | `Laksefilet, skinnfri`; `Laksefilet u/ skinn eller ørret`; `Laksefilet naturell`; `Torskefilet eller torskeloin`; `Torskefilet, ben- og skinnfri` | REMA recipe/category evidence uses product-style ingredient titles: [laksesnacks](https://www.rema.no/oppskrifter/fisk/laks/laksesnacks/), [fiskewok](https://www.rema.no/oppskrifter/fisk/laks/fiskewok/), [stekt laks](https://www.rema.no/oppskrifter/fisk/laks/stekt-laks-med-kokossaus/), [bacalao med torskefilet](https://www.rema.no/oppskrifter/fisk/torsk/bacalao-med-torskefilet/), [ovnsbakt torskefilet](https://www.rema.no/oppskrifter/fisk/torsk/ovnsbakt-torskefilet-med-gronnsaker/). |
| Norway | KIWI | `Laksefilet uten skinn og bein fra Lerøy`; `Ørret u/skinn 200g Lerøy`; `First Price ørret- eller laksefileter`; `Skrei- eller torskefilet`; `Pankopanert torsk` | KIWI evidence: [familievennlige laksretter](https://kiwi.no/fisk/familievennlige-laksretter), [rask/enkel middag for 1](https://kiwi.no/rask-enkel-middag-for-1), [sommerretter med laks](https://kiwi.no/tre-sommerretter-med-laks), [skrei/torskefilet soup](https://kiwi.no/oppskrifter/fisk/torsk/haralds-skrei--torskesuppe/), [fisk-er-godt](https://kiwi.no/fisk/fisk-er-godt). |
| Iceland | Krónan | `Hnýfill þorskflök`; `Fiskverzlun Hafliða þorskbitar roð- og beinlausir`; `Landlax Laxaflök með Roði`; `Fiskverzlun Hafliða laxabitar frosnir`; `Fiskverzlun Hafliða lax í teriyaki og sesam` | Krónan product evidence: [Hnýfill þorskflök](https://kronan.is/vara/100267175-hnyfill-thorskflok), [þorskbitar roð- og beinlausir](https://kronan.is/vara/100267985-fiskverzlun-haflida-thorskbitar-rod-og-beinlausir), [Landlax laxaflök með roði](https://kronan.is/vara/100260649), [laxabitar frosnir](https://kronan.is/vara/100268423-fiskverzlun-haflida-laxabitar-frosnir), [lax í teriyaki og sesam](https://kronan.is/vara/100271644-fiskverzlun-haflida-lax-i-teriyaki-og-sesam). |

## Fixture recommendations

For automated classifier tests, include at least one fixture per language and
species band:

- Swedish: `Torskfilé`, `Torskrygg`, `Alaska pollock panerad`, `Sejfilé`,
  `Laxfilé`, `Öringfilé`, `Fiskfilé sprödbakad`.
- Norwegian: `Torskefilet`, `Torskeloin`, `Seifilet`, `Laksefilet`,
  `Ørretfilet`, `Hysefilet`, `Fiskefilet`.
- Icelandic: `Þorskflök`, `Þorskhnakkar`, `Laxaflök`, `Laxabitar`, `Ýsuflök`,
  `Bleikjuflak`, `Fiskflök`.

Expected parse examples:

```json
[
  {
    "raw": "Torskfilé 300g ICA Gott Liv",
    "class": "fish_cod_fillet",
    "species": "cod",
    "cut": "fillet",
    "cut_form": "portion",
    "bone": "usually_boneless",
    "skin": "skinless",
    "preparation": ["raw", "refreshed"],
    "fat_percent": 0.5,
    "fat_percent_source": "label_nutrition"
  },
  {
    "raw": "Landlax Laxaflök með Roði",
    "class": "fish_salmon_fillet",
    "species": "salmon",
    "cut": "fillet",
    "cut_form": "side_or_portion",
    "bone": "boneless_or_pinbone_unknown",
    "skin": "skin_on",
    "preparation": ["raw", "fresh"],
    "fat_percent": 14.6,
    "fat_percent_source": "label_nutrition"
  },
  {
    "raw": "Fiskfilé Sprödbakad Findus 360g",
    "class": "fish_mixed_white_fillet",
    "species": "white_fish_unknown",
    "cut": "fillet",
    "cut_form": "portion",
    "bone": "usually_boneless",
    "skin": "skinless_or_unknown",
    "preparation": ["breaded", "frozen"],
    "fat_percent": null,
    "fat_percent_band": "7-12",
    "fat_percent_source": "fallback_species_band"
  },
  {
    "raw": "Fiskverzlun Hafliða þorskbitar roð- og beinlausir",
    "class": "fish_cod_fillet",
    "species": "cod",
    "cut": "fillet",
    "cut_form": "pieces",
    "bone": "boneless",
    "skin": "skinless",
    "preparation": ["frozen"],
    "fat_percent": 0.1,
    "fat_percent_source": "label_nutrition"
  }
]
```

## Production caveats

- `fiskfilé/fiskefilet/fiskflök` is a weak species signal. Inspect ingredients
  before assigning cod/saithe/pollock; otherwise keep `fish_mixed_white_fillet`.
- `torskrygg`, `torskeloin`, and `þorskhnakkar` are loin/back cuts. They should
  match cod fillet equivalence for price comparison, but `cut=loin` should remain
  available as a premium/quality attribute.
- `lax/laks` without `filé/filet/flak` can mean whole fish, smoked slices,
  salad, or ready meal. Require a fillet/portion/cut clue before using this map.
- Icelandic `bitar` means pieces; it does not imply mince or processed fish.
- Breaded fish and fish fingers often contain cod, Alaska pollock, or mixed white
  fish with added oil. Preserve exact prepared fat values because they materially
  change nutrition-per-SEK scoring.
- Retailer APIs and search pages are store/date sensitive. Once ingestion has a
  captured product title and nutrition snapshot, prefer that fixture over live
  search output for tests.
