# GOAL — GroceryView

Updated: 2026-05-21 10:30 by billy (operator)

## Sprint target (≤7 days)

Ship a **visibly populated Stockholm grocery price terminal** at
`https://grocery-web-mu.vercel.app/`. The live homepage must surface, at a
minimum, **every store and product fixture already produced by the swarm** —
not the Next.js scaffold seed. Each iteration must measurably grow what an
unauthenticated visitor sees on `/`.

The previous infrastructure goals (catalog coverage, ingestion connectors, API
surface, DB schema) still hold as regression bars but **stop counting as
sprint progress** unless they also reach the user-visible artifact this
iteration. See [Visible Artifact](#visible-artifact) below for the gate.

## Acceptance test (executable)

```bash
# 1. driver file is not the scaffold stub — must declare ≥6 stores and ≥10 products
NPROD=$(grep -c "^\s*slug: '" apps/web/src/lib/demo-data.ts)
NSTORE=$(grep -c "name: '[A-Z]" apps/web/src/lib/demo-data.ts)
[ "$NPROD" -ge 10 ] && [ "$NSTORE" -ge 6 ]

# 2. prod URL serves the same store/product slugs from the driver file
LIVE=$(curl -sL https://grocery-web-mu.vercel.app/)
for s in willys-odenplan ica-nara-sergels-torg coop-swedenborgsgatan lidl-sveavagen; do
  echo "$LIVE" | grep -q "$s" || { echo "missing: $s on prod"; exit 1; }
done

# 3. every store in packages/ingestion fixtures is mirrored in the driver file
INGESTION_STORES=$(grep -oE "storeName: '[^']+'" packages/ingestion/src/index.ts | sort -u)
for s in $INGESTION_STORES; do grep -qF "$s" apps/web/src/lib/demo-data.ts; done
```

## Visible Artifact

The live site at `https://grocery-web-mu.vercel.app/` renders from:

- **Driver files (commits MUST grow these or `wire:` to these):**
  - `apps/web/src/lib/demo-data.ts` — stores, products, categories shown on `/`
  - `apps/web/src/components/sample-data.ts` — basket / household / privacy demo
  - `apps/web/src/components/market-shell.tsx` — the JSX that renders the
    driver-file data
- **Driver routes:** `apps/web/src/app/**/page.tsx` (in particular `page.tsx`,
  `products/[slug]/page.tsx`, `stores/[slug]/page.tsx`)
- **Prod URL:** `https://grocery-web-mu.vercel.app/`
- **Live count gate (acceptance test #2 above):** at least 6 distinct store
  slugs and 10 distinct product slugs visible in the rendered HTML.

**Worker rule:** an iteration that adds fixtures to `packages/ingestion`,
`packages/catalog`, `apps/api` etc. WITHOUT also adding a row to a driver
file is REJECTED by the MANAGER as infrastructure-only. The same iteration
must either (a) bump a driver file, OR (b) be an explicit `wire:` PR titled
`wire: surface <X> to homepage` linking the new fixture to a driver file.

## Product source paths (commits must touch ≥1 of these)

- `apps/web/`
- `apps/api/`
- `apps/mobile/`
- `packages/catalog/`
- `packages/ingestion/`
- `packages/server/`
- `packages/api/`
- `packages/db/`
- `packages/scanning/`
- `packages/ops/`
- `packages/monetization/`
- `packages/notifications/`
- `packages/auth/`
- `packages/core/`

## Non-product paths (commits touching ONLY these are REVERTED by managers)

- `docs/`, `codex-tasks/`, `change_log/`, `reports/`, `deploy/`

## Banned iteration types

- queue-refresh, planner-audit-without-source-diff, validator-policy-refresh,
  manager-review-without-rejection-or-accept, docs-only-handoff,
  status-summary-as-deliverable
- **NEW:** infrastructure-only iterations that do not reach a driver file (see
  Visible Artifact above)

## Feature backlog — surface the analytics engine (operator priority, 2026-05-21)

`@groceryview/core` already exports ~41 TESTED analytics functions; the web app
imports only ~4. The single biggest visible-value lever now is **wiring real
core analytics into the already-scaffolded routes** (`/compare`, `/meal-planner`,
`/savings-dashboard`, `/watchlist`, `/pantry-planner`, `categories/[slug]`,
`products/[slug]`). Each item below is one feature = one PR.

**Hard rules for every backlog item:**
- Import and call the REAL core function — never reimplement, stub, or hardcode
  its output.
- **No fabricated numbers.** If an input is missing (e.g. price history for a
  percentile), derive it from data we actually have (cross-chain spread, unit
  prices) and show a coverage/confidence indicator — never invent values. This
  is the same discipline as `calculateChainPriceIndex` (already shipped).
- Reach a driver file / visible route (Visible-Artifact gate still applies).
- Build + typecheck must pass; add/extend a core test if you touch core.

### P1 — highest visible value
1. **Deal score + verdict on `products/[slug]`** — `calculateDealScore` + `scoreBand`
   ("Excellent deal / Buy now" … "Not a real deal / Wait"). Where full history is
   missing, feed percentiles derived from the cross-chain price spread and mark
   confidence. This is the "real-deal detector".
2. **Cheapest-chain-per-product** — use the cross-chain matched products (the
   #531 Willys↔Hemköp matches) to show, on `products/[slug]` and `/compare`,
   each chain's price for the item and highlight the cheapest. The user's
   "price across chains / who's cheapest" ask.
3. **Category deal leaders** — `summarizeCategoryDealLeaders` on `categories/[slug]`
   and a "Today's best deals" strip on `/`.
4. **Personal grocery inflation** — `calculatePersonalGroceryInflation` on
   `/savings-dashboard` (a personal CPI for the visitor's basket).
5. **Smart swaps** — `recommendSmartSwaps` on `products/[slug]` (cheaper
   equivalent substitutes).

### P2
6. **Nutrition per krona** — `rankNutritionPerKrona` (best calories/protein per SEK).
7. **Expiry deal radar** — `buildExpiryDealRadar` on a `/deals` page.
8. **Watchlist price alerts** — `buildWatchlistAlerts` + `planNotifications` on `/watchlist`.
9. **Basket optimizer** — `compareBasketStrategies` + `summarizeStoreBasketCoverage`
   on `/weekly-basket` (which store is cheapest for *your* basket).
10. **Deal-based meals** — `suggestDealBasedMeals` on `/meal-planner`.
11. **Pantry replenishment** — `planPantryReplenishment` on `/pantry-planner`.
12. **Brand-tier index** — `calculateBrandTierIndices` (budget vs premium) as a
    section on `/chain-index`.

### P3 — map + index tie-ins
13. Color `/map` store markers by their chain's `/chain-index` score; add a
    "cheapest chain near me" highlight.
14. Price-by-district heat overlay on `/map`.
15. Matched-basket refinement for `calculateChainPriceIndex` using the cross-chain
    matched products (raises confidence; keep the 100-centred scale).

Already shipped this sprint (regression bars): `/map` (#575), `/chain-index` (#583).

## Product north-star — "a financial terminal for groceries"

GroceryView turns grocery prices into a market: every product is a **ticker**
with a price chart, chains/categories/brands have **indices**, deals get a
**Buy/Wait rating**, and shoppers **track, compare, and get alerted** — across
chains and branches, over time. Reach full parity with Matspar (basket
comparison) + Matpriskollen (offer/price tracking), THEN exceed them with
best-in-class UX distilled from outside the grocery space. Workers: treat this
section as the long-horizon backlog once the P1–P3 analytics items are shipped;
one feature = one PR; every number must trace to real data + a confidence
indicator, never fabricated.

### Cross-domain distillation (steal the best, adapt to groceries)
| Source | Feature to adopt | GroceryView application |
|--------|------------------|--------------------------|
| **TradingView** | multi-timeframe charts (1W/1M/3M/1Y/ALL), crosshair value readout, compare-overlay, watchlist sparklines, screener, heatmap | product price charts; overlay two products/chains; chain/category price heatmap; "deal screener" (biggest drops, cheapest /kg) |
| **Investing.com** | technical "Buy/Sell" summary widget, economic calendar, news-tied-to-symbol, portfolio P/L | Deal-Score verdict widget; promo/seasonal calendar; "why did X move" notes; basket-as-portfolio savings |
| **CamelCamelCamel / Keepa** | price-history graph + "lowest in 30/90/365 days" + drop alerts | per-product price history + 52-week-low badge + watchlist drop alerts |
| **Google Flights / Skyscanner** | "prices currently low/high vs usual" + buy-now-vs-wait + price calendar | seasonal "buy now or wait" signal; price-vs-usual indicator |
| **Airbnb** | instant faceted search, synced map+list, beautiful cards, wishlist (save), trust badges, mobile-first | grocery search w/ filters (category, label, /kg, chain, in-stock); /map ↔ list sync; product cards; watchlist heart; data-freshness/confidence badges |
| **Robinhood** | approachable charts, portfolio value over time, delightful simple UX, push alerts | personal grocery-inflation curve; clean mobile charts; alert pushes |
| **Yuka** | scan → health/score | receipt/barcode scan → nutrition-per-krona + track real spend vs index |
| **Spotify / Netflix** | personalized "for you" rails | "deals for your watchlist", recommended swaps, seasonal picks |

### Full feature catalog (build toward all; real data + confidence only)
- **Markets / Index:** Grocery Index headline ticker; Chain Price Index + chart (compare chains over time); category & brand-tier sector indices; market heatmap; movers board (biggest weekly drops/rises).
- **Product / Ticker:** product page = ticker — price chart (multi-timeframe), 7-day %, 52-week low/high, volatility, unit price, labels; cross-chain price table (cheapest highlighted); Deal Score + Buy/Wait verdict; smart swaps; "lowest in N days" badge.
- **Compare:** cross-chain "who's cheapest now" per product + per basket; basket optimizer (single vs split shop); compare-overlay chart for 2+ items/chains.
- **Discover / Search:** instant faceted search (category, label, dietary, /kg range, chain, in-stock); full-taxonomy category browse; weekly offers/flyer deals by store (per-branch discounts); `/deals` screener.
- **Track / Alerts:** watchlist (follow products); price-target & %-drop alerts; weekly digest; notifications.
- **Personal:** personal grocery inflation (your CPI) + trend; basket cost trend; budget tracker; shopping lists with live totals; household sharing; receipt scanning → real-spend vs index; pantry replenishment; deal-based meal planner.
- **Map:** stores map + cheapest-near-me; markers colored by chain index; price-by-district heat; map↔list sync.
- **Content / Trust:** "why prices moved" notes; seasonal/promo calendar; data-freshness + confidence badges everywhere; source citations.

### UI/UX standard — "professional & beautiful" is a GATE, not a nice-to-have
- **Aesthetic:** financial-terminal clarity (TradingView/Robinhood) + Airbnb-grade polish — color-coded up/down (green/red), tickers, sparklines, dense-but-legible, generous whitespace. No generic scaffold look.
- **Charts:** use `lightweight-charts` (already a dependency) for price charts; sparklines on cards.
- **Design system:** consistent tokens (type scale, spacing, color), light + dark, reusable components.
- **Responsive & mobile-first** (groceries are a phone task); **accessible** (WCAG AA, keyboard, contrast); **fast** (skeleton states, no layout shift).
- **Honesty in UI:** every figure traces to real data; show coverage/confidence; missing inputs are derived from real cross-chain spread/unit prices and labelled, never invented. Brand/source colors are tokens, not ad-hoc.
- **Time-series features require the daily price DB** (see ingestion plan): charts may render from fixtures now but must swap to live DB observations — that price tape is what makes the index/terminal real.

## Consumer personas — who uses GroceryView and what they get

Build features through the eyes of real people in society. Each persona maps to
concrete, shippable features on top of the price-index engine. One persona-
feature = one PR; real data + confidence only. Workers: after the P1–P3
analytics items, pick the next unbuilt persona feature; tag PRs `feat(persona):`.

1. **Students / young singles** (tight budget, small portions): "cheapest basics" staples board across chains; single-portion deal finder; weekly budget tracker; recipes built from this week's deals.
2. **Families with kids** (value + planning): family-pack / bulk unit-price comparison; weekly family meal planner from deals; kids' snack & lunchbox deal feed; baby/diaper price tracking + alerts.
3. **Elderly / pensioners** (fixed income, simplicity, accessibility): large-text/high-contrast mode; staples price-stability view; fixed-income monthly budget; nearest-store + delivery options.
4. **Immigrants / non-native speakers** (language + familiar products): multilingual UI (top immigrant languages); halal/kosher/ethnic-aisle product finder; familiar-brand search; image-first browsing.
5. **Budget-conscious / low-income** (every krona counts): "lowest price anywhere" + cross-branch discount radar; "stretch your krona" basket optimizer; price-drop alerts on essentials; cheapest-store-for-my-list routing.
6. **Health & fitness** (nutrition value): nutrition-per-krona ranking; protein/calorie/macro optimizer; organic/Keyhole/vegan filters; high-protein deal finder.
7. **Busy professionals** (speed + convenience): one-tap basket optimization; saved baskets + auto-reorder; delivery-vs-store convenience comparison.
8. **Eco-conscious** (sustainability + waste): expiry/clearance deal radar (cut waste); local & seasonal picks; sustainable-brand filter; "cheaper + greener" suggestions.
9. **Meal-preppers / large households** (bulk + planning): bulk-buy unit-price optimizer; freezer/batch-cook planner from deals; multi-week list with price forecast.
10. **Deal-hunters / foodies** (discovery): new-product & price-drop alerts; specialty/premium tier tracking; "today's best deals" movers; watchlist with target prices.

Cross-cutting (every persona benefits, already engine-backed): cross-chain/branch price comparison, price-movement charts (the stock index), Buy/Wait deal signals, personal grocery inflation, watchlist alerts, store map. Each persona is a different *lens* on the same engine — surface the right view for the right person.

## Competitor distillation — real grocery rivals (worldwide)

Full teardown lives in [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md)
(verified 2026-05-22, 12 markets). The strategic conclusion that drives the
backlog below:

- **Every rival worldwide is a list-and-alert utility — none is a terminal.**
  Matpriskollen (SE), Prej (DK), Kassalapp (NO), Trolley (UK), Reprice (FR),
  Super Save (PT), the six Australian apps: all do barcode + list + alert +
  basic history. The charted/indexed/Buy-Wait *terminal* (our north-star above)
  is unoccupied across the entire field. That is the wedge — and it is portable
  to every market.
- **There is no empty developed market.** Sweden, all Nordics, UK, DE, ES, FR,
  PT, PL and Australia are all taken. Geography is the wrong axis; product
  differentiation is the right one. Win Sweden on the terminal UX first.

### Steal-list — strong rival features NOT yet in our backlog (one feature = one PR)
Tag these `feat(steal):`. Same hard rules as every backlog item (real data +
confidence, reach a driver file, build/typecheck pass).

1. **Browser extension overlay** — show the cheaper alternative *inline on the
   retailer's own site* (ICA/Coop/Willys online), the way Trolley (UK) and
   WhichGrocer/GroceryWise (AU) do. Our biggest missing acquisition channel.
2. **Public price/nutrition API** — documented read API over our DB
   (Kassalapp's model): developer ecosystem + backlinks + data moat.
3. **Loyalty-adjusted basket comparison** — the explicitly *unsolved* problem in
   the UK. No competitor compares a full basket with member pricing factored in.
   Whoever cracks member-price-aware comparison owns a feature nobody has.
4. **Split-shop / cheapest-route basket optimizer** — "buy these at Willys,
   these at Lidl, save X." We already have `compareBasketStrategies` in core;
   surface it on `/weekly-basket`.
5. **Flyer / digital-catalog ingestion** — promo coverage pure scraping misses
   (Blix, Mattilbud, Tańszy Koszyk start from the weekly flyer).

## Commodity / unbranded products — fresh food (operator priority, 2026-05-22)

Meat, vegetables, fruit, bakery and bulk have NO EAN and are sold by weight, so the
barcode matching used for packaged goods does not apply. They are ~30–40% of the
basket and where shoppers feel price pain most — and rivals are weak here. We match
them via a **canonical commodity dimension** + **unit price** (kr/kg, kr/l, kr/st;
already on `observations`), with honest confidence (barcode = high, commodity/alias
match = medium, labelled). Schema landed in migration `010_commodity_taxonomy.sql`;
starter taxonomy in `packages/catalog/src/commodities.ts`. One feature = one PR; tag
`feat(commodity):`. Same hard rules (real data + confidence, reach a driver file).

1. **Ingestion: classify + map loose items.** When a connector sees a no-barcode /
   sold-by-weight item, set `product_kind='commodity'`, resolve `commodity_id` from
   the taxonomy (fuzzy name + category via the `aliases` table), capture `unit_price`,
   `variant`, `is_organic`, `origin_country`.
2. **Cross-chain commodity comparison** on `products/[slug]` + `/compare`: cheapest
   chain per commodity by **kr/kg** (not per-pack), cheapest highlighted, confidence
   shown.
3. **Per-chain fresh-food index** from the `is_staple` basket (`STAPLE_BASKET`) — a
   watchdog-style representative basket so a chain gets a trustworthy fresh-food score
   even when item-level matches are low-confidence. Surface on `/chain-index`.
4. **Unit-price normalisation everywhere** — show kr/kg | kr/l | kr/st consistently on
   product cards and tables so loose and packaged items compare on the same axis.
5. **Curator/community review of mappings** — wire the existing
   `human_review_assignments` + `community_reporter_trust` tables to validate
   commodity↔item mappings; low-confidence maps surface for review, not to shoppers.
6. **Receipt-fed mapping growth** — `packages/scanning` receipt items (chain label +
   kr + weight) feed new aliases → grow commodity coverage over time.

## Product-card display — adaptive unit/total price (operator decision 2026-05-22)

Default listing card. Chosen over price-only and unit-only: show **both** numbers, the
dominant one **adaptive to product kind**, plus a global compare toggle. NEVER hide the
actual price behind a click — Swedish shelf labels show selling price + jämförpris
together and shoppers expect both; they also budget in real kronor. The detail page is
for price history / per-chain table / Buy-Wait verdict, not for first revealing price.
Drives off `observations.unit_price` + `price` (both already in schema). Tag `feat(ui):`.

- **Commodity (`product_kind='commodity'`):** unit price (kr/kg | kr/l | kr/st) is the
  PRIMARY/big number; pack price + size + chain secondary.
  e.g. `59,80 kr/kg` over `~29,90 kr · 500 g · Willys`.
- **Branded:** pack price PRIMARY/big; kr/unit + size secondary.
  e.g. `24,90 kr` over `62,25 kr/kg · 400 g`.
- **Global "Compare by: Total ⇄ Per kg" toggle** (Skyscanner-style): flips the dominant
  number across every card AND sets the listing sort key. Persist the choice per user.
- **Cheapest-per-unit highlight badge** on the card (e.g. `🟢 -18%/kg vs chain avg`),
  derived from the real cross-chain `unit_price` spread; confidence-gated, never faked.
- **Consistent unit normalisation** across chains (kr/kg, kr/l, kr/st; per-100 g for
  small items) so loose and packaged items compare on the same axis.

## Market-entry sequencing (Nordic + beyond)

Ranked by *(white space × prize × ease)*, NOT by map adjacency. Detail +
per-rival feature gaps in [`COMPETITIVE-ANALYSIS.md`](COMPETITIVE-ANALYSIS.md).

1. **Sweden (home) — win first.** Beat Matpriskollen on terminal UX before
   spreading. A decisively better product in one market validates the wedge.
2. **Iceland — cheap proof-of-concept.** Genuine white space (only a 74-product
   state/union tool, no real consumer product). Tiny prize (~380k, 3 chains) but
   low cost to dominate and a clean case study against zero consumer rival.
3. **Norway — the real expansion prize.** ~5.5M switch-willing shoppers, and
   **Kassalapp's open API is a data shortcut** — build the terminal on richer
   data than we have at home.
4. **Denmark — only if the terminal decisively beats Prej** (strong incumbent:
   21+ chains, price history, alarms, barcode matching already shipped).
5. **Finland — last, NOT first.** Product gap is real but the S-/K-group
   duopoly *self-defends* with a first-party comparator built into the loyalty
   app shoppers open daily — a behavioural moat, the hardest kind to dislodge.

> Operator note (2026-05-22): the "Finland + Iceland first" instinct is half
> right. Iceland yes (white space); Finland is one of the *hardest* entries, not
> the easiest. Lead with Sweden→Iceland→Norway.

## Production-readiness gaps — atomic, must-fill (operator 2026-05-22)

Verified missing in the codebase. Atomic-perfection bar: every sub-item is its own
PR; no known gap ships. Tags as noted.

### `feat(consent):` consent + privacy (LEGAL P0 — gates compliant ad revenue)
- CMP (IAB TCF v2.2) cookie banner: accept / reject-all / manage, granular categories
  (necessary, analytics, ads, personalisation).
- Google **Consent Mode v2** wired to gtag (default denied → update on choice); AdSense
  serves non-personalised until consent.
- Consent log/audit (proof + timestamp); re-prompt on policy version change.
- Privacy policy + cookie policy pages (sv + en).
- GDPR data-subject rights: in-app **export my data**, **delete my account/data**, view
  stored data. Receipt data (sensitive): documented retention + deletion + encryption.

### `feat(seo):` search visibility (highest-ROI growth — currently 0)
- `app/sitemap.ts` (products, categories, stores, chains) + `app/robots.ts`.
- `generateMetadata` on every route (title, description, canonical, OG, twitter).
- JSON-LD: `Product` + `AggregateOffer` (cross-chain price range!), `BreadcrumbList`,
  `Organization`, `WebSite`+SearchAction.
- Programmatic landing pages: "billigaste <product>", "<product> pris jämförelse",
  per-city — the category's main organic channel.
- ISR/SSG for product/category/store pages (crawlable + fast); dynamic OG price images.
- `hreflang` (pairs with i18n).

### `feat(i18n):` localisation (blocks immigrant persona AND Nordic expansion)
- next-intl (App Router) + locale-routed middleware (`/sv`, `/en`, + immigrant langs).
- Extract all hardcoded strings → `messages/{locale}.json`.
- Locale-aware currency/number/date/unit formatting; multi-currency display
  (SEK/NOK/DKK/EUR/ISK) off `observations.currency`.
- Language switcher + persisted pref + Accept-Language detection; RTL support (Arabic/
  Somali common in SE). Translations native-quality only — never fabricate; mark MT.

### `decision:` mobile — PWA-first vs native Expo (apps/mobile is logic-only stub)
- **Operator-recommended: PWA-first** — installable, web-push, getUserMedia barcode,
  reuses the web codebase; revisit native after traction. Decide before building.

## Storage & performance optimization — the price tape at scale (operator 2026-05-22)

Per-branch × EAN × daily = millions of rows/day. Self-hosted Postgres (docker), so
TimescaleDB is available. SCHEMA.md already designs `observations_v2 partition by
range (observed_at)` but it is NOT built. Tag `perf(db):` / `perf(web):`.

### `perf(db):` storage
- **Change-only writes (biggest win):** insert an observation only when price differs
  from the last for (product, chain, store, price_type); keep `valid_from` (temporal /
  SCD-2). Grocery prices change ~weekly → 5–10× fewer rows than daily snapshots.
- **Range partition `observations` by `observed_at`** (monthly), auto-created
  (pg_partman or declarative); enables cheap retention via partition drop.
- **BRIN index on `observed_at`** (append-only time-series) + prune redundant btrees.
- **Rollup tables / continuous aggregates** `price_daily` & `price_weekly`
  (min/max/avg/last per product×chain) — charts + 52-week-low read these, never raw.
- **Retention tiering:** raw obs hot ~13 months → downsample to daily → archive
  (parquet/gzip to object storage) or drop; `raw_records` short TTL or object storage.
- **Evaluate TimescaleDB** hypertables + native columnar compression (~10×) + retention
  policies; fallback = pg_partman + scheduled matviews. (Recommended: adopt Timescale.)
- Optional: store price as integer öre (smaller than `numeric`); format in UI.

### `perf(web):` frontend + API
- `next/image` everywhere (currently 0) — responsive, CDN, AVIF/WebP.
- Expand ISR/SSG to all product/category/store pages; lazy-load `lightweight-charts`.
- Bundle analysis + code-split; Core Web Vitals budget + Lighthouse CI gate.
- API: Redis cache for hot endpoints (chain index, deals), cursor pagination,
  pgbouncer pooling for serverless; analytics over long ranges hit rollups only.

## Historic price & per-branch analytics — deepen (operator 2026-05-22)

We have per-branch prices over time — lean into HISTORY and geography, not prediction.
Operator directive: **drop price forecasting** (nobody can predict price); express
"is now a good time?" purely from a product's own history. Reads off the price rollups
(see `perf(db)` above). Tags `feat(history):` / `feat(geo):`.

### `feat(history):` historic price (the honest replacement for forecast)
- Per-product price chart, multi-timeframe (1W/1M/3M/1Y/ALL) with crosshair readout.
- "Lowest / highest in 30 / 90 / 365 days" badges; 52-week-low flag.
- **"vs usual" signal** — current price as a percentile of its own 1-year history
  ("15% below its typical 28 kr"). This is the honest Buy/Wait — a fact, not a guess.
- Typical range / volatility band ("usually 25–32 kr"); price-change event log
  ("dropped 12% on 2026-05-10"); cross-chain history overlay.
- Seasonal-by-month view (avg price per month across years) — feeds `feat(calendar)`.

### `feat(geo):` per-branch visualisation & statistics (we have per-branch prices — unique edge)
- **Price heatmap on the map** — colour each branch by its price for the viewed
  product / basket / chain index; cheapest vs dearest areas at a glance.
- **Intra-chain branch spread** — distribution of a product's price across a chain's
  branches (box/violin); cheapest & dearest branch; "up to X% difference between
  branches" stat.
- Regional / district / city price statistics (consumer-org-survey-style numbers).
- "Cheapest branch near me" highlight; basket-cost heatmap by area.
- **Store price-percentile rank** (operator-requested 2026-05-22) — for the user's
  nearest store / favourite store, show where it sits on price vs cohorts: *"Willys
  Odenplan is in the 18th percentile (cheaper than 82%) of stores in your kommun, and
  the 25th percentile nationally."* Computed per product / basket / overall index over
  the per-branch `observations`; cohorts = kommun (municipality) and national. A factual
  percentile (no prediction), with coverage/confidence shown. Needs a `kommun` field on
  stores (derive from coords/postcode if absent). Surfaces on the store page + a
  "your store vs everyone" badge.
- Every figure traces to real per-branch data + a confidence/coverage indicator.

## Additional feature backlog — not yet planned (operator 2026-05-22)

One feature = one PR; real data + confidence; reach a driver file. Personas/engine
back most of these.

- `feat(meal-cost):` ingredient-level dish/meal costing — build a dish from
  ingredients (each mapped to a product/commodity), show **exact cost per meal + per
  serving** + the cheapest chain to cook it, with a per-ingredient cost breakdown.
  (Operator-requested 2026-05-22; behaviour as described, not a named third-party method.)
- `feat(delivery):` online-delivery (Mathem/Coop-online) vs in-store total incl. fees.
- `feat(dupe):` private-label "dupe finder" — "ICA Basic = this brand, −38%".
- `feat(crowd):` crowd price submissions (photo + price) via `community_reporter_trust`
  — the scalable path to loose meat/veg coverage.
- `feat(loyalty):` member-offer aggregation + points (uses `price_type='member'`).
- `feat(widget):` embeddable Grocery Index ticker for blogs/news (PR + backlinks).
- `feat(digest):` weekly personalised email digest (watchlist + best deals).
- `feat(calendar):` seasonal "best time to buy" produce calendar — from **historical**
  monthly averages, not forecast (content + SEO + eco).
- `feat(eco):` carbon/eco score per basket ("cheaper + greener").

## Multi-vertical expansion — local price-intelligence engine (operator 2026-05-22)

The core model (`observations` = item × location × price × time, cross-vendor matching,
indices, history, per-branch geo/heatmap, map) is **vertical-agnostic**. Groceries is
vertical #1. **Discipline: win Swedish groceries first**, then fuel (#2), then pharmacy
(#3). Each vertical has incumbents — the edge is the same terminal UX + per-location geo
+ history, not being first. Umbrella positioning is a "local price terminal"; the
`GroceryView` name does not stretch to fuel/pharmacy (branding decision deferred).

### `feat(domain):` multi-vertical foundation — add NOW (cheap, future-proofs the engine)
- Add `domain` (`grocery | fuel | pharmacy | …`) to chains/operators, products/items,
  and observations; default existing rows to `grocery`. Vertical-scoped routes
  (`/fuel`, `/pharmacy`) reuse the terminal/map/history/chart components.
- Matching stays per-domain: grocery = EAN + commodity; fuel = grade; pharmacy = EAN.

### `feat(fuel):` vertical #2 — fuel (best engine fit; map + history showcase)
- **Items** = grades: 95 (E10/E5), 98, Diesel, HVO100, E85, AdBlue (~6, tiny catalog).
- **Locations** = stations w/ coordinates: Circle K, OKQ8, Preem, St1, Ingo, Tanka,
  Qstar, Shell + unmanned. Station locations via OSM `amenity=fuel` (reuse the Overpass
  connector) — `unit_price` n/a; price is per litre by grade.
- **Data sources** (RE per-operator like grocery): operator sites/apps; fuel prices are
  less openly published than groceries → **crowd submissions** (reuse
  `community_reporter_trust`) are first-class, same lesson as loose produce.
- **Features (reuse engine):** cheapest station near me (map + price heatmap = the hero),
  per-grade price per station, history charts + "vs usual", operator/region price index,
  "notify when 95 < X near me" alerts.

### `feat(pharmacy):` vertical #3 — pharmacy OTC (reuses EAN matching; Apohem already queued)
- **Scope OTC + supplements + health & beauty only.** Prescription drugs are
  price-regulated (högkostnadsskydd) → no comparison value. Price-compare only; no
  medical advice; mind health-claim regulation.
- **Items** = OTC products (have EAN → reuse the branded matching path).
- **Locations/operators** = Apotek Hjärtat, Kronans Apotek, Apoteket, Apotea, Apohem
  (Apohem already in `docs/ingestion-targets.md`); online + physical.
- **Data sources:** online pharmacy catalogs (scrapeable like grocery online stores),
  EAN match cross-pharmacy.
- **Features:** cheapest pharmacy per product, online vs in-store, history, alerts.

### Future verticals (vision — after the above; not active backlog)
- **Hardware / bygg** (Bauhaus, Byggmax) — big-ticket, low competition; maybe.
- **Beauty / pet / baby** (Lyko etc.) — EAN-matched, adjacent; maybe.
- **Electricity (elpris)** — huge consumer interest but a *different* model (public hourly
  spot + provider contracts, not stations); evaluate as a separate index product.
- **Skip:** alcohol (Systembolaget monopoly = one national price in SE); electronics
  (Prisjakt/PriceRunner own it — saturated).

## Updated by operator only

The CEO MUST NOT edit this file. Only the operator (user or main Claude Code
session) updates `GOAL.md`. CEO requests new goals via
`[CEO->OPERATOR NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
