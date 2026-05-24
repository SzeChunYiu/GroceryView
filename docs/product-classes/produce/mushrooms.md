# Produce product class: mushrooms

This note defines the `produce/mushrooms` equivalence class for raw edible mushrooms sold in the fresh produce aisle. It is intended for SKU normalization across Swedish grocery chains, with locale-aware labels for Swedish (`sv`), Norwegian Bokmål (`nb`), and Icelandic (`is`).

## Class boundary

Include a SKU when all of these are true:

- the item is an edible mushroom or mushroom mix sold as a raw produce item;
- the chain category path is a produce/vegetable/mushroom shelf, for example `Frukt & grönsaker > Grönsaker > Svamp`, `Frukt och grönt`, or equivalent;
- the SKU name is a varietal mushroom name, a generic fresh mushroom name, or a fresh mushroom mix;
- the pack unit is a fresh pack, loose/kg item, tray, basket/ask, or bag.

Exclude a SKU when any of these are true:

- it is canned, jarred, dried, frozen, marinated, soup, sauce, paste, pasta filling, dumpling, ready meal, seasoning, or flavour variant only;
- the mushroom word appears only as an ingredient/flavour in a prepared product;
- the chain category is pantry, frozen, ready meal, deli, or non-food.

When name and category conflict, require both fresh-produce category evidence and a mushroom varietal/token match before inclusion. For example, `Champinjoner Skivade Frysta` is excluded despite the varietal token because the state is frozen; `Konserverad shiitakesvamp` is excluded because it is canned.

## Sub-classes

