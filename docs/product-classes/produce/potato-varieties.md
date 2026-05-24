# Produce product class: potato varieties

This document defines grocery SKU sub-classes for table potatoes (`Solanum tuberosum`) used by GroceryView when comparing fresh produce across ICA, Coop, Willys, and Lidl. It is intentionally **variety-first**: chain shelf categories such as `Fast potatis`, `Mjölig potatis`, `Delikatesspotatis`, or `Bakpotatis` are treated as evidence, but a named variety in the SKU title wins when present.

## Scope and exclusions

- Include fresh, unprocessed table potatoes sold loose or bagged: standard ware potatoes, named varieties, seasonal new potatoes, bake/oven potatoes, and small/delicacy potatoes.
- Exclude sweet potato (`sötpotatis`/`søtpotet`/`sætar kartöflur`), frozen fries/wedges, gratins, potato salads, crisps, seed potatoes, and prepared meal components.
- Preserve the source pack size and organic claims separately; they are not sub-class identifiers.
- If a SKU has no variety or texture cue, classify it as `potato_unspecified` rather than guessing from price, pack size, or image alone.

## Normalization order

1. Lowercase the SKU title and the full chain category breadcrumb.
2. Strip pack-size, class, origin, promo, and claim tokens: `klass 1`, `klass 2`, `eko`, `ekologisk`, `krav`, `från sverige`, country names, `kg`, `g`, `st`, `påse`, `lösvikt`.
3. Match named varieties before broad use/texture terms.
4. Use chain category breadcrumbs as a tie-breaker when title only says `potatis`.
5. If two subclasses still match, keep the most specific one in this order: `mandel`/`ratte`/`amandine`/other named variety > `fresh_new` > `baking` > `floury`/`firm` > `delicacy_small` > `unspecified`.

## Sub-classes

