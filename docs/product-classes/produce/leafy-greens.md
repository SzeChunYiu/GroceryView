# Leafy greens product-class map

Status: operator reference for GroceryView product-class matching.  
Ticket: factory-tickets #1705.  
Last evidence pass: 2026-05-25.

This document defines the leafy-green classes used when normalising Nordic fresh
produce SKUs.  It covers whole heads, living potted lettuces, washed salad bags,
and single-leaf bags such as baby spinach and ruccola.  Exclude herbs, spring
onion, cabbage sold as cooking cabbage, prepared deli salads, and frozen or
creamed spinach unless a classifier explicitly handles processed produce.

## Normalisation rules

1. Prefer the botanical/retail variety in the SKU title over package form.  For
   example, `Romansallat i påse 200g` is still `romaine_lettuce`, with
   `format=bagged_whole_or_cut`.
2. Keep `variety`, `format`, `washed_ready_to_eat`, `organic`, `class_grade`, and
   `origin` as attributes.  Do not split classes by pack size, country, brand,
   campaign name, or `eko/KRAV` status.
3. Treat `sallad`, `sallat`, `salat`, and `salatblanding` as weak tokens.  They
   need a stronger variety token or category path before assigning a precise
   class.
4. Use chain category as tie-break evidence when the title is generic.  A SKU
   called `Sallad i påse` under a `babyspenat/rucola/säsongsmix` choice set
   should be `mixed_baby_leaf_salad` unless the option name gives one leaf.
5. Separate leafy greens from garnish herbs.  `basilika`, `koriander`, `dill`,
   `persilja`, and `gräslök` are herbs, not leafy-greens fixtures.

## Canonical subclasses and recognition cues