| Sub-class slug | Belongs here | Recognition from SKU name | Recognition from chain category | Locale aliases (`sv` / `nb` / `is`) | Do not confuse with |
| --- | --- | --- | --- | --- | --- |
| `button-white` | White cultivated button/champignon mushrooms, including standard 200-400 g trays and generic loose white champignons. | Positive tokens: `champinjon`, `champinjoner`, `vit champinjon`, `white mushroom`, `button mushroom`, `champignon`. Size words such as `ask`, `klass 1`, `250 g`, or origin country are pack metadata, not varietals. | Include when category is produce vegetable mushroom shelf (`Grönsaker`, `Svamp`, `Frukt och grönt`, Lidl `Frukt & grönsaker`). | `champinjon`, `vita champinjoner` / `sjampinjong`, `hvit sjampinjong`, `champignon` / `sveppir`, `hvítir sveppir`, `champignon-sveppir` | Brown/chestnut champignons; processed sliced/frozen/canned champignons. |
| `button-brown-chestnut` | Brown/chestnut forms of cultivated champignon, including kastanjechampinjon and cremini-style SKUs. | Positive tokens: `kastanjechampinjon`, `kastanje-`, `brun champinjon`, `chestnut mushroom`, `brown mushroom`, `cremini`. If both `champinjon` and `kastanje` appear, classify here, not `button-white`. | Same fresh produce mushroom shelf as `button-white`. | `kastanjechampinjon`, `brun champinjon` / `kastanjesjampinjong`, `brun sjampinjong` / `brúnir sveppir`, `kastaníusveppir` | `skogschampinjon` unless SKU/brand clearly uses it as a brown cultivated champignon synonym. |
| `button-small-baby` | Small immature cultivated champignons sold as baby/minute/button packs. | Positive tokens: `baby champinjoner`, `minichampinjoner`, `mini champinjon`, `small button`, `baby button`. | Fresh produce mushroom shelf; typically fixed-weight small packs. | `babychampinjoner`, `minichampinjoner` / `små sjampinjonger`, `baby-sjampinjong` / `litlir sveppir`, `baby-sveppir` | Ordinary 250 g trays without a baby/mini token. |
| `portobello-grill` | Large mature cultivated champignons sold for grilling/stuffing; includes portobello/portabello and explicit grill champignons. | Positive tokens: `portobello`, `portabello`, `grill champinjon`, `grillchampinjon`, `large flat mushroom`. Large weight alone is insufficient without a grill/portobello token. | Fresh produce mushroom shelf; often each or 300-400 g pack. | `portobello`, `portabello`, `grillchampinjon` / `portobello`, `grillsjampinjong` / `portobello-sveppir`, `grillsveppir` | White 400 g value packs that are normal champignons, not large caps. |
| `field-forest-champignon` | Wild-style or field/forest champignon SKUs marketed as skogschampinjon/field mushroom, usually loose/kg. | Positive tokens: `skogschampinjon`, `skogschamp`, `field mushroom`, `forest champignon`, `ängschampinjon`. | Fresh produce mushroom shelf; loose/kg strongly supports the subclass when paired with `skogschamp*`. | `skogschampinjon`, `ängschampinjon` / `skogssjampinjong`, `åkersjampinjong` / `skógarsveppir`, `tún-sveppir` | Brown/chestnut champignons unless the SKU explicitly says skog/field. |
| `oyster` | Oyster mushrooms and king oyster/eryngii when sold raw. | Positive tokens: `ostronskivling`, `ostronmussling`, `oyster mushroom`, `king oyster`, `eryngii`. | Fresh produce mushroom shelf; chilled vegan/ready-meal category is not enough. | `ostronskivling`, `kungsmussling` / `østerssopp`, `kongeøsterssopp` / `ostrusveppur`, `kóngsostrusveppur` | Pasta/ravioli ingredients listing oyster mushrooms. |
| `shiitake` | Fresh shiitake mushrooms. | Positive tokens: `shiitake`, `shitake`, `shiitakesvamp`, `shiitake mushroom`. | Fresh produce mushroom shelf; pantry/canned category excludes. | `shiitake`, `shiitakesvamp` / `shiitake`, `shiitakesopp` / `shiitake-sveppir` | Canned or dried shiitake. |
| `chanterelle` | Fresh chanterelles and fresh funnel chanterelles. | Positive tokens: `kantarell`, `gula kantareller`, `trattkantarell`, `chanterelle`. | Fresh produce mushroom shelf; seasonal loose or tray items. | `kantarell`, `trattkantarell` / `kantarell`, `traktkantarell` / `kantarella`, `kantarellusveppir` | Soup/sauce/dairy products flavoured with chanterelle. |
| `wild-porcini-mix` | Fresh porcini/ceps/Karl Johan and fresh mixed mushroom packs where no single named mushroom dominates. | Positive tokens: `karljohan`, `stensopp`, `porcini`, `cep`, `svampmix`, `blandad svamp`, `mixed mushrooms`. | Fresh produce mushroom shelf only. | `karljohanssvamp`, `stensopp`, `svampmix` / `steinsopp`, `soppmiks` / `kóngssveppur`, `sveppablanda` | Dried risotto mixes, pasta fillings, sauces, or frozen mixes. |

## Normalization rules

1. Normalize diacritics and punctuation before matching: `kastanje- i ask`, `kastanje i ask`, and `Kastanjechampinjoner` should all expose `kastanje` + `champinjon`.
2. Prefer the most specific sub-class token. Example: `Champinjoner Kastanje- i ask` is `button-brown-chestnut`, not generic `button-white`.
3. Treat `Klass 1`, country of origin, membership/coupon text, pack size, and price as attributes. They must not split product classes.
4. Treat `EKO`, `KRAV`, `organic`, `ekologisk`, and `I love eco` as certification attributes unless the SKU otherwise contains a varietal token.
5. Reject SKUs with state/process tokens before subclassing: `fryst`, `frozen`, `konserverad`, `canned`, `torkad`, `dried`, `skivade` when accompanied by frozen/canned/pantry context, `soppa`, `sås`, `stuvning`, `pasta`, `ravioli`, `dumplings`, `risotto`.
6. If the chain category is only a broad search result, require a fresh-produce shelf path or an offer category like `Grönsaker` to keep the SKU in this class.

## Real SKU examples

These examples anchor the name/category rules to real retailer data. Use them as regression fixtures for recognizers.

