# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-22 09:50 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**20** store pages, ~**19** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **313**

## 🎯 Current sprint target

Ship a **visibly populated Stockholm grocery price terminal** at

## ✅ Recently shipped (last 15 merged `feat:`/`wire:` PRs)

- #773 feat(persona): add family bulk unit prices
- #771 feat(ingest): refresh OpenFoodFacts barcode nutrition
- #769 feat(persona): add student deal recipes
- #765 feat(persona): add student budget tracker
- #763 feat(ingest): add ICA Södermalm store prices
- #764 feat(ingest): deepen public source rows
- #762 feat(persona): add single-portion deals
- #761 feat(ingest): deepen retailer product rows
- #758 feat(persona): surface student basics board
- #759 feat(ingest): add ICA Karlaplan store prices
- #756 feat(api): serve real store flyer offers
- #755 feat(ingest): enrich retailer barcodes with OpenFoodFacts nutrition
- #754 feat(api): serve real latest prices
- #752 feat(web): refine chain index with matched basket
- #753 feat(ingest): add Coop Bromma weekly discounts

## 🔄 In progress (open PRs)

- #775 feat(ingest): expand Axfood weekly flyer discounts
- #774 feat(ingest): add Coop branch weekly discounts
- #745 test(ingest): cover Coop weekly discounts connector _(draft)_
- #730 feat(ingest): deepen real grocery data sources

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
- Sweden (home) — win first.
- Iceland — cheap proof-of-concept.
- Norway — the real expansion prize.
- Denmark — only if the terminal decisively beats Prej
- Finland — last, NOT first.

---
_Coverage today: Swedish chains (Willys, Hemköp, ICA, Coop, Mathem). Nordic
expansion (Norway→Iceland→Denmark) tracked in GOAL.md; Finland deprioritised._
