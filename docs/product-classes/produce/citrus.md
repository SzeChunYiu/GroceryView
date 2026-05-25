# Produce class: citrus

Purpose: define the fresh-produce citrus equivalence class for SKU
normalization and chain-category matching. This class is only for edible,
fresh citrus fruit sold whole, loose, in nets, or in multipacks. It excludes
juice, soda, marmalade, candy, tea, seasoning, cleaners, and other products
whose names only contain a citrus flavour or fragrance.

## Class boundary

Accept a SKU as citrus when both conditions are true:

1. **Name evidence:** the SKU name contains one of the citrus terms or known
   variety names in the subclass table below, including locale variants and
   ordinary Swedish spelling/case/diacritics.
2. **Produce context:** the chain category/path is fresh produce, preferably a
   citrus-specific shelf. When the chain exposes only a broad produce shelf,
   require a strict name hit and reject flavour-only terms such as
   `apelsinjuice`, `apelsinkrokant`, `citronpeppar`, `limeblad`, `lemonad`,
   `marmelad`, `saft`, `läsk`, or `te`.

Use package size, organic labels, country of origin, and grade labels (for
example `Klass 1`) as attributes, not as subclass identifiers.

## Chain category recognition

| Chain | Preferred positive category/path | Recognition notes |
| --- | --- | --- |
| ICA | `Frukt & Grönt > Frukt > Citrusfrukt`; category page `handla.ica.se/kategori/678` | ICA product names often include variety, pack size, grade, and `ICA`/`ICA I love eco`. Store-scoped pages may surface citrus under `Övrigt`; if so, require a strict citrus name token. |
| Coop | URL/category path `frukt-gronsaker/frukt-bar/citrusfrukt` | Coop uses the combined `frukt-bar` path. Treat this as fresh fruit; require the final `citrusfrukt` segment or a strict citrus name token. |
| Willys | Fresh produce shelf `Frukt&Grönt`/`Frukt`; search API category facet `Frukt` | Willys search responses can expose only the broad `Frukt` category, so never accept broad category alone. Pair it with a strict name token such as `Citron Klass 1`, `Lime Klass 1`, or `Apelsin Klass 1`. |
| Lidl | Product pages under `lidl.se/p/...` with fresh-produce breadcrumb `Mat & dryck > Frukt & grönsaker`, or weekly fresh fruit offers | Lidl weekly pages may omit a narrow shelf. Accept only when the product name itself is a fresh citrus fruit (`Apelsiner`, `Citroner`, `Röda apelsiner`, etc.) and reject drinks or branded processed products. |

## Subclasses

| Subclass | Belongs here | Exclude / split out | SKU-name recognition |
| --- | --- | --- | --- |
| `orange` | Sweet oranges, navel oranges, red/navel oranges, jumbo oranges, orange multipacks and nets. | Blood oranges belong to `blood_orange`; orange juice/drinks/flavoured foods are processed products. | `apelsin`, `orange`, `navel`, `jumbo apelsin`; require whole fruit wording or fresh produce shelf. |
| `blood_orange` | Blood/red oranges including Tarocco/Tarrocco, Moro, Sanguinello, and SKUs named `röd apelsin`/`röda apelsiner`. | Orange-flavoured beverages, candy, chocolate. | `blodapelsin`, `röd apelsin`, `röda apelsiner`, `tarocco`, `tarrocco`, `moro`, `sanguinello`. |
| `mandarin_family` | Mandarins and easy-peel citrus: clementine, clemenules, clemenpons, satsuma/satsumas, tangerine, minneola/tangelo, and named seasonal easy-peel varieties such as Leanri when sold as citrus. | Juice, marmalade, flavour-only SKUs. | `clementin`, `klementin`, `clemenules`, `clemenpons`, `satsumas`, `satsuma`, `mandarin`, `tangerin`, `tangelo`, `minneola`, `leanri`, `blodclementin`. |
| `lemon` | Yellow lemons, organic lemons, snack lemons, lemon packs/nets. | Lemon juice bottles, lemon pepper, lemon tea, cleaning products, `citronmeliss` herbs. | `citron`, `citroner`, `lemon`, `snackcitron`; require fresh fruit context if the token appears in ingredients or flavour copy. |
| `lime` | Persian/Tahitian/key-style limes sold as whole limes, loose or multipack, including organic 3-packs. | Lime juice, lime leaves, kaffir/makrut leaves, flavoured drinks. | `lime`, `limefrukt`, `límóna`; require whole-fruit packaging (`1-pack`, `3-pack`, loose, kg/st) or citrus shelf. |
| `grapefruit` | Red, pink, white/yellow grapefruit; SKUs abbreviated as Swedish `grape`. | Grape/raisin products in English contexts, grape soda/candy. | `grapefrukt`, `grape röd`, `röd grape`, `pink grapefruit`, `vit grapefrukt`; treat bare English `grape` as not citrus unless Swedish fresh-produce context says grapefruit. |
| `pomelo` | Pomelo, honey pomelo, sweetie/oroblanco when merchandised as citrus. | Melons or other large fruit without pomelo naming. | `pomelo`, `honungspomelo`, `sweetie`, `oroblanco`. |
| `mixed_citrus` | Mixed citrus bags where more than one citrus subclass is intentionally bundled and no single fruit dominates. | Fruit baskets/mixed fruit bags containing non-citrus fruit; classify those as mixed fruit, not citrus. | `citrusmix`, `citrus mix`, `blandade citrusfrukter`, `mixed citrus`. |

