# Mushrooms product-class map

Status: operator reference for GroceryView product-class matching.
Ticket: factory-tickets #1708.
Last evidence pass: 2026-05-25.

This document defines the canonical mushroom sub-classes used when normalising
Nordic grocery SKUs.  It focuses on produce/fresh-food feeds where the retailer
category is equivalent to Swedish `Frukt & Grönt > Svamp`, Norwegian
`Frukt og grønt > Grønnsaker > Sopp`, or Icelandic `Vöruúrval > Grænmeti` /
`sveppir`.  Dry, canned, frozen, and in-water mushrooms keep the same variety
class with a preparation attribute rather than becoming separate product
classes.

## Normalisation rules

1. Prefer the explicit variety in the SKU title over the retailer category.  A
   title such as `Portabello Svamp Klass 1` is `mushroom_portobello` even though
   its category is only `Svamp`.
2. Keep `variety`, `preparation`, `cut`, `packaging`, `organic`, and `origin`
   separate.  `torkad`, `konserverad`, `i vatten`, `skivade`, `hela`, `eko`,
   `KRAV`, and pack size are modifiers, not sub-classes.
3. Use chain category as a guardrail.  Accept generic `svamp`/`sopp`/`sveppir`
   titles only when the category is food produce, canned vegetables, dried
   mushrooms, or a recipe/assortment page that clearly concerns edible
   mushrooms.  Reject household sponges such as `kökssvamp`.
4. Map biological relatives to the retail class that shoppers expect.  For
   example, portobello is a mature brown button mushroom, but retail titles and
   shelf navigation treat it as its own class.
5. Keep chain/language spellings as aliases.  Swedish feeds use both
   `portabello` and `portabella`; Norwegian feeds often use `champignon` for
   white button mushrooms and `aromasopp` for brown/chestnut mushrooms.
6. If a SKU only says `svamp`, `sopp`, `sveppir`, or `mushrooms` and no
   ingredient/variety is visible, emit `mushroom_generic_unknown` and do not
   infer champignon from the category alone.

## Canonical sub-classes and local nomenclature

