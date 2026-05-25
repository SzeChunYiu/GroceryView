# Produce class: root vegetables

Purpose: define the fresh-produce root-vegetables equivalence class for SKU
normalization and chain-category matching. This class covers edible underground
storage organs sold fresh, loose, bagged, bunched, or in unseasoned mixes:
potatoes, carrots, beets, parsnips, celeriac, swede, turnips, radishes, sweet
potatoes, Jerusalem artichokes, and horseradish. It excludes flour/starch,
gratins, salads, fries, chips, frozen mixes, soups, pickles, and prepared meal
components whose names only contain a root-vegetable ingredient.

## Class boundary

Accept a SKU as root vegetables when both conditions are true:

1. **Name evidence:** the SKU title contains a strict root-vegetable term or
   variety from the subclass table below.
2. **Produce context:** the chain category/path is fresh produce, preferably a
   root-vegetable/potato shelf. Broad produce categories such as `Frukt &
   Grönt`, `frukt-och-gront`, or public weekly produce offers require strict
   name evidence.

Use organic, washed/unwashed, local origin, grade, pack size, loose/bagged
state, cooking type, and colour as attributes. Do not create new subclasses for
brand, `Klass 1`, seasonal labels, or country of origin.

## Chain category recognition

| Chain | Preferred positive category/path | Recognition notes |
| --- | --- | --- |
| ICA | `Frukt & Grönt`; root and potato flyer/store rows | ICA broad produce context needs a strict title (`morötter`, `potatis`, `rödbetor`, `palsternacka`). Reject `potatisgratäng`, `potatissallad`, and frozen `Svenska rotfrukter`. |
| Coop | `frukt-gronsaker/gronsaker/rotfrukter` or `potatis` shelves | Coop generated grocery rows can contain processed potato flour and gnocchi; accept only fresh produce URLs/categories or strict root titles on produce pages. |
| Willys | `willys.se/c/frukt-och-gront` | Willys category rows often have an empty category field, so source URL plus title is the positive signal: `Potatis Fast Klass 1`, `Morot Klass 1`, `Palsternacka Klass 1`, `Rotselleri Klass 1`, `Rödbeta Klass 1`. |
| Lidl | Public offer pages such as `veckans-frukt-groent` and `mandag-soendag` | Lidl offer rows may only expose `lidl-public-offers`; require the title to be a fresh root vegetable and reject prepared potato products. |

## Subclasses

| Subclass | Belongs here | Exclude / split out | SKU-name recognition |
| --- | --- | --- | --- |
| `potato_waxy` | Waxy/firm potatoes for boiling, salad potatoes, delicacy potatoes, amandine and mandel potatoes when sold fresh. | Potato flour, gnocchi, gratin, fries, chips, mash, salad. | `fast potatis`, `delikatesspotatis`, `amandine`, `mandelpotatis`, `småpotatis`, `kokpotatis`. |
| `potato_floury` | Floury potatoes and baking potatoes sold fresh. | Potato starch/flour despite `mjöl`; prepared baked potatoes. | `mjölig potatis`, `bakpotatis`, `bakepotet`, `bökunarkartafla`. |
| `new_potato` | New/early potatoes, fresh seasonal potatoes, unwashed early potatoes. | Ordinary stored potatoes without seasonal wording. | `färskpotatis`, `nypotatis`, `ny potatis`, `early potatoes`, `nýjar kartöflur`. |
| `carrot` | Orange carrots, bunched carrots, snack carrots, baby carrots, rainbow carrots where carrot dominates. | Carrot cake, juice, puree, frozen mixes. | `morot`, `morötter`, `gulrot`, `gulrøtter`, `gulrót`, `carrot`. |
| `beetroot` | Red/yellow/polkaa beets sold raw/fresh. | Pickled beets, cooked vacuum-packed beets unless explicitly kept as cooked produce, beet juice. | `rödbeta`, `rödbetor`, `gulbeta`, `polkabeta`, `rødbete`, `rauðrófa`, `beetroot`. |
| `parsnip` | Fresh parsnips, loose or packed. | Soup mixes where parsnip is only one component. | `palsternacka`, `pastinakk`, `parsnip`, `nípa`. |
| `celeriac` | Celeriac/root celery bulbs. | Celery stalks, celery salt, remoulade. | `rotselleri`, `sellerirot`, `celeriac`, `hnúðsellerí`. |
| `swede_turnip` | Swede/rutabaga, turnip, kohlrabi when retailed as root vegetables. | Cabbage heads; brassica greens. | `kålrot`, `majrova`, `rova`, `turnip`, `rutabaga`, `kålrabi`, `gulrófa`, `rófa`. |
| `radish` | Radishes and daikon/mooli sold fresh. | Pickled daikon, radish sprouts. | `rädisa`, `rädisor`, `reddik`, `radish`, `daikon`, `hreðka`. |
| `sweet_potato` | Sweet potatoes/batata, orange or purple, loose or packed. | Sweet potato fries, mash, chips. | `sötpotatis`, `søtpotet`, `sweet potato`, `batata`, `sætkartafla`. |
| `jerusalem_artichoke` | Jerusalem artichokes/topinambur sold fresh. | Artichoke hearts from globe artichoke, soups. | `jordärtskocka`, `jordskokk`, `topinambur`, `jarðskokkur`. |
| `horseradish` | Fresh horseradish root. | Horseradish cream, sauce, cheese spread. | `pepparrot`, `pepperrot`, `horseradish`, `piparrót`. |
| `mixed_root_vegetables` | Fresh unseasoned mixed root-vegetable bags or trays. | Frozen mixes, gratins, oven-ready seasoned trays, soups. | `rotfrukter`, `rotfruktsmix`, `root vegetable mix`; require fresh/unseasoned evidence. |

