# GroceryView — a financial terminal for groceries

> **Live status board — auto-generated, do not hand-edit.**
> Regenerated from real signals (merged PRs, open PRs, GOAL.md, live prod HTML) by
> `.shared/grocery-readme-board.sh`. Last refresh: 2026-05-24 06:20 UTC.

GroceryView turns grocery prices into a market: every product is a **ticker** with a
price chart, chains/categories/brands have **indices**, deals get a **Buy/Wait**
rating, and shoppers **track, compare, and get alerted** across chains over time.
Strategy + competitor teardown: [`GOAL.md`](GOAL.md) · [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

## 🟢 Live

- **Site:** [https://grocery-web-mu.vercel.app](https://grocery-web-mu.vercel.app) — `/` returns HTTP **200**
- **Visible on homepage:** ~**24** store pages, ~**35** product pages
- **Shipped `feat:`/`wire:` PRs to date:** **190**

## 🧰 One-command local development

New contributors can start the core local stack with Docker Compose:

```bash
docker compose up --build api
```

The compose stack starts PostgreSQL, Redis, applies Prisma migrations, builds the
API workspace, and serves the API at [http://localhost:3001](http://localhost:3001).
Swagger docs are available at `/api`; health checks are available at `/health` and
`/api/health`. Data is stored in named Docker volumes; reset with
`docker compose down -v`.

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

- #1536 feat(ingest): expand Axfood weekly flyer rows
- #1543 feat(ingest): deepen Willys category product rows
- #1537 feat: wire weekly basket strategy coverage
- #1528 feat(ingest): deepen verified grocery data rows
- #1529 feat(ingest): add Coop branch weekly flyer discounts
- #1489 feat(ingest): expand ICA Toria store prices
- #1524 feat(api): save authenticated settings preferences
- #1520 feat(ingest): add Coop branch weekly flyer discounts
- #1384 feat(ingest): expand Axfood weekly flyer discounts
- #1503 feat(ingestion): cache product images during daily runs
- #1497 feat: add multi-week price planning
- #1496 feat(web): compare commodity rows by unit price
- #1500 feat(web): standardize unit price labels
- #1483 feat(web): add cookies disclosure page
- #1498 feat(web): add basket calculator page

## 🔄 In progress (open PRs)

- #1558 Add CORS preflight allowlist assertions
- #1557 test(web): add analytics consent gate test coverage
- #1556 [codex] Add keyboard navigation to search results
- #1555 Enrich API swagger parameter and response metadata
- #1554 [codex] Add global skip link _(draft)_
- #1544 [codex] Add Prisma test factories _(draft)_
- #1541 test(api): cover items routes
- #1540 [codex] Add local price statistics pages _(draft)_
- #1538 feat: stream live product prices via WebSocket
- #1535 Implement toast notifications for shopping list add/remove actions
- #1534 feat: add rolling average deals endpoint _(draft)_
- #1533 feat(web): wire pantry replenishment planner
- #1526 feat(api): publish OpenAPI docs
- #1525 lunarc/feat watchlist
- #1522 Implement hidden item and store preferences
- #1521 [ticket-cn070-p28] Implement admin role-based access control
- #1517 api: restrict CORS to production and localhost
- #1516 feat(ingest): add Coop Hushallsost flyer discounts _(draft)_
- #1515 [codex] Add preferred stores picker _(draft)_
- #1513 lunarc/feat savings dashboard
- #1512 lunarc/feat expiry deals
- #1511 feat(ingest): add ICA Kvantum Tranas store promotions
- #1510 Handle unavailable product prices
- #1508 Build admin user management page
- #1507 lunarc/feat bottom nav
- #1502 Add privacy and terms pages with footer links
- #1495 Add store comparison e2e coverage
- #1491 lunarc/feat store price percentile
- #1484 fix: add breadcrumb coverage for category and product pages
- #1480 feat(web): group desktop navigation
- #1478 chore: add Renovate configuration and validation
- #1477 lunarc/feat screener
- #1474 ci: add Renovate config and validation
- #1472 Add canonical URL tags for filtered category and search pages
- #1471 Add breadcrumbs to category and item pages
- #1467 [codex] Add auth route crawl rules
- #1462 Add robots and sitemap crawl policy for public pages
- #1459 Add empty state illustration for zero search results
- #1453 [codex] Carry trust evidence for receipt alias candidates _(draft)_
- #1441 Add query-driven chain comparison table
- #1433 [codex] Add confidence badge tooltip _(draft)_
- #1416 [codex] Add DB snapshot partial cache CLI smoke
- #1415 feat(web): add homepage brand filter _(draft)_
- #1412 test: cover DB snapshot cache miss CLI
- #1411 [codex] Add ICA Maxi bulk connector _(draft)_
- #1407 feat(web): add ICA store locator map
- #1406 feat(web): add barcode search helper and product UI flow
- #1403 feat(web): add EAN barcode search API route
- #1401 Add product offer JSON-LD
- #1400 [codex] Add notification inbox contract schema _(draft)_

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
