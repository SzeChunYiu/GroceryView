# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-23 21:15 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**24** store pages, ~**35** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **209**

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

- #1421 feat: add product card price sparklines
- #1414 feat(ingestion): add unit price string normalisation
- #1419 feat(web): add category breadcrumbs
- #1395 feat(ingest): add Coop branch flyer discounts
- #1408 feat(web): share screener query defaults between deals and screener
- #1402 feat(ingest): add Lidl bulk products connector
- #1404 feat(web): add price alert subscription routes
- #1405 feat(web): add weekly price-drop digest API
- #1372 feat(ingest): deepen Matspar public search rows
- #1374 wire pharmacy daily connector export
- #1390 feat(web): rebase and sync watchlist with verified-data inputs
- #1375 feat(ingest): deepen Mathem public search rows
- #1333 feat(fuel): prices
- #1309 feat(ingest): deepen real grocery source rows
- #1370 feat(ingestion): wire pharmacy daily connector

## 🔄 In progress (open PRs)

- #1428 [codex] Guard account deletion flow route
- #1427 [codex] Guard dedicated expiry deals radar page
- #1426 Track out-of-stock observations
- #1425 feat: add Willys bulk ingestion connector
- #1424 [codex] Align screener sort options with constants
- #1423 [codex] Add products pagination endpoint
- #1422 [codex] Expose product pagination totals
- #1416 [codex] Add DB snapshot partial cache CLI smoke
- #1415 feat(web): add homepage brand filter _(draft)_
- #1412 test: cover DB snapshot cache miss CLI
- #1411 [codex] Add ICA Maxi bulk connector _(draft)_
- #1407 feat(web): add ICA store locator map
- #1406 feat(web): add barcode search helper and product UI flow
- #1403 feat(web): add EAN barcode search API route
- #1401 Add product offer JSON-LD
- #1400 [codex] Add notification inbox contract schema _(draft)_
- #1397 [codex] Back notification inbox with persisted rows _(draft)_
- #1396 [codex] Make watchlist notification timing deterministic _(draft)_
- #1394 test(web): add explicit deals→screener query contract check
- #1391 test: cover DB IO hotspot compare CLI _(draft)_
- #1389 Move deal screener contract to /screener
- #1387 feat(pharmacy): apohem
- #1384 feat(ingest): expand Axfood weekly flyer discounts
- #1383 Generate web price snapshot from Postgres
- #1382 feat(fuel): add AdBlue grade catalog
- #1381 Add country ingestion batch runner
- #1377 feat(ingest): add ICA Vannas store price
- #1376 ci: compare daily DB IO hotspot captures
- #1373 feat(ingest): deepen Lidl store offer rows
- #1371 test(ingest): smoke DB snapshot cache bypass _(draft)_
- #1367 ops: capture db IO hotspots
- #1365 feat(ingest): add ICA Toria store promotions
- #1360 test(ingest): verify ICA source summary sync _(draft)_
- #1358 Keep DB cutover audit scoped
- #1349 Wire meal cost breakdown route
- #1348 lunarc/feat product cross chain table
- #1347 feat(ingest): expand Axfood weekly flyer discounts
- #1344 feat(web): wire meal planner deal suggestions
- #1337 feat(domain): multi-vertical tag + vertical routes
- #1329 feat(web): rank nutrition value with confidence
- #1304 feat(ingest): add ICA Tierp promotions
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
