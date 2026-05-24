# Produce class: root-vegetables

Status: draft classification guidance for grocery equivalence and SKU normalization.  
Source-check date: 2026-05-24.

## Class definition

`produce/root-vegetables` covers fresh edible storage roots and swollen hypocotyl/root vegetables sold in the produce department. The class is for raw, minimally handled produce where the shopper expectation is "a root vegetable for cooking, roasting, boiling, grating, juicing, or eating raw".

Include loose, bunched, bagged, washed, baby/snack, organic, and class-1 variants when the vegetable identity remains the same.

Exclude:

- potatoes and other tubers that should map to `produce/potatoes` or a tuber class;
- sweet potato, cassava, yam, taro, and similar tropical/starchy tubers unless a separate local taxonomy has no tuber class;
- onions, garlic, shallots, leeks, and other alliums/bulbs;
- ginger, turmeric, galangal, horseradish paste, and other rhizomes/condiments;
- pickled, canned, jarred, frozen, cooked, sous-vide, or ready-meal products, even when the name contains a root vegetable;
- cut salad mixes, soup mixes, mirepoix, or prepared roasting trays unless the pipeline has a specific prepared-produce class.

## Primary recognition rules

Use both SKU-name tokens and retailer category path. A root-vegetable decision is high confidence when:

1. the normalized SKU name contains a subclass token from the table below; and
2. the chain category is produce-oriented, especially Swedish paths such as `Frukt & Grönt`, `Frukt och grönt`, `Potatis & rotsaker`, `Rotsaker`, `Grönsaker`, or Lidl `Mat & dryck > Frukt & grönsaker`.

Downgrade or reject when category or packaging signals point to shelf-stable or prepared goods: `konserver`, `inlagd`, `skivad` with jar/can, `förkokt`, `fryst`, `soppa`, `mix`, `stavar`, `spaghetti`, `julienne`, `gryta`, or brand/packaging names associated with preserves.

## Sub-classes

