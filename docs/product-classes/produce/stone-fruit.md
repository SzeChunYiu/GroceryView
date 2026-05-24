# Produce class: stone fruit

Stone fruit covers fresh, sweet produce SKUs whose edible flesh surrounds one hard pit/stone. Use this class for the shopper-facing summer fruit set that Nordic chains group as `stenfrukt`, `nektariner/persikor`, `plommon`, or berry/fruit subcategories: peaches, nectarines, flat peaches, apricots, plums, cherries, and close fresh variants. Do **not** map mango, avocado, olives, dates, almonds, or processed peach/apricot flavours here unless a downstream taxonomy explicitly asks for botanical drupes rather than grocery produce classes.

Sources checked: ICA's stone-fruit explainer and ICA private-label stone-fruit page list the common Swedish retail family as nektarin, persika, plommon, aprikos, plus paraguayos/platternias; Coop, Willys, and Lidl public product/search pages expose current or recently advertised SKU names used below. Evidence was captured on 2026-05-24.

## Sub-class definitions and recognition rules

| Sub-class | Include varieties / forms | SKU-name signals | Chain-category signals | Exclude / disambiguate |
| --- | --- | --- | --- | --- |
| `peach` | Yellow/white peach, loose peach, packed peach. | `persika`, `persikor`, `peach`, `fersken`, `ferskja`; may include colour/origin/class/pack size. | ICA `stenfrukt`; Coop `frukt-gronsaker/frukt-bar/nektariner-persikor`; Willys fruit search/category; Lidl `Frukt & grönsaker`. | Peach yoghurt, drinks, baby purée, canned peaches, jam, desserts. |
| `flat_peach` | Paraguayos, donut/saturn peach, platerina/platternia when sold as a peach-like flat stone fruit. | `paraguayo`, `paraguayos`, `platt persika`, `donut peach`, `saturn peach`, `platerina`, `platternia`, `flat peach`. | Usually same chain bucket as peaches/nectarines or ICA `stenfrukt`. | Flat doughnuts or bakery items; keep `platerina/platternia` here only when fresh produce. |
| `nectarine` | Yellow- or white-flesh nectarines, loose or punnets. | `nektarin`, `nektariner`, `nectarine`, `nektarin gul/vit`, `nektarin klass 1`, `nektarin(er) i korg`. | ICA `stenfrukt`; Coop `nektariner-persikor`; Willys/Lidl fruit categories. | Juice/nectar (`nektar`) and flavour names; nectarines are smooth-skinned peaches but should stay separate from fuzzy peaches. |
| `apricot` | Fresh apricot, luxury apricot, loose/packed apricot. | `aprikos`, `aprikoser`, `apricot`, `aprikosar`, `apríkósa`; optional `lyxaprikos`. | ICA `stenfrukt`; general chain fresh-fruit category. | Dried apricots, apricot filling, jam, preserves, baked goods. |
| `plum` | Fresh plums, prune plums/damsons, mirabelle/greengage if sold fresh. | `plommon`, `sviskon`, `mirabell`, `reine claude`, `greengage`, `plomme`, `plóma`. | Coop `ovrig-frukt/plommon`; Lidl `plommon`; ICA `stenfrukt`; Willys fruit category/search. | `plommontomat`/plum tomato, prune juice, dried prunes unless a dried-fruit class maps them. |
| `cherry` | Sweet cherries, sour cherries/morello when fresh. | `körsbär`, `korsbar`, `kirsebær`, `kirsuber`, `morell`, `moreller`, `cherry`, `cherries`. | Coop and Lidl can place these under `bar/bär` even though they are stone fruit; allow berry-category evidence if SKU name is cherry. | Cherry tomatoes, cherry-flavoured drinks/candy, cocktail cherries. |

## Locale aliases

| Sub-class | Swedish (`sv`) | Norwegian Bokmål (`nb`) | Icelandic (`is`) |
| --- | --- | --- | --- |
| Peach | persika, persikor | fersken | ferskja, ferskjur |
| Flat peach | paraguayo, paraguayos, platt persika, platerina/platternia | flat fersken, paraguayo, donut-fersken | flöt ferskja, paraguayo |
| Nectarine | nektarin, nektariner | nektarin, nektariner | nektarína, nektarínur |
| Apricot | aprikos, aprikoser | aprikos, aprikoser | apríkósa, apríkósur |
| Plum | plommon, sviskon, mirabell | plomme, plommer, sviske | plóma, plómur, sveskja |
| Cherry | körsbär, morell | kirsebær, morell | kirsuber |

Normalize diacritics and retailer URL slugs before matching (`körsbär` may appear as `korsbar`). Singular/plural forms are equivalent for classing.

## Real retailer SKU examples

| Chain | Observed SKU / public product signal | Class mapping | Evidence |
| --- | --- | --- | --- |
| ICA | `Paraguayos` and `Platternias` on ICA's stone-fruit family page | `flat_peach` | ICA lists these under `ICAs egna favoriter från stenfruktsfamiljen`: <https://www.ica.se/icas-egna-varor/produkter/icas-stenfrukt/> |
| ICA | `Nektarin med gult fruktkött`, `Nektarin med vitt fruktkött`, `Plommon`, `Persika`, `Aprikos` | `nectarine`, `plum`, `peach`, `apricot` | Same ICA stone-fruit page lists these named product examples: <https://www.ica.se/icas-egna-varor/produkter/icas-stenfrukt/> |
| Coop | `Persika` with product id/GTIN-like slug `2317440400009` in `nektariner-persikor` | `peach` | <https://www.coop.se/handla/varor/frukt-gronsaker/frukt-bar/nektariner-persikor/persika-2317440400009/> |
| Coop | `Plommon 500 gr` with slug `7340007912061`; `Körsbär` with slug `8420982011030` | `plum`, `cherry` | <https://www.coop.se/handla/varor/frukt-gronsaker/frukt-bar/ovrig-frukt/plommon-500-gr-7340007912061> and <https://www.coop.se/handla/varor/frukt-gronsaker/frukt-bar/bar/korsbar-8420982011030> |
| Willys | Search API result `Persika`, code `101854067_KG`, display volume `ca: 140g` | `peach` | <https://www.willys.se/search?q=persika> |
| Willys | Search API result `Nektariner Klass 1`, code `101178320_ST`, display volume `500g` | `nectarine` | <https://www.willys.se/search?q=persika> |
| Lidl | `Persikor` product page `p10036632`; `Plommon` page `p10036631`; `Körsbär` page `p10032118` | `peach`, `plum`, `cherry` | <https://www.lidl.se/p/persikor/p10036632>, <https://www.lidl.se/p/plommon/p10036631>, <https://www.lidl.se/p/korsbar/p10032118> |

## Classification precedence

1. Require a fresh-produce context: retailer category path or department must be fruit/berries/produce, or the SKU must be an unpackaged fresh unit/weight product.
2. Match the most specific sub-class first: `flat_peach` before `peach`; `cherry` before generic berry handling; `plum` before tomato handling.
3. If a SKU contains both a stone-fruit term and a processed-food marker (`yoghurt`, `juice`, `nektar`, `dryck`, `sylt`, `kräm`, `fryst`, `torkad`, `konserv`, `barnmat`), do not classify as fresh stone fruit.
4. If category and SKU conflict, trust the SKU token only when it is an unambiguous fresh fruit noun. Example: Coop may place `körsbär` under `bar/bär`; still map to `cherry` because the SKU is fresh cherries.
5. Preserve chain-specific product IDs in fixtures when exposed (`101854067_KG`, `2317440400009`, `p10036632`) so future audits can verify class drift.
