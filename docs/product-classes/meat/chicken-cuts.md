# Chicken cuts product-class map

Status: operator reference for GroceryView product-class matching.  
Ticket: factory-tickets #1712.  
Last evidence pass: 2026-05-24.

This document defines the canonical chicken-cut classes used when normalising
Nordic grocery SKUs.  It covers the Swedish, Norwegian, Icelandic, and English
nomenclature, the parser attributes to emit, and chain-level SKU examples that
show how the same cut appears across retailers.

## Normalisation rules

1. Prefer the explicit cut in the product title over package form.  For example,
   `strimlad kycklinglårfilé` is still `chicken_thigh_fillet` with
   `preparation=strips`.
2. Keep `cut`, `bone`, `skin`, `preparation`, and `fat_percent` separate.  Do
   not split a new class for every marinade, spice, pack size, or fresh/frozen
   state.
3. Use labelled nutrition or meat-content values when a SKU supplies them.  If a
   SKU does not expose a fat number, use the fallback fat band in this document
   and set `fat_percent_source=fallback_cut_band`.
4. Treat cooked/rotisserie/breaded products as the same anatomical cut plus a
   preparation value (`cooked`, `rotisserie`, `breaded`, `marinated`, etc.).
5. Keep country spelling variants in aliases; do not translate them before
   matching.  The raw phrase is useful evidence for language and chain-specific
   search behaviour.

## Canonical classes and local nomenclature

| Canonical class | Swedish labels | Norwegian labels | Icelandic labels | English labels | Cut attributes |
| --- | --- | --- | --- | --- | --- |
| `chicken_breast_fillet` | kycklingfilé, kycklingbröstfilé, bröstfilé | kyllingfilet, kyllingbryst, brystfilet | kjúklingabringur, kjúklingabringa | chicken breast fillet, breast | `cut=breast`, `bone=boneless`, `skin=usually_skinless` |
| `chicken_inner_fillet` | kycklinginnerfilé, innerfilé | indrefilet av kylling, kylling indrefilet | kjúklingalundir, kjúklingainnlæri/tenderloin where used by chain | chicken tenderloin, inner fillet | `cut=tenderloin`, `bone=boneless`, `skin=skinless` |
| `chicken_thigh_fillet` | kycklinglårfilé, lårfilé | kyllinglårfilet, lårfilet | úrbeinuð kjúklingalæri, kjúklingalæri beinlaus | chicken thigh fillet, boneless thigh | `cut=thigh`, `bone=boneless`, `skin=usually_skinless` |
| `chicken_thigh_bone_in` | kycklinglår, kycklingben, kycklingklubba | kyllinglår, kyllingklubber, kylling overlår | kjúklingalæri, kjúklingaleggir | chicken thigh, leg, drumstick, leg quarter | `cut=thigh_or_leg`, `bone=bone_in`, `skin=usually_skin_on` |
| `chicken_wings` | kycklingvingar, vingar, buffalo wings | kyllingvinger, buffalo wings | kjúklingavængir, vængir | chicken wings | `cut=wing`, `bone=bone_in`, `skin=skin_on` |
| `chicken_mince` | kycklingfärs | kyllingkjøttdeig | kjúklingahakk, kjúklingafars | chicken mince, ground chicken | `cut=ground_mixed`, `bone=boneless`, `skin=mixed_or_unknown` |
| `whole_chicken` | hel kyckling, grillkyckling | hel kylling, grillet kylling | heill kjúklingur, grillaður kjúklingur | whole chicken, roast chicken | `cut=whole_bird`, `bone=bone_in`, `skin=skin_on` |
| `chicken_pieces_mixed` | kycklingdelar, kycklingmix | kyllingbiter, kyllingstykker | kjúklingabitar | mixed chicken pieces | `cut=mixed`, `bone=mixed_or_unknown`, `skin=mixed_or_unknown` |

## Fat-percent and preparation attributes

Emit `fat_percent` as a decimal number when the chain or package gives a value.
Otherwise assign the band below to `fat_percent_band` and keep the exact field
null.