| Chain | SKU example | Evidence | Expected sub-class | Why |
| --- | --- | --- | --- | --- |
| ICA | `Champinjoner 250g Klass 1 ICA`, product id `1297230`; ICA product page says brand ICA and origin Sweden, with annual sourcing from Poland, Lithuania, Sweden, Holland, and Russia. | `https://handla.ica.se/produkt/1297230` | `button-white` | Generic champignon token, no brown/baby/grill modifier, fresh ICA online product. |
| ICA | `Champinjoner i ask`, ICA Supermarket Teg offer, `ICA. Polen/Litauen. 250 g`, category offer. | `https://www.ica.se/erbjudanden/ica-supermarket-teg-1003487/` | `button-white` | Offer wording is a fresh 250 g tray; `ask` is packaging. |
| Coop | `Champinjoner i ask`, `Polen/Litauen/Coop. Klass 1. 250 g`, X:-tra/Coop weekly flyer. | `https://dr.coop.se/Butik/136037` | `button-white` | Coop-branded fresh tray in a produce offer; no brown/grill modifier. |
| Willys | `Champinjoner Klass 1`, code `101086165_ST`, brand `Garant`, package `GARANT, 250g`, source category URL `https://www.willys.se/c/frukt-och-gront?page=0&size=100`, retrieved `2026-05-23T20:40:33.430Z`. | `apps/web/src/lib/ingested/willys.ts` | `button-white` | Fresh `frukt-och-gront` category and generic champignon name. |
| Willys | `Skogschamp Champinjon Klass 1`, code `100152166_KG`, loose/kg, source category URL `https://www.willys.se/c/frukt-och-gront?page=0&size=100`, retrieved `2026-05-23T20:40:33.430Z`. | `apps/web/src/lib/ingested/willys.ts` | `field-forest-champignon` | `skogschamp` is a forest/field champignon signal and should not be collapsed into plain white champignons. |
| Willys | `Champinjoner Baby Klass 1`, code `101238494_ST`, brand `Garant`, package `GARANT, 200g`, source category URL `https://www.willys.se/c/frukt-och-gront?page=1&size=100`, retrieved `2026-05-23T20:40:33.430Z`. | `apps/web/src/lib/ingested/willys.ts` | `button-small-baby` | `Baby` is a size/age subclass modifier. |
| Willys | `Champinjoner Grill Klass 1`, code `101284377_ST`, package `400g`, source category URL `https://www.willys.se/c/frukt-och-gront?page=1&size=100`, retrieved `2026-05-23T20:40:33.430Z`. | `apps/web/src/lib/ingested/willys.ts` | `portobello-grill` | `Grill` denotes large caps intended for grilling/stuffing. |
| Lidl | `Champinjoner`, 250 g, Lidl page `p10040365`, in-store campaign `08/12 - 14/12`. | `https://www.lidl.se/p/champinjoner/p10040365` | `button-white` | Generic fresh champignon page; no modifier. |
| Lidl | `Vita champinjoner`, 400 g, Lidl page `p10035633`, in-store campaign `15/09 - 21/09`. | `https://www.lidl.se/p/vita-champinjoner/p10035633` | `button-white` | Explicit white champignon token; 400 g is pack size only. |

## Implementation notes for matchers

- Suggested positive regex base: `\b(champinjon|champignon|sjampinjong|svepp|svamp|shiitake|shitake|ostronskivling|ostronmussling|oyster|kantarell|trattkantarell|karljohan|stensopp|porcini|portobell?o)\b` after lowercasing and accent folding.
- Suggested fresh-category guard: accept Swedish/Nordic category tokens matching `frukt`, `grönt`, `gronsaker`, `grönsaker`, `svamp`, `produce`, or `vegetable`; reject `skafferi`, `konserv`, `fryst`, `frozen`, `pasta`, `färdigmat`, `soppa`, `sås` unless a downstream human override says the SKU is fresh.
- Store locale aliases separately from matching aliases. Icelandic retail feeds often use generic `sveppir` for champignons, so avoid mapping every `sveppir` SKU to `button-white` without a category and image/pack clue.
