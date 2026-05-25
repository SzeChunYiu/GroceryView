# Produce class: tomato varieties

Purpose: define fresh tomato sub-classes for GroceryView SKU normalization. This class covers whole fresh tomatoes sold loose, on the vine, or in packs. It excludes canned tomatoes, sauces, puree, soups, pasta fillings, salads, dried tomatoes, and tomato-flavoured prepared foods unless a separate fresh tomato SKU is visible.

## Class boundary

Accept a SKU as a tomato variety only when both conditions are true:

1. **Name evidence:** the SKU name contains a fresh tomato term or named variety from the table below.
2. **Fresh-produce context:** the chain category/path is produce, usually `Frukt & Grönt > Grönsaker > Tomat`, `frukt-gronsaker/gronsaker/tomat`, Willys `frukt-och-gront`, or a Lidl fruit-and-veg weekly offer.

Treat pack size, `Klass 1`, organic labels, country of origin, and brand as attributes. Do not infer variety from price unit or package weight alone.

## Chain category recognition

| Chain | Positive category/path | Recognition notes |
| --- | --- | --- |
| ICA | Store pages or category results under fresh produce; tomato SKUs often include `Klass 1` and brand `ICA`. | Require a tomato variety token because ICA promotion feeds may mix fresh produce with pasta or deli offers. |
| Coop | `frukt-gronsaker/gronsaker/tomat/...` product URLs. | Coop tomato URLs are strong evidence; keep the product-id suffix as fixture evidence because live availability is store-sensitive. |
| Willys | `https://www.willys.se/c/frukt-och-gront...` and product pages for fresh vegetables. | Willys titles often include variety plus `Klass 1`; category can be broad, so require a strict title token. |
| Lidl | Weekly fresh fruit-and-veg offers or `lidl.se/p/...` product pages for tomato packs. | Lidl offer pages may expire; capture product id, title, pack size, and retrieval date. |

## Subclasses

| Subclass | Belongs here | Exclude / split out | SKU-name recognition |
| --- | --- | --- | --- |
| `tomato_round_loose` | Standard round loose tomatoes and generic tomato packs where no vine, plum, beef, cherry, cocktail, or snack cue is present. | Canned/crushed/passata tomatoes; vine tomatoes; beef tomatoes. | `tomat`, `tomater`, `rund tomat`, `klass 1` in produce context; reject `krossade`, `passerade`, `pastasås`, `soppa`. |
| `tomato_vine` | Tomatoes sold on the vine/truss, including loose per-kg vine tomatoes and packed vine tomatoes. | Cocktail-on-vine if the SKU says cocktail; cherry-on-vine if cherry/ciliegino is explicit. | `kvisttomat`, `kvisttomater`, `tomater på kvist`, `vine tomato`, `on the vine`, `ranketomat`. |
| `tomato_beefsteak` | Large ribbed or beefsteak tomatoes sold loose or per piece. | Standard round tomatoes without size/ribbed/beef wording. | `bifftomat`, `beefsteak`, `beef tomato`, `fleischtomat`, `bøftomat`. |
| `tomato_plum` | Plum, baby plum, mini plum, Roma/San Marzano-style fresh tomatoes. | Canned plum tomatoes and dried tomatoes. | `plommontomat`, `plommontomater`, `babyplommontomat`, `roma`, `san marzano` when fresh. |
| `tomato_cherry` | Cherry tomatoes, grape/ciliegino tomatoes, and small snack tomatoes when cherry/grape is explicit. | Cocktail tomatoes; dried cherry tomatoes; prepared snack cups with dip. | `körsbärstomat`, `körsbärstomater`, `cherry tomato`, `ciliegino`, `cherrytomat`, `kirsuberjatómatur`. |
| `tomato_cocktail` | Cocktail tomatoes, especially medium-small packs and cocktail tomatoes on the vine. | Cherry tomatoes unless the SKU says cocktail. | `cocktailtomat`, `cocktailtomater`, `cocktail tomato`. |
| `tomato_snack_mini` | Small snacking tomatoes where the retailer uses snack/mini but not cherry, cocktail, or plum. | Tomato snacks that are dried/processed or include dips. | `snacktomat`, `snacktomater`, `minitomat`, `mini tomater`, `småtomater`. |
| `tomato_mixed_pack` | Mixed tomato packs with multiple colours/shapes or explicit mix wording. | Generic red tomato packs without mix wording. | `tomater mix`, `tomatmix`, `mixade tomater`, `rainbow`, `färgade tomater`. |

## Locale alternate names