| Canonical class | Varieties that belong | Swedish aliases | Norwegian aliases | Icelandic aliases | English aliases | SKU/category recognition |
| --- | --- | --- | --- | --- | --- | --- |
| `mushroom_white_button` | White button/closed-cup cultivated Agaricus; baby button if white; loose or packaged white champignons. | champinjon, champinjoner, vita champinjoner, vit champinjon | champignon, sjampinjong, hvit sjampinjong, små champignon | hvítir matsveppir, hvítir sveppir, ætisveppir | white button mushroom, white champignon, button mushroom | Title token `champinjon(er)`/`champignon` without brown/chestnut/skog/aroma/portobello qualifiers; category `Svamp`/`Sopp`/`sveppir`. |
| `mushroom_brown_chestnut` | Brown/chestnut/cremini mushrooms, including Swedish `skogschampinjon` retail wording and Norwegian `aromasopp`. | kastanjechampinjon, kastanjechampinjoner, bruna champinjoner, skogschampinjon, skogschamp | aromasopp, brun champignon, brun sjampinjong, kastanjesopp | kastaníusveppir, brúnir sveppir | chestnut mushroom, brown mushroom, cremini, baby bella | Tokens `kastanje`, `brun`, `skogschamp`, `aroma`, `cremini`; do not collapse to white button just because `champinjon` appears. |
| `mushroom_portobello` | Large mature Agaricus caps sold for grilling/stuffing; portobello/portabello packs. | portabello, portabella, portobello, portabellosvamp | portobello, portobellosopp | portobello sveppir, portobello | portobello, portobella, grill mushroom | Tokens `portabell`, `portobell`; usually pack sizes around one or two large caps.  Override brown/chestnut class. |
| `mushroom_oyster` | Common oyster mushrooms, excluding king oyster/eryngii when named. | ostronskivling | østerssopp | ostrusveppir | oyster mushroom | Tokens `ostronskivling`, `østerssopp`, `ostrusvepp`, `oyster`; if `king`/`konge`/`kejsarhatt` also appears, use `mushroom_king_oyster`. |
| `mushroom_king_oyster` | King oyster/eryngii/kung oyster; thick-stemmed Pleurotus eryngii sold as a premium/exotic mushroom. | kejsarhatt, kungsmussling, eryngii | kongeøsterssopp, king oyster, eryngii | king oyster, eryngii (rare; no stable public retail alias found) | king oyster, king trumpet, eryngii, French horn mushroom | Tokens `kejsarhatt`, `kungsmussling`, `kongeøsters`, `king oyster`, `king trumpet`, `eryngii`. |
| `mushroom_shiitake` | Fresh, dried, or canned shiitake. | shiitake, shiitakesvamp, shi-take, shitake | shiitake, shiitakesopp | shiitake sveppir, shiitake-sveppir | shiitake | Tokens `shiitake`, `shi-take`, `shitake`; preserve `preparation=dried`/`canned` when present. |
| `mushroom_chanterelle` | Yellow chanterelles and funnel/winter chanterelles. | kantarell, kantareller, gul kantarell, gula kantareller, trattkantarell, trattkantareller | kantarell, kantareller, traktkantarell | kantarellur, kantarellusveppir | chanterelle, golden chanterelle, funnel chanterelle | Tokens `kantarell`, `trattkantarell`, `traktkantarell`, `chanterelle`.  Keep `tratt/funnel` as `subvariety=funnel_chanterelle`. |
| `mushroom_porcini_boletus` | Porcini/cep/king bolete/Karl Johan/steinsopp, fresh or dried. | karljohan, karljohansvamp, Karl Johan-svamp, stensopp, porcini | steinsopp, porcini, cep | kóngssveppur, ætiboldungur, porcini | porcini, cep, cèpe, king bolete, boletus | Tokens `karljohan`, `stensopp`, `steinsopp`, `porcini`, `cep`, `boletus`, `kóngssvepp`. |
| `mushroom_enoki` | Enoki/enokitake packs. | enoki, enokisvamp | enoki, enokisopp | enoki sveppir | enoki, enokitake | Tokens `enoki` or `enokitake`; usually long white stems in small packs. |
| `mushroom_other_named` | Named edible mushrooms not covered above, such as shimeji, maitake, nameko, lion's mane, pom-pom, pioppino. | shimeji, maitake, nameko, lions mane, igelkottstaggsvamp, pom pom | shimeji, maitake, lions mane, piggsvinsopp where used | shimeji, maitake, lions mane, sveppir | shimeji, maitake, nameko, lion's mane | Use only when a named edible mushroom token is visible; set `variety_token` to the raw name for later promotion. |
| `mushroom_mixed_pack` | Mixed fresh/dried mushroom packs or blends where no single variety dominates. | svampmix, blandad svamp, blandade svampar, skogssvamp, exotisk svampmix | soppblanding, blandet sopp, skogssoppblanding | sveppablanda, blandaðir sveppir, blandaðir matsveppir | mushroom mix, mixed mushrooms, forest mushroom mix | Tokens `mix`, `bland`, `blanda`, `skogssvamp`, `forest mushroom`; if ingredient order is available, also emit child varieties. |
| `mushroom_generic_unknown` | Edible mushroom SKU/category evidence without a visible variety. | svamp, matsvamp | sopp, matsopp | sveppir, matsveppir, ætisveppir | mushrooms | Use only with a food mushroom category/ingredient context.  Do not use for `kökssvamp`, cleaning sponges, or flavour names in non-mushroom products. |

## Recognition details by chain/category

