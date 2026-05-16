# GroceryView UX Concepts

**Lane:** UX-DESIGNER / Pane 3  
**Source:** `PROPOSAL.md` v0.2 — TradingView-style market terminal emphasis  
**Scope:** Core flows, descriptive UX behavior, and wireframe-style screen concepts for price chart view, deal score display, shopping list, basket comparison, and weekly budget tracker.

---

## 1. Design North Star

GroceryView should feel like a **market terminal for weekly grocery decisions**: fast at a glance for normal shoppers, deep enough for deal hunters and budget planners.

### Experience principles

1. **Chart-first, decision-second:** show the price signal, then translate it into a clear action: Buy now, Wait, Compare, Stock up, or Not a real deal.
2. **Simple mode by default:** every advanced metric has a plain-language interpretation.
3. **No travel-time penalty:** the UI can show store distance or area, but comparison and Deal Score must not reduce value because a store is far away.
4. **Confidence is visible:** verified, estimated, member-only, and promo-only data are visually distinct.
5. **Basket-aware intelligence:** product-level insights should connect directly to the weekly list, basket strategy, and budget.

### Primary navigation model

Mobile bottom navigation:

```text
Today | Stores | Basket | Scan | Profile
```

Advanced web/tablet navigation:

```text
Market | Watchlist | Deals | Basket Planner | Budget | Indices
```

---

## 2. Shared Visual System Concepts

### Color and status language

| Signal | Color concept | Use |
| --- | --- | --- |
| Excellent / stock-up | Deep green | Deal Score 90–100, 52-week low, under budget |
| Good / buy | Green | Deal Score 75–89, strong basket option |
| Fair / compare | Amber | Deal Score 60–74, moderate savings |
| Normal / wait | Gray | Deal Score 40–59, average price |
| Bad / not real deal | Red | Deal Score 0–39, over budget, poor value |
| Estimated / uncertain | Dotted outline, muted tone | Low confidence prices, OCR-derived receipt items |
| Member-only | Purple badge | Member price separated from standard price |

### Data confidence styling

```text
Solid line       = verified observed prices
Dotted line      = estimated / promo-only history
Marker           = promotion event
Purple marker    = member-price event
Shaded band      = normal historical price range
Lock icon        = brand-locked or substitution disabled
```

### Reusable metric chips

```text
Best 49.90 kr
7D -12.4%
30D -8.1%
Hist. pct 6th
STHLM pct 11th
Deal 94
Verified 42m ago
```

---

## 3. Core Flow A — Price Chart View

### User goal

Answer: **“Is this product cheap now, and where should I buy it?”**

### Entry points

- Search result or barcode scan
- Deal feed card
- Watchlist alert
- Weekly Basket item row
- Store offer page
- Index page contributor row

### Flow

```text
Open product / scan item
→ see product ticker header and verdict
→ inspect price chart with range controls
→ compare current store prices
→ check equivalent products or smart swaps
→ add to Basket, Watchlist, or Alert
```

### Screen concept: Product Price Terminal / Chart tab

```text
┌────────────────────────────────────────────┐
│ ← ZOEGAS-COFFEE-450G                 ☆ 🔔 │
│ Zoégas Mollbergs Blend Coffee 450g         │
│ Best price 49.90 kr  • Willys Odenplan     │
│ Deal Score 94  BUY NOW                     │
│ 7D -12.4%  30D -8.1%  Hist pct 6th         │
├────────────────────────────────────────────┤
│ [Overview] [Chart] [Stores] [Swaps] [Info] │
├────────────────────────────────────────────┤
│  79.90 ┤        ··· estimated              │
│        │     ● promo                       │
│  64.90 ┤────╮       ╭──── normal band      │
│        │    ╰───────╯                      │
│  49.90 ┤              ● current 49.90      │
│  44.90 ┤──── 52W low                       │
│        └──7D──30D──90D──1Y──All────────── │
│ [7D] [30D] [90D] [1Y] [All]                │
├────────────────────────────────────────────┤
│ Overlays: ☑ Normal band ☑ Promotions       │
│           ☑ Member prices ☑ My stores      │
│ Compare:  + Add ICA  + Add Lidl  + Index   │
├────────────────────────────────────────────┤
│ Store prices today                         │
│ Willys Odenplan       49.90  Deal 94  Buy │
│ Lidl Sveavägen        54.90  Deal 81  Buy │
│ Coop Fridhemsplan     69.90  Deal 43 Wait │
├────────────────────────────────────────────┤
│ [Add to Basket] [Set alert < 50 kr]        │
└────────────────────────────────────────────┘
```

