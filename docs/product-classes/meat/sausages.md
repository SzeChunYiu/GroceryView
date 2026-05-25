# Sausages product-class map

Status: operator reference for GroceryView product-class matching.  
Ticket: factory-tickets #1717.  
Last evidence pass: 2026-05-25.

This document defines canonical sausage classes used when normalising Nordic
fresh, chilled, frozen, and cured sausage SKUs. It covers Swedish, Norwegian,
Icelandic, and English nomenclature plus parser attributes for fat percent, cut
or meat base, and preparation.

## Normalisation rules

1. Prefer the explicit sausage style over marketing words: `grillkorv`,
   `wienerkorv`, `falukorv`, `chorizo`, and `salami` are distinct styles.
2. Keep `meat_base`, `fat_percent`, `preparation`, and `casing` separate. Do
   not create new classes for organic, halal, lactose-free, gluten-free, smoked,
   or brand claims.
3. Parse fat percent only when the title, product-line text, or nutrition label
   explicitly carries a percent. Otherwise use the fallback band for the style
   and set `fat_percent_source=fallback_style_band`.
4. `kycklingkorv`, `kalkunkorv`, `vegetarisk korv`, `pylsa með kjúklingi`, and
   `vegetarpølse` change `meat_base`; they do not change the sausage-style
   parser unless the style is also named.
5. `skivad`, `sliced`, `strimlad`, `tärnad`, `ring`, and `hel` are preparation or
   pack-format attributes, not separate classes.

## Canonical classes and local nomenclature

| Canonical class | Swedish labels | Norwegian labels | Icelandic labels | English labels | Core attributes |
| --- | --- | --- | --- | --- | --- |
| `sausage_grill_hotdog` | grillkorv, varmkorv, hot dog, korv med bröd | grillpølse, wienerpølse, pølse, hot dog | grillpylsa, pylsa, hot dog pylsa | hot dog sausage, grill sausage | `meat_base=declared_or_mixed`, `preparation=ready_to_heat`, `casing=thin_or_skinless` |
| `sausage_falukorv_ring` | falukorv, ringkorv | falukorv, kjøttpølse ring | falukorv, bjúga-style ring where labelled | falukorv, ring bologna-style sausage | `meat_base=mixed_pork_beef_or_declared`, `preparation=ring_or_sliced` |
| `sausage_prins_wiener` | prinskorv, wienerkorv, cocktailkorv | wienerpølse, cocktailpølse, julepølse where small smoked link | vínarpylsa, kokteilpylsa | wiener sausage, cocktail sausage | `preparation=small_link_or_wiener`, `casing=thin` |
| `sausage_fresh_raw` | färskkorv, råkorv, salsiccia, bratwurst rå | rå pølse, fersk pølse, salsiccia, bratwurst | fersk pylsa, hrá pylsa, salsiccia | fresh sausage, raw sausage | `preparation=raw_fresh`, `cook_required=true` |
| `sausage_spicy_chorizo` | chorizo, kryddkorv, kabanoss where spicy smoked | chorizo, krydderpølse, kabanos | chorizo, kryddpylsa | chorizo, spicy sausage | `seasoning=paprika_chili_or_declared`, `preparation=smoked_or_fresh_from_label` |
| `sausage_breakfast_thin` | frukostkorv, isterband where Swedish fermented/smoked | frokostpølse, medisterpølse | morgunpylsa, medister-style where labelled | breakfast sausage, medister sausage | `preparation=thin_link_or_fermented_from_label` |
| `sausage_deli_salami` | salami, ölkorv, medvurst | salami, spekepølse, fårepølse | salami, pepperoni, hangikjöt pylsa where labelled | salami, cured sausage | `preparation=cured_dry_or_sliced`, `cook_required=false` |
| `sausage_meat_free` | vegokorv, vegetarisk korv, vegansk korv | vegetarpølse, vegansk pølse | vegan pylsa, grænmetispylsa | vegetarian/vegan sausage | `meat_base=plant_based`, `preparation=ready_to_heat_or_fresh` |

## Fat-percent, meat-base, cut, and preparation attributes

| Canonical class | Typical labelled/fallback fat band | Meat/cut guidance | Common preparations |
| --- | --- | --- | --- |
| `sausage_grill_hotdog` | fallback 12-25% | Usually pork/beef/chicken mix unless title says `kyckling`, `kalkun`, `nöt`, `lam`, or `vegetarisk`. | `ready_to_heat`, `skinless`, `thin_link`, `smoked`, `frozen` |
| `sausage_falukorv_ring` | fallback 15-25%; exact percent only if labelled | Mixed pork/beef; preserve `kycklingfalukorv` or `vegetarisk falukorv` as `meat_base`. | `ring`, `sliced`, `whole`, `smoked` |
| `sausage_prins_wiener` | fallback 15-28% | Pork/beef/chicken by label. `prinskorv` and cocktail variants are small-format links. | `small_link`, `wiener`, `holiday`, `ready_to_heat` |
| `sausage_fresh_raw` | fallback 15-30% | Parse named meat: `fläsk`, `nöt`, `lamm`, `kyckling`. Keep `salsiccia` as style/seasoning, not country. | `raw_fresh`, `cook_required`, `coarse_ground`, `grill` |
| `sausage_spicy_chorizo` | fallback 18-32% | Pork is common but use declared base. Preserve `kycklingchorizo`, `vegansk chorizo`, and `lammchorizo`. | `spicy`, `smoked`, `fresh`, `grill` |
| `sausage_breakfast_thin` | fallback 12-28% | `isterband` is fermented/smoked Swedish link; `medister` is a separate Nordic-style fresh/coarse sausage. | `thin_link`, `fermented`, `smoked`, `fresh` |
| `sausage_deli_salami` | fallback 20-40% | Preserve animal base if named; dry-cured product may be sliced or whole snack-stick. | `cured`, `dry`, `sliced`, `snack_stick` |
| `sausage_meat_free` | labelled fat varies; fallback 3-15% | `meat_base=plant_based`; parse pea/soy/fava/oat only as ingredient-base attribute when explicit. | `ready_to_heat`, `grill`, `fresh`, `frozen` |

