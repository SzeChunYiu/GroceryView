# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-25 13:52 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**24** store pages, ~**35** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **1**

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

- #3256 feat(web): lazy load card images with placeholders

## 🔄 In progress (open PRs)

- #3371 Add cross-category price comparison helper
- #3370 Add screener service query tests
- #3366 Document St1 fuel pricing quirks
- #3363 Add smart shopping list page
- #3362 Add carbon score badges to product cards
- #3361 Add BOGO promotion parser
- #3359 Add observation origin cert migration
- #3357 Add product best-time-to-buy prediction badge
- #3355 Add group-buy coordinator e2e
- #3354 Add ingestion row contract validation
- #3353 data(web): flag ICA member-only promotions
- #3351 Show generic OTC medication savings
- #3350 Add substitution willingness schema
- #3349 Add Shell SE pricing quirk study
- #3348 Restore current web contract markers
- #3347 Add Snabbgross daily materialization coverage
- #3346 Document Circle K Sweden connector
- #3345 Add Mlyn Norway coverage connector
- #3343 Add consumer complaint helper
- #3342 Add Tanka pricing quirks study
- #3341 Add source freshness monitoring dashboard
- #3340 Ticket 1625: badge retailer types in product quotes
- #3339 [P1 Test] Connector test: rema-1000-no (fixture-based)
- #3338 Document OKQ8 fuel pricing quirks
- #3337 Add Middle Eastern NO connector
- #3335 Seed produce class taxonomy
- #3334 Add Rusta Norway connector
- #3333 Study Pressbyrån pricing quirks
- #3332 Add metadata for grocery index routes
- #3331 Document 10-11 IS pricing source
- #3330 Document Lighthouse PR rescue
- #3326 Add Joker NO flyer connector
- #3324 Add Biltema NO household connector
- #3323 Filter store basket coverage by market
- #3322 Update PR rescue completion log
- #3321 Docs: document ConfidenceBadge
- #3319 Add flyer AI vision fallback
- #3318 Add chain study comparison matrix
- #3317 Add chain study comparison matrix
- #3316 feat(ingest): refresh Axfood weekly flyer discounts
- #3307 Document Swedish grocery data sources
- #3291 Parameterize Overpass grocery country
- #3281 Add cursor pagination to catalog endpoints
- #3277 Add product OpenGraph metadata
- #3260 Add accessible modal primitives
- #3241 fix: update stale test assertions and implement missing features
- #3221 Add Circle K SE fuel and convenience connector
- #3214 Study DocMorris SE pricing quirks
- #3205 Add unit audit table filters
- #3196 Add fixed-off promotion parser

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