| Sub-class | Include varieties and forms | SKU-name cues | Chain-category cues | Common false positives / exclusions |
| --- | --- | --- | --- | --- |
| `carrots` | Orange carrots, bunched carrots, washed carrots, baby/snack carrots, rainbow/mix carrots when still whole fresh carrots. | `morot`, `morötter`, `knippmorot`, `snackmorot`, `baby carrots`, `regnbågsmorötter`; nb: `gulrot`, `gulrøtter`; is: `gulrót`, `gulrætur`. | Strong when under `Frukt & Grönt`, `Potatis & rotsaker`, `Rotsaker`, or Lidl `Frukt & grönsaker`. | Carrot juice, grated carrot salad, frozen diced carrot, soup base/mirepoix, julienne/sticks if prepared-produce class exists. |
| `parsnips` | Whole fresh parsnips, loose or bagged, organic or conventional. | `palsternacka`, `palsternackor`; nb: `pastinakk`; is: `nípa`, `pastinakka`. | Produce + roots paths. Often sold as loose approximate weight or 500 g bag. | Parsnip purée, chips, frozen roast mix, soup mix. |
| `parsley-root` | Root parsley / Hamburg parsley sold as a fresh white root. | `persiljerot`, `rotpersilja`; nb: `persillerot`; is: `steinseljurót`. | Produce + roots/vegetables paths. | Parsley herb bunches (`persilja`) without `rot`; parsnip if only `palsternacka` appears. |
| `celeriac` | Whole celeriac/root celery, loose or wrapped. | `rotselleri`, `sellerirot`, `celeriac`; nb: `sellerirot`; is: `hnúðsellerí`, `sellerírót`. | Produce + roots/vegetables paths. | Celery stalks (`blekselleri`, `stjälkselleri`), celeriac mash, frozen soup vegetables. |
| `beets` | Red beet, yellow/golden beet, candy/candy-stripe/Chioggia beet, white beet, mixed fresh beets; loose, bunched, or bagged. | `rödbeta`, `rödbetor`, `gulbeta`, `gulbetor`, `polkabeta`, `polkabetor`, `chioggia`, `vitbeta`, `betor`; nb: `rødbete`, `gulbete`, `polkabete`; is: `rauðrófa`, `gulrófa` can be ambiguous with carrot in some Icelandic contexts, prefer category and image text. | Produce + roots paths; Lidl season page groups `rödbeta/gulbeta/polkabeta/vitbeta` under beets/rot vegetables. | Pickled beets (`inlagda rödbetor`), jarred sliced beets, pre-cooked vacuum packs, beetroot salad. |
| `rutabaga-swede` | Fresh rutabaga/swede/kålrot whole or loose-weight. | `kålrot`, `rotabagge`, `swede`, `rutabaga`; nb: `kålrot`; is: `gulrófa`, `rófa`. | Produce + roots/vegetables paths; often one-piece or loose by kg. | Kohlrabi (`kålrabbi`) is a stem vegetable and should not map here unless taxonomy intentionally groups brassica roots/stems together. |
| `turnips` | White/purple-top turnips, majrova/turnip bunches. | `majrova`, `rova`, `turnip`; nb: `nepe`; is: `næpa`. | Produce + roots/vegetables paths. | Rutabaga/kålrot when explicitly named; radish if `rädisa` tokens dominate. |
| `radishes` | Red radish bunches, breakfast radish, daikon/mooli/rettich if taxonomy has no separate radish class. | `rädisa`, `rädisor`, `daikon`, `rättika`, `mooli`, `rettich`; nb: `reddik`, `rettich`; is: `hreðka`, `daikon`. | Usually `Frukt & Grönt > Grönsaker`, not always `Rotsaker`; include only if root-vegetable class owns edible-root vegetables broadly. | Sprouts, pickles, kimchi, prepared salads. |
| `salsify-scorzonera` | Black salsify/scorzonera and white salsify when sold fresh. | `svartrot`, `haverrot`, `salsify`, `scorzonera`; nb: `skorsonnerrot`, `havrerot`; is: `hafurrót` (rare). | Produce specialty/root paths. | Canned salsify, prepared gratin. |
| `jerusalem-artichoke` | Jerusalem artichoke/sunchoke, fresh. | `jordärtskocka`, `sunchoke`, `jerusalem artichoke`; nb: `jordskokk`; is: `jarðskokkur`. | Produce + roots/specialty vegetables. | Artichoke hearts (`kronärtskocka`) and jarred antipasti. |

## Chain-specific category hints

- **ICA:** titles often carry the variety, pack size, grade, and brand, e.g. `Palsternacka 500g Klass 1 ICA`. If no visible category path is available, require the product page to be an ICA grocery product and use title + produce storage/origin fields as supporting evidence.
- **Coop:** product-search records can be terse (`Morötter`, `Palsternacka`, `Rotselleri`, `Kålrot Hel`) with an EAN-like id and package size. Treat a match as root vegetables only when the search context/store is grocery produce and no preserve/prepared cues appear.
- **Willys:** breadcrumbs are very useful. Prefer SKUs below `Frukt & Grönt > Potatis & rotsaker > Rotsaker`; reject similarly named items in pantry categories.
- **Lidl:** offer/product pages may expose only `Mat & dryck > Frukt & grönsaker`; use the page title and pack size to refine the subclass. Lidl's seasonal produce guide explicitly lists carrots, parsnips, beet types, rutabaga, Jerusalem artichoke, and similar roots as seasonal vegetables.

## Real SKU examples used as anchors

