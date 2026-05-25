# Produce class: leafy greens

Purpose: define the fresh-produce leafy-greens equivalence class for SKU
normalization and chain-category matching. This class covers edible leaves sold
fresh, chilled, whole-head, loose, sleeved, cut, or bagged. It excludes frozen
vegetables, herbs sold primarily as seasoning, prepared salads with dressing or
protein, pasta fillings, pesto, juices, and flavour-only products whose names
contain spinach, kale, or salad terms.

## Class boundary

Accept a SKU as leafy greens when both conditions are true:

1. **Name evidence:** the title contains a strict lettuce, spinach, rocket,
   kale, chard, pak choi, or mixed-leaf term from the subclass table below.
2. **Produce context:** the chain category/path is fresh produce, preferably a
   salad or vegetable shelf. If the category is broad (`Frukt & Grönt`,
   `frukt-och-gront`, or Lidl public produce offers), require the SKU name to
   identify a leaf sold as the primary product.

Treat organic, hydroponic, washed/rinsed, baby-leaf, cut size, country, grade,
and pack weight as attributes. Do not split new subclasses for brand, colour,
pack size, `Klass 1`, local origin, or pre-washed claims.

## Chain category recognition

| Chain | Preferred positive category/path | Recognition notes |
| --- | --- | --- |
| ICA | `Frukt & Grönt`; ICA flyer and store pages may group leaf SKUs under broad produce | Broad ICA produce context is not enough. Require a strict title such as `Romansallad`, `Skurna sallader i påse`, `Bladspenat`, `Ruccola`, or `Grönkål`. Reject `potatissallad`, `salladsost`, and juice or pasta rows. |
| Coop | URL/category path under `frukt-gronsaker/gronsaker/sallad-groddar` or a store category labelled salad/vegetables | Coop product URLs can expose narrow salad shelves. Accept narrow salad/groddar URLs with a leaf title. For broad store results, require strict name evidence. |
| Willys | Category/source URL `willys.se/c/frukt-och-gront`; search/category results for fresh produce | Willys generated rows often leave `category` empty while the source URL is the produce shelf. Accept only when the title is a fresh leaf, for example `Ruccola Ekologisk Klass 1`, `Grönkål`, `Pak Choi Klass 1`, or `Romansallad Klass 1`. |
| Lidl | Public offer/category pages such as `veckans-frukt-groent`, `torsdag-soendag`, or other fresh produce offer pages | Lidl offer rows may not expose a narrow taxonomy. Accept when the product title is a fresh leaf (`Matriket Isbergssallad`, `Matriket Spenat`, `Pak Choi 2-pack`) and reject recipe/meal offers. |

## Subclasses

| Subclass | Belongs here | Exclude / split out | SKU-name recognition |
| --- | --- | --- | --- |
| `iceberg_lettuce` | Whole iceberg heads, loose or wrapped, including generic iceberg salad. | Prepared iceberg salad kits with dressing/protein; lettuce-flavoured non-produce rows. | `isbergssallad`, `isberg`, `iceberg lettuce`, `icebergsalat`, `icebergsallat`. |
| `romaine_cos_lettuce` | Romaine/cos heads, hearts, mini-romaine, little gem/hjärtsallad when sold as a lettuce head. | Mixed leaf bags where romaine is only one component; Caesar meal kits. | `romansallad`, `romansallat`, `romaine`, `cos`, `hjärtsallad`, `little gem`, `gem lettuce`. |
| `butterhead_leaf_lettuce` | Butterhead, head lettuce, lollo, oak leaf, frillice, salanova, batavia, endive/chicory salad heads when sold as lettuce. | Cooking endive/chicory roots outside fresh salad context; ornamental leaves. | `huvudsallad`, `kruksallad`, `sallat`, `plocksallad`, `ekblad`, `lollo`, `frillice`, `salanova`, `batavia`, `endive`. |
| `spinach_leaf` | Fresh baby spinach, leaf spinach, salad spinach, chilled spinach bags or bunches. | Frozen spinach, chopped spinach blocks, spinach pasta, spinach juice. | `bladspenat`, `babyspenat`, `spenat` with fresh produce category, `spinach`, `spinat`. |
| `arugula_rocket` | Fresh rocket/arugula leaves, including baby rocket and red/green rocket mixes where rocket is dominant. | Pesto with rocket, pizza/sandwich ingredients, mixed salad where rocket is not dominant. | `ruccola`, `rucola`, `rocket`, `arugula`, `rúkóla`. |
| `kale_leaf` | Fresh kale leaves, curly kale, black kale/cavolo nero, green kale bunches or bags. | Frozen chopped kale, kale pesto, kale chips, wok mixes where kale is only a component. | `grönkål`, `svartkål`, `cavolo nero`, `kale`, `grønnkål`, `grænkál`. |
| `chard_leaf` | Swiss chard, rainbow chard, mangold leaves sold for fresh cooking/salad. | Beetroot, beet leaves only when not marketed as chard; frozen chopped greens. | `mangold`, `bladbeta`, `swiss chard`, `regnbågsmangold`, `stilkmangold`. |
| `asian_leafy_greens` | Pak choi/bok choy, tatsoi, mizuna, mustard greens, komatsuna and similar fresh Asian brassica leaves. | Cabbage heads, broccoli, stir-fry bags where leaf type is not named. | `pak choi`, `pakchoy`, `bok choy`, `tatsoi`, `mizuna`, `senapsblad`, `komatsuna`. |
| `mixed_leaf_salad` | Fresh cut salad bags, small-leaf mixes, baby-leaf mixes, seasonal leaf mixes where no single subclass dominates. | Prepared meal salads with protein/dressing; potato salad, pasta salad, coleslaw. | `skurna sallader`, `salladsmix`, `småbladsmix`, `baby leaf`, `mixed leaves`, `salatmix`, `salatblanda`. |