## Locale alternate names

| Subclass | Swedish (`sv`) | Norwegian Bokmål (`nb`) | Icelandic (`is`) |
| --- | --- | --- | --- |
| `potato_waxy` | fast potatis, delikatesspotatis, mandelpotatis, amandine | kokefast potet, mandelpotet, småpotet | kartafla, fastar kartöflur, möndlukartöflur |
| `potato_floury` | mjölig potatis, bakpotatis | melne poteter, bakepotet | mjölmiklar kartöflur, bökunarkartafla |
| `new_potato` | färskpotatis, nypotatis | nypotet, ferskpotet | nýjar kartöflur |
| `carrot` | morot, morötter, knippmorot | gulrot, gulrøtter, knaskegulrot | gulrót, gulrætur |
| `beetroot` | rödbeta, rödbetor, gulbeta, polkabeta | rødbete, gulbete, polkabete | rauðrófa, gulrófa where used for beet, röndótt rófa |
| `parsnip` | palsternacka | pastinakk | nípa, pastinakka |
| `celeriac` | rotselleri, sellerirot | sellerirot | hnúðsellerí |
| `swede_turnip` | kålrot, majrova, rova | kålrot, kålrabi, nepe | rófa, gulrófa, næpa |
| `radish` | rädisa, rädisor, rättika, daikon | reddik, daikon | hreðka, daikon |
| `sweet_potato` | sötpotatis, batat | søtpotet | sætkartafla |
| `jerusalem_artichoke` | jordärtskocka | jordskokk | jarðskokkur |
| `horseradish` | pepparrot | pepperrot | piparrót |
| `mixed_root_vegetables` | rotfrukter, rotfruktsmix | rotgrønnsaker, rotmiks | rótargrænmeti |

## Real SKU examples

These examples were checked against public chain pages, generated public
ingestion snapshots, or retailer offer pages on 2026-05-25. They are classifier
fixtures and source-evidence examples, not price guarantees.