## SKU evidence by chain

At least five examples are listed per reference chain. Source notes point to
retailer product/search/category pages whose live content can vary by store and
date; ingestion snapshots should be preferred for exact test fixtures.

| Country | Chain | Five SKU/title examples | Source notes |
| --- | --- | --- | --- |
| Sweden | ICA | `Falukorv ICA`; `Grillkorv ICA`; `Prinskorv`; `Chorizo`; `Salsiccia färskkorv` | ICA product/search pages under `handla.ica.se` and recipe/product pages on `ica.se` expose `falukorv`, `grillkorv`, `prinskorv`, `chorizo`, and `salsiccia` labels. |
| Sweden | Willys | `Falukorv`; `Grillkorv`; `Hot Dogs`; `Prinskorv`; `Salami skivad` | Willys search/product pages on `willys.se` use Swedish sausage labels and chilled deli labels including `falukorv`, `grillkorv`, `hot dogs`, `prinskorv`, and `salami`. |
| Sweden | Coop | `Falukorv`; `Grillkorv`; `Wienerkorv`; `Isterband`; `Vegokorv` | Coop assortment and offer pages on `coop.se` expose ring, grill/hot-dog, wiener, fermented link, and vegetarian sausage terminology. |
| Norway | MENY | `Grillpølse`; `Wienerpølse`; `Kjøttpølse`; `Chorizo`; `Spekepølse` | MENY category/search pages for pølser and spekemat use Norwegian labels for grill, wiener, meat sausage, spicy sausage, and cured sausage. |
| Norway | REMA 1000 | `Grillpølser`; `Wienerpølser`; `Kjøttpølse`; `Vegetarpølse`; `Salami` | REMA product/category pages expose plural Norwegian pack labels and meat-free/cured variants. |
| Norway | KIWI | `Grillpølser`; `Wienerpølser`; `Kjøttpølse`; `Frokostpølse`; `Chorizo` | KIWI product guides, recipes, and campaign pages use `pølse` labels for grill, wiener, meat, breakfast, and spicy styles. |
| Iceland | Krónan | `SS pylsur`; `Grillpylsur`; `Vínarpylsur`; `Chorizo pylsur`; `Salami sneiðar` | Krónan product pages under `kronan.is/vara/...` use Icelandic `pylsur` labels plus imported style terms such as `chorizo` and `salami`. |
| Iceland | Bónus | `Pylsur`; `Grillpylsur`; `Vínarpylsur`; `Kjúklingapylsur`; `Pepperoni` | Bónus assortment/flyer pages use `pylsur` for hot-dog/grill links and deli-style cured sausage labels such as pepperoni. |

## Fixture recommendations

For automated classifier tests, include one fixture per major class and language:

- Swedish: `Falukorv 800g`, `Grillkorv`, `Varmkorv`, `Prinskorv`,
  `Wienerkorv`, `Färsk Salsiccia`, `Chorizo`, `Isterband`, `Salami skivad`,
  `Vegansk grillkorv`.
- Norwegian: `Grillpølser`, `Wienerpølser`, `Kjøttpølse`, `Frokostpølse`,
  `Rå chorizo`, `Spekepølse`, `Vegetarpølse`, `Medisterpølse`.
- Icelandic: `SS pylsur`, `Grillpylsur`, `Vínarpylsur`, `Kjúklingapylsur`,
  `Chorizo pylsur`, `Salami sneiðar`, `Vegan pylsa`.

Expected core parse examples:

```json
[
  {
    "raw": "Falukorv 800g",
    "class": "sausage_falukorv_ring",
    "meat_base": "mixed_pork_beef_or_declared",
    "preparation": ["ring", "smoked"],
    "fat_percent": null,
    "fat_percent_band": "15-25",
    "fat_percent_source": "fallback_style_band"
  },
  {
    "raw": "Grillpølser av kylling 10% fett",
    "class": "sausage_grill_hotdog",
    "meat_base": "chicken",
    "preparation": ["ready_to_heat", "thin_link"],
    "fat_percent": 10,
    "fat_percent_source": "title"
  },
  {
    "raw": "Vegansk chorizo",
    "class": "sausage_spicy_chorizo",
    "meat_base": "plant_based",
    "seasoning": "paprika_chili_or_declared",
    "preparation": ["spicy"],
    "fat_percent": null,
    "fat_percent_band": "3-15",
    "fat_percent_source": "fallback_style_band"
  }
]
```

## Production caveats

- `korv`, `pølse`, and `pylsa` alone are generic. Use product category, pack
  format, and style tokens before assigning a specific class.
- `hot dog` may describe a prepared meal kit or bread pack. Require sausage
  category context or a meat/plant sausage product line before mapping to
  `sausage_grill_hotdog`.
- `chorizo` can be fresh/raw or smoked/ready-to-eat. Set `cook_required=true`
  only when `färsk`, `rå`, `fersk`, or equivalent appears.
- `salami`, `pepperoni`, `ölkorv`, and `spekepølse` are cured/deli sausages;
  they should not be grouped with grill sausages even when sold in the meat
  department.
- `isterband` is fermented/smoked and region-specific; keep it separate from
  generic breakfast sausage where downstream nutrition comparisons need style
  precision.