## Locale alternate names

| Subclass | Swedish (`sv`) | Norwegian Bokmål (`nb`) | Icelandic (`is`) |
| --- | --- | --- | --- |
| `orange` | apelsin, navelapelsin, apelsiner | appelsin, appelsiner | appelsína, appelsínur |
| `blood_orange` | blodapelsin, röd apelsin | blodappelsin, rød appelsin | blóðappelsína, rauð appelsína |
| `mandarin_family` | clementin, klementin, mandarin, satsumas, småcitrus | klementin, mandarin, satsuma, småsitrus | klementína, mandarína, satsúma, smásítrus |
| `lemon` | citron, citroner | sitron, sitroner | sítróna, sítrónur |
| `lime` | lime, limefrukt | lime, limefrukt | límóna, límónur |
| `grapefruit` | grapefrukt, grape, röd grape | grapefrukt | greipaldin, greip |
| `pomelo` | pomelo, honungspomelo, sweetie | pomelo, honningpomelo, sweetie | pomeló, hunangspomeló |
| `mixed_citrus` | citrusfrukter, citrusmix | sitrusfrukter, sitrusmiks | sítrusávextir, sítrusblanda |

## Real SKU examples

These examples were checked against public chain pages/API responses on
2026-05-24 and are intended as classifier fixtures, not price guarantees.

| Chain | Example SKU | Evidence URL | Classification note |
| --- | --- | --- | --- |
| ICA | `Sel Apelsin jumbo 4-pack Klass 1 ICA` | `https://handla.ica.se/kategori/678` | ICA citrus category lists the SKU under `Citrusfrukt`; classify as `orange`. |
| ICA | `Citron ca 200g Klass 1 ICA` | `https://handlaprivatkund.ica.se/stores/1003883` | Store-scoped ICA page shows a fresh lemon SKU; classify as `lemon`. |
| Coop | `Clementiner Clemenules/Clemenpons/Clemen` | `https://www.coop.se/handla/varor/frukt-gronsaker/frukt-bar/citrusfrukt/clementiner-clemenules-clemenpons-clemen-7300156590268` | Coop citrus URL and clementine variety names; classify as `mandarin_family`. |
| Coop | `Lime 3-pack Eko` | `https://www.coop.se/handla/varor/frukt-gronsaker/frukt-bar/citrusfrukt/lime-3-pack-eko-7300156573353` | Coop citrus URL plus whole-lime multipack; classify as `lime`. |
| Willys | `Apelsin Klass 1` (`100126114_KG`) | `https://www.willys.se/search?q=apelsin&page=0&size=10` | Willys public search API returns this fresh fruit result with category facet `Frukt`; classify as `orange`. |
| Willys | `Lime Klass 1` (`101200430_ST`) | `https://www.willys.se/search?q=apelsin&page=0&size=10` | Same Willys response includes this related fresh citrus result; classify as `lime`. |
| Lidl | `Apelsiner` | `https://www.lidl.se/p/apelsiner/p66000058` | Lidl fresh fruit offer for a 2 kg orange pack; classify as `orange`. |
| Lidl | `Citroner` | `https://www.lidl.se/p/citroner/p10038384` | Lidl fresh fruit offer for a 750 g lemon pack; classify as `lemon`. |

## Negative examples and guardrails

- `Blodapelsin Lemonad`, `Apelsindryck`, `Apelsinjuice`, `Färsk apelsinjuice`:
  processed drink, not fresh citrus.
- `Apelsinkrokant`, `Noblesse Apelsin`, `Blodapelsin Svart Te`: flavour terms,
  not fresh fruit.
- `Citronmeliss`, `limeblad`, `citronsyra`, `citronpeppar`: herbs, ingredients,
  or seasoning; not a whole citrus fruit SKU.
- English `grape` alone means grape/raisin, not grapefruit. Accept Swedish
  `Grape röd` only in fresh produce context.

## Implementation checklist for matchers

1. Normalize case, trim accents only for matching fallback, and keep original
   SKU text for audit output.
2. Check the chain category/path first. A citrus-specific shelf is strong
   positive evidence; a broad produce shelf needs a strict name token.
3. Match subclass lexicons in priority order:
   `blood_orange` before `orange`, `grapefruit` before bare `grape`, and
   `mandarin_family` named varieties before generic `mixed_citrus`.
4. Apply processed-product exclusions after name matching so flavour-only SKUs
   do not leak into the fresh-produce class.
5. Store package form (`loose`, `kg`, `1-pack`, `3-pack`, net/bag), organic
   flag, grade (`Klass 1`/`Klass 2`), and country as attributes.
