# Cured meats product-class map

Status: operator reference for GroceryView product-class matching.  
Ticket: factory-tickets #1716.  
Last evidence pass: 2026-05-25.

This document defines the canonical cured-meat classes used when normalising
Nordic grocery SKUs. It covers Swedish, Norwegian, Icelandic, and English
nomenclature; parser attributes for cut/fat/preparation; and chain-level SKU
examples that show how bacon, ham, salami, sausage, and air-dried meats appear
across Sweden, Norway, and Iceland.

## Normalisation rules

1. Treat curing/smoking/drying as `preparation`, not a species. Keep animal,
   cut, fat band, casing/slice form, and heat-treatment separate.
2. Prefer explicit title signals such as `bacon`, `rökt skinka`, `spekeskinke`,
   `hráskinka`, or `salami` over category text.
3. Preserve local spelling (`skinka`, `skinke`, `skinka`, `beikon`, `pepperóní`)
   as aliases so search and classifier fixtures can match retailer language.
4. Use labelled nutrition for `fat_percent` when available. If no exact number
   exists, emit the fallback `fat_percent_band` below and set
   `fat_percent_source=fallback_class_band`.
5. Flavours (`peppar`, `vitlök`, `jalapeño`, `truffle`, `paprika`) are
   preparation/flavour attributes. Do not split a separate class for each.

## Canonical classes and local nomenclature

| Canonical class | Swedish labels | Norwegian labels | Icelandic labels | English labels | Core attributes |
| --- | --- | --- | --- | --- | --- |
| `cured_bacon` | bacon, sidfläsk, stekfläsk | bacon, sideflesk | beikon, svínasíða | bacon, streaky bacon, pork belly bacon | `animal=pork`, `cut=belly_or_side`, `preparation=cured_smoked_or_cured`, `slice_form=sliced_or_diced` |
| `cured_cooked_ham` | kokt skinka, rökt skinka, smörgåsskinka | kokt skinke, røkt skinke, familieskinke | skinka, reykt skinka | cooked ham, smoked ham, sandwich ham | `animal=pork`, `cut=ham_leg_or_shoulder`, `preparation=cured_cooked_or_smoked`, `slice_form=sliced` |
| `cured_air_dried_ham` | lufttorkad skinka, parmaskinka, serranoskinka, prosciutto | spekeskinke, parmaskinke, serranoskinke | hráskinka, parmaskinka, serrano skinka | air-dried ham, prosciutto, Parma ham, Serrano ham | `animal=pork`, `cut=ham_leg`, `preparation=air_dried_cured`, `slice_form=thin_sliced` |
| `cured_salami` | salami, pepparsalami, milanosalami | salami, peppersalami | salami | salami | `animal=pork_or_mixed`, `cut=ground_mixed`, `preparation=fermented_dried`, `slice_form=sliced_or_whole` |
| `cured_spicy_sausage` | chorizo, pepperoni, ölkorv | chorizo, pepperoni, spekepølse | chorizo, pepperóní, kryddpylsa | chorizo, pepperoni, cured spicy sausage | `animal=pork_or_mixed`, `cut=ground_mixed`, `preparation=fermented_smoked_or_dried`, `slice_form=sliced_or_piece` |
| `cured_smoked_lamb` | rökt lamm, lammstek rökt | røkt lammelår, fenalår | hangikjöt, reykt lambakjöt | smoked lamb, cured lamb leg | `animal=lamb`, `cut=leg_or_mixed`, `preparation=cured_smoked`, `slice_form=sliced_or_piece` |

## Fat-percent, cut, and preparation attributes

