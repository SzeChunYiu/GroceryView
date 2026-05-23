# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-23 01:23 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**20** store pages, ~**19** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **267**

## 🛒 What shoppers get (consumer value)

The metrics a real shopper cares about — ✅ = core engine wired into the web app,
🔻 = engine ready, surfacing in progress. Every figure traces to real data + a
confidence indicator (never fabricated).

- **💰 Save up to ~47% right now** — biggest cross-chain price gap currently shown on the homepage (the headline "why use this").
- ✅ **Cheapest chain (Chain Price Index)** — who's cheapest, 100-centred, over time
- ✅ **Cheapest store for *my* basket** — store basket coverage + cost
- ✅ **Today's best deals / category deal leaders** — biggest real discounts now
- ✅ **Your personal grocery inflation (CPI)** — how *your* basket's cost is trending
- ✅ **Nutrition per krona** — most protein/calories per SEK
- ✅ **Budget vs premium (brand-tier index)** — how much the store-brand saves
- ✅ **Expiry / clearance deal radar** — cut waste, grab markdowns
- ✅ **Watchlist price-drop alerts** — follow a product, get told when it falls
- ✅ **Price-by-district map** — where shopping is cheaper near you

**Consumer-metric roadmap (highest-value, not yet live):** Deal Score + Buy/Wait
verdict · 52-week-low badge · price-drop movers board · data-freshness badge ·
loyalty/member-price-adjusted basket (the feature *no* rival has).

## 🎯 Current sprint target

Ship a **visibly populated Stockholm grocery price terminal** at

## ✅ Recently shipped (last 15 merged `feat:`/`wire:` PRs)

- #1165 feat(notifications): add provider delivery adapters
- #1155 feat(ingest): add ICA Tidaholm promotions
- #1152 feat(ingest): add Coop branch weekly discounts
- #1150 feat(ingest): add ICA Tibro promotions
- #1148 feat(ingest): refresh OpenFoodFacts barcode nutrition
- #1146 feat(ingest): add Coop weekly branch discounts
- #1143 feat(ingest): add ICA Hedemyrs promotions
- #1141 feat(ingest): add Coop Åmål weekly discounts
- #1139 feat(review): add more-info decision control
- #1137 feat(ingest): enrich OpenFoodFacts alternate names
- #1136 feat(account): add billing action controls
- #1135 feat(ingest): add ICA Nära Klingan promotions
- #1132 feat(seo): add hreflang alternates
- #1131 feat(billing): add Stripe portal sessions
- #1129 feat(persona): add multi-week stock-up list

## 🔄 In progress (open PRs)

- #1166 feat(notifications): wire runtime provider worker

## 📋 To-do (from GOAL.md backlog)

**P1 — highest visible value**
- Deal score + verdict on `products/[slug]`
- Cheapest-chain-per-product
- Category deal leaders
- Personal grocery inflation
- Smart swaps

**P2**
- Nutrition per krona
- Expiry deal radar
- Watchlist price alerts
- Basket optimizer
- Deal-based meals
- Pantry replenishment
- Brand-tier index

**P3 — map + index tie-ins**
- Students / young singles
- Families with kids
- Elderly / pensioners
- Immigrants / non-native speakers
- Budget-conscious / low-income
- Health & fitness
- Busy professionals
- Eco-conscious
- Meal-preppers / large households
- Deal-hunters / foodies

**Steal-list (rival features to adopt)**
- Browser extension overlay
- Public price/nutrition API
- Loyalty-adjusted basket comparison
- Split-shop / cheapest-route basket optimizer
- Flyer / digital-catalog ingestion
- Ingestion: classify + map loose items.
- Cross-chain commodity comparison
- Per-chain fresh-food index
- Unit-price normalisation everywhere
- Curator/community review of mappings
- Receipt-fed mapping growth
- Sweden (home) — win first.
- Iceland — cheap proof-of-concept.
- Norway — the real expansion prize.
- Denmark — only if the terminal decisively beats Prej
- Finland — last, NOT first.

---
_Coverage today: Swedish chains (Willys, Hemköp, ICA, Coop, Mathem). Nordic
expansion (Norway→Iceland→Denmark) tracked in GOAL.md; Finland deprioritised._