| Chain/country | Category hints | Positive title cues | Negative title cues |
| --- | --- | --- | --- |
| ICA Sweden | `Frukt & Grönt > Svamp` plus subcategories `Champinjoner`, `Kantareller`, `Portabello`, `Ostronskivling`, `Shiitake`, `Torkad svamp`, `Övrig svamp`. | ICA titles commonly contain `Klass 1`, pack size, brand (`ICA`, `ICA I love eco`), and the exact variety: `Champinjon`, `Kastanjechampinjon`, `Portabello`, `Ostronskivling`, `Shiitake`, `Karl Johan-svamp`. | `Svampkniv`, cooking accessories, or recipe suggestions should not become produce SKUs. |
| Coop Sweden | Product API category path `Frukt & Grönsaker > Grönsaker > Svamp`; product URLs include `/svamp/`. | Coop titles may be very short (`Champinjoner`, `Portabello`, `Shiitake Eko`, `Svamp Kastanjechampinjon`), so category evidence is important. | `Kökssvamp` and cleaning products can appear in `svamp` search results; reject unless category path is food/produce. |
| Willys Sweden | Product pages/search results under edible assortment; fresh items often include `Klass 1` and brand `Garant`. | `Champinjoner Klass 1`, `Skogschamp Svamp Import Klass 1`, `Ostronskivling Klass 1`, `Svamp Shi-take Eko Klass 1`, `Enoki Svamp Kl1`. | Non-food search hits and prepared foods with mushroom flavour should be parsed as ingredient/flavour, not produce class, unless the category is edible mushroom. |
| Lidl Sweden | Campaign/product pages often sit under `Mat & dryck > Frukt & grönsaker`; supplier pages use `Våra varor > Frukt & grönt`. | Public examples include `Vita champinjoner` campaign SKUs, Vitasia `Konserverad shiitakesvamp`, and supplier copy naming `vita champinjoner`, `kastanjechampinjoner`, and `portabello`. | Lidl campaign pages expire; retain captured product id/title/date in fixtures rather than relying on the live page to stay available. |
| Norwegian feeds | Category usually `Frukt og grønt > Grønnsaker > Sopp`. | `Champignon`, `Aromasopp`, `Portobello Sopp`, `Shiitakesopp`, `Østerssopp`, `Kongeøsterssopp`, `Steinsopp`, `Kantarell`. | `Soppekstrakt`, sauces, soups, and ready meals should be ingredient/flavour records unless the product itself is a mushroom SKU. |
| Icelandic feeds | Category/search terms often use `sveppir`; recipes and grocery pages may expose ingredient wording. | `hvítir matsveppir`, `kastaníusveppir`, `portobello sveppir`, `ostrusveppir`, `shiitake sveppir`, `kantarellur`, `kóngssveppur`. | Generic `sveppir` in a prepared dish is an ingredient cue, not a produce SKU, unless the product/category is fresh/dried/canned mushrooms. |

## Preparation and parser attributes

| Attribute | Values / guidance | Examples |
| --- | --- | --- |
| `variety` | Canonical class suffix (`white_button`, `portobello`, `shiitake`, etc.). | `mushroom_shiitake` emits `variety=shiitake`. |
| `subvariety` | Optional when the title distinguishes a subtype but class stays shared. | `trattkantareller` -> `subvariety=funnel_chanterelle`; `baby champinjoner` -> `subvariety=baby_button`. |
| `preparation` | `fresh`, `dried`, `canned`, `in_water`, `frozen`, `raw`, `cooked`. | `Karl Johan-svamp torkad` -> `dried`; `Kantareller i Vatten` -> `canned`, `in_water`. |
| `cut` | `whole`, `sliced`, `halves`, `pieces`, `powder` when visible. | `Champinjoner Skivade` -> `cut=sliced`; `Champinjoner Hela` -> `cut=whole`. |
| `packaging` | `loose_weight`, `tray`, `bag`, `jar`, `can`, `tin`, `basket`, `mix_pack`. | Coop loose weighted products expose variants such as `ca 250 g`; Willys/ICA packaged packs give fixed grams. |
| `organic` | Boolean from `Eko`, `Ekologisk`, `KRAV`, `Debio`, or equivalent. | `Shiitake Eko`, `Ostronskivling Ekologisk`, `Garant Eko`. |
| `class_confidence` | `high` when title has a variety token; `medium` for generic mushroom title plus produce category; `low` when only recipe/ingredient text is available. | `Portabello` in Coop `/svamp/` page is high; generic `svamp` in a recipe is low/non-SKU. |

## SKU evidence by chain

The rows below give retailer SKU/title examples captured during the evidence
pass.  Source URLs point to retailer product, category, campaign, or public
search/API pages that expose the nomenclature; live assortment and store-specific
availability may change.