| Canonical class | Typical labelled/fallback fat band | Parser value guidance | Common preparations |
| --- | --- | --- | --- |
| `cured_bacon` | 25-45% fat | Use exact nutrition when captured; belly/side bacon is high-fat even when smoked or diced. | `cured`, `smoked`, `sliced`, `diced`, `streaky`, `ready_to_eat` |
| `cured_cooked_ham` | 2-8% fat | Sandwich ham and cooked/smoked ham are lean; preserve smoked/cooked as preparation. | `cured`, `cooked`, `smoked`, `sliced`, `whole_piece` |
| `cured_air_dried_ham` | 4-18% fat | Prosciutto/Parma/Serrano/spekeskinke are dry-cured leg cuts; rind/fat edge can vary. | `air_dried`, `dry_cured`, `thin_sliced`, `ready_to_eat` |
| `cured_salami` | 20-35% fat | Fermented/dried ground meat; use `animal=mixed` if beef/pork is blended. | `fermented`, `dried`, `sliced`, `whole_sausage`, `pepper` |
| `cured_spicy_sausage` | 25-40% fat | Chorizo/pepperoni/spekepølse often carries paprika/chili flavour. Keep spice separate. | `fermented`, `smoked`, `dried`, `paprika`, `chili`, `pizza_sliced` |
| `cured_smoked_lamb` | 8-20% fat | Icelandic/Norwegian lamb examples should not be forced into pork ham classes. | `cured`, `smoked`, `sliced`, `holiday`, `ready_to_eat` |

## SKU evidence by chain

Rows below give at least five SKU/title examples per reference chain. Source
links point to retailer product/search/category pages that expose the relevant
nomenclature; live assortment and store-specific availability can change.