| Canonical class | Typical labelled/fallback fat band | Parser value guidance | Common preparations |
| --- | --- | --- | --- |
| `chicken_breast_fillet` | 1-3% fat | Use exact value from nutrition; examples include ICA Basic delad filé at 1.7% and Krónan Matfugl/Ódýrt breast at 1%. | `raw`, `fresh`, `frozen`, `strips`, `diced`, `marinated`, `grilled`, `breaded` |
| `chicken_inner_fillet` | 1.5-3% fat | Use breast/tenderloin band unless labelled; ICA inner fillet shows 2%. | `raw`, `frozen`, `strips`, `breaded` |
| `chicken_thigh_fillet` | 5-10% fat; premium/free-range can be higher | Use exact values when labelled; Swedish examples range from 5.8% to 8.5%, with some organic/free-range labels higher. | `raw`, `fresh`, `frozen`, `strips`, `marinated`, `grilled` |
| `chicken_thigh_bone_in` | 8-14% fat | If a title says `drumstick`, `leg`, or `klubba`, keep `bone=bone_in`.  Use nutrition for exact fat when present. | `raw`, `fresh`, `frozen`, `rotisserie`, `grilled`, `marinated` |
| `chicken_wings` | 8-20% fat | Wings are skin-on unless stated otherwise; prepared wings can be much higher because of breading/sauce.  Krónan prepared wings examples show 8.5-19%. | `raw`, `frozen`, `marinated`, `breaded`, `buffalo`, `rotisserie` |
| `chicken_mince` | labelled 5%, 10%, 12%, or fallback 5-12% | Prefer any title number (`5%`, `10%`) before nutrition.  If absent, use `fat_percent_band=5-12`. | `raw`, `fresh`, `frozen`, `seasoned`, `formed` |
| `whole_chicken` | 6-12% fat | Whole birds are `skin=skin_on`; cooked rotisserie keeps `cut=whole_bird` plus `preparation=rotisserie`. | `raw`, `fresh`, `frozen`, `rotisserie`, `grilled` |
| `chicken_pieces_mixed` | 5-15% fat | Use mixed band until the package identifies breast-only, thigh-only, or wing-only pieces. | `raw`, `frozen`, `marinated`, `breaded`, `diced` |

## SKU evidence by chain

The rows below give at least five SKU/title examples for each reference chain
covered by this pass: Sweden (ICA, Willys, Coop), Norway (MENY, REMA 1000,
KIWI), and Iceland (Krónan).  Use these as seed examples for tests, parser
fixtures, and manual QA.  Source URLs point to retailer product, category,
recipe, or current search pages that expose the nomenclature; live assortment
and store-specific availability may change.