| Chain | Example SKU | Evidence URL | Classification note |
| --- | --- | --- | --- |
| ICA | `Svenska rotfrukter` | `https://www.ica.se/erbjudanden/maxi-ica-stormarknad-hyllinge-1003937/` | ICA flyer row in `Djupfryst`; negative for fresh `mixed_root_vegetables`, useful frozen exclusion. |
| ICA | `Potatis-, Rotfruktsgratäng` | `https://www.ica.se/erbjudanden/ica-focus-1004247/` | Prepared chilled gratin; negative example despite potato/root terms. |
| ICA | `Potatisgratäng` | `https://www.ica.se/erbjudanden/maxi-ica-stormarknad-hyllinge-1003937/` | Prepared potato dish; reject from fresh potato subclasses. |
| ICA | `Potatissallad original` | `https://www.ica.se/erbjudanden/maxi-ica-stormarknad-hyllinge-1003937/` | Deli salad; reject from root vegetables. |
| ICA | `Morötter i påse ICA` | `https://handla.ica.se/kategori/rotfrukter` | ICA fresh root-vegetable category/title pattern; classify as `carrot` when store page exposes produce context. |
| Coop | `Morötter` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/rotfrukter/` | Coop root-vegetable shelf title; classify as `carrot`. |
| Coop | `Sötpotatis` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/rotfrukter/` | Coop root-vegetable shelf title; classify as `sweet_potato`. |
| Coop | `Rödbetor` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/rotfrukter/` | Coop root-vegetable shelf title; classify as `beetroot`. |
| Coop | `Palsternacka` | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/rotfrukter/` | Coop root-vegetable shelf title; classify as `parsnip`. |
| Coop | `Potatismjöl` | `https://www.coop.se/handla/varor/skafferi/bakning/mjol/potatismjol-7340191177673/` | Coop processed starch row from generated snapshot; negative for `potato_*`. |
| Willys | `Potatis Fast Klass 1` (`100150587_KG`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Loose firm potato; classify as `potato_waxy`. |
| Willys | `Färskpotatis Otvättad Klass 1` (`100150701_KG`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Seasonal unwashed new potato; classify as `new_potato`. |
| Willys | `Morot Klass 1` (`100148868_KG`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Fresh loose carrot; classify as `carrot`. |
| Willys | `Palsternacka Klass 1` (`100149064_KG`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Fresh loose parsnip; classify as `parsnip`. |
| Willys | `Rödbeta Klass 1` (`100151210_KG`) | `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Fresh loose beetroot; classify as `beetroot`. |
| Lidl | `Matriket Morötter` | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Lidl public produce offer title pattern; classify as `carrot`. |
| Lidl | `Matriket Potatis` | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Lidl public produce offer title pattern; classify by cooking label if present, otherwise `potato_waxy` with lower confidence. |
| Lidl | `Sötpotatis` | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Fresh produce offer title; classify as `sweet_potato`. |
| Lidl | `Rödbetor` | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Fresh produce offer title; classify as `beetroot`. |
| Lidl | `Palsternacka` | `https://www.lidl.se/c/veckans-frukt-groent/a10094782` | Fresh produce offer title; classify as `parsnip`. |

## Negative examples and guardrails

- `potatismjöl`, `potatisgnocchi`, `potatisgratäng`, `potatissallad`,
  `rotfruktsgratäng`, fries, chips, and mash are processed products.
- Frozen `Svenska rotfrukter`, frozen diced roots, and seasoned oven trays are
  outside this fresh-produce class. They can keep `root_vegetable_terms` for
  audit but should not become fresh root SKUs.
- `selleri` alone usually means celery stalks; require `rotselleri` or
  `sellerirot` for celeriac.
- `kål` terms are not roots unless the title is `kålrot` or a recognized
  turnip/swede term.
- `jordärtskocka` is a root vegetable; globe artichoke hearts are not.

## Parser attribute guidance

| Attribute | Values / examples |
| --- | --- |
| `root_form` | `loose`, `bag`, `bunch`, `tray`, `mix`, `unknown` |
| `cooking_type` | `waxy`, `floury`, `baking`, `new`, `unknown` |
| `wash_state` | `washed`, `unwashed`, `unknown` |
| `freshness_state` | `fresh`, `frozen`, `prepared`, `unknown` |
| `colour` | `orange`, `red`, `yellow`, `purple`, `white`, `mixed`, `unknown` |
| `grade` | `klass_1`, `klass_2`, `unknown` |

Expected parse examples:

```json
[
  {
    "raw": "Färskpotatis Otvättad Klass 1",
    "class": "root_vegetables",
    "subclass": "new_potato",
    "wash_state": "unwashed",
    "grade": "klass_1",
    "freshness_state": "fresh"
  },
  {
    "raw": "Rödbeta Klass 1",
    "class": "root_vegetables",
    "subclass": "beetroot",
    "colour": "red",
    "grade": "klass_1",
    "freshness_state": "fresh"
  },
  {
    "raw": "Potatis-, Rotfruktsgratäng",
    "class": null,
    "excluded_reason": "prepared_gratin"
  }
]
```

## Implementation checklist for matchers

1. Apply processed and frozen exclusions before accepting broad terms such as
   `potatis` or `rotfrukter`.
2. Match multi-word subclasses before generic ones: `färskpotatis`,
   `sötpotatis`, `jordärtskocka`, `rotselleri`, then `potatis`.
3. Use chain category/path evidence as a confidence modifier. Narrow root
   shelves can accept short titles; broad produce shelves need strict title
   tokens.
4. Store cooking type, wash state, grade, origin, package form, and colour as
   attributes rather than subclass names.
5. For mixed bags, classify as `mixed_root_vegetables` only when the product is
   fresh and unseasoned; otherwise reject as prepared/frozen.