## Locale alternate names

| Subclass | Swedish (`sv`) | Norwegian Bokmål (`nb`) | Icelandic (`is`) |
| --- | --- | --- | --- |
| `iceberg_lettuce` | isbergssallad, isbergssallat, isberg | isbergsalat, issalat | íssalat, iceberg salat |
| `romaine_cos_lettuce` | romansallad, romansallat, hjärtsallad, gemsallad | romanosalat, hjertesalat, little gem | romaine salat, hjartasalat |
| `butterhead_leaf_lettuce` | huvudsallad, kruksallad, plocksallad, ekbladssallad, lollo rosso, frillice, salanova, batavia, endive | hodesalat, hjertesalat where generic, lollo, frillice, salanova, batavia, endivie | höfuðsalat, salat, lollo, endívia |
| `spinach_leaf` | bladspenat, babyspenat, spenat | bladspinat, babyspinat, spinat | spínat, baby spínat |
| `arugula_rocket` | ruccola, rucola, senapskål | ruccola, rucola, rucculasalat | klettasalat, rúkkóla, rucola |
| `kale_leaf` | grönkål, svartkål, cavolo nero | grønnkål, svartkål, cavolo nero | grænkál, svartkál |
| `chard_leaf` | mangold, bladbeta, regnbågsmangold | mangold, bladbete | stilkbeðja, mangold |
| `asian_leafy_greens` | pak choi, bok choy, tatsoi, mizuna, senapsblad | pak choi, bok choy, tatsoi, mizuna, sennepsblad | pak choi, bok choy, tatsoi, mizuna |
| `mixed_leaf_salad` | skurna sallader, salladsmix, småbladsmix, baby leaf | salatmix, småbladsmix, blandet salat | salatblanda, blandað salat, baby leaf |

## Real SKU examples

These examples were checked against public chain pages, generated public
ingestion snapshots, or public retailer offer pages on 2026-05-25. They are
classifier fixtures and source-evidence examples, not price guarantees.