| Country | Chain | SKU/title examples | Source notes |
| --- | --- | --- | --- |
| Sweden | ICA | `Champinjon 250g Klass 1 ICA`; `Kastanjechampinjoner 250g ICA`; `Portabello 200g Klass 1 ICA`; `Ostronskivling Ekologisk 150g Klass 1 ICA I love eco`; `Shiitake Ekologisk 150g Klass 1 ICA I love eco`; `Karl Johan-svamp torkad Klass 1`; `Trattkantareller Klass 1 150g ICA` | ICA product/category pages: [champinjon](https://handla.ica.se/produkt/2041870), [kastanjechampinjoner](https://handla.ica.se/produkt/2076191), [portabello](https://handla.ica.se/produkt/1510797), [ostronskivling](https://handla.ica.se/produkt/1510798), [shiitake](https://handla.ica.se/produkt/1510800), [Karl Johan](https://handla.ica.se/produkt/1510203), [trattkantareller](https://handla.ica.se/produkt/1510774), and ICA `Svamp` category [4733](https://handla.ica.se/kategori/4733). |
| Sweden | Coop | `Champinjoner` (id `2317408500000`); `Svamp Kastanjechampinjon` (`2317464600003`); `Portabello` (`2317465000000`); `Shiitake Eko` (`7300156503640`); `Kantareller` (`7312450002361`); `Ostronskivling Eko` (`7300156503633`) | Coop product pages/API category path `Frukt & Grönsaker > Grönsaker > Svamp`: [champinjoner](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/svamp/champinjoner-2317408500000/), [kastanjechampinjon](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/svamp/svamp-kastanjechampinjon-2317464600003/), [portabello](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/svamp/portabello-2317465000000/), [shiitake eko](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/svamp/shiitake-eko-7300156503640/), [kantareller](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/svamp/kantareller-7312450002361/), [ostronskivling eko](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/svamp/ostronskivling-eko-7300156503633/). |
| Sweden | Willys | `Champinjoner Klass 1` (`Garant`, `250g`, `101086165_ST`); `Portabello Svamp Klass 1` (`Garant`, `280g`, `101220019_ST`); `Skogschamp Svamp Import Klass 1` (`Garant`, `250g`, `101220061_ST`); `Ostronskivling Klass 1` (`Garant`, `200g`, `101220020_ST`); `Svamp Shi-take Eko Klass 1` (`Garant Eko`, `150`, `101326484_ST`); `Enoki Svamp Kl1` (`100g`, `101412878_ST`) | Willys product/search evidence: [champinjoner](https://www.willys.se/produkt/Champinjoner-Klass-1-101086165_ST), [portabello](https://www.willys.se/produkt/Portabello-Svamp-Klass-1-101220019_ST), [skogschamp](https://www.willys.se/produkt/Skogschamp-Svamp-Import-Klass-1-101220061_ST), [ostronskivling](https://www.willys.se/produkt/Ostronskivling-Klass-1-101220020_ST), [shi-take eko](https://www.willys.se/produkt/Svamp-Shi-take-Eko-Klass-1-101326484_ST), [enoki](https://www.willys.se/produkt/Enoki-Svamp-Kl1-101412878_ST), and [search?q=svamp](https://www.willys.se/search?q=svamp). |
| Sweden | Lidl | `Vita champinjoner` (`250 g`, product id `p10041422`); `Vita champinjoner` (`400 g`, product id `p10038697`); `Konserverad shiitakesvamp` (`Vitasia`, `314 ml`, product id `p10036088`); supplier/assortment evidence naming `vita champinjoner`; supplier/assortment evidence naming `kastanjechampinjoner`; supplier/assortment evidence naming `portabello` | Lidl campaign/supplier pages: [vita champinjoner 250 g](https://www.lidl.se/p/vita-champinjoner/p10041422), [vita champinjoner 400 g](https://www.lidl.se/p/vita-champinjoner/p10038697), [konserverad shiitakesvamp](https://www.lidl.se/p/vitasia-konserverad-shiitakesvamp/p10036088), and Lidl supplier page [Östgötasvamp](https://www.lidl.se/c/destination-lidl-ostgotasvamp/s10020166) documenting white champignons, chestnut champignons, portobello, and Lidl's fruit-and-veg department. |
| Norway | Oda/MENY wording cross-check | `Små Champignon`; `Aromasopp`; `Portobello Sopp i Beger`; `Shiitakesopp i Beger`; `Østerssopp i Beger`; `Kongeøsterssopp`; `Steinsopp` | Oda `Sopp` category lists `Champignon`, `Aromasopp`, `Portobello`, `Shiitakesopp`, and `Østerssopp`: [Oda sopp](https://oda.com/no/categories/20-frukt-og-gront/22-gronnsaker/1024-sopp/). MENY/FRUKT.no wording confirms common names such as `champignon`, `aromasopp`, `portobello`, `kantarell`, `østerssopp`, `shiitake`, `steinsopp`, and `kongeøsterssopp`: [MENY sopp guide](https://meny.no/tema/frukt-gront/sopp/ulike-typer-sopp/), [FRUKT.no kongeøsterssopp](https://www.frukt.no/ravarer/gronnsaker/sopp/kongeosterssopp/). |
| Iceland | Krónan / Icelandic terminology cross-check | `blandaðir sveppir, t.d. kastaníusveppir og ostrusveppir`; `shiitake sveppir`; `portobello sveppir`; `hvítir matsveppir`; `kóngssveppur` | Icelandic sources for locale aliases: Krónan recipe with `kastaníusveppir` and `ostrusveppir` ([Sveppastroganoff](https://kronan.is/uppskriftir/sveppastroganoff)); Krónan products/ingredients with `shiitake sveppir` ([example](https://www.kronan.is/vara/100269273-tokyo-sushi-yaki-udon-nudlur-med-tofu)); Íslenskt grænmeti pages for `portobello sveppir`, `hvítir matsveppir`, and `kastaníusveppir` ([portobello](https://islenskt.is/vara/portobello-sveppir/), [Flúðasveppir](https://islenskt.is/bondi/fludasveppir/)); Nordic food-mushroom guidance for `kóngssveppur`/`steinsopp`/porcini terminology ([Mushrooms traded as food PDF](https://norden.diva-portal.org/smash/get/diva2%3A733528/FULLTEXT01.pdf)). |

## Fixture recommendations

For automated classifier tests, include one fixture per class and one generic
negative example:

- Swedish: `Champinjon 250g Klass 1 ICA`, `Kastanjechampinjoner 250g ICA`,
  `Portabello 200g Klass 1 ICA`, `Ostronskivling Ekologisk 150g`,
  `Shiitake Ekologisk 150g`, `Karl Johan-svamp torkad`, `Enoki Svamp Kl1`,
  `Svampmix torkad`, and negative `Kökssvamp 10-pack`.
- Norwegian: `Små Champignon`, `Aromasopp`, `Portobello Sopp i Beger`,
  `Østerssopp i Beger`, `Shiitakesopp i Beger`, `Kongeøsterssopp`,
  `Steinsopp`, `Soppblanding`.
- Icelandic: `hvítir matsveppir`, `kastaníusveppir`, `portobello sveppir`,
  `ostrusveppir`, `shiitake sveppir`, `kantarellur`, `kóngssveppur`,
  `blandaðir sveppir`.

Expected core parse examples:

```json
[
  {
    "raw": "Kastanjechampinjoner 250g ICA",
    "class": "mushroom_brown_chestnut",
    "variety": "brown_chestnut",
    "preparation": ["fresh", "raw"],
    "cut": "whole",
    "organic": false,
    "class_confidence": "high"
  },
  {
    "raw": "Svamp Shi-take Eko Klass 1 Garant Eko 150",
    "class": "mushroom_shiitake",
    "variety": "shiitake",
    "preparation": ["fresh", "raw"],
    "organic": true,
    "class_confidence": "high"
  },
  {
    "raw": "Trattkantareller Klass 1 150g ICA",
    "class": "mushroom_chanterelle",
    "variety": "chanterelle",
    "subvariety": "funnel_chanterelle",
    "preparation": ["fresh", "raw"],
    "class_confidence": "high"
  },
  {
    "raw": "Champinjoner Skivade Eldorado 290g",
    "class": "mushroom_white_button",
    "variety": "white_button",
    "preparation": ["canned"],
    "cut": "sliced",
    "class_confidence": "high"
  },
  {
    "raw": "Kökssvamp 10-pack",
    "class": null,
    "reject_reason": "household_sponge_not_food_mushroom"
  }
]
```

## Production caveats

- `Skogschamp` in Swedish retail feeds is a brown/chestnut champignon cue, not a
  wild forest-mushroom mix by itself.
- `Portabello`/`Portabella` spelling is common in Swedish retailer titles; match
  both spellings and canonicalise to `portobello`.
- `Sopp` in Norwegian means mushroom, while Swedish `sopp` means soup.  Use the
  feed language and category before matching `sopp` as a mushroom token.
- `Kantarell` appears in sauces, soups, cheeses, and ready meals.  Only classify
  as produce/dried/canned mushroom when the SKU itself is mushroom or the chain
  category is edible mushrooms.
- Lidl campaign pages are date-bound and may return 404 after the promotion.
  Fixture data should keep the captured product id, title, pack size, and date
  rather than depending on live availability.
- Product evidence changes by store/date.  Parser tests should use ingestion
  snapshots where available, and these public pages as nomenclature examples.