| Product class id | Includes | SKU/category recognition | Common alternates by locale | Do **not** include |
| --- | --- | --- | --- | --- |
| `potato_king_edward` | King Edward table potatoes, including seasonal `Sommarpotatis King Edward`. Usually floury or slightly floury, round/oval, pale skin with red/pink markings. | Title contains `king edward`, `king edvard`, `king-edward`; category often `Mjölig potatis`, `Potatis`, or seasonal summer potato. ICA describes its King Edward SKU as slightly floury and suitable for mash, gratin, baking, pressing, and boiling. | sv: `King Edward`, `King Edvard`; nb: `King Edward-potet`; is: `King Edward kartöflur` when imported/variety-named. | Generic `mjölig potatis` with no variety; seed potatoes. |
| `potato_amandine` | Amandine, a firm, elongated French-style delicacy potato; may be sold as a named delicacy/gourmet SKU. | Title contains `amandine`; category can be `Delikatesspotatis`, `Fast potatis`, or `Potatis`. Lidl lists Amandine as firm and good for salad/roasting. | sv: `Amandine`, `delikatesspotatis Amandine`; nb: `Amandinepotet`, `delikatessepotet`; is: usually retained as `Amandine kartöflur`. | Generic `delikatesspotatis` without Amandine; `mandelpotatis`. |
| `potato_mandel` | Mandelpotatis / almond potatoes and close local `fjellmandel` style SKUs; elongated, often floury, traditional with northern dishes. | Title contains `mandelpotatis`, `mandel potatis`, `mandel`; category may be `Mandelpotatis`, `Delikatesspotatis`, or `Potatis`. Lidl lists Mandelpotatis as floury with thin beige skin and yellow flesh. | sv: `mandelpotatis`; nb: `mandelpotet`, `fjellmandel`; is: `möndlukartöflur`, `möndlu-kartöflur`. | Amandine just because it is almond-shaped; generic small potatoes. |
| `potato_ratte_asparges` | Ratte, sparrispotatis/asparges potato, and close elongated specialty varieties marketed by name. | Title contains `ratte`, `sparrispotatis`, `aspargespotatis`, `asparagus potato`; categories often `Delikatesspotatis`. | sv: `Ratte`, `sparrispotatis`, `aspargespotatis`; nb: `Ratte`, `aspargespotet`; is: `aspasskartöflur` where used, otherwise preserve variety name. | Amandine or mandelpotatis unless explicitly co-branded as Ratte/asparagus. |
| `potato_firm` | Generic firm boiling potatoes where no named variety is present. Keeps shape after boiling; for salad, slicing, roasting. | Title/category contains `fast potatis`, `kokfast`, `fast`, `fasta`; no named variety already matched. Lidl says firm potatoes keep their form and suit salads/sliced dishes. | sv: `fast potatis`, `kokfast`; nb: `kokefast potet`, `fast potet`; is: `fastar kartöflur`, `suðufastar kartöflur`. | Amandine, Cherie, Solist, Maria, or any named firm variety: classify by named variety if the taxonomy has it, otherwise `potato_named_other`. |
| `potato_floury` | Generic floury potatoes for mash, purée, gratin, pressing, baking; no named variety present. | Title/category contains `mjölig`, `mos`, `mospotatis`, `puré`, `floury`; no named variety already matched. | sv: `mjölig potatis`, `mospotatis`; nb: `melen potet`, `melne poteter`, `potet til mos`; is: `mjöluð kartafla`, `kartöflur í mús` in SKU notes. | `King Edward` (own class); bake potatoes (own use-class) if marketed primarily as baking/oven potato. |
| `potato_fresh_new` | New/early/summer potatoes sold for immediate seasonal eating, including Swedish `färskpotatis` and `nypotatis`. | Title/category contains `färskpotatis`, `färsk`, `ny potatis`, `nypotatis`, `sommarpotatis`, `primör`, `new potatoes`; seasonality words outrank generic firm/floury but not a named variety. | sv: `färskpotatis`, `nypotatis`, `sommarpotatis`, `primörpotatis`; nb: `nypotet`, `ferskpotet`, `tidligpotet`; is: `nýjar kartöflur`, `nýuppteknar kartöflur`. | Mature ware potatoes merely harvested in Sweden; frozen or prepared summer sides. |
| `potato_baking` | Large potatoes marketed for oven baking; use class, not a biological variety. | Title/category contains `bakpotatis`, `ugns- & bakpotatis`, `bak potatis`, `bakepotet`, `bökunarkartöflur`; large piece or 1-2 kg bag cues support but do not decide alone. Lidl notes baking potato is not a specific variety and is often large floury King Edward/Bintje type. | sv: `bakpotatis`, `ugnspotatis`; nb: `bakepotet`; is: `bökunarkartöflur`. | Named King Edward/Bintje products not marketed as bake potatoes; processed baked-potato meals. |
| `potato_delicacy_small` | Small/gourmet/delicacy potatoes where no named variety is present; often washed, small-calibre, premium packs. | Title/category contains `delikatesspotatis`, `gourmetpotatis`, `småpotatis`, `minipotatis`, `baby potatoes`, `sköljd`, and no specific variety matched. | sv: `delikatesspotatis`, `gourmetpotatis`, `småpotatis`; nb: `delikatessepotet`, `småpotet`; is: `smælki`, `úrvals kartöflur`, `litlar kartöflur`. | Amandine/Ratte/Mandel/Jazzy/Marilyn or any named variety; classify by variety first. |
| `potato_named_other` | Named varieties not yet given their own class, e.g. Bintje, Cherie, Solist, Maria, Jazzy, Marilyn, Folva, Asterix, Beate, Ballerina. | Title contains a known variety name, but no dedicated class exists. Store the exact normalized variety token for later taxonomy promotion. | sv/nb/is: preserve the variety name; translate only the generic `potatis`/`potet`/`kartöflur` token. | Generic texture or use classes. |
| `potato_unspecified` | Plain ware potatoes with no named variety, no texture, no use, and no seasonality. | Title is only `potatis`, `matpotatis`, `table potatoes`, or category `Potatis` with no stronger clue. | sv: `potatis`, `matpotatis`; nb: `potet`, `matpotet`; is: `kartöflur`, `matarkartöflur`. | Any SKU with a stronger named, seasonal, texture, size, or use cue. |

## Chain-specific parsing notes

### ICA

ICA exposes both category breadcrumbs and SKU names. The `Potatis` category currently lists `Sommarpotatis King Edward 2kg Klass 1 ICA`, `Potatis Amandine 2kg Klass 1 ICA`, `Delikatess Mandelpotatis 900g Klass 1 ICA`, `Delikatesspotatis Ratte Sköljd 900g Klass 1 ICA`, `Färskpotatis Delikatess 900g Klass 1 ICA`, `Ugns- & Bakpotatis i påse 1,2kg ICA Klass 1`, `Potatis Jazzy 1.2kg Klass 1 ICA`, and `Potatis King Edward 2kg Klass 1 ICA`.[^ica-category] ICA's specific King Edward product page states `Sort King Edward` and describes it as slightly floury.[^ica-king-edward]

