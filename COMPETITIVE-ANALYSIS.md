# Competitive Analysis — Grocery Price Comparison, Worldwide

Compiled: 2026-05-22 (operator). Grounds the "reach parity then exceed" mandate in
GOAL.md with a feature-by-feature distillation of the **actual grocery rivals**, not
just cross-domain inspiration. Every feature listed here was verified from the
competitor's own site/store listing or reputable coverage; inferred items are marked
`(inferred)`. Do not fabricate competitor features — extend this file only from
verifiable sources.

## 1. The field (verified incumbents by market)

| Market | Lead incumbent(s) | Coverage | Notable strengths |
|--------|-------------------|----------|-------------------|
| 🇸🇪 Sweden | **Matpriskollen**, Matspar | 50k items, 5-6 chains, 6 regions | barcode scan; savings calc/week/month/year; Matspar = online-basket buy |
| 🇳🇴 Norway | **Kassalapp** | 100k products | email price alerts (up+down); **open public API** (price history, nutrition, allergens, ingredients, images); reduced-across-all-stores view |
| | Matpris, Mattilbud | all major chains | weekly offers / digital flyer aggregation |
| 🇩🇰 Denmark | **Prej.dk** | 21+ chains | **price history**, price alarms, barcode GTIN/EAN matching, daily, free |
| 🇫🇮 Finland | **Kauppavainu**, Ruoanhinta.fi | S- + K-group, Lidl | basket → cheapest-store route; **S-mobiili Hintavertailija = first-party** (chains compare inside their own app) |
| 🇮🇸 Iceland | **Verðgáttin** (state/retail-institute), ASÍ dashboard | **only 74 products, 3 chains** | basket builder, trends — institutional/watchdog, not a consumer product |
| 🇬🇧 UK | **Trolley.co.uk** | 10k+ products | barcode; **Chrome extension**; *no* loyalty-adjusted full-basket compare (open gap) |
| 🇫🇷 France | **Reprice** (45k stores), Circl; Leclerc "Qui est le moins cher" | most chains | chain-independent; official chain comparator exists |
| 🇪🇸 Spain | **Soysuper**, Findit, SaveBuy, OCU | 8+ chains | lists, barcode, coupons |
| 🇵🇹 Portugal | **Super Save**, Preço Fresco, KuantoKusta/Kabaz | 14 chains | price history + good-price flag; barcode; list→cheapest-store |
| 🇵🇱 Poland | **Tańszy Koszyk** (12k, 6 chains), Blix, Listonic | flyer-driven | digital catalogs, coupons, loyalty cards, receipts |
| 🇦🇺 Australia | WiseList, **WhichGrocer**, GroceryWise, Grocery Spy, Save On Groceries, Frugl | Coles/Woolworths/ALDI/IGA | strong **basket optimization**; multiple **Chrome extensions** overlaying retailer sites |

## 2. Table stakes — everyone (or nearly) has these

If GroceryView lacks any of these it is *behind*, not ahead:
- Barcode scan → cross-store price (Matpriskollen, Prej, Kassalapp, Trolley, Soysuper, Preço Fresco)
- Shopping list with live totals
- Price-drop alerts (Kassalapp, Prej, Matpriskollen)
- Basic price history (Prej, Super Save, Kassalapp API)
- Weekly offers / digital flyer feed (Matpris, Mattilbud, Blix, Tańszy Koszyk, KuantoKusta)
- "Cheapest store for my basket" (Kauppavainu, Kabaz, Aussie apps)
- Savings calculator (Matpriskollen)

## 3. Best ideas worth stealing that are NOT yet prioritized in GOAL.md

1. **Browser extension that overlays comparison ON the retailer's own site.**
   Trolley (UK) + WhichGrocer/GroceryWise (AU) do this — when you shop on Coles /
   Woolworths / (here) ICA-online, the extension shows the cheaper alternative inline.
   Highest-leverage acquisition channel we are not building.
2. **Open public API (Kassalapp model).** A documented price/nutrition API creates a
   developer ecosystem, backlinks, and a data moat. Cheap to expose once the DB exists.
3. **Loyalty-adjusted basket comparison.** The explicit *unsolved* problem in the UK
   ("no site compares a full basket with loyalty pricing factored in"). Whoever cracks
   member-price-aware comparison owns a feature literally nobody has.
4. **Split-shop / cheapest-route basket optimizer** (Kauppavainu, Kabaz, Aussie apps):
   "buy these 6 items at Willys, these 4 at Lidl, net saving X." We have
   `compareBasketStrategies` in core — surface it.
5. **Flyer/digital-catalog ingestion** (Blix, Mattilbud, Tańszy Koszyk): promo coverage
   that price-scrape alone misses; many shoppers start from the weekly flyer.

## 4. The white space — what NOBODY in the field does (our differentiation)

The entire field is **list-and-alert utilities**. Not one is a **financial terminal**.
These features are essentially unoccupied and map 1:1 to GroceryView's `core` engine:

| Terminal feature | Closest rival | Why it still wins |
|------------------|---------------|-------------------|
| Multi-timeframe **price charts** per product (1W/1M/1Y/ALL) | Prej/Kassalapp show *raw* history | none present it as a chart/terminal |
| **Chain / category / brand-tier indices** over time | — | the "grocery stock market" framing is unique |
| **Buy/Wait verdict score** + confidence | — | Skyscanner-style signal, absent in grocery |
| **52-week-low badge** ("lowest in N days") | — | Keepa idea, never ported to groceries |
| **Personal grocery inflation / your CPI** | — | nobody computes a shopper's own basket CPI |
| **Movers board** (biggest weekly drops/rises) + deal screener | flyers list offers | screener/ranking framing is new |
| **Nutrition-per-krona** | Yuka (health only) | price-adjusted nutrition is unoccupied |
| **Map colored by chain index** / cheapest-near-me | — | spatial price intelligence is new |
| **Confidence/coverage indicator** on every figure | — | trust differentiator; honesty-in-UI gate |

**Conclusion:** the differentiation is real and largely unoccupied. The two data-rich
rivals (Prej, Kassalapp) own *raw history*; turning that into a charted, indexed,
verdict-driven **terminal** is the wedge — and it is portable to every market.

## 5. Market-entry sequencing (see GOAL.md for product north-star)

Ranked by *(white space × prize × ease)*, not by map adjacency:

1. **Sweden (home) — win first.** Beat Matpriskollen on the terminal UX before
   spreading. A decisively better product in one market validates the wedge everywhere.
2. **Iceland — cheap proof-of-concept.** Genuine white space (only a 74-product
   institutional tool). Tiny prize (~380k people, 3 chains) but low cost to *dominate*
   and a clean case study for the terminal concept against zero real consumer rival.
3. **Norway — the real expansion prize.** ~5.5M, switch-willing shoppers, and
   **Kassalapp's open API is a data shortcut** — build the terminal layer on richer
   data than we have at home.
4. **Denmark — only if terminal proves decisively better than Prej** (strong incumbent).
5. **Finland — last.** Product gap is real BUT the chains *self-defend* (S-mobiili
   first-party comparator) — a behavioural moat, the hardest kind. Finnish-language too.

> Caution on the "Finland + Iceland first" instinct: Iceland yes (white space), but
> **Finland is one of the hardest, not easiest** — the duopoly's built-in comparators
> mean shoppers already have "good enough" comparison inside the loyalty app they open
> daily. Don't lead with Finland.