### Key interactions

- **Range selector:** 7D, 30D, 90D, 1Y, All.
- **Chart overlays:** normal price band, 52-week high/low, promo markers, member-price markers, verified vs estimated history.
- **Compare mode:** add chains, favorite stores, category index, or equivalent products as extra lines.
- **Scrub tooltip:** on hover/drag, show date, store, price, verification source, promo/member status.
- **One-tap actions:** Add to Basket, Add to Watchlist, Set Alert.

### Empty and low-confidence states

```text
Limited price history
We have 3 verified observations and 2 estimated offers.
Use current Stockholm percentile and unit price until more history is available.
```

---

## 4. Core Flow B — Deal Score Display

### User goal

Answer: **“Is this deal real, and why?”**

### Deal Score levels

| Score | Label | Simple verdict |
| --- | --- | --- |
| 90–100 | Excellent deal | Stock up / Buy now |
| 75–89 | Good deal | Buy |
| 60–74 | Fair deal | Compare |
| 40–59 | Normal price | Wait |
| 0–39 | Not a real deal | Skip |

### Display locations

- Product ticker header
- Deal cards in Today and Store feeds
- Basket item row
- Basket comparison option
- Receipt review item summary
- Watchlist alert

### Flow

```text
See a product, offer, basket item, or receipt item
→ read the score, label, and plain-language verdict
→ expand Why? to inspect historical percentile, city percentile, unit price, discount depth, source confidence, and user relevance
→ compare confidence, member-price status, and substitutes
→ act: Add to Basket, Set Alert, View Chart, Swap, Buy now, Wait, or Skip
```

### Component concept: Deal Score card

```text
┌────────────────────────────────────────────┐
│ DEAL SCORE                                 │
│ 94 / 100            Excellent deal         │
│ ██████████████████░░                      │
│ Verdict: BUY NOW                           │
├────────────────────────────────────────────┤
│ Why this scores high                       │
│ ✓ Lowest 6% of observed prices             │
│ ✓ 18% below Stockholm median               │
│ ✓ 21.80 kr/kg beats equivalents            │
│ ✓ Verified by shelf photo + flyer          │
│ ○ Member price: No                         │
├────────────────────────────────────────────┤
│ Score ingredients                          │
│ Historical percentile        35%  ██████   │
│ City percentile              25%  █████    │
│ Unit price vs equivalents    20%  ████     │
│ Discount depth               10%  ██       │
│ Source confidence             5%  █        │
│ User relevance                5%  █        │
├────────────────────────────────────────────┤
│ [Add to Basket] [Set alert] [View chart]   │
└────────────────────────────────────────────┘
```

### Compact card in feeds

```text
Coffee 450g — Willys Odenplan
49.90 kr  ·  Deal 94  ·  BUY NOW
6th historical percentile · verified 42m ago
[Add] [Chart]
```

### Important UX rules

- Sponsored placements may change card placement only if clearly labelled; they **must never change Deal Score**.
- Member prices always show a `Member` badge and can be hidden by filter.
- Low confidence scores show a `Confidence: Low` badge and a reason.
- If history is limited, show the MVP formula explanation instead of implying full historical certainty.

---

## 5. Core Flow C — Shopping List / Weekly Basket

### User goal