| Country | Chain | Five SKU/title examples | Source notes |
| --- | --- | --- | --- |
| Sweden | ICA | `Bacon Skivat ICA`; `Tärnat Bacon ICA`; `Rökt Skinka ICA`; `Lufttorkad Skinka ICA Selection`; `Salami Milano Zeta` | ICA search/product evidence for [bacon](https://handla.ica.se/sok?q=bacon), [rökt skinka](https://handla.ica.se/sok?q=r%C3%B6kt%20skinka), [lufttorkad skinka](https://handla.ica.se/sok?q=lufttorkad%20skinka), [salami](https://handla.ica.se/sok?q=salami), and [chorizo/pepperoni](https://handla.ica.se/sok?q=chorizo). |
| Sweden | Willys | `Bacon Skivat Garant`; `Bacon Tärnat Garant`; `Rökt Skinka Skivad`; `Serranoskinka`; `Pepparsalami` | Willys search evidence for [bacon](https://www.willys.se/sok?q=bacon), [skinka](https://www.willys.se/sok?q=skinka), [serranoskinka](https://www.willys.se/sok?q=serranoskinka), [salami](https://www.willys.se/sok?q=salami), and [pepperoni](https://www.willys.se/sok?q=pepperoni). |
| Sweden | Coop | `Coop Bacon`; `Coop Tärnat Bacon`; `Coop Rökt Skinka`; `Parmaskinka`; `Chorizo Skivad` | Coop search/category evidence for [bacon](https://www.coop.se/handla/sok/?q=bacon), [rökt skinka](https://www.coop.se/handla/sok/?q=r%C3%B6kt%20skinka), [parmaskinka](https://www.coop.se/handla/sok/?q=parmaskinka), [salami](https://www.coop.se/handla/sok/?q=salami), and [chorizo](https://www.coop.se/handla/sok/?q=chorizo). |
| Norway | MENY | `Stjernebacon`; `Smårettbacon`; `Kokt Skinke`; `Spekeskinke`; `Chorizo` | MENY search/category evidence for [bacon](https://meny.no/sok/?query=bacon), [kokt skinke](https://meny.no/sok/?query=kokt%20skinke), [spekeskinke](https://meny.no/sok/?query=spekeskinke), [salami](https://meny.no/sok/?query=salami), and [chorizo](https://meny.no/sok/?query=chorizo). |
| Norway | REMA 1000 | `Bacon`; `Terningbacon`; `Kokt Skinke`; `Spekeskinke`; `Pepperoni` | REMA search/recipe evidence for [bacon](https://www.rema.no/sok/?q=bacon), [skinke](https://www.rema.no/sok/?q=skinke), [spekeskinke](https://www.rema.no/sok/?q=spekeskinke), [salami](https://www.rema.no/sok/?q=salami), and [pepperoni](https://www.rema.no/sok/?q=pepperoni). |
| Norway | KIWI | `Folkets Bacon`; `First Price Bacon`; `Kokt Skinke`; `Spekeskinke`; `Salami` | KIWI search/recipe evidence for [bacon](https://kiwi.no/sok/?q=bacon), [skinke](https://kiwi.no/sok/?q=skinke), [spekeskinke](https://kiwi.no/sok/?q=spekeskinke), [salami](https://kiwi.no/sok/?q=salami), and [chorizo](https://kiwi.no/sok/?q=chorizo). |
| Iceland | Krónan | `Beikon sneiðar`; `Skinka sneiðar`; `Hráskinka`; `Salami`; `Pepperóní` | Krónan search/product evidence for [beikon](https://kronan.is/search?q=beikon), [skinka](https://kronan.is/search?q=skinka), [hr%C3%A1skinka](https://kronan.is/search?q=hr%C3%A1skinka), [salami](https://kronan.is/search?q=salami), and [pepper%C3%B3n%C3%AD](https://kronan.is/search?q=pepper%C3%B3n%C3%AD). |

## Fixture recommendations

For automated classifier tests, include at least one fixture per language and
class:

- Swedish: `Bacon Skivat`, `Tärnat Bacon`, `Rökt Skinka`, `Lufttorkad Skinka`,
  `Salami Milano`, `Chorizo`, `Pepperoni`.
- Norwegian: `Stjernebacon`, `Kokt Skinke`, `Røkt Skinke`, `Spekeskinke`,
  `Salami`, `Chorizo`, `Pepperoni`.
- Icelandic: `Beikon`, `Skinka`, `Hráskinka`, `Salami`, `Pepperóní`,
  `Hangikjöt`.

Expected parse examples:

```json
[
  {
    "raw": "Bacon Skivat Garant",
    "class": "cured_bacon",
    "animal": "pork",
    "cut": "belly_or_side",
    "preparation": ["cured", "smoked", "sliced"],
    "fat_percent": null,
    "fat_percent_band": "25-45",
    "fat_percent_source": "fallback_class_band"
  },
  {
    "raw": "Spekeskinke skivet",
    "class": "cured_air_dried_ham",
    "animal": "pork",
    "cut": "ham_leg",
    "preparation": ["dry_cured", "thin_sliced"],
    "fat_percent": null,
    "fat_percent_band": "4-18",
    "fat_percent_source": "fallback_class_band"
  },
  {
    "raw": "Pepperóní sneiðar",
    "class": "cured_spicy_sausage",
    "animal": "pork_or_mixed",
    "cut": "ground_mixed",
    "preparation": ["fermented", "dried", "pizza_sliced"],
    "fat_percent": null,
    "fat_percent_band": "25-40",
    "fat_percent_source": "fallback_class_band"
  }
]
```

## Production caveats

- `skinka/skinke/skinka` can mean cooked ham, smoked ham, or air-dried ham.
  Require `parma`, `serrano`, `prosciutto`, `spek`, or `hráskinka` before using
  `cured_air_dried_ham`.
- `baconost`, `baconchips`, and bacon-flavoured snacks are out of scope unless
  the SKU is a meat product.
- `pepperoni` can be a pizza topping or a whole cured sausage; keep `slice_form`
  separate from class.
- `hangikjöt`/`fenalår` are lamb/sheep cured meats and must not be mapped to
  pork ham even when sliced like deli ham.
- Retailer search pages are date/store sensitive. Once ingestion captures a
  product title and nutrition snapshot, prefer that fixture over live search
  output for tests.