Implementation rules:

- Prefer explicit variety in the title (`King Edward`, `Amandine`, `Mandelpotatis`, `Ratte`, `Jazzy`).
- Use ICA subcategories (`Fast potatis`, `Mjölig potatis`, `Färskpotatis`, `Delikatesspotatis`, `Mandelpotatis`, `Bakpotatis`) only when no title variety matched.
- Treat `I love eco`, `KRAV`, and `Klass 1/2` as product attributes, not classes.

### Coop

Coop product URLs and search snippets commonly embed category paths and GTINs, e.g. `potatis-amandine-7300156577443`, `potatis-mandel-7300156577467`, `potatis-mos-7340007925474`, and `potatis-fast-7300156577504`.[^coop-amandine] [^coop-mandel] [^coop-mos] [^coop-fast]

Implementation rules:

- Parse the slug before the GTIN: `potatis-amandine` => `potato_amandine`; `potatis-mandel`/`mandelpotatis` => `potato_mandel`.
- `potatis-mos` is a floury/use cue unless the visible title gives a named variety.
- `potatis-fast` maps to `potato_firm` only when there is no named variety.

### Willys

Willys online search and prices are sometimes mirrored by comparison pages. A current Matspar page lists `Potatis Amandine ca 900g` under category `Potatis` and reports Willys as a selling chain for the SKU.[^willys-amandine] Axfood/Garant product data also documents `Mandelpotatis 900g`, a Willys-relevant private-label potato line, as extra floury almond potato.[^garant-mandel]

Implementation rules:

- Willys/Garant titles should be parsed the same way as ICA/Coop: named variety first, then `fast`, `mjölig`, `färsk`, `bak`, and `delikatess/små` cues.
- Because Willys may expose chain-private brands (`Garant`, `Eldorado`) and comparison pages may omit breadcrumbs, do not infer `fast`/`floury` from brand. Require title/category words or product text.
- If an external comparator is the only available source, record it in provenance as `retailer_observed_via_comparator` and keep the original chain field as `Willys`.

### Lidl

Lidl has rotating offer pages such as `Matriket Potatis` by kg, plus campaign pages that list article-numbered potato SKUs such as `83222 Matriket Delikatesspotatis 1kg` and `83276 Matriket Potatis 3kg (mjölig)`. Lidl also publishes a potato guide listing common varieties and properties.[^lidl-potatis] [^lidl-julengagemang] [^lidl-guide]

Implementation rules:

- `Matriket Potatis` with no variety or texture remains `potato_unspecified` unless the offer text adds a stronger cue.
- `Färskpotatis` or `nypotatis` offers are `potato_fresh_new` even when no variety is named.
- `Matriket Potatis 3kg (mjölig)` maps to `potato_floury`; `Matriket Delikatesspotatis 1kg` maps to `potato_delicacy_small`.
- Use Lidl's guide as vocabulary support: King Edward = floury; Amandine = firm; Mandelpotatis = floury; Solist = early; bake potato is a use-class rather than a variety.

## Real SKU examples and expected classes