| Chain | Example SKU | Evidence URL | Classification note |
| --- | --- | --- | --- |
| ICA | `Romansallad` | `https://www.ica.se/erbjudanden/maxi-ica-stormarknad-hyllinge-1003937/` | ICA flyer row, `Frukt & Grönt`, `st`; classify as `romaine_cos_lettuce`. |
| ICA | `Skurna sallader i påse` | `https://www.ica.se/erbjudanden/ica-focus-1004247/` | ICA flyer row, 125-225 g fresh bagged salad; classify as `mixed_leaf_salad` unless captured EAN resolves to a dominant leaf. |
| ICA | `Bladspenat 400 g ICA` | `https://www.matspar.se/produkt/bladspenat-400-g-ica` | Public Matspar row for ICA frozen spinach; use as negative evidence for `spinach_leaf` because category/query is vegetables but package is frozen. |
| ICA | `Grönkål 450 g ICA` | `https://www.matspar.se/produkt/gronkal-450g-ica` | Public Matspar row for ICA frozen kale; negative for fresh `kale_leaf`, useful for frozen exclusion fixtures. |
| ICA | `Ruccola ICA` | `https://world.openfoodfacts.org/product/7318690058373/ruccola-ica` | Public product identity example for the `arugula_rocket` title token; require fresh produce category in production before accepting. |
| Coop | `Ruccola` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/sallad-groddar/` | Coop salad/groddar shelf title; classify as `arugula_rocket`. |
| Coop | `Babyspenat` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/sallad-groddar/` | Coop salad/groddar shelf title; classify as `spinach_leaf`. |
| Coop | `Romansallad` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/sallad-groddar/` | Coop salad/groddar shelf title; classify as `romaine_cos_lettuce`. |
| Coop | `Isbergssallad` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/sallad-groddar/` | Coop salad/groddar shelf title; classify as `iceberg_lettuce`. |
| Coop | `Grönkål` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/sallad-groddar/` | Coop salad/groddar or vegetable shelf title; classify as `kale_leaf` when fresh and not pesto/chips. |
| Willys | `Ruccola Ekologisk Klass 1` (`101232114_ST`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Willys fresh produce source URL plus strict title; classify as `arugula_rocket`. |
| Willys | `Grönkål` (`101234978_ST`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Fresh bagged Garant kale, 200 g; classify as `kale_leaf`. |
| Willys | `Pak Choi Klass 1` (`101238614_ST`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Fresh 250 g pak choi row; classify as `asian_leafy_greens`. |
| Willys | `Romansallad Klass 1` (`101771311_ST`) | `https://www.willys.se/c/frukt-och-gront?page=1&size=100` | Fresh 200 g romaine row; classify as `romaine_cos_lettuce`. |
| Willys | `Småbladsmix Ruccola Röd/grön Klass 1` (`101281472_ST`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Mixed small-leaf bag where rocket is named but not necessarily dominant; classify as `mixed_leaf_salad` unless component percentages prove rocket dominance. |
| Lidl | `Matriket Isbergssallad` (`11214516`) | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Lidl public produce offer, loose/kg iceberg; classify as `iceberg_lettuce`. |
| Lidl | `Matriket Spenat` (`66000112`) | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Lidl public produce offer, 500 g spinach; classify as `spinach_leaf` when sold fresh, frozen if freezer metadata appears. |
| Lidl | `Pak Choi 2-pack` (`66000123`) | `https://www.lidl.se/c/torsdag-soendag/a10094784` | Lidl public produce offer; classify as `asian_leafy_greens`. |
| Lidl | `Matriket Isbergssallad` (`11214516`) | `https://www.lidl.se/c/lidl-plus-erbjudanden/a10094788` | Same title appearing through a Lidl Plus produce offer; stable `iceberg_lettuce` fixture across offer surfaces. |
| Lidl | `Matriket Spenat` (`66000112`) | `https://www.lidl.se/c/torsdag-soendag/a10094784` | Same spinach title on another public offer surface; validates source URL does not change subclass. |

## Negative examples and guardrails

- `Potatissallad`, `räksallad`, `skagenröra`, `salladsost`, and pasta salad are
  prepared deli/dairy products, not leafy greens.
- `Tortellini Ricotta & spenat`, `Ravioli Ricotta Spenat`, `Lasagneplattor
  Spenat`, and `Råsaft Spenat & Apelsin` are flavour/ingredient rows, not fresh
  spinach leaves.
- `Grönkålspesto`, kale chips, frozen chopped kale, frozen chopped spinach, and
  wok mixes are processed or frozen rows. They can preserve a `leaf_term`
  attribute but must not enter the fresh leafy-greens class.
- Broad chain categories such as `Frukt & Grönt` or `lidl-public-offers` are
  weak positive evidence. They must be paired with strict leaf terms.
- A title containing only `sallad` is ambiguous. Accept it only when the chain
  category is fresh salad and no processed-word exclusion is present.

## Parser attribute guidance

Emit these attributes independently from the subclass:

| Attribute | Values / examples |
| --- | --- |
| `leaf_form` | `whole_head`, `heart`, `loose_leaf`, `cut_leaf`, `baby_leaf`, `mixed_bag`, `bunch`, `unknown` |
| `wash_state` | `washed`, `ready_to_eat`, `unwashed`, `unknown` |
| `production_method` | `organic`, `hydroponic`, `field_grown`, `greenhouse`, `unknown` |
| `packaging` | `loose`, `sleeve`, `bag`, `tray`, `2-pack`, `kg`, `st` |
| `grade` | `klass_1`, `klass_2`, `unknown` |
| `freshness_state` | `fresh`, `frozen`, `prepared`, `unknown` |

Expected parse examples:

```json
[
  {
    "raw": "Ruccola Ekologisk Klass 1",
    "class": "leafy_greens",
    "subclass": "arugula_rocket",
    "leaf_form": "loose_leaf",
    "production_method": "organic",
    "grade": "klass_1",
    "freshness_state": "fresh"
  },
  {
    "raw": "Småbladsmix Ruccola Röd/grön Klass 1",
    "class": "leafy_greens",
    "subclass": "mixed_leaf_salad",
    "leaf_form": "mixed_bag",
    "grade": "klass_1",
    "freshness_state": "fresh"
  },
  {
    "raw": "Tortellini Ricotta & spenat",
    "class": null,
    "excluded_reason": "processed_pasta_with_leaf_ingredient"
  }
]
```

## Implementation checklist for matchers

1. Normalize case and common punctuation, but keep original accents and raw SKU
   text in audit output.
2. Apply processed/frozen exclusions before accepting generic `sallad` or
   `spenat` tokens.
3. Match specific subclasses before generic salad:
   `romaine_cos_lettuce`, `iceberg_lettuce`, `arugula_rocket`,
   `spinach_leaf`, `kale_leaf`, `chard_leaf`, `asian_leafy_greens`, then
   `mixed_leaf_salad`.
4. Use category/path evidence as a confidence modifier. Narrow salad shelves
   can accept broader title variants; broad produce shelves need strict title
   tokens.
5. Store component names from mixed bags as attributes. Do not classify a mixed
   bag as rocket, spinach, or kale unless the title or ingredient data makes one
   leaf dominant.
