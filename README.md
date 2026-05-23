# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-23 14:36 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**24** store pages, ~**35** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **211**

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

- #1342 feat(web): add account deletion plan
- #1328 feat(web): add index methodology page
- #1324 wire: surface ICA store promotion source imports
- #1323 feat(ingest): add all-store daily batch runner
- #1319 feat(ingest): add ICA Tomelilla store prices
- #1314 feat(fuel): prices
- #1317 feat(ingest): add Coop branch weekly discounts
- #1313 feat(ingest): add ICA Supermarket Tierp prices
- #1312 feat(fuel): surface target price alerts
- #1308 feat(ingest): add ICA Kvantum Kista promotions
- #1303 feat(ingest): expand Axfood weekly branch flyers
- #1297 feat(fuel): prices
- #1291 feat: wire pantry planner replenishment
- #1289 feat(fuel): prices
- #1280 feat(fuel): prices

## 🔄 In progress (open PRs)

- #1348 lunarc/feat product cross chain table
- #1347 feat(ingest): expand Axfood weekly flyer discounts
- #1346 feat(web): add cookies disclosure page
- #1345 feat(web): add index symbol route
- #1344 feat(web): wire meal planner deal suggestions
- #1341 Surface store percentile confidence
- #1338 feat(fuel): stations
- #1337 feat(domain): multi-vertical tag + vertical routes
- #1336 feat(pharmacy): apohem
- #1334 feat(web): wire watchlist alert planning
- #1333 feat(fuel): prices
- #1332 feat(ingest): expand ICA Tierp store promotions
- #1331 feat(ingest): deepen live grocery data sources
- #1330 lunarc/feat bottom nav
- #1329 feat(web): rank nutrition value with confidence
- #1326 feat(web): wire pantry replenishment planner
- #1310 feat(ingest): add Coop branch weekly discounts
- #1309 feat(ingest): deepen real grocery source rows
- #1306 feat(ingest): expand Coop weekly branch discounts
- #1305 feat(ingest): deepen live grocery source coverage
- #1304 feat(ingest): add ICA Tierp promotions
- #1298 feat(ingest): deepen Matspar Matpriskollen Lidl ICA rows
- #1283 feat(web): add verified deal screener
- #1261 feat(web): group desktop navigation
- #1260 feat(web): dark mode (WIP from LUNARC fleet)

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