| Chain | Observed SKU text / page | Evidence cue | Expected class |
| --- | --- | --- | --- |
| ICA | `Potatis King Edward 2kg Klass 1 ICA`[^ica-king-edward] | Explicit `Sort King Edward`; slightly floury product text. | `potato_king_edward` |
| ICA | `Potatis Amandine 2kg Klass 1 ICA`[^ica-category] | Explicit Amandine in ICA Potatis category. | `potato_amandine` |
| ICA | `Delikatess Mandelpotatis 900g Klass 1 ICA`[^ica-category] | Explicit `Mandelpotatis`; `Delikatess` is secondary. | `potato_mandel` |
| ICA | `Ugns- & Bakpotatis i påse 1,2kg ICA Klass 1`[^ica-category] | Bake/oven use term, no named variety. | `potato_baking` |
| Coop | `Potatis Amandine` / slug `potatis-amandine-7300156577443`[^coop-amandine] | Explicit Amandine. | `potato_amandine` |
| Coop | `Potatis Mandel` / slug `potatis-mandel-7300156577467`[^coop-mandel] | Explicit almond/mandel cue. | `potato_mandel` |
| Coop | `Potatis Mos` / slug `potatis-mos-7340007925474`[^coop-mos] | Mash/mos use cue, no named variety. | `potato_floury` |
| Coop | `Potatis Fast` / slug `potatis-fast-7300156577504`[^coop-fast] | Firm texture cue, no named variety. | `potato_firm` |
| Willys | `Potatis Amandine ca 900g` listed with Willys store price on Matspar[^willys-amandine] | Explicit Amandine; comparator provenance says Willys. | `potato_amandine` |
| Willys/Axfood | `Mandelpotatis 900g` Garant[^garant-mandel] | Explicit Mandelpotatis; extra floury text is secondary. | `potato_mandel` |
| Lidl | `Matriket Potatis` offer page[^lidl-potatis] | Only generic `Potatis`, no variety/texture/use cue. | `potato_unspecified` |
| Lidl | `83276 Matriket Potatis 3kg (mjölig)`[^lidl-julengagemang] | Explicit `mjölig` texture cue. | `potato_floury` |
| Lidl | `83222 Matriket Delikatesspotatis 1kg`[^lidl-julengagemang] | Explicit delicacy potato cue without a named variety. | `potato_delicacy_small` |

## Ambiguity handling

- `Delikatesspotatis Amandine`, `Delikatesspotatis Ratte`, and `Delikatess Mandelpotatis` must not collapse to `potato_delicacy_small`; they map to their variety classes.
- `Sommarpotatis King Edward` maps to `potato_king_edward` because the named variety outranks seasonality. Preserve a separate `seasonal=true` or `seasonal_term=sommarpotatis` feature if needed.
- `Färskpotatis Delikatess 900g` maps to `potato_fresh_new`; freshness/seasonality is more important than generic delicacy size when no named variety exists.
- `Bakpotatis King Edward` should map to `potato_king_edward` with `use_claim=baking`; if a system can only output one class for consumer comparison, use variety class first.
- `Potatis 900g`, `Matriket Potatis`, and `Matpotatis` without more information stay `potato_unspecified`.

## Source notes

[^ica-category]: ICA, [`Potatis` category](https://handla.ica.se/kategori/2570), accessed 2026-05-24.
[^ica-king-edward]: ICA, [`Potatis King Edward 2kg Klass 1 ICA`](https://handla.ica.se/produkt/1318746), accessed 2026-05-24.
[^coop-amandine]: Coop, [`Potatis Amandine` product URL](https://www.coop.se/handla/varor/frukt-gronsaker/rotfrukter-svamp/potatis/potatis-amandine-7300156577443/), accessed 2026-05-24.
[^coop-mandel]: Coop, [`Potatis Mandel` product URL](https://www.coop.se/handla/varor/frukt-gronsaker/gronsaker/potatis/potatis-mandel-7300156577467), accessed 2026-05-24.
[^coop-mos]: Coop, [`Potatis Mos` product URL](https://www.coop.se/handla/varor/frukt-gronsaker/rotfrukter-svamp/potatis/potatis-mos-7340007925474), accessed 2026-05-24.
[^coop-fast]: Coop, [`Potatis Fast` product URL](https://www.coop.se/handla/varor/frukt-gronsaker/rotfrukter-svamp/potatis/potatis-fast-7300156577504/), accessed 2026-05-24.
[^willys-amandine]: Matspar, [`Potatis Amandine ca 900g`](https://www.matspar.se/produkt/potatis-amandine-ca-900g-1), page lists Willys among store prices, accessed 2026-05-24.
[^garant-mandel]: Garant/Axfood, [`Mandelpotatis 900g`](https://www.garantskafferiet.se/vara-produkter/eko-frukt--gronsaker/potatis-lok--rotfrukter/Mandelpotatis-900g/), accessed 2026-05-24.
[^lidl-potatis]: Lidl, [`Matriket Potatis`](https://www.lidl.se/p/matriket-potatis/p10036287), accessed 2026-05-24.
[^lidl-julengagemang]: Lidl, [`Julengagemang` campaign page](https://www.lidl.se/c/julengagemang/s10077541), accessed 2026-05-24.
[^lidl-guide]: Lidl, [`Potatis – en guide till olika potatissorter`](https://www.lidl.se/c/vara-varor-potatis/s10063830), accessed 2026-05-24.
