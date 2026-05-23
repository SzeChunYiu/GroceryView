# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-23 05:27 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**20** store pages, ~**19** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **250**

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

- #1213 feat(ingestion): expose daily chain summaries
- #1211 feat(products): explain price move notes
- #1205 feat(ingestion): bound bulk daily runner
- #1204 feat(compare): add price overlay chart
- #1197 feat(scanning): add hosted upload smoke
- #1196 feat(watchlist): add price sparklines
- #1194 feat(scanning): add upload write readiness
- #1192 feat(scanning): add upload CORS readiness
- #1190 feat(scanning): add upload storage readiness
- #1187 feat(deals): add ranked deal screener
- #1185 feat(scanning): add live provider health checks
- #1183 feat(readiness): expose scan provider health
- #1181 feat(scanning): add OpenFoodFacts barcode provider
- #1179 feat(map): highlight cheapest branch evidence
- #1178 feat(scanning): add OCR.space receipt provider

## 🔄 In progress (open PRs)

- #1219 feat(products): add faceted search surface

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