| Chain | SKU / source identifier | Observed title | Sub-class | Category evidence | Citation |
| --- | --- | --- | --- | --- | --- |
| ICA | `2016054` | `Palsternacka 500g Klass 1 ICA` | `parsnips` | ICA grocery product page; title, brand ICA, Sweden origin, refrigerated produce storage. | <https://handla.ica.se/produkt/2016054> |
| ICA | `4000251` | `Kålrot 1-pack Klass 1 ICA` | `rutabaga-swede` | ICA grocery product page calls it a rotfrukt and gives fresh-produce storage. | <https://handla.ica.se/produkt/4000251> |
| Willys | `100794473_ST` | `Morötter Klass 1` / `GARANT, 1kg` | `carrots` | Public Willys product API breadcrumbs: `Frukt & Grönt > Potatis & rotsaker > Rotsaker`; product URL path `/produkt/Morotter-Klass-1-100794473_ST`. | <https://www.willys.se/produkt/Morotter-Klass-1-100794473_ST> |
| Coop | `7300156476319` | `Morötter`, 1000 g | `carrots` | Public Coop personalization search for store `015810` returned the SKU under query `morot` with 1000 g package size. | <https://external.api.coop.se/personalization/search/products?api-version=v1&store=015810&device=desktop&direct=false> |
| Lidl | `p10039417` | `Ekologiska morötter`, 1 kg | `carrots` | Lidl product page breadcrumb: `Mat & dryck > Frukt & grönsaker`; title and 1 kg pack size. | <https://www.lidl.se/p/ekologiska-morotter/p10039417> |
| Lidl | `p10040194` | `Matriket Rödbetor`, 1 kg | `beets` | Lidl product page for `Rödbetor`, 1 kg, with `Från Sverige` marking. | <https://www.lidl.se/p/matriket-rodbetor/p10040194> |

## Locale alias glossary

| Concept | Swedish (`sv`) | Norwegian Bokmål (`nb`) | Icelandic (`is`) | Notes |
| --- | --- | --- | --- | --- |
| carrot | morot, morötter | gulrot, gulrøtter | gulrót, gulrætur | Icelandic `gulrót` can mean carrot; do not confuse with `gulrófa` rutabaga. |
| parsnip | palsternacka, palsternackor | pastinakk | nípa, pastinakka | White tapered root; often confused with parsley root. |
| parsley root | persiljerot, rotpersilja | persillerot | steinseljurót | Require `rot` cue to avoid herb parsley. |
| celeriac | rotselleri, sellerirot | sellerirot | hnúðsellerí, sellerírót | Distinct from celery stalks. |
| beetroot/red beet | rödbeta, rödbetor | rødbete, raudbete | rauðrófa | Include fresh yellow/striped/white beet variants under beets. |
| yellow beet | gulbeta, gulbetor | gulbete | gulrófa may also mean rutabaga | Ambiguous in Icelandic; use image/category/shape. |
| rutabaga/swede | kålrot | kålrot | gulrófa, rófa | Swedish `kålrabbi` is kohlrabi, not kålrot. |
| turnip | majrova, rova | nepe | næpa | May be rare in Swedish grocery assortments. |
| radish | rädisa, rädisor, rättika | reddik, rettich | hreðka | Daikon/rättika may warrant its own subclass if volume justifies. |
| salsify | svartrot, haverrot | skorsonnerrot, havrerot | hafurrót | Specialty/root path needed. |
| Jerusalem artichoke | jordärtskocka | jordskokk | jarðskokkur | Exclude globe artichoke/kronärtskocka. |

## Normalization notes

- Strip quality, origin, and merchandising modifiers (`klass 1`, `eko`, `ekologisk`, `KRAV`, `Sverige`, `nyskördade`, `tvättade`, `lösvikt`, `ca`, `1-pack`) before subclass matching, but keep them as attributes.
- Preserve pack form attributes: `loose_kg`, `bag_500g`, `bag_1kg`, `bunch`, `each`, `snack_pack`.
- For equivalence, exact subclass should outrank broad class. Example: `Palsternacka 500g` is comparable to other parsnip SKUs, not to carrots, even though both are roots.
- Mixed fresh bags labelled only `rotfrukter` should map to a separate `root-vegetable-mix` prepared/fresh-mix class when available; otherwise classify as root vegetables with low subclass confidence and retain ingredient tokens.
