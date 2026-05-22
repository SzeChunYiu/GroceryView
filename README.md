# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-22 21:19 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**20** store pages, ~**19** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **283**

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

- #1096 feat(i18n): add next-intl language preference switching
- #1095 feat(ingest): add bounded daily connector runner
- #1093 feat(persona): add high protein deal finder
- #1086 feat(web): rebuild homepage as Grocery Index market terminal
- #1090 feat(steal): compare loyalty adjusted baskets
- #1089 feat(ingest): add ICA Lindvallen store prices
- #1088 feat(steal): publish price nutrition api docs
- #1084 feat(i18n): add persisted language preference switcher
- #1085 feat(domain): add multi-vertical foundation
- #1083 feat(commodity): classify loose ingestion items
- #1081 feat(account): add signed-in ad disclosure controls
- #1080 feat(commodity): surface mapping review queue
- #1078 feat(ingest): refresh OpenFoodFacts barcode nutrition
- #1074 feat(ingest): add ICA Sälen promotions
- #1076 feat(web): rank matched store price percentiles

## 🔄 In progress (open PRs)

- #1101 feat(ingest): add ICA Klingan promotions
- #1100 feat(ingest): export DB-backed site snapshots
- #1099 feat(ingest): add Coop small-store flyer discounts
- #1098 feat(persona): add freezer batch cook planner

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