| Canonical class | Include | Exclude / split away | SKU title and category cues | Parser attributes |
| --- | --- | --- | --- | --- |
| `baby_spinach` | Fresh baby spinach leaves, washed small spinach leaves, single-leaf spinach bags. | Frozen spinach, creamed/stewed spinach, spinach in pies/ready meals. | `babyspenat`, `spenat småblad`, `spinat`, `babyspinat`, `spínat`; category `sallad/groddar`, `bladgrönt`. | `variety=spinach`, `leaf_stage=baby`, `format=bagged_leaf`, usually `washed_ready_to_eat=true`. |
| `rocket_arugula` | Ruccola/rucola/arugula/rocket salad leaves sold alone. | Pizza/recipe mentions only, mixed bags where ruccola is not the leading option. | `ruccola`, `rucola`, `arugula`, `rocket`, `rúkóla`; category `sallad`, `bladgrönt`. | `variety=rocket`, `format=bagged_leaf`, `peppery_leaf=true`. |
| `romaine_lettuce` | Romaine/cos lettuce heads, hearts, mini-romaine, romaine in bags. | Generic hearts where chain category says butterhead or little gem only; Caesar salad kits with dressing/croutons. | `romansallad`, `romansallat`, `romaine`, `cos`, `hjertesalat` when romaine/little-gem context, `bindisalat` in Norwegian contexts. | `variety=romaine`, `format=head`, `heart`, or `bagged_whole_or_cut`. |
| `iceberg_lettuce` | Iceberg/crisphead lettuce heads. | `krispsallat`/batavia if sold as loose leafy lettuce rather than dense iceberg. | `isbergssallad`, `isbergssallat`, `iceberg`, `issalat`, `icebergsalat`. | `variety=iceberg`, `format=head`, `texture=crisphead`. |
| `butterhead_leaf_lettuce` | Butterhead/head lettuce, green/red leaf lettuce, lollo rosso/bionda, oak leaf, frisée, batavia, crisp lettuce when not iceberg. | Romaine, iceberg, cabbage, herbs. | `huvudsallat`, `plocksallat`, `krispsallat`, `ekblad`, `lollo`, `frisésallat`, `grønn salat`, `hodesalat`, `blaðsalat`. | `variety=leaf_or_butterhead`, `format=head`, `potted`, or `loose_leaf`. |
| `living_potted_lettuce` | Lettuce sold with roots/in a pot, including potted crisp or leaf lettuce. | Potted herbs. | `i kruka`, `kruksallad`, `kruksallat`, `salat i potte`; category still `sallad`. | `format=potted_living`, preserve detected variety when present. |
| `mixed_baby_leaf_salad` | Washed mixed small-leaf salad bags: seasonal mix, Mediterranean/Provençal/Tuscan mixes, baby-leaf blends, mâche/corn-salad blends where sold as mix. | Single-leaf baby spinach or ruccola; prepared salad bowls with dressing/protein. | `sallatsmix`, `salladsmix`, `småbladsmix`, `säsongsmix`, `medelhavsmix`, `provensalsk`, `toskansk`, `mesclun`, `babyleaf`. | `variety=mixed_leaf`, `format=bagged_leaf_mix`, often `washed_ready_to_eat=true`. |
| `mache_corn_salad` | Mâche/corn salad/lamb's lettuce sold alone. | Mixed bags unless mâche is the only named leaf. | `maché`, `machesallat`, `fältsallat`, `feldsalat`, `rapunsel`, `lamb's lettuce`. | `variety=mache`, `format=bagged_leaf`. |
| `leafy_chicory_endive` | Endive/chicory/radicchio/frisée leaves sold as salad greens. | Root chicory/coffee substitutes; cooked cabbage. | `endive`, `cikoria`, `radicchio`, `frisée`, `julesalat`. | `variety=chicory_family`, `bitterness=high`. |

## Locale aliases

| Class | Swedish aliases | Norwegian aliases | Icelandic aliases | Notes |
| --- | --- | --- | --- | --- |
| `baby_spinach` | babyspenat, småbladig spenat, spenatblad | babyspinat, spinat, småbladet spinat | babyspínat, spínat, spínatblöð | `stuvad spenat` and frozen `hackad spenat` are processed spinach, not this class. |
| `rocket_arugula` | ruccola, rucola, senapskål | ruccola, rucola, ruccolasalat | klettasalat, rúkkóla/rúkóla | Swedish chains use both `ruccola` and `rucola`; keep both. |
| `romaine_lettuce` | romansallad, romansallat, miniromansallat, hjärtsallad | romanosalat, hjertesalat, bindisalat | romaine salat, hjartasalat | `hjärtsallad` is usually little-gem/romaine hearts in Swedish retail. |
| `iceberg_lettuce` | isbergssallad, isbergssallat | isbergsalat | íssalat | Strong single-token match; beware recipes saying `sallad på isberg`. |
| `butterhead_leaf_lettuce` | huvudsallat, plocksallat, krispsallat, lollo rosso, ekbladssallat | hodesalat, grønn salat, crispisalat, lollo rosso, eikebladsalat | höfuðsalat, blaðsalat, lollo rosso | If `krisp/is` plus dense head, inspect image/category before choosing iceberg. |
| `living_potted_lettuce` | kruksallad, kruksallat, sallat i kruka | salat i potte, crispisalat i potte | salat í potti | Format class can wrap a more precise variety. |
| `mixed_baby_leaf_salad` | sallatsmix, salladsmix, småbladsmix, säsongsmix, medelhavsmix | salatmix, salatblanding, småbladet salat, middelhavsmiks | salatblanda, blaðsalatblanda | Use `mixed_leaf_components` if ingredients list names spinach/ruccola/mâche. |
| `mache_corn_salad` | machésallat, mâche, fältsallat | feldsalat, vårsalat, mâche | lambhagasalat, mache | Often appears inside mixed bags; only classify directly when sold alone. |
| `leafy_chicory_endive` | endive, cikoria, radicchio, frisée | endivie, sikori, julesalat, radicchio | síkóría, endívia, radicchio | Keep bitterness as an attribute for substitution ranking. |

## SKU evidence by chain

The rows below cite real retailer pages or current flyer/search pages.  Live
availability is store- and date-dependent; copy exact titles from ingestion
snapshots into tests when available.

| Chain | Real SKU/title examples | Source notes |
| --- | --- | --- |
| ICA | `Babyspenat eko Babyspenat eko 65 Gram ICA I love eco`; `Sallatsmix i storpack Sköljd 150g ICA`; `Romansallat i påse 200g Klass 1 ICA`; `Miniromansallat Ekologisk 150g Klass 1 ICA I love eco`; `Plocksallat i kruka 100g Orto Novo`; `Hjärtsallad Ekologisk 180g Klass 1 ICA I love eco`; `Isbergssallad ca 440g Klass 1 ICA`. | ICA product/category evidence: [baby spinach product](https://handla.ica.se/produkt/2159691), [sallatsmix product](https://handla.ica.se/produkt/1431288), [romaine category](https://handla.ica.se/kategori/4596), [salad category](https://handla.ica.se/kategori/4587), and ICA's online assortment page exposing `Isbergssallad ca 440g` ([handla](https://handla.ica.se/handla)). |
| Coop | `Ekologisk sallad i påse ... babyspenat, rucola och säsongsmix 65 g`; `Romansallad Eko`; category path `frukt-gronsaker/gronsaker/sallad-groddar`. | Coop current flyer text lists bagged `babyspenat`, `rucola`, and `säsongsmix` options ([Coop Rosviksgatan flyer](https://dr.coop.se/Butik/Coop-Rosviksgatan?c=2026-12)); Coop product/category URLs expose romaine and salad-sprout category paths ([romansallad eko](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/sallad-groddar/romansallad-eko-7330606051360), [online groceries](https://www.coop.se/handla/varor/)). |
| Willys | `Ekologisk Babyspenat / Småbladsmix`; recipe/retail content using `Ruccola`; `Grönsallad` as a generic weak-token example in taco recipes. | Willys offer/search pages expose an `Ekologisk Babyspenat, Småbladsmix` offer ([offer URL](https://www.willys.se/erbjudanden/offline-Ekologisk-Babyspenat--Smabladsmix-2500258807)); Willys recipe pages show `Ruccola` as a leaf term and `Grönsallad` as generic salad wording ([helgrecept](https://www.willys.se/artikel/tareqs-helgrecept), [vardagsrätter](https://www.willys.se/artikel/vardagsratter)). |
| Lidl Sverige | `Ruccola 125 g`; `Spenat 250 g`; `Spenat 500 g`; `Romansallad /st`; recipe content with `savoykål` plus `ruccola` demonstrates why cabbage and leafy salad tokens must be separated. | Lidl product pages: [ruccola](https://www.lidl.se/p/ruccola/p10041747), [spenat 250g](https://www.lidl.se/p/spenat/p10037681), [spenat 500g](https://www.lidl.se/p/spenat/p10042282), [romansallad](https://www.lidl.se/p/romansallad/p10044932), plus a recipe combining cabbage and ruccola ([savoykålssallad](https://recept.lidl.se/recept/kycklingklubba-med-sallad-paa-savoykaal-roedbetor-ruccola-blaamoegelost-och-valnoetter)). |

## Fixture recommendations

For automated classifier tests, include at least one positive and one exclusion
for each high-volume class:

```json
[
  {
    "raw": "Babyspenat eko Babyspenat eko 65 Gram ICA I love eco",
    "categoryPath": ["Frukt & Grönt", "Grönsaker", "Sallad"],
    "class": "baby_spinach",
    "attributes": {
      "variety": "spinach",
      "leaf_stage": "baby",
      "format": "bagged_leaf",
      "organic": true,
      "washed_ready_to_eat": true
    }
  },
  {
    "raw": "Ruccola 125 g",
    "chain": "Lidl Sverige",
    "class": "rocket_arugula",
    "attributes": {
      "variety": "rocket",
      "format": "bagged_leaf"
    }
  },
  {
    "raw": "Romansallat i påse 200g Klass 1 ICA",
    "class": "romaine_lettuce",
    "attributes": {
      "variety": "romaine",
      "format": "bagged_whole_or_cut",
      "class_grade": "1"
    }
  },
  {
    "raw": "Ekologisk sallad i påse babyspenat, rucola och säsongsmix 65 g",
    "class": "mixed_baby_leaf_salad",
    "attributes": {
      "variety": "mixed_leaf",
      "format": "bagged_leaf_mix",
      "mixed_leaf_components": ["baby_spinach", "rocket_arugula", "seasonal_leaf_mix"]
    }
  },
  {
    "raw": "Stuvad spenat 375g ICA",
    "class": null,
    "excludeReason": "processed_frozen_or_creamed_spinach"
  }
]
```

## Production caveats

- `sallad/salat/salat` alone may mean a dish, a side salad, or a whole produce
  category.  Require a variety token, ingredient list, or chain category before
  emitting a precise class.
- `spenat` must be split by processing state.  Fresh baby-leaf bags belong here;
  frozen chopped spinach, creamed spinach, and pastry fillings belong to prepared
  or frozen vegetable classes.
- `hjärtsallad` can be marketed as little-gem hearts.  Keep it under romaine
  unless the chain explicitly maps it to butterhead.
- `kruka/potte/potti` is a living format.  It is not enough by itself to call a
  SKU leafy greens because herbs are also sold in pots.
- Cabbage-family leaves (`grönkål`, `svartkål`, `savoykål`) can appear in salad
  recipes but should stay in brassica/cabbage classes unless sold in a mixed
  baby-leaf salad bag.