Answer: **“What should I buy this week, and can I stay within budget?”**

### Entry points

- Today dashboard: Weekly Basket module
- Add from product page or Deal Score card
- Add from previous week
- Receipt-history suggestion
- Household member addition
- Manual text entry
- Scan in store

### Flow

```text
Open Basket
→ add or review weekly items
→ set quantity and flexibility
→ see estimated total and budget remaining
→ review item-level buy/wait/swap guidance
→ choose basket strategy
→ shop with in-store running total
→ mark bought or scan receipt
```

### Screen concept: Weekly Basket list

```text
┌────────────────────────────────────────────┐
│ Weekly Basket                         ⚙︎   │
│ Budget 800 kr · Est. 742 kr · 58 kr left  │
│ Potential saving 126 kr                   │
│ █████████████████░░ 93% planned           │
├────────────────────────────────────────────┤
│ Best plan: Willys + Lidl                   │
│ 2 stores · 672 kr with selected swaps      │
│ [Compare strategies]                       │
├────────────────────────────────────────────┤
│ + Add item, paste list, scan, repeat week  │
├────────────────────────────────────────────┤
│ ☑ Coffee 450g                              │
│   1x · Zoégas/Löfbergs · private label OK │
│   Willys 49.90 · Deal 94 · BUY NOW        │
│   [Chart] [Swap] [Alert]                  │
│                                            │
│ ☐ Butter 500g                              │
│   1x · brand flexible                      │
│   Best 54.90 · Deal 48 · WAIT             │
│   Tip: buy next week unless needed        │
│                                            │
│ ☐ Chicken thighs                           │
│   1.5kg · any brand                        │
│   Lidl 69.90/kg · Deal 88 · BUY           │
│                                            │
│ ☐ Pasta 500g                               │
│   2x · Barilla preferred                   │
│   Swap: Garant saves 25% · High confidence│
├────────────────────────────────────────────┤
│ Missing prices: 2 items                    │
│ [Find substitutes] [Start in-store mode]   │
└────────────────────────────────────────────┘
```

### Item row controls

- Quantity and unit selector.
- Brand preference: exact only, same brand tier, private label OK, organic only.
- Stock-up toggle for long shelf-life categories.
- Household owner / note: `Added by Alex`, `Needed for recipe`.
- Mark as bought, skipped, or unavailable.

### Simple vs advanced modes

Simple item row:

```text
Coffee — Buy now — 49.90 kr at Willys
```

Advanced expanded row:

```text
Hist pct 6th · STHLM pct 11th · Unit 110.89 kr/kg · Confidence high
```

---

## 6. Core Flow D — Basket Comparison

### User goal

Answer: **“Which shopping strategy gives the best basket price for my selected stores and preferences?”**

### Flow

```text
From Weekly Basket, tap Compare strategies
→ choose scope and rules
→ review strategy cards
→ inspect savings breakdown and item assignments
→ choose strategy
→ export to shopping plan / in-store mode
```

### Comparison settings

```text
Scope: Favorite stores / Selected chains / District / All Stockholm
Max stores: 1 / 2 / 3 / unlimited
Private label: Yes / No / Ask per item
Member prices: Include / Exclude
Data: Verified only / Verified + estimated
Brand locks: Respect locked items
```

### Screen concept: Basket Strategy Comparison