| Subclass | Swedish (`sv`) | Norwegian Bokmål (`nb`) | Icelandic (`is`) |
| --- | --- | --- | --- |
| `tomato_round_loose` | tomat, tomater, rund tomat | tomat, tomater, rund tomat | tómatur, tómatar |
| `tomato_vine` | kvisttomat, kvisttomater, tomat på kvist | klasetomat, ranketomat, tomater på stilk | tómatar á grein, klasatómatar |
| `tomato_beefsteak` | bifftomat, bifftomater | bifftomat, bøftomat | bufftómatur, nautasteikartómatur |
| `tomato_plum` | plommontomat, babyplommontomat, roma | plommetomat, babyplommetomat, roma | plómutómatur, roma tómatur |
| `tomato_cherry` | körsbärstomat, körsbärstomater | cherrytomat, kirsebærtomat | kirsuberjatómatur, kirsuberjatómatar |
| `tomato_cocktail` | cocktailtomat, cocktailtomater | cocktailtomat, cocktailtomater | kokteiltómatur, kokteiltómatar |
| `tomato_snack_mini` | snacktomat, minitomat, småtomater | snacktomat, minitomat, småtomater | smátómatar, snakktómatar |
| `tomato_mixed_pack` | tomatmix, tomater mix, mixade tomater | tomatmiks, blandede tomater | tómatablanda, blandaðir tómatar |

## Real SKU examples

Examples are classifier fixtures from public retailer pages or checked-in ingestion snapshots captured on 2026-05-25; prices and availability may change.

| Chain | Example SKU | Evidence URL/source | Classification note |
| --- | --- | --- | --- |
| ICA | `Babyplommontomater 500g Klass 1 ICA` (`2077461`) | `apps/web/src/lib/ingested/ica.ts`, product URL `https://handlaprivatkund.ica.se/stores/1003390/products/2077461/details` | Fresh ICA promotion SKU; `babyplommon` maps to `tomato_plum`. |
| Coop | `Kvisttomater` (`2317480700008`) | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/tomat/kvisttomater-2317480700008` | Coop tomato category URL plus `kvist` title; classify as `tomato_vine`. |
| Coop | `Snacktomater` (`7300156598967`) | `https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/tomat/snacktomater-7300156598967` | Coop tomato category URL and snack wording; classify as `tomato_snack_mini`. |
| Willys | `Kvisttomat Import Klass 1` (`100152282_KG`) | `apps/web/src/lib/ingested/willys.ts`, source `https://www.willys.se/c/frukt-och-gront?page=0&size=100` | Broad fresh-produce shelf plus `kvisttomat`; classify as `tomato_vine`. |
| Willys | `Bifftomat Klass 1` (`100152488_KG`) | `apps/web/src/lib/ingested/willys.ts`, source `https://www.willys.se/c/frukt-och-gront?page=1&size=100` | Fresh-produce shelf and beefsteak title cue; classify as `tomato_beefsteak`. |
| Lidl | `Babyplommontomater` (`66000115`, `500 g`) | `apps/web/src/lib/ingested/lidl.ts`, product URL `https://www.lidl.se/p/babyplommontomater/p66000115` | Lidl fruit-and-veg offer; `babyplommon` maps to `tomato_plum`. |
| Lidl | `Kvisttomater` (`11151101`, `/kg`) | `apps/web/src/lib/ingested/lidl.ts`, product URL `https://www.lidl.se/p/kvisttomater/p11151101` | Lidl fresh offer and `kvist` cue; classify as `tomato_vine`. |

## Negative examples and guardrails

- `Finkrossade tomater`, `Passerade tomater`, `Tomatsås`, `Pastasås Tomat & basilika`: processed tomato products, not produce varieties.
- `Soltorkade tomater`, `pesto rosso med soltorkade tomater`: dried/ingredient products, not fresh tomato SKUs.
- `Färsk Pasta Ravioli Tomat Mozzarella`, `Vegoskivor Tomat & Basilika`, `Färskost Tomat & örter`: tomato is a flavour/ingredient cue only.
- If a broad produce shelf contains only `tomat` but no variety cue, emit `tomato_round_loose` with lower confidence instead of guessing plum/cherry/vine.

## Implementation checklist for matchers

1. Normalize case and Swedish/Norwegian/Icelandic diacritics for matching, but keep original SKU text for audit output.
2. Apply processed-product exclusions before assigning a fresh tomato subclass.
3. Use longest/specific matches first: `babyplommontomat` before generic `tomat`, `cocktailtomat` before `kvisttomat` when both appear, and `tomatmix` before generic round tomato.
4. Require fresh-produce category/path for generic `tomat` hits; strict variety words can rescue broad `frukt-och-gront` pages.
5. Store grade, organic flag, country, package size, and loose/per-kg form as attributes separate from subclass.