| Country | Chain | Five SKU/title examples | Source notes |
| --- | --- | --- | --- |
| Sweden | ICA | `Kycklingfilé Delad 700g ICA Basic`; `Kycklinginnerfilé 700g ICA`; `Kycklinglårfilé Färsk ca 925g Kronfågel`; `Kycklingklubba 2kg ICA Basic`; `Kycklinglårfilé strimlad vitlök chili ca 600g Kronfågel` | ICA product pages: [delad kycklingfilé](https://handla.ica.se/produkt/2065183), [innerfilé](https://handla.ica.se/produkt/2128655), [lårfilé](https://handla.ica.se/produkt/1278005), [klubba](https://handla.ica.se/produkt/2038612), [strimlad lårfilé](https://handla.ica.se/produkt/2085095). |
| Sweden | Willys | `Kyckling Bröstfilé Sverige`; `Kyckling Filé Fryst`; `Innerfilé av Svensk Kyckling Fryst`; `Kycklingfärs 400g`; `Majskycklingbröstfilé` | Willys product/search evidence: [bröstfilé](https://www.willys.se/produkt/Kyckling-Brostfile-Sverige-101223961_ST), [fryst filé](https://www.willys.se/produkt/Kyckling-File-Fryst-101266948_ST), [innerfilé](https://www.willys.se/produkt/Innerfile-av-Svensk-Kyckling-Fryst-101222356_ST), plus Willys recipe/search pages containing `kycklingfärs` and `majskycklingbröstfilé` ([vardagsrätter](https://www.willys.se/artikel/vardagsratter)). |
| Sweden | Coop | `Coop Sprättkyckling kycklingfilé 600g`; `Coop Sprättkyckling kycklinglårfilé 600g`; `Coop Sprättkyckling hel kyckling 1800g`; `Coop Sprättkyckling kycklingben 700g`; `Coop Sprättkyckling kycklingvingar 700g` | Coop press/product assortment evidence lists five Sprättkyckling variants: [Coop press PDF](https://pressrum.coop.se/wp-content/uploads/2011/04/WOLReleaseFile.aspxid2089394ampfnwkr0006.pdf). Recent flyer pages also use `färsk kycklingfilé`, `bröstfilé`, `lårfilé`, and `innerfilé`: [Stora Coop Varberg flyer](https://dr.coop.se/Butik/Stora-Coop-Varberg?c=2026-17). |
| Norway | MENY | `Kyllingfilet`; `Kyllingbryst`; `Kyllinglår`; `Kyllingvinger`; `Kyllingkjøttdeig` | MENY category and product evidence: [kyllingfilet](https://meny.no/varer/kylling-og-fjaerkre/kylling/kyllingfilet), [kyllinglår category](https://meny.no/varer/kjott/kylling/kyllinglar/), [kyllingvinger product](https://meny.no/varer/kylling-og-fjaerkre/kylling/kyllingvinger/kyllingvinger-7090013751764/), [kyllingkjøttdeig category](https://meny.no/varer/kjott/kjottdeig-og-farse/kyllingkjottdeig/), and MENY's fresh-chicken guide mentioning breast, thigh, whole, and fillet ([fersk kylling](https://meny.no/varer/tema/fersk-kylling/)). |
| Norway | REMA 1000 | `Kyllingfilet`; `Strimlet kyllingfilet`; `Kyllinglår`; `Kyllinglårfilet`; `Kyllingkjøttdeig 400g` | REMA recipe/category evidence: [kyllingfilet](https://www.rema.no/oppskrifter/kylling-og-hons/kyllingfilet/), [strimlet kyllingfilet](https://www.rema.no/oppskrifter/kylling-og-hons/kyllingfilet/gyros-med-kylling/), [kyllinglår](https://www.rema.no/oppskrifter/kylling-og-hons/kyllinglar/), [kyllinglårfilet](https://www.rema.no/oppskrifter/kylling-og-hons/kyllinglar/grillet-kyllinglarfilet-med-yoghurt/), and [kyllingkjøttdeig](https://www.rema.no/oppskrift/burrito-med-kyllingkjottdeig/). |
| Norway | KIWI | `Kyllingfilet`; `Kyllinglår`; `Kyllinglårfilet`; `Kyllingkjøttdeig`; `Kyllingburger av kyllingkjøttdeig` | KIWI evidence: [steakeguide for kyllingfilet/lår](https://kiwi.no/middag/slik-steker-du-kyllingfilet), [lårfilet with urtepesto](https://kiwi.no/oppskrifter/fugl/kylling/Kyllinglarfilet-med-urtepesto/), [kyllingboller with kyllingkjøttdeig](https://kiwi.no/oppskrifter/fugl/kylling/Kyllingboller/), [kyllingkjøttdeig på spyd](https://kiwi.no/oppskrifter/kjottdeig/kyllingkjottdeig-pa-spyd-med-couscous-og-appelsinromme), and [kyllingburger](https://kiwi.no/oppskrifter/burger/saftig-kyllingburger-med-kyllingkjottdeig---2-store-eller-4-sma). |
| Iceland | Krónan | `Matfugl kjúklingabringur`; `Ódýrt kjúklingabringur`; `Saffran Piri Piri Kjúklingur` (úrbeinuð/skinnlaus læri); `Tokyo Sushi kóreskir kjúklingavængir`; `Rotisserie 6 stk. Sterkir kjúklingavængir` | Krónan product pages: [Matfugl bringur](https://kronan.is/vara/100181650-matfugl-kjuklingabringur), [Ódýrt bringur](https://kronan.is/vara/100244878-odyrt-kjuklingabringur), [Saffran Piri Piri thigh meat](https://kronan.is/vara/100250869-saffran-piri-piri-kjuklingur), [Tokyo Sushi wings](https://kronan.is/vara/100267330-tokyo-sushi-koreskir-kjuklingavaengir), [Rotisserie wings](https://kronan.is/vara/100233342-rotisserie-6-stk-sterkir-kjuklingavaengir). |

Non-fixture Icelandic chain note: Bónus and Nettó public grocery SKU pages were
not reliably crawlable in this pass, so they are intentionally not listed as
chain-level fixture rows.  For those integrations, keep the Icelandic aliases
above (`kjúklingabringur`, `kjúklingalæri`, `kjúklingavængir`, `kjúklingahakk`,
`heill kjúklingur`) as search terms and promote only app/export-captured SKU
titles into tests.  Bónus public PDFs still show prepared `kjúklingur` usage,
for example [Bónus núðlur með kjúkling](https://bonus.is/wp-content/uploads/2021/02/6886-BONUS-Nudlur-med-kjukling.pdf);
Heimkaup recipe pages also cross-check the `kjúklingabringur` wording
([example](https://www.heimkaup.is/uppskriftir/taco-kjuklingasalat)).

## Fixture recommendations

For automated classifier tests, include one fixture per class and language:

- Swedish: `Kycklingfilé Delad`, `Kycklinginnerfilé`, `Kycklinglårfilé`,
  `Kycklingklubba`, `Kycklingvingar`, `Kycklingfärs`, `Hel kyckling`.
- Norwegian: `Kyllingfilet`, `Kyllingbryst`, `Kyllinglårfilet`, `Kyllinglår`,
  `Kyllingvinger`, `Kyllingkjøttdeig`, `Hel kylling`.
- Icelandic: `Kjúklingabringur`, `Kjúklingalundir`, `Kjúklingalæri`,
  `Kjúklingavængir`, `Kjúklingahakk`, `Heill kjúklingur`.

Expected core parse examples:

```json
[
  {
    "raw": "Kycklinglårfilé Färsk ca 925g Kronfågel",
    "class": "chicken_thigh_fillet",
    "cut": "thigh",
    "bone": "boneless",
    "skin": "usually_skinless",
    "preparation": ["raw", "fresh"],
    "fat_percent": 8.5,
    "fat_percent_source": "label_nutrition"
  },
  {
    "raw": "Rotisserie 6 stk. Sterkir kjúklingavængir",
    "class": "chicken_wings",
    "cut": "wing",
    "bone": "bone_in",
    "skin": "skin_on",
    "preparation": ["rotisserie", "spicy"],
    "fat_percent": 8.5,
    "fat_percent_source": "label_nutrition"
  },
  {
    "raw": "Kyllingkjøttdeig 400 g",
    "class": "chicken_mince",
    "cut": "ground_mixed",
    "bone": "boneless",
    "skin": "mixed_or_unknown",
    "preparation": ["raw"],
    "fat_percent": null,
    "fat_percent_band": "5-12",
    "fat_percent_source": "fallback_cut_band"
  }
]
```

## Production caveats

- `kycklingben` can mean drumstick/leg in Swedish retail titles, while `benfri`
  means boneless.  Token order matters: `benfri kycklinglårfilé` must not be
  classified as bone-in.
- Icelandic `læri` can cover thigh/leg.  If `úrbeinuð` or `beinlaus` appears,
  classify as thigh fillet; otherwise keep bone-in until the SKU metadata says
  otherwise.
- `buffalo wings`, `piri piri`, `BBQ`, `taco`, `kebab`, and `schnitzel` are
  preparation/flavour modifiers, not separate cuts.
- Product evidence in retailer sites can change with store and date.  Use the
  title and nutrition snapshots captured by ingestion as the authoritative test
  fixture when available.