```text
┌────────────────────────────────────────────┐
│ Basket Comparison                          │
│ 18 items · Budget 800 kr · No travel score │
├────────────────────────────────────────────┤
│ Filters                                    │
│ Scope [My stores ▾]  Max stores [2 ▾]      │
│ ☑ Private label swaps  ☐ Member prices     │
│ ☑ Verified only        ☑ Respect locks     │
├────────────────────────────────────────────┤
│ Option A — All at Willys                   │
│ Total 742 kr · 58 kr under budget          │
│ Saving vs median 56 kr · Confidence High   │
│ [Choose] [Details]                         │
│                                            │
│ Option B — All at Lidl                     │
│ Total 719 kr · 81 kr under budget          │
│ Missing 2 items · Confidence Medium        │
│ [Choose] [Details]                         │
│                                            │
│ Option C — Cheapest across favorites       │
│ Total 672 kr · 128 kr under budget         │
│ Willys 9 items + Lidl 7 items + Coop 2     │
│ Best price, 3 stores                       │
│ [Choose best] [Details]                    │
│                                            │
│ Option D — With private label substitutions│
│ Total 621 kr · 179 kr under budget         │
│ Saves 68 kr from swaps · 5 substitutions   │
│ [Review swaps] [Choose]                    │
├────────────────────────────────────────────┤
│ Savings breakdown                          │
│ Store choice            74 kr              │
│ Current deals           31 kr              │
│ Private label swaps     68 kr              │
│ Brand locks cost        22 kr              │
└────────────────────────────────────────────┘
```

### Details drawer: item assignment

```text
Coffee       Willys 49.90    Deal 94
Chicken      Lidl 104.85     Deal 88
Pasta        Garant swap     Saves 12 kr
Butter       Any store       Wait / optional
Cheese       Coop 42.90      Low confidence
```

### UX guardrails

- Show distance as optional store metadata only; do not include it in ranking unless the user explicitly filters by radius or selected stores.
- If an option relies on missing or estimated prices, place it below verified options unless user enables estimated data.
- Explain tradeoffs: fewer stores vs lowest total vs private-label savings.

---

## 7. Core Flow E — Weekly Budget Tracker

### User goal

Answer: **“Am I on track this week, during shopping, and after the receipt?”**

### Budget states

1. **Before shopping:** plan estimate from Weekly Basket.
2. **During shopping:** running total from marked/scanned items.
3. **After shopping:** receipt total, good buys, overspend, and remaining weekly/monthly budget.

### Flow

```text
Set weekly and monthly budget
→ add basket items and view estimated total
→ start in-store mode
→ scan or mark bought to update running total
→ scan receipt
→ review actual spend, overspend, and savings
→ update budget history and next-week suggestions
```

### Screen concept: Budget overview

```text
┌────────────────────────────────────────────┐
│ Budget                                     │
│ Week 20 · May 11–17                        │
├────────────────────────────────────────────┤
│ Weekly budget                              │
│ 642 / 800 kr used                          │
│ ████████████████░░░░ 158 kr left           │
│ Forecast after basket: 742 kr · 58 kr left │
├────────────────────────────────────────────┤
│ This week's plan                           │
│ Basket estimate        742 kr              │
│ Chosen strategy        Willys + Lidl       │
│ Potential saving       126 kr              │
│ Risk                   Medium: 2 unknowns  │
├────────────────────────────────────────────┤
│ Category budgets                           │
│ Protein      210 / 260 kr                  │
│ Dairy        88 / 120 kr                   │
│ Pantry       132 / 180 kr                  │
│ Snacks       74 / 50 kr   Over by 24       │
├────────────────────────────────────────────┤
│ [Start in-store mode] [Scan receipt]       │
└────────────────────────────────────────────┘
```

### Screen concept: In-store budget mode

```text
┌────────────────────────────────────────────┐
│ In-store mode — Willys Odenplan            │
│ Running total 436 / 800 kr                 │
│ 364 kr remaining                           │
├────────────────────────────────────────────┤
│ Scanned / bought                           │
│ ✓ Coffee       49.90  Deal 94              │
│ ✓ Chicken     104.85  Deal 88              │
│ ✓ Pasta        21.80  Swap accepted        │
├────────────────────────────────────────────┤
│ Still planned                              │
│ Butter        54.90  Wait if optional      │
│ Bananas       24.00  Any favorite store OK │
├────────────────────────────────────────────┤
│ Budget advice                              │
│ You can still add 58 kr of optional items  │
│ Skip snacks to stay below target           │
├────────────────────────────────────────────┤
│ [Scan item] [Mark bought] [Finish trip]    │
└────────────────────────────────────────────┘
```

### Screen concept: Receipt review

```text
┌────────────────────────────────────────────┐
│ Trip Summary                               │
│ Total 812 kr · Budget 800 kr               │
│ Over budget by 12 kr                       │
├────────────────────────────────────────────┤
│ Good buys                                  │
│ Chicken saved 28 kr · Deal 91              │
│ Coffee saved 21 kr · 52-week low           │
├────────────────────────────────────────────┤
│ Overspend                                  │
│ Cheese +18 kr vs local median              │
│ Snacks +24 kr vs category budget           │
├────────────────────────────────────────────┤
│ Data quality                               │
│ 16 matched · 2 need review · OCR medium    │
│ [Review unmatched items]                   │
├────────────────────────────────────────────┤
│ [Apply to budget] [Save preferences]       │
└────────────────────────────────────────────┘
```

### Budget modes

- Strict Budget: warnings before optional overspend.
- Balanced: optimize savings while preserving preferred brands.
- Convenience First: fewer stores and fewer substitutions.
- Student Budget: cheapest calories/protein and private label encouraged.
- Family Budget: bulk, recurring items, household permissions.
- Healthy Budget: nutrition-per-krona and dietary filters promoted.

---

## 8. Cross-flow System Map

```text
Today Dashboard
  ├─ Budget card ───────────────→ Budget Tracker
  ├─ Weekly Basket card ────────→ Shopping List / Basket
  ├─ Best deal card ────────────→ Deal Score → Price Chart
  └─ Watchlist alert ───────────→ Product Price Terminal

Product Price Terminal
  ├─ Add to Basket ─────────────→ Shopping List
  ├─ Set Alert ─────────────────→ Watchlist
  ├─ Compare Stores ────────────→ Basket Comparison context
  └─ Smart Swap ────────────────→ Basket substitution review

Weekly Basket
  ├─ Compare strategies ────────→ Basket Comparison
  ├─ Start in-store mode ───────→ Budget running total
  └─ Scan receipt ──────────────→ Receipt Review → Budget history
```

---

## 9. MVP Screen Inventory

### Must-have MVP screens

1. **Product Price Terminal** with ticker header, price chart, store prices, Deal Score, unit price, and Watchlist button.
2. **Deal Score Detail** component with score, verdict, reasons, formula ingredients, confidence, and CTAs.
3. **Weekly Basket** with items, quantities, estimate, budget remaining, buy/wait guidance, substitutions, and mark-bought state.
4. **Basket Comparison** with strategy cards, filter rules, no travel-time penalty, savings breakdown, and item assignment details.
5. **Budget Tracker** with weekly/monthly budget, basket estimate, running total, receipt total, and over/under budget summary.

### Later enhancements

- Full index pages and heatmaps.
- Household collaboration permissions.
- Meal planning from deals.
- Personal grocery inflation charts.
- Advanced screeners.

---

## 10. Accessibility and Localization Notes

- Use `kr` / `SEK` consistently; mobile cards can use `kr`, detailed tables can use `SEK`.
- Do not rely on red/green alone; include labels such as `Buy`, `Wait`, and `Over budget`.
- Tap targets should support one-handed grocery-store use.
- In-store mode should work with low connectivity and sync later.
- Support Swedish store names and product units: `kr/kg`, `kr/l`, `kr/st`, `kr/rulle`, `kr/tvätt`, `kr/blöja`.

---

## 11. Open UX Decisions

1. Whether simple users see the full Deal Score formula by default or only after expanding `Why?`.
2. Whether `Today` or `Basket` should be the first screen after onboarding for budget-first users.
3. How aggressive the app should be when suggesting private label swaps in sensitive categories.
4. Whether strategy comparison should default to `favorite stores only` or `selected district` in Stockholm.
5. How to label estimated flyer prices so users trust useful data without mistaking it for shelf verification.
